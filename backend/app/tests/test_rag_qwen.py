import pytest
import uuid
from fastapi.testclient import TestClient
from supabase import Client
from app.services.embedding_service import embedding_service
from app.services.rag_service import rag_service

def test_embedding_generation():
    """Verify embedding generation from Beeknoee API returns correct floats and handles dimensions."""
    test_text = "Kiểm thử tự động sinh vector embedding."
    vector = embedding_service.generate_embedding(test_text)
    
    assert isinstance(vector, list)
    assert len(vector) > 0
    assert all(isinstance(val, float) for val in vector)
    # The dimension must be either 3072 (if gemini-embedding-001 succeeded) or 1536 (if fallback/mock was used)
    assert len(vector) in (1536, 3072)

def test_article_indexing_and_retrieval(db_client: Client):
    """Test full document indexing flow: create article -> chunk & embed -> verify vector search similarity."""
    unique_id = uuid.uuid4()
    test_title = f"Chính sách vé Sun World Bà Đen {unique_id}"
    test_content = (
        f"Khu du lịch Sun World BaDen Mountain công bố chính sách vé mới phục vụ kiểm thử {unique_id}. "
        "Giá vé cáp treo khứ hồi tuyến Vân Sơn lên đỉnh núi dành cho người lớn là 350.000 VNĐ. "
        "Giá vé dành cho trẻ em từ 1m đến 1m4 là 250.000 VNĐ. Trẻ em dưới 1m được miễn phí vé hoàn toàn."
    )
    
    # 1. Insert knowledge article directly into DB
    db_art = db_client.table("knowledge_articles").insert({
        "id": str(unique_id),
        "title": test_title,
        "content": test_content,
        "category": "ve_va_gio_mo_cua",
        "status": "published",
        "visibility": "public"
    }).execute()
    
    assert len(db_art.data) == 1
    
    try:
        # 2. Index the article (this splits it, embeds, and saves to knowledge_chunks)
        success = embedding_service.index_article(
            article_id=unique_id,
            title=test_title,
            content=test_content,
            category="ve_va_gio_mo_cua"
        )
        assert success is True
        
        # Verify chunks exist in DB
        db_chunks = db_client.table("knowledge_chunks").select("*").eq("article_id", str(unique_id)).execute()
        assert len(db_chunks.data) > 0
        
        # 3. Retrieve context via RAG semantic/keyword search
        results = rag_service.retrieve_context(f"giá vé cáp treo người lớn lên đỉnh núi Bà Đen {unique_id}")
        assert len(results) > 0
        assert any(str(r["article_id"]) == str(unique_id) for r in results)
        
    finally:
        # Cleanup (Cascade delete will remove chunks)
        db_client.table("knowledge_articles").delete().eq("id", str(unique_id)).execute()

def test_rag_chat_qwen(api_client: TestClient, db_client: Client):
    """Test RAG Chat endpoint calling Beeknoee's Qwen-3 LLM with injected context and verifying Chat Logs."""
    unique_id = uuid.uuid4()
    test_title = f"Quy định trang phục viếng Chùa Bà {unique_id}"
    test_content = (
        f"Theo quy định kiểm thử {unique_id}, du khách khi đến chiêm bái Điện Bà và viếng Chùa Bà "
        "phải mặc trang phục kín đáo, lịch sự. Nghiêm cấm mặc váy ngắn, quần đùi, áo ba lỗ "
        "hoặc trang phục phản cảm. Vui lòng đi nhẹ nói khẽ, giữ gìn vệ sinh chung trong khuôn viên di tích linh thiêng."
    )

    # Insert test article
    db_client.table("knowledge_articles").insert({
        "id": str(unique_id),
        "title": test_title,
        "content": test_content,
        "category": "noi_quy",
        "status": "published",
        "visibility": "public"
    }).execute()

    # Index chunks
    embedding_service.index_article(
        article_id=unique_id,
        title=test_title,
        content=test_content,
        category="noi_quy"
    )

    chat_res_data = None
    try:
        # Call RAG Chat endpoint
        chat_payload = {
            "question": f"Đến viếng Chùa Bà Đen cần mặc trang phục như thế nào để đúng quy định {unique_id}?",
            "channel": "mini_app",
            "language": "vi"
        }
        
        response = api_client.post("/api/chat/", json=chat_payload)
        assert response.status_code == 200
        
        chat_res_data = response.json()
        assert "answer" in chat_res_data
        assert chat_res_data["confidence_score"] > 0
        assert len(chat_res_data["sources"]) > 0
        assert any(str(src["article_id"]) == str(unique_id) for src in chat_res_data["sources"])
        
        # Verify response text follows CrawBot guidelines (polite tone, no emojis)
        answer = chat_res_data["answer"]
        assert "kín đáo" in answer or "lịch sự" in answer
        assert "😊" not in answer  # Ensure no emojis are returned
        
        # Verify insertion in chat_logs table
        db_logs = db_client.table("chat_logs").select("*").eq("question", chat_payload["question"]).execute()
        assert len(db_logs.data) > 0
        assert db_logs.data[0]["answer"] == answer

    finally:
        # Cleanup
        db_client.table("knowledge_articles").delete().eq("id", str(unique_id)).execute()
        if chat_res_data:
            db_client.table("chat_logs").delete().eq("question", f"Đến viếng Chùa Bà Đen cần mặc trang phục như thế nào để đúng quy định {unique_id}?").execute()


