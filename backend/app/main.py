import sys
import io

# Force stdout/stderr to use utf-8 to prevent encoding errors on Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.routers import chat, feedback, places, announcements, knowledge, upload, translation, tts, itineraries, settings as settings_router, auth, users, user_data, tourism, badges, zalo

app = FastAPI(
    title="Chinh phục Núi Bà Đen",
    description="Backend API và RAG Chatbot Service phục vụ du khách Web PWA và Admin Dashboard.",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None
)

# Set up CORS middleware for secure API calls from PWA and Admin Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to specific allowed web PWA and admin domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard error handler for unhandled exceptions to ensure backend doesn't leak tracebacks
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Hệ thống đang gặp sự cố. Quý khách vui lòng thử lại sau."}
    )

# Include Routers
app.include_router(chat.router)
app.include_router(feedback.router)
app.include_router(places.router)
app.include_router(announcements.router)
app.include_router(knowledge.router)

app.include_router(upload.router)
app.include_router(translation.router)
app.include_router(tts.router)
app.include_router(itineraries.router)
app.include_router(settings_router.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(user_data.router)
app.include_router(tourism.router)
app.include_router(badges.router)
app.include_router(zalo.router)

@app.get("/")
def read_root():
    return {
        "app": "Chinh phục Núi Bà Đen",
        "status": "online",
        "api_documentation": "/docs" if settings.DEBUG else "hidden"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
