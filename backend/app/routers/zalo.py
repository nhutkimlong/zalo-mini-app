import asyncio
import time
import re
from typing import Dict, List, Any, Optional, Tuple
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

def format_text_for_zalo(text: str) -> str:
    """
    Format standard Markdown text from LLM to match Zalo Bot Platform's supported Markdown.
    - Converts [Text](URL) links to 'Text (URL)'
    - Maps headers level 5 and 6 (##### and ######) to level 4 (####)
    """
    if not text:
        return text
    # 1. Convert Markdown links [Label](URL) -> Label (URL)
    # This ensures links are clickable on Zalo while keeping the label text visible
    text = re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)', r'\1 (\2)', text)
    # 2. Map level 5 and 6 headers to level 4 headers (Zalo only supports # to ####)
    text = re.sub(r'^(?:#{5,6})\s+', '#### ', text, flags=re.MULTILINE)
    return text

def get_open_tags(s: str) -> Tuple[bool, bool, List[str]]:
    """
    Scans a string to find currently open formatting tags:
    Returns (bold_open, italic_open, open_zalo_tags_list)
    """
    bold_open = False
    italic_open = False
    zalo_stack = []
    
    # Matches: **, *, __, _, {green}, {/green}, {red}, {/red}, etc.
    pattern = re.compile(
        r'(\*\*|__|\*|_|\{[a-zA-Z0-9_]+\}|\{/[a-zA-Z0-9_]+\})'
    )
    
    for match in pattern.finditer(s):
        token = match.group(0)
        
        # Check if escaped (preceded by an odd number of backslashes)
        start_idx = match.start()
        backslash_count = 0
        idx = start_idx - 1
        while idx >= 0 and s[idx] == '\\':
            backslash_count += 1
            idx -= 1
        if backslash_count % 2 == 1:
            continue  # Escaped, ignore
            
        if token in ('**', '__'):
            bold_open = not bold_open
        elif token in ('*', '_'):
            italic_open = not italic_open
        elif token.startswith('{/') and token.endswith('}'):
            # Closing tag
            tag_name = token[2:-1]
            if zalo_stack and zalo_stack[-1] == tag_name:
                zalo_stack.pop()
            elif tag_name in zalo_stack:
                zalo_stack.remove(tag_name)
        elif token.startswith('{') and token.endswith('}'):
            # Opening tag
            tag_name = token[1:-1]
            if tag_name in ('green', 'red', 'orange', 'yellow', 'big', 'underline'):
                zalo_stack.append(tag_name)
                
    return bold_open, italic_open, zalo_stack

def split_message_for_zalo(text: str, max_chars: int = 1950) -> List[str]:
    """
    Split a long text into multiple chunks of at most max_chars.
    Ensures that Markdown (bold/italic) and Zalo color/size tags are closed at
    the end of each chunk and reopened at the start of the next chunk to prevent display errors.
    """
    if not text:
        return []
    if len(text) <= max_chars:
        return [text]

    chunks = []
    remaining = text
    current_prefix = ""
    
    while len(remaining) > max_chars:
        # Find a split index within the limit, taking current_prefix length into account
        limit = max_chars - len(current_prefix)
        if limit <= max_chars // 5:
            # If the prefix takes too much space, reset limit to half of max_chars
            limit = max_chars // 2
            
        chunk_candidate = remaining[:limit]
        
        # Try to find the last paragraph break
        split_idx = chunk_candidate.rfind("\n\n")
        if split_idx == -1 or split_idx < limit // 2:
            # Try to find the last line break
            split_idx = chunk_candidate.rfind("\n")
        if split_idx == -1 or split_idx < limit // 2:
            # Try to find the last sentence end
            split_idx = max(
                chunk_candidate.rfind(". "),
                chunk_candidate.rfind("? "),
                chunk_candidate.rfind("! ")
            )
            if split_idx != -1:
                split_idx += 1  # include the punctuation
        if split_idx == -1 or split_idx < limit // 2:
            # Fallback to space split
            split_idx = chunk_candidate.rfind(" ")
        if split_idx == -1:
            # Hard cutoff
            split_idx = limit

        chunk_payload = remaining[:split_idx].strip()
        remaining = remaining[split_idx:].strip()

        # Combine with active prefix
        full_chunk = (current_prefix + chunk_payload).strip() if current_prefix else chunk_payload

        # Scan for open tags in the combined chunk
        bold_open, italic_open, zalo_stack = get_open_tags(full_chunk)

        # Close open tags at the end of the current chunk
        closing_tags = ""
        if italic_open:
            closing_tags += "*"
        if bold_open:
            closing_tags += "**"
        for tag in reversed(zalo_stack):
            closing_tags += f"{{/{tag}}}"

        if closing_tags:
            full_chunk += closing_tags

        chunks.append(full_chunk)

        # Create prefix for the next chunk to reopen the open tags
        next_prefix = ""
        for tag in zalo_stack:
            next_prefix += f"{{{tag}}}"
        if bold_open:
            next_prefix += "**"
        if italic_open:
            next_prefix += "*"
            
        current_prefix = next_prefix

    if remaining:
        full_chunk = (current_prefix + remaining).strip() if current_prefix else remaining
        chunks.append(full_chunk)

    return chunks


