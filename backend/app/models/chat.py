from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class UserInfo(BaseModel):
    id: Optional[str] = Field(None, description="ID người dùng")
    name: Optional[str] = Field(None, description="Tên hiển thị của người dùng")
    avatar_url: Optional[str] = Field(None, description="Đường dẫn ảnh đại diện")

class ChatRequest(BaseModel):
    question: str = Field(..., description="Câu hỏi từ khách du lịch")
    user_id: Optional[UUID] = Field(None, description="ID của người dùng nếu có")
    channel: str = Field("web", description="Kênh gửi câu hỏi ('web')")
    language: str = Field("vi", description="Ngôn ngữ phản hồi ('vi' hoặc 'en')")
    conversation_history: List[dict] = Field(default_factory=list, description="Lịch sử hội thoại gần nhất")
    user_info: Optional[UserInfo] = Field(None, description="Thông tin chi tiết người dùng")


class SourceCitation(BaseModel):
    article_id: UUID
    title: str
    category: str
    source: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str = Field(..., description="Câu trả lời từ trợ lý AI")
    confidence_score: float = Field(..., description="Mức độ tự tin của câu trả lời")
    sources: List[SourceCitation] = Field(default_factory=list, description="Nguồn bài viết tham khảo trong kho tri thức")
    type: str = Field("chat", description="Loại phản hồi (chat, feedback_request)")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DailyUsage(BaseModel):
    date: str
    request_count: int
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost_usd: float


class ModelUsage(BaseModel):
    model: str
    request_count: int
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost_usd: float


class UsageSummary(BaseModel):
    request_count: int
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    daily: List[DailyUsage] = Field(default_factory=list)
    by_model: List[ModelUsage] = Field(default_factory=list)
