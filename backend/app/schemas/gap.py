from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class GapReport(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    topic_id: UUID | None
    summary: str
    strengths: list | None
    weaknesses: list | None
    created_at: datetime
    updated_at: datetime
