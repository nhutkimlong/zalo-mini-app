import uuid
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from supabase import Client, create_client
from app.core.config import settings
from app.models.feedback import FeedbackResponse, FeedbackCreate, FeedbackUpdate, FeedbackStats

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])

def get_db():
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return None
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Local memory store for offline mode execution
OFFLINE_FEEDBACKS = [
    {
        "id": "d1c3d359-fe2c-42da-9d19-d94dfcedb051",
        "reporter_name": "Lê Hoàng Nam",
        "phone": "0909887766",
        "report_type": "ve_sinh",
        "content": "Tại khu vực nhà vệ sinh công cộng gần Chùa Bà bị đọng nước gây trơn trượt nguy hiểm và có mùi hôi chưa được dọn dẹp sạch sẽ kịp thời lúc trưa đông khách.",
        "image_url": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400",
        "latitude": 11.378401,
        "longitude": 106.168855,
        "status": "new",
        "assigned_unit": "Đội Vệ Sinh Môi Trường",
        "internal_note": "Cần phân công nhân sự trực liên tục vào các khung giờ cao điểm 11h-13h.",
        "created_at": "2026-05-20T12:00:00Z",
        "updated_at": "2026-05-20T12:00:00Z"
    },
    {
        "id": "d1c3d359-fe2c-42da-9d19-d94dfcedb052",
        "reporter_name": "Phạm Minh Tuấn",
        "phone": "0911223344",
        "report_type": "cheo_keo",
        "content": "Xuất hiện tình trạng một nhóm người chèo kéo du khách mua vé số, bán nhang đèn ngay khi du khách vừa bước xuống bãi đỗ xe ô tô số 2 gây phiền hà.",
        "image_url": None,
        "latitude": 11.370500,
        "longitude": 106.161000,
        "status": "in_progress",
        "assigned_unit": "Đội Trật Tự Khu Di Tích",
        "internal_note": "Đã cử lực lượng bảo vệ tăng cường tuần tra tại khu vực bãi đỗ xe số 2 để nhắc nhở và giải tán.",
        "created_at": "2026-05-21T09:00:00Z",
        "updated_at": "2026-05-21T09:30:00Z"
    }
]

@router.get("/", response_model=List[FeedbackResponse])
def list_feedbacks(status: Optional[str] = None, db: Optional[Client] = Depends(get_db)):
    if not db:
        res = OFFLINE_FEEDBACKS
        if status:
            res = [f for f in res if f["status"] == status]
        return res

    try:
        query = db.table("feedback_reports").select("*")
        if status:
            query = query.eq("status", status)
        response = query.order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        print(f"Feedback list query error: {e}")
        res = OFFLINE_FEEDBACKS
        if status:
            res = [f for f in res if f["status"] == status]
        return res

@router.get("/stats", response_model=FeedbackStats)
def get_feedback_stats(db: Optional[Client] = Depends(get_db)):
    feedbacks = OFFLINE_FEEDBACKS
    if db:
        try:
            res = db.table("feedback_reports").select("status").execute()
            if res.data:
                feedbacks = res.data
        except Exception as e:
            print(f"Stats query failed: {e}")

    total = len(feedbacks)
    new_rep = sum(1 for f in feedbacks if f["status"] == "new")
    prog = sum(1 for f in feedbacks if f["status"] == "in_progress")
    res = sum(1 for f in feedbacks if f["status"] == "resolved")
    
    return FeedbackStats(
        total_reports=total,
        new_reports=new_rep,
        in_progress_reports=prog,
        resolved_reports=res
    )

@router.post("/", response_model=FeedbackResponse)
def submit_feedback(report: FeedbackCreate, db: Optional[Client] = Depends(get_db)):
    payload = report.dict()
    
    if not db:
        # Offline mode fallback simulation
        new_id = uuid.uuid4()
        now_str = datetime.utcnow().isoformat()
        simulated_report = {
            "id": new_id,
            "reporter_name": payload["reporter_name"],
            "phone": payload["phone"],
            "report_type": payload["report_type"],
            "content": payload["content"],
            "image_url": payload["image_url"],
            "latitude": payload["latitude"],
            "longitude": payload["longitude"],
            "status": "new",
            "assigned_unit": None,
            "internal_note": None,
            "created_at": now_str,
            "updated_at": now_str
        }
        OFFLINE_FEEDBACKS.append(simulated_report)
        return simulated_report

    try:
        response = db.table("feedback_reports").insert(payload).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Không thể lưu phản ánh của quý khách")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{feedback_id}", response_model=FeedbackResponse)
def update_feedback_status(feedback_id: UUID, update: FeedbackUpdate, db: Optional[Client] = Depends(get_db)):
    payload = update.dict(exclude_unset=True)
    
    if not db:
        # Update local list
        for f in OFFLINE_FEEDBACKS:
            if f["id"] == str(feedback_id) or f["id"] == feedback_id:
                for k, v in payload.items():
                    f[k] = v
                f["updated_at"] = datetime.utcnow().isoformat()
                return f
        raise HTTPException(status_code=404, detail="Không tìm thấy phản ánh để cập nhật")

    try:
        response = db.table("feedback_reports").update(payload).eq("id", str(feedback_id)).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Không tìm thấy phản ánh để cập nhật")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
