from __future__ import annotations
from datetime import datetime
from uuid import UUID
from typing import List
from pydantic import BaseModel, ConfigDict


class FolderCreate(BaseModel):
    name: str
    parent_id: UUID | None = None


class FolderUpdate(BaseModel):
    name: str


class Folder(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    parent_id: UUID | None
    name: str
    created_at: datetime
    updated_at: datetime


class FolderTree(Folder):
    children: List[FolderTree] = []
    materials: list = []


class MoveMaterialBody(BaseModel):
    folder_id: UUID | None = None
