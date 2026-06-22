from pathlib import Path
from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BACKEND_DIR / ".env"

class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    ADMIN_PASSWORD: str = "admin123"

    # Zalo Bot
    ZALO_BOT_TOKEN: str = ""
    ZALO_WEBHOOK_SECRET_TOKEN: str = ""

    # Facebook Bot
    FB_PAGE_ACCESS_TOKEN: str = ""
    FB_VERIFY_TOKEN: str = ""
    FB_APP_SECRET: str = ""

    # ─── Beeknoee AI (Primary provider) ──────────────────────────────────────
    BEEKNOEE_BASE_URL: str = "https://platform-api.beeknoee.com/v1"
    BEEKNOEE_API_KEY: str = ""

    # Model defaults (overridable via .env)
    BEEKNOEE_LLM_MODEL: str = "gemini-2.5-flash"
    BEEKNOEE_EMBED_MODEL: str = "gemini-embedding-2"
    BEEKNOEE_TTS_MODEL: str = "google/google-tts"
    BEEKNOEE_INPUT_COST_PER_1M: float = 0.30
    BEEKNOEE_OUTPUT_COST_PER_1M: float = 2.50
    BEEKNOEE_EMBED_COST_PER_1M: float = 0.20
    EMBEDDING_DIM: int = 3072

    # ─── Legacy (kept for backward compat, not used) ──────────────────────────
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    NINEROUTER_URL: str = ""
    NINEROUTER_KEY: str = ""
    LLM_MODEL: str = "gemini-3.1-flash-lite"



    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
