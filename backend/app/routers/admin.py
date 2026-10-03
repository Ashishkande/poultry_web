from typing import List, Optional
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.models.farm import Farm, FarmManager
from app.models.shade import Shade
from app.models.batch import Batch
from app.models.mortality import MortalityRecord
from app.models.audit_log import AuditLog
from app.schemas.user import UserResponse, ManagerApprovalRequest, ManagerStatusToggleRequest
from app.schemas.audit import AuditLogResponse
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService
from app.services.email_service import EmailService

router = APIRouter(prefix="/admin", tags=["Admin Operations"], dependencies=[Depends(require_admin)])

@router.get("/dashboard")
def get_admin_dashboard(days: int = Query(30, ge=1, le=365), db: Session = Depends(get_db)):
    today = date.today()
    start_date = today - timedelta(days=days)

    total_farms = db.query(Farm).count()
    total_managers = db.query(User).filter(User.role == "MANAGER").count()
    pending_managers = db.query(User).filter(User.role == "MANAGER", User.status == "PENDING_ADMIN_APPROVAL").count()
    active_batches = db.query(Batch).filter(Batch.status == "ACTIVE").count()

    total_birds = db.query(func.coalesce(func.sum(Batch.current_birds), 0)).filter(Batch.status == "ACTIVE").scalar()
    initial_birds = db.query(func.coalesce(func.sum(Batch.initial_birds), 0)).scalar()
    total_mortality = db.query(func.coalesce(func.sum(MortalityRecord.mortality_count), 0)).scalar()

    today_mortality = (
        db.query(func.coalesce(func.sum(MortalityRecord.mortality_count), 0))
        .filter(MortalityRecord.mortality_date == today)
        .scalar()
    )

    overall_mortality_percentage = (
        round((total_mortality / initial_birds) * 100.0, 2) if initial_birds > 0 else 0.0
    )

    # Daily trend for charts
    daily_records = (
        db.query(
            MortalityRecord.mortality_date,
            func.sum(MortalityRecord.mortality_count).label("count")
        )
        .filter(MortalityRecord.mortality_date >= start_date)
        .group_by(MortalityRecord.mortality_date)
        .order_by(MortalityRecord.mortality_date)
        .all()
    )

    # Fill daily gap dates for chart
    daily_dict = {r[0]: r[1] for r in daily_records}
    trend_data = []
    curr = start_date
    while curr <= today:
        trend_data.append({
            "date": curr.strftime("%d-%m-%Y"),
            "iso_date": curr.isoformat(),
            "mortality": daily_dict.get(curr, 0)
        })
        curr += timedelta(days=1)

    # Farm-wise mortality
    farm_mortality_rows = (
        db.query(
            Farm.name,
            func.coalesce(func.sum(MortalityRecord.mortality_count), 0).label("mortality")
        )
        .outerjoin(MortalityRecord, Farm.id == MortalityRecord.farm_id)
        .group_by(Farm.id, Farm.name)
        .order_by(func.coalesce(func.sum(MortalityRecord.mortality_count), 0).desc())
        .limit(10)
        .all()
    )
    farm_wise_data = [{"farm": r[0], "mortality": r[1]} for r in farm_mortality_rows]

    # Reason-wise distribution
    reason_rows = (
        db.query(
            MortalityRecord.reason,
            func.coalesce(func.sum(MortalityRecord.mortality_count), 0).label("count")
        )
        .group_by(MortalityRecord.reason)
        .order_by(func.coalesce(func.sum(MortalityRecord.mortality_count), 0).desc())
        .all()
    )
    reasons_data = [{"reason": r[0], "count": r[1]} for r in reason_rows]

    # Recent mortality feed
    recent_records = (
        db.query(MortalityRecord)
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
            "manager_name": r.manager.name,
            "created_at": r.created_at
        }
        for r in recent_records
    ]

    return {
        "kpis": {
            "total_farms": total_farms,
            "total_managers": total_managers,
            "pending_managers": pending_managers,
            "active_batches": active_batches,
            "total_birds": total_birds,
            "today_mortality": today_mortality,
            "total_mortality": total_mortality,
            "overall_mortality_percentage": overall_mortality_percentage
        },
        "trends": trend_data,
        "farm_wise": farm_wise_data,
        "reason_wise": reasons_data,
        "recent_feed": recent_feed
    }

