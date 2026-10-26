import json
import logging
import os
import time
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, HttpUrl
import redis
from starlette.concurrency import run_in_threadpool

from langchain_core.messages import AIMessage, HumanMessage, BaseMessage
from langchain_classic.chains import create_retrieval_chain

from libs.load_and_process_documents import load_and_process_documents
from libs.load_an_process_pdf import load_and_process_pdf
from libs.load_and_process_csv import load_and_process_csv
from libs.load_and_process_txt import load_and_process_txt
from libs.load_and_process_json import load_and_process_json
from config.db import create_vectordb, load_vectordb
from static.resources import create_chains

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ai_service")

# Load environment variables
load_dotenv()
_env_vars = {
    "GOOGLE_API_KEY": os.getenv("GOOGLE_API_KEY"),
    "LANGSMITH_TRACING": os.getenv("LANGSMITH_TRACING", "false"),
    "LANGCHAIN_API_KEY": os.getenv("LANGCHAIN_API_KEY"),
}
os.environ.update({k: v for k, v in _env_vars.items() if v is not None})

# Redis connection pool
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
try:
    redis_client = redis.from_url(redis_url, decode_responses=True)
    redis_client.ping()
    logger.info("Connected to Redis successfully.")
except Exception as e:
    redis_client = None
    logger.warning("Redis is unavailable at startup: %s. Chat memory will fallback to transient mode.", e)

# FastAPI application instance
app = FastAPI(
    title="KSTM AI Microservice",
    description="Knowledge base ingestion, vector retrieval, and LLM orchestration microservice.",
    version="1.0.0",
)

# Dynamic CORS Middleware configuration
cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8080,https://api.yeabsiraa.com")
cors_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Helper Functions for Safe Serialization ----------------- #

def load_chat_history(memory_key: str) -> List[BaseMessage]:
    """Safely loads chat history from Redis as JSON."""
    if not redis_client:
        return []
    try:
        raw_data = redis_client.get(memory_key)
        if not raw_data:
            return []
        items = json.loads(raw_data)
        messages: List[BaseMessage] = []
        for item in items:
            role = item.get("role")
            content = item.get("content", "")
            if role == "human":
                messages.append(HumanMessage(content=content))
            elif role == "ai":
                messages.append(AIMessage(content=content))
        return messages
    except Exception as e:
        logger.warning("Failed to deserialize chat history from Redis: %s", e)
        return []

def save_chat_history(memory_key: str, messages: List[BaseMessage], ttl_seconds: int = 86400 * 7):
    """Safely saves chat history to Redis as JSON."""
    if not redis_client:
        return
    try:
        items = []
        for msg in messages:
            role = "human" if isinstance(msg, HumanMessage) else "ai"
            items.append({"role": role, "content": msg.content})
        redis_client.setex(memory_key, ttl_seconds, json.dumps(items))
    except Exception as e:
        logger.warning("Failed to save chat history to Redis: %s", e)

# ----------------- Request / Response Models ----------------- #

class CreateBotRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: str = Field(..., min_length=1)
    bot_id: str = Field(..., min_length=1)
    kb_id: str = Field(..., min_length=1)
    csv: Optional[List[str]] = []
    pdf: Optional[List[str]] = []
    txt: Optional[List[str]] = []
    json_files: Optional[List[str]] = Field(default=[], alias="json")
    web_url: Optional[List[HttpUrl]] = []
    prompt_template: Optional[str] = None
    temperature: Optional[float] = Field(default=0.7, ge=0, le=1)
    theme: Optional[str] = None
    bot_name: str = Field(..., min_length=1)
    profile_image: Optional[HttpUrl] = None
    model: Optional[str] = None

class QueryRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    bot_id: str = Field(..., min_length=1)
    kb_id: str = Field(..., min_length=1)
    session_id: str = Field(..., min_length=1)
    input_text: str = Field(..., min_length=1)

# ----------------- Endpoints ----------------- #

@app.get("/health", tags=["Health"])
async def health_check():
    """Service health and dependency connectivity status."""
    redis_alive = False
    if redis_client:
        try:
            redis_alive = bool(redis_client.ping())
        except Exception:
            redis_alive = False
    return {
        "status": "healthy",
        "redis_connected": redis_alive,
        "timestamp": time.time(),
    }

