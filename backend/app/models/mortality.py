from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class MortalityRecord(Base):
    __tablename__ = "mortality_records"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    shade_id = Column(Integer, ForeignKey("shades.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=False, index=True)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    mortality_date = Column(Date, nullable=False, index=True)
    mortality_count = Column(Integer, nullable=False)
    reason = Column(String(100), nullable=False)  # Disease, Heat Stress, Suffocation, Unknown, etc.
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('batch_id', 'shade_id', 'mortality_date', name='uq_batch_shade_mortality_date'),
    )

    # Relationships
    farm = relationship("Farm", back_populates="mortality_records")
    shade = relationship("Shade", back_populates="mortality_records")
    batch = relationship("Batch", back_populates="mortality_records")
    manager = relationship("User", back_populates="mortality_entries")
