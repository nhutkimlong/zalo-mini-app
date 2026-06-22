import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from app.core.config import settings
from app.routers.zalo import zalo_sessions, get_zalo_conversation_history, add_zalo_message, send_zalo_message, send_zalo_chat_action, format_text_for_zalo

def test_zalo_webhook_unauthorized(api_client: TestClient):
    """Verify webhook returns 401 Unauthorized if the secret token header is invalid."""
    # Temporarily set a secret token for testing
    original_secret = settings.ZALO_WEBHOOK_SECRET_TOKEN
    settings.ZALO_WEBHOOK_SECRET_TOKEN = "test_secret_12345"

    try:
        payload = {
            "event_name": "message.text.received",
            "sender": {"id": "test_sender"},
            "recipient": {"id": "test_bot"},
            "message": {"text": "hello", "msg_id": "123"},
            "timestamp": "12345"
        }
        # Request with incorrect header
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
    """Verify webhook accepts message.text.received event and responds 200 OK immediately."""
    original_secret = settings.ZALO_WEBHOOK_SECRET_TOKEN
    settings.ZALO_WEBHOOK_SECRET_TOKEN = "test_secret_12345"

    try:
        payload = {
            "event_name": "message.text.received",
            "sender": {"id": "test_user_zalo"},
            "recipient": {"id": "test_bot"},
            "message": {"text": "Giá vé cáp treo?", "msg_id": "msg_999"},
            "timestamp": "1648018958278"
        }

        # Mock the background task execution to prevent actual HTTP calls and RAG processing
        with patch("app.routers.zalo.process_zalo_message") as mock_process:
            response = api_client.post(
                "/api/zalo/webhook",
                json=payload,
                headers={"X-Bot-Api-Secret-Token": "test_secret_12345"}
            )
            assert response.status_code == 200
            assert response.json() == {"status": "success"}
            
            # Verify background task was scheduled with the correct parameters
            mock_process.assert_called_once_with("test_user_zalo", "Giá vé cáp treo?")
    finally:
        settings.ZALO_WEBHOOK_SECRET_TOKEN = original_secret

def test_zalo_webhook_success_nested_result(api_client: TestClient):
    """Verify webhook accepts result-wrapped message.text.received event and responds 200 OK immediately."""
    original_secret = settings.ZALO_WEBHOOK_SECRET_TOKEN
    settings.ZALO_WEBHOOK_SECRET_TOKEN = "test_secret_12345"

    try:
        payload = {
            "ok": True,
            "result": {
                "event_name": "message.text.received",
                "sender": {"id": "test_user_nested"},
                "recipient": {"id": "test_bot"},
                "message": {"text": "Giờ mở cửa?", "msg_id": "msg_888"},
                "timestamp": "1648018958278"
            }
        }

        with patch("app.routers.zalo.process_zalo_message") as mock_process:
            response = api_client.post(
                "/api/zalo/webhook",
                json=payload,
                headers={"X-Bot-Api-Secret-Token": "test_secret_12345"}
            )
            assert response.status_code == 200
            assert response.json() == {"status": "success"}
            
            # Verify background task was scheduled with the correct parameters
            mock_process.assert_called_once_with("test_user_nested", "Giờ mở cửa?")
    finally:
        settings.ZALO_WEBHOOK_SECRET_TOKEN = original_secret

def test_zalo_webhook_ignores_other_events(api_client: TestClient):
    """Verify webhook returns 200 OK but schedules no background task for non-text events."""
    payload = {
        "event_name": "message.image.received",
        "sender": {"id": "test_user_zalo"},
        "recipient": {"id": "test_bot"},
        "message": {"msg_id": "msg_image"},
        "timestamp": "1648018958278"
    }

    with patch("app.routers.zalo.process_zalo_message") as mock_process:
        response = api_client.post(
            "/api/zalo/webhook",
            json=payload,
            headers={"X-Bot-Api-Secret-Token": settings.ZALO_WEBHOOK_SECRET_TOKEN}
        )
        assert response.status_code == 200
        assert response.json() == {"status": "success"}
        mock_process.assert_not_called()

