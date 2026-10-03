from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash
from app.dependencies.auth import get_current_user, require_manager
from app.models.user import User
from app.models.farm import Farm, FarmManager
from app.models.batch import Batch
from app.models.mortality import MortalityRecord
from app.schemas.user import UserResponse, ProfileUpdateRequest, PasswordChangeRequest
from app.services.audit_service import AuditService

router = APIRouter(prefix="/managers", tags=["Managers"])

@router.get("/me", response_model=UserResponse)
def get_manager_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/status")
def get_manager_status(current_user: User = Depends(get_current_user)):
    return {
        "status": current_user.status,
        "email_verified": current_user.email_verified,
        "role": current_user.role,
        "name": current_user.name
    }

@router.get("/dashboard")
def get_manager_dashboard(
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db)
):
    today = date.today()

    assigned_farm_ids = [
        r[0] for r in db.query(FarmManager.farm_id)
        .filter(FarmManager.manager_id == current_user.id, FarmManager.status == "ACTIVE")
        .all()
    ]
    owned_farm_ids = [
        r[0] for r in db.query(Farm.id).filter(Farm.created_by == current_user.id).all()
    ]
    allowed_farm_ids = list(set(assigned_farm_ids + owned_farm_ids))

    total_farms = len(allowed_farm_ids)

    active_batches = (
        db.query(Batch)
        .filter(Batch.farm_id.in_(allowed_farm_ids), Batch.status == "ACTIVE")
        .count()
    )

    total_birds = (
        db.query(func.coalesce(func.sum(Batch.current_birds), 0))
        .filter(Batch.farm_id.in_(allowed_farm_ids), Batch.status == "ACTIVE")
        .scalar()
    )

    initial_birds = (
        db.query(func.coalesce(func.sum(Batch.initial_birds), 0))
        .filter(Batch.farm_id.in_(allowed_farm_ids))
        .scalar()
    )

    total_mortality = (
        db.query(func.coalesce(func.sum(MortalityRecord.mortality_count), 0))
        .filter(MortalityRecord.farm_id.in_(allowed_farm_ids))
        .scalar()
    )

    today_mortality = (
        db.query(func.coalesce(func.sum(MortalityRecord.mortality_count), 0))
        .filter(MortalityRecord.farm_id.in_(allowed_farm_ids), MortalityRecord.mortality_date == today)
        .scalar()
    )

    mortality_percentage = (
        round((total_mortality / initial_birds) * 100.0, 2) if initial_birds > 0 else 0.0
    )

    # Recent submissions
    recent_records = (
        db.query(MortalityRecord)
        .filter(MortalityRecord.farm_id.in_(allowed_farm_ids))
        .order_by(MortalityRecord.created_at.desc())
        .limit(5)
        .all()
    )

    recent_feed = [
        {
            "id": r.id,
            "farm_name": r.farm.name,
            "shade_name": r.shade.name,
            "batch_number": r.batch.batch_number,
            "count": r.mortality_count,
            "reason": r.reason,
            "date": r.mortality_date.strftime("%d-%m-%Y"),
            "created_at": r.created_at
        }
        for r in recent_records
    ]

    return {
        "kpis": {
            "my_farms": total_farms,
            "active_batches": active_batches,
            "total_birds": total_birds,
            "today_mortality": today_mortality,
            "total_mortality": total_mortality,
            "mortality_percentage": mortality_percentage
        },
        "recent_feed": recent_feed
    }

@router.put("/profile", response_model=UserResponse)
def update_profile(
    req: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.name = req.name.strip()
    current_user.phone = req.phone.strip()
    db.commit()
    db.refresh(current_user)

    AuditService.log(
        db=db,
        action="PROFILE_UPDATED",
        entity_type="User",
        entity_id=current_user.id,
        user_id=current_user.id
    )
    return current_user

@router.post("/change-password")
def change_password(
    req: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    current_user.password_hash = get_password_hash(req.new_password)
    db.commit()

    AuditService.log(
        db=db,
        action="PASSWORD_CHANGED",
        entity_type="User",
        entity_id=current_user.id,
        user_id=current_user.id
    )
    return {"success": True, "message": "Password changed successfully."}
