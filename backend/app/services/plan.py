import json
from datetime import date, datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models.tables import Goal, LearningPlan, Quiz, ReviewQueueItem, Topic
from app.schemas.plan import GoalCreate, Plan, PlanDay
from app.services.llm import generate_text


def create_goal(
    user_id: UUID,
    body: GoalCreate,
    db: Session,
) -> Goal:
    goal = Goal(
        id=uuid4(),
        user_id=user_id,
        description=body.description,
        target_date=body.target_date,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    return Goal(
        id=goal.id,
        description=goal.description,
        target_date=goal.target_date,
        daily_minutes=body.daily_minutes,
        created_at=goal.created_at,
    )


def list_goals(
    user_id: UUID,
    db: Session,
) -> list[Goal]:
    goals = (
        db.query(Goal)
        .filter(Goal.user_id == user_id)
        .order_by(Goal.created_at.desc())
        .all()
    )
    return [
        Goal(
            id=g.id,
            description=g.description,
            target_date=g.target_date,
            daily_minutes=30,
            created_at=g.created_at,
        )
        for g in goals
    ]


def generate_plan(
    user_id: UUID,
    goal_id: UUID | None,
    db: Session,
) -> Plan:
    if goal_id:
        goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
    else:
        goal = (
            db.query(Goal)
            .filter(Goal.user_id == user_id)
            .order_by(Goal.created_at.desc())
            .first()
        )

    if not goal:
        raise ValueError("No goal found. Create a goal first.")

    topics = (
        db.query(Topic)
        .filter(Topic.user_id == user_id)
        .all()
    )
    topic_names = [t.name for t in topics]

    quizzes = (
        db.query(Quiz)
        .filter(Quiz.user_id == user_id)
        .order_by(Quiz.created_at.desc())
        .limit(20)
        .all()
    )
    avg_score = 0
    if quizzes:
        scores = [q.score_percent or 0 for q in quizzes]
        avg_score = sum(scores) / len(scores)

    review_items = (
        db.query(ReviewQueueItem)
        .filter(ReviewQueueItem.user_id == user_id)
        .all()
    )
    cards_mastered = sum(1 for r in review_items if r.repetitions >= 3)

    today = date.today()
    days_until = (goal.target_date - today).days if goal.target_date else 14
    if days_until < 1:
        days_until = 7

    prompt = (
        "You are a personalized study plan generator. Create a day-by-day learning plan "
        "based on the student's goal, materials, and progress.\n\n"
        "GOAL: {goal}\n"
        "TARGET DATE: {target_date} ({days_until} days from now)\n"
        "TOPICS/SUBJECTS: {topics}\n"
        "AVERAGE QUIZ SCORE: {avg_score:.1f}%\n"
        "FLASHCARDS MASTERED: {cards_mastered}\n\n"
        "Create a plan with exactly {days_until} days. "
        "Each day must include specific, actionable tasks tied to real topics. "
        "Never give generic advice like 'review your notes'.\n\n"
        "Return a JSON object with:\n"
        "- summary (string, 2-3 sentence overview of the plan)\n"
        '- days (array of objects, each with:\n'
        "  - day (integer, 1-indexed)\n"
        "  - title (string, short theme for the day)\n"
        "  - tasks (array of strings, specific actionable steps)\n"
        "  - materials (array of strings, topic names to focus on)\n"
        ")\n\n"
        "Return ONLY the JSON object."
    ).format(
        goal=goal.description,
        target_date=goal.target_date or "Not set",
        days_until=days_until,
        topics=", ".join(topic_names) if topic_names else "Uploaded materials",
        avg_score=avg_score,
        cards_mastered=cards_mastered,
    )

    raw = generate_text(prompt, temperature=0.7, max_tokens=4000)
    raw = raw.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    if raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    raw = raw.strip()

    try:
        plan_data = json.loads(raw)
    except json.JSONDecodeError:
        plan_data = {"summary": "Unable to generate plan.", "days": []}

    days = [PlanDay(**d) for d in plan_data.get("days", [])]

    existing = (
        db.query(LearningPlan)
        .filter(LearningPlan.user_id == user_id, LearningPlan.goal_id == goal.id)
        .first()
    )

    plan_json = {"summary": plan_data.get("summary", ""), "days": [d.model_dump() for d in days]}

    if existing:
        existing.plan_json = plan_json
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
    else:
        existing = LearningPlan(
            id=uuid4(),
            user_id=user_id,
            goal_id=goal.id,
            plan_json=plan_json,
        )
        db.add(existing)
        db.commit()
        db.refresh(existing)

    return Plan(
        goal=Goal(
            id=goal.id,
            description=goal.description,
            target_date=goal.target_date,
            daily_minutes=30,
            created_at=goal.created_at,
        ),
        summary=plan_data.get("summary", ""),
        days=days,
        created_at=existing.created_at,
    )


def get_plan(
    user_id: UUID,
    db: Session,
) -> Plan | None:
    plan = (
        db.query(LearningPlan)
        .filter(LearningPlan.user_id == user_id)
        .order_by(LearningPlan.created_at.desc())
        .first()
    )
    if not plan:
        return None

    goal = db.query(Goal).filter(Goal.id == plan.goal_id).first()
    if not goal:
        return None

    days = [PlanDay(**d) for d in plan.plan_json.get("days", [])]

    return Plan(
        goal=Goal(
            id=goal.id,
            description=goal.description,
            target_date=goal.target_date,
            daily_minutes=30,
            created_at=goal.created_at,
        ),
        summary=plan.plan_json.get("summary", ""),
        days=days,
        created_at=plan.created_at,
    )
