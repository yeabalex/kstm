import asyncio
from concurrent.futures import ThreadPoolExecutor
import inspect
import ipaddress
import logging
import os
from pathlib import Path
import signal
import sys
import time
from typing import Any, Callable, Dict, List, Optional, Tuple
from urllib.parse import urlparse

from bullmq import Worker, Job
from dotenv import load_dotenv
import redis
import redis.asyncio as aioredis

from libs.load_and_process_documents import load_and_process_documents
from libs.load_an_process_pdf import load_and_process_pdf
from libs.load_and_process_csv import load_and_process_csv
from libs.load_and_process_txt import load_and_process_txt
from libs.load_and_process_json import load_and_process_json
from config.db import create_vectordb

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ai_worker")

# Load environment variables
load_dotenv(override=True)
_env_vars = {
    "GOOGLE_API_KEY": os.getenv("GOOGLE_API_KEY"),
    "LANGSMITH_TRACING": os.getenv("LANGSMITH_TRACING", "false"),
    "LANGCHAIN_API_KEY": os.getenv("LANGCHAIN_API_KEY"),
}
os.environ.update({k: v for k, v in _env_vars.items() if v is not None})

_raw_redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
if not os.path.exists("/.dockerenv") and "://redis:" in _raw_redis_url:
    _raw_redis_url = _raw_redis_url.replace("://redis:", "://localhost:")
REDIS_URL = _raw_redis_url
QUEUE_NAME = os.getenv("BULLMQ_QUEUE_NAME", "kb-ingestion")
WORKER_CONCURRENCY = int(os.getenv("WORKER_CONCURRENCY", "2"))

# Initialize synchronous Redis client for metadata storage with resilience options
redis_client: Optional[redis.Redis] = None
try:
    redis_client = redis.from_url(
        REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5,
        retry_on_timeout=True,
        health_check_interval=30,
    )
    redis_client.ping()
    logger.info("Connected to Redis successfully for metadata storage.")
except Exception as e:
    redis_client = None
    logger.warning("Redis metadata client is unavailable at startup: %s", e)


def _parse_redis_connection(url: str) -> Dict[str, Any]:
    """Parses REDIS_URL into a connection dictionary compatible with BullMQ."""
    parsed = urlparse(url)
    conn: Dict[str, Any] = {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 6379,
    }
    if parsed.password:
        conn["password"] = parsed.password
    if parsed.username:
        conn["username"] = parsed.username
    if parsed.path and len(parsed.path) > 1:
        try:
            conn["db"] = int(parsed.path.lstrip("/"))
        except ValueError:
            pass
    if parsed.scheme == "rediss":
        conn["ssl"] = True
    return conn


def _normalize_list(val: Any) -> List[str]:
    """Safely normalizes job payload fields into a list of non-empty strings."""
    if not val:
        return []
    if isinstance(val, str):
        return [val.strip()] if val.strip() else []
    if isinstance(val, list):
        return [str(item).strip() for item in val if item and str(item).strip()]
    return []


def _validate_source_security(source_type: str, source_path: str) -> None:
    """Blocks SSRF (loopback/private/metadata IPs) and local file inclusion (LFI) attacks."""
    parsed = urlparse(source_path)

    if source_type == "WEB_URL" or parsed.scheme in ("http", "https", "file", "ftp"):
        if parsed.scheme not in ("http", "https"):
            raise ValueError(f"Disallowed URL scheme '{parsed.scheme}' for source: {source_path}")
        hostname = (parsed.hostname or "").strip().lower()
        if not hostname or hostname in ("localhost", "0.0.0.0", "::1"):
            raise ValueError(f"Disallowed local/loopback hostname in URL: {source_path}")
        try:
            ip_obj = ipaddress.ip_address(hostname)
            if (
                ip_obj.is_private
                or ip_obj.is_loopback
                or ip_obj.is_link_local
                or ip_obj.is_reserved
                or ip_obj.is_multicast
            ):
                raise ValueError(f"Disallowed private/internal IP address in URL: {source_path}")
        except ValueError as exc:
            if "Disallowed" in str(exc):
                raise
        return

    # Local path validation (used for temp files): block traversal, dotfiles, and sensitive system dirs
    normalized = os.path.normpath(source_path)
    if ".." in normalized.split(os.sep):
        raise ValueError(f"Path traversal ('..') is not allowed: {source_path}")

    basename = os.path.basename(normalized)
    if basename.startswith("."):
        raise ValueError(f"Access to hidden/dot files is not allowed: {source_path}")

    forbidden_prefixes = ("/etc", "/proc", "/sys", "/root", "/var/run", "/boot", "/dev")
    if normalized.startswith(forbidden_prefixes):
        raise ValueError(f"Access to protected system directory is not allowed: {source_path}")


