from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.dependencies.auth import require_active_user
from app.models.user import User
from app.models.shade import Shade
from app.models.batch import Batch
from app.schemas.shade import ShadeCreate, ShadeUpdate, ShadeResponse
from app.services.shade_service import ShadeService

router = APIRouter(tags=["Shades"])

def serialize_shade(shade: Shade, db: Session) -> ShadeResponse:
    active_b = db.query(Batch).filter(Batch.shade_id == shade.id, Batch.status == "ACTIVE").count()
    current_birds = db.query(func.coalesce(func.sum(Batch.current_birds), 0)).filter(
        Batch.shade_id == shade.id, Batch.status == "ACTIVE"
    ).scalar()

    return ShadeResponse(
        id=shade.id,
        farm_id=shade.farm_id,
        shade_number=shade.shade_number,
        name=shade.name,
        capacity=shade.capacity,
        status=shade.status,
        active_batches_count=active_b,
        current_birds=current_birds,
        created_at=shade.created_at
    )

@router.get("/farms/{farm_id}/shades", response_model=List[ShadeResponse])
def get_shades_for_farm(
    farm_id: int,
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    shades = ShadeService.get_shades_for_farm(db=db, farm_id=farm_id, user=current_user)
    return [serialize_shade(s, db) for s in shades]

@router.post("/farms/{farm_id}/shades", response_model=ShadeResponse, status_code=status.HTTP_201_CREATED)
def create_shade(
    farm_id: int,
    shade_in: ShadeCreate,
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    shade = ShadeService.create_shade(db=db, farm_id=farm_id, user=current_user, shade_in=shade_in)
    return serialize_shade(shade, db)

@router.put("/shades/{shade_id}", response_model=ShadeResponse)
def update_shade(
    shade_id: int,
    shade_in: ShadeUpdate,
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    shade = ShadeService.update_shade(db=db, shade_id=shade_id, user=current_user, shade_in=shade_in)
    return serialize_shade(shade, db)

@router.delete("/shades/{shade_id}")
def delete_shade(
    shade_id: int,
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    ShadeService.delete_shade(db=db, shade_id=shade_id, user=current_user)
    return {"success": True, "message": "Shade deleted successfully."}
