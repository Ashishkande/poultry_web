from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies.auth import require_active_user
from app.models.user import User
from app.schemas.batch import BatchCreate, BatchUpdate, BatchResponse
from app.services.batch_service import BatchService

router = APIRouter(prefix="/batches", tags=["Batches"])

@router.get("", response_model=List[BatchResponse])
def get_batches(
    farm_id: Optional[int] = Query(None),
    shade_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    return BatchService.get_batches(
        db=db,
        user=current_user,
        farm_id=farm_id,
        shade_id=shade_id,
        status_filter=status
    )

@router.post("", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
def create_batch(
    batch_in: BatchCreate,
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    return BatchService.create_batch(db=db, user=current_user, batch_in=batch_in)

@router.get("/{batch_id}", response_model=BatchResponse)
def get_batch(
    batch_id: int,
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    batch = BatchService.get_batch_by_id(db=db, batch_id=batch_id, user=current_user)
    return BatchService.enrich_batch_data(db, batch)

@router.put("/{batch_id}", response_model=BatchResponse)
def update_batch(
    batch_id: int,
    batch_in: BatchUpdate,
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    return BatchService.update_batch(db=db, batch_id=batch_id, user=current_user, batch_in=batch_in)