async def _update_redis_metadata(
    job_id: Any,
    user_id: str,
    bot_id: str,
    kb_id: str,
    now_ts: float,
    prompt_template: Optional[str],
) -> None:
    """Updates Redis metadata using native async pipelining (with thread fallback for sync clients)."""
    if not redis_client:
        return

    try:
        pipe = redis_client.pipeline()
        pipe.set(f"last_refresh:{user_id}:{bot_id}:{kb_id}", str(now_ts))
        if prompt_template:
            pipe.set(f"prompt_template:{user_id}:{bot_id}", prompt_template)

        if inspect.iscoroutinefunction(getattr(pipe, "execute", None)):
            await pipe.execute()
        else:
            await asyncio.to_thread(pipe.execute)
    except Exception as e:
        logger.warning("[Job %s] Failed to update Redis metadata: %s", job_id, e)


def _consolidate_chunks_for_quota(
    documents: List[Any],
    max_chunks: int = 85,
    max_chars: int = 7500,
) -> List[Any]:
    """Merges adjacent chunks from the same source if total chunks exceed the Gemini Free Tier 100 RPM window."""
    if len(documents) <= max_chunks:
        return documents

    consolidated = list(documents)
    while len(consolidated) > max_chunks:
        merged_any = False
        next_pass: List[Any] = []
        i = 0
        while i < len(consolidated):
            if i + 1 < len(consolidated):
                cur = consolidated[i]
                nxt = consolidated[i + 1]
                cur_text = getattr(cur, "page_content", "") or ""
                nxt_text = getattr(nxt, "page_content", "") or ""
                cur_meta = getattr(cur, "metadata", {}) or {}
                nxt_meta = getattr(nxt, "metadata", {}) or {}
                if (
                    cur_meta == nxt_meta
                    and (len(cur_text) + len(nxt_text) + 2) <= max_chars
                    and len(consolidated) - len(next_pass) + (len(consolidated) - i - 1) > max_chunks
                ):
                    cur.page_content = f"{cur_text}\n\n{nxt_text}"
                    next_pass.append(cur)
                    merged_any = True
                    i += 2
                    continue
            next_pass.append(consolidated[i])
            i += 1
        consolidated = next_pass
        if not merged_any:
            break
    return consolidated


def _extract_single_source_sync(
    idx: int,
    total_sources: int,
    job_id: Any,
    source_type: str,
    source_path: str,
    loader_func: Callable[..., Any],
) -> Tuple[int, str, str, Optional[List[Any]], Optional[str]]:
    """Runs synchronous security validation and document extraction inside a worker thread."""
    logger.info(
        "[Job %s] Processing %s source (%d/%d) in worker thread: %s",
        job_id,
        source_type,
        idx,
        total_sources,
        source_path,
    )
    try:
        _validate_source_security(source_type, source_path)
        docs = loader_func(source_path, True)
        if docs:
            logger.info(
                "[Job %s] Extracted %d chunks from %s (%s)",
                job_id,
                len(docs),
                source_path,
                source_type,
            )
            return (idx, source_type, source_path, docs, None)

        logger.warning(
            "[Job %s] No content extracted from %s (%s)",
            job_id,
            source_path,
            source_type,
        )
        return (
            idx,
            source_type,
            source_path,
            None,
            "No extractable content found or loader returned empty.",
        )
    except Exception as exc:
        logger.error(
            "[Job %s] Error extracting %s source '%s': %s",
            job_id,
            source_type,
            source_path,
            exc,
            exc_info=True,
        )
        return (idx, source_type, source_path, None, str(exc))


