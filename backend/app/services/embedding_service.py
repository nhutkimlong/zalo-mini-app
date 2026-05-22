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

    def generate_embedding(self, text: str) -> List[float]:
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
        primary = settings.BEEKNOEE_EMBED_MODEL
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
            chunks = self.split_text(f"Tiêu đề: {title}\n\nNội dung: {content}")
            for i, chunk_text in enumerate(chunks):
                embedding = self.normalize_embedding_dim(self.generate_embedding(chunk_text))
                self.supabase.table("knowledge_chunks").insert({
                    "article_id": str(article_id),
                    "chunk_text": chunk_text,
                    "embedding": embedding,
                    "metadata": {
                        "title": title,
                        "category": category,
                        "chunk_index": i,
                        "total_chunks": len(chunks),
                    }
                }).execute()
            print(f"[Embedding] Indexed article {article_id} into {len(chunks)} chunks.")
            return True
        except Exception as e:
            print(f"[Embedding] Index failed for {article_id}: {e}")
            return False


embedding_service = EmbeddingService()
