from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class QuizQuestion(BaseModel):
    id: str
    question: str
    options: list[str]
    correct_index: int
    explanation: str
    source_ref: str


class GenerateRequest(BaseModel):
    topic_id: UUID | None = None
    difficulty: str = "medium"
    count: int = 5


class GenerateResponse(BaseModel):
    questions: list[QuizQuestion]


class AnswerSubmission(BaseModel):
    question_id: str
    selected_index: int


class SubmitRequest(BaseModel):
    topic_id: UUID | None = None
    difficulty: str = "medium"
    questions: list[QuizQuestion]
    answers: list[AnswerSubmission]


class SubmitResponse(BaseModel):
    score: int
    total: int
    score_percent: float
    results: list[dict]


class QuizHistoryItem(BaseModel):
    id: UUID
    topic_id: UUID | None
    difficulty: str
    score_percent: float
    question_count: int
    created_at: datetime
