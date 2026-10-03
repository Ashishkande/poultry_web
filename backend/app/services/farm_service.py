from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.farm import Farm, FarmManager
from app.models.shade import Shade
from app.models.batch import Batch
from app.models.user import User
from app.schemas.farm import FarmCreate, FarmUpdate
from app.services.audit_service import AuditService

class FarmService:
    @staticmethod
    def is_manager_assigned_to_farm(db: Session, farm_id: int, manager_id: int) -> bool:
        fm = db.query(FarmManager).filter(
            FarmManager.farm_id == farm_id,
            FarmManager.manager_id == manager_id,
            FarmManager.status == "ACTIVE"
        ).first()
        if fm:
            return True
        # Check if created by manager
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.created_by == manager_id).first()
        return farm is not None

    @staticmethod
    def get_farms(db: Session, user: User, search: Optional[str] = None) -> List[Farm]:
        query = db.query(Farm)

        if user.role != "ADMIN":
            # Strict manager isolation: only assigned or created farms
            assigned_ids = [
                r[0] for r in db.query(FarmManager.farm_id)
                .filter(FarmManager.manager_id == user.id, FarmManager.status == "ACTIVE")
                .all()
            ]
            query = query.filter((Farm.id.in_(assigned_ids)) | (Farm.created_by == user.id))

        if search:
            s = f"%{search.strip()}%"
            query = query.filter((Farm.name.ilike(s)) | (Farm.code.ilike(s)) | (Farm.location.ilike(s)))

        return query.order_by(Farm.created_at.desc()).all()

    @staticmethod
    def get_farm_by_id(db: Session, farm_id: int, user: User) -> Farm:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found.")

        if user.role != "ADMIN" and not FarmService.is_manager_assigned_to_farm(db, farm_id, user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are not assigned to manage this farm."
            )
        return farm

    @staticmethod
    def create_farm(db: Session, user: User, farm_in: FarmCreate) -> Farm:
        code = farm_in.code.strip().upper()
        if db.query(Farm).filter(Farm.code == code).first():
            raise HTTPException(status_code=400, detail=f"Farm with code '{code}' already exists.")

        farm = Farm(
            name=farm_in.name.strip(),
            code=code,
            location=farm_in.location.strip(),
            address=farm_in.address.strip(),
            contact_number=farm_in.contact_number.strip(),
            status=farm_in.status or "ACTIVE",
            created_by=user.id
        )
        db.add(farm)
        db.commit()
        db.refresh(farm)

        # Manager assignment
        if user.role == "MANAGER":
            fm = FarmManager(farm_id=farm.id, manager_id=user.id, status="ACTIVE")
            db.add(fm)
        elif farm_in.manager_ids:
            for m_id in farm_in.manager_ids:
                m_user = db.query(User).filter(User.id == m_id, User.role == "MANAGER").first()
                if m_user:
                    db.add(FarmManager(farm_id=farm.id, manager_id=m_id, status="ACTIVE"))

        db.commit()
        db.refresh(farm)

        AuditService.log(
            db=db,
            action="FARM_CREATED",
            entity_type="Farm",
            entity_id=farm.id,
            user_id=user.id,
            new_data={"name": farm.name, "code": farm.code}
        )
        return farm

    @staticmethod
    def update_farm(db: Session, farm_id: int, user: User, farm_in: FarmUpdate) -> Farm:
        farm = FarmService.get_farm_by_id(db, farm_id, user)
        old_data = {"name": farm.name, "status": farm.status, "location": farm.location}

        if farm_in.name is not None:
            farm.name = farm_in.name.strip()
        if farm_in.code is not None:
            code = farm_in.code.strip().upper()
            existing = db.query(Farm).filter(Farm.code == code, Farm.id != farm_id).first()
            if existing:
                raise HTTPException(status_code=400, detail="Farm code already in use.")
            farm.code = code
        if farm_in.location is not None:
            farm.location = farm_in.location.strip()
        if farm_in.address is not None:
            farm.address = farm_in.address.strip()
        if farm_in.contact_number is not None:
            farm.contact_number = farm_in.contact_number.strip()
        if farm_in.status is not None:
            farm.status = farm_in.status

        # If admin specified manager_ids, sync managers
        if user.role == "ADMIN" and farm_in.manager_ids is not None:
            db.query(FarmManager).filter(FarmManager.farm_id == farm.id).delete()
            for m_id in farm_in.manager_ids:
                db.add(FarmManager(farm_id=farm.id, manager_id=m_id, status="ACTIVE"))

        db.commit()
        db.refresh(farm)

        AuditService.log(
            db=db,
            action="FARM_UPDATED",
            entity_type="Farm",
            entity_id=farm.id,
            user_id=user.id,
            old_data=old_data,
            new_data={"name": farm.name, "status": farm.status}
        )
        return farm

    @staticmethod
    def delete_farm(db: Session, farm_id: int, user: User) -> bool:
        if user.role != "ADMIN":
            raise HTTPException(status_code=403, detail="Only administrators can delete farms.")
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found.")

        AuditService.log(
            db=db,
            action="FARM_DELETED",
            entity_type="Farm",
            entity_id=farm.id,
            user_id=user.id,
            old_data={"name": farm.name, "code": farm.code}
        )
        db.delete(farm)
        db.commit()
        return True
