from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.db.session import get_db
from app.models.tables import User
from app.schemas.plan import Goal, GoalCreate, Plan
from app.services.plan import create_goal, generate_plan, get_plan, list_goals

router = APIRouter(prefix="/plan", tags=["Learning Plan"])


@router.post("/goals", response_model=Goal, status_code=201)
async def create_goal_endpoint(
    body: GoalCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Goal:
    return create_goal(user_id=current_user.id, body=body, db=db)


@router.get("/goals", response_model=list[Goal])
async def list_goals_endpoint(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> list[Goal]:
    return list_goals(user_id=current_user.id, db=db)


@router.get("/current", response_model=Plan | None)
async def current_plan(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Plan | None:
    return get_plan(user_id=current_user.id, db=db)


@router.post("/generate", response_model=Plan)
async def generate(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Plan:
    try:
        return generate_plan(user_id=current_user.id, goal_id=None, db=db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
