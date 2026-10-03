from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime

class MortalityReportFilter(BaseModel):
    farm_id: Optional[int] = None
    shade_id: Optional[int] = None
    batch_id: Optional[int] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None

    @field_validator('date_from', 'date_to', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        if v == "" or v is None:
            return None
        return v

class MortalityItemReport(BaseModel):
    id: int
    date: str
    farm_name: str
    shade_name: str
    batch_number: str
    mortality_count: int
    reason: str
    remarks: Optional[str]
    manager_name: str

class MortalityReportResponse(BaseModel):
    farm_name: str
    shade_name: str
    batch_number: str
    initial_birds: int
    current_birds: int
    total_mortality: int
    mortality_percentage: float
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    records: List[MortalityItemReport]
    generated_at: str
    generated_by: str
