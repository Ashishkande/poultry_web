from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies.auth import require_active_user
from app.models.user import User
from app.schemas.mortality import MortalityCreate, MortalityUpdate, MortalityResponse
from app.services.mortality_service import MortalityService

router = APIRouter(prefix="/mortality", tags=["Mortality"])

@router.post("", status_code=status.HTTP_201_CREATED)
def add_mortality(
    mort_in: MortalityCreate,
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    return MortalityService.add_mortality(db=db, user=current_user, mort_in=mort_in)

@router.get("", response_model=List[MortalityResponse])
def get_mortalities(
    farm_id: Optional[int] = Query(None),
    shade_id: Optional[int] = Query(None),
    batch_id: Optional[int] = Query(None),
    manager_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    return MortalityService.get_mortality_records(
        db=db,
        user=current_user,
        farm_id=farm_id,
        shade_id=shade_id,
        batch_id=batch_id,
        manager_id=manager_id,
        start_date=start_date,
        end_date=end_date,
        search=search
    )

@router.put("/{record_id}")
def update_mortality(
    record_id: int,
    mort_in: MortalityUpdate,
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    return MortalityService.update_mortality(
        db=db,
        record_id=record_id,
        user=current_user,
        mort_in=mort_in
    )

@router.delete("/{record_id}")
def delete_mortality(
    record_id: int,
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    return MortalityService.delete_mortality(
        db=db,
        record_id=record_id,
        user=current_user
    )
