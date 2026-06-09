import math
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from supabase import Client
from app.core.auth_deps import get_db_client, get_current_user, get_optional_user

router = APIRouter(prefix="/api/tourism", tags=["Tourism Digitalization"])

# ─── Pydantic Models ──────────────────────────────────────────────────────────
class RealtimeUpdate(BaseModel):
    weather_auto: bool
    weather_status: str
    weather_temp: int

class CheckinRequest(BaseModel):
    place_slug: str
    latitude: float
    longitude: float
    verified_via: Optional[str] = "gps"

# Helper function to compute Haversine distance in meters
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

# ─── Option B: Real-time Status Endpoints ─────────────────────────────────────
@router.get("/realtime")
def get_realtime_status(db: Client = Depends(get_db_client)):
    try:
        response = db.table("system_settings").select("*").execute()
        data = response.data or []
        
        # Default fallbacks
        status_map = {
            "REALTIME_WEATHER_AUTO": "true",
            "REALTIME_WEATHER_STATUS": "sunny",
            "REALTIME_WEATHER_TEMP": "30"
        }
        
        for row in data:
            key = row.get("key")
            val = row.get("value")
            if key in status_map:
                status_map[key] = val
                
        weather_status = status_map["REALTIME_WEATHER_STATUS"]
        weather_temp = int(status_map["REALTIME_WEATHER_TEMP"])
        weather_auto = status_map["REALTIME_WEATHER_AUTO"].lower() == "true"
        
        if weather_auto:
            try:
                import urllib.request
                import json
                # Coordinates for Ba Den Mountain peak
                lat = 11.382056
                lon = 106.172218
                url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code"
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=3) as resp:
                    weather_data = json.loads(resp.read().decode('utf-8'))
                    current = weather_data.get("current", {})
                    if "temperature_2m" in current and "weather_code" in current:
                        raw_temp = current["temperature_2m"]
                        weather_temp = round(raw_temp)
                        code = current["weather_code"]
                        # Map meteorological code to status
                        if code == 0:
                            weather_status = "sunny"
                        elif code in [1, 2, 3, 45, 48, 71, 73, 75, 77, 85, 86]:
                            weather_status = "cloudy"
                        elif code in [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]:
                            weather_status = "rainy"
                        elif code in [95, 96, 99]:
                            weather_status = "windy"
            except Exception as api_err:
                print(f"[Weather API] Failed to fetch from Open-Meteo: {api_err}")
                # Fail silently and fall back to database values
                
        return {
            "weather_auto": weather_auto,
            "weather_status": weather_status,
            "weather_temp": weather_temp
        }
    except Exception as e:
        print(f"Failed to fetch realtime status: {e}")
        return {
            "weather_auto": True,
            "weather_status": "sunny",
            "weather_temp": 30
        }

@router.put("/realtime")
def update_realtime_status(req: RealtimeUpdate, db: Client = Depends(get_db_client)):
    try:
        settings_payload = [
            {"key": "REALTIME_WEATHER_AUTO", "value": str(req.weather_auto).lower(), "description": "Tự động lấy thời tiết bằng Open-Meteo API"},
            {"key": "REALTIME_WEATHER_STATUS", "value": req.weather_status, "description": "Thời tiết hiện tại"},
            {"key": "REALTIME_WEATHER_TEMP", "value": str(req.weather_temp), "description": "Nhiệt độ đỉnh núi"}
        ]
        
        for setting in settings_payload:
            db.table("system_settings").upsert(setting).execute()
            
        return {"status": "success", "message": "Đã cập nhật thông tin thực địa thời gian thực."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi cập nhật thông tin thực địa: {str(e)}")

# ─── Option C: Stamp Rally & Rewards Endpoints ────────────────────────────────
@router.get("/stamps")
def get_my_stamps(current_user: dict = Depends(get_current_user), db: Client = Depends(get_db_client)):
    try:
        user_id = current_user["id"]
        res = db.table("user_stamps").select("*").eq("user_id", user_id).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tải danh sách dấu ấn: {str(e)}")

@router.get("/stamps/all")
def get_all_stamps(db: Client = Depends(get_db_client)):
    try:
        res = db.table("user_stamps").select("place_slug, created_at").execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tải toàn bộ dấu ấn: {str(e)}")

@router.post("/checkin")
def checkin_place(
    req: CheckinRequest, 
    current_user: dict = Depends(get_current_user), 
    db: Client = Depends(get_db_client)
):
    try:
        user_id = current_user["id"]
        
        # 1. Fetch place coordinates from DB by slug
        place_res = db.table("tourist_places").select("id, name, name_en, latitude, longitude").eq("slug", req.place_slug).execute()
        if not place_res.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy địa danh di sản tương ứng.")
            
        place = place_res.data[0]
        place_lat = float(place["latitude"])
        place_lng = float(place["longitude"])
        
        # 2. Check distance
        dist = calculate_distance(req.latitude, req.longitude, place_lat, place_lng)
        
        if dist > 100.0:
            return {
                "status": "too_far",
                "message": f"Check-in chưa thành công. Bạn đang ở cách di sản '{place['name']}' khoảng {dist:.0f}m. Vui lòng di chuyển đến gần dưới 100m.",
                "distance_meters": round(dist, 1),
                "total_stamps": 0,
                "reward_granted": False
            }
            
        # 3. Check-in and record stamp
        try:
            db.table("user_stamps").insert({
                "user_id": user_id,
                "place_slug": req.place_slug,
                "verified_via": req.verified_via or "gps"
            }).execute()
        except Exception as insert_err:
            # Handle duplicate key / already checked in
            print(f"[Checkin] Insert stamp exception (possibly already stamped): {insert_err}")
            
        # 4. Fetch total unique stamps collected
        stamps_res = db.table("user_stamps").select("place_slug").eq("user_id", user_id).execute()
        stamps_collected = stamps_res.data or []
        unique_stamps_count = len(set(s["place_slug"] for s in stamps_collected))
        
        return {
            "status": "success",
            "message": f"Chúc mừng bạn đã thu thập dấu ấn di sản: {place['name']}",
            "distance_meters": round(dist, 1),
            "total_stamps": unique_stamps_count,
            "reward_granted": False
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý check-in di sản: {str(e)}")

@router.get("/rewards")
def get_my_rewards(current_user: dict = Depends(get_current_user), db: Client = Depends(get_db_client)):
    try:
        user_id = current_user["id"]
        res = db.table("user_rewards").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tải ưu đãi: {str(e)}")
