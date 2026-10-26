import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from langchain_core.documents import Document
from langchain_core.messages import AIMessage, HumanMessage

# Add src to path
src_dir = Path(__file__).resolve().parent.parent / "src"
sys.path.insert(0, str(src_dir))

from main import app, load_chat_history, save_chat_history

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "redis_connected" in data
    assert "timestamp" in data

def test_create_bot_validation_error():
    # Missing required fields
    response = client.post("/create-bot", json={})
    assert response.status_code == 422

def test_query_validation_error():
    # Missing required fields
    response = client.post("/query", json={})
    assert response.status_code == 422

@patch("main.create_vectordb")
@patch("main.load_and_process_documents")
@patch("main.load_and_process_pdf")
def test_create_bot_success(mock_pdf_loader, mock_doc_loader, mock_create_vdb):
    mock_pdf_loader.return_value = [
        Document(page_content="Sample PDF content", metadata={"source_file": "doc.pdf"})
    ]
    mock_doc_loader.return_value = []
    mock_create_vdb.return_value = MagicMock()

    payload = {
        "user_id": "user-test-123",
        "bot_id": "bot-test-123",
        "kb_id": "kb-test-123",
        "bot_name": "Test Knowledge Bot",
        "pdf": ["https://example.com/test.pdf"],
        "prompt_template": "You are a specialized support bot.",
        "temperature": 0.5,
    }

    response = client.post("/create-bot", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["bot_id"] == "bot-test-123"
    assert data["kb_id"] == "kb-test-123"
    assert "Successfully indexed 1 document chunks" in data["message"]
    mock_create_vdb.assert_called_once()

@patch("main.load_vectordb")
@patch("main.create_chains")
@patch("main.create_retrieval_chain")
def test_query_bot_success(mock_retrieval_chain, mock_create_chains, mock_load_vdb):
    mock_db = MagicMock()
    mock_retriever = MagicMock()
    mock_db.as_retriever.return_value = mock_retriever
    mock_load_vdb.return_value = mock_db

    mock_chain_instance = MagicMock()
    mock_chain_instance.invoke.return_value = {
        "answer": "This is the generated answer from the knowledge base."
    }
    mock_retrieval_chain.return_value = mock_chain_instance

    payload = {
        "user_id": "user-test-123",
        "bot_id": "bot-test-123",
        "kb_id": "kb-test-123",
        "session_id": "session-test-456",
        "input_text": "What is the return policy?",
    }

    response = client.post("/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["answer"] == "This is the generated answer from the knowledge base."

def test_chat_history_serialization():
    # Test safe JSON serialization and deserialization
    mock_redis = MagicMock()
    mock_storage = {}

    def mock_setex(key, ttl, value):
        mock_storage[key] = value

    def mock_get(key):
        return mock_storage.get(key)

    mock_redis.setex = mock_setex
    mock_redis.get = mock_get

    with patch("main.redis_client", mock_redis):
        memory_key = "memory:u1:b1:k1:s1"
        messages = [
            HumanMessage(content="Hello AI"),
            AIMessage(content="Hello human! How can I assist you?"),
        ]

        save_chat_history(memory_key, messages)
        assert memory_key in mock_storage
        assert '"role": "human"' in mock_storage[memory_key]
        assert '"role": "ai"' in mock_storage[memory_key]

        loaded = load_chat_history(memory_key)
        assert len(loaded) == 2
        assert isinstance(loaded[0], HumanMessage)
        assert loaded[0].content == "Hello AI"
        assert isinstance(loaded[1], AIMessage)
        assert loaded[1].content == "Hello human! How can I assist you?"
