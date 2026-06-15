import asyncio
import time
from typing import Dict, List, Any, Optional
import httpx
from fastapi import APIRouter, Request, Header, HTTPException, BackgroundTasks

from app.core.config import settings
from app.services.rag_service import rag_service

router = APIRouter(prefix="/api/zalo", tags=["Zalo Bot Integration"])

# In-memory session manager to track multi-turn conversation history for Zalo users
# Structure: { sender_id: {"last_active": timestamp, "messages": [{"role": "user"/"assistant", "content": "..."}]}}
ZALO_SESSION_TIMEOUT = 600  # 10 minutes session timeout
zalo_sessions: Dict[str, Dict[str, Any]] = {}
zalo_sessions_lock = asyncio.Lock()

async def get_zalo_conversation_history(sender_id: str) -> List[Dict[str, Any]]:
    """Get active conversation history for a Zalo user, resetting it if expired."""
    now = time.time()
    async with zalo_sessions_lock:
        if sender_id in zalo_sessions:
            session = zalo_sessions[sender_id]
            if now - session["last_active"] < ZALO_SESSION_TIMEOUT:
                session["last_active"] = now
                return list(session["messages"])
        
        # Reset/initialize new session
        zalo_sessions[sender_id] = {
            "last_active": now,
            "messages": []
        }
        return []

async def add_zalo_message(sender_id: str, role: str, content: str):
    """Add a message to the Zalo user's conversation history."""
    now = time.time()
    async with zalo_sessions_lock:
        if sender_id not in zalo_sessions:
            zalo_sessions[sender_id] = {
                "last_active": now,
                "messages": []
            }
        session = zalo_sessions[sender_id]
        session["last_active"] = now
        session["messages"].append({"role": role, "content": content})
        
        # Keep only the last 10 messages for performance and token savings
        if len(session["messages"]) > 10:
            session["messages"] = session["messages"][-10:]

async def send_zalo_message(bot_token: str, recipient_id: str, text: str):
    """Send text response back to the Zalo user via Zalo Bot Platform API."""
    url = f"https://bot-api.zaloplatforms.com/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": recipient_id,
        "text": text
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=10.0)
            res_data = response.json()
            if not res_data.get("ok"):
                print(f"[ZaloBot] Zalo API error: {res_data}")
            else:
                print(f"[ZaloBot] Response successfully sent to Zalo user {recipient_id}")
        except Exception as e:
            print(f"[ZaloBot] Failed to send message via Zalo API: {e}")

async def process_zalo_message(sender_id: str, message_text: str):
    """Asynchronous worker to process query with RAG service and reply to Zalo user."""
    bot_token = settings.ZALO_BOT_TOKEN
    if not bot_token:
        print("[ZaloBot] WARNING: ZALO_BOT_TOKEN is not configured.")
        return

    # 1. Fetch active history
    history = await get_zalo_conversation_history(sender_id)

    # 2. Query RAG service (run in executor since RAG ask pipeline is synchronous)
    loop = asyncio.get_running_loop()
    try:
        chat_response = await loop.run_in_executor(
            None,
            lambda: rag_service.ask(
                question=message_text,
                channel="zalo_bot",
                language="auto",  # Always auto-detect question language for Zalo channel
                conversation_history=history
            )
        )
        answer = chat_response.answer
    except Exception as e:
        print(f"[ZaloBot] RAG pipeline error: {e}")
        answer = "Xin lỗi, hệ thống đang gặp sự cố nhỏ. Vui lòng thử lại sau giây lát ạ!"

    # 3. Save to conversation history
    await add_zalo_message(sender_id, "user", message_text)
    await add_zalo_message(sender_id, "assistant", answer)

    # 4. Outgoing sendMessage call
    await send_zalo_message(bot_token, sender_id, answer)

@router.post("/webhook")
async def zalo_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_bot_api_secret_token: Optional[str] = Header(None, alias="X-Bot-Api-Secret-Token")
):
    """
    Webhook receiver endpoint for Zalo Bot events.
    Verifies secret token, extracts text message, schedules processing in background, and returns 200 OK immediately.
    """
    # Verify secure token if configured
    expected_secret = settings.ZALO_WEBHOOK_SECRET_TOKEN
    if expected_secret and x_bot_api_secret_token != expected_secret:
        raise HTTPException(status_code=401, detail="Unauthorized request secret mismatch")

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_name = payload.get("event_name")
    
    # Process only text message events
    if event_name == "message.text.received":
        sender_id = payload.get("sender", {}).get("id")
        message_text = payload.get("message", {}).get("text")
        
        if sender_id and message_text:
            # Execute processing asynchronously in FastAPI background tasks to return 200 OK immediately
            background_tasks.add_task(process_zalo_message, sender_id, message_text)

    return {"status": "success"}
