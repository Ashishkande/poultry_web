from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Shade(Base):
    __tablename__ = "shades"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    shade_number = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    capacity = Column(Integer, nullable=False, default=1000)
    status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, MAINTENANCE, INACTIVE
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    farm = relationship("Farm", back_populates="shades")
    batches = relationship("Batch", back_populates="shade", cascade="all, delete-orphan")
    mortality_records = relationship("MortalityRecord", back_populates="shade", cascade="all, delete-orphan")
