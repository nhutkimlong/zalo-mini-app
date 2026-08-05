import httpx
from fastapi import APIRouter, BackgroundTasks, Request
from app.core.config import settings
from app.services.rag_service import rag_service

router = APIRouter(prefix="/api/telegram", tags=["Telegram Bot"])

async def process_telegram_chat(chat_id: int, user_text: str):
    """
    Process incoming Telegram message via RAG AI Assistant and reply to user.
    """
    bot_token = settings.TELEGRAM_BOT_TOKEN
    if not bot_token:
        return

    # Check if command /start
    if user_text.strip().lower() == "/start":
        # Save Admin Chat ID if not set
        if not settings.TELEGRAM_ADMIN_CHAT_ID:
            settings.TELEGRAM_ADMIN_CHAT_ID = str(chat_id)

        welcome_msg = (
            "<b>Chào mừng bạn đến với Trợ lý Du lịch Núi Bà Đen!</b>\n\n"
            "Mình là Hướng dẫn viên AI 4.0. Bạn có thể hỏi mình thông tin về giá vé cáp treo, giờ mở cửa, các tuyến tham quan, ẩm thực và kinh nghiệm du lịch tại Núi Bà Đen Tây Ninh.\n\n"
            "<i>Hãy nhập câu hỏi của bạn bên dưới nhé!</i>"
        )
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        try:
            httpx.post(url, json={"chat_id": chat_id, "text": welcome_msg, "parse_mode": "HTML"}, timeout=10.0)
        except Exception as e:
            print(f"[TelegramRouter] Error sending start message: {e}")
        return

    # Call RAG AI Service
    try:
        response = rag_service.ask(
            question=user_text,
            channel="telegram_bot",
            language="vi"
        )
        answer_text = response.answer
    except Exception as e:
        answer_text = f"Dạ hệ thống đang gặp sự cố nhỏ: {e}"

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    try:
        httpx.post(url, json={"chat_id": chat_id, "text": answer_text, "parse_mode": "HTML"}, timeout=15.0)
    except Exception:
        # Fallback without HTML parsing if string contains HTML tags
        try:
            httpx.post(url, json={"chat_id": chat_id, "text": answer_text}, timeout=15.0)
        except Exception as e:
            print(f"[TelegramRouter] Error replying: {e}")

@router.post("/webhook")
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Receives Telegram Webhook updates.
    """
    try:
        data = await request.json()
        message = data.get("message") or data.get("edited_message") or {}
        chat_id = message.get("chat", {}).get("id")
        text = message.get("text")

        if chat_id and text:
            background_tasks.add_task(process_telegram_chat, chat_id, text)

        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}
