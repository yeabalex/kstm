import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
try:
    from langchain_neo4j import Neo4jVector
except ImportError:
    from langchain_community.vectorstores import Neo4jVector

def get_embedding_model():
    return GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

def create_vectordb(documents, url):
    """Enrich document metadata and create/index Neo4j vector store."""
    for doc in documents:
        doc.metadata["source_url"] = url

    embedding = get_embedding_model()
    db = Neo4jVector.from_documents(
        documents=documents,
        embedding=embedding,
        username=os.getenv("NEO4J_USER", "neo4j"),
        password=os.getenv("NEO4J_PASSWORD", "password"),
        url=os.getenv("NEO4J_URI", "bolt://localhost:7687"),
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
        password=os.getenv("NEO4J_PASSWORD", "password"),
        url=os.getenv("NEO4J_URI", "bolt://localhost:7687"),
        index_name="ecom_index",
        node_label="ECOM",
    )