async def send_zalo_message(bot_token: str, recipient_id: str, text: str):
    """Send text response back to the Zalo user via Zalo Bot Platform API."""
    url = f"https://bot-api.zaloplatforms.com/bot{bot_token}/sendMessage"
    
    # Format text to optimize display for Zalo Bot client limitations
    formatted_text = format_text_for_zalo(text)
    
    # Split message into chunks if it exceeds Zalo's 2000 character limit
    chunks = split_message_for_zalo(formatted_text, max_chars=1990)
    
    async with httpx.AsyncClient() as client:
        for chunk in chunks:
            payload = {
                "chat_id": recipient_id,
                "text": chunk,
                "parse_mode": "markdown"
            }
            try:
                response = await client.post(url, json=payload, timeout=10.0)
                res_data = response.json()
                if not res_data.get("ok"):
                    print(f"[ZaloBot] Zalo API error: {res_data} | Bot Token (masked): {bot_token[:10]}... | Sent Payload: {payload}")
                else:
                    print(f"[ZaloBot] Response chunk successfully sent to Zalo user {recipient_id}")
            except Exception as e:
                print(f"[ZaloBot] Failed to send message chunk via Zalo API: {e} | Sent Payload: {payload}")

async def send_zalo_chat_action(bot_token: str, recipient_id: str, action: str = "typing"):
    """Send chat action status (e.g. typing) back to the Zalo user."""
    url = f"https://bot-api.zaloplatforms.com/bot{bot_token}/sendChatAction"
    payload = {
        "chat_id": recipient_id,
        "action": action
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=5.0)
            res_data = response.json()
            if not res_data.get("ok"):
                print(f"[ZaloBot] Zalo chat action error: {res_data} | Bot Token (masked): {bot_token[:10]}... | Sent Payload: {payload}")
        except Exception as e:
            print(f"[ZaloBot] Failed to send chat action via Zalo API: {e} | Sent Payload: {payload}")

async def process_zalo_message(sender_id: str, message_text: str):
    """Asynchronous worker to process query with RAG service and reply to Zalo user."""
    bot_token = settings.ZALO_BOT_TOKEN
    if not bot_token:
        print("[ZaloBot] WARNING: ZALO_BOT_TOKEN is not configured.")
        return

    # Send typing action to let the user know the bot is processing/typing
    await send_zalo_chat_action(bot_token, sender_id, "typing")

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
        print(f"[ZaloBot] Incoming Webhook Payload: {payload}")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_name = payload.get("event_name")
    event_data = payload
    if not event_name and "result" in payload:
        event_data = payload["result"]
        event_name = event_data.get("event_name")
    
    # Process only text message events
    if event_name == "message.text.received":
        # First try to get sender.id
        sender_id = event_data.get("sender", {}).get("id")
        # Fallback to chat.id in case sender.id is not present
        if not sender_id:
            sender_id = event_data.get("message", {}).get("chat", {}).get("id")
            
        message_text = event_data.get("message", {}).get("text")
        
        if sender_id and message_text:
            # Execute processing asynchronously in FastAPI background tasks to return 200 OK immediately
            background_tasks.add_task(process_zalo_message, sender_id, message_text)

    return {"status": "success"}
