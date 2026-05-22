import httpx
import hmac
import hashlib
from typing import Dict, Any
from app.core.config import settings

class ZaloOAService:
    def __init__(self):
        self.api_url = "https://openapi.zalo.me/v3.0/oa/message/transaction"
        self.headers = {
            "Content-Type": "application/json",
            "access_token": settings.ZALO_OA_ACCESS_TOKEN
        }

    async def send_text_message(self, recipient_id: str, text: str) -> bool:
        """
        Sends a reply text message back to a user via the Zalo OA OpenAPI.
        """
        if not settings.ZALO_OA_ACCESS_TOKEN or settings.ZALO_OA_ACCESS_TOKEN == "your-zalo-oa-access-token":
            print(f"[Zalo OA Client] Simulated message sent to user {recipient_id}: '{text}'")
            return True

        payload = {
            "recipient": {
                "user_id": recipient_id
            },
            "message": {
                "text": text
            }
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.api_url,
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "access_token": settings.ZALO_OA_ACCESS_TOKEN
                    },
                    timeout=10.0
                )
                
                result = response.json()
                if response.status_code == 200 and result.get("error") == 0:
                    print(f"Successfully sent Zalo OA message to {recipient_id}.")
                    return True
                else:
                    print(f"Failed to send Zalo OA message: {result}")
                    return False
        except Exception as e:
            print(f"Zalo OA client API error: {e}")
            return False

    def verify_webhook_signature(self, app_id: str, payload_bytes: bytes, signature: str) -> bool:
        """
        Verifies that webhook requests come securely from Zalo Servers
        by comparing hash signatures using the app webhook secret.
        """
        if not settings.ZALO_OA_WEBHOOK_SECRET:
            # If no secret configured, pass check for developer velocity
            return True
            
        try:
            # Zalo uses: SHA256(mac_key, data)
            mac_key = settings.ZALO_OA_WEBHOOK_SECRET.encode('utf-8')
            computed_sig = hmac.new(mac_key, payload_bytes, hashlib.sha256).hexdigest()
            return hmac.compare_digest(computed_sig, signature)
        except Exception as e:
            print(f"Signature verification error: {e}")
            return False

zalo_oa_service = ZaloOAService()
