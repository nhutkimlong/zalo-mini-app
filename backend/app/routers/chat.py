from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List, Dict
from uuid import UUID
from pydantic import BaseModel
from supabase import Client, create_client
from app.core.config import settings
from app.models.chat import ChatRequest, ChatResponse
from app.services.rag_service import rag_service
from app.core.auth_deps import get_optional_user

class ItineraryRequest(BaseModel):
    request: str

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

@router.post("/itinerary", response_model=dict)
def generate_itinerary_endpoint(
    payload: ItineraryRequest,
    db: Client = Depends(get_db)
):
    """
    Generate an AI-powered travel itinerary on Mount Ba Den.
    Returns structured JSON steps.
    """
    if not db:
        raise HTTPException(
            status_code=503,
            detail="Cấu hình kết nối cơ sở dữ liệu Supabase bị thiếu."
        )
        
    try:
        # Fetch published places from Supabase
        res = db.table("tourist_places").select("id, name, short_description, category, latitude, longitude").eq("status", "published").execute()
        places = res.data or []
    except Exception as e:
        print(f"Failed to fetch places for itinerary: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi truy vấn cơ sở dữ liệu địa điểm: {str(e)}"
        )
        
    # Build places string for prompt
    places_str = "\n".join([
        f"ID: {p['id']} - Tên: {p['name']} (Thể loại: {p['category']}, Tọa độ: {p['latitude']},{p['longitude']}). Mô tả: {p.get('short_description', '')}"
        for p in places
    ])
    
    # Check Beeknoee client
    client = rag_service.llm_client
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Dịch vụ AI hiện thời chưa sẵn sàng."
        )
        
    system_prompt = f"""Bạn là Chuyên gia Lộ trình du lịch Núi Bà Đen.
    Hôm nay là thời điểm lập kế hoạch tham quan thực địa.

    BỐI CẢNH ĐỊA LÝ - 3 KHU VỰC CHÍNH (Xác định theo tên và mô tả):
    - 'chan_nui': Chân núi (xuất phát, mua vé, bãi xe, Ga Bà Đen)
    - 'chua_ba': Lưng chừng núi (Chùa Bà, Chùa Hang, Ga Chùa Hang, khu tâm linh giữa núi)
    - 'dinh_nui': Đỉnh núi (Tượng Phật Bà Tây Bổ Đà Sơn, nhà hàng buffet, đỉnh núi 986m, Ga Vân Sơn)

    CÁC TUYẾN DI CHUYỂN GIỮA KHU VỰC:
    A) Cáp treo Chùa Hang (Ga Bà Đen → Ga Chùa Hang): Chân núi → Lưng chừng
    B) Cáp treo Vân Sơn (Ga Hòa Đồng → Ga Vân Sơn): Lưng chừng → Đỉnh núi
    C) Cáp treo Tâm An (Ga Hòa Đồng → Ga Tâm An): Lưng chừng → Đỉnh núi (tuyến phụ)
    D) Máng trượt ống: Lưng chừng (Chùa Bà) → Chân núi (một chiều, xuống)
    E) Leo bộ: CHỈ áp dụng từ Chân núi lên Lưng chừng (đường mòn). KHÔNG có đường leo bộ từ Lưng chừng lên Đỉnh và KHÔNG có đường leo bộ từ Đỉnh xuống.

    QUY TẮC VÀNG (BẮT BUỘC):
    1. TUẦN TỰ VẬT LÝ: Bước đi cáp treo từ A lên B → bước tiếp theo PHẢI ở khu vực B.
    2. TUYỆT ĐỐI KHÔNG GỢI Ý LEO BỘ từ Lưng chừng lên Đỉnh, hoặc từ Đỉnh xuống. Nếu đã ở Đỉnh núi, phương tiện xuống duy nhất là cáp treo.
    3. BUFFET: Chỉ có Buffet TRƯA (11h-14h) tại nhà hàng trên Đỉnh núi, KHÔNG có buffet sáng.
    4. THỜI GIAN CÁP TREO: Cộng thêm 20-30 phút cho mỗi lần di chuyển cáp treo (bao gồm chờ + đi).
    5. HỢP LÝ: Tránh lên xuống núi nhiều lần không cần thiết.

    DANH SÁCH ĐỊA ĐIỂM HÔM NAY:
    {places_str}

    Trả về DUY NHẤT một chuỗi JSON chuẩn có dạng:
    {{
      "title": "Tiêu đề lộ trình hấp dẫn",
      "total_duration_minutes": 180,
      "steps": [
        {{ "poi_id": "UUID_địa_điểm", "poi_name": "Tên địa điểm", "zone": "chan_nui/chua_ba/dinh_nui", "estimated_duration_minutes": 30, "description": "Mô tả hành động cụ thể tại địa điểm này" }}
      ]
    }}
    Lưu ý: poi_id phải là UUID chính xác từ danh sách trên. Không thêm bất kỳ text nào ngoài JSON."""

    try:
        dyn_config = rag_service._get_dynamic_settings()
        from app.services.rag_service import _call_llm
        raw_answer, _ = _call_llm(
            client=client,
            system_prompt=system_prompt,
            user_question=payload.request,
            model=dyn_config["model"],
            input_cost_per_1m=dyn_config["input_cost"],
            output_cost_per_1m=dyn_config["output_cost"],
            temperature=0.1
        )
        
        # Parse JSON from LLM response
        import json
        import re
        json_match = re.search(r"\{[\s\S]*\}", raw_answer)
        if json_match:
            content = json.loads(json_match.group(0))
            return content
        else:
            raise HTTPException(
                status_code=500,
                detail="Không thể phân tích định dạng JSON từ phản hồi của AI."
            )
    except Exception as e:
        print(f"Itinerary generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi lập kế hoạch hành trình: {str(e)}"
        )

