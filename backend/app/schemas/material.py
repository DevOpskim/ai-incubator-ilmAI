from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.models.enums import RoadmapStage, UploadStatus

class TopicBase(BaseModel):
    name: str

class TopicCreate(TopicBase):
    pass

class Topic(TopicBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    current_stage: RoadmapStage
    created_at: datetime

class MaterialBase(BaseModel):
    title: str

class MaterialCreate(MaterialBase):
    topic_id: UUID | None = None

class Material(MaterialBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    topic_id: UUID | None
    created_at: datetime
    updated_at: datetime

class UploadBase(BaseModel):
    original_filename: str
    content_type: str | None = None
    size_bytes: int | None = None

class Upload(UploadBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    material_id: UUID
    status: UploadStatus
    created_at: datetime
