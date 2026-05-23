from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ChatSessionCreate(BaseModel):
    topic_id: UUID | None = None
    title: str | None = None


class ChatSession(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    topic_id: UUID | None
    title: str | None
    created_at: datetime


class ChatMessage(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    chat_session_id: UUID
    role: str
    content: str
    citations: list[dict] | None = None
    created_at: datetime


class ChatRequest(BaseModel):
    content: str
    provider: str | None = None
    model: str | None = None


class ChatResponse(BaseModel):
    message: ChatMessage
    cited_sources: list[dict] = []
