from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from uuid import UUID
from supabase import Client, create_client
from app.core.config import settings
from app.models.itineraries import ItineraryResponse, ItineraryCreate, ItineraryUpdate

router = APIRouter(prefix="/api/itineraries", tags=["Itineraries"])

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

@router.get("", response_model=List[ItineraryResponse])
def get_itineraries(db: Client = Depends(get_db)):
    try:
        response = db.table("itineraries").select("*").order("created_at").execute()
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=ItineraryResponse)
def create_itinerary(payload: ItineraryCreate, db: Client = Depends(get_db)):
    try:
        response = db.table("itineraries").insert(payload.dict()).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Không thể tạo lộ trình")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{itinerary_id}", response_model=ItineraryResponse)
def update_itinerary(itinerary_id: UUID, payload: ItineraryUpdate, db: Client = Depends(get_db)):
    try:
        response = db.table("itineraries").update(payload.dict(exclude_unset=True)).eq("id", str(itinerary_id)).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Không tìm thấy lộ trình để cập nhật")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{itinerary_id}")
def delete_itinerary(itinerary_id: UUID, db: Client = Depends(get_db)):
    try:
        db.table("itineraries").delete().eq("id", str(itinerary_id)).execute()
        return {"status": "success", "message": "Đã xóa lộ trình di chuyển thành công"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
