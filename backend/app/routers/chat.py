from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.db.session import get_db
from app.models.tables import ChatMessage as ChatMessageModel
from app.models.tables import ChatSession as ChatSessionModel
from app.models.tables import User
from app.schemas.chat import ChatMessage, ChatRequest, ChatResponse, ChatSession, ChatSessionCreate
from app.services.chat import process_chat_message

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.get("/sessions", response_model=list[ChatSession])
async def list_sessions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> list[ChatSession]:
    sessions = (
        db.query(ChatSessionModel)
        .filter(ChatSessionModel.user_id == current_user.id)
        .order_by(ChatSessionModel.created_at.desc())
        .all()
    )
    return sessions


@router.post("/sessions", response_model=ChatSession, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: ChatSessionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ChatSession:
    session = ChatSessionModel(
        id=uuid4(),
        user_id=current_user.id,
        topic_id=body.topic_id,
        title=body.title,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessage])
async def list_messages(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> list[ChatMessage]:
    session = db.query(ChatSessionModel).filter(ChatSessionModel.id == session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = (
        db.query(ChatMessageModel)
        .filter(ChatMessageModel.chat_session_id == session_id)
        .order_by(ChatMessageModel.created_at.asc())
        .all()
    )
    return messages


@router.post("/sessions/{session_id}/messages", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    session_id: str,
    body: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ChatResponse:
    session = db.query(ChatSessionModel).filter(ChatSessionModel.id == session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    # Auto-title from first message
    if not session.title:
        session.title = body.content[:80]
        db.commit()

    result = process_chat_message(
        session_id=session_id,
        user_message=body.content,
        user_id=current_user.id,
        preferred_language=current_user.preferred_language,
        db=db,
    )

    return result
