import re
import unicodedata
from typing import Tuple, Optional

def remove_accents(input_str: str) -> str:
    """Remove Vietnamese diacritics/accents from a string."""
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    s = "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    # Convert 'đ' -> 'd' and 'Đ' -> 'D'
    s = s.replace('đ', 'd').replace('Đ', 'D')
    return s

class ModerationService:
    # 1. Accented Vulgar Words (Always vulgar with accents)
    ACCENTED_VULGAR = {
        "cặc", "lồn", "đéo", "buồi", "địt", "đụ", "ỉa", "đái", "óc chó", "chó đẻ", "khốn nạn",
        "thằng chó", "con đĩ", "đĩ", "mẹ kiếp"
    }

    # 2. Unaccented Vulgar Words (Safe to block standalone without false positives)
    UNACCENTED_VULGAR = {
        "dit", "dm", "dkm", "clm", "vcl", "cmn", "cmnr", "dcm", "vl", "vkl", "đm", "dkm", "dkmm", "clmn", "vcln"
    }

    # 3. Phrasal Vulgar (Multi-word phrases, accented or unaccented)
    PHRASAL_VULGAR = [
        "con cac", "con cack", "con cak", "con c@c", "con c*c",
        "cai lon", "cai l0n", "cai l*n",
        "an cac", "an cặc", "an buoi", "an buồi",
        "phat deo", "phat đéo", "thang cho", "thằng chó",
        "dit me", "địt mẹ", "dit con me", "địt con mẹ",
        "du me", "đụ mẹ", "du ma", "đụ má", "dcm",
        "oc cho", "óc chó", "cho de", "chó đẻ", "khon nan", "khốn nạn"
    ]

    @staticmethod
    def count_emojis(text: str) -> int:
        """Count the number of emojis in the string using Unicode ranges."""
        emoji_count = 0
        for char in text:
            cp = ord(char)
            if (0x1F600 <= cp <= 0x1F64F) or \
               (0x1F300 <= cp <= 0x1F5FF) or \
               (0x1F680 <= cp <= 0x1F6FF) or \
               (0x1F900 <= cp <= 0x1F9FF) or \
               (0x1FA70 <= cp <= 0x1FAFF) or \
               (0x2600 <= cp <= 0x27BF) or \
               (0x1F1E6 <= cp <= 0x1F1FF):
                emoji_count += 1
        return emoji_count

    # 4. Prompt Injection Patterns (Jailbreak / Out-of-scope bypass prevention)
    PROMPT_INJECTION_PATTERNS = [
        r"ignore\s+(all|previous|above)\s+(instructions|prompts|rules)",
        r"bỏ\s+qua\s+(mọi|tất\s+cả)?\s*(quy\s+tắc|chỉ\s+dẫn|mệnh\s+lệnh|hướng\s+dẫn)",
        r"you\s+are\s+now",
        r"từ\s+giờ\s+bạn\s+là",
        r"đóng\s+vai",
        r"act\s+as\s+a",
        r"reveal\s+(system\s+prompt|instructions)",
        r"hiển\s+thị\s+(prompt|chỉ\s+dẫn\s+hệ\s+thống)",
        r"print\s+(your\s+system\s+prompt|the\s+above\s+text)",
        r"trở\s+thành\s+trợ\s+lý\s+lập\s+trình"
    ]

    def validate_message(self, text: str) -> Tuple[bool, Optional[str]]:
        """
        Validates a message for spam, emojis, vulgarity, and prompt injection attacks.
        Returns:
            (is_valid: bool, reason: str or None)
        """
        if not text or not text.strip():
            return True, None

        # 1. Check Prompt Injection / Jailbreak attempts
        text_lower = text.lower().strip()
        text_normalized = remove_accents(text_lower)
        
        for pattern in self.PROMPT_INJECTION_PATTERNS:
            if re.search(pattern, text_lower) or re.search(pattern, text_normalized):
                return False, "Hệ thống chỉ hỗ trợ giải đáp các thông tin du lịch và di tích Khu du lịch quốc gia Núi Bà Đen. Vui lòng đặt câu hỏi liên quan đến du lịch ạ!"

        # 2. Check Emoji count (Limit: maximum 3 emojis)
        emoji_count = self.count_emojis(text)
        if emoji_count > 3:
            return False, "Tin nhắn chứa quá nhiều biểu tượng cảm xúc (emoji)."

        # 3. Check Repetitive symbols/characters (Spam detection)
        if re.search(r'([^\w\s])\1{3,}', text):
            return False, "Tin nhắn chứa ký tự lặp lại quá nhiều lần."
        if re.search(r'(.)\1{5,}', text_lower):
            return False, "Tin nhắn chứa ký tự lặp lại quá nhiều lần."

        # 4. Check Vulgar words
        for phrase in self.PHRASAL_VULGAR:
            if phrase in text_lower or phrase in text_normalized:
                return False, "Tin nhắn chứa từ ngữ không phù hợp."

        words_original = set(re.findall(r'\b\w+\b', text_lower))
        words_normalized = set(re.findall(r'\b\w+\b', text_normalized))

        for word in self.ACCENTED_VULGAR:
            if word in words_original:
                return False, "Tin nhắn chứa từ ngữ không phù hợp."

        for word in self.UNACCENTED_VULGAR:
            if word in words_normalized:
                return False, "Tin nhắn chứa từ ngữ không phù hợp."

        return True, None

moderation_service = ModerationService()
