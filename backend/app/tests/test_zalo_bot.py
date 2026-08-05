import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.core.config import settings
from app.routers.zalo import send_zalo_message

def test_zalo_webhook_unauthorized(api_client: TestClient):
    """Verify webhook returns 401 Unauthorized if the secret token header is invalid."""
    original_secret = settings.ZALO_WEBHOOK_SECRET_TOKEN
    settings.ZALO_WEBHOOK_SECRET_TOKEN = "test_secret_12345"

    try:
        payload = {
            "event_name": "message.text.received",
            "sender": {"id": "test_sender"},
            "recipient": {"id": "test_bot"},
            "message": {"text": "/admin", "msg_id": "123"},
            "timestamp": "12345"
        }
        response = api_client.post(
            "/api/zalo/webhook",
            json=payload,
            headers={"X-Bot-Api-Secret-Token": "wrong_secret"}
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Unauthorized request secret mismatch"
    finally:
        settings.ZALO_WEBHOOK_SECRET_TOKEN = original_secret

def test_zalo_webhook_success_text_message(api_client: TestClient):
    """Verify webhook accepts admin registration event and responds 200 OK immediately."""
    original_secret = settings.ZALO_WEBHOOK_SECRET_TOKEN
    settings.ZALO_WEBHOOK_SECRET_TOKEN = "test_secret_12345"

    try:
        payload = {
            "event_name": "message.text.received",
            "sender": {"id": "test_user_zalo"},
            "recipient": {"id": "test_bot"},
            "message": {"text": "/admin", "msg_id": "msg_999"},
            "timestamp": "1648018958278"
        }

        with patch("app.routers.zalo.process_zalo_admin_message") as mock_process:
            response = api_client.post(
                "/api/zalo/webhook",
                json=payload,
                headers={"X-Bot-Api-Secret-Token": "test_secret_12345"}
            )
            assert response.status_code == 200
            assert response.json() == {"ok": True, "message": "Success"}
            mock_process.assert_called_once_with("test_user_zalo", "/admin")
    finally:
        settings.ZALO_WEBHOOK_SECRET_TOKEN = original_secret

@pytest.mark.anyio
@patch("httpx.AsyncClient.post")
async def test_send_zalo_message_success(mock_post):
    """Verify that send_zalo_message calls Zalo API endpoint with correct parameters."""
    mock_post.return_value = MagicMock(
        status_code=200,
        json=lambda: {"ok": True, "result": {"message_id": "sent_123"}}
    )

    settings.ZALO_BOT_TOKEN = "test_token_123"

    await send_zalo_message(
        recipient_id="user_abc",
        text="Hello admin"
    )

    expected_url = "https://bot-api.zaloplatforms.com/bot test_token_123/sendMessage".replace("bot ", "bot")
    expected_payload = {
        "chat_id": "user_abc",
        "text": "Hello admin",
        "parse_mode": "markdown"
    }
    
    mock_post.assert_called_once_with(
        expected_url,
        json=expected_payload,
        timeout=10.0
    )
