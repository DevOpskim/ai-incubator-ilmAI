from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class UserProfile(BaseModel):
    id: UUID
    email: str
    display_name: str | None
    preferred_language: str
    created_at: datetime


class UserStats(BaseModel):
    total_sessions: int
    topics_covered: int
    average_knowledge_score: float | None


class GoalSchema(BaseModel):
    id: UUID
    description: str
    target_date: date | None
    created_at: datetime


class LearningRoadmap(BaseModel):
    topic_id: UUID
    topic_name: str
    current_stage: str
    next_stage: str | None


class ProfileResponse(BaseModel):
    user: UserProfile
    stats: UserStats
    goals: list[GoalSchema]
    roadmap: list[LearningRoadmap]
