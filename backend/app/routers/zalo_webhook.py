from fastapi import APIRouter, Request, Header, HTTPException
from typing import Optional
import json
import requests
from pydantic import BaseModel, Field
from app.services.rag_service import rag_service
from app.services.zalo_oa_service import zalo_oa_service
from app.core.config import settings

router = APIRouter(prefix="/api/zalo", tags=["Zalo OA Webhook"])

class DecryptLocationRequest(BaseModel):
    token: str = Field(..., description="Token vị trí từ SDK getLocation")
    user_access_token: str = Field(..., description="User access token từ SDK getAccessToken")

@router.post("/decrypt-location")
async def decrypt_location(data: DecryptLocationRequest):
    """
    Giải mã token vị trí nhận từ Zalo Mini App sử dụng Zalo Graph API.
    """
    secret_key = settings.ZALO_OA_APP_SECRET
    
    if not secret_key:
        raise HTTPException(
            status_code=500,
            detail="Cấu hình ZALO_OA_APP_SECRET bị thiếu hoặc trống."
        )
        
    headers = {
        "access_token": data.user_access_token,
        "code": data.token,
        "secret_key": secret_key
    }
    
    try:
        response = requests.get("https://graph.zalo.me/v2.0/me/info", headers=headers, timeout=10)
        res_json = response.json()
        
        print(f"[Zalo Location Exchange Response]: {res_json}")
        
        if res_json.get("error", 0) == 0:
            gps_data = res_json.get("data", {})
            latitude = gps_data.get("latitude")
            longitude = gps_data.get("longitude")
            if latitude is not None and longitude is not None:
                return {
                    "latitude": float(latitude),
                    "longitude": float(longitude),
                    "provider": gps_data.get("provider", "gps")
                }
            else:
                raise HTTPException(status_code=400, detail="Không tìm thấy tọa độ latitude/longitude trong phản hồi Zalo")
        else:
            detail_msg = res_json.get("message", f"Zalo API error code {res_json.get('error')}")
            raise HTTPException(status_code=400, detail=f"Không thể giải mã vị trí: {detail_msg}")
            
    except requests.RequestException as re:
        print(f"Request to Zalo Graph API failed: {re}")
        raise HTTPException(status_code=502, detail="Không thể kết nối tới Zalo Server để giải mã vị trí")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in decrypt_location: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý định vị: {str(e)}")

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
                # Tìm hoặc tạo người dùng trong bảng app_users
                resolved_user_uuid = None
                if settings.SUPABASE_URL and settings.SUPABASE_KEY and sender_id:
                    try:
                        from supabase import create_client as create_supabase_client
                        db_client = create_supabase_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                        # 1. Kiểm tra xem user đã tồn tại chưa
                        res = db_client.table("app_users").select("id").eq("zalo_user_id", sender_id).execute()
                        if res.data:
                            resolved_user_uuid = res.data[0]["id"]
                        else:
                            # 2. Đăng ký tự động user mới nếu chưa tồn tại
                            new_user = {
                                "zalo_user_id": sender_id,
                                "name": "Khách Zalo OA",
                                "role": "visitor"
                            }
                            insert_res = db_client.table("app_users").insert(new_user).execute()
                            if insert_res.data:
                                resolved_user_uuid = insert_res.data[0]["id"]
                    except Exception as db_err:
                        print(f"Error resolving Zalo OA user: {db_err}")

                # 1. Ask RAG service using 'zalo_oa' channel
                rag_result = rag_service.ask(
                    question=message_text,
                    user_id=resolved_user_uuid,
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
