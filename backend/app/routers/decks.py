from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.db.session import get_db
from app.models.tables import Flashcard as FlashcardModel
from app.models.tables import FlashcardDeck as FlashcardDeckModel
from app.models.tables import User
from app.schemas.deck import (
    Deck,
    DeckCreate,
    DeckUpdate,
    DeckWithCards,
    DeckWithCount,
    GenerateIntoDeckRequest,
    MoveDeckBody,
)
from app.schemas.flashcard import Flashcard
from app.services.flashcard import generate_flashcards

router = APIRouter(prefix="/decks", tags=["Decks"])


@router.get("/", response_model=list[DeckWithCount])
async def list_decks(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    stmt = (
        select(
            FlashcardDeckModel,
            func.count(FlashcardModel.id).label("card_count"),
        )
        .outerjoin(FlashcardModel, FlashcardModel.deck_id == FlashcardDeckModel.id)
        .where(FlashcardDeckModel.user_id == current_user.id)
        .group_by(FlashcardDeckModel.id)
        .order_by(FlashcardDeckModel.name)
    )
    rows = db.execute(stmt).all()
    result = []
    for deck, card_count in rows:
        d = DeckWithCount(
            id=deck.id,
            user_id=deck.user_id,
            folder_id=deck.folder_id,
            name=deck.name,
            description=deck.description,
            created_at=deck.created_at,
            updated_at=deck.updated_at,
            card_count=card_count,
        )
        result.append(d)
    return result


@router.post("/", response_model=Deck, status_code=status.HTTP_201_CREATED)
async def create_deck(
    body: DeckCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    deck = FlashcardDeckModel(
        id=uuid4(),
        user_id=current_user.id,
        folder_id=body.folder_id,
        name=body.name,
        description=body.description,
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)
    return deck


@router.get("/{deck_id}", response_model=DeckWithCards)
async def get_deck(
    deck_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    deck = db.query(FlashcardDeckModel).filter(FlashcardDeckModel.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    cards = (
        db.query(FlashcardModel)
        .filter(FlashcardModel.deck_id == deck.id)
        .order_by(FlashcardModel.created_at)
        .all()
    )
    return DeckWithCards(
        id=deck.id,
        user_id=deck.user_id,
        folder_id=deck.folder_id,
        name=deck.name,
        description=deck.description,
        created_at=deck.created_at,
        updated_at=deck.updated_at,
        flashcards=[Flashcard.model_validate(c) for c in cards],
    )


@router.patch("/{deck_id}", response_model=Deck)
async def update_deck(
    deck_id: str,
    body: DeckUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    deck = db.query(FlashcardDeckModel).filter(FlashcardDeckModel.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if body.name is not None:
        deck.name = body.name
    if body.description is not None:
        deck.description = body.description
    db.commit()
    db.refresh(deck)
    return deck


@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deck(
    deck_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    deck = db.query(FlashcardDeckModel).filter(FlashcardDeckModel.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(deck)
    db.commit()


@router.patch("/{deck_id}/move", response_model=Deck)
async def move_deck(
    deck_id: str,
    body: MoveDeckBody,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    deck = db.query(FlashcardDeckModel).filter(FlashcardDeckModel.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    deck.folder_id = body.folder_id
    db.commit()
    db.refresh(deck)
    return deck


@router.post("/{deck_id}/generate", response_model=DeckWithCards)
async def generate_into_deck(
    deck_id: str,
    body: GenerateIntoDeckRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    deck = db.query(FlashcardDeckModel).filter(FlashcardDeckModel.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    result = generate_flashcards(
        user_id=current_user.id,
        count=body.count,
        db=db,
        deck_id=deck.id,
    )

    return DeckWithCards(
        id=deck.id,
        user_id=deck.user_id,
        folder_id=deck.folder_id,
        name=deck.name,
        description=deck.description,
        created_at=deck.created_at,
        updated_at=deck.updated_at,
        flashcards=[Flashcard.model_validate(c) for c in result.flashcards],
    )
