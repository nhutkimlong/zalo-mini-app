import sys
import os
import httpx

def set_telegram_webhook(bot_token: str, webhook_url: str):
    url = f"https://api.telegram.org/bot{bot_token}/setWebhook"
    payload = {"url": webhook_url}
    
    print("Sending request to Telegram Bot API to set webhook...")
    print(f"Webhook URL: {webhook_url}")
    
    try:
        response = httpx.post(url, json=payload, timeout=10.0)
        res_data = response.json()
        if res_data.get("ok"):
            print("\n[SUCCESS] Telegram Webhook configured successfully!")
            print(f"Response: {res_data}")
        else:
            print("\n[ERROR] Failed to set Telegram webhook.")
            print(f"Response: {res_data}")
    except Exception as e:
        print(f"\n[ERROR] Request failed: {e}")

if __name__ == "__main__":
    bot_token = "8555966098:AAFI6B-rPExR0LESg7Kicmtbcs4dvaljr-U"
    webhook_url = "https://nui-ba-den-travel-assistant-backend.onrender.com/api/telegram/webhook"
    set_telegram_webhook(bot_token, webhook_url)
