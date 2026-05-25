from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class ItineraryStep(BaseModel):
    vi: str
    en: str

class ItineraryBase(BaseModel):
    name: str
    name_en: Optional[str] = None
    duration: str
    duration_en: Optional[str] = None
    color: str
    place_slugs: List[str] = []
    steps: List[ItineraryStep] = []
    status: str = "published"

class ItineraryCreate(ItineraryBase):
    pass

class ItineraryUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    duration: Optional[str] = None
    duration_en: Optional[str] = None
    color: Optional[str] = None
    place_slugs: Optional[List[str]] = None
    steps: Optional[List[ItineraryStep]] = None
    status: Optional[str] = None

class ItineraryResponse(ItineraryBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