def _process_and_index_documents(request: CreateBotRequest):
    """Synchronous worker for document extraction and vector database storage."""
    documents = []

    # Process Web URLs with Selenium scraper
    if request.web_url:
        for url in request.web_url:
            logger.info("Processing web URL: %s", url)
            docs = load_and_process_documents(str(url), refresh=True)
            documents.extend(docs)

    # Process Document files (PDF, CSV, TXT, JSON)
    loaders = [
        (request.pdf, load_and_process_pdf, "PDF"),
        (request.csv, load_and_process_csv, "CSV"),
        (request.txt, load_and_process_txt, "TXT"),
        (request.json_files, load_and_process_json, "JSON"),
    ]

    for file_list, loader, file_type in loaders:
        if file_list:
            for path in file_list:
                logger.info("Processing %s source: %s", file_type, path)
                docs = loader(path, refresh=True)
                documents.extend(docs)

    if not documents:
        raise ValueError("No valid document content could be extracted from the provided sources.")

    # Create vector database index in Neo4j
    logger.info("Creating vector database index for KB: %s with %d chunks", request.kb_id, len(documents))
    create_vectordb(documents, request.kb_id)
    return len(documents)

@app.post("/create-bot", status_code=status.HTTP_201_CREATED, tags=["Bot Management"])
async def create_bot(request: CreateBotRequest):
    """Processes knowledge base assets, splits into semantic chunks, and creates vector index."""
    user_id, bot_id, kb_id = request.user_id, request.bot_id, request.kb_id
    logger.info("Initiating bot creation: bot_id=%s, kb_id=%s, user_id=%s", bot_id, kb_id, user_id)

    try:
        chunk_count = await run_in_threadpool(_process_and_index_documents, request)

        if redis_client:
            now_ts = str(time.time())
            redis_client.set(f"last_refresh:{user_id}:{bot_id}:{kb_id}", now_ts)
            if request.prompt_template:
                redis_client.set(f"prompt_template:{user_id}:{bot_id}", request.prompt_template)

        logger.info("Successfully created bot %s with %d indexed chunks", bot_id, chunk_count)
        return {
            "status": "success",
            "message": f"Successfully indexed {chunk_count} document chunks.",
            "bot_id": bot_id,
            "kb_id": kb_id,
            "last_refresh": time.time(),
        }
    except ValueError as val_err:
        logger.error("Validation error during bot creation: %s", val_err)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except Exception as e:
        logger.error("Failed to create bot %s: %s", bot_id, str(e), exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

def _execute_rag_query(request: QueryRequest, prompt_template: Optional[str], history_messages: List[BaseMessage]):
    """Synchronous worker for vector retrieval and LLM reasoning."""
    db = load_vectordb()
    base_chain = create_chains(prompt_template)

    retriever = db.as_retriever(search_kwargs={
        "filter": {
            "source_url": request.kb_id
        }
    })

    retrieval_chain = create_retrieval_chain(retriever, base_chain)
    response = retrieval_chain.invoke({
        "input": request.input_text,
        "chat_history": history_messages,
    })
    return response.get("answer", "")

@app.post("/query", tags=["Query & RAG"])
async def query_bot(request: QueryRequest):
    """Executes context-aware RAG query against the indexed knowledge base."""
    user_id, bot_id, kb_id, session_id = (
        request.user_id, request.bot_id, request.kb_id, request.session_id
    )
    logger.info("Query received for bot_id=%s, session_id=%s", bot_id, session_id)

    try:
        memory_key = f"memory:{user_id}:{bot_id}:{kb_id}:{session_id}"
        history_messages = load_chat_history(memory_key)

        prompt_template = None
        if redis_client:
            prompt_template = redis_client.get(f"prompt_template:{user_id}:{bot_id}")

        answer = await run_in_threadpool(
            _execute_rag_query,
            request,
            prompt_template,
            history_messages,
        )

        # Update session memory
        updated_messages = history_messages + [
            HumanMessage(content=request.input_text),
            AIMessage(content=answer),
        ]
        save_chat_history(memory_key, updated_messages)

        logger.info("Query successfully answered for session_id=%s", session_id)
        return {
            "status": "success",
            "answer": answer,
        }
    except Exception as e:
        logger.error("Error executing query for bot %s: %s", bot_id, str(e), exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
