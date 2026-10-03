from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    old_data: Optional[str] = None
    new_data: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
