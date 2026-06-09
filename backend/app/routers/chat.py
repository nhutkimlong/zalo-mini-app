from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from uuid import UUID
from supabase import Client, create_client
from app.core.config import settings
from app.models.chat import ChatRequest, ChatResponse
from app.services.rag_service import rag_service
from app.core.auth_deps import get_optional_user

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])

def get_db():
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return None
    try:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception:
        return None

@router.post("/", response_model=ChatResponse)
def ask_ai_assistant(
    payload: ChatRequest, 
    db: Client = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """
    RAG Assistant Chat endpoint.
    Retrieves knowledge context and responds with sources.
    """
    if not payload.question or not payload.question.strip():
        raise HTTPException(status_code=400, detail="Câu hỏi không được để trống")
        
    resolved_user_uuid = None
    
    # 1. Nếu có người dùng đăng nhập qua JWT (Supabase Auth)
    if current_user:
        try:
            resolved_user_uuid = UUID(current_user["id"])
        except ValueError:
            pass
            


    user_id_to_log = resolved_user_uuid or payload.user_id

    try:
        response = rag_service.ask(
            question=payload.question,
            user_id=user_id_to_log,
            channel=payload.channel,
            language=payload.language,
            conversation_history=payload.conversation_history
        )
        return response
    except Exception as e:
        print(f"RAG query API endpoint error: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Có lỗi xảy ra trên hệ thống RAG. Vui lòng thử lại sau hoặc liên hệ BQL."
        )

