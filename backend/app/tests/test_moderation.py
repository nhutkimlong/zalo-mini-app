import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.services.moderation_service import moderation_service

def test_moderation():
    # 1. Clean cases (should pass)
    clean_cases = [
        "Giá vé cáp treo là bao nhiêu vậy ạ?",
        "Mình muốn mua combo buffet và vé cáp treo",
        "Có đường đi bộ lên đỉnh núi không bạn?",
        "Thời tiết hôm nay thế nào?",
        "Cho mình hỏi giờ hoạt động của tuyến Chùa Hang",
        "Các bạn có bán vé lẻ không?",  # contains 'các' which could be mistaken for 'cac' (cặc) if not careful
        "Đeo khẩu trang khi đi cáp treo", # contains 'đeo' which could be mistaken for 'deo' (đéo)
        "Đi tham quan vào buổi sáng lúc mấy giờ?" # contains 'buổi' which could be mistaken for 'buoi' (buồi)
    ]
    
    print("--- TESTING CLEAN CASES ---")
    for case in clean_cases:
        is_valid, reason = moderation_service.validate_message(case)
        print(f"[{'PASS' if is_valid else 'FAIL'}] '{case}' -> {reason}")
        assert is_valid, f"Failed clean case: '{case}' (reason: {reason})"

    # 2. Emoji spam cases (should be blocked)
    emoji_cases = [
        "Chào bạn 💩💩💩💩",
        "Tuyệt vời quá 😂😂😂😂😂😂",
        "⛰️👍👍👍👍"
    ]
    
    print("\n--- TESTING EMOJI SPAM CASES ---")
    for case in emoji_cases:
        is_valid, reason = moderation_service.validate_message(case)
        print(f"[{'PASS' if not is_valid else 'FAIL'}] '{case}' -> {reason}")
        assert not is_valid, f"Failed emoji case: '{case}' (passed but should have failed)"

    # 3. Repetitive characters cases (should be blocked)
    repetitive_cases = [
        "Alo????????",
        "Cáp treo chạy chưa!!!!!!",
        "aaaaaaaaaa",
        "Đi lúc mấy giờ.........."
    ]
    
    print("\n--- TESTING REPETITIVE CHARACTERS CASES ---")
    for case in repetitive_cases:
        is_valid, reason = moderation_service.validate_message(case)
        print(f"[{'PASS' if not is_valid else 'FAIL'}] '{case}' -> {reason}")
        assert not is_valid, f"Failed repetitive case: '{case}' (passed but should have failed)"

    # 4. Accented vulgar cases (should be blocked)
    accented_vulgar_cases = [
        "Đồ óc chó",
        "lũ chó đẻ này",
        "địt mẹ mày",
        "đéo hiểu kiểu gì",
        "như cái lồn",
        "con cặc gì thế",
        "ăn buồi đi"
    ]
    
    print("\n--- TESTING ACCENTED VULGAR CASES ---")
    for case in accented_vulgar_cases:
        is_valid, reason = moderation_service.validate_message(case)
        print(f"[{'PASS' if not is_valid else 'FAIL'}] '{case}' -> {reason}")
        assert not is_valid, f"Failed accented vulgar case: '{case}' (passed but should have failed)"

    # 5. Unaccented/slang cases (should be blocked)
    unaccented_vulgar_cases = [
        "dit con me",
        "dkm may",
        "thang cho",
        "vcl luon",
        "cmnr",
        "con cac",
        "cai lon",
        "an buoi"
    ]
    
    print("\n--- TESTING UNACCENTED VULGAR CASES ---")
    for case in unaccented_vulgar_cases:
        is_valid, reason = moderation_service.validate_message(case)
        print(f"[{'PASS' if not is_valid else 'FAIL'}] '{case}' -> {reason}")
        assert not is_valid, f"Failed unaccented vulgar case: '{case}' (passed but should have failed)"

    print("\nALL MODERATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_moderation()
