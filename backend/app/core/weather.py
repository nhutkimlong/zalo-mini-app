import urllib.request
import json
import time
from typing import Dict, Any, Optional
from supabase import Client

# In-memory cache for weather
_cached_weather = None  # Dict[str, Any]
_cached_weather_at = 0.0
CACHE_TTL = 300.0  # 5 minutes cache

def get_current_weather(supabase: Optional[Client]) -> Dict[str, Any]:
    """
    Fetches weather. If REALTIME_WEATHER_AUTO is true, retrieves from Open-Meteo API.
    Otherwise, uses values from system_settings table.
    Uses in-memory cache to avoid excessive API calls.
    Returns: Dict[str, Any] containing weather_status, weather_temp, and weather_auto
    """
    global _cached_weather, _cached_weather_at
    now = time.time()
    
    # Return cache if valid
    if _cached_weather is not None and (now - _cached_weather_at < CACHE_TTL):
        return _cached_weather
        
    # Default fallback values
    weather_status = "sunny"
    weather_temp = "30"
    weather_auto = True
    
    if supabase:
        try:
            weather_res = supabase.table("system_settings").select("key, value").in_("key", ["REALTIME_WEATHER_STATUS", "REALTIME_WEATHER_TEMP", "REALTIME_WEATHER_AUTO"]).execute()
            if weather_res.data:
                status_map = {}
                for row in weather_res.data:
                    status_map[row["key"]] = row["value"]
                
                if "REALTIME_WEATHER_STATUS" in status_map:
                    weather_status = status_map["REALTIME_WEATHER_STATUS"]
                if "REALTIME_WEATHER_TEMP" in status_map:
                    weather_temp = status_map["REALTIME_WEATHER_TEMP"]
                if "REALTIME_WEATHER_AUTO" in status_map:
                    weather_auto = status_map["REALTIME_WEATHER_AUTO"].lower() == "true"
        except Exception as e:
            print(f"[Weather] Failed to fetch settings from DB: {e}")
            
    if weather_auto:
        try:
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
                    # Round temperature to integer
                    weather_temp = str(round(raw_temp))
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
                    
                    # Save fetched weather back to Supabase if connection exists
                    if supabase:
                        try:
                            supabase.table("system_settings").upsert({"key": "REALTIME_WEATHER_STATUS", "value": weather_status, "description": "Thời tiết hiện tại (Tự động cập nhật)"}).execute()
                            supabase.table("system_settings").upsert({"key": "REALTIME_WEATHER_TEMP", "value": weather_temp, "description": "Nhiệt độ đỉnh núi (Tự động cập nhật)"}).execute()
                        except Exception as save_err:
                            print(f"[Weather] Failed to save fetched weather back to Supabase: {save_err}")
        except Exception as api_err:
            print(f"[Weather] Failed to fetch from Open-Meteo: {api_err}")
            
    result = {
        "weather_status": weather_status,
        "weather_temp": weather_temp,
        "weather_auto": weather_auto
    }
    
    _cached_weather = result
    _cached_weather_at = now
    return result
