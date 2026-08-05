import sys
import os
import httpx

def set_webhook(bot_token: str, webhook_url: str, secret_token: str):
    url = f"https://bot-api.zaloplatforms.com/bot{bot_token}/setWebhook"
    payload = {
        "url": webhook_url,
        "secret_token": secret_token
    }
    
    print("Sending request to Zalo Bot Platform to set webhook...")
    print(f"API Target: https://bot-api.zaloplatforms.com/bot<HIDDEN_TOKEN>/setWebhook")
    print(f"Webhook URL: {webhook_url}")
    print(f"Secret Token: {secret_token}")
    
    try:
        response = httpx.post(url, json=payload, timeout=10.0)
        res_data = response.json()
        if res_data.get("ok"):
            print("\n[SUCCESS] Webhook configured successfully on Zalo Bot Platform!")
            print(f"Response: {res_data}")
        else:
            print("\n[ERROR] Failed to set webhook.")
            print(f"Response: {res_data}")
    except Exception as e:
        print(f"\n[ERROR] Request failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python set_zalo_webhook.py <webhook_url> <secret_token>")
        print("Example: python set_zalo_webhook.py https://nui-ba-den-travel-assistant-backend.onrender.com/api/zalo/webhook zalosecret12345")
        sys.exit(1)
        
    webhook_url = sys.argv[1]
    secret_token = sys.argv[2]
    
    # Read bot token from .env
    bot_token = None
    env_path = ".env"
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("ZALO_BOT_TOKEN="):
                    bot_token = line.split("=")[1].strip()
                    break
                    
    if not bot_token:
        # Fallback default
        bot_token = "446149642099893122:MnSSVTaXNruoFSWEmvIzKcNxNokvwgssudiLIAhsMrstESLsfPhJFQCYGoKfpSMk"
        
    set_webhook(bot_token, webhook_url, secret_token)
