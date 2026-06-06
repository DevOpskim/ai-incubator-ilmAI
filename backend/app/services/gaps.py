import json
from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models.tables import GapReport as GapReportModel
from app.models.tables import Quiz as QuizModel
from app.models.tables import ReviewQueueItem as ReviewQueueItemModel
from app.schemas.gap import GapReport
from app.services.llm import generate_text


def generate_gap_report(
    user_id: UUID,
    db: Session,
) -> GapReport:
    quizzes = (
        db.query(QuizModel)
        .filter(QuizModel.user_id == user_id)
        .order_by(QuizModel.created_at.desc())
        .limit(20)
        .all()
    )

    review_items = (
        db.query(ReviewQueueItemModel)
        .filter(ReviewQueueItemModel.user_id == user_id)
        .all()
    )

    quiz_data = []
    for q in quizzes:
        quiz_data.append({
            "difficulty": q.difficulty,
            "score_percent": q.score_percent,
            "question_count": q.question_count,
            "date": q.created_at.isoformat() if q.created_at else None,
        })

    review_data = []
    for r in review_items:
        review_data.append({
            "interval_days": r.interval_days,
            "repetitions": r.repetitions,
            "ease_factor": r.ease_factor,
            "due_at": r.due_at.isoformat() if r.due_at else None,
        })

    avg_score = 0
    if quiz_data:
        scores = [q["score_percent"] or 0 for q in quiz_data]
        avg_score = sum(scores) / len(scores)

    cards_mastered = sum(1 for r in review_data if r["repetitions"] >= 3)
    total_cards = len(review_data)

    prompt = (
        "You are an AI learning analyst. Analyze this student's performance data "
        "and produce a knowledge gap report.\n\n"
        "QUIZ HISTORY:\n{quiz_data}\n\n"
        "FLASHCARD REVIEW DATA:\n{review_data}\n\n"
        "SUMMARY STATS:\n"
        "- Average quiz score: {avg_score:.1f}%\n"
        "- Flashcards mastered (3+ reviews): {cards_mastered}/{total_cards}\n"
        "- Total quizzes taken: {quiz_count}\n\n"
        "Return a JSON object with these fields:\n"
        "- summary (string, 2-3 sentence plain-language overall assessment)\n"
        "- strengths (array of objects with 'area' and 'details' strings)\n"
        "- weaknesses (array of objects with 'area' and 'details' strings, "
        "and optional 'recommendation' string)\n\n"
        "Focus on real patterns from the data. Be specific, not generic. "
        "Avoid jargon. Return ONLY the JSON object."
    ).format(
        quiz_data=json.dumps(quiz_data, indent=2),
        review_data=json.dumps(review_data, indent=2),
        avg_score=avg_score,
        cards_mastered=cards_mastered,
        total_cards=max(total_cards, 1),
        quiz_count=len(quiz_data),
    )

    raw = generate_text(prompt, temperature=0.5, max_tokens=2000)
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        raw = raw[start:end+1]
    raw = raw.strip()

    try:
        report_data = json.loads(raw)
    except json.JSONDecodeError:
        print(f"GAPS_DEBUG: LLM raw length={len(raw)}, first 300 chars: {raw[:300]}")
        report_data = {
            "summary": "Unable to generate report from available data.",
            "strengths": [],
            "weaknesses": [],
        }

    existing = (
        db.query(GapReportModel)
        .filter(GapReportModel.user_id == user_id)
        .order_by(GapReportModel.created_at.desc())
        .first()
    )

    if existing:
        existing.summary = report_data.get("summary", existing.summary)
        existing.strengths = report_data.get("strengths", existing.strengths)
        existing.weaknesses = report_data.get("weaknesses", existing.weaknesses)
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return GapReport.model_validate(existing)
    else:
        report = GapReportModel(
            id=uuid4(),
            user_id=user_id,
            summary=report_data.get("summary", ""),
            strengths=report_data.get("strengths", []),
            weaknesses=report_data.get("weaknesses", []),
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return GapReport.model_validate(report)


def get_latest_report(
    user_id: UUID,
    db: Session,
) -> GapReport | None:
    report = (
        db.query(GapReportModel)
        .filter(GapReportModel.user_id == user_id)
        .order_by(GapReportModel.created_at.desc())
        .first()
    )
    if report:
        return GapReport.model_validate(report)
    return None
