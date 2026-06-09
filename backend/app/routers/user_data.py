from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from supabase import Client
from app.core.auth_deps import get_db_client, get_current_user

router = APIRouter(prefix="/api/users", tags=["User Data & Personalization"])

# ─── Pydantic Models ──────────────────────────────────────────────────────────
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class FavoriteToggle(BaseModel):
    place_id: UUID

class ItineraryCreate(BaseModel):
    name: str
    duration: str
    place_slugs: List[str]
    steps: List[dict]

# ─── User Profile Endpoints ───────────────────────────────────────────────────
@router.get("/me")
def get_my_profile(current_user: dict = Depends(get_current_user), db: Client = Depends(get_db_client)):
    try:
        user_id = current_user["id"]
        res = db.table("app_users").select("*").eq("id", user_id).execute()
        if res.data and len(res.data) > 0:
            user_data = res.data[0]
            user_data["email"] = current_user["email"]
            return user_data
            
        # Fail-safe: Tự động đồng bộ/tạo hồ sơ trong app_users nếu chưa tồn tại
        metadata = current_user.get("user_metadata", {})
        name = metadata.get("name") or (current_user.get("email") or "visitor").split("@")[0] or "Khách du lịch"
        phone = metadata.get("phone")
        avatar_url = metadata.get("avatar_url")
        
        insert_payload = {
            "id": user_id,
            "name": name,
            "phone": phone,
            "avatar_url": avatar_url,
            "role": "visitor"
        }
        
        insert_res = db.table("app_users").insert(insert_payload).execute()
        if insert_res.data and len(insert_res.data) > 0:
            user_data = insert_res.data[0]
            user_data["email"] = current_user["email"]
            return user_data
            
        raise HTTPException(status_code=404, detail="Không tìm thấy hoặc không thể tạo hồ sơ người dùng trong hệ thống.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy hồ sơ: {str(e)}")

@router.put("/me")
def update_my_profile(
    profile: ProfileUpdate, 
    current_user: dict = Depends(get_current_user), 
    db: Client = Depends(get_db_client)
):
    try:
        user_id = current_user["id"]
        payload = profile.dict(exclude_unset=True)
        if not payload:
            raise HTTPException(status_code=400, detail="Không có thông tin thay đổi.")
            
        res = db.table("app_users").update(payload).eq("id", user_id).execute()
        if res.data and len(res.data) > 0:
            user_data = res.data[0]
            user_data["email"] = current_user["email"]
            return user_data
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ để cập nhật.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi cập nhật hồ sơ: {str(e)}")

@router.post("/me/avatar")
async def upload_my_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db_client)
):
    try:
        user_id = current_user["id"]
        
        # Read file bytes
        contents = await file.read()
        filename_parts = file.filename.split(".")
        file_ext = filename_parts[-1] if len(filename_parts) > 1 else "png"
        
        unique_filename = f"avatars/{user_id}.{file_ext}"
        content_type = file.content_type or "image/png"
        
        # Ensure public bucket 'baden_assets' exists
        try:
            db.storage.create_bucket("baden_assets", options={"public": True})
        except Exception:
            pass
            
        # Delete previous file if exists to prevent cache or space issues
        try:
            db.storage.from_("baden_assets").remove([unique_filename])
        except Exception:
            pass
            
        db.storage.from_("baden_assets").upload(
            path=unique_filename,
            file=contents,
            file_options={"content-type": content_type}
        )
        
        # Get public url
        public_url = db.storage.from_("baden_assets").get_public_url(unique_filename)
        
        # Update user's avatar_url in public.app_users
        db.table("app_users").update({"avatar_url": public_url}).eq("id", user_id).execute()
        
        return {"avatar_url": public_url}
    except Exception as e:
        print(f"[Avatar Upload] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi tải ảnh đại diện lên: {str(e)}")

# ─── Favorites Endpoints ──────────────────────────────────────────────────────
@router.get("/favorites")
def get_my_favorites(current_user: dict = Depends(get_current_user), db: Client = Depends(get_db_client)):
    try:
        user_id = current_user["id"]
        # Lấy các địa danh yêu thích qua join
        res = db.table("user_favorites").select("place_id, tourist_places(*)").eq("user_id", user_id).execute()
        favorites = []
        if res.data:
            for item in res.data:
                if item.get("tourist_places"):
                    favorites.append(item["tourist_places"])
        return favorites
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy địa danh yêu thích: {str(e)}")

@router.post("/favorites/toggle")
def toggle_favorite(
    req: FavoriteToggle, 
    current_user: dict = Depends(get_current_user), 
    db: Client = Depends(get_db_client)
):
    try:
        user_id = current_user["id"]
        place_id = str(req.place_id)
        
        # Kiểm tra xem đã thích chưa
        check_res = db.table("user_favorites").select("id").eq("user_id", user_id).eq("place_id", place_id).execute()
        if check_res.data and len(check_res.data) > 0:
            # Đã thích -> Bỏ thích
            db.table("user_favorites").delete().eq("user_id", user_id).eq("place_id", place_id).execute()
            return {"favorited": False, "message": "Đã bỏ địa danh khỏi danh sách yêu thích."}
        else:
            # Chưa thích -> Thêm thích
            db.table("user_favorites").insert({"user_id": user_id, "place_id": place_id}).execute()
            return {"favorited": True, "message": "Đã thêm địa danh vào danh sách yêu thích."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý địa danh yêu thích: {str(e)}")

# ─── Itineraries Endpoints ────────────────────────────────────────────────────
@router.get("/itineraries")
def get_my_itineraries(current_user: dict = Depends(get_current_user), db: Client = Depends(get_db_client)):
    try:
        user_id = current_user["id"]
        res = db.table("user_itineraries").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy lịch trình đã lưu: {str(e)}")

@router.post("/itineraries")
def create_my_itinerary(
    req: ItineraryCreate, 
    current_user: dict = Depends(get_current_user), 
    db: Client = Depends(get_db_client)
):
    try:
        user_id = current_user["id"]
        payload = {
            "user_id": user_id,
            "name": req.name,
            "duration": req.duration,
            "place_slugs": req.place_slugs,
            "steps": req.steps
        }
        res = db.table("user_itineraries").insert(payload).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        raise HTTPException(status_code=400, detail="Không thể lưu lịch trình.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lưu lịch trình: {str(e)}")

@router.delete("/itineraries/{itinerary_id}")
def delete_my_itinerary(
    itinerary_id: UUID, 
    current_user: dict = Depends(get_current_user), 
    db: Client = Depends(get_db_client)
):
    try:
        user_id = current_user["id"]
        # Chỉ cho phép xóa lịch trình của chính mình
        res = db.table("user_itineraries").delete().eq("id", str(itinerary_id)).eq("user_id", user_id).execute()
        if res.data and len(res.data) > 0:
            return {"status": "success", "message": "Đã xóa lịch trình thành công."}
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch trình để xóa hoặc không có quyền.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xóa lịch trình: {str(e)}")
