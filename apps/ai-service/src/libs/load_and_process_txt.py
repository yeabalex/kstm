import hashlib
import json
import logging
from pathlib import Path
from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

def create_cache_key(path: str) -> str:
    return hashlib.md5(path.encode("utf-8")).hexdigest()

def read_txt_file(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

def load_and_process_txt(
    file_path: str,
    chunk_size: int = 4000,
    chunk_overlap: int = 300,
    cache_dir: Path = Path(".cache/txt"),
    refresh: bool = False,
) -> List[Document]:
    if isinstance(chunk_size, bool):
        refresh = chunk_size
        chunk_size = 4000
    path_obj = Path(file_path)
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_key = create_cache_key(str(path_obj))
    cache_path = cache_dir / f"{cache_key}.json"

    if not refresh and cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data:
                    logger.info("Loaded TXT from JSON cache: %s", file_path)
                    return [Document(page_content=d["page_content"], metadata=d["metadata"]) for d in data]
        except Exception as e:
            logger.warning("TXT Cache load failed: %s. Reloading.", e)

    try:
        logger.info("Reading text file: %s", file_path)
        text = read_txt_file(file_path)
        if not text.strip():
            logger.warning("Empty TXT file: %s", file_path)
            return []

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        chunks = text_splitter.split_text(text)

        documents = [Document(page_content=chunk, metadata={"source_file": str(file_path)}) for chunk in chunks]

        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump([{"page_content": d.page_content, "metadata": d.metadata} for d in documents], f)
            logger.info("Cached %d TXT chunks successfully.", len(documents))
        except Exception as e:
            logger.error("Failed to cache TXT JSON: %s", e)

        return documents
    except Exception as e:
        logger.error("Error processing TXT %s: %s", file_path, e)
        raise
