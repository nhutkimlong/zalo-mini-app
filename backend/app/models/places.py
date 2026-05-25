from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class PlaceCreate(BaseModel):
    name: str = Field(..., description="Tên điểm tham quan")
    name_en: Optional[str] = Field(None, description="English name")
    slug: str = Field(..., description="Đường dẫn tĩnh duy nhất")
    short_description: Optional[str] = Field(None, description="Mô tả ngắn gọn")
    short_description_en: Optional[str] = Field(None, description="English short description")
    full_description: Optional[str] = Field(None, description="Mô tả đầy đủ chi tiết")
    full_description_en: Optional[str] = Field(None, description="English full description")
    image_url: Optional[str] = Field(None, description="Ảnh đại diện điểm tham quan")
    audio_url: Optional[str] = Field(None, description="Đường dẫn audio thuyết minh di tích")
    audio_url_en: Optional[str] = Field(None, description="English audio URL")
    audio_enabled: bool = Field(False, description="Bật tính năng âm thanh cho di tích")
    latitude: Optional[float] = Field(None, description="Vĩ độ")
    longitude: Optional[float] = Field(None, description="Kinh độ")
    category: Optional[str] = Field("tam_linh", description="Phân loại ('tam_linh', 'phong_canh', 'dich_vu')")
    status: str = Field("published", description="Trạng thái ('draft', 'published', 'archived')")
    display_order: Optional[int] = Field(0, description="Thứ tự hiển thị (ưu tiên)")

class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    slug: Optional[str] = None
    short_description: Optional[str] = None
    short_description_en: Optional[str] = None
    full_description: Optional[str] = None
    full_description_en: Optional[str] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    audio_url_en: Optional[str] = None
    audio_enabled: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: Optional[str] = None
    status: Optional[str] = None
    display_order: Optional[int] = None

class PlaceResponse(BaseModel):
    id: UUID
    name: str
    name_en: Optional[str] = None
    slug: str
    short_description: Optional[str] = None
    short_description_en: Optional[str] = None
    full_description: Optional[str] = None
    full_description_en: Optional[str] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    audio_url_en: Optional[str] = None
    audio_enabled: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: Optional[str] = None
    status: str
    display_order: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
