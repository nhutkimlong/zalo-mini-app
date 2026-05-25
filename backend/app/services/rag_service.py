"""
CrawBot RAG Service — Ba Den Mountain National Tourist Area
LLM: Single model via BEEKNOEE_LLM_MODEL in .env
All via Beeknoee (https://platform-api.beeknoee.com/v1)
"""
import re
from typing import List, Dict, Any, Tuple, Optional
from uuid import UUID
from openai import OpenAI
from supabase import Client, create_client
from app.core.config import settings
from app.services.embedding_service import embedding_service
from app.models.chat import SourceCitation, ChatResponse

# ─── CrawBot Identity ─────────────────────────────────────────────────────────
CRAWBOT_NAME = "Hướng dẫn viên 4.0"
LOG_NAME = "Huong dan vien 4.0"



# ─── TTS Fallback Chain ────────────────────────────────────────────────────────
TTS_MODEL_CHAIN_VI = [
    "google/google-tts",   # FREE — Vietnamese
]
TTS_MODEL_CHAIN_EN = [
    "google/google-tts",   # FREE — English
]

# ─── System Prompts ───────────────────────────────────────────────────────────
SYSTEM_PROMPT_VI = """Bạn là {name} — hướng dẫn viên du lịch AI của Khu du lịch Núi Bà Đen (Sun World BaDen Mountain), Tây Ninh.

Phong cách giao tiếp:
- Xưng "mình", gọi du khách là "bạn", "anh", "chị" tùy văn cảnh — tự nhiên như người địa phương đang trò chuyện.
- Giọng ấm áp, chân thành, đôi khi pha chút hài hước nhẹ nhàng — không khô khan, không cứng nhắc.
- Nếu thông tin thú vị, hãy kể ngắn gọn một chi tiết hấp dẫn để du khách thêm tò mò (ví dụ: sự tích, kỷ lục, điểm đặc biệt).
- Trả lời tập trung, không dài dòng. Dùng gạch đầu dòng CHỈ khi liệt kê giá vé, giờ mở cửa, hoặc nhiều lựa chọn rõ ràng.
- Không dùng emoji, không nói kiểu quảng cáo, không lặp lại tên hệ thống.

Quy tắc bắt buộc:
- ƯU TIÊN TUYỆT ĐỐI phần [THÔNG BÁO QUAN TRỌNG & CẢNH BÁO MỚI NHẤT] (nếu có). Trong trường hợp thông tin trong Thông báo mâu thuẫn hoặc cập nhật hơn so với tài liệu hướng dẫn cũ (ví dụ: thông báo bảo trì, dừng cáp treo, thay đổi thời gian vận hành khẩn cấp), bạn BẮT BUỘC phải dùng thông tin trong Thông báo để trả lời du khách và nhấn mạnh về việc tạm ngừng/thay đổi khẩn cấp này.
- Chỉ dùng thông tin có trong tài liệu tham khảo bên dưới. Không suy đoán hay bịa đặt.
- Không sao chép nguyên văn tài liệu — diễn đạt lại bằng lời tự nhiên, như đang kể cho bạn nghe.
- Không tự thêm nguồn vào câu trả lời; giao diện hiển thị nguồn riêng.
- Nếu tài liệu không có thông tin: nói thẳng là mình chưa có thông tin chính thức về vấn đề này, và hướng dẫn liên hệ Ban Quản lý qua (0276) 3823.378.
- Không hướng dẫn leo núi tự phát hoặc các hoạt động trái quy định.

Tài liệu tham khảo:
{context}"""

SYSTEM_PROMPT_EN = """You are {name} — an AI tour guide for Ba Den Mountain (Sun World BaDen Mountain), Tay Ninh, Vietnam.

Language requirement:
- Always answer in English, even when the visitor asks in Vietnamese or the reference documents are written in Vietnamese.
- Do not ask the visitor to use English.

Communication style:
- Speak warmly and naturally, like a knowledgeable local guide having a real conversation with a visitor.
- Be friendly and genuine — not promotional, not robotic.
- When a piece of information is fascinating (a legend, a record, a unique feature), briefly share it to spark curiosity.
- Keep answers focused. Use bullet points ONLY for listing prices, hours, or multiple distinct options.
- No emojis. No repeating the system name.

Mandatory rules:
- ABSOLUTE PRIORITY TO [THÔNG BÁO QUAN TRỌNG & CẢNH BÁO MỚI NHẤT] (if present). If the information in the active Announcements contradicts or updates older reference documents (e.g., urgent maintenance alerts, temporary cable car suspensions, sudden operational hour changes), you MUST prioritize and use the Announcement information to answer the visitor, emphasizing the temporary change/suspension.
- Use only information found in the reference documents below. Do not guess or fabricate.
- Never copy text verbatim from the documents — always rephrase naturally in your own words.
- Do not include source titles in your answer; the UI displays sources separately.
- If the documents don't contain the answer: honestly say you don't have official information on that, and suggest contacting the Management Board at (0276) 3823.378.
- Do not guide unauthorized hiking or activities that violate park regulations.

Reference documents:
{context}"""


