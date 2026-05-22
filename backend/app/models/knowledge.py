from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class ArticleCreate(BaseModel):
    title: str = Field(..., description="Tiêu đề bài viết tri thức")
    content: str = Field(..., description="Nội dung chính chi tiết")
    category: str = Field(..., description="Chuyên mục ('ve_va_gio_mo_cua', 'di_chuyen', 'noi_quy', 'lich_su', 'khac')")
    visibility: str = Field("public", description="Hiển thị ('public', 'private')")
    source: Optional[str] = Field(None, description="Nguồn tài liệu tham khảo")
    status: str = Field("draft", description="Trạng thái ('draft', 'published', 'archived')")

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    visibility: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None

class ArticleResponse(BaseModel):
    id: UUID
    title: str
    content: str
    category: str
    visibility: str
    source: Optional[str] = None
    status: str
    updated_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
