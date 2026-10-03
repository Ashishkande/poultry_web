from typing import List
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationUnreadCount
from app.utils.websocket_manager import ws_manager

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "ADMIN":
        admin_user_ids = db.query(User.id).filter(User.role == "ADMIN").subquery()
        query = db.query(Notification).filter(
            or_(
                Notification.user_id == current_user.id,
                Notification.user_id == None,
                Notification.user_id.in_(admin_user_ids),
                Notification.type.in_([
                    "MANAGER_ACCESS_REQUEST",
                    "MORTALITY_ADDED",
                    "MORTALITY_UPDATED",
                    "MORTALITY_DELETED",
                    "SYSTEM_NOTIFICATION"
                ])
            )
        )
    else:
        query = db.query(Notification).filter(Notification.user_id == current_user.id)

    return query.order_by(Notification.created_at.desc()).limit(100).all()

@router.get("/unread-count", response_model=NotificationUnreadCount)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "ADMIN":
        admin_user_ids = db.query(User.id).filter(User.role == "ADMIN").subquery()
        count = db.query(Notification).filter(
            or_(
                Notification.user_id == current_user.id,
                Notification.user_id == None,
                Notification.user_id.in_(admin_user_ids),
                Notification.type.in_([
                    "MANAGER_ACCESS_REQUEST",
                    "MORTALITY_ADDED",
                    "MORTALITY_UPDATED",
                    "MORTALITY_DELETED",
                    "SYSTEM_NOTIFICATION"
                ])
            ),
            Notification.is_read == False
        ).count()
    else:
        count = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).count()

    return {"unread_count": count}

@router.patch("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")

    if current_user.role != "ADMIN" and notif.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    notif.is_read = True
    db.commit()
    return {"success": True, "message": "Notification marked as read."}

@router.post("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "ADMIN":
        admin_user_ids = db.query(User.id).filter(User.role == "ADMIN").subquery()
        db.query(Notification).filter(
            or_(
                Notification.user_id == current_user.id,
                Notification.user_id == None,
                Notification.user_id.in_(admin_user_ids),
                Notification.type.in_([
                    "MANAGER_ACCESS_REQUEST",
                    "MORTALITY_ADDED",
                    "MORTALITY_UPDATED",
                    "MORTALITY_DELETED",
                    "SYSTEM_NOTIFICATION"
                ])
            ),
            Notification.is_read == False
        ).update({Notification.is_read: True}, synchronize_session=False)
    else:
        db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).update({Notification.is_read: True}, synchronize_session=False)

    db.commit()
    return {"success": True, "message": "All notifications marked as read."}

@router.websocket("/ws/{user_id}")
async def websocket_notifications_endpoint(websocket: WebSocket, user_id: int):
    await ws_manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection open and accept pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
