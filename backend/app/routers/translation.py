from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from app.core.config import settings

class TranslationRequest(BaseModel):
    text: str
    target_lang: str # "en" or "vi"

router = APIRouter(prefix="/api/admin/translate", tags=["Admin Translation"])

@router.post("")
def translate_text(req: TranslationRequest):
    """
    Translates text between Vietnamese and English using Beeknoee LLM.
    """
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Nội dung cần dịch không được trống")

    if req.target_lang not in {"en", "vi"}:
        raise HTTPException(status_code=400, detail="Ngôn ngữ đích không hợp lệ")

    if not settings.BEEKNOEE_API_KEY or not settings.BEEKNOEE_BASE_URL or not settings.BEEKNOEE_LLM_MODEL:
        raise HTTPException(status_code=503, detail="Chưa cấu hình dịch AI Beeknoee")

    try:
        client = OpenAI(api_key=settings.BEEKNOEE_API_KEY, base_url=settings.BEEKNOEE_BASE_URL)
        target = "English" if req.target_lang == "en" else "Vietnamese"
        system_prompt = (
            f"You are a professional tour guide and translator. Translate the following text into {target}.\n"
            "Translate accurately and naturally, maintaining the paragraphs, bullet points, and tone. Do not omit any details.\n"
            "Return ONLY the translated text without any explanation, markdown wrapper, or introductory text."
        )

        completion = client.chat.completions.create(
            model=settings.BEEKNOEE_LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.text}
            ],
            temperature=0.3,
            max_tokens=2000,
        )

        translated = completion.choices[0].message.content.strip()
        if not translated:
            raise HTTPException(status_code=502, detail="Dịch AI trả về nội dung trống")
        return {"translated_text": translated}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Translation API Error: {e}")
        raise HTTPException(status_code=502, detail=f"Dịch AI thất bại: {str(e)}")
