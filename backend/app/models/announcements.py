from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class AnnouncementCreate(BaseModel):
    title: str = Field(..., description="Tiêu đề thông báo")
    title_en: Optional[str] = Field(None, description="English title")
    content: str = Field(..., description="Nội dung chi tiết thông báo")
    content_en: Optional[str] = Field(None, description="English content")
    type: str = Field("general", description="Loại thông báo ('general', 'emergency', 'weather', 'festival')")
    status: str = Field("published", description="Trạng thái ('draft', 'published', 'archived')")

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    title_en: Optional[str] = None
    content: Optional[str] = None
    content_en: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None

class AnnouncementResponse(BaseModel):
    id: UUID
    title: str
    title_en: Optional[str] = None
    content: str
    content_en: Optional[str] = None
    type: str
    status: str
    published_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

