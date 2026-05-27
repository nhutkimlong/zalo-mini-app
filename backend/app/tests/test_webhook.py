import hashlib
import json
from app.routers.zalo_webhook import verify_zevent_signature

def test_verify_zevent_signature_success():
    data = {
        "event": "user.revoke.consent",
        "appId": "2646373759294038927",
        "userId": "4047671499938107249",
        "timestamp": 1670553442564
    }
    api_key = "test_api_key_123"
    
    # Manually compute signature matching Zalo docs rules
    keys = sorted(data.keys())
    content = ""
    for k in keys:
        val = data[k]
        content += str(val)
    expected_sig = hashlib.sha256((content + api_key).encode('utf-8')).hexdigest()
    
    # Test verify function
    assert verify_zevent_signature(data, api_key, expected_sig) is True
    assert verify_zevent_signature(data, api_key, expected_sig.upper()) is True
    assert verify_zevent_signature(data, api_key, "wrong_sig") is False

def test_verify_zevent_signature_empty_key():
    data = {"event": "test"}
    assert verify_zevent_signature(data, "", "any_sig") is True
