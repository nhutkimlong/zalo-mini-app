from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from uuid import UUID
from supabase import Client, create_client
from app.core.config import settings
from app.models.knowledge import ArticleResponse, ArticleCreate, ArticleUpdate
from app.services.embedding_service import embedding_service
from app.models.chat import UsageSummary

router = APIRouter(prefix="/api/admin", tags=["Admin Knowledge & Audit"])

def get_db():
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return None
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Mock knowledge store for offline mode execution
OFFLINE_ARTICLES = [
    {
        "id": "a1c3d359-fe2c-42da-9d19-d94dfcedb021",
        "title": "Thông tin giá vé cáp treo Núi Bà Đen năm 2026",
        "content": "Giá vé cáp treo Sun World BaDen Mountain được quy định rõ ràng như sau:\n1. Tuyến cáp Vân Sơn (Lên đỉnh núi):\n- Vé khứ hồi người lớn: 400.000 VNĐ.\n- Vé khứ hồi trẻ em: 300.000 VNĐ.\n\n2. Tuyến cáp Chùa Hang (Lên Chùa Bà):\n- Vé khứ hồi người lớn: 250.000 VNĐ.\n- Vé khứ hồi trẻ em: 150.000 VNĐ.",
        "category": "ve_va_gio_mo_cua",
        "visibility": "public",
        "source": "Ban Quản Lý Sun World",
        "status": "published",
        "updated_by": None,
        "created_at": "2026-05-21T00:00:00Z",
        "updated_at": "2026-05-21T00:00:00Z"
    },
    {
        "id": "a1c3d359-fe2c-42da-9d19-d94dfcedb022",
        "title": "Giờ hoạt động chi tiết của Khu du lịch Núi Bà Đen",
        "content": "Khu du lịch Quốc gia Núi Bà Đen hoạt động tất cả các ngày:\n1. Tuyến cáp treo Vân Sơn (lên đỉnh núi):\n- Thứ Hai đến Thứ Sáu: 07:00 đến 18:00.\n- Thứ Bảy & Chủ Nhật: 06:00 đến 21:00.\n\n2. Tuyến cáp Chùa Hang (lên Chùa Bà):\n- Thứ Hai đến Thứ Sáu: 06:00 đến 18:00.\n- Thứ Bảy & Chủ Nhật: 05:30 đến 22:00.",
        "category": "ve_va_gio_mo_cua",
        "visibility": "public",
        "source": "Ban Quản Lý Khu Di Tích",
        "status": "published",
        "updated_by": None,
        "created_at": "2026-05-21T00:00:00Z",
        "updated_at": "2026-05-21T00:00:00Z"
    }
]

OFFLINE_CHAT_LOGS = [
    {
        "id": "91c3d359-fe2c-42da-9d19-d94dfcedb061",
        "user_id": None,
        "channel": "mini_app",
        "question": "Giá vé cáp treo lên đỉnh núi là bao nhiêu vậy?",
        "answer": "Giá vé cáp treo Sun World BaDen Mountain tuyến cáp Vân Sơn lên đỉnh núi như sau: Vé khứ hồi người lớn là 400.000 VNĐ; vé khứ hồi trẻ em (từ 1m đến 1m4) là 300.000 VNĐ; trẻ em dưới 1m được miễn phí hoàn toàn.",
        "source_article_ids": ["a1c3d359-fe2c-42da-9d19-d94dfcedb021"],
        "confidence_score": 0.985,
        "model": "gemini-3.1-flash-lite",
        "prompt_tokens": 1200,
        "completion_tokens": 180,
        "total_tokens": 1380,
        "estimated_cost_usd": 0.0,
        "created_at": "2026-05-21T09:00:00Z"
    },
    {
        "id": "91c3d359-fe2c-42da-9d19-d94dfcedb062",
        "user_id": None,
        "channel": "mini_app",
        "question": "Chùa Bà Đen mở cửa từ mấy giờ đến mấy giờ?",
        "answer": "Khu vực Điện thờ và Chùa Bà mở cửa chiêm bái từ 06:00 đến 22:00 hàng ngày. Riêng tuyến cáp treo Chùa Hang lên Chùa Bà hoạt động từ 06:00 đến 18:00 (ngày thường) và mở sớm hơn từ 05:30 đến 22:00 vào thứ Bảy và Chủ Nhật.",
        "source_article_ids": ["a1c3d359-fe2c-42da-9d19-d94dfcedb022"],
        "confidence_score": 0.950,
        "model": "gemini-3.1-flash-lite",
        "prompt_tokens": 980,
        "completion_tokens": 160,
        "total_tokens": 1140,
        "estimated_cost_usd": 0.0,
        "created_at": "2026-05-21T09:10:00Z"
    }
]

@router.get("/knowledge", response_model=List[ArticleResponse])
def get_articles(category: Optional[str] = None, db: Optional[Client] = Depends(get_db)):
    if not db:
        res = OFFLINE_ARTICLES
        if category:
            res = [a for a in res if a["category"] == category]
        return res

    try:
        query = db.table("knowledge_articles").select("*")
        if category:
            query = query.eq("category", category)
        response = query.order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        print(f"Admin articles query failed: {e}")
        res = OFFLINE_ARTICLES
        if category:
            res = [a for a in res if a["category"] == category]
        return res

