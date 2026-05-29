from __future__ import annotations
from datetime import datetime
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from app.schemas.flashcard import Flashcard


class DeckCreate(BaseModel):
    name: str
    description: str | None = None
    folder_id: UUID | None = None


class DeckUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class Deck(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    folder_id: UUID | None
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime


class DeckWithCount(Deck):
    card_count: int = 0


class DeckWithCards(Deck):
    flashcards: List[Flashcard] = []


class MoveDeckBody(BaseModel):
    folder_id: UUID | None = None


class GenerateIntoDeckRequest(BaseModel):
    count: int = 10
