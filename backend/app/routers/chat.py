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
        
    # Fetch active announcements
    announcements_str = ""
    try:
        ann_res = db.table("announcements").select("title, content, type").eq("status", "published").execute()
        if ann_res.data:
            parts = []
            for idx, ann in enumerate(ann_res.data, 1):
                parts.append(f"[Thông báo & Cảnh báo số {idx} - Loại: {ann.get('type')} - Tiêu đề: {ann.get('title')}]\nNội dung: {ann.get('content')}")
            announcements_str = "\n\n".join(parts)
    except Exception as e:
        print(f"Failed to fetch announcements for itinerary: {e}")

    # Fetch dynamic cable car schedules from knowledge_articles table (article ID a1c3d359-fe2c-42da-9d19-d94dfcedb022)
    schedules_data_str = ""
    try:
        schedule_res = db.table("knowledge_articles").select("content").eq("id", "a1c3d359-fe2c-42da-9d19-d94dfcedb022").execute()
        if schedule_res.data:
            import json
            raw_content = schedule_res.data[0].get("content", "")
            try:
                parsed = json.loads(raw_content)
                if "schedules" in parsed:
                    schedules_data_str = json.dumps(parsed["schedules"], ensure_ascii=False, indent=2)
                else:
                    schedules_data_str = raw_content
            except Exception:
                schedules_data_str = raw_content
    except Exception as e:
        print(f"Failed to fetch cable car schedules for itinerary: {e}")

    if not schedules_data_str:
        # Fallback in case of database issue
        schedules_data_str = """[
  {
    "title": "Tuyến Đỉnh Vân Sơn",
    "items": [
      {"label": "Thứ 2 - Thứ 6", "hours": "07:00 - 18:00"},
      {"label": "Thứ 7 - Chủ Nhật", "hours": "06:00 - 21:00", "note": "Ngắm led đỉnh núi ban đêm"}
    ]
  },
  {
    "title": "Tuyến Chùa Hang ( Khu vực Chùa Bà - Điện Bà)",
    "items": [
      {"label": "Thứ 2 - Thứ 6", "hours": "06:00 - 18:00"},
      {"label": "Thứ 7 - Chủ Nhật", "hours": "05:30 - 22:00"}
    ]
  },
  {
    "title": "Tuyến Tâm An ( Kết nối Đỉnh núi và Chùa Bà)",
    "items": [
      {"label": "Thứ 2 - Thứ 6", "note": "Đóng cửa"},
      {"label": "Thứ 7 - Chủ Nhật", "hours": "06:00 - 19:00"}
    ]
  }
]"""

    # Fetch weather settings using helper
    weather_status = "sunny"
    weather_temp = "30"
    try:
        from app.core.weather import get_current_weather
        weather_info = get_current_weather(db)
        weather_status = weather_info["weather_status"]
        weather_temp = weather_info["weather_temp"]
    except Exception as e:
        print(f"Failed to fetch weather for itinerary: {e}")

    weather_desc = {
        "sunny": "Nắng ráo",
        "cloudy": "Nhiều mây",
        "rainy": "Có mưa",
        "windy": "Có gió mạnh"
    }.get(weather_status, weather_status)

    # Get local current date and time (Vietnam GMT+7)
    from datetime import datetime, timezone, timedelta
    vn_tz = timezone(timedelta(hours=7))
    now_vn = datetime.now(vn_tz)
    weekdays = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]
    current_weekday = weekdays[now_vn.weekday()]
    current_date_str = now_vn.strftime("%d/%m/%Y")
    current_time_str = now_vn.strftime("%H:%M")

    system_time_context = (
        f"THỜI GIAN HỆ THỐNG HIỆN TẠI:\n"
        f"- Ngày hiện tại: {current_date_str}\n"
        f"- Thứ hiện tại: {current_weekday}\n"
        f"- Giờ hiện tại: {current_time_str}\n"
        f"- Thời tiết hiện tại: {weather_desc}, {weather_temp}°C\n\n"
        f"BẢN TIN CẢNH BÁO & THÔNG BÁO QUAN TRỌNG (Hôm nay):\n"
        f"{announcements_str if announcements_str else 'Không có thông báo đặc biệt nào.'}\n"
    )

    system_prompt = f"""Bạn là Chuyên gia Lộ trình du lịch Núi Bà Đen.
    Hôm nay là thời điểm lập kế hoạch tham quan thực địa.

    {system_time_context}

    BỐI CẢNH ĐỊA LÝ - 3 KHU VỰC CHÍNH (Xác định theo tên và mô tả):
    - 'chan_nui': Chân núi (xuất phát, mua vé, bãi xe, Ga Bà Đen)
    - 'chua_ba': Lưng chừng núi (Chùa Bà, Chùa Hang, Ga Chùa Hang, khu tâm linh giữa núi)
    - 'dinh_nui': Đỉnh núi (Tượng Phật Bà Tây Bổ Đà Sơn, nhà hàng buffet, đỉnh núi 986m, Ga Vân Sơn)

    LỊCH HOẠT ĐỘNG CỦA CÁC TUYẾN CÁP ĐỌC TỪ CƠ SỞ DỮ LIỆU:
    {schedules_data_str}

    CÁC TUYẾN DI CHUYỂN GIỮA KHU VỰC:
    A) Cáp treo Chùa Hang (Ga Bà Đen ↔ Ga Chùa Hang): Kết nối Chân núi ↔ Lưng chừng (Chùa Bà)
    B) Cáp treo Vân Sơn (Ga Bà Đen ↔ Ga Vân Sơn): Kết nối Chân núi ↔ Đỉnh núi (Trực tiếp)
    C) Cáp treo Tâm An (Ga Hòa Đồng ↔ Ga Tâm An): Kết nối Lưng chừng (Chùa Bà) ↔ Đỉnh núi (Tuyến phụ)
    D) Máng trượt ống: Lưng chừng (Chùa Bà) → Chân núi (một chiều, xuống) - Hoạt động hàng ngày.
    E) Leo bộ: CHỈ áp dụng từ Chân núi lên Lưng chừng (đường mòn). KHÔNG có đường leo bộ từ Lưng chừng lên Đỉnh và KHÔNG có đường leo bộ từ Đỉnh xuống.

    QUY TẮC PHÂN TÍCH THỜI GIAN VÀ ĐIỀU HƯỚNG LỘ TRÌNH (BẮT BUỘC):
    1. XÁC ĐỊNH NGÀY THAM QUAN:
       - Hãy đọc câu hỏi/yêu cầu của người dùng để xác định xem họ muốn đi vào ngày nào.
       - Mặc định ngày tham quan là NGÀY HIỆN TẠI của hệ thống ({current_weekday}, {current_date_str}) nếu người dùng không chỉ định ngày cụ thể.
       - Nếu người dùng yêu cầu lập kế hoạch cho một ngày cụ thể trong tương lai (ví dụ: "thứ bảy tuần sau", "ngày 20/06"), hãy dựa vào ngày hiện tại ({current_weekday}, {current_date_str}) để tính toán xem ngày đó là Thứ mấy và Ngày mấy, từ đó đối chiếu với LỊCH HOẠT ĐỘNG CỦA CÁC TUYẾN CÁP ở trên để áp dụng đúng giờ chạy của ngày đó.
    2. ĐỐI CHIẾU THÔNG BÁO BẢO TRÌ/ĐÓNG CỬA:
       - Đọc kỹ phần BẢN TIN CẢNH BÁO & THÔNG BÁO QUAN TRỌNG ở trên.
       - Nếu có thông báo bảo trì hoặc tạm ngưng hoạt động của bất kỳ tuyến cáp nào ảnh hưởng đến ngày tham quan được chọn, bạn phải coi tuyến cáp đó là KHÔNG HOẠT ĐỘNG.
    3. QUY TẮC THỜI TIẾT VÀ AN TOÀN (BẮT BUỘC ĐỐI CHIẾU):
       - Nếu thời tiết hiện tại ở trên ghi là "Có mưa" (rainy) hoặc "Có gió mạnh" (windy):
         - Bạn phải chủ động nhắc nhở du khách chuẩn bị ô/áo mưa, đi giày có độ bám tốt để chống trơn trượt trên các bậc đá ở Chùa Bà, và lưu ý máng trượt (Alpine Coaster) và cáp treo có thể vận hành chậm hơn hoặc tạm dừng hoạt động ngắn hạn để đảm bảo an toàn. Khuyên du khách nên tham quan bằng cáp treo hoặc trong nhà.
       - Nếu thời tiết nắng nóng (nhiệt độ >= 32°C): Nhắc nhở mang mũ/nón, kem chống nắng và chuẩn bị nước uống đầy đủ.
    4. LOGIC ĐIỀU HƯỚNG DỰ PHÒNG:
       - **Di chuyển Chùa Bà ↔ Đỉnh núi:** 
         - Đối chiếu lịch chạy chuẩn của Tuyến Tâm An ở trên. Nếu ngày tham quan rơi vào ngày thường mà tuyến này ghi "Đóng cửa" (hoặc không ghi giờ chạy), HOẶC tuyến Tâm An bị thông báo đóng cửa/bảo trì: Tuyến Tâm An KHÔNG hoạt động. Hành khách muốn đi từ Chùa Bà lên Đỉnh núi bắt buộc phải đi cáp Chùa Hang (hoặc máng trượt/đi bộ) xuống Chân núi, sau đó đi cáp Vân Sơn từ Chân núi lên Đỉnh núi.
         - Nếu ngày tham quan rơi vào cuối tuần và tuyến Tâm An hoạt động bình thường, hành khách có thể đi thẳng bằng tuyến cáp Tâm An (Lưng chừng ↔ Đỉnh).
       - **Trường hợp KHÔNG THỂ lên Đỉnh núi:**
         - Nếu cả tuyến Vân Sơn và tuyến Tâm An đều không hoạt động vào ngày tham quan (ví dụ: ngày thường cáp Vân Sơn bảo trì, hoặc cả hai cáp đều bảo trì): du khách KHÔNG THỂ lên đỉnh núi.
         - Bạn phải TỪ CHỐI lập lộ trình lên đỉnh núi. Phản hồi bằng một thông báo rõ ràng về lý do các tuyến cáp đóng cửa trong phần mô tả lộ trình, và gợi ý lộ trình thay thế chỉ tham quan Chùa Bà và Chân núi. Tuyệt đối không gợi ý leo bộ lên đỉnh hay đi cáp đã đóng cửa.
    5. TUẦN TỰ VẬT LÝ: Bước đi cáp treo từ A lên B → bước tiếp theo PHẢI ở khu vực B.
    6. BUFFET: Chỉ có Buffet TRƯA (11h-14h) tại nhà hàng trên Đỉnh núi, KHÔNG có buffet sáng.
    7. THỜI GIAN CÁP TREO: Cộng thêm 20-30 phút cho mỗi lần di chuyển cáp treo (bao gồm chờ + đi).
    8. HỢP LÝ: Tránh lên xuống núi nhiều lần không cần thiết.

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

