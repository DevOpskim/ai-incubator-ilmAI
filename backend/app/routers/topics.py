from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.db.session import get_db
from app.models.tables import Topic as TopicModel
from app.models.tables import User
from app.schemas.material import Topic, TopicCreate

router = APIRouter(prefix="/topics", tags=["Topics"])


@router.get("/", response_model=list[Topic])
async def list_topics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> list[Topic]:
    stmt = select(TopicModel).where(TopicModel.user_id == current_user.id)
    topics = db.scalars(stmt).all()
    return topics


@router.post("/", response_model=Topic, status_code=status.HTTP_201_CREATED)
async def create_topic(
    body: TopicCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Topic:
    topic = TopicModel(
        id=uuid4(),
        user_id=current_user.id,
        name=body.name,
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic(
    topic_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    topic = db.query(TopicModel).filter(TopicModel.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if topic.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(topic)
    db.commit()
