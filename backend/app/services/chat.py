from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models.tables import ChatMessage as ChatMessageModel
from app.models.tables import ChatSession as ChatSessionModel
from app.schemas.chat import ChatMessage, ChatResponse
from app.services.llm import generate_chat_response
from app.services.retrieval import search_chunks


def get_chat_history(
    session_id: str,
    db: Session,
    limit: int = 10,
) -> list[dict]:
    messages = (
        db.query(ChatMessageModel)
        .filter(ChatMessageModel.chat_session_id == session_id)
        .order_by(ChatMessageModel.created_at.desc())
        .limit(limit)
        .all()
    )
    messages.reverse()

    return [
        {"role": msg.role, "content": msg.content}
        for msg in messages
    ]


def process_chat_message(
    session_id: str,
    user_message: str,
    user_id: UUID,
    preferred_language: str,
    db: Session,
    provider_name: str | None = None,
    model_name: str | None = None,
) -> ChatResponse:
    user_msg = ChatMessageModel(
        id=uuid4(),
        chat_session_id=session_id,
        role="user",
        content=user_message,
    )
    db.add(user_msg)
    db.commit()

    relevant_chunks = search_chunks(
        query=user_message,
        user_id=user_id,
        db=db,
        limit=5,
    )

    context_chunks = [
        {
            "source_ref": c.source_ref or f"Chunk {c.chunk_index}",
            "content": c.content,
        }
        for c in relevant_chunks
    ]

    history = get_chat_history(session_id, db)

    ai_content, cited_sources = generate_chat_response(
        messages=history,
        context_chunks=context_chunks,
        preferred_language=preferred_language,
        provider_name=provider_name,
        model_name=model_name,
    )

    ai_msg = ChatMessageModel(
        id=uuid4(),
        chat_session_id=session_id,
        role="assistant",
        content=ai_content,
        citations=cited_sources,
    )
    db.add(ai_msg)
    db.commit()

    return ChatResponse(
        message=ChatMessage.model_validate(ai_msg),
        cited_sources=cited_sources,
    )
