from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from supabase import Client, create_client
from app.core.config import settings
from app.models.announcements import AnnouncementResponse, AnnouncementCreate, AnnouncementUpdate

router = APIRouter(prefix="/api/announcements", tags=["Announcements"])

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

@router.get("/", response_model=List[AnnouncementResponse])
def get_announcements(type: Optional[str] = None, db: Client = Depends(get_db)):
    try:
        query = db.table("announcements").select("*").eq("status", "published")
        if type:
            query = query.eq("type", type)
        response = query.order("published_at", desc=True).execute()
        return response.data
    except Exception as e:
        print(f"Announcements DB error: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi truy vấn danh sách bản tin thông báo: {str(e)}")

@router.get("/{announcement_id}", response_model=AnnouncementResponse)
def get_announcement_by_id(announcement_id: UUID, db: Client = Depends(get_db)):
    try:
        response = db.table("announcements").select("*").eq("id", str(announcement_id)).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Announcement ID query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi truy vấn chi tiết thông báo theo ID: {str(e)}")

@router.post("/", response_model=AnnouncementResponse)
def create_announcement(announcement: AnnouncementCreate, db: Client = Depends(get_db)):
    try:
        payload = announcement.dict()
        payload["published_at"] = datetime.utcnow().isoformat()
        response = db.table("announcements").insert(payload).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Không thể đăng thông báo")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{announcement_id}", response_model=AnnouncementResponse)
def update_announcement(announcement_id: UUID, announcement: AnnouncementUpdate, db: Client = Depends(get_db)):
    try:
        response = db.table("announcements").update(announcement.dict(exclude_unset=True)).eq("id", str(announcement_id)).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo để cập nhật")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{announcement_id}")
def delete_announcement(announcement_id: UUID, db: Client = Depends(get_db)):
    try:
        db.table("announcements").delete().eq("id", str(announcement_id)).execute()
        return {"status": "success", "message": "Đã xóa thông báo thành công"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
