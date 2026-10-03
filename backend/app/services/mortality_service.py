from typing import List, Optional, Dict, Any
from datetime import date
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.mortality import MortalityRecord
from app.models.batch import Batch
from app.models.shade import Shade
from app.models.farm import Farm, FarmManager
from app.models.user import User
from app.schemas.mortality import MortalityCreate, MortalityUpdate
from app.services.farm_service import FarmService
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService

class MortalityService:
    @staticmethod
    def sync_batch_current_birds(db: Session, batch_id: int):
        batch = db.query(Batch).filter(Batch.id == batch_id).first()
        if not batch:
            return
        total_mortality = (
            db.query(func.coalesce(func.sum(MortalityRecord.mortality_count), 0))
            .filter(MortalityRecord.batch_id == batch.id)
            .scalar()
        )
        batch.current_birds = max(0, batch.initial_birds - total_mortality)
        db.commit()
        db.refresh(batch)

    @staticmethod
    def add_mortality(db: Session, user: User, mort_in: MortalityCreate) -> Dict[str, Any]:
        # 1. Validate mortality count
        if mort_in.mortality_count <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mortality count must be greater than zero."
            )

        # 2. Check manager permission for farm
        farm = FarmService.get_farm_by_id(db, mort_in.farm_id, user)

        # 3. Check shade belongs to farm
        shade = db.query(Shade).filter(Shade.id == mort_in.shade_id, Shade.farm_id == farm.id).first()
        if not shade:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected shade does not belong to the selected farm."
            )

        # 4. Check batch belongs to farm and shade
        batch = db.query(Batch).filter(
            Batch.id == mort_in.batch_id,
            Batch.farm_id == farm.id,
            Batch.shade_id == shade.id
        ).first()
        if not batch:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected batch does not belong to the specified farm and shade."
            )

        # 5. Check batch is active
        if batch.status != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot add mortality to a batch with status '{batch.status}'."
            )

        # 6. Check mortality count does not exceed current bird count
        if mort_in.mortality_count > batch.current_birds:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mortality count ({mort_in.mortality_count}) cannot exceed current bird count ({batch.current_birds})."
            )

        # 7. Check for duplicate entry on the same date for this batch and shade
        existing_record = db.query(MortalityRecord).filter(
            MortalityRecord.batch_id == batch.id,
            MortalityRecord.shade_id == shade.id,
            MortalityRecord.mortality_date == mort_in.mortality_date
        ).first()
        if existing_record:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A mortality record already exists for batch '{batch.batch_number}' on {mort_in.mortality_date}. Please edit the existing record instead."
            )

        # 8. Save mortality record
        mortality_record = MortalityRecord(
            farm_id=farm.id,
            shade_id=shade.id,
            batch_id=batch.id,
            manager_id=user.id,
            mortality_date=mort_in.mortality_date,
            mortality_count=mort_in.mortality_count,
            reason=mort_in.reason.strip(),
            remarks=mort_in.remarks.strip() if mort_in.remarks else None
        )
        db.add(mortality_record)
        db.commit()
        db.refresh(mortality_record)

        # 9. Update batch current birds
        MortalityService.sync_batch_current_birds(db, batch.id)

        # 10. Admin Notification
        notif_title = "New Mortality Added"
        notif_msg = (
            f"Farm: {farm.name}\n"
            f"Shade: {shade.shade_number} - {shade.name}\n"
            f"Batch: {batch.batch_number}\n"
            f"Manager: {user.name}\n"
            f"Mortality: {mort_in.mortality_count} birds\n"
            f"Date: {mort_in.mortality_date.strftime('%d-%m-%Y')}\n"
            f"Reason: {mort_in.reason}"
        )
        NotificationService.notify_admins(
            db=db,
            notification_type="MORTALITY_ADDED",
            title=notif_title,
            message=notif_msg,
            metadata={
                "mortality_id": mortality_record.id,
                "farm_id": farm.id,
                "farm_name": farm.name,
                "shade_name": shade.name,
                "batch_id": batch.id,
                "batch_number": batch.batch_number,
                "count": mort_in.mortality_count,
                "date": str(mort_in.mortality_date),
                "manager_name": user.name
            }
        )

        # 11. Audit Log
        AuditService.log(
            db=db,
            action="MORTALITY_ADDED",
            entity_type="MortalityRecord",
            entity_id=mortality_record.id,
            user_id=user.id,
            new_data={
                "farm": farm.name,
                "batch": batch.batch_number,
                "count": mort_in.mortality_count,
                "date": str(mort_in.mortality_date)
            }
        )

        return {
            "success": True,
            "message": f"Mortality added successfully. {mort_in.mortality_count} mortality records added for {shade.name}.",
            "record": {
                "id": mortality_record.id,
                "farm_id": farm.id,
                "farm_name": farm.name,
                "shade_id": shade.id,
                "shade_name": shade.name,
                "batch_id": batch.id,
                "batch_number": batch.batch_number,
                "manager_id": user.id,
                "manager_name": user.name,
                "mortality_date": mortality_record.mortality_date,
                "mortality_count": mortality_record.mortality_count,
                "reason": mortality_record.reason,
                "remarks": mortality_record.remarks,
                "created_at": mortality_record.created_at,
                "updated_at": mortality_record.updated_at
            }
        }

    @staticmethod
    def get_mortality_records(
        db: Session,
        user: User,
        farm_id: Optional[int] = None,
        shade_id: Optional[int] = None,
        batch_id: Optional[int] = None,
        manager_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = (
            db.query(MortalityRecord)
            .join(Farm, MortalityRecord.farm_id == Farm.id)
            .join(Shade, MortalityRecord.shade_id == Shade.id)
            .join(Batch, MortalityRecord.batch_id == Batch.id)
            .join(User, MortalityRecord.manager_id == User.id)
        )

        if user.role != "ADMIN":
            assigned_farm_ids = [
                r[0] for r in db.query(FarmManager.farm_id)
                .filter(FarmManager.manager_id == user.id, FarmManager.status == "ACTIVE")
                .all()
            ]
            owned_farm_ids = [
                r[0] for r in db.query(Farm.id).filter(Farm.created_by == user.id).all()
            ]
            allowed_farm_ids = list(set(assigned_farm_ids + owned_farm_ids))
            query = query.filter(MortalityRecord.farm_id.in_(allowed_farm_ids))

        if farm_id:
            query = query.filter(MortalityRecord.farm_id == farm_id)
        if shade_id:
            query = query.filter(MortalityRecord.shade_id == shade_id)
        if batch_id:
            query = query.filter(MortalityRecord.batch_id == batch_id)
        if manager_id and user.role == "ADMIN":
            query = query.filter(MortalityRecord.manager_id == manager_id)
        if start_date:
            query = query.filter(MortalityRecord.mortality_date >= start_date)
        if end_date:
            query = query.filter(MortalityRecord.mortality_date <= end_date)
        if search:
            s = f"%{search.strip()}%"
            query = query.filter(
                (MortalityRecord.reason.ilike(s)) |
                (MortalityRecord.remarks.ilike(s)) |
                (Farm.name.ilike(s)) |
                (Batch.batch_number.ilike(s)) |
                (User.name.ilike(s))
            )

        records = query.order_by(MortalityRecord.mortality_date.desc(), MortalityRecord.created_at.desc()).all()

        results = []
        for r in records:
            results.append({
                "id": r.id,
                "farm_id": r.farm_id,
                "farm_name": r.farm.name,
                "shade_id": r.shade_id,
                "shade_name": f"{r.shade.shade_number} - {r.shade.name}",
                "batch_id": r.batch_id,
                "batch_number": r.batch.batch_number,
                "manager_id": r.manager_id,
                "manager_name": r.manager.name,
                "mortality_date": r.mortality_date,
                "mortality_count": r.mortality_count,
                "reason": r.reason,
                "remarks": r.remarks,
                "created_at": r.created_at,
                "updated_at": r.updated_at
            })
        return results

    @staticmethod
    def update_mortality(db: Session, record_id: int, user: User, mort_in: MortalityUpdate) -> Dict[str, Any]:
        record = db.query(MortalityRecord).filter(MortalityRecord.id == record_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Mortality record not found.")

        # Check permission: Admin or assigned manager
        FarmService.get_farm_by_id(db, record.farm_id, user)

        batch = db.query(Batch).filter(Batch.id == record.batch_id).first()
        old_count = record.mortality_count

        if mort_in.mortality_count is not None:
            if mort_in.mortality_count <= 0:
                raise HTTPException(status_code=400, detail="Mortality count must be greater than zero.")
            # Check maximum allowed
            # Available birds if we revert this record = current_birds + old_count
            available_birds = batch.current_birds + old_count
            if mort_in.mortality_count > available_birds:
                raise HTTPException(
                    status_code=400,
                    detail=f"Mortality count cannot exceed available birds ({available_birds})."
                )
            record.mortality_count = mort_in.mortality_count

        if mort_in.reason is not None:
            record.reason = mort_in.reason.strip()
        if mort_in.remarks is not None:
            record.remarks = mort_in.remarks.strip()

        db.commit()
        db.refresh(record)

        MortalityService.sync_batch_current_birds(db, record.batch_id)

        AuditService.log(
            db=db,
            action="MORTALITY_UPDATED",
            entity_type="MortalityRecord",
            entity_id=record.id,
            user_id=user.id,
            old_data={"count": old_count},
            new_data={"count": record.mortality_count}
        )

        return {"message": "Mortality record updated successfully."}

    @staticmethod
    def delete_mortality(db: Session, record_id: int, user: User) -> Dict[str, Any]:
        record = db.query(MortalityRecord).filter(MortalityRecord.id == record_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Mortality record not found.")

        FarmService.get_farm_by_id(db, record.farm_id, user)
        batch_id = record.batch_id

        AuditService.log(
            db=db,
            action="MORTALITY_DELETED",
            entity_type="MortalityRecord",
            entity_id=record.id,
            user_id=user.id,
            old_data={"count": record.mortality_count, "batch_id": batch_id}
        )

        db.delete(record)
        db.commit()

        MortalityService.sync_batch_current_birds(db, batch_id)

        return {"message": "Mortality record deleted successfully."}
