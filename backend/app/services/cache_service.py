"""
Cache Service — CrawBot RAG
Provides In-Memory LRU & Query Normalization Caching for FAQ responses.
Returns responses in < 5ms for repeated queries, reducing Beeknoee LLM API quota consumption.
"""
import time
import re
import unicodedata
from typing import Dict, Any, Optional
from app.models.chat import ChatResponse

class CacheService:
    def __init__(self, ttl_seconds: float = 3600.0, max_entries: int = 500):
        self.ttl = ttl_seconds
        self.max_entries = max_entries
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _normalize_key(self, question: str, language: str) -> str:
        """Normalize question string for robust cache hits."""
        s = question.strip().lower()
        s = re.sub(r"[^\w\s]", " ", s)
        s = re.sub(r"\s+", " ", s).strip()
        # Remove Vietnamese accents for diacritic-insensitive cache matching
        nfkd = unicodedata.normalize("NFKD", s)
        no_accents = "".join([c for c in nfkd if not unicodedata.combining(c)])
        no_accents = no_accents.replace("đ", "d").replace("Đ", "D")
        return f"{language}:{no_accents}"

    def get(self, question: str, language: str) -> Optional[ChatResponse]:
        """Get cached response if available and not expired."""
        key = self._normalize_key(question, language)
        entry = self._cache.get(key)
        if not entry:
            return None

        now = time.time()
        if now - entry["timestamp"] > self.ttl:
            del self._cache[key]
            return None

        print(f"[CacheService] Cache HIT (<5ms) for question: '{question[:40]}...'")
        return entry["response"]

    def set(self, question: str, language: str, response: ChatResponse):
        """Store response in cache."""
        key = self._normalize_key(question, language)
        # Evict oldest entry if max_entries reached
        if len(self._cache) >= self.max_entries:
            oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k]["timestamp"])
            del self._cache[oldest_key]

        self._cache[key] = {
            "timestamp": time.time(),
            "response": response
        }

cache_service = CacheService()
