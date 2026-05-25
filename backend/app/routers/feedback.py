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
        raise HTTPException(
            status_code=503,
            detail="Cấu hình kết nối cơ sở dữ liệu Supabase bị thiếu (SUPABASE_URL hoặc SUPABASE_KEY)."
        )
    try:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Không thể khởi tạo kết nối Supabase: {str(e)}"
        )

@router.get("/", response_model=List[FeedbackResponse])
def list_feedbacks(status: Optional[str] = None, db: Client = Depends(get_db)):
    try:
        query = db.table("feedback_reports").select("*")
        if status:
            query = query.eq("status", status)
        response = query.order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        print(f"Feedback list query error: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi truy vấn danh sách ý kiến phản ánh: {str(e)}")

@router.get("/stats", response_model=FeedbackStats)
def get_feedback_stats(db: Client = Depends(get_db)):
    try:
        res = db.table("feedback_reports").select("status").execute()
        feedbacks = res.data or []
    except Exception as e:
        print(f"Stats query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi truy vấn số liệu thống kê phản ánh: {str(e)}")

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
def submit_feedback(report: FeedbackCreate, db: Client = Depends(get_db)):
    payload = report.dict()
    try:
        response = db.table("feedback_reports").insert(payload).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Không thể lưu phản ánh của quý khách")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{feedback_id}", response_model=FeedbackResponse)
def update_feedback_status(feedback_id: UUID, update: FeedbackUpdate, db: Client = Depends(get_db)):
    payload = update.dict(exclude_unset=True)
    try:
        response = db.table("feedback_reports").update(payload).eq("id", str(feedback_id)).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Không tìm thấy phản ánh để cập nhật")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{feedback_id}")
def delete_feedback(feedback_id: UUID, db: Client = Depends(get_db)):
    try:
        response = db.table("feedback_reports").delete().eq("id", str(feedback_id)).execute()
        return {"status": "success", "message": "Đã xóa phản ánh thành công"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
