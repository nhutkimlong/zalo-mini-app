import asyncio
import time
import hmac
import hashlib
from typing import Dict, List, Any, Optional
import httpx
from fastapi import APIRouter, Request, Query, HTTPException, BackgroundTasks
from fastapi.responses import Response

from app.core.config import settings
from app.services.rag_service import rag_service

router = APIRouter(prefix="/api/facebook", tags=["Facebook Bot Integration"])

# In-memory session manager to track multi-turn conversation history for Facebook users
# Structure: { sender_id: {"last_active": timestamp, "messages": [{"role": "user"/"assistant", "content": "..."}]}}
FB_SESSION_TIMEOUT = 600  # 10 minutes session timeout
fb_sessions: Dict[str, Dict[str, Any]] = {}
fb_sessions_lock = asyncio.Lock()

async def get_fb_conversation_history(sender_id: str) -> List[Dict[str, Any]]:
    """Get active conversation history for a Facebook user, resetting it if expired."""
    now = time.time()
    async with fb_sessions_lock:
        if sender_id in fb_sessions:
            session = fb_sessions[sender_id]
            if now - session["last_active"] < FB_SESSION_TIMEOUT:
                session["last_active"] = now
                return list(session["messages"])
        
        # Reset/initialize new session
        fb_sessions[sender_id] = {
            "last_active": now,
            "messages": []
        }
        return []

async def add_fb_message(sender_id: str, role: str, content: str):
    """Add a message to the Facebook user's conversation history."""
    now = time.time()
    async with fb_sessions_lock:
        if sender_id not in fb_sessions:
            fb_sessions[sender_id] = {
                "last_active": now,
                "messages": []
            }
        session = fb_sessions[sender_id]
        session["last_active"] = now
        session["messages"].append({"role": role, "content": content})
        
        # Keep only the last 10 messages for performance and token savings
        if len(session["messages"]) > 10:
            session["messages"] = session["messages"][-10:]

async def verify_fb_signature(request: Request, raw_body: bytes) -> bool:
    """Verify that the webhook request came from Facebook using the App Secret."""
    signature = request.headers.get("X-Hub-Signature-256")
    if not signature:
        # If signature header is missing, block the request if APP_SECRET is set
        return not bool(settings.FB_APP_SECRET)
    
    parts = signature.split("=")
    if len(parts) != 2 or parts[0] != "sha256":
        return False
    
    expected_signature = parts[1]
    app_secret = settings.FB_APP_SECRET
    if not app_secret:
        return True  # Skip verification if secret is not configured
        
    mac = hmac.new(app_secret.encode("utf-8"), msg=raw_body, digestmod=hashlib.sha256)
    return hmac.compare_digest(mac.hexdigest(), expected_signature)

async def send_fb_message(page_access_token: str, recipient_id: str, text: str):
    """Send text response back to the Facebook user via Messenger Send API."""
    url = f"https://graph.facebook.com/v20.0/me/messages?access_token={page_access_token}"
    payload = {
        "recipient": {
            "id": recipient_id
        },
        "messaging_type": "RESPONSE",
        "message": {
            "text": text
        }
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=10.0)
            res_data = response.json()
            if response.status_code != 200 or "error" in res_data:
                print(f"[FBBot] Facebook Send API error: {res_data} | Recipient: {recipient_id}")
            else:
                print(f"[FBBot] Response successfully sent to Facebook user {recipient_id}")
        except Exception as e:
            print(f"[FBBot] Failed to send message via Facebook Send API: {e} | Recipient: {recipient_id}")

async def process_fb_message(sender_id: str, message_text: str):
    """Asynchronous worker to process query with RAG service and reply to Facebook user."""
    page_access_token = settings.FB_PAGE_ACCESS_TOKEN
    if not page_access_token or page_access_token == "your-facebook-page-access-token":
        print("[FBBot] WARNING: FB_PAGE_ACCESS_TOKEN is not configured.")
        return

    # 1. Fetch active history
    history = await get_fb_conversation_history(sender_id)

    # 2. Query RAG service (run in executor since RAG ask pipeline is synchronous)
    loop = asyncio.get_running_loop()
    try:
        chat_response = await loop.run_in_executor(
            None,
            lambda: rag_service.ask(
                question=message_text,
                channel="facebook_bot",
                language="auto",  # Always auto-detect question language
                conversation_history=history
            )
        )
        answer = chat_response.answer
    except Exception as e:
        print(f"[FBBot] RAG pipeline error: {e}")
        answer = "Xin lỗi, hệ thống đang gặp sự cố nhỏ. Vui lòng thử lại sau giây lát ạ!"

    # 3. Save to conversation history
    await add_fb_message(sender_id, "user", message_text)
    await add_fb_message(sender_id, "assistant", answer)

    # 4. Outgoing Send API call
    await send_fb_message(page_access_token, sender_id, answer)

@router.get("/webhook")
async def facebook_webhook_verification(
    mode: Optional[str] = Query(None, alias="hub.mode"),
    challenge: Optional[str] = Query(None, alias="hub.challenge"),
    verify_token: Optional[str] = Query(None, alias="hub.verify_token")
):
    """
    Webhook verification endpoint for Meta Developers dashboard config setup.
    Echos back hub.challenge if hub.verify_token matches configured FB_VERIFY_TOKEN.
    """
    expected_verify_token = settings.FB_VERIFY_TOKEN
    
    if mode == "subscribe" and verify_token == expected_verify_token:
        print("[FBBot] Webhook successfully verified.")
        return Response(content=challenge, media_type="text/plain")
        
    print(f"[FBBot] Webhook verification failed. Received token: {verify_token}, expected: {expected_verify_token}")
    raise HTTPException(status_code=403, detail="Verification token mismatch")

@router.post("/webhook")
async def facebook_webhook_events(
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Webhook receiver endpoint for Facebook Messenger events.
    Verifies X-Hub-Signature-256, extracts text message, schedules processing in background, and returns 200 OK immediately.
    """
    raw_body = await request.body()
    
    # Verify secure signature if APP_SECRET is configured
    if settings.FB_APP_SECRET and settings.FB_APP_SECRET != "your-facebook-app-secret":
        is_valid = await verify_fb_signature(request, raw_body)
        if not is_valid:
            print("[FBBot] Signature verification failed. Unauthorized request.")
            raise HTTPException(status_code=401, detail="X-Hub-Signature-256 validation failed")

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Check that the webhook event is for a page subscription
    if payload.get("object") == "page":
        for entry in payload.get("entry", []):
            for messaging_event in entry.get("messaging", []):
                # Ignore message echoes or deliveries
                message_data = messaging_event.get("message")
                if not message_data or message_data.get("is_echo"):
                    continue

                sender_id = messaging_event.get("sender", {}).get("id")
                message_text = message_data.get("text")
                
                # Check for postback triggers
                postback_data = messaging_event.get("postback")
                if postback_data:
                    message_text = postback_data.get("payload") or postback_data.get("title")

                if sender_id and message_text:
                    print(f"[FBBot] Processing message from {sender_id}: {message_text[:50]}...")
                    # Execute processing asynchronously in BackgroundTasks to reply to user and return 200 OK to Meta immediately
                    background_tasks.add_task(process_fb_message, sender_id, message_text)

    return {"status": "success"}
