import httpx
import asyncio
import threading
from datetime import datetime
from typing import Dict, Any, Optional
from app.core.config import settings


REPORT_TYPE_LABELS = {
    "cheo_keo": "Chèo kéo / Đeo bám khách",
    "gia_ca": "Ép giá / Gian lận thương mại",
    "ve_sinh": "Vệ sinh môi trường",
    "an_ninh": "Mất an ninh trật tự / Cờ bạc / Bói toán",
    "thai_do": "Thái độ phục vụ",
    "ha_tang": "Sự cố Hạ tầng / Cơ sở vật chất",
    "gop_y": "Góp ý cải thiện",
    "khac": "Phản ánh khác"
}

class TelegramNotifierService:
    def __init__(self):
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.admin_chat_id = settings.TELEGRAM_ADMIN_CHAT_ID

    async def send_photo(self, recipient_id: str, photo_url: str, caption_text: str) -> bool:
        """
        Sends Telegram photo with caption via Telegram Bot API:
        https://api.telegram.org/bot<TOKEN>/sendPhoto
        """
        bot_token = settings.TELEGRAM_BOT_TOKEN or self.bot_token
        if not bot_token:
            return False

        url = f"https://api.telegram.org/bot{bot_token}/sendPhoto"
        payload = {
            "chat_id": str(recipient_id),
            "photo": photo_url,
            "caption": caption_text,
            "parse_mode": "HTML"
        }
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json=payload, timeout=12.0)
                data = res.json()
                if data.get("ok"):
                    print(f"[TelegramNotifier] SUCCESS: Sent Telegram Photo to Chat ID {recipient_id}")
                    return True
                else:
                    print(f"[TelegramNotifier] WARNING: sendPhoto API error: {data.get('description')}")
        except Exception as e:
            print(f"[TelegramNotifier] ERROR sending Telegram Photo: {e}")

        return False

    async def send_message(self, recipient_id: str, message_text: str) -> bool:
        """
        Sends Telegram text message via Telegram Bot API:
        https://api.telegram.org/bot<TOKEN>/sendMessage
        """
        bot_token = settings.TELEGRAM_BOT_TOKEN or self.bot_token
        if not bot_token:
            print("[TelegramNotifier] Warning: TELEGRAM_BOT_TOKEN is not configured.")
            return False

        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            "chat_id": str(recipient_id),
            "text": message_text,
            "parse_mode": "HTML"
        }
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json=payload, timeout=10.0)
                data = res.json()
                if data.get("ok"):
                    print(f"[TelegramNotifier] SUCCESS: Sent Telegram message to Chat ID {recipient_id}")
                    return True
                else:
                    print(f"[TelegramNotifier] WARNING: Telegram API error for Chat ID '{recipient_id}': {data.get('description')}")
        except Exception as e:
            print(f"[TelegramNotifier] ERROR sending Telegram API to {recipient_id}: {e}")

        return False

    async def notify_admin_feedback(self, report_data: Dict[str, Any], is_update: bool = False):
        """
        Gửi thông báo cảnh báo trực tiếp kèm ảnh hiện trường tới Telegram Admin.
        """
        admin_target = settings.TELEGRAM_ADMIN_CHAT_ID or self.admin_chat_id
        if not admin_target:
            print("[TelegramNotifier] 💡 Chưa có TELEGRAM_ADMIN_CHAT_ID.")
            return False

        ticket_id = str(report_data.get("id", "KHONG_MA")).upper()
        short_id = ticket_id[:8]
        
        report_type_key = report_data.get("report_type", "khac")
        report_type_str = REPORT_TYPE_LABELS.get(report_type_key, "Phản ánh du lịch")
        
        reporter_name = report_data.get("reporter_name") or "Du khách ẩn danh"
        phone = report_data.get("phone") or "Chưa cung cấp SĐT"
        content = report_data.get("content") or "Không có nội dung"
        image_url = report_data.get("image_url")
        created_time = datetime.now().strftime("%H:%M:%S - %d/%m/%Y")

        action_title = "🚨 <b>[CẢNH BÁO PHẢN ÁNH MỚI]</b>" if not is_update else "🔄 <b>[CẬP NHẬT PHẢN ÁNH]</b>"

        import html
        reporter_name_esc = html.escape(str(reporter_name))
        phone_esc = html.escape(str(phone))
        content_esc = html.escape(str(content))

        alert_msg = (
            f"{action_title}\n"
            f"--------------------------------------------------\n"
            f"🆔 <b>Mã phiếu:</b> #{short_id}\n"
            f"📂 <b>Loại phản ánh:</b> {report_type_str}\n"
            f"👤 <b>Người báo:</b> {reporter_name_esc}\n"
            f"📱 <b>SĐT liên hệ:</b> {phone_esc}\n"
            f"📝 <b>Nội dung phản ánh:</b>\n<i>\"{content_esc}\"</i>\n"
        )

        if image_url:
            alert_msg += f"📸 <b>Ảnh đính kèm:</b> <a href=\"{image_url}\">Xem ảnh gốc</a>\n"

        alert_msg += (
            f"⏱️ <b>Thời gian:</b> {created_time}\n"
            f"--------------------------------------------------\n"
            f"👉 Đề nghị Cán bộ trực ca kiểm tra và xử lý!"
        )

        # If there is an image URL, try sending as Photo message first
        if image_url:
            photo_sent = await self.send_photo(admin_target, image_url, alert_msg)
            if photo_sent:
                return True

        # Fallback to standard text message if no photo or photo send failed
        return await self.send_message(admin_target, alert_msg)

telegram_notifier = TelegramNotifierService()

def send_admin_feedback_bg(report_data: Dict[str, Any], is_update: bool = False):
    """
    Fire-and-forget background thread notifier so main HTTP request never blocks or 504 timeouts.
    """
    def _worker():
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(telegram_notifier.notify_admin_feedback(report_data, is_update=is_update))
            loop.close()
        except Exception as e:
            print(f"[TelegramNotifier] Background worker error: {e}")

    threading.Thread(target=_worker, daemon=True).start()

