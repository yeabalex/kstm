import logging
import os
import re
import time
from typing import Callable, List, TypeVar
from langchain_core.embeddings import Embeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from config.local_embeddings import LocalMultilingualEmbeddings
try:
    from langchain_neo4j import Neo4jVector
except (ImportError, TypeError):
    from langchain_community.vectorstores import Neo4jVector

logger = logging.getLogger(__name__)

_USE_FALLBACK_MODEL = False
T = TypeVar("T")


def _extract_retry_seconds(err_msg: str) -> float:
    """Parses Google Gemini 429 retry delay from the error message, defaulting to 25s."""
    match = re.search(r"retry in (\d+(?:\.\d+)?)s", err_msg, re.IGNORECASE)
    if match:
        return min(62.0, max(5.0, float(match.group(1)) + 1.5))
    sec_match = re.search(r"seconds:\s*(\d+)", err_msg, re.IGNORECASE)
    if sec_match:
        return min(62.0, max(5.0, float(sec_match.group(1)) + 1.5))
    return 25.0


def _call_with_429_retry(fn: Callable[[], T], max_retries: int = 3) -> T:
    """Executes an embedding call and automatically waits/retries on 429 Free Tier rate limits."""
    for attempt in range(max_retries + 1):
        try:
            return fn()
        except Exception as exc:
            msg = str(exc)
            is_rate_limit = (
                "429" in msg
                or "Quota exceeded" in msg
                or "RESOURCE_EXHAUSTED" in msg
            )
            if not is_rate_limit or attempt >= max_retries:
                raise
            wait_sec = _extract_retry_seconds(msg)
            logger.warning(
                "Gemini embedding rate limit (429) hit on attempt %d/%d; waiting %.1fs before retry...",
                attempt + 1,
                max_retries,
                wait_sec,
            )
            time.sleep(wait_sec)
    raise RuntimeError("Exhausted embedding retries")


class ResilientGeminiEmbeddings(Embeddings):
    """Wraps GoogleGenerativeAIEmbeddings (gemini-embedding-001 at 768d) with REST transport and 429 retry backoff."""

    def __init__(self) -> None:
        self._client = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            transport="rest",
        )

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        results: List[List[float]] = []
        slice_size = 10
        for i in range(0, len(texts), slice_size):
            sub_batch = texts[i : i + slice_size]
            batch_vectors = _call_with_429_retry(
                lambda b=sub_batch: self._client.embed_documents(
                    b, output_dimensionality=768
                )
            )
            results.extend(batch_vectors)
        return results

    def embed_query(self, text: str) -> List[float]:
        return _call_with_429_retry(
            lambda: self._client.embed_query(text, output_dimensionality=768)
        )


def get_embedding_model() -> Embeddings:
    provider = os.getenv("EMBEDDING_PROVIDER", "local").strip().lower()
    if provider == "gemini":
        return ResilientGeminiEmbeddings()
    return LocalMultilingualEmbeddings()

def _resolve_neo4j_uri() -> str:
    uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    if not os.path.exists("/.dockerenv") and "://neo4j:" in uri:
        uri = uri.replace("://neo4j:", "://localhost:")
    return uri

def create_vectordb(documents, url, batch_size: int = 150):
    """Enrich document metadata and index into Neo4j vector store in bounded batches."""
    for doc in documents:
        doc.metadata["source_url"] = url

    embedding = get_embedding_model()
    neo4j_user = os.getenv("NEO4J_USER", "neo4j")
    neo4j_password = os.getenv("NEO4J_PASSWORD", "password123")
    neo4j_url = _resolve_neo4j_uri()

    db = None
    total = len(documents)
    for start in range(0, total, batch_size):
        batch = documents[start : start + batch_size]
        db = Neo4jVector.from_documents(
            documents=batch,
            embedding=embedding,
            username=neo4j_user,
            password=neo4j_password,
            url=neo4j_url,
            index_name="ecom_index",
            node_label="ECOM",
        )
    return db

def load_vectordb():
    """Connect to existing Neo4j vector index."""
    embedding = get_embedding_model()
    return Neo4jVector.from_existing_index(
        embedding=embedding,
        username=os.getenv("NEO4J_USER", "neo4j"),
        password=os.getenv("NEO4J_PASSWORD", "password123"),
        url=_resolve_neo4j_uri(),
        index_name="ecom_index",
        node_label="ECOM",
    )
