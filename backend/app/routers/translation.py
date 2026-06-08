from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from app.core.config import settings

class TranslationRequest(BaseModel):
    text: str
    target_lang: str # "en", "vi", "km", or "both"

router = APIRouter(prefix="/api/admin/translate", tags=["Admin Translation"])

@router.post("")
def translate_text(req: TranslationRequest):
    """
    Translates text or structured JSON between Vietnamese, English, and Khmer using Beeknoee LLM.
    Supports translating to both English and Khmer simultaneously using target_lang='both'.
    """
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Nội dung cần dịch không được trống")

    if req.target_lang not in {"en", "vi", "km", "both"}:
        raise HTTPException(status_code=400, detail="Ngôn ngữ đích không hợp lệ")

    if not settings.BEEKNOEE_API_KEY or not settings.BEEKNOEE_BASE_URL or not settings.BEEKNOEE_LLM_MODEL:
        raise HTTPException(status_code=503, detail="Chưa cấu hình dịch AI Beeknoee")

    import json
    is_json = False
    try:
        # Check if input is a valid JSON string
        json.loads(req.text.strip())
        is_json = True
    except Exception:
        pass

    try:
        client = OpenAI(api_key=settings.BEEKNOEE_API_KEY, base_url=settings.BEEKNOEE_BASE_URL)
        target = "English" if req.target_lang == "en" else "Khmer" if req.target_lang == "km" else "Vietnamese" if req.target_lang == "vi" else "English and Khmer"

        if is_json:
            if req.target_lang == "both":
                system_prompt = (
                    "You are an expert translator. Translate all Vietnamese string values in the provided JSON structure to populate BOTH English and Khmer counterpart fields.\n"
                    "Rules:\n"
                    "1. You MUST maintain the exact same JSON keys and structure.\n"
                    "2. For keys representing English translations (ending with 'En', '_en' or the key 'en'): "
                    "if they already contain a non-empty string, keep their value exactly as is (do NOT overwrite them). If they are empty or null, translate the corresponding Vietnamese field "
                    "(e.g., 'name', 'title', 'content', 'shortDescription', 'fullDescription', 'short_description', 'full_description', 'label', 'note', 'duration', or 'vi') into English and populate them.\n"
                    "3. For keys representing Khmer translations (ending with 'Km', '_km' or the key 'km'): "
                    "if they already contain a non-empty string, keep their value exactly as is (do NOT overwrite them). If they are empty or null, translate the corresponding Vietnamese field "
                    "(e.g., 'name', 'title', 'content', 'shortDescription', 'fullDescription', 'short_description', 'full_description', 'label', 'note', 'duration', or 'vi') into Khmer and populate them.\n"
                    "4. If translating ticket objects or schedules in arrays, translate the empty 'En'/'Km' keys (like 'nameEn'/'nameKm', 'titleEn'/'titleKm', 'priceEn'/'priceKm', 'labelEn'/'labelKm', 'noteEn'/'noteKm') from their Vietnamese source counterparts.\n"
                    "5. Keep prices, hours, and other numeric/non-translatable values unchanged, but translate 'Miễn phí' to 'Free' (for English) and 'ឥតគិតថ្លៃ' (for Khmer).\n"
                    "6. Return ONLY the final translated JSON string. Do not include markdown code block formatting (like ```json), explanations, or any other text. The output must be pure valid JSON."
                )
            else:
                system_prompt = (
                    f"You are an expert translator. Translate all Vietnamese string values in the provided JSON structure into {target}.\n"
                    "Rules:\n"
                    "1. You MUST maintain the exact same JSON keys and structure.\n"
                    f"2. For keys ending with 'En', 'Km', '_en', '_km' or keys 'en', 'km': "
                    f"if they already contain a non-empty string, keep their value exactly as is (do NOT overwrite them). If they are empty, translate the source field "
                    f"(e.g., translate the Vietnamese equivalent field to populate this target field).\n"
                    "3. If translating a simple JSON object like {{ \"title\": \"...\", \"content\": \"...\" }}, translate the values of 'title' and 'content' directly and return the same structure.\n"
                    "4. Keep prices, hours, and other numeric/non-translatable values unchanged, but translate 'Miễn phí' to 'Free' (for English) or 'ឥតគិតថ្លៃ' (for Khmer).\n"
                    "5. Return ONLY the final translated JSON string. Do not include markdown code block formatting (like ```json), explanations, or any other text. The output must be pure valid JSON."
                )
        else:
            if req.target_lang == "both":
                system_prompt = (
                    "You are a professional translator. Translate the following Vietnamese text into both English and Khmer.\n"
                    "Return the translations as a raw JSON object with keys 'en' (for English) and 'km' (for Khmer).\n"
                    "Example format:\n"
                    '{"en": "English translation here", "km": "Khmer translation here"}\n'
                    "Return ONLY the raw JSON string without any markdown formatting (like ```json), explanations, or other text."
                )
            else:
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
        )

        translated = completion.choices[0].message.content.strip()
        if not translated:
            raise HTTPException(status_code=502, detail="Dịch AI trả về nội dung trống")

        # Clean markdown code blocks if the LLM returned it
        if (is_json or req.target_lang == "both") and translated.startswith("```"):
            lines = translated.split("\n")
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                translated = "\n".join(lines[1:-1]).strip()

        return {"translated_text": translated}
    except HTTPException:
        raise
    except Exception as e:
        try:
            print(f"Translation API Error: {repr(e)}")
        except Exception:
            pass
        raise HTTPException(status_code=502, detail=f"Dịch AI thất bại: {str(e)}")
