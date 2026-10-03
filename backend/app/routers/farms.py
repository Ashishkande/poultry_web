from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_active_user, require_admin
from app.models.user import User
from app.models.farm import Farm, FarmManager
from app.models.shade import Shade
from app.models.batch import Batch
from app.schemas.farm import FarmCreate, FarmUpdate, FarmResponse, FarmManagerInfo
from app.services.farm_service import FarmService

router = APIRouter(prefix="/farms", tags=["Farms"])

def serialize_farm(farm: Farm, db: Session) -> FarmResponse:
    shades_cnt = db.query(Shade).filter(Shade.farm_id == farm.id).count()
    batches_cnt = db.query(Batch).filter(Batch.farm_id == farm.id, Batch.status == "ACTIVE").count()
    total_birds = db.query(func.coalesce(func.sum(Batch.current_birds), 0)).filter(
        Batch.farm_id == farm.id, Batch.status == "ACTIVE"
    ).scalar()

    assigned_managers = (
        db.query(User)
        .join(FarmManager, User.id == FarmManager.manager_id)
        .filter(FarmManager.farm_id == farm.id, FarmManager.status == "ACTIVE")
        .all()
    )

    return FarmResponse(
        id=farm.id,
        name=farm.name,
        code=farm.code,
        location=farm.location,
        address=farm.address,
        contact_number=farm.contact_number,
        status=farm.status,
        created_by=farm.created_by,
        shades_count=shades_cnt,
        batches_count=batches_cnt,
        total_birds=total_birds,
        managers=[FarmManagerInfo(id=m.id, name=m.name, email=m.email, phone=m.phone) for m in assigned_managers],
        created_at=farm.created_at,
        updated_at=farm.updated_at
    )

@router.get("", response_model=List[FarmResponse])
def get_farms(
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    farms = FarmService.get_farms(db=db, user=current_user, search=search)
    return [serialize_farm(f, db) for f in farms]

@router.post("", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
def create_farm(
    farm_in: FarmCreate,
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    farm = FarmService.create_farm(db=db, user=current_user, farm_in=farm_in)
    return serialize_farm(farm, db)

@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm(
    farm_id: int,
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    farm = FarmService.get_farm_by_id(db=db, farm_id=farm_id, user=current_user)
    return serialize_farm(farm, db)

@router.put("/{farm_id}", response_model=FarmResponse)
def update_farm(
    farm_id: int,
    farm_in: FarmUpdate,
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    farm = FarmService.update_farm(db=db, farm_id=farm_id, user=current_user, farm_in=farm_in)
    return serialize_farm(farm, db)

@router.delete("/{farm_id}")
def delete_farm(
    farm_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    FarmService.delete_farm(db=db, farm_id=farm_id, user=current_user)
    return {"success": True, "message": "Farm deleted successfully."}
