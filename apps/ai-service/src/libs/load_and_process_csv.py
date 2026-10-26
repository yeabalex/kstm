import csv
import hashlib
import io
import json
import logging
from pathlib import Path
from typing import List
import requests
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

def create_cache_key(path: str, delimiter: str) -> str:
    key = f"{path}_{delimiter}"
    return hashlib.md5(key.encode("utf-8")).hexdigest()

def read_csv_from_url(url: str, delimiter: str = ",") -> List[str]:
    response = requests.get(url, timeout=30)
    if response.status_code == 200:
        csvfile = io.StringIO(response.text)
        reader = csv.DictReader(csvfile, delimiter=delimiter)
        return [", ".join(f"{k}: {v}" for k, v in row.items()) for row in reader if row]
    logger.error("Failed to fetch CSV from %s, status: %d", url, response.status_code)
    return []

def read_csv_from_local(file_path: str, delimiter: str = ",") -> List[str]:
    rows = []
    with open(file_path, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile, delimiter=delimiter)
        for row in reader:
            if row:
                rows.append(", ".join(f"{k}: {v}" for k, v in row.items()))
    return rows

def read_csv_file(file_path: str, delimiter: str = ",") -> List[str]:
    if file_path.startswith("http://") or file_path.startswith("https://"):
        return read_csv_from_url(file_path, delimiter)
    return read_csv_from_local(file_path, delimiter)

def load_and_process_csv(
    file_path: str,
    delimiter: str = ",",
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    cache_dir: Path = Path(".cache/csv"),
    refresh: bool = False,
) -> List[Document]:
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_key = create_cache_key(str(file_path), delimiter)
    cache_path = cache_dir / f"{cache_key}.json"

    if not refresh and cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                logger.info("Loaded CSV from JSON cache: %s", file_path)
                return [Document(page_content=d["page_content"], metadata=d["metadata"]) for d in data]
        except Exception as e:
            logger.warning("CSV Cache load failed: %s. Reloading.", e)

    try:
        logger.info("Reading CSV file: %s", file_path)
        row_texts = read_csv_file(file_path, delimiter)
        full_text = "\n".join(row_texts)
        if not full_text.strip():
            logger.warning("Empty CSV content: %s", file_path)
            return []

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        chunks = text_splitter.split_text(full_text)

        documents = [Document(page_content=chunk, metadata={"source_file": str(file_path)}) for chunk in chunks]

        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump([{"page_content": d.page_content, "metadata": d.metadata} for d in documents], f)
            logger.info("Cached %d CSV chunks successfully.", len(documents))
        except Exception as e:
            logger.error("Failed to cache CSV JSON: %s", e)

        return documents
    except Exception as e:
        logger.error("Error processing CSV %s: %s", file_path, e)
        return []
