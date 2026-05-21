from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class Flashcard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    topic_id: UUID | None
    material_id: UUID | None
    front: str
    back: str
    created_at: datetime


class DueCard(BaseModel):
    flashcard: Flashcard
    review_queue_id: UUID
    due_at: datetime
    interval_days: int
    repetitions: int
    ease_factor: float


class GenerateRequest(BaseModel):
    count: int = 10


class GenerateResponse(BaseModel):
    flashcards: list[Flashcard]


class ReviewRequest(BaseModel):
    review_queue_id: UUID
    quality: int  # 0=again, 1=hard, 3=good, 5=easy


class ReviewResponse(BaseModel):
    next_due_at: datetime
    interval_days: int
    repetitions: int
    ease_factor: float
