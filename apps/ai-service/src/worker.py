import asyncio
import logging
import os
import signal
import time
from typing import Any, Callable, Dict, List, Optional, Tuple
from urllib.parse import urlparse

from bullmq import Worker, Job
from dotenv import load_dotenv
import redis

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
load_dotenv()
_env_vars = {
    "GOOGLE_API_KEY": os.getenv("GOOGLE_API_KEY"),
    "LANGSMITH_TRACING": os.getenv("LANGSMITH_TRACING", "false"),
    "LANGCHAIN_API_KEY": os.getenv("LANGCHAIN_API_KEY"),
}
os.environ.update({k: v for k, v in _env_vars.items() if v is not None})

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
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


async def _update_redis_metadata(
    job_id: Any,
    user_id: str,
    bot_id: str,
    kb_id: str,
    now_ts: float,
    prompt_template: Optional[str],
) -> None:
    """Updates Redis metadata asynchronously in a worker thread."""
    if not redis_client:
        return

    def _sync_update() -> None:
        pipe = redis_client.pipeline()
        pipe.set(f"last_refresh:{user_id}:{bot_id}:{kb_id}", str(now_ts))
        if prompt_template:
            pipe.set(f"prompt_template:{user_id}:{bot_id}", prompt_template)
        pipe.execute()

    try:
        await asyncio.to_thread(_sync_update)
    except Exception as e:
        logger.warning("[Job %s] Failed to update Redis metadata: %s", job_id, e)


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

    documents: List[Any] = []
    failed_sources: List[Dict[str, str]] = []
    processed_sources = 0

    # Process each source in a separate thread with partial failure resilience
    for idx, (source_type, source_path, loader_func) in enumerate(tasks, start=1):
        logger.info(
            "[Job %s] Processing %s source (%d/%d): %s",
            job.id,
            source_type,
            idx,
            total_sources,
            source_path,
        )
        try:
            docs = await asyncio.to_thread(loader_func, source_path, True)
            if docs:
                documents.extend(docs)
                processed_sources += 1
                logger.info(
                    "[Job %s] Extracted %d chunks from %s (%s)",
                    job.id,
                    len(docs),
                    source_path,
                    source_type,
                )
            else:
                logger.warning(
                    "[Job %s] No content extracted from %s (%s)",
                    job.id,
                    source_path,
                    source_type,
                )
                failed_sources.append(
                    {
                        "source": source_path,
                        "type": source_type,
                        "error": "No extractable content found or loader returned empty.",
                    }
                )
        except Exception as exc:
            logger.error(
                "[Job %s] Error extracting %s source '%s': %s",
                job.id,
                source_type,
                source_path,
                exc,
                exc_info=True,
            )
            failed_sources.append(
                {
                    "source": source_path,
                    "type": source_type,
                    "error": str(exc),
                }
            )

        # Scale extraction progress between 5% and 75%
        progress = 5 + int((idx / total_sources) * 70)
        await job.updateProgress(progress)

    if not documents:
        error_summary = "; ".join(
            f"{f['type']} ({f['source']}): {f['error']}" for f in failed_sources[:5]
        )
        raise RuntimeError(
            f"All {total_sources} document source(s) failed or yielded no content. "
            f"Details: {error_summary}"
        )

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

    # Index chunks into Neo4j vector database with explicit error logging
    try:
        await asyncio.to_thread(create_vectordb, documents, kb_id)
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

    # Update Redis metadata using non-blocking thread execution and pipelining
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


async def main() -> None:
    """Initializes the BullMQ worker and manages graceful shutdown."""
    redis_opts = _parse_redis_connection(REDIS_URL)
    logger.info(
        "Starting BullMQ worker on queue '%s' (host=%s, port=%s, concurrency=%d)",
        QUEUE_NAME,
        redis_opts.get("host"),
        redis_opts.get("port"),
        WORKER_CONCURRENCY,
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

    def _signal_handler(sig: signal.Signals) -> None:
        logger.info("Received signal %s. Initiating graceful shutdown...", sig.name)
        shutdown_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _signal_handler, sig)
        except NotImplementedError:
            signal.signal(sig, lambda s, f: shutdown_event.set())

    try:
        await shutdown_event.wait()
    finally:
        logger.info("Closing BullMQ worker and waiting for active jobs to finish...")
        try:
            await worker.close()
        except Exception as e:
            logger.error("Error while closing BullMQ worker: %s", e)

        if redis_client:
            try:
                redis_client.close()
            except Exception as e:
                logger.warning("Error closing Redis client: %s", e)
        logger.info("Worker shutdown complete.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Worker process interrupted by user.")
