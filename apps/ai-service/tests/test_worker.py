import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

# Ensure the `src` directory is in sys.path so internal modules resolve cleanly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

# Mock redis.from_url prior to importing worker to prevent live network calls at module import time
with patch("redis.from_url") as _mock_redis_init:
    _mock_redis_init.return_value = MagicMock()
    import worker
    from worker import (
        _normalize_list,
        _parse_redis_connection,
        process_job,
    )


@pytest.fixture
def mock_job():
    """Creates a mock BullMQ Job instance with an async updateProgress method."""
    job = MagicMock()
    job.id = "job-test-123"
    job.data = {
        "user_id": "user-1",
        "bot_id": "bot-1",
        "kb_id": "kb-1",
        "web_url": ["https://example.com/docs"],
        "pdf": ["/tmp/sample.pdf"],
        "prompt_template": "You are a helpful AI assistant.",
    }
    job.updateProgress = AsyncMock()
    return job


@pytest.fixture
def mock_redis(monkeypatch):
    """Mocks the module-level redis_client and its pipeline in worker.py."""
    client = MagicMock()
    pipeline = MagicMock()
    client.pipeline.return_value = pipeline
    monkeypatch.setattr(worker, "redis_client", client)
    return client, pipeline


@pytest.mark.asyncio
async def test_process_job_success(mock_job, mock_redis):
    """
    Tests that a valid job with multiple document sources succeeds, updates progress,
    indexes chunks in Neo4j, updates Redis metadata, and returns status='success'.
    """
    _, mock_pipeline = mock_redis

    mock_web_docs = [MagicMock(page_content="web chunk 1"), MagicMock(page_content="web chunk 2")]
    mock_pdf_docs = [MagicMock(page_content="pdf chunk 1")]

    with patch("worker.load_and_process_documents", return_value=mock_web_docs) as mock_web_loader, \
         patch("worker.load_and_process_pdf", return_value=mock_pdf_docs) as mock_pdf_loader, \
         patch("worker.create_vectordb") as mock_create_vectordb:

        result = await process_job(mock_job, "token-xyz")

        # 1. Verify loaders were called properly
        mock_web_loader.assert_called_once_with("https://example.com/docs", True)
        mock_pdf_loader.assert_called_once_with("/tmp/sample.pdf", True)

        # 2. Verify Neo4j vector database indexing was called with combined chunks
        expected_docs = mock_web_docs + mock_pdf_docs
        mock_create_vectordb.assert_called_once_with(expected_docs, "kb-1")

        # 3. Verify Redis metadata pipeline updates
        assert mock_pipeline.set.call_count == 2
        mock_pipeline.set.assert_any_call(
            "prompt_template:user-1:bot-1", "You are a helpful AI assistant."
        )
        refresh_calls = [
            call for call in mock_pipeline.set.call_args_list
            if call.args[0] == "last_refresh:user-1:bot-1:kb-1"
        ]
        assert len(refresh_calls) == 1
        mock_pipeline.execute.assert_called_once()

        # 4. Verify job progress updates (5 -> 40 -> 75 -> 80 -> 95 -> 100)
        progress_values = [call.args[0] for call in mock_job.updateProgress.call_args_list]
        assert progress_values[0] == 5
        assert 80 in progress_values
        assert 95 in progress_values
        assert progress_values[-1] == 100

        # 5. Verify returned summary payload
        assert result["status"] == "success"
        assert result["bot_id"] == "bot-1"
        assert result["kb_id"] == "kb-1"
        assert result["chunk_count"] == 3
        assert result["total_sources"] == 2
        assert result["processed_sources"] == 2
        assert result["failed_sources_count"] == 0
        assert result["failed_sources"] == []
        assert isinstance(result["last_refresh"], float)
        assert isinstance(result["duration_seconds"], float)


