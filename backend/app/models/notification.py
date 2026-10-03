from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    # If user_id is None, it is a broadcast for all ADMINS
    type = Column(String(50), nullable=False)
    # MANAGER_ACCESS_REQUEST, MANAGER_APPROVED, MANAGER_REJECTED, MORTALITY_ADDED, MORTALITY_UPDATED, MORTALITY_DELETED, SYSTEM_NOTIFICATION
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    metadata_json = Column(Text, nullable=True)  # JSON formatted extra context (farm_id, batch_id, count, etc.)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="notifications")
