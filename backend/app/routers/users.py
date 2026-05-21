from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.db.session import get_db
from app.models.tables import Goal, Session as SessionModel, Topic, User
from app.schemas.user import (
    GoalSchema,
    LearningRoadmap,
    ProfileResponse,
    UserStats,
    UserProfile,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    """Get the current user's profile with stats, goals, and roadmap."""
    # Calculate user stats
    total_sessions = db.query(func.count()).select_from(SessionModel).filter(
        SessionModel.user_id == current_user.id
    ).scalar() or 0

    topics_covered = db.query(func.count()).select_from(Topic).filter(
        Topic.user_id == current_user.id
    ).scalar() or 0

    # Calculate average knowledge score from quizzes
    from app.models.tables import Quiz
    quiz_result = db.query(func.avg(Quiz.score_percent)).filter(
        Quiz.user_id == current_user.id
    ).scalar()
    average_knowledge_score = float(quiz_result) if quiz_result else None

    stats = UserStats(
        total_sessions=total_sessions,
        topics_covered=topics_covered,
        average_knowledge_score=average_knowledge_score,
    )

    # Get user goals
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    goals_list = [
        GoalSchema(
            id=g.id,
            description=g.description,
            target_date=g.target_date,
            created_at=g.created_at,
        )
        for g in goals
    ]

    # Get user's topics with roadmap info
    topics = db.query(Topic).filter(Topic.user_id == current_user.id).all()
    roadmap = [
        LearningRoadmap(
            topic_id=t.id,
            topic_name=t.name,
            current_stage=t.current_stage.value,
            next_stage=get_next_stage(t.current_stage),
        )
        for t in topics
    ]

    user_profile = UserProfile(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
        preferred_language=current_user.preferred_language,
        created_at=current_user.created_at,
    )

    return ProfileResponse(
        user=user_profile,
        stats=stats,
        goals=goals_list,
        roadmap=roadmap,
    )


def get_next_stage(current_stage: str) -> str | None:
    """Get the next stage in the roadmap."""
    stages = ["fundamentals", "basic", "advanced"]
    try:
        idx = stages.index(current_stage)
        if idx < len(stages) - 1:
            return stages[idx + 1]
        return None
    except ValueError:
        return None
