import httpx
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

class ZaloNotifierService:
    def __init__(self):
        self.bot_token = settings.ZALO_BOT_TOKEN
        self.admin_phone = settings.ADMIN_ZALO_PHONE
        self.admin_chat_id = settings.ADMIN_ZALO_CHAT_ID or settings.ADMIN_ZALO_PHONE

    async def send_zalo_message(self, recipient_id: str, message_text: str) -> bool:
        """
        Send Zalo message directly to Admin Chat ID via Zalo Bot Platform API:
        https://bot-api.zaloplatforms.com/bot<TOKEN>/sendMessage
        """
        bot_token = settings.ZALO_BOT_TOKEN or self.bot_token
        if not bot_token:
            print("[ZaloNotifier] Warning: ZALO_BOT_TOKEN chưa được cấu hình.")
            return False

        url = f"https://bot-api.zaloplatforms.com/bot{bot_token}/sendMessage"
        
        target_ids = []
        if recipient_id:
            target_ids.append(str(recipient_id))
        if settings.ADMIN_ZALO_CHAT_ID and str(settings.ADMIN_ZALO_CHAT_ID) not in target_ids:
            target_ids.append(str(settings.ADMIN_ZALO_CHAT_ID))

        for target in target_ids:
            payload = {
                "chat_id": target,
                "text": message_text,
                "parse_mode": "markdown"
            }
            try:
                async with httpx.AsyncClient() as client:
                    res = await client.post(url, json=payload, timeout=10.0)
                    data = res.json()
                    if data.get("ok"):
                        print(f"[ZaloNotifier] ✅ Đã gửi tin nhắn Zalo tới Admin ({target}) thành công.")
                        return True
                    else:
                        print(f"[ZaloNotifier] ⚠️ Zalo API error với Chat ID '{target}': {data.get('description')} (Code: {data.get('error_code')})")
            except Exception as e:
                print(f"[ZaloNotifier] Lỗi gửi Zalo API tới {target}: {e}")

        return False

    async def notify_admin_feedback(self, report_data: Dict[str, Any], is_update: bool = False):
        """
        Gửi thông báo cảnh báo trực tiếp tới Zalo Admin khi có phản ánh mới từ khách hàng.
        """
        ticket_id = str(report_data.get("id", "KHONG_MA")).upper()
        short_id = ticket_id[:8]
        
        report_type_key = report_data.get("report_type", "khac")
        report_type_str = REPORT_TYPE_LABELS.get(report_type_key, "Phản ánh du lịch")
        
        reporter_name = report_data.get("reporter_name") or "Du khách ẩn danh"
        phone = report_data.get("phone") or "Chưa cung cấp SĐT"
        content = report_data.get("content") or "Không có nội dung"
        image_url = report_data.get("image_url")
        created_time = datetime.now().strftime("%H:%M:%S - %d/%m/%Y")

        action_title = "🚨 [CẢNH BÁO PHẢN ÁNH MỚI]" if not is_update else "🔄 [CẬP NHẬT PHẢN ÁNH]"

        alert_msg = (
            f"{action_title}\n"
            f"--------------------------------------------------\n"
            f"🆔 Mã phiếu: #{short_id}\n"
            f"📂 Loại phản ánh: {report_type_str}\n"
            f"👤 Người báo: {reporter_name}\n"
            f"📱 SĐT liên hệ: {phone}\n"
            f"📝 Nội dung phản ánh:\n\"{content}\"\n"
        )

        if image_url:
            alert_msg += f"📸 Ảnh đính kèm: {image_url}\n"

        alert_msg += (
            f"⏱️ Thời gian: {created_time}\n"
            f"--------------------------------------------------\n"
            f"👉 Đề nghị Cán bộ trực ca kiểm tra và xử lý!"
        )

        admin_target = settings.ADMIN_ZALO_CHAT_ID or self.admin_chat_id
        await self.send_zalo_message(admin_target, alert_msg)

zalo_notifier = ZaloNotifierService()
