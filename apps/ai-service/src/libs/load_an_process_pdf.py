import hashlib
import io
import json
import logging
from pathlib import Path
from typing import List
import requests
import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

def create_cache_key(path: str) -> str:
    return hashlib.md5(path.encode("utf-8")).hexdigest()

def read_pdf_from_local(file_path: str) -> str:
    with fitz.open(file_path) as doc:
        return "\n".join(page.get_text() for page in doc)

def read_pdf_from_url(url: str) -> str:
    response = requests.get(url, timeout=30)
    if response.status_code == 200:
        with fitz.open(stream=io.BytesIO(response.content), filetype="pdf") as doc:
            return "\n".join(page.get_text() for page in doc)
    else:
        logger.error("Failed to fetch PDF from %s, status code: %d", url, response.status_code)
        return ""

def read_pdf(file_path: str) -> str:
    if file_path.startswith("http://") or file_path.startswith("https://"):
        return read_pdf_from_url(file_path)
    return read_pdf_from_local(file_path)

def load_and_process_pdf(
    file_path: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    cache_dir: Path = Path(".cache/pdf"),
    refresh: bool = False,
) -> List[Document]:
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_key = create_cache_key(file_path)
    cache_path = cache_dir / f"{cache_key}.json"

    if not refresh and cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                logger.info("Loaded PDF from JSON cache: %s", file_path)
                return [Document(page_content=d["page_content"], metadata=d["metadata"]) for d in data]
        except Exception as e:
            logger.warning("PDF Cache load failed: %s. Reloading.", e)

    try:
        logger.info("Reading PDF: %s", file_path)
        full_text = read_pdf(file_path)
        if not full_text.strip():
            logger.warning("Empty text extracted from PDF: %s", file_path)
            return []

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        chunks = text_splitter.split_text(full_text)

        documents = [Document(page_content=chunk, metadata={"source_file": file_path}) for chunk in chunks]

        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump([{"page_content": d.page_content, "metadata": d.metadata} for d in documents], f)
            logger.info("Cached %d PDF chunks successfully.", len(documents))
        except Exception as e:
            logger.error("Failed to cache PDF JSON: %s", e)

        return documents
    except Exception as e:
        logger.error("Error processing PDF %s: %s", file_path, e)
        return []
