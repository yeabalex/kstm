import functools
import hashlib
import ipaddress
import json
import logging
import socket
import time
from pathlib import Path
from typing import List
from urllib.parse import urlparse

import bs4
import requests
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


def _validate_safe_public_url(url: str) -> None:
    """Validates that a URL uses http/https and does not target loopback, private, or metadata IPs (SSRF protection)."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError(f"Blocked unsafe URL scheme '{parsed.scheme}' in URL: {url}")

    hostname = (parsed.hostname or "").strip().lower()
    if not hostname or hostname in ("localhost", "0.0.0.0", "::1"):
        raise ValueError(f"Blocked loopback/local hostname in URL: {url}")

    try:
        ip_obj = ipaddress.ip_address(hostname)
        if (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_reserved
        ):
            raise ValueError(f"Blocked non-public IP address '{hostname}' in URL: {url}")
    except ValueError as exc:
        if "Blocked" in str(exc):
            raise
        # Hostname is a domain name; resolve and verify all returned IPs are public
        try:
            addr_info = socket.getaddrinfo(hostname, None)
            for entry in addr_info:
                resolved_ip = ipaddress.ip_address(entry[4][0])
                if (
                    resolved_ip.is_private
                    or resolved_ip.is_loopback
                    or resolved_ip.is_link_local
                    or resolved_ip.is_reserved
                ):
                    raise ValueError(
                        f"Blocked domain '{hostname}' resolving to non-public IP '{resolved_ip}'"
                    )
        except socket.gaierror:
            pass

def create_cache_key(url: str) -> str:
    """Generate a unique cache key from the URL."""
    return hashlib.md5(url.encode("utf-8")).hexdigest()

def extract_text_with_links(html_content: str) -> str:
    """Extract structured text including headings, paragraphs, and lists while stripping boilerplate."""
    soup = bs4.BeautifulSoup(html_content, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
        tag.decompose()

    extracted_text = []

    for element in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li"]):
        if element.name.startswith("h"):
            heading = element.get_text(" ", strip=True)
            if heading:
                extracted_text.append(f"\n{heading}\n" + "=" * len(heading))
        elif element.name == "p":
            p_text = element.get_text(" ", strip=True)
            if p_text:
                extracted_text.append(p_text)
        elif element.name == "li":
            li_text = element.get_text(" ", strip=True)
            if li_text:
                extracted_text.append(f"- {li_text}")

    return "\n\n".join(extracted_text)

def fetch_dynamic_page_content(url: str) -> str:
    """Fetches HTML via HTTP request first, falling back to headless Selenium if needed."""
    _validate_safe_public_url(url)

    # 1. Fast HTTP fetch with browser User-Agent (works without requiring Chrome binary)
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/128.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        resp = requests.get(url, headers=headers, timeout=20)
        if resp.status_code == 200 and resp.text and len(resp.text.strip()) > 200:
            extracted_preview = extract_text_with_links(resp.text)
            if len(extracted_preview.strip()) > 80:
                logger.info("Fetched page content via HTTP for: %s", url)
                return resp.text
    except Exception as req_err:
        logger.warning("HTTP fetch failed for %s (%s), trying Selenium fallback...", url, req_err)

    # 2. Fallback to headless Selenium for JS-only SPAs if Chrome is available
    driver = None
    try:
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        logger.info("Fetching dynamic page content via Selenium: %s", url)
        driver.get(url)
        time.sleep(3)
        return driver.page_source
    except Exception as e:
        logger.error("Failed to fetch URL %s: %s", url, e)
        return ""
    finally:
        if driver is not None:
            try:
                driver.quit()
            except Exception:
                pass

def load_and_process_documents(
    url: str,
    chunk_size: int = 4000,
    chunk_overlap: int = 300,
    cache_dir: Path = Path(".cache/documents"),
    refresh: bool = False,
) -> List[Document]:
    """Load and process web documents with structured extraction, chunking, and JSON caching."""
    if isinstance(chunk_size, bool):
        refresh = chunk_size
        chunk_size = 4000
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_key = create_cache_key(url)
    cache_path = cache_dir / f"{cache_key}.json"

    # Check cache
    if not refresh and cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data:
                    logger.info("Loaded documents from JSON cache for: %s", url)
                    return [Document(page_content=d["page_content"], metadata=d["metadata"]) for d in data]
        except Exception as e:
            logger.warning("Cache load failed for %s: %s. Reloading.", url, e)

    logger.info("Extracting document content from URL: %s", url)
    html_content = fetch_dynamic_page_content(url)
    if not html_content:
        raise RuntimeError(f"Failed to fetch HTML content from URL: {url}")

    structured_text = extract_text_with_links(html_content)
    if not structured_text.strip():
        # Fallback: extract all visible body text if structured tags were sparse
        soup = bs4.BeautifulSoup(html_content, "html.parser")
        structured_text = soup.get_text(separator="\n\n", strip=True)

    if not structured_text.strip():
        raise RuntimeError(f"No readable text found on page: {url}")

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
