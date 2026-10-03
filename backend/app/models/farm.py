from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    location = Column(String(100), nullable=False)
    address = Column(Text, nullable=False)
    contact_number = Column(String(30), nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, INACTIVE
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    shades = relationship("Shade", back_populates="farm", cascade="all, delete-orphan")
    batches = relationship("Batch", back_populates="farm", cascade="all, delete-orphan")
    managers = relationship("FarmManager", back_populates="farm", cascade="all, delete-orphan")
    mortality_records = relationship("MortalityRecord", back_populates="farm", cascade="all, delete-orphan")


class FarmManager(Base):
    __tablename__ = "farm_managers"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, INACTIVE

    farm = relationship("Farm", back_populates="managers")
    manager = relationship("User", back_populates="managed_farms")
