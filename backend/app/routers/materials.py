from pathlib import Path
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Request, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.db.session import get_db
from app.models.tables import Material as MaterialModel, Upload as UploadModel
from app.processing import process_material_upload
from app.schemas.material import Material, Upload
from app.models.tables import User

router = APIRouter(prefix="/materials", tags=["Materials"])

UPLOAD_DIR = Path("uploads").resolve()
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_material(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    topic_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    allowed_extensions = {".pdf", ".doc", ".docx", ".txt", ".rtf"}
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": f"File type not allowed. Allowed: {', '.join(allowed_extensions)}"},
        )

    MAX_SIZE = 10 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        return JSONResponse(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            content={"message": "File too large. Maximum size is 10 MB."},
        )

    file_id = uuid4()
    filename = f"{file_id}{file_ext}"
    file_path = UPLOAD_DIR / filename
    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except IOError as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to save file: {str(e)}"},
        )

    material = MaterialModel(
        id=file_id,
        user_id=current_user.id,
        topic_id=topic_id,
        title=file.filename,
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    upload = UploadModel(
        id=uuid4(),
        material_id=material.id,
        original_filename=file.filename,
        storage_path=str(file_path),
        content_type=file.content_type,
        size_bytes=len(content),
        status="pending",
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    background_tasks.add_task(process_material_upload, upload_id=str(upload.id))

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "message": "File uploaded successfully",
            "material_id": str(material.id),
            "upload_id": str(upload.id),
            "filename": file.filename,
            "size_bytes": upload.size_bytes,
        },
    )


@router.get("/materials", response_model=List[Material])
async def list_materials(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> List[Material]:
    stmt = select(MaterialModel).where(MaterialModel.user_id == current_user.id)
    materials = db.scalars(stmt).all()
    return materials


@router.get("/uploads", response_model=List[Upload])
async def list_uploads(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> List[Upload]:
    stmt = select(UploadModel).join(MaterialModel).where(
        UploadModel.material_id == MaterialModel.id
    ).where(MaterialModel.user_id == current_user.id)
    uploads = db.scalars(stmt).all()
    return uploads


@router.get("/upload/{upload_id}/status", response_model=Upload)
async def get_upload_status(
    upload_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Upload:
    upload = db.query(UploadModel).filter(UploadModel.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    material = db.query(MaterialModel).filter(MaterialModel.id == upload.material_id).first()
    if not material or material.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return upload