@router.get("/managers", response_model=List[UserResponse])
def get_all_managers(db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == "MANAGER").order_by(User.created_at.desc()).all()

@router.get("/managers/pending", response_model=List[UserResponse])
def get_pending_managers(db: Session = Depends(get_db)):
    return (
        db.query(User)
        .filter(User.role == "MANAGER", User.status == "PENDING_ADMIN_APPROVAL")
        .order_by(User.created_at.desc())
        .all()
    )

@router.post("/managers/{manager_id}/approve")
def approve_manager(
    manager_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == manager_id, User.role == "MANAGER").first()
    if not user:
        raise HTTPException(status_code=404, detail="Manager not found.")

    old_status = user.status
    user.status = "APPROVED"
    db.commit()
    db.refresh(user)

    # In-app notification for the manager
    NotificationService.create_notification(
        db=db,
        user_id=user.id,
        notification_type="MANAGER_APPROVED",
        title="Account Approved!",
        message="Your account has been approved by the administrator. You can now access all farm features.",
        metadata={"admin_id": admin_user.id}
    )

    EmailService.send_account_approved_email(user.email, user.name)

    AuditService.log(
        db=db,
        action="MANAGER_APPROVED",
        entity_type="User",
        entity_id=user.id,
        user_id=admin_user.id,
        old_data={"status": old_status},
        new_data={"status": "APPROVED"}
    )

    return {"success": True, "message": "Manager account approved successfully."}

@router.post("/managers/{manager_id}/reject")
def reject_manager(
    manager_id: int,
    req: Optional[ManagerApprovalRequest] = None,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == manager_id, User.role == "MANAGER").first()
    if not user:
        raise HTTPException(status_code=404, detail="Manager not found.")

    old_status = user.status
    user.status = "REJECTED"
    db.commit()
    db.refresh(user)

    reason = req.reason if req else ""
    NotificationService.create_notification(
        db=db,
        user_id=user.id,
        notification_type="MANAGER_REJECTED",
        title="Access Request Update",
        message=f"Your manager access request has been rejected. {reason}".strip(),
        metadata={"admin_id": admin_user.id}
    )

    EmailService.send_account_rejected_email(user.email, user.name, reason)

    AuditService.log(
        db=db,
        action="MANAGER_REJECTED",
        entity_type="User",
        entity_id=user.id,
        user_id=admin_user.id,
        old_data={"status": old_status},
        new_data={"status": "REJECTED", "reason": reason}
    )

    return {"success": True, "message": "Manager account rejected."}

@router.patch("/managers/{manager_id}/toggle-status")
def toggle_manager_status(
    manager_id: int,
    req: ManagerStatusToggleRequest,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == manager_id, User.role == "MANAGER").first()
    if not user:
        raise HTTPException(status_code=404, detail="Manager not found.")

    old_status = user.status
    user.status = "APPROVED" if req.is_active else "DISABLED"
    db.commit()
    db.refresh(user)

    AuditService.log(
        db=db,
        action="MANAGER_STATUS_TOGGLED",
        entity_type="User",
        entity_id=user.id,
        user_id=admin_user.id,
        old_data={"status": old_status},
        new_data={"status": user.status}
    )

    return {"success": True, "status": user.status, "message": f"Manager status updated to {user.status}."}

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog).outerjoin(User)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()

    results = []
    for l in logs:
        results.append(AuditLogResponse(
            id=l.id,
            user_id=l.user_id,
            user_name=l.user.name if l.user else "System",
            user_email=l.user.email if l.user else "system@internal",
            action=l.action,
            entity_type=l.entity_type,
            entity_id=l.entity_id,
            old_data=l.old_data,
            new_data=l.new_data,
            created_at=l.created_at
        ))
    return results
