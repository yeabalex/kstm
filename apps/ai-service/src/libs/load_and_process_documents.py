import functools
import hashlib
import json
import logging
import time
from pathlib import Path
from typing import List

import bs4
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

def create_cache_key(url: str) -> str:
    """Generate a unique cache key from the URL."""
    return hashlib.md5(url.encode("utf-8")).hexdigest()

def extract_text_with_links(html_content: str) -> str:
    """Extract structured text including headings, paragraphs, lists, and links."""
    soup = bs4.BeautifulSoup(html_content, "html.parser")
    extracted_text = []

    for element in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "a", "div", "article"]):
        if element.name.startswith("h"):
            heading = element.get_text(strip=True)
            if heading:
                extracted_text.append(f"\n{heading}\n" + "=" * len(heading))
        elif element.name == "p":
            p_text = element.get_text(strip=True)
            if p_text:
                extracted_text.append(p_text)
        elif element.name == "li":
            li_text = element.get_text(strip=True)
            if li_text:
                extracted_text.append(f"- {li_text}")
        elif element.name == "a" and element.get("href"):
            link_text = element.get_text(strip=True)
            if link_text:
                extracted_text.append(f"[{link_text}]({element['href']})")

    return "\n\n".join(extracted_text)

def fetch_dynamic_page_content(url: str) -> str:
    """Uses headless Selenium to render JavaScript and retrieve HTML."""
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)

    try:
        logger.info("Fetching dynamic page content: %s", url)
        driver.get(url)
        time.sleep(3)
        return driver.page_source
    except Exception as e:
        logger.error("Selenium failed to fetch URL %s: %s", url, e)
        return ""
    finally:
        driver.quit()

@functools.lru_cache(maxsize=32)
def load_and_process_documents(
    url: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    cache_dir: Path = Path(".cache/documents"),
    refresh: bool = False,
) -> List[Document]:
    """Load and process web documents with structured extraction, chunking, and JSON caching."""
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_key = create_cache_key(url)
    cache_path = cache_dir / f"{cache_key}.json"

    # Check cache
    if not refresh and cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                logger.info("Loaded documents from JSON cache for: %s", url)
                return [Document(page_content=d["page_content"], metadata=d["metadata"]) for d in data]
        except Exception as e:
            logger.warning("Cache load failed for %s: %s. Reloading.", url, e)

    try:
        logger.info("Extracting document content from URL: %s", url)
        html_content = fetch_dynamic_page_content(url)
        if not html_content:
            logger.error("Failed to load page content for URL: %s", url)
            return []

        structured_text = extract_text_with_links(html_content)
        if not structured_text.strip():
            logger.warning("No text extracted from URL: %s", url)
            return []

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        chunks = text_splitter.split_text(structured_text)

        doc_objects = [Document(page_content=chunk, metadata={"source_url": url}) for chunk in chunks]

        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump([{"page_content": d.page_content, "metadata": d.metadata} for d in doc_objects], f)
            logger.info("Cached %d chunks for URL: %s", len(doc_objects), url)
        except Exception as cache_error:
            logger.error("Failed to cache document data: %s", cache_error)

        return doc_objects
    except Exception as e:
        logger.error("Failed to load/process document from %s: %s", url, e)
        return []
