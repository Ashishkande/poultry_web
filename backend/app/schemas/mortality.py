from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class MortalityBase(BaseModel):
    mortality_date: date
    mortality_count: int = Field(..., gt=0, description="Must be greater than 0")
    reason: str = Field(..., min_length=2, max_length=100)
    remarks: Optional[str] = None

class MortalityCreate(MortalityBase):
    farm_id: int
    shade_id: int
    batch_id: int

class MortalityUpdate(BaseModel):
    mortality_count: Optional[int] = Field(None, gt=0)
    reason: Optional[str] = None
    remarks: Optional[str] = None

class MortalityResponse(MortalityBase):
    id: int
    farm_id: int
    farm_name: str
    shade_id: int
    shade_name: str
    batch_id: int
    batch_number: str
    manager_id: int
    manager_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MortalitySummaryStats(BaseModel):
    total_mortality: int
    today_mortality: int
    mortality_percentage: float
    total_birds: int
    active_batches: int
