from openai import OpenAI

from app.config import get_settings

settings = get_settings()

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client


def generate_embedding(text: str) -> list[float]:
    client = get_client()
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input=text,
    )
    return response.data[0].embedding


def generate_chat_response(
    messages: list[dict],
    context_chunks: list[dict],
    preferred_language: str = "en",
) -> tuple[str, list[dict]]:
    client = get_client()

    context_text = "\n\n".join(
        f"[Source: {chunk['source_ref']}]\n{chunk['content']}"
        for chunk in context_chunks
    )

    system_prompt = (
        "You are Ilm AI, a warm and patient study mentor. "
        "Your role is to help the user learn by guiding them through their own study materials.\n\n"
        "CONTEXT FROM THEIR MATERIALS:\n"
        f"{context_text}\n\n"
        "INSTRUCTIONS:\n"
        "- ONLY answer based on the provided context. If the context doesn't contain enough information, "
        "say so and suggest the user upload more materials.\n"
        "- For every claim, cite the specific source material using the [Source: ...] reference.\n"
        "- Use a Socratic mentoring style — ask guiding questions, don't just give answers.\n"
        f"- Respond in the user's preferred language ({preferred_language}).\n"
        "- Be encouraging and supportive.\n"
        "- If the user is stuck, break the problem down into smaller steps."
    )

    openai_messages = [{"role": "system", "content": system_prompt}]
    openai_messages.extend(messages)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=openai_messages,
        temperature=0.7,
        max_tokens=1500,
    )

    content = response.choices[0].message.content or ""

    cited_sources = [
        {"source_ref": chunk["source_ref"], "content_snippet": chunk["content"][:200]}
        for chunk in context_chunks
    ]

    return content, cited_sources