def test_rag_chat_multilingual(api_client: TestClient, db_client: Client):
    """Test that the chatbot automatically detects query language and responds in the same language (English & Korean)."""
    # 1. Test English question
    en_question = "How much does a cable car ticket cost? Please answer briefly."
    en_payload = {
        "question": en_question,
        "channel": "mini_app",
        "language": "vi"  # Even though payload defaults to 'vi', it should auto-detect and reply in English
    }
    
    response = api_client.post("/api/chat/", json=en_payload)
    assert response.status_code == 200
    res_data = response.json()
    assert "answer" in res_data
    answer_en = res_data["answer"].lower()
    assert any(w in answer_en for w in ["cable", "car", "ticket", "price", "mount", "ba", "den", "temple"])
    
    # Clean up English log
    db_client.table("chat_logs").delete().eq("question", en_question).execute()

    # 2. Test Korean question
    ko_question = "케이블카 티켓 가격은 얼마인가요? 간단히 답해주세요."
    ko_payload = {
        "question": ko_question,
        "channel": "mini_app",
        "language": "vi"
    }
    
    response = api_client.post("/api/chat/", json=ko_payload)
    assert response.status_code == 200
    res_data_ko = response.json()
    assert "answer" in res_data_ko
    answer_ko = res_data_ko["answer"]
    # Check that response contains Korean Hangul characters
    assert any(ord(char) >= 0xac00 and ord(char) <= 0xd7a3 for char in answer_ko)
    
    # Clean up Korean log
    db_client.table("chat_logs").delete().eq("question", ko_question).execute()


def test_rag_chat_history_logical_continuity(db_client: Client):
    """Verify chatbot retains memory of previous recommendations and uses active announcements on subsequent turns."""
    import uuid
    
    # Clear cache to force database fetch of announcements
    rag_service._cached_announcements = None
    rag_service._cached_announcements_at = 0.0
    
    announcement_id = str(uuid.uuid4())
    
    # 1. Insert a temporary promotional announcement in the database
    db_client.table("announcements").insert({
        "id": announcement_id,
        "title": "Ưu đãi Vía Bà 2026 Test",
        "content": "Giảm giá đặc biệt combo Đỉnh + Chùa + Buffet ngày thường còn 650.000 VNĐ/người lớn và 450.000 VNĐ/trẻ em.",
        "type": "general",
        "status": "published"
    }).execute()

    q1 = None
    q2 = None
    try:
        # Turn 1: Ask about buffet promotions
        q1 = "Ngày mai thứ Ba có ưu đãi combo buffet nào không?"
        res1 = rag_service.ask(
            question=q1,
            channel="zalo_bot",
            language="vi"
        )
        
        assert "650.000" in res1.answer or "450.000" in res1.answer
        
        # Turn 2: Ask for calculation of 2 adults and 1 child based on the advice
        q2 = "Okkk chi phí cho 2 người lớn 1 trẻ em hết bao nhiêu như bạn vừa tính?"
        history = [
            {"role": "user", "content": q1},
            {"role": "assistant", "content": res1.answer}
        ]
        
        res2 = rag_service.ask(
            question=q2,
            channel="zalo_bot",
            language="vi",
            conversation_history=history
        )
        
        # Total should be around 1.750.000 (excluding gate entry) or 1.775.000 (including gate entry)
        # Verify that it uses the promotional rate (650k/450k -> 1.750.000 / 1.775.000)
        assert "1.775.000" in res2.answer or "1.750.000" in res2.answer or "1.300.000" in res2.answer


    finally:
        # Cleanup
        db_client.table("announcements").delete().eq("id", announcement_id).execute()
        
        # Clear cache again to leave system clean
        rag_service._cached_announcements = None
        rag_service._cached_announcements_at = 0.0
        
        questions_to_delete = [q for q in [q1, q2] if q is not None]
        if questions_to_delete:
            db_client.table("chat_logs").delete().in_("question", questions_to_delete).execute()