def _beeknoee_client() -> Optional[OpenAI]:
    """Create an OpenAI-compatible Beeknoee client."""
    if not settings.BEEKNOEE_API_KEY or not settings.BEEKNOEE_BASE_URL:
        return None
    return OpenAI(
        api_key=settings.BEEKNOEE_API_KEY,
        base_url=settings.BEEKNOEE_BASE_URL,
    )


def _estimate_llm_cost(prompt_tokens: int, completion_tokens: int, input_cost_per_1m: float, output_cost_per_1m: float) -> float:
    input_cost = (prompt_tokens / 1_000_000) * input_cost_per_1m
    output_cost = (completion_tokens / 1_000_000) * output_cost_per_1m
    return round(input_cost + output_cost, 8)


def _call_llm(
    client: OpenAI,
    system_prompt: str,
    user_question: str,
    model: str,
    input_cost_per_1m: float,
    output_cost_per_1m: float,
    temperature: float = 0.4,
    max_tokens: Optional[int] = None,
) -> Tuple[str, Dict[str, Any]]:
    """Call the configured LLM model."""
    kwargs = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_question},
        ],
        "temperature": temperature,
    }
    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens

    completion = client.chat.completions.create(**kwargs)
    usage = completion.usage
    prompt_tokens = int(getattr(usage, "prompt_tokens", 0) or 0) if usage else 0
    completion_tokens = int(getattr(usage, "completion_tokens", 0) or 0) if usage else 0
    total_tokens = int(getattr(usage, "total_tokens", prompt_tokens + completion_tokens) or 0) if usage else 0
    usage_data = {
        "model": model,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": total_tokens,
        "estimated_cost_usd": _estimate_llm_cost(prompt_tokens, completion_tokens, input_cost_per_1m, output_cost_per_1m),
    }
    return completion.choices[0].message.content.strip(), usage_data


