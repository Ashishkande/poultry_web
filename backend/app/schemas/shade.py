from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ShadeBase(BaseModel):
    shade_number: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    capacity: int = Field(..., gt=0)
    status: Optional[str] = "ACTIVE"

class ShadeCreate(ShadeBase):
    pass

class ShadeUpdate(BaseModel):
    shade_number: Optional[str] = None
    name: Optional[str] = None
    capacity: Optional[int] = Field(None, gt=0)
    status: Optional[str] = None

class ShadeResponse(ShadeBase):
    id: int
    farm_id: int
    active_batches_count: int = 0
    current_birds: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
