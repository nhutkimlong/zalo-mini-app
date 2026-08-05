import json
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
        raise HTTPException(
            status_code=503,
            detail="Cấu hình kết nối cơ sở dữ liệu Supabase bị thiếu (SUPABASE_URL hoặc SUPABASE_KEY)."
        )
    try:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Không thể khởi tạo kết nối Supabase: {str(e)}"
        )

@router.get("/knowledge", response_model=List[ArticleResponse])
def get_articles(category: Optional[str] = None, db: Client = Depends(get_db)):
    try:
        query = db.table("knowledge_articles").select("*")
        if category:
            query = query.eq("category", category)
        response = query.order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        print(f"Admin articles query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi truy vấn cơ sở dữ liệu bài viết: {str(e)}")

def sync_and_reindex_ve_va_gio_mo_cua(source_id: str, content: str, db: Client):
    """
    Synchronize 'tickets' and 'schedules' across all articles in 've_va_gio_mo_cua' category.
    """
    trimmed = content.strip()
    if not (trimmed.startswith("[") or trimmed.startswith("{")):
        return
        
    try:
        source_data = json.loads(trimmed)
        if not isinstance(source_data, dict):
            return
            
        new_tickets = source_data.get("tickets")
        new_schedules = source_data.get("schedules")
        
        # Fetch other articles of the same category
        response = db.table("knowledge_articles") \
            .select("id, title, content, status, category") \
            .eq("category", "ve_va_gio_mo_cua") \
            .neq("id", source_id) \
            .execute()
            
        for other in response.data or []:
            try:
                other_trimmed = other.get("content", "").strip()
                if other_trimmed.startswith("{"):
                    other_data = json.loads(other_trimmed)
                else:
                    other_data = {}
                    
                changed = False
                if new_tickets is not None and other_data.get("tickets") != new_tickets:
                    other_data["tickets"] = new_tickets
                    changed = True
                if new_schedules is not None and other_data.get("schedules") != new_schedules:
                    other_data["schedules"] = new_schedules
                    changed = True
                    
                if changed:
                    updated_content = json.dumps(other_data, ensure_ascii=False, indent=2)
                    db.table("knowledge_articles") \
                        .update({"content": updated_content}) \
                        .eq("id", other["id"]) \
                        .execute()
                        
                    # Re-index the other article if it is published
                    if other["status"] == "published":
                        embedding_service.index_article(
                            article_id=other["id"],
                            title=other["title"],
                            content=updated_content,
                            category=other["category"]
                        )
            except Exception as inner_e:
                print(f"[Sync] Failed to sync other article {other.get('id')}: {inner_e}")
    except Exception as e:
        print(f"[Sync] JSON parse or sync failed: {e}")

@router.post("/knowledge", response_model=ArticleResponse)
def create_article(article: ArticleCreate, db: Client = Depends(get_db)):
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
            
            # Sync across ve_va_gio_mo_cua category
            if new_art["category"] == "ve_va_gio_mo_cua":
                sync_and_reindex_ve_va_gio_mo_cua(str(new_art["id"]), new_art["content"], db)
                
            return new_art
        raise HTTPException(status_code=400, detail="Không thể lưu bài viết")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/knowledge/{article_id}", response_model=ArticleResponse)
def update_article(article_id: UUID, article: ArticleUpdate, db: Client = Depends(get_db)):
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
            else:
                # Delete chunks if status is draft/archived
                db.table("knowledge_chunks").delete().eq("article_id", str(article_id)).execute()
                
            # Sync across ve_va_gio_mo_cua category
            if updated_art["category"] == "ve_va_gio_mo_cua":
                sync_and_reindex_ve_va_gio_mo_cua(str(updated_art["id"]), updated_art["content"], db)
                
            return updated_art
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết để cập nhật")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/knowledge/{article_id}")
def delete_article(article_id: UUID, db: Client = Depends(get_db)):
    try:
        db.table("knowledge_articles").delete().eq("id", str(article_id)).execute()
        return {"status": "success", "message": "Đã xóa bài viết khỏi kho tri thức thành công"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reindex-knowledge")
def reindex_published_articles(db: Client = Depends(get_db)):
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


def _format_chat_log(log: dict, user_map: dict = None) -> dict:
    source_ids = log.get("source_article_ids") or []
    if isinstance(source_ids, list) and source_ids:
        matched_chunks = ", ".join(str(item) for item in source_ids)
    else:
        matched_chunks = log.get("matched_chunks") or "No matched source"

    u_id = log.get("user_id")
    u_name = user_map.get(str(u_id)) if (user_map and u_id) else None

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
        "user_id": str(u_id) if u_id else None,
        "user_name": u_name
    }


@router.get("/chat-logs")
def get_chat_logs(user_id: Optional[str] = None, db: Client = Depends(get_db)):
    """Return recent chatbot conversations for the Admin audit table."""
    try:
        query = db.table("chat_logs").select("*")
        if user_id:
            query = query.eq("user_id", user_id)
        response = query.order("created_at", desc=True).limit(100).execute()
        logs = response.data or []

        # Map user_id to user_name
        user_ids = list(set(log.get("user_id") for log in logs if log.get("user_id")))
        user_map = {}
        if user_ids:
            try:
                u_res = db.table("app_users").select("id, name").in_("id", user_ids).execute()
                for u in u_res.data or []:
                    user_map[str(u["id"])] = u.get("name")
            except Exception as user_err:
                print(f"[ChatLogs] Failed to fetch users for log mapping: {user_err}")

        return [_format_chat_log(log, user_map) for log in logs]
    except Exception as e:
        print(f"Chat logs query error: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi truy vấn nhật ký hội thoại: {str(e)}")


@router.get("/usage-summary", response_model=UsageSummary)
def get_usage_summary(db: Client = Depends(get_db)):
    """Aggregate persisted Beeknoee model usage for Admin cost monitoring."""
    try:
        response = db.table("chat_logs") \
            .select("model, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, created_at") \
            .order("created_at", desc=True) \
            .limit(500) \
            .execute()
        logs = response.data or []
    except Exception as e:
        print(f"Usage summary query error: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi truy vấn thống kê sử dụng: {str(e)}")

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

@router.delete("/chat-logs")
def reset_chat_logs(db: Client = Depends(get_db)):
    """Delete all chatbot conversation logs from Supabase."""
    try:
        # A filter query is mandatory in PostgREST to perform bulk delete
        db.table("chat_logs").delete().neq("question", "this_is_an_impossible_question_to_match_anything_so_it_deletes_all").execute()
        return {"status": "success", "message": "Đã xóa sạch toàn bộ nhật ký hội thoại thành công"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi reset nhật ký hội thoại: {str(e)}")
