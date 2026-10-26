import hashlib
import json
import logging
from pathlib import Path
from typing import Any, Dict, List
import requests
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

def create_cache_key(path: str) -> str:
    return hashlib.md5(path.encode("utf-8")).hexdigest()

def flatten_json(obj: Any, parent_key: str = "", sep: str = ".") -> Dict[str, Any]:
    items: Dict[str, Any] = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else str(k)
            if isinstance(v, (dict, list)):
                items.update(flatten_json(v, new_key, sep=sep))
            else:
                items[new_key] = v
    elif isinstance(obj, list):
        for idx, elem in enumerate(obj):
            new_key = f"{parent_key}[{idx}]"
            if isinstance(elem, (dict, list)):
                items.update(flatten_json(elem, new_key, sep=sep))
            else:
                items[new_key] = elem
    return items

def read_json_from_url(url: str) -> Any:
    response = requests.get(url, timeout=30)
    if response.status_code == 200:
        return response.json()
    logger.error("Failed to fetch JSON from %s, status code: %d", url, response.status_code)
    return []

def read_json_from_local(file_path: str) -> Any:
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def read_json(file_path: str) -> str:
    if file_path.startswith("http://") or file_path.startswith("https://"):
        data = read_json_from_url(file_path)
    else:
        data = read_json_from_local(file_path)

    if isinstance(data, dict):
        data = [data]
    elif not isinstance(data, list):
        data = [{"value": data}]

    flat_rows = []
    for entry in data:
        flat = flatten_json(entry)
        row_str = ", ".join(f"{k}: {v}" for k, v in flat.items())
        flat_rows.append(row_str)

    return "\n".join(flat_rows)

def load_and_process_json(
    file_path: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    cache_dir: Path = Path(".cache/json"),
    refresh: bool = False,
) -> List[Document]:
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_key = create_cache_key(file_path)
    cache_path = cache_dir / f"{cache_key}.json"

    if not refresh and cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                logger.info("Loaded JSON from cache: %s", file_path)
                return [Document(page_content=d["page_content"], metadata=d["metadata"]) for d in data]
        except Exception as e:
            logger.warning("JSON Cache load failed: %s. Reloading.", e)

    try:
        logger.info("Reading JSON file: %s", file_path)
        full_text = read_json(file_path)
        if not full_text.strip():
            logger.warning("Empty JSON content: %s", file_path)
            return []

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        chunks = text_splitter.split_text(full_text)

        documents = [Document(page_content=chunk, metadata={"source_file": file_path}) for chunk in chunks]

        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump([{"page_content": d.page_content, "metadata": d.metadata} for d in documents], f)
            logger.info("Cached %d JSON chunks successfully.", len(documents))
        except Exception as e:
            logger.error("Failed to cache JSON: %s", e)

        return documents
    except Exception as e:
        logger.error("Error processing JSON %s: %s", file_path, e)
        return []
