import httpx
from fastapi import APIRouter, BackgroundTasks, Request
from app.core.config import settings
from app.services.rag_service import rag_service

router = APIRouter(prefix="/api/telegram", tags=["Telegram Bot"])

async def process_telegram_chat(chat_id: int, user_text: str):
    """
    Process incoming Telegram message strictly for Admin control and status.
    """
    bot_token = settings.TELEGRAM_BOT_TOKEN
    if not bot_token:
        return

    # Update admin chat id in runtime
    settings.TELEGRAM_ADMIN_CHAT_ID = str(chat_id)

    status_msg = (
        f"🤖 <b>[KÊNH ĐIỀU HÀNH ADMIN DU LỊCH NÚI BÀ ĐEN]</b>\n"
        f"--------------------------------------------------\n"
        f"👋 <b>Xin chào Admin!</b>\n\n"
        f"✅ <b>Trạng thái kênh:</b> Đang sẵn sàng nhận cảnh báo 24/7\n"
        f"🆔 <b>Telegram Chat ID của bạn:</b> <code>{chat_id}</code>\n"
        f"🖥️ <b>Máy chủ Backend:</b> Online 🟢\n"
        f"--------------------------------------------------\n"
        f"<i>Tất cả thông báo phản ánh/sự cố từ du khách sẽ tự động đẩy về đây ngay lập tức.</i>"
    )

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    try:
        httpx.post(url, json={"chat_id": chat_id, "text": status_msg, "parse_mode": "HTML"}, timeout=10.0)
    except Exception as e:
        print(f"[TelegramRouter] Error sending admin status: {e}")


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