@router.post("/knowledge", response_model=ArticleResponse)
def create_article(article: ArticleCreate, db: Optional[Client] = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=503, detail="Database connection offline.")
    try:
        response = db.table("knowledge_articles").insert(article.dict()).execute()
        if response.data:
            new_art = response.data[0]
            # Index chunks if published
            if new_art["status"] == "published":
                embedding_service.index_article(
                    article_id=new_art["id"],
                    title=new_art["title"],
                    content=new_art["content"],
                    category=new_art["category"]
                )
            return new_art
        raise HTTPException(status_code=400, detail="Không thể lưu bài viết")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/knowledge/{article_id}", response_model=ArticleResponse)
def update_article(article_id: UUID, article: ArticleUpdate, db: Optional[Client] = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=503, detail="Database connection offline.")
    try:
        response = db.table("knowledge_articles").update(article.dict(exclude_unset=True)).eq("id", str(article_id)).execute()
        if response.data:
            updated_art = response.data[0]
            # Index or re-index if published
            if updated_art["status"] == "published":
                embedding_service.index_article(
                    article_id=updated_art["id"],
                    title=updated_art["title"],
                    content=updated_art["content"],
                    category=updated_art["category"]
                )
            return updated_art
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết để cập nhật")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/knowledge/{article_id}")
def delete_article(article_id: UUID, db: Optional[Client] = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=503, detail="Database connection offline.")
    try:
        db.table("knowledge_articles").delete().eq("id", str(article_id)).execute()
        return {"status": "success", "message": "Đã xóa bài viết khỏi kho tri thức thành công"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reindex-knowledge")
def reindex_published_articles(db: Optional[Client] = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=503, detail="Database connection offline.")
    try:
        response = db.table("knowledge_articles") \
            .select("id, title, content, category") \
            .eq("status", "published") \
            .eq("visibility", "public") \
            .execute()

        indexed = 0
        failed = []
        for article in response.data or []:
            ok = embedding_service.index_article(
                article_id=article["id"],
                title=article["title"],
                content=article["content"],
                category=article["category"],
            )
            if ok:
                indexed += 1
            else:
                failed.append(article["id"])

        return {
            "status": "success" if not failed else "partial",
            "indexed_articles": indexed,
            "failed_article_ids": failed,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



def _usage_number(log: dict, key: str) -> float:
    value = log.get(key) or 0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _format_chat_log(log: dict) -> dict:
    source_ids = log.get("source_article_ids") or []
    if isinstance(source_ids, list) and source_ids:
        matched_chunks = ", ".join(str(item) for item in source_ids)
    else:
        matched_chunks = log.get("matched_chunks") or "No matched source"

    return {
        "id": str(log.get("id")),
        "question": log.get("question") or "",
        "answer": log.get("answer") or "",
        "confidence_score": float(_usage_number(log, "confidence_score")),
        "matched_chunks": matched_chunks,
        "channel": log.get("channel") or "mini_app",
        "model": log.get("model"),
        "prompt_tokens": int(_usage_number(log, "prompt_tokens")),
        "completion_tokens": int(_usage_number(log, "completion_tokens")),
        "total_tokens": int(_usage_number(log, "total_tokens")),
        "estimated_cost_usd": float(_usage_number(log, "estimated_cost_usd")),
        "created_at": log.get("created_at"),
    }


@router.get("/chat-logs")
def get_chat_logs(db: Optional[Client] = Depends(get_db)):
    """Return recent chatbot conversations for the Admin audit table."""
    logs = OFFLINE_CHAT_LOGS

    if db:
        try:
            response = db.table("chat_logs") \
                .select("*") \
                .order("created_at", desc=True) \
                .limit(100) \
                .execute()
            logs = response.data or []
        except Exception as e:
            print(f"Chat logs query error: {e}")

    return [_format_chat_log(log) for log in logs]


@router.get("/usage-summary", response_model=UsageSummary)
def get_usage_summary(db: Optional[Client] = Depends(get_db)):
    """Aggregate persisted Beeknoee model usage for Admin cost monitoring."""
    logs = OFFLINE_CHAT_LOGS

    if db:
        try:
            response = db.table("chat_logs") \
                .select("model, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, created_at") \
                .order("created_at", desc=True) \
                .limit(500) \
                .execute()
            logs = response.data or []
        except Exception as e:
            print(f"Usage summary query error: {e}")

    totals = {
        "request_count": len(logs),
        "prompt_tokens": int(sum(_usage_number(log, "prompt_tokens") for log in logs)),
        "completion_tokens": int(sum(_usage_number(log, "completion_tokens") for log in logs)),
        "total_tokens": int(sum(_usage_number(log, "total_tokens") for log in logs)),
        "estimated_cost_usd": round(sum(_usage_number(log, "estimated_cost_usd") for log in logs), 8),
    }

    daily_map = {}
    model_map = {}
    for log in logs:
        date_key = str(log.get("created_at") or "")[:10] or "unknown"
        model_key = log.get("model") or "untracked"
        for target, key in ((daily_map, date_key), (model_map, model_key)):
            if key not in target:
                target[key] = {
                    "date" if target is daily_map else "model": key,
                    "request_count": 0,
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0,
                    "estimated_cost_usd": 0.0,
                }
            target[key]["request_count"] += 1
            target[key]["prompt_tokens"] += int(_usage_number(log, "prompt_tokens"))
            target[key]["completion_tokens"] += int(_usage_number(log, "completion_tokens"))
            target[key]["total_tokens"] += int(_usage_number(log, "total_tokens"))
            target[key]["estimated_cost_usd"] = round(target[key]["estimated_cost_usd"] + _usage_number(log, "estimated_cost_usd"), 8)

    return {
        **totals,
        "daily": sorted(daily_map.values(), key=lambda row: row["date"], reverse=True)[:30],
        "by_model": sorted(model_map.values(), key=lambda row: row["total_tokens"], reverse=True),
    }
