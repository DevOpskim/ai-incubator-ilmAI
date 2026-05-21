from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.db.session import get_db
from app.models.tables import User
from app.schemas.gap import GapReport
from app.services.gaps import generate_gap_report, get_latest_report

router = APIRouter(prefix="/gaps", tags=["Knowledge Gaps"])


@router.get("/report", response_model=GapReport | None)
async def report(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> GapReport | None:
    return get_latest_report(user_id=current_user.id, db=db)


@router.post("/refresh", response_model=GapReport)
async def refresh(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> GapReport:
    return generate_gap_report(user_id=current_user.id, db=db)