async def process_job(job: Job, job_token: str) -> Dict[str, Any]:
    """Processes knowledge base ingestion jobs from the BullMQ 'kb-ingestion' queue."""
    start_time = time.monotonic()
    data: Dict[str, Any] = job.data or {}

    user_id: Optional[str] = data.get("user_id")
    bot_id: Optional[str] = data.get("bot_id")
    kb_id: Optional[str] = data.get("kb_id")

    if not all([user_id, bot_id, kb_id]):
        raise ValueError(
            "Missing required identifiers: 'user_id', 'bot_id', and 'kb_id' must be provided."
        )

    web_urls = _normalize_list(data.get("web_url"))
    pdf_files = _normalize_list(data.get("pdf"))
    csv_files = _normalize_list(data.get("csv"))
    txt_files = _normalize_list(data.get("txt"))
    json_files = _normalize_list(data.get("json") or data.get("json_files"))
    prompt_template: Optional[str] = data.get("prompt_template")

    logger.info(
        "[Job %s] Starting ingestion: bot_id=%s, kb_id=%s, user_id=%s",
        job.id,
        bot_id,
        kb_id,
        user_id,
    )
    await job.updateProgress(5)

    tasks: List[Tuple[str, str, Callable[..., Any]]] = []
    for url in web_urls:
        tasks.append(("WEB_URL", url, load_and_process_documents))
    for path in pdf_files:
        tasks.append(("PDF", path, load_and_process_pdf))
    for path in csv_files:
        tasks.append(("CSV", path, load_and_process_csv))
    for path in txt_files:
        tasks.append(("TXT", path, load_and_process_txt))
    for path in json_files:
        tasks.append(("JSON", path, load_and_process_json))

    total_sources = len(tasks)
    if total_sources == 0:
        raise ValueError(
            "No valid document sources (web_url, pdf, csv, txt, json) provided in job data."
        )

    # Dispatch all document sources concurrently across the thread pool
    extraction_futures = [
        asyncio.create_task(
            asyncio.to_thread(
                _extract_single_source_sync,
                idx,
                total_sources,
                job.id,
                source_type,
                source_path,
                loader_func,
            )
        )
        for idx, (source_type, source_path, loader_func) in enumerate(tasks, start=1)
    ]

    completed_results: List[Tuple[int, str, str, Optional[List[Any]], Optional[str]]] = []
    for completed_idx, fut in enumerate(asyncio.as_completed(extraction_futures), start=1):
        res = await fut
        completed_results.append(res)
        # Scale extraction progress between 5% and 75% as each thread completes
        progress = 5 + int((completed_idx / total_sources) * 70)
        await job.updateProgress(progress)

    # Reassemble results in deterministic source order
    completed_results.sort(key=lambda item: item[0])

    documents: List[Any] = []
    failed_sources: List[Dict[str, str]] = []
    processed_sources = 0

    for _, source_type, source_path, docs, err_msg in completed_results:
        if docs:
            documents.extend(docs)
            processed_sources += 1
        else:
            failed_sources.append(
                {
                    "source": source_path,
                    "type": source_type,
                    "error": err_msg or "Unknown extraction error",
                }
            )

    if not documents:
        error_summary = "; ".join(
            f"{f['type']} ({f['source']}): {f['error']}" for f in failed_sources[:5]
        )
        raise RuntimeError(
            f"All {total_sources} document source(s) failed or yielded no content. "
            f"Details: {error_summary}"
        )

    documents = _consolidate_chunks_for_quota(documents)
    chunk_count = len(documents)
    logger.info(
        "[Job %s] Indexing %d chunks from %d/%d sources into Neo4j vector database for kb_id=%s",
        job.id,
        chunk_count,
        processed_sources,
        total_sources,
        kb_id,
    )
    await job.updateProgress(80)

    # Index chunks into Neo4j vector database in bounded batches off the event loop
    batch_size = 150
    try:
        if chunk_count <= batch_size:
            await asyncio.to_thread(create_vectordb, documents, kb_id)
        else:
            total_batches = (chunk_count + batch_size - 1) // batch_size
            for batch_idx, start_idx in enumerate(range(0, chunk_count, batch_size), start=1):
                batch_docs = documents[start_idx : start_idx + batch_size]
                await asyncio.to_thread(create_vectordb, batch_docs, kb_id)
                batch_progress = 80 + int((batch_idx / total_batches) * 14)
                await job.updateProgress(batch_progress)
    except Exception as exc:
        logger.error(
            "[Job %s] Failed to index documents into Neo4j for kb_id=%s: %s",
            job.id,
            kb_id,
            exc,
            exc_info=True,
        )
        raise RuntimeError(f"Vector database indexing failed for kb_id={kb_id}: {exc}") from exc

    await job.updateProgress(95)

    # Update Redis metadata asynchronously
    now_ts = time.time()
    await _update_redis_metadata(
        job_id=job.id,
        user_id=user_id,
        bot_id=bot_id,
        kb_id=kb_id,
        now_ts=now_ts,
        prompt_template=prompt_template,
    )

    await job.updateProgress(100)
    duration_sec = round(time.monotonic() - start_time, 2)
    status = "partial_success" if failed_sources else "success"

    logger.info(
        "[Job %s] Completed with status='%s' in %.2fs: indexed %d chunks (%d/%d sources succeeded, %d failed) for bot_id=%s, kb_id=%s",
        job.id,
        status,
        duration_sec,
        chunk_count,
        processed_sources,
        total_sources,
        len(failed_sources),
        bot_id,
        kb_id,
    )

    return {
        "status": status,
        "bot_id": bot_id,
        "kb_id": kb_id,
        "chunk_count": chunk_count,
        "total_sources": total_sources,
        "processed_sources": processed_sources,
        "failed_sources_count": len(failed_sources),
        "failed_sources": failed_sources,
        "last_refresh": now_ts,
        "duration_seconds": duration_sec,
    }


