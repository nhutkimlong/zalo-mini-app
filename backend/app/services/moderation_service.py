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

    def validate_message(self, text: str) -> Tuple[bool, Optional[str]]:
        """
        Validates a message for spam, emojis, and vulgarity.
        Returns:
            (is_valid: bool, reason: str or None)
        """
        if not text or not text.strip():
            return True, None

        # 1. Check Emoji count (Limit: maximum 3 emojis)
        emoji_count = self.count_emojis(text)
        if emoji_count > 3:
            return False, "Tin nhắn chứa quá nhiều biểu tượng cảm xúc (emoji)."

        # 2. Check Repetitive symbols/characters (Spam detection)
        # e.g., "?????", "!!!!!", "......", "aaaaaaa"
        if re.search(r'([^\w\s])\1{3,}', text):
            return False, "Tin nhắn chứa ký tự lặp lại quá nhiều lần."
        if re.search(r'(.)\1{5,}', text.lower()):
            return False, "Tin nhắn chứa ký tự lặp lại quá nhiều lần."

        # 3. Check Vulgar words
        # Lowercase and normalize diacritics
        text_lower = text.lower().strip()
        text_normalized = remove_accents(text_lower)

        # 3a. Check phrasal blacklist (accented or normalized match)
        for phrase in self.PHRASAL_VULGAR:
            if phrase in text_lower or phrase in text_normalized:
                return False, "Tin nhắn chứa từ ngữ không phù hợp."

        # Tokenize by word boundaries for single word check
        words_original = set(re.findall(r'\b\w+\b', text_lower))
        words_normalized = set(re.findall(r'\b\w+\b', text_normalized))

        # 3b. Check accented vulgar words (exact match against original text words)
        for word in self.ACCENTED_VULGAR:
            if word in words_original:
                return False, "Tin nhắn chứa từ ngữ không phù hợp."

        # 3c. Check unaccented/safe vulgar words (match against normalized text words)
        for word in self.UNACCENTED_VULGAR:
            if word in words_normalized:
                return False, "Tin nhắn chứa từ ngữ không phù hợp."

        return True, None

moderation_service = ModerationService()
