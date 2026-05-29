from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.auth import get_current_active_user
from app.db.session import get_db
from app.models.tables import Folder as FolderModel
from app.models.tables import Material as MaterialModel
from app.models.tables import User
from app.schemas.folder import Folder, FolderCreate, FolderTree, FolderUpdate, MoveMaterialBody

router = APIRouter(prefix="/folders", tags=["Folders"])


@router.get("/", response_model=list[Folder])
async def list_folders(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    stmt = select(FolderModel).where(
        FolderModel.user_id == current_user.id
    ).order_by(FolderModel.name)
    folders = db.scalars(stmt).all()
    return folders


@router.get("/tree", response_model=list[FolderTree])
async def folder_tree(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    all_folders = db.scalars(
        select(FolderModel)
        .where(FolderModel.user_id == current_user.id)
        .options(joinedload(FolderModel.materials))
        .order_by(FolderModel.name)
    ).unique().all()

    folder_map = {}
    for f in all_folders:
        folder_map[f.id] = FolderTree(
            id=f.id,
            user_id=f.user_id,
            parent_id=f.parent_id,
            name=f.name,
            created_at=f.created_at,
            updated_at=f.updated_at,
            children=[],
            materials=[{"id": str(m.id), "title": m.title} for m in f.materials],
        )

    roots = []
    for f_id, node in folder_map.items():
        if node.parent_id and node.parent_id in folder_map:
            folder_map[node.parent_id].children.append(node)
        else:
            roots.append(node)

    return roots


@router.post("/", response_model=Folder, status_code=status.HTTP_201_CREATED)
async def create_folder(
    body: FolderCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if body.parent_id:
        parent = db.query(FolderModel).filter(FolderModel.id == body.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")
        if parent.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    folder = FolderModel(
        id=uuid4(),
        user_id=current_user.id,
        parent_id=body.parent_id,
        name=body.name,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.patch("/{folder_id}", response_model=Folder)
async def update_folder(
    folder_id: str,
    body: FolderUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    folder = db.query(FolderModel).filter(FolderModel.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    if folder.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    folder.name = body.name
    db.commit()
    db.refresh(folder)
    return folder


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    folder = db.query(FolderModel).filter(FolderModel.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    if folder.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Move materials to root before deleting folder
    materials = db.query(MaterialModel).filter(
        MaterialModel.folder_id == folder.id
    ).all()
    for m in materials:
        m.folder_id = None

    db.delete(folder)
    db.commit()


@router.patch("/{folder_id}/move", response_model=Folder)
async def move_folder(
    folder_id: str,
    body: MoveMaterialBody,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    folder = db.query(FolderModel).filter(FolderModel.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    if folder.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Prevent circular reference
    if body.folder_id == folder.id:
        raise HTTPException(status_code=400, detail="Cannot move folder into itself")

    folder.parent_id = body.folder_id
    db.commit()
    db.refresh(folder)
    return folder
