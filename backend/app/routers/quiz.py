from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.db.session import get_db
from app.models.tables import Quiz as QuizModel
from app.models.tables import User
from app.schemas.quiz import (
    GenerateRequest,
    GenerateResponse,
    QuizHistoryItem,
    SubmitRequest,
    SubmitResponse,
)
from app.services.quiz import evaluate_answers, generate_questions

router = APIRouter(prefix="/quiz", tags=["Quiz"])


@router.post("/generate", response_model=GenerateResponse)
async def generate(
    body: GenerateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> GenerateResponse:
    return generate_questions(
        user_id=current_user.id,
        topic_id=body.topic_id,
        difficulty=body.difficulty,
        count=body.count,
        db=db,
    )


@router.post("/submit", response_model=SubmitResponse)
async def submit(
    body: SubmitRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> SubmitResponse:
    result = evaluate_answers(
        user_id=current_user.id,
        topic_id=body.topic_id,
        difficulty=body.difficulty,
        answers=[a.model_dump() for a in body.answers],
        questions=body.questions,
        db=db,
    )

    return SubmitResponse(**result)


@router.get("/history", response_model=list[QuizHistoryItem])
async def history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> list[QuizHistoryItem]:
    quizzes = (
        db.query(QuizModel)
        .filter(QuizModel.user_id == current_user.id)
        .order_by(QuizModel.created_at.desc())
        .limit(20)
        .all()
    )
    return quizzes
