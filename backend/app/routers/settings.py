from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from supabase import Client, create_client
from app.core.config import settings

router = APIRouter(prefix="/api/admin/settings", tags=["Admin Settings"])

def get_db():
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return None
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

class SettingsUpdate(BaseModel):
    model: str
    input_cost_per_1m: float
    output_cost_per_1m: float
    embed_model: str
    embed_cost_per_1m: float

@router.get("")
def get_settings(db: Optional[Client] = Depends(get_db)):
    if not db:
        # Fallback to local env settings
        return {
            "model": settings.BEEKNOEE_LLM_MODEL,
            "input_cost_per_1m": settings.BEEKNOEE_INPUT_COST_PER_1M,
            "output_cost_per_1m": settings.BEEKNOEE_OUTPUT_COST_PER_1M,
            "embed_model": settings.BEEKNOEE_EMBED_MODEL,
            "embed_cost_per_1m": settings.BEEKNOEE_EMBED_COST_PER_1M
        }
    
    try:
        response = db.table("system_settings").select("*").execute()
        data = response.data or []
        config = {
            "model": settings.BEEKNOEE_LLM_MODEL,
            "input_cost_per_1m": settings.BEEKNOEE_INPUT_COST_PER_1M,
            "output_cost_per_1m": settings.BEEKNOEE_OUTPUT_COST_PER_1M,
            "embed_model": settings.BEEKNOEE_EMBED_MODEL,
            "embed_cost_per_1m": settings.BEEKNOEE_EMBED_COST_PER_1M
        }
        for row in data:
            key = row["key"]
            val = row["value"]
            if key == "BEEKNOEE_LLM_MODEL":
                config["model"] = val
            elif key == "BEEKNOEE_INPUT_COST_PER_1M":
                config["input_cost_per_1m"] = float(val)
            elif key == "BEEKNOEE_OUTPUT_COST_PER_1M":
                config["output_cost_per_1m"] = float(val)
            elif key == "BEEKNOEE_EMBED_MODEL":
                config["embed_model"] = val
            elif key == "BEEKNOEE_EMBED_COST_PER_1M":
                config["embed_cost_per_1m"] = float(val)
        return config
    except Exception as e:
        print(f"Failed to fetch system settings from database: {e}")
        return {
            "model": settings.BEEKNOEE_LLM_MODEL,
            "input_cost_per_1m": settings.BEEKNOEE_INPUT_COST_PER_1M,
            "output_cost_per_1m": settings.BEEKNOEE_OUTPUT_COST_PER_1M,
            "embed_model": settings.BEEKNOEE_EMBED_MODEL,
            "embed_cost_per_1m": settings.BEEKNOEE_EMBED_COST_PER_1M
        }

@router.put("")
def update_settings(req: SettingsUpdate, db: Optional[Client] = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=503, detail="Database connection offline.")
    
    try:
        # Upsert model
        db.table("system_settings").upsert({
            "key": "BEEKNOEE_LLM_MODEL",
            "value": req.model,
            "description": "Tên Model AI của hệ thống (Ví dụ: gemini-2.5-flash, gemini-1.5-flash, gpt-4o)"
        }).execute()

        # Upsert input cost
        db.table("system_settings").upsert({
            "key": "BEEKNOEE_INPUT_COST_PER_1M",
            "value": str(req.input_cost_per_1m),
            "description": "Giá tiền của 1 triệu Input Tokens (USD)"
        }).execute()

        # Upsert output cost
        db.table("system_settings").upsert({
            "key": "BEEKNOEE_OUTPUT_COST_PER_1M",
            "value": str(req.output_cost_per_1m),
            "description": "Giá tiền của 1 triệu Output Tokens (USD)"
        }).execute()

        # Upsert embedding model
        db.table("system_settings").upsert({
            "key": "BEEKNOEE_EMBED_MODEL",
            "value": req.embed_model,
            "description": "Tên Model Embedding của hệ thống (Ví dụ: gemini-embedding-2)"
        }).execute()

        # Upsert embedding cost
        db.table("system_settings").upsert({
            "key": "BEEKNOEE_EMBED_COST_PER_1M",
            "value": str(req.embed_cost_per_1m),
            "description": "Giá tiền của 1 triệu Embedding Tokens (USD)"
        }).execute()

        return {"status": "success", "message": "Đã cập nhật cấu hình hệ thống thành công"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không thể cập nhật cấu hình: {str(e)}")
