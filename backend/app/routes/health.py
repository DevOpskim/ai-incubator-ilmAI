from fastapi import APIRouter, HTTPException

from app.db.session import check_database_connection

router = APIRouter()


@router.get("/health")
async def health():
    db_ok = False
    try:
        db_ok = check_database_connection()
    except Exception:
        db_ok = False

    if not db_ok:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "degraded",
                "message": "Ilm AI MVP backend is running but database is unavailable",
                "database": "unavailable",
            },
        )

    return {
        "status": "ok",
        "message": "Ilm AI MVP backend is running",
        "database": "connected",
    }
