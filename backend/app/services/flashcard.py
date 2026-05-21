import json
from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models.tables import Flashcard as FlashcardModel
from app.models.tables import FlashcardNoteType
from app.models.tables import ReviewQueueItem as ReviewQueueItemModel
from app.schemas.flashcard import DueCard, Flashcard, GenerateResponse
from app.services.llm import get_client
from app.services.retrieval import search_chunks


def generate_flashcards(
    user_id: UUID,
    count: int,
    db: Session,
) -> GenerateResponse:
    query = "Generate flashcards from my study materials covering key concepts, definitions, and important facts"
    chunks = search_chunks(query=query, user_id=user_id, db=db, limit=15)

    context = "\n\n".join(
        f"[Source: {c.source_ref or 'unknown'}]\n{c.content}" for c in chunks
    )

    prompt = (
        "You are a flashcard generator. Create exactly {count} flashcards "
        "based ONLY on the provided study material.\n\n"
        "CONTEXT:\n{context}\n\n"
        "Return a JSON array of objects with these fields:\n"
        "- front (string, the question or prompt)\n"
        "- back (string, the answer)\n"
        "- source_ref (string, the source reference)\n\n"
        "Make the front concise and the back complete but not verbose. "
        "Focus on key concepts, definitions, relationships, and important facts. "
        "Return ONLY the JSON array."
    ).format(count=count, context=context)

    client = get_client()
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=4000,
    )

    raw = response.choices[0].message.content or "[]"
    raw = raw.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    if raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    raw = raw.strip()

    try:
        cards_data = json.loads(raw)
    except json.JSONDecodeError:
        cards_data = []

    basic_type = db.query(FlashcardNoteType).filter(
        FlashcardNoteType.code == "basic"
    ).first()
    if not basic_type:
        basic_type = FlashcardNoteType(code="basic", label="Basic")
        db.add(basic_type)
        db.commit()
        db.refresh(basic_type)

    flashcards = []
    for c in cards_data:
        card = FlashcardModel(
            id=uuid4(),
            user_id=user_id,
            front=c.get("front", ""),
            back=c.get("back", ""),
            note_type_id=basic_type.id,
        )
        db.add(card)
        db.commit()
        db.refresh(card)
        flashcards.append(card)

    return GenerateResponse(
        flashcards=[Flashcard.model_validate(f) for f in flashcards]
    )


def get_due_cards(
    user_id: UUID,
    db: Session,
    limit: int = 20,
) -> list[DueCard]:
    now = datetime.now(timezone.utc)
    items = (
        db.query(ReviewQueueItemModel)
        .filter(
            ReviewQueueItemModel.user_id == user_id,
            ReviewQueueItemModel.due_at <= now,
        )
        .order_by(ReviewQueueItemModel.due_at.asc())
        .limit(limit)
        .all()
    )

    due = []
    for item in items:
        card = db.query(FlashcardModel).filter(FlashcardModel.id == item.flashcard_id).first()
        if card:
            due.append(DueCard(
                flashcard=Flashcard.model_validate(card),
                review_queue_id=item.id,
                due_at=item.due_at,
                interval_days=item.interval_days,
                repetitions=item.repetitions,
                ease_factor=item.ease_factor,
            ))

    return due


def enqueue_flashcard(flashcard_id: UUID, user_id: UUID, db: Session):
    existing = (
        db.query(ReviewQueueItemModel)
        .filter(
            ReviewQueueItemModel.flashcard_id == flashcard_id,
            ReviewQueueItemModel.user_id == user_id,
        )
        .first()
    )
    if existing:
        return

    item = ReviewQueueItemModel(
        id=uuid4(),
        user_id=user_id,
        flashcard_id=flashcard_id,
        due_at=datetime.now(timezone.utc),
        interval_days=1,
        repetitions=0,
        ease_factor=2.5,
    )
    db.add(item)
    db.commit()
