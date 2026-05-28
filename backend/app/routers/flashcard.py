from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.db.session import get_db
from app.models.tables import User
from app.schemas.flashcard import (
    DueCard,
    GenerateRequest,
    GenerateResponse,
    ReviewRequest,
    ReviewResponse,
)
from app.services.flashcard import enqueue_flashcard, generate_flashcards, get_due_cards
from app.services.spaced_repetition import update_review_queue

router = APIRouter(prefix="/flashcards", tags=["Flashcards"])


@router.post("/generate", response_model=GenerateResponse)
async def generate(
    body: GenerateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> GenerateResponse:
    result = generate_flashcards(
        user_id=current_user.id,
        count=body.count,
        db=db,
    )

    for card in result.flashcards:
        enqueue_flashcard(
            flashcard_id=card.id,
            user_id=current_user.id,
            db=db,
        )

    return result


@router.get("/due", response_model=list[DueCard])
async def due(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> list[DueCard]:
    return get_due_cards(user_id=current_user.id, db=db)


@router.post("/review", response_model=ReviewResponse)
async def review(
    body: ReviewRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    try:
        item = update_review_queue(
            review_queue_id=str(body.review_queue_id),
            quality=body.quality,
            db=db,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return ReviewResponse(
        next_due_at=item.due_at,
        interval_days=item.interval_days,
        repetitions=item.repetitions,
        ease_factor=item.ease_factor,
    )
