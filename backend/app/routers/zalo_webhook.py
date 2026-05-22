from fastapi import APIRouter, Request, Header, HTTPException
from typing import Optional
import json
from app.services.rag_service import rag_service
from app.services.zalo_oa_service import zalo_oa_service
from app.core.config import settings

router = APIRouter(prefix="/api/zalo", tags=["Zalo OA Webhook"])

@router.post("/webhook")
async def handle_zalo_webhook(
    request: Request,
    x_zalo_signature: Optional[str] = Header(None, alias="X-Zalo-Signature")
):
    """
    Webhook entry point for Zalo OA.
    Listens for user chat events, runs semantic search RAG, and replies.
    """
    body_bytes = await request.body()
    
    # Verify signature from Zalo Server
    # Ensure webhook requests actually come securely from Zalo
    try:
        body_json = json.loads(body_bytes.decode("utf-8"))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Log incoming webhook for developer audits
    print(f"[Zalo Webhook Received]: {body_json}")

    # Verify signature if present and webhook secret is set
    app_id = str(body_json.get("app_id", ""))
    if x_zalo_signature and settings.ZALO_OA_WEBHOOK_SECRET:
        is_verified = zalo_oa_service.verify_webhook_signature(
            app_id=app_id,
            payload_bytes=body_bytes,
            signature=x_zalo_signature
        )
        if not is_verified:
            print("[Warning] Webhook verification failed. Invalid signature.")
            # We return 200 to prevent Zalo from blocking the webhook, but do not process
            return {"status": "ignored", "reason": "invalid_signature"}

    # Extract event data
    event_name = body_json.get("event_name")
    
    # Process only text messages sent from user to OA
    if event_name == "user_send_text":
        sender_id = body_json.get("sender", {}).get("id")
        message_obj = body_json.get("message", {})
        message_text = message_obj.get("text", "").strip()

        if sender_id and message_text:
            print(f"[Zalo OA message] From user {sender_id}: {message_text}")
            
            try:
                # 1. Ask RAG service using 'zalo_oa' channel
                rag_result = rag_service.ask(
                    question=message_text,
                    user_id=None,
                    channel="zalo_oa"
                )
                
                # 2. Reply to user via Zalo OA OpenAPI
                reply_text = rag_result.answer
                
                # Append sources citation to OA chat for transparency if references exist
                if rag_result.sources and rag_result.confidence_score >= 0.4:
                    source_titles = [s.title for s in rag_result.sources]
                    reply_text += f"\n\n(Nguồn chính thức: {', '.join(source_titles)})"
                
                await zalo_oa_service.send_text_message(
                    recipient_id=sender_id,
                    text=reply_text
                )
            except Exception as e:
                print(f"Error handling Zalo OA webhook message: {e}")
                # Send a fallback error message so the chat isn't left hanging
                await zalo_oa_service.send_text_message(
                    recipient_id=sender_id,
                    text="Rất tiếc, hệ thống đang gặp sự cố gián đoạn. Anh/chị vui lòng thử lại sau ít phút hoặc liên hệ trực tiếp với Ban Quản lý."
                )

    return {"status": "ok"}
