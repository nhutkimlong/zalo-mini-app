from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from supabase import Client, create_client
from app.core.config import settings

router = APIRouter(prefix="/api/admin/users", tags=["Admin Users"])

def get_db():
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise HTTPException(status_code=503, detail="Cấu hình kết nối cơ sở dữ liệu Supabase bị thiếu.")
    try:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Không thể kết nối Supabase: {str(e)}")

class UserCreate(BaseModel):
    zalo_user_id: str
    name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = "visitor"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: UUID
    zalo_user_id: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("", response_model=List[UserResponse])
def get_users(db: Client = Depends(get_db)):
    try:
        res = db.table("app_users").select("*").order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tải danh sách người dùng: {str(e)}")

@router.post("", response_model=UserResponse)
def create_user(user: UserCreate, db: Client = Depends(get_db)):
    try:
        # Check unique zalo_user_id
        check_res = db.table("app_users").select("id").eq("zalo_user_id", user.zalo_user_id).execute()
        if check_res.data:
            raise HTTPException(status_code=400, detail="Zalo User ID này đã tồn tại trên hệ thống")
            
        res = db.table("app_users").insert(user.dict()).execute()
        if res.data:
            return res.data[0]
        raise HTTPException(status_code=400, detail="Không thể tạo người dùng mới")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tạo người dùng: {str(e)}")

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: UUID, user: UserUpdate, db: Client = Depends(get_db)):
    try:
        payload = user.dict(exclude_unset=True)
        res = db.table("app_users").update(payload).eq("id", str(user_id)).execute()
        if res.data:
            return res.data[0]
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng để cập nhật")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi cập nhật thông tin người dùng: {str(e)}")

@router.delete("/{user_id}")
def delete_user(user_id: UUID, db: Client = Depends(get_db)):
    try:
        # 1. Gỡ liên kết trong bảng chat_logs và knowledge_articles để tránh lỗi Foreign Key Constraint
        db.table("chat_logs").update({"user_id": None}).eq("user_id", str(user_id)).execute()
        db.table("knowledge_articles").update({"updated_by": None}).eq("updated_by", str(user_id)).execute()
        
        # 2. Tiến hành xóa user
        res = db.table("app_users").delete().eq("id", str(user_id)).execute()
        if res.data:
            return {"status": "success", "message": "Đã xóa người dùng thành công"}
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng để xóa")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xóa người dùng: {str(e)}")