@pytest.mark.asyncio
async def test_process_job_partial_failure(mock_job, mock_redis):
    """
    Tests that if one document source raises an exception while another succeeds,
    the job continues, records the error in `failed_sources`, indexes the valid
    documents, and returns status='partial_success'.
    """
    mock_web_docs = [MagicMock(page_content="valid web chunk")]

    with patch("worker.load_and_process_documents", return_value=mock_web_docs) as mock_web_loader, \
         patch("worker.load_and_process_pdf", side_effect=RuntimeError("Corrupted PDF file")) as mock_pdf_loader, \
         patch("worker.create_vectordb") as mock_create_vectordb:

        result = await process_job(mock_job, "token-xyz")

        mock_web_loader.assert_called_once_with("https://example.com/docs", True)
        mock_pdf_loader.assert_called_once_with("/tmp/sample.pdf", True)

        # Verify only valid chunks were indexed
        mock_create_vectordb.assert_called_once_with(mock_web_docs, "kb-1")

        # Verify partial_success result and failure details
        assert result["status"] == "partial_success"
        assert result["chunk_count"] == 1
        assert result["total_sources"] == 2
        assert result["processed_sources"] == 1
        assert result["failed_sources_count"] == 1
        assert len(result["failed_sources"]) == 1
        assert result["failed_sources"][0] == {
            "source": "/tmp/sample.pdf",
            "type": "PDF",
            "error": "Corrupted PDF file",
        }


@pytest.mark.asyncio
async def test_process_job_all_fail(mock_job, mock_redis):
    """
    Tests that if all document sources fail or return empty, a RuntimeError is raised
    and Neo4j indexing is never invoked.
    """
    with patch("worker.load_and_process_documents", side_effect=ConnectionError("Failed to fetch URL")), \
         patch("worker.load_and_process_pdf", return_value=[]), \
         patch("worker.create_vectordb") as mock_create_vectordb:

        with pytest.raises(RuntimeError) as exc_info:
            await process_job(mock_job, "token-xyz")

        error_msg = str(exc_info.value)
        assert "All 2 document source(s) failed or yielded no content" in error_msg
        assert "WEB_URL (https://example.com/docs): Failed to fetch URL" in error_msg
        assert "PDF (/tmp/sample.pdf): No extractable content found" in error_msg

        mock_create_vectordb.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "missing_field",
    ["user_id", "bot_id", "kb_id"],
)
async def test_process_job_missing_identifiers(mock_job, missing_field):
    """
    Tests that missing any required identifier ('user_id', 'bot_id', 'kb_id')
    immediately raises a ValueError.
    """
    mock_job.data[missing_field] = None

    with pytest.raises(ValueError) as exc_info:
        await process_job(mock_job, "token-xyz")

    assert "Missing required identifiers" in str(exc_info.value)
    mock_job.updateProgress.assert_not_called()


@pytest.mark.asyncio
async def test_process_job_no_document_sources(mock_job):
    """
    Tests that a job with valid identifiers but no document sources raises a ValueError.
    """
    mock_job.data = {
        "user_id": "user-1",
        "bot_id": "bot-1",
        "kb_id": "kb-1",
        "web_url": [],
        "pdf": "",
    }

    with pytest.raises(ValueError) as exc_info:
        await process_job(mock_job, "token-xyz")

    assert "No valid document sources" in str(exc_info.value)


@pytest.mark.parametrize(
    "input_val,expected",
    [
        (None, []),
        ("", []),
        ("   ", []),
        ([], []),
        ("https://example.com", ["https://example.com"]),
        ("  /path/to/file.pdf  ", ["/path/to/file.pdf"]),
        (
            ["https://a.com", "  https://b.com  ", "", "   ", None],
            ["https://a.com", "https://b.com"],
        ),
        ([123, " test "], ["123", "test"]),
        (12345, []),  # Non-string, non-list falsy/unsupported type
        ({}, []),
    ],
)
def test_normalize_list(input_val, expected):
    """Tests _normalize_list across strings, lists with whitespace, None, and edge types."""
    assert _normalize_list(input_val) == expected


def test_parse_redis_connection():
    """Tests _parse_redis_connection with standard and TLS Redis URLs."""
    basic = _parse_redis_connection("redis://localhost:6379")
    assert basic == {"host": "localhost", "port": 6379}

    authenticated = _parse_redis_connection("rediss://default:secret@redis.internal:6380/2")
    assert authenticated == {
        "host": "redis.internal",
        "port": 6380,
        "username": "default",
        "password": "secret",
        "db": 2,
        "ssl": True,
    }
