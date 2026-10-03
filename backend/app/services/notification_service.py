import json
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User
from app.utils.websocket_manager import ws_manager

class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        notification_type: str,
        title: str,
        message: str,
        user_id: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Notification:
        meta_str = json.dumps(metadata, default=str) if metadata else None
        
        notif = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            is_read=False,
            metadata_json=meta_str
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def notify_admins(
        db: Session,
        notification_type: str,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[Notification]:
        # user_id = None is a broadcast to all administrators
        notif = NotificationService.create_notification(
            db=db,
            notification_type=notification_type,
            title=title,
            message=message,
            user_id=None,
            metadata=metadata
        )
        return [notif]
