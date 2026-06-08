"""
TTS Router — CrawBot
Fallback chain: google/google-tts → google/standard → google/neural2 → google/wavenet
All via Beeknoee (https://platform-api.beeknoee.com/v1/audio/speech)
Caches to Supabase Storage. Falls back to base64 inline if upload fails.
"""
import hashlib
import base64
import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from supabase import Client, create_client
from app.core.config import settings

router = APIRouter(prefix="/api/admin/tts", tags=["TTS"])

# ─── TTS Fallback Chains ──────────────────────────────────────────────────────
# Ordered by preference — free first
TTS_CHAIN = [
    "google/google-tts",   # FREE (Google TTS basic)
    "google/standard",     # Standard quality
    "google/neural2",      # Higher quality
    "google/wavenet",      # Premium quality
]

# Language code mapping for each model
LANG_CODES = {
    "vi": {"code": "vi-VN", "name": "vi-VN-Standard-A"},
    "en": {"code": "en-US", "name": "en-US-Standard-A"},
    "km": {"code": "km-KH", "name": "km-KH-Standard-A"},
}


class TTSRequest(BaseModel):
    text: str
    lang: str = "vi"  # "vi" | "en" | "km"


def get_db() -> Optional[Client]:
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return None


async def _call_tts_beeknoee(text: str, model: str, lang: str) -> bytes:
    """
    Call Beeknoee TTS endpoint.
    Returns raw audio bytes (mp3).
    """
    lang_info = LANG_CODES.get(lang, LANG_CODES["vi"])

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.BEEKNOEE_API_KEY}",
    }

    # Beeknoee TTS uses OpenAI-compatible /v1/audio/speech
    payload: dict = {
        "model": model,
        "input": text,
        "voice": lang_info["name"],  # Google TTS voice name
        "response_format": "mp3",
    }

    url = f"{settings.BEEKNOEE_BASE_URL}/audio/speech"

    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(url, json=payload, headers=headers)
        if res.status_code != 200:
            raise ValueError(f"HTTP {res.status_code}: {res.text[:200]}")
        return res.content


async def _tts_with_fallback(text: str, lang: str) -> bytes:
    """
    Try each TTS model in chain until one succeeds.
    primary model (from config) first, then the rest.
    """
    primary = settings.BEEKNOEE_TTS_MODEL
    chain = [primary] + [m for m in TTS_CHAIN if m != primary]

    last_error = None
    for model in chain:
        try:
            audio = await _call_tts_beeknoee(text, model, lang)
            if model != primary:
                print(f"[TTS] Fallback succeeded: {model}")
            return audio
        except Exception as e:
            last_error = e
            print(f"[TTS] Model '{model}' failed: {e}. Trying next...")

    raise RuntimeError(f"All TTS models exhausted. Last error: {last_error}")


@router.post("")
async def generate_tts(req: TTSRequest, db: Optional[Client] = Depends(get_db)):
    """
    Generate TTS audio with model fallback chain.
    1. Check Supabase cache
    2. Call Beeknoee TTS with fallback chain
    3. Upload to Supabase Storage (cache)
    4. If upload fails → return base64 inline
    """
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text không được trống")

    if not settings.BEEKNOEE_API_KEY:
        raise HTTPException(status_code=503, detail="Beeknoee API key chưa được cấu hình")

    # ── Cache key ──────────────────────────────────────────────────────────────
    text_hash = hashlib.md5(req.text.encode("utf-8")).hexdigest()
    file_path = f"tts/{text_hash}_{req.lang}.mp3"

    # ── 1. Check Supabase cache ────────────────────────────────────────────────
    if db:
        try:
            public_url = db.storage.from_("baden_assets").get_public_url(file_path)
            async with httpx.AsyncClient(timeout=3.0) as client:
                head = await client.head(public_url)
                if head.status_code == 200:
                    print(f"[TTS] Cache hit: {file_path}")
                    return {"url": public_url, "cached": True}
        except Exception:
            pass  # Cache miss — generate fresh

    # ── 2. Generate with fallback chain ───────────────────────────────────────
    try:
        audio_bytes = await _tts_with_fallback(req.text, req.lang)
    except RuntimeError as e:
        print(f"[TTS] All models failed: {e}")
        raise HTTPException(status_code=503, detail=f"TTS generation failed: {str(e)}")

    # ── 3. Upload to Supabase Storage (cache for future requests) ─────────────
    if db:
        try:
            db.storage.from_("baden_assets").upload(
                path=file_path,
                file=audio_bytes,
                file_options={"content-type": "audio/mpeg", "upsert": "true"},
            )
            public_url = db.storage.from_("baden_assets").get_public_url(file_path)
            print(f"[TTS] Cached to Supabase: {public_url}")
            return {"url": public_url, "cached": False}
        except Exception as upload_err:
            print(f"[TTS] Supabase upload failed: {upload_err}. Returning base64 inline.")

    # ── 4. Return base64 inline if storage fails ───────────────────────────────
    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
    return {"url": "__base64__", "audio": audio_b64, "format": "mp3"}
