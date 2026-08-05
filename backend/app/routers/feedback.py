import uuid
from urllib.parse import unquote
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from supabase import Client, create_client
from app.core.config import settings
from app.models.feedback import FeedbackResponse, FeedbackCreate, FeedbackUpdate, FeedbackStats, FeedbackAppend

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

from app.core.auth_deps import get_optional_user
from app.services.zalo_notifier import zalo_notifier
from app.services.telegram_notifier import telegram_notifier

@router.post("/", response_model=FeedbackResponse)
def submit_feedback(
    report: FeedbackCreate, 
    background_tasks: BackgroundTasks,
    db: Client = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    payload = report.dict()
    if current_user:
        payload["user_id"] = current_user["id"]
        # Điền tên tự động nếu chưa có
        if not payload.get("reporter_name") and current_user.get("user_metadata"):
            payload["reporter_name"] = current_user["user_metadata"].get("name")
    try:
        response = db.table("feedback_reports").insert(payload).execute()
        if response.data:
            created_row = response.data[0]
            # Tự động gửi tin nhắn Telegram & Zalo thông báo tới Admin
            background_tasks.add_task(telegram_notifier.notify_admin_feedback, created_row, is_update=False)
            background_tasks.add_task(zalo_notifier.notify_admin_feedback, created_row, is_update=False)
            return created_row

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

@router.patch("/{feedback_id}/append", response_model=FeedbackResponse)
def append_feedback(
    feedback_id: UUID,
    append_data: FeedbackAppend,
    background_tasks: BackgroundTasks,
    db: Client = Depends(get_db)
):
    try:
        res = db.table("feedback_reports").select("*").eq("id", str(feedback_id)).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy phản ánh để bổ sung")
            
        existing = res.data[0]
        update_payload = {}
        
        if append_data.additional_content:
            existing_content = existing.get("content", "")
            if append_data.additional_content != existing_content:
                update_payload["content"] = f"{existing_content}\n[Bổ sung]: {append_data.additional_content}"
        
        if append_data.phone:
            update_payload["phone"] = append_data.phone
        if append_data.reporter_name:
            update_payload["reporter_name"] = append_data.reporter_name
        if append_data.image_url:
            update_payload["image_url"] = append_data.image_url
        if append_data.report_type:
            update_payload["report_type"] = append_data.report_type
            
        if update_payload:
            upd_res = db.table("feedback_reports").update(update_payload).eq("id", str(feedback_id)).execute()
            if upd_res.data:
                updated_row = upd_res.data[0]
                background_tasks.add_task(telegram_notifier.notify_admin_feedback, updated_row, is_update=True)
                background_tasks.add_task(zalo_notifier.notify_admin_feedback, updated_row, is_update=True)
                return updated_row

        return existing
            
        if not update_payload:
            return existing

        response = db.table("feedback_reports").update(update_payload).eq("id", str(feedback_id)).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Cập nhật thông tin phản ánh thất bại")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{feedback_id}")
def delete_feedback(feedback_id: UUID, db: Client = Depends(get_db)):
    try:
        # 1. Xóa phản ánh trong Database trước để lấy thông tin ảnh đính kèm (nếu có)
        response = db.table("feedback_reports").delete().eq("id", str(feedback_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy phản ánh để xóa")
            
        deleted_feedback = response.data[0]
        image_url = deleted_feedback.get("image_url")
        
        # 2. Xóa hình ảnh tương ứng trong Supabase Storage nếu có đính kèm
        if image_url:
            try:
                # Đường dẫn dạng: https://.../storage/v1/object/public/baden_assets/images/...
                marker = "public/baden_assets/"
                if marker in image_url:
                    file_path = image_url.split(marker)[-1]
                    file_path = unquote(file_path) # Giải mã ký tự URL-encode (như %2F, %20, ...)
                    
                    # Thực hiện xóa khỏi storage bucket 'baden_assets'
                    db.storage.from_("baden_assets").remove([file_path])
                    print(f"Successfully deleted attached feedback image: {file_path}")
            except Exception as storage_err:
                # Chỉ in log lỗi chứ không trả về lỗi 500 cho client vì DB đã xóa thành công
                print(f"Failed to delete attached feedback image from storage: {storage_err}")
                
        return {"status": "success", "message": "Đã xóa phản ánh và hình ảnh đính kèm thành công"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