@pytest.mark.anyio
async def test_zalo_session_history():
    """Verify that get_zalo_conversation_history and add_zalo_message manage history limits and sessions correctly."""
    sender_id = "test_session_user_99"
    
    # 1. Clear session
    zalo_sessions.pop(sender_id, None)

    # 2. Get history - should be empty initially
    history = await get_zalo_conversation_history(sender_id)
    assert history == []

    # 3. Add some messages
    await add_zalo_message(sender_id, "user", "Hello")
    await add_zalo_message(sender_id, "assistant", "Hi there!")

    # 4. Check active history
    history = await get_zalo_conversation_history(sender_id)
    assert len(history) == 2
    assert history[0] == {"role": "user", "content": "Hello"}
    assert history[1] == {"role": "assistant", "content": "Hi there!"}

    # 5. Add 12 messages to verify limit of 10
    for i in range(12):
        await add_zalo_message(sender_id, "user", f"Msg {i}")

    history = await get_zalo_conversation_history(sender_id)
    assert len(history) == 10
    assert history[0]["content"] == "Msg 2"  # Oldest 4 messages (Hello, Hi, Msg 0, Msg 1) should be discarded from 14 total
    assert history[-1]["content"] == "Msg 11"

@pytest.mark.anyio
@patch("httpx.AsyncClient.post")
async def test_send_zalo_message_success(mock_post):
    """Verify that send_zalo_message calls Zalo API endpoint with correct parameters."""
    mock_post.return_value = MagicMock(
        status_code=200,
        json=lambda: {"ok": True, "result": {"message_id": "sent_123"}}
    )

    await send_zalo_message(
        bot_token="test_token",
        recipient_id="user_abc",
        text="Hello world"
    )

    expected_url = "https://bot-api.zaloplatforms.com/bottest_token/sendMessage"
    expected_payload = {
        "chat_id": "user_abc",
        "text": "Hello world",
        "parse_mode": "markdown"
    }
    
    mock_post.assert_called_once_with(
        expected_url,
        json=expected_payload,
        timeout=10.0
    )

@pytest.mark.anyio
@patch("httpx.AsyncClient.post")
async def test_send_zalo_chat_action_success(mock_post):
    """Verify that send_zalo_chat_action calls Zalo API endpoint with correct parameters."""
    mock_post.return_value = MagicMock(
        status_code=200,
        json=lambda: {"ok": True}
    )

    await send_zalo_chat_action(
        bot_token="test_token",
        recipient_id="user_abc",
        action="typing"
    )

    expected_url = "https://bot-api.zaloplatforms.com/bottest_token/sendChatAction"
    expected_payload = {
        "chat_id": "user_abc",
        "action": "typing"
    }
    
    mock_post.assert_called_once_with(
        expected_url,
        json=expected_payload,
        timeout=5.0
    )

def test_format_text_for_zalo():
    """Verify that format_text_for_zalo converts Markdown elements correctly for Zalo."""
    # Test link conversion
    input_text = "Chào mừng, click [ở đây](https://example.com/test) để xem chi tiết hoặc [link này](http://hello.com)."
    expected_text = "Chào mừng, click ở đây (https://example.com/test) để xem chi tiết hoặc link này (http://hello.com)."
    assert format_text_for_zalo(input_text) == expected_text

    # Test header level mappings
    input_headers = "##### Tiêu đề cấp 5\n###### Tiêu đề cấp 6\n#### Tiêu đề cấp 4"
    expected_headers = "#### Tiêu đề cấp 5\n#### Tiêu đề cấp 6\n#### Tiêu đề cấp 4"
    assert format_text_for_zalo(input_headers) == expected_headers

    # Test none or empty string
    assert format_text_for_zalo("") == ""
    assert format_text_for_zalo(None) is None
