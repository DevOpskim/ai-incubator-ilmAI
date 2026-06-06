from fastapi import APIRouter, Depends, HTTPException
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
    try:
        return generate_gap_report(user_id=current_user.id, db=db)
    except Exception as e:
        msg = str(e)
        if "rate limit" in msg.lower() or "rate_limit" in msg:
            detail = "AI provider rate limit reached. Please wait and try again later, or switch to a different provider."
        else:
            detail = msg
        raise HTTPException(status_code=429 if "rate" in msg.lower() else 500, detail=detail)
