import functools
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_classic.chains.combine_documents import create_stuff_documents_chain

DEFAULT_SYSTEM_PROMPT = (
    "You are a helpful, professional AI assistant. "
    "Use the provided context to answer the user's questions accurately and concisely."
)

@functools.lru_cache(maxsize=1)
def get_llm(temperature: float = 0.1):
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=temperature,
    )

@functools.lru_cache(maxsize=64)
def build_prompt(system_prompt_str: Optional[str] = None):
    """Construct a ChatPromptTemplate from a system prompt string."""
    base_prompt = (system_prompt_str.strip() if system_prompt_str else DEFAULT_SYSTEM_PROMPT)
    return ChatPromptTemplate.from_messages([
        (
            "system",
            f"{base_prompt}\n\n"
            "Format your response with clean Markdown where appropriate.\n\n"
            "Context:\n{{context}}"
        ),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}")
    ])

def create_chains(system_prompt_str: Optional[str] = None, temperature: float = 0.1):
    """Create the document combination chain using a system prompt string."""
    prompt_template = build_prompt(system_prompt_str)
    return create_stuff_documents_chain(get_llm(temperature=temperature), prompt_template)
