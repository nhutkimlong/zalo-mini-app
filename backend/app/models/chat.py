from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class ChatRequest(BaseModel):
    question: str = Field(..., description="Câu hỏi từ khách du lịch")
    user_id: Optional[UUID] = Field(None, description="ID của người dùng nếu có")
    channel: str = Field("mini_app", description="Kênh gửi câu hỏi ('mini_app' hoặc 'zalo_oa')")
    language: str = Field("vi", description="Ngôn ngữ phản hồi ('vi' hoặc 'en')")
    conversation_history: List[dict] = Field(default_factory=list, description="Lịch sử hội thoại gần nhất")


class SourceCitation(BaseModel):
    article_id: UUID
    title: str
    category: str
    source: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str = Field(..., description="Câu trả lời từ trợ lý AI")
    confidence_score: float = Field(..., description="Mức độ tự tin của câu trả lời")
    sources: List[SourceCitation] = Field(default_factory=list, description="Nguồn bài viết tham khảo trong kho tri thức")
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
