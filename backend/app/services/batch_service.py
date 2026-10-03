from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.batch import Batch
from app.models.shade import Shade
from app.models.farm import Farm, FarmManager
from app.models.mortality import MortalityRecord
from app.models.user import User
from app.schemas.batch import BatchCreate, BatchUpdate
from app.services.farm_service import FarmService
from app.services.audit_service import AuditService

class BatchService:
    @staticmethod
    def enrich_batch_data(db: Session, batch: Batch) -> Dict[str, Any]:
        total_mortality = (
            db.query(func.coalesce(func.sum(MortalityRecord.mortality_count), 0))
            .filter(MortalityRecord.batch_id == batch.id)
            .scalar()
        )
        current_birds = max(0, batch.initial_birds - total_mortality)
        mortality_percentage = (
            round((total_mortality / batch.initial_birds) * 100.0, 2)
            if batch.initial_birds > 0
            else 0.0
        )

        return {
            "id": batch.id,
            "farm_id": batch.farm_id,
            "farm_name": batch.farm.name if batch.farm else "",
            "shade_id": batch.shade_id,
            "shade_name": f"{batch.shade.shade_number} - {batch.shade.name}" if batch.shade else "",
            "batch_number": batch.batch_number,
            "breed": batch.breed,
            "bird_type": batch.bird_type,
            "initial_birds": batch.initial_birds,
            "current_birds": current_birds,
            "total_mortality": total_mortality,
            "mortality_percentage": mortality_percentage,
            "arrival_date": batch.arrival_date,
            "expected_end_date": batch.expected_end_date,
            "status": batch.status,
            "notes": batch.notes,
            "created_at": batch.created_at,
            "updated_at": batch.updated_at
        }

    @staticmethod
    def get_batches(
        db: Session,
        user: User,
        farm_id: Optional[int] = None,
        shade_id: Optional[int] = None,
        status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = db.query(Batch)

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
            query = query.filter(Batch.farm_id.in_(allowed_farm_ids))

        if farm_id:
            query = query.filter(Batch.farm_id == farm_id)
        if shade_id:
            query = query.filter(Batch.shade_id == shade_id)
        if status_filter:
            query = query.filter(Batch.status == status_filter.upper())

        batches = query.order_by(Batch.created_at.desc()).all()
        return [BatchService.enrich_batch_data(db, b) for b in batches]

    @staticmethod
    def get_batch_by_id(db: Session, batch_id: int, user: User) -> Batch:
        batch = db.query(Batch).filter(Batch.id == batch_id).first()
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found.")

        # Check farm access
        FarmService.get_farm_by_id(db, batch.farm_id, user)
        return batch

    @staticmethod
    def create_batch(db: Session, user: User, batch_in: BatchCreate) -> Dict[str, Any]:
        # Validate farm access
        farm = FarmService.get_farm_by_id(db, batch_in.farm_id, user)

        # Validate shade belongs to farm
        shade = db.query(Shade).filter(Shade.id == batch_in.shade_id, Shade.farm_id == farm.id).first()
        if not shade:
            raise HTTPException(
                status_code=400,
                detail=f"Selected shade (ID: {batch_in.shade_id}) does not belong to farm '{farm.name}'."
            )

        # Check unique batch number
        batch_num = batch_in.batch_number.strip().upper()
        existing = db.query(Batch).filter(Batch.batch_number == batch_num).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Batch number '{batch_num}' is already in use."
            )

        batch = Batch(
            farm_id=farm.id,
            shade_id=shade.id,
            batch_number=batch_num,
            breed=batch_in.breed.strip(),
            bird_type=batch_in.bird_type.strip(),
            initial_birds=batch_in.initial_birds,
            current_birds=batch_in.initial_birds,
            arrival_date=batch_in.arrival_date,
            expected_end_date=batch_in.expected_end_date,
            status=batch_in.status or "ACTIVE",
            notes=batch_in.notes
        )
        db.add(batch)
        db.commit()
        db.refresh(batch)

        AuditService.log(
            db=db,
            action="BATCH_CREATED",
            entity_type="Batch",
            entity_id=batch.id,
            user_id=user.id,
            new_data={"batch_number": batch.batch_number, "initial_birds": batch.initial_birds}
        )

        return BatchService.enrich_batch_data(db, batch)

    @staticmethod
    def update_batch(db: Session, batch_id: int, user: User, batch_in: BatchUpdate) -> Dict[str, Any]:
        batch = BatchService.get_batch_by_id(db, batch_id, user)
        old_data = {"status": batch.status, "notes": batch.notes}

        if batch_in.breed is not None:
            batch.breed = batch_in.breed.strip()
        if batch_in.bird_type is not None:
            batch.bird_type = batch_in.bird_type.strip()
        if batch_in.status is not None:
            batch.status = batch_in.status.upper()
        if batch_in.expected_end_date is not None:
            batch.expected_end_date = batch_in.expected_end_date
        if batch_in.notes is not None:
            batch.notes = batch_in.notes

        db.commit()
        db.refresh(batch)

        AuditService.log(
            db=db,
            action="BATCH_UPDATED",
            entity_type="Batch",
            entity_id=batch.id,
            user_id=user.id,
            old_data=old_data,
            new_data={"status": batch.status}
        )
        return BatchService.enrich_batch_data(db, batch)
