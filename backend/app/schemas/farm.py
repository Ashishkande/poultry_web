from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class FarmManagerInfo(BaseModel):
    id: int
    name: str
    email: str
    phone: str

    class Config:
        from_attributes = True

class FarmBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    code: str = Field(..., min_length=2, max_length=50)
    location: str = Field(..., min_length=2, max_length=100)
    address: str = Field(..., min_length=5)
    contact_number: str = Field(..., min_length=7, max_length=30)
    status: Optional[str] = "ACTIVE"

class FarmCreate(FarmBase):
    manager_ids: Optional[List[int]] = []

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    status: Optional[str] = None
    manager_ids: Optional[List[int]] = None

class FarmResponse(FarmBase):
    id: int
    created_by: Optional[int] = None
    shades_count: int = 0
    batches_count: int = 0
    total_birds: int = 0
    managers: List[FarmManagerInfo] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
