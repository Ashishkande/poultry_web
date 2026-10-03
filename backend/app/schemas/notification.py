from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class NotificationResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    type: str
    title: str
    message: str
    is_read: bool
    metadata_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationUnreadCount(BaseModel):
    unread_count: int
