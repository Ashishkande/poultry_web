from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.shade import Shade
from app.models.batch import Batch
from app.models.user import User
from app.schemas.shade import ShadeCreate, ShadeUpdate
from app.services.farm_service import FarmService
from app.services.audit_service import AuditService

class ShadeService:
    @staticmethod
    def get_shades_for_farm(db: Session, farm_id: int, user: User) -> List[Shade]:
        # Enforces farm access permissions
        FarmService.get_farm_by_id(db, farm_id, user)
        return db.query(Shade).filter(Shade.farm_id == farm_id).order_by(Shade.shade_number).all()

    @staticmethod
    def create_shade(db: Session, farm_id: int, user: User, shade_in: ShadeCreate) -> Shade:
        farm = FarmService.get_farm_by_id(db, farm_id, user)

        # Check duplicate shade number in same farm
        existing = db.query(Shade).filter(
            Shade.farm_id == farm_id,
            Shade.shade_number == shade_in.shade_number.strip()
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Shade number '{shade_in.shade_number}' already exists in this farm."
            )

        shade = Shade(
            farm_id=farm.id,
            shade_number=shade_in.shade_number.strip(),
            name=shade_in.name.strip(),
            capacity=shade_in.capacity,
            status=shade_in.status or "ACTIVE"
        )
        db.add(shade)
        db.commit()
        db.refresh(shade)

        AuditService.log(
            db=db,
            action="SHADE_CREATED",
            entity_type="Shade",
            entity_id=shade.id,
            user_id=user.id,
            new_data={"farm_id": farm.id, "shade_number": shade.shade_number, "capacity": shade.capacity}
        )
        return shade

    @staticmethod
    def update_shade(db: Session, shade_id: int, user: User, shade_in: ShadeUpdate) -> Shade:
        shade = db.query(Shade).filter(Shade.id == shade_id).first()
        if not shade:
            raise HTTPException(status_code=404, detail="Shade not found.")

        # Ensure user can access the shade's farm
        FarmService.get_farm_by_id(db, shade.farm_id, user)

        old_data = {"shade_number": shade.shade_number, "capacity": shade.capacity, "status": shade.status}

        if shade_in.shade_number is not None:
            existing = db.query(Shade).filter(
                Shade.farm_id == shade.farm_id,
                Shade.shade_number == shade_in.shade_number.strip(),
                Shade.id != shade_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Shade number already exists in this farm.")
            shade.shade_number = shade_in.shade_number.strip()

        if shade_in.name is not None:
            shade.name = shade_in.name.strip()
        if shade_in.capacity is not None:
            shade.capacity = shade_in.capacity
        if shade_in.status is not None:
            shade.status = shade_in.status

        db.commit()
        db.refresh(shade)

        AuditService.log(
            db=db,
            action="SHADE_UPDATED",
            entity_type="Shade",
            entity_id=shade.id,
            user_id=user.id,
            old_data=old_data,
            new_data={"shade_number": shade.shade_number, "capacity": shade.capacity, "status": shade.status}
        )
        return shade

    @staticmethod
    def delete_shade(db: Session, shade_id: int, user: User) -> bool:
        shade = db.query(Shade).filter(Shade.id == shade_id).first()
        if not shade:
            raise HTTPException(status_code=404, detail="Shade not found.")

        FarmService.get_farm_by_id(db, shade.farm_id, user)

        # Check if active batches exist
        active_batch = db.query(Batch).filter(Batch.shade_id == shade_id, Batch.status == "ACTIVE").first()
        if active_batch:
            raise HTTPException(status_code=400, detail="Cannot delete shade with active batches.")

        AuditService.log(
            db=db,
            action="SHADE_DELETED",
            entity_type="Shade",
            entity_id=shade.id,
            user_id=user.id,
            old_data={"shade_number": shade.shade_number}
        )
        db.delete(shade)
        db.commit()
        return True
