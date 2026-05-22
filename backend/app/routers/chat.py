from fastapi import APIRouter, HTTPException
from app.models.chat import ChatRequest, ChatResponse
from app.services.rag_service import rag_service

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])

@router.post("/", response_model=ChatResponse)
def ask_ai_assistant(payload: ChatRequest):
    """
    RAG Assistant Chat endpoint.
    Retrieves knowledge context and responds with sources.
    """
    if not payload.question or not payload.question.strip():
        raise HTTPException(status_code=400, detail="Câu hỏi không được để trống")
        
    try:
        response = rag_service.ask(
            question=payload.question,
            user_id=payload.user_id,
            channel=payload.channel,
            language=payload.language,
            conversation_history=payload.conversation_history
        )
        return response
    except Exception as e:
        print(f"RAG query API endpoint error: {e}")
        # Secure server-side error fallback to satisfy the user criteria
        raise HTTPException(
            status_code=500, 
            detail="Có lỗi xảy ra trên hệ thống RAG. Vui lòng thử lại sau hoặc liên hệ BQL."
        )
