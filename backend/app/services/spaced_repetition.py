from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.tables import ReviewQueueItem


def sm2_next_interval(
    repetitions: int,
    ease_factor: float,
    quality: int,
    previous_interval: int = 0,
) -> tuple[int, float, int]:
    if quality < 3:
        return 1, max(ease_factor, 1.3), 0

    if repetitions == 0:
        interval = 1
    elif repetitions == 1:
        interval = 6
    else:
        interval = round(previous_interval * ease_factor)

    new_ease = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if new_ease < 1.3:
        new_ease = 1.3

    return interval, new_ease, repetitions + 1


def update_review_queue(
    review_queue_id: str,
    quality: int,
    db: Session,
) -> ReviewQueueItem:
    item = db.query(ReviewQueueItem).filter(ReviewQueueItem.id == review_queue_id).first()
    if not item:
        raise ValueError("Review queue item not found")

    interval, ease, reps = sm2_next_interval(
        repetitions=item.repetitions,
        ease_factor=item.ease_factor,
        quality=quality,
        previous_interval=item.interval_days,
    )

    item.interval_days = interval
    item.ease_factor = ease
    item.repetitions = reps
    item.due_at = datetime.now(timezone.utc) + timedelta(days=interval)
    db.commit()
    db.refresh(item)

    return item
