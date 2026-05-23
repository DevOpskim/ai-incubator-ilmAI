from openai import OpenAI

from app.config import get_settings
from app.services.providers import create_provider, get_chat_provider
from app.services.providers.base import BaseLLMProvider

settings = get_settings()

_embedding_client: OpenAI | None = None
_default_chat_provider: BaseLLMProvider | None = None


def get_embedding_client() -> OpenAI:
    global _embedding_client
    if _embedding_client is None:
        _embedding_client = OpenAI(api_key=settings.openai_api_key)
    return _embedding_client


def _get_provider(provider_name: str | None, model_name: str | None) -> BaseLLMProvider:
    if provider_name:
        return create_provider(provider_name, model_name)
    global _default_chat_provider
    if _default_chat_provider is None:
        _default_chat_provider = get_chat_provider()
    return _default_chat_provider


def generate_embedding(text: str) -> list[float]:
    client = get_embedding_client()
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input=text,
    )
    return response.data[0].embedding


def generate_text(
    prompt: str,
    temperature: float = 0.7,
    max_tokens: int = 2000,
    provider_name: str | None = None,
    model_name: str | None = None,
) -> str:
    provider = _get_provider(provider_name, model_name)
    return provider.chat_completion(
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens,
    )


def generate_chat_response(
    messages: list[dict],
    context_chunks: list[dict],
    preferred_language: str = "en",
    provider_name: str | None = None,
    model_name: str | None = None,
) -> tuple[str, list[dict]]:
    provider = _get_provider(provider_name, model_name)

    if context_chunks:
        context_text = "\n\n".join(
            f"[Source: {chunk['source_ref']}]\n{chunk['content']}"
            for chunk in context_chunks
        )
        instructions = (
            "CONTEXT FROM THEIR MATERIALS:\n"
            f"{context_text}\n\n"
            "INSTRUCTIONS:\n"
            "- ONLY answer based on the provided context. If the context doesn't contain enough information, "
            "say so and suggest the user upload more materials.\n"
            "- For every claim, cite the specific source material using the [Source: ...] reference.\n"
        )
    else:
        instructions = (
            "NOTE: No study materials are loaded. Answer based on your general knowledge.\n\n"
        )

    system_prompt = (
        "You are Ilm AI, a warm and patient study mentor. "
        "Your role is to help the user learn by guiding them through their own study materials.\n\n"
        f"{instructions}"
        "- Use a Socratic mentoring style — ask guiding questions, don't just give answers.\n"
        f"- Respond in the user's preferred language ({preferred_language}).\n"
        "- Be encouraging and supportive.\n"
        "- If the user is stuck, break the problem down into smaller steps."
    )

    openai_messages = [{"role": "system", "content": system_prompt}]
    openai_messages.extend(messages)

    content = provider.chat_completion(
        messages=openai_messages,
        temperature=0.7,
        max_tokens=1500,
    )

    cited_sources = [
        {"source_ref": chunk["source_ref"], "content_snippet": chunk["content"][:200]}
        for chunk in context_chunks
    ]

    return content, cited_sources