class RAGService:
    _cached_settings = None
    _cached_at = 0.0

    def __init__(self):
        self.supabase: Optional[Client] = None
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            print(f"[{LOG_NAME}] Supabase connected.")

        self.llm_client = _beeknoee_client()
        if self.llm_client:
            print(f"[{LOG_NAME}] Beeknoee LLM ready. Primary: {settings.BEEKNOEE_LLM_MODEL}")
        else:
            print(f"[{LOG_NAME}] WARNING: No Beeknoee key - keyword-only mode.")

    def _get_dynamic_settings(self) -> Dict[str, Any]:
        """Fetch model and pricing settings from database system_settings table, with local config fallback."""
        import time
        now = time.time()
        if RAGService._cached_settings and (now - RAGService._cached_at < 30):
            return RAGService._cached_settings

        config = {
            "model": settings.BEEKNOEE_LLM_MODEL,
            "input_cost": settings.BEEKNOEE_INPUT_COST_PER_1M,
            "output_cost": settings.BEEKNOEE_OUTPUT_COST_PER_1M,
            "embed_model": settings.BEEKNOEE_EMBED_MODEL,
            "embed_cost": settings.BEEKNOEE_EMBED_COST_PER_1M,
        }

        if not self.supabase:
            return config

        try:
            res = self.supabase.table("system_settings").select("*").execute()
            if res.data:
                for row in res.data:
                    key = row["key"]
                    val = row["value"]
                    if key == "BEEKNOEE_LLM_MODEL":
                        config["model"] = val
                    elif key == "BEEKNOEE_EMBED_MODEL":
                        config["embed_model"] = val
                    elif key == "BEEKNOEE_INPUT_COST_PER_1M":
                        config["input_cost"] = float(val)
                    elif key == "BEEKNOEE_OUTPUT_COST_PER_1M":
                        config["output_cost"] = float(val)
                    elif key == "BEEKNOEE_EMBED_COST_PER_1M":
                        config["embed_cost"] = float(val)
                RAGService._cached_settings = config
                RAGService._cached_at = now
        except Exception as e:
            print(f"[{LOG_NAME}] Failed to fetch dynamic settings from database system_settings: {e}")

        return config

    # ─── Context Retrieval ────────────────────────────────────────────────────

    def retrieve_context(self, question: str, limit: int = 4) -> List[Dict[str, Any]]:
        """
        Retrieve relevant chunks from Supabase.
        Strategy: pgvector semantic search → keyword full-text search.
        """
        if not self.supabase:
            return []

        # 1. Semantic vector search
        try:
            query_embedding = embedding_service.normalize_embedding_dim(
                embedding_service.generate_embedding(question)
            )
            res = self.supabase.rpc("match_chunks", {
                "query_embedding": query_embedding,
                "match_threshold": 0.20,
                "match_count": limit,
                "filter_visibility": "public"
            }).execute()

            if res.data:
                results = []
                for row in res.data:
                    try:
                        similarity = float(row.get("similarity", 0.0))
                    except (ValueError, TypeError):
                        similarity = 0.0
                    results.append({
                        "id": row.get("id"),
                        "article_id": row.get("article_id"),
                        "text": row.get("chunk_text", ""),
                        "metadata": row.get("metadata", {}),
                        "similarity": similarity,
                    })
                print(f"[{LOG_NAME}] Vector search: {len(results)} chunks.")
                return results
        except Exception as e:
            print(f"[{LOG_NAME}] Vector search failed: {e}")

        # 2. Keyword fallback
        return self._keyword_search(question, limit)

    def _keyword_search(self, question: str, limit: int) -> List[Dict[str, Any]]:
        """Score articles by keyword frequency across title + content."""
        if not self.supabase:
            return []
        try:
            words = [w for w in re.findall(r'\w+', question.lower()) if len(w) > 2]
            if not words:
                return []

            res = self.supabase.table("knowledge_articles") \
                .select("id, title, content, category, source") \
                .eq("visibility", "public") \
                .eq("status", "published") \
                .execute()

            if not res.data:
                return []

            scored = []
            for article in res.data:
                score = 0
                title_l = article.get("title", "").lower()
                content_l = article.get("content", "").lower()
                for w in words:
                    score += title_l.count(w) * 4
                    score += content_l.count(w)
                if score > 0:
                    scored.append((score, article))

            scored.sort(key=lambda x: x[0], reverse=True)
            max_score = scored[0][0] if scored else 1

            results = []
            for score, art in scored[:limit]:
                results.append({
                    "id": art["id"],
                    "article_id": art["id"],
                    "text": art["content"],
                    "metadata": {
                        "title": art["title"],
                        "category": art.get("category", "khac"),
                        "source": art.get("source"),
                    },
                    "similarity": round(min(0.85, (score / max_score) * 0.85), 3),
                })

            print(f"[{LOG_NAME}] Keyword search: {len(results)} articles.")
            return results
        except Exception as e:
            print(f"[{LOG_NAME}] Keyword search failed: {e}")
            return []

    # ─── No-Info Response ─────────────────────────────────────────────────────

    def _no_info_response(self, language: str) -> str:
        if language == "en":
            return (
                f"Currently, {CRAWBOT_NAME} does not have approved information on this topic. "
                "Please contact the Management Board via phone at (0276) 3823.378 for direct assistance."
            )
        return (
            f"Hiện {CRAWBOT_NAME} chưa có thông tin chính thức về nội dung này. "
            "Quý khách vui lòng liên hệ Ban Quản lý qua số điện thoại (0276) 3823.378 để được hỗ trợ."
        )

    # ─── Main Ask Pipeline ────────────────────────────────────────────────────

    def _small_talk_response(self, question: str, language: str) -> Optional[str]:
        normalized = re.sub(r"[^\w\s]", " ", question.lower()).strip()
        normalized = re.sub(r"\s+", " ", normalized)
        greetings = {
            "vi": {"xin chao", "chao", "hello", "hi", "alo", "cam on", "cảm ơn", "thanks"},
            "en": {"hello", "hi", "thanks", "thank you", "good morning", "good afternoon"},
        }
        if normalized in greetings.get(language, greetings["vi"]):
            if language == "en":
                return "Hello. I can help with cable car tickets, opening hours, directions, temple etiquette, attractions, and official visitor notices. What would you like to know?"
            return "Chào anh/chị. Mình có thể hỗ trợ thông tin về giá vé cáp treo, giờ hoạt động, đường đi, quy định tham quan, điểm tham quan và thông báo chính thức. Anh/chị muốn hỏi nội dung nào?"
        return None

    def _format_conversation_history(self, conversation_history: Optional[List[Dict[str, Any]]]) -> str:
        if not conversation_history:
            return ""

        lines = []
        for item in conversation_history[-8:]:
            role = item.get("role")
            content = str(item.get("content", "")).strip()
            if role not in {"user", "assistant"} or not content:
                continue
            label = "Du khách" if role == "user" else CRAWBOT_NAME
            lines.append(f"{label}: {content[:800]}")

        if not lines:
            return ""
        return "\n\nNgữ cảnh hội thoại trước đó:\n" + "\n".join(lines)

    def ask(
        self,
        question: str,
        user_id: UUID = None,
        channel: str = "mini_app",
        language: str = "vi",
        conversation_history: Optional[List[Dict[str, Any]]] = None,
    ) -> ChatResponse:
        """
        CrawBot Q&A pipeline:
        1. Retrieve context from Supabase (vector → keyword)
        2. Generate answer via Beeknoee LLM with fallback chain
        3. Log conversation to Supabase chat_logs
        """
        history_context = self._format_conversation_history(conversation_history)
        question_with_context = question + history_context

        small_talk = self._small_talk_response(question, language)
        if small_talk:
            return ChatResponse(
                answer=small_talk,
                confidence_score=1.0,
                sources=[],
            )

        # Fetch active announcements to dynamically feed to chatbot context
        announcements_str = ""
        if self.supabase:
            try:
                ann_res = self.supabase.table("announcements").select("*").eq("status", "published").execute()
                if ann_res.data:
                    parts = []
                    for idx, ann in enumerate(ann_res.data, 1):
                        title = ann.get("title", "")
                        content = ann.get("content", "")
                        ann_type = ann.get("type", "general")
                        parts.append(f"[Thông báo & Cảnh báo số {idx} - Loại: {ann_type} - Tiêu đề: {title}]\nNội dung: {content}")
                    announcements_str = "\n\n---\n\n".join(parts)
            except Exception as ann_err:
                print(f"[{LOG_NAME}] Failed to fetch announcements for context: {ann_err}")

        chunks = self.retrieve_context(question_with_context)
        answer = ""
        confidence_score = 0.0
        sources: List[SourceCitation] = []
        usage_data = {
            "model": None,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "estimated_cost_usd": 0.0,
        }

        if not chunks and not announcements_str:
            answer = self._no_info_response(language)
            confidence_score = 0.0
        else:
            # Build deduplicated source list
            seen: set = set()
            for chunk in chunks:
                aid = str(chunk.get("article_id", ""))
                if aid and aid not in seen:
                    seen.add(aid)
                    sources.append(SourceCitation(
                        article_id=UUID(aid),
                        title=chunk["metadata"].get("title", "Tài liệu chính thức"),
                        category=chunk["metadata"].get("category", "khac"),
                        source=chunk["metadata"].get("source"),
                    ))

            if chunks:
                confidence_score = chunks[0]["similarity"]
            else:
                confidence_score = 0.90 # High confidence for matching active announcements

            if self.llm_client:
                # Build context block
                context_parts = []
                if announcements_str:
                    context_parts.append("[THÔNG BÁO QUAN TRỌNG & CẢNH BÁO MỚI NHẤT ĐANG DIỄN RA TẠI DI TÍCH NÚI BÀ ĐEN]\n" + announcements_str)

                for i, chunk in enumerate(chunks, 1):
                    title = chunk["metadata"].get("title", f"Tài liệu {i}")
                    context_parts.append(f"[Tài liệu {i} — {title}]\n{chunk['text']}")
                context_str = history_context + "\n\n" + "\n\n---\n\n".join(context_parts) if history_context else "\n\n---\n\n".join(context_parts)

                prompt = (SYSTEM_PROMPT_EN if language == "en" else SYSTEM_PROMPT_VI).format(
                    name=CRAWBOT_NAME,
                    context=context_str,
                )

                try:
                    dyn_config = self._get_dynamic_settings()
                    answer, usage_data = _call_llm(
                        client=self.llm_client,
                        system_prompt=prompt,
                        user_question=question,
                        model=dyn_config["model"],
                        input_cost_per_1m=dyn_config["input_cost"],
                        output_cost_per_1m=dyn_config["output_cost"],
                    )
                    # If LLM says "no info" → clear sources
                    no_info_markers = [
                        "chưa có thông tin chính xác",
                        "don't have official information",
                    ]
                    if any(m in answer for m in no_info_markers):
                        confidence_score = 0.1
                        sources = []
                except Exception as e:
                    print(f"[{LOG_NAME}] LLM failed: {e}. Using raw chunk.")
                    answer = chunks[0]["text"] if chunks else self._no_info_response(language)
            else:
                # No LLM available — return best matching chunk directly
                answer = chunks[0]["text"] if chunks else self._no_info_response(language)

        # Log to Supabase
        if self.supabase:
            try:
                self.supabase.table("chat_logs").insert({
                    "user_id": str(user_id) if user_id else None,
                    "channel": channel,
                    "question": question,
                    "answer": answer,
                    "source_article_ids": [str(s.article_id) for s in sources],
                    "confidence_score": float(confidence_score),
                    "model": usage_data["model"],
                    "prompt_tokens": usage_data["prompt_tokens"],
                    "completion_tokens": usage_data["completion_tokens"],
                    "total_tokens": usage_data["total_tokens"],
                    "estimated_cost_usd": usage_data["estimated_cost_usd"],
                }).execute()
            except Exception as e:
                print(f"[{LOG_NAME}] Log failed: {e}")

        return ChatResponse(
            answer=answer,
            confidence_score=float(confidence_score),
            sources=sources,
        )


rag_service = RAGService()
