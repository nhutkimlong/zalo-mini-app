from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from supabase import Client, create_client
from app.core.config import settings

router = APIRouter(prefix="/api/badges", tags=["Badges"])

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

class BadgeCreate(BaseModel):
    title: str
    title_en: Optional[str] = None
    title_km: Optional[str] = None
    xp_required: int
    description: Optional[str] = None
    description_en: Optional[str] = None
    description_km: Optional[str] = None
    icon_url: Optional[str] = None

class BadgeUpdate(BaseModel):
    title: Optional[str] = None
    title_en: Optional[str] = None
    title_km: Optional[str] = None
    xp_required: Optional[int] = None
    description: Optional[str] = None
    description_en: Optional[str] = None
    description_km: Optional[str] = None
    icon_url: Optional[str] = None

@router.get("")
def get_badges(db: Client = Depends(get_db)):
    try:
        response = db.table("badge_rules").select("*").order("xp_required", desc=False).execute()
        return response.data or []
    except Exception as e:
        print(f"Badges DB query error: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi truy vấn danh sách danh hiệu: {str(e)}")

@router.post("")
def create_badge(badge: BadgeCreate, db: Client = Depends(get_db)):
    try:
        payload = badge.dict(exclude_none=True)
        response = db.table("badge_rules").insert(payload).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Không thể tạo danh hiệu mới")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tạo danh hiệu: {str(e)}")

@router.put("/{badge_id}")
def update_badge(badge_id: UUID, badge: BadgeUpdate, db: Client = Depends(get_db)):
    try:
        payload = badge.dict(exclude_unset=True)
        response = db.table("badge_rules").update(payload).eq("id", str(badge_id)).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Không tìm thấy danh hiệu để cập nhật")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi cập nhật danh hiệu: {str(e)}")

@router.delete("/{badge_id}")
def delete_badge(badge_id: UUID, db: Client = Depends(get_db)):
    try:
        response = db.table("badge_rules").delete().eq("id", str(badge_id)).execute()
        if response.data:
            return {"status": "success", "message": "Đã xóa danh hiệu thành công"}
        raise HTTPException(status_code=404, detail="Không tìm thấy danh hiệu để xóa")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xóa danh hiệu: {str(e)}")
