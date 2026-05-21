from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class GoalCreate(BaseModel):
    description: str
    target_date: date | None = None
    daily_minutes: int = 30


class Goal(BaseModel):
    id: UUID
    description: str
    target_date: date | None
    daily_minutes: int
    created_at: datetime


class PlanDay(BaseModel):
    day: int
    title: str
    tasks: list[str]
    materials: list[str] = []


class Plan(BaseModel):
    goal: Goal
    summary: str
    days: list[PlanDay]
    created_at: datetime
