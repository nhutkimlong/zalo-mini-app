import httpx
from typing import Optional
from fastapi import APIRouter, Request, Header, HTTPException, BackgroundTasks
from app.core.config import settings

router = APIRouter(prefix="/api/zalo", tags=["Zalo Admin Bot Integration"])

async def send_zalo_message(recipient_id: str, text: str):
    """Gửi tin nhắn phản hồi tới Zalo Chat ID qua Zalo Bot Platform API."""
    bot_token = settings.ZALO_BOT_TOKEN
    if not bot_token:
        print("[ZaloBot] WARNING: ZALO_BOT_TOKEN chưa được cấu hình.")
        return

    url = f"https://bot-api.zaloplatforms.com/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": str(recipient_id),
        "text": text,
        "parse_mode": "markdown"
    }

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, json=payload, timeout=10.0)
            res_data = res.json()
            if res_data.get("ok"):
                print(f"[ZaloBot] ✅ Đã gửi tin nhắn Zalo tới Admin Chat ID: {recipient_id}")
            else:
                print(f"[ZaloBot] ❌ Zalo API Lỗi: {res_data}")
        except Exception as e:
            print(f"[ZaloBot] Lỗi kết nối Zalo API: {e}")

async def process_zalo_admin_message(sender_id: str, message_text: str):
    """
    Xử lý tin nhắn từ Zalo: Lưu Chat ID của Admin và gửi phản hồi thông báo trạng thái.
    """
    from app.services.zalo_notifier import zalo_notifier
    
    # 1. Lưu Zalo Chat ID của Admin
    settings.ADMIN_ZALO_CHAT_ID = sender_id
    zalo_notifier.admin_chat_id = sender_id
    print(f"[ZaloBot] 🔑 ĐÃ ĐĂNG KÝ ADMIN THÀNH CÔNG! Captured Admin Zalo Chat ID: {sender_id}")

    # 2. Tạo nội dung xác nhận gửi cho Admin
    clean_text = message_text.strip().lower() if message_text else ""
    if clean_text in ["/admin", "admin", "alo", "dang ky admin", "kích hoạt"]:
        reply = (
            f"✅ **ĐÃ KÍCH HOẠT KÊNH THÔNG BÁO ADMIN THÀNH CÔNG!**\n\n"
            f"🆔 **Zalo Chat ID:** `{sender_id}`\n"
            f"📱 **SĐT Trực ban:** `{settings.ADMIN_ZALO_PHONE}`\n\n"
            f"Từ bây giờ, tất cả phản ánh sự cố du lịch từ du khách sẽ được Zalo Bot tự động gửi trực tiếp tới Zalo này 24/7."
        )
    else:
        reply = (
            f"🔔 **KÊNH CẢNH BÁO QUẢN TRỊ NÚI BÀ ĐEN**\n\n"
            f"🆔 **Zalo Chat ID của bạn:** `{sender_id}`\n"
            f"💬 **Nội dung tin nhắn:** \"{message_text}\"\n\n"
            f"Zalo của bạn đã được ghi nhận là kênh nhận cảnh báo sự cố từ hệ thống."
        )

    await send_zalo_message(sender_id, reply)

# Alias for backward compatibility
process_zalo_message = process_zalo_admin_message


@router.post("/webhook")
async def zalo_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_bot_api_secret_token: Optional[str] = Header(None, alias="X-Bot-Api-Secret-Token")
):
    """
    Webhook tiếp nhận sự kiện từ Zalo Bot Platform (Dành riêng cho Kênh Thông Báo Admin).
    """
    expected_secret = settings.ZALO_WEBHOOK_SECRET_TOKEN
    received_secret = (
        request.headers.get("x-bot-api-secret-token") or
        request.headers.get("x-zalo-secret-token") or
        request.headers.get("secret-token") or
        x_bot_api_secret_token
    )

    if expected_secret and received_secret != expected_secret:
        print(f"[ZaloBot] Webhook 401: Secret Token không khớp! (Nhận được: '{received_secret}')")
        raise HTTPException(status_code=401, detail="Unauthorized request secret mismatch")

    try:
        payload = await request.json()
        print(f"[ZaloBot] Webhook Payload nhận được: {payload}")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Trích xuất dữ liệu event_name & sender_id
    event_data = payload.get("result", payload)
    
    sender_id = (
        event_data.get("message", {}).get("chat", {}).get("id") or
        event_data.get("message", {}).get("from", {}).get("id") or
        event_data.get("from", {}).get("id") or
        event_data.get("sender", {}).get("id") or
        event_data.get("user_id") or
        event_data.get("chat_id")
    )
    if sender_id is not None:
        sender_id = str(sender_id)

    message_text = (
        event_data.get("message", {}).get("text") or
        event_data.get("text") or
        ""
    ).strip()

    if sender_id:
        print(f"[ZaloBot] Đang xử lý tin nhắn từ Admin sender_id='{sender_id}', text='{message_text}'")
        background_tasks.add_task(process_zalo_admin_message, sender_id, message_text)
    else:
        print(f"[ZaloBot] Webhook payload không chứa sender_id hợp lệ: {payload}")

    return {"ok": True, "message": "Success"}
