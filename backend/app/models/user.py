from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="MANAGER", nullable=False)  # ADMIN, MANAGER
    status = Column(String(30), default="PENDING_VERIFICATION", nullable=False)
    # Statuses: PENDING_VERIFICATION, PENDING_ADMIN_APPROVAL, APPROVED, REJECTED, DISABLED
    email_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    otps = relationship("EmailOTP", back_populates="user", cascade="all, delete-orphan")
    managed_farms = relationship("FarmManager", back_populates="manager", cascade="all, delete-orphan")
    mortality_entries = relationship("MortalityRecord", back_populates="manager")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


class EmailOTP(Base):
    __tablename__ = "email_otps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    otp = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    attempts = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="otps")
