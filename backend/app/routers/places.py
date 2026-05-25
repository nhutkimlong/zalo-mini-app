from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from uuid import UUID
from supabase import Client, create_client
from app.core.config import settings
from app.models.places import PlaceResponse, PlaceCreate, PlaceUpdate

router = APIRouter(prefix="/api/places", tags=["Places"])

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

@router.get("/", response_model=List[PlaceResponse])
def get_places(category: Optional[str] = None, db: Client = Depends(get_db)):
    try:
        query = db.table("tourist_places").select("*").eq("status", "published")
        if category:
            query = query.eq("category", category)
        response = query.order("display_order", desc=False).order("created_at", desc=False).execute()
        return response.data
    except Exception as e:
        print(f"Places database error: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi truy vấn danh sách địa điểm: {str(e)}")

@router.get("/{slug}", response_model=PlaceResponse)
def get_place_by_slug(slug: str, db: Client = Depends(get_db)):
    try:
        response = db.table("tourist_places").select("*").eq("slug", slug).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Không tìm thấy địa điểm tham quan")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Places slug query error: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi truy vấn cơ sở dữ liệu địa điểm theo slug: {str(e)}")

OPTIONAL_PLACE_FIELDS = {"audio_enabled", "audio_url_en", "name_en", "short_description_en", "full_description_en"}


def _execute_with_optional_fields(call_factory, payload: dict):
    """Run a Supabase write, dropping unknown columns one at a time and retrying."""
    data = dict(payload)
    while True:
        try:
            response = call_factory(data).execute()
            return response, data
        except Exception as exc:
            message = str(exc)
            missing = None
            for field in list(data.keys()):
                if field in OPTIONAL_PLACE_FIELDS and f"'{field}'" in message:
                    missing = field
                    break
            if not missing:
                raise
            print(f"[places] dropping unsupported column '{missing}'. Migration needed.")
            data.pop(missing, None)
            if not data:
                raise


@router.post("/", response_model=PlaceResponse)
def create_place(place: PlaceCreate, db: Client = Depends(get_db)):
    try:
        response, _ = _execute_with_optional_fields(
            lambda payload: db.table("tourist_places").insert(payload),
            place.dict(),
        )
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Không thể tạo địa điểm")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{place_id}", response_model=PlaceResponse)
def update_place(place_id: UUID, place: PlaceUpdate, db: Client = Depends(get_db)):
    try:
        response, _ = _execute_with_optional_fields(
            lambda payload: db.table("tourist_places").update(payload).eq("id", str(place_id)),
            place.dict(exclude_unset=True),
        )
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Không tìm thấy địa điểm để cập nhật")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{place_id}")
def delete_place(place_id: UUID, db: Client = Depends(get_db)):
    try:
        response = db.table("tourist_places").delete().eq("id", str(place_id)).execute()
        return {"status": "success", "message": "Đã xóa địa điểm thành công"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
