import json
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

class AuditService:
    @staticmethod
    def log(
        db: Session,
        action: str,
        entity_type: str,
        entity_id: Optional[int] = None,
        user_id: Optional[int] = None,
        old_data: Optional[Any] = None,
        new_data: Optional[Any] = None
    ) -> AuditLog:
        old_str = json.dumps(old_data, default=str) if old_data is not None else None
        new_str = json.dumps(new_data, default=str) if new_data is not None else None
        
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_data=old_str,
            new_data=new_str
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
