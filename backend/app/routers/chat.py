from fastapi import APIRouter, HTTPException, Depends
from supabase import Client, create_client
from app.core.config import settings
from app.models.chat import ChatRequest, ChatResponse
from app.services.rag_service import rag_service

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])

def get_db():
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return None
    try:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception:
        return None

@router.post("/", response_model=ChatResponse)
def ask_ai_assistant(payload: ChatRequest, db: Client = Depends(get_db)):
    """
    RAG Assistant Chat endpoint.
    Retrieves knowledge context and responds with sources.
    """
    if not payload.question or not payload.question.strip():
        raise HTTPException(status_code=400, detail="Câu hỏi không được để trống")
        
    resolved_user_uuid = None
    if db and payload.user_info and payload.user_info.zalo_user_id:
        try:
            zalo_id = payload.user_info.zalo_user_id
            # 1. Kiểm tra xem user đã tồn tại chưa
            res = db.table("app_users").select("id").eq("zalo_user_id", zalo_id).execute()
            if res.data:
                resolved_user_uuid = res.data[0]["id"]
            else:
                # 2. Đăng ký tự động user mới nếu chưa tồn tại
                new_user = {
                    "zalo_user_id": zalo_id,
                    "name": payload.user_info.name or "Khách Zalo Mini App",
                    "avatar_url": payload.user_info.avatar_url,
                    "role": "visitor"
                }
                insert_res = db.table("app_users").insert(new_user).execute()
                if insert_res.data:
                    resolved_user_uuid = insert_res.data[0]["id"]
        except Exception as ue:
            print(f"Error resolving or registering user in chat endpoint: {ue}")
            # Bỏ qua lỗi và tiếp tục để không chặn luồng chat của người dùng
            pass

    user_id_to_log = payload.user_id or resolved_user_uuid

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
        # Secure server-side error fallback to satisfy the user criteria
        raise HTTPException(
            status_code=500, 
            detail="Có lỗi xảy ra trên hệ thống RAG. Vui lòng thử lại sau hoặc liên hệ BQL."
        )
