from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date, datetime

class BatchBase(BaseModel):
    batch_number: str = Field(..., min_length=2, max_length=50)
    breed: str = Field(..., min_length=2, max_length=100)
    bird_type: str = Field(..., min_length=2, max_length=50)
    initial_birds: int = Field(..., gt=0)
    arrival_date: date
    expected_end_date: Optional[date] = None
    notes: Optional[str] = None
    status: Optional[str] = "ACTIVE"

    @field_validator('expected_end_date', mode='before')
    @classmethod
    def parse_expected_end_date(cls, v):
        if v == "" or v is None:
            return None
        return v

    @field_validator('notes', mode='before')
    @classmethod
    def clean_notes(cls, v):
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v

class BatchCreate(BatchBase):
    farm_id: int
    shade_id: int

class BatchUpdate(BaseModel):
    breed: Optional[str] = None
    bird_type: Optional[str] = None
    status: Optional[str] = None
    expected_end_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator('expected_end_date', mode='before')
    @classmethod
    def parse_expected_end_date(cls, v):
        if v == "" or v is None:
            return None
        return v

    @field_validator('notes', mode='before')
    @classmethod
    def clean_notes(cls, v):
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v

class BatchResponse(BatchBase):
    id: int
    farm_id: int
    farm_name: Optional[str] = None
    shade_id: int
    shade_name: Optional[str] = None
    current_birds: int
    total_mortality: int = 0
    mortality_percentage: float = 0.0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
