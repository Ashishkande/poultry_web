from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    shade_id = Column(Integer, ForeignKey("shades.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_number = Column(String(50), unique=True, index=True, nullable=False)
    breed = Column(String(100), nullable=False)
    bird_type = Column(String(50), nullable=False)  # Broiler, Layer, Breeder, etc.
    initial_birds = Column(Integer, nullable=False)
    current_birds = Column(Integer, nullable=False)
    arrival_date = Column(Date, nullable=False)
    expected_end_date = Column(Date, nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, COMPLETED, CANCELLED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    farm = relationship("Farm", back_populates="batches")
    shade = relationship("Shade", back_populates="batches")
    mortality_records = relationship("MortalityRecord", back_populates="batch", cascade="all, delete-orphan")
