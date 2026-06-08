from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class FeedbackCreate(BaseModel):
    reporter_name: Optional[str] = Field(None, description="Họ tên người phản ánh")
    phone: Optional[str] = Field(None, description="Số điện thoại")
    report_type: str = Field(..., description="Loại phản ánh ('ve_sinh', 'gia_ca', 'an_ninh', 'thai_do', 'ha_tang', 'cheo_keo', 'gop_y', 'khac')")
    content: str = Field(..., description="Nội dung chi tiết phản ánh")
    image_url: Optional[str] = Field(None, description="Đường dẫn ảnh đính kèm")
    latitude: Optional[float] = Field(None, description="Vĩ độ GPS")
    longitude: Optional[float] = Field(None, description="Kinh độ GPS")
    user_id: Optional[UUID] = Field(None, description="ID người dùng gửi phản ánh")

class FeedbackUpdate(BaseModel):
    status: Optional[str] = Field(None, description="Trạng thái phản ánh ('new', 'in_progress', 'resolved', 'spam')")
    assigned_unit: Optional[str] = Field(None, description="Đơn vị phụ trách xử lý")
    internal_note: Optional[str] = Field(None, description="Ghi chú nội bộ của cán bộ")

class FeedbackResponse(BaseModel):
    id: UUID
    reporter_name: Optional[str] = None
    phone: Optional[str] = None
    report_type: str
    content: str
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str
    assigned_unit: Optional[str] = None
    internal_note: Optional[str] = None
    user_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
class FeedbackStats(BaseModel):
    total_reports: int
    new_reports: int
    in_progress_reports: int
    resolved_reports: int
