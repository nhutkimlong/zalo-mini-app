"""
Embedding Service — CrawBot RAG
Fallback chain: gemini-embedding-001 → gemini-embedding-2 → text-embedding-3-small → mock

All models served via Beeknoee (https://platform-api.beeknoee.com/v1).
"""
import numpy as np
from typing import List, Optional
from uuid import UUID
from openai import OpenAI
from app.core.config import settings

# ─── Fallback Model Chain ────────────────────────────────────────────────────
# Ordered by preference: only use 100% free models
EMBED_MODEL_CHAIN = [
    "gemini-embedding-001",      # Free 100 req/day
    "gemini-embedding-2",        # Free 100 req/day
]

# Embedding dimensions by model
EMBED_DIMS = {
    "gemini-embedding-001": 3072,
    "gemini-embedding-2":   3072,
}
DEFAULT_DIM = 1536  # Safe fallback dimension


class EmbeddingService:
    def __init__(self):
        self.client: Optional[OpenAI] = None
        self._init_client()
        
        # In-memory cache to save free API quota for repeated search queries
        self._query_cache = {}
        self._cached_settings = None
        self._cached_at = 0.0

        # Supabase for indexing
        self.supabase = None
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            from supabase import create_client
            self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    def _init_client(self):
        """Initialize OpenAI-compatible Beeknoee client."""
        if settings.BEEKNOEE_API_KEY and settings.BEEKNOEE_BASE_URL:
            self.client = OpenAI(
                api_key=settings.BEEKNOEE_API_KEY,
                base_url=settings.BEEKNOEE_BASE_URL,
            )
            # Local client initialization is offline; no API calls or requests are made during startup.
            print(f"[Embedding] Beeknoee client helper ready (offline). Primary: {settings.BEEKNOEE_EMBED_MODEL}")
        else:
            print("[Embedding] WARNING: No Beeknoee API key. Will use mock embeddings.")

    def _get_dynamic_settings(self) -> dict:
        """Fetch primary embedding settings from database system_settings table, with local config fallback."""
        import time
        now = time.time()
        if self._cached_settings and (now - self._cached_at < 30):
            return self._cached_settings

        config = {
            "embed_model": settings.BEEKNOEE_EMBED_MODEL,
            "embed_cost": settings.BEEKNOEE_EMBED_COST_PER_1M
        }

        if not self.supabase:
            return config

        try:
            res = self.supabase.table("system_settings").select("*").execute()
            if res.data:
                for row in res.data:
                    key = row["key"]
                    val = row["value"]
                    if key == "BEEKNOEE_EMBED_MODEL":
                        config["embed_model"] = val
                    elif key == "BEEKNOEE_EMBED_COST_PER_1M":
                        config["embed_cost"] = float(val)
                self._cached_settings = config
                self._cached_at = now
        except Exception as e:
            print(f"[Embedding] Failed to fetch dynamic settings from database system_settings: {e}")

        return config

    def generate_embedding(self, text: str, log_statistics: bool = True) -> List[float]:
        """
        Generate embedding with automatic fallback chain.
        Chain: primary model → fallback models → deterministic mock vector.
        """
        # Clean text to make the cache hits robust
        cache_key = text.strip().lower()
        if cache_key in self._query_cache:
            print(f"[Embedding] Cache HIT for query: '{text[:40]}...'")
            return self._query_cache[cache_key]

        if not self.client:
            return self._mock_embedding(text)

        # Build chain: configured primary model first, then rest of chain
        dyn_config = self._get_dynamic_settings()
        primary = dyn_config["embed_model"]
        chain = [primary] + [m for m in EMBED_MODEL_CHAIN if m != primary]

        last_error = None
        for model in chain:
            try:
                response = self.client.embeddings.create(
                    input=text,
                    model=model,
                )
                embedding = response.data[0].embedding
                
                # Cache the successful embedding to save API limits
                self._query_cache[cache_key] = embedding
                
                if model != primary:
                    print(f"[Embedding] Fallback succeeded with model: {model}")
                
                # Parse tokens
                prompt_tokens = 0
                if hasattr(response, "usage") and response.usage:
                    prompt_tokens = getattr(response.usage, "prompt_tokens", 0)
                if not prompt_tokens:
                    prompt_tokens = max(1, len(text) // 4)

                # Log usage to Supabase chat_logs for statistics
                if log_statistics and self.supabase:
                    try:
                        embed_cost = dyn_config["embed_cost"]
                        estimated_cost = (prompt_tokens / 1_000_000.0) * embed_cost
                        
                        self.supabase.table("chat_logs").insert({
                            "user_id": None,
                            "channel": "backend_rag",
                            "question": f"Sinh vector embedding RAG (Độ dài: {len(text)} ký tự)",
                            "answer": f"[Vector Embedding] Kích thước: {len(embedding)}",
                            "confidence_score": 1.0,
                            "model": model,
                            "prompt_tokens": prompt_tokens,
                            "completion_tokens": 0,
                            "total_tokens": prompt_tokens,
                            "estimated_cost_usd": estimated_cost
                        }).execute()
                    except Exception as log_err:
                        print(f"[Embedding] Failed to insert log to chat_logs: {log_err}")

                return embedding
            except Exception as e:
                last_error = e
                print(f"[Embedding] Model '{model}' failed: {e}. Trying next fallback...")

        print(f"[Embedding] All models exhausted. Using mock vector. Last error: {last_error}")
        return self._mock_embedding(text)

    def _mock_embedding(self, text: str) -> List[float]:
        """
        Deterministic 1536-dim vector from text hash.
        Used when all API models fail (offline/quota exhausted).
        """
        seed = sum(ord(c) for c in text) % (2 ** 32)
        rng = np.random.default_rng(seed)
        vec = rng.standard_normal(DEFAULT_DIM)
        return (vec / np.linalg.norm(vec)).tolist()

    def normalize_embedding_dim(self, embedding: List[float]) -> List[float]:
        """
        Keep generated embeddings compatible with the current pgvector column.
        Gemini currently returns 3072 dims; keep this aligned with the pgvector column.
        """
        target_dim = settings.EMBEDDING_DIM
        if len(embedding) == target_dim:
            return embedding
        if len(embedding) > target_dim:
            return embedding[:target_dim]
        return embedding + [0.0] * (target_dim - len(embedding))

    def split_text(self, text: str, chunk_size: int = 600, overlap: int = 120) -> List[str]:
        """Split document into overlapping chunks for indexing."""
        if not text:
            return []

        paragraphs = text.split("\n\n")
        chunks: List[str] = []
        current = ""

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            if len(para) > chunk_size:
                sentences = para.replace(". ", ".\n").split("\n")
                for sentence in sentences:
                    sentence = sentence.strip()
                    if len(current) + len(sentence) + 1 <= chunk_size:
                        current += (" " if current else "") + sentence
                    else:
                        if current:
                            chunks.append(current)
                        words = current.split()
                        overlap_words = words[-max(1, overlap // 8):] if words else []
                        current = " ".join(overlap_words) + (" " if overlap_words else "") + sentence
            else:
                if len(current) + len(para) + 2 <= chunk_size:
                    current += ("\n\n" if current else "") + para
                else:
                    if current:
                        chunks.append(current)
                    words = current.split()
                    overlap_words = words[-max(1, overlap // 8):] if words else []
                    current = " ".join(overlap_words) + ("\n\n" if overlap_words else "") + para

        if current:
            chunks.append(current)
        return chunks

    def index_article(self, article_id: UUID, title: str, content: str, category: str) -> bool:
        """Index article: chunk → embed → store in Supabase knowledge_chunks."""
        if not self.supabase:
            print("[Embedding] No Supabase. Skipping index.")
            return False
        try:
            self.supabase.table("knowledge_chunks").delete().eq("article_id", str(article_id)).execute()
            
            # Detect JSON and format it into plain text for better RAG indexing
            clean_content = content
            trimmed = content.strip()
            
            import json
            import re

            json_str = None
            if trimmed.startswith("[") or trimmed.startswith("{"):
                json_str = trimmed
            else:
                # Try finding JSON block inside ```json ... ``` or first { ... } / [ ... ]
                match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", trimmed)
                if match:
                    json_str = match.group(1).strip()
                else:
                    first_brace = trimmed.find("{")
                    first_bracket = trimmed.find("[")
                    idx = -1
                    if first_brace != -1 and first_bracket != -1:
                        idx = min(first_brace, first_bracket)
                    elif first_brace != -1:
                        idx = first_brace
                    elif first_bracket != -1:
                        idx = first_bracket
                        
                    if idx != -1:
                        last_brace = trimmed.rfind("}")
                        last_bracket = trimmed.rfind("]")
                        last_idx = max(last_brace, last_bracket)
                        if last_idx > idx:
                            json_str = trimmed[idx:last_idx+1].strip()

            if json_str:
                try:
                    data = json.loads(json_str)
                    text_parts = []
                    
                    # For category ve_va_gio_mo_cua, separate indexing concern by title keywords to avoid outdated overlaps.
                    title_lower = title.lower()
                    is_tickets_article = any(k in title_lower for k in ["giá vé", "gia ve", "ticket", "price"])
                    is_schedules_article = any(k in title_lower for k in ["giờ", "gio", "lịch", "lich", "schedule", "operating", "hour"])
                    
                    # Format tickets
                    tickets = data.get("tickets", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
                    if tickets and (is_tickets_article or not is_schedules_article or category != "ve_va_gio_mo_cua"):
                        text_parts.append("DANH SÁCH GIÁ VÉ VÀ CÁC GÓI COMBO / TICKET PRICES & COMBOS:")
                        for sec in tickets:
                            title_vi = sec.get("title", "")
                            title_en = sec.get("titleEn", "")
                            
                            extra_desc = ""
                            title_vi_lower = title_vi.lower()
                            if "đỉnh" in title_vi_lower and "chùa" in title_vi_lower and "buffet" in title_vi_lower:
                                extra_desc = " [Gói Combo 2 tuyến cáp: Khứ hồi Đỉnh Vân Sơn + Khứ hồi Chùa Hang + Buffet trưa]"
                            elif "đỉnh" in title_vi_lower and "buffet" in title_vi_lower:
                                extra_desc = " [Gói Combo 1 tuyến cáp: Khứ hồi Đỉnh Vân Sơn + Buffet trưa]"
                                
                            text_parts.append(f"\n--- {title_vi}{extra_desc} ({title_en}) ---")
                            for item in sec.get("items", []):
                                name_vi = item.get("name", "")
                                name_en = item.get("nameEn", "")
                                price_vi = item.get("price", "")
                                price_en = item.get("priceEn", "")
                                price_line = f"- {name_vi} ({name_en}): {price_vi} ({price_en})"
                                oneway_vi = item.get("priceOneway", "")
                                oneway_en = item.get("priceOnewayEn", "")
                                if oneway_vi:
                                    price_line += f" | Một chiều / One-way: {oneway_vi} ({oneway_en})"
                                text_parts.append(price_line)
                                
                    # Format schedules
                    schedules = data.get("schedules", []) if isinstance(data, dict) else []
                    if schedules and (is_schedules_article or not is_tickets_article or category != "ve_va_gio_mo_cua"):
                        text_parts.append("\n\nLỊCH VẬN HÀNH / OPERATING HOURS:")
                        for sec in schedules:
                            title_vi = sec.get("title", "")
                            title_en = sec.get("titleEn", "")
                            text_parts.append(f"\n--- {title_vi} ({title_en}) ---")
                            for item in sec.get("items", []):
                                label_vi = item.get("label", "")
                                label_en = item.get("labelEn", "")
                                hours_vi = item.get("hours", "")
                                hours_en = item.get("hoursEn", "")
                                note_vi = item.get("note", "")
                                note_en = item.get("noteEn", "")
                                sched_line = f"- {label_vi} ({label_en}): {hours_vi} ({hours_en})"
                                if note_vi:
                                    sched_line += f" | Lưu ý / Note: {note_vi} ({note_en})"
                                text_parts.append(sched_line)
                    
                    if text_parts:
                        clean_content = "\n".join(text_parts)
                        print(f"[Embedding] Successfully extracted and formatted JSON for article: '{title}' ({len(text_parts)} sections/lines)")
                except Exception as e:
                    print(f"[Embedding] JSON format parser failed for '{title}': {e}")
                    clean_content = content

            chunks = self.split_text(f"Tiêu đề: {title}\n\nNội dung: {clean_content}")
            chunks_to_insert = []
            for i, chunk_text in enumerate(chunks):
                # Gọi generate_embedding với log_statistics=False để tránh ghi rác logs khi reindex
                embedding = self.normalize_embedding_dim(self.generate_embedding(chunk_text, log_statistics=False))
                chunks_to_insert.append({
                    "article_id": str(article_id),
                    "chunk_text": chunk_text,
                    "embedding": embedding,
                    "metadata": {
                        "title": title,
                        "category": category,
                        "chunk_index": i,
                        "total_chunks": len(chunks),
                    }
                })
                
            # Ghi hàng loạt (Bulk Insert) để tối ưu hóa tốc độ ghi và tiết kiệm tài nguyên RAM/CPU
            if chunks_to_insert:
                self.supabase.table("knowledge_chunks").insert(chunks_to_insert).execute()
            print(f"[Embedding] Indexed article {article_id} into {len(chunks)} chunks.")
            return True
        except Exception as e:
            print(f"[Embedding] Index failed for {article_id}: {e}")
            return False


embedding_service = EmbeddingService()