def _snapshot_source_mtimes(src_root: Path) -> Dict[Path, float]:
    """Captures modification timestamps for all Python source files under src/."""
    mtimes: Dict[Path, float] = {}
    for py_file in src_root.rglob("*.py"):
        try:
            mtimes[py_file] = py_file.stat().st_mtime
        except OSError:
            pass
    return mtimes


async def _watch_for_code_changes(
    src_root: Path,
    shutdown_event: asyncio.Event,
    reload_state: Dict[str, bool],
) -> None:
    """Watches src/**/*.py for changes in dev mode and triggers a graceful hot-restart."""
    baseline = _snapshot_source_mtimes(src_root)
    while not shutdown_event.is_set():
        await asyncio.sleep(2.0)
        current = _snapshot_source_mtimes(src_root)
        if current != baseline:
            logger.info("Detected Python source change under %s. Restarting worker...", src_root)
            reload_state["restart"] = True
            shutdown_event.set()
            return


async def main() -> None:
    """Initializes the bounded thread pool, async Redis client, and BullMQ worker."""
    global redis_client
    loop = asyncio.get_running_loop()
    max_threads = max(4, WORKER_CONCURRENCY * 3)
    executor = ThreadPoolExecutor(
        max_workers=max_threads,
        thread_name_prefix="kstm_ingest",
    )
    loop.set_default_executor(executor)

    try:
        async_redis = aioredis.from_url(
            REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            health_check_interval=30,
        )
        await async_redis.ping()
        redis_client = async_redis  # type: ignore[assignment]
        logger.info("Initialized async Redis client on event loop.")
    except Exception as e:
        logger.warning("Async Redis client initialization warning: %s", e)

    redis_opts = _parse_redis_connection(REDIS_URL)
    logger.info(
        "Starting BullMQ worker on queue '%s' (host=%s, port=%s, concurrency=%d, thread_pool=%d)",
        QUEUE_NAME,
        redis_opts.get("host"),
        redis_opts.get("port"),
        WORKER_CONCURRENCY,
        max_threads,
    )

    worker = Worker(
        QUEUE_NAME,
        process_job,
        {
            "connection": redis_opts,
            "concurrency": WORKER_CONCURRENCY,
        },
    )

    shutdown_event = asyncio.Event()
    reload_state = {"restart": False}
    src_root = Path(__file__).resolve().parent
    watcher_task = asyncio.create_task(
        _watch_for_code_changes(src_root, shutdown_event, reload_state)
    )

    def _signal_handler(sig: signal.Signals) -> None:
        logger.info("Received signal %s. Initiating graceful shutdown...", sig.name)
        shutdown_event.set()

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _signal_handler, sig)
        except NotImplementedError:
            signal.signal(sig, lambda s, f: shutdown_event.set())

    try:
        await shutdown_event.wait()
    finally:
        watcher_task.cancel()
        logger.info("Closing BullMQ worker and waiting for active jobs to finish...")
        try:
            await worker.close()
        except Exception as e:
            logger.error("Error while closing BullMQ worker: %s", e)

        if redis_client:
            try:
                close_fn = getattr(redis_client, "aclose", None) or getattr(redis_client, "close", None)
                if close_fn:
                    res = close_fn()
                    if inspect.isawaitable(res):
                        await res
            except Exception as e:
                logger.warning("Error closing Redis client: %s", e)

        executor.shutdown(wait=True, cancel_futures=False)
        logger.info("Worker and thread pool shutdown complete.")

        if reload_state["restart"]:
            os.execv(sys.executable, [sys.executable] + sys.argv)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Worker process interrupted by user.")
