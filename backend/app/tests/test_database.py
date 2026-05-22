import pytest
import uuid
from fastapi.testclient import TestClient
from supabase import Client

def test_database_connection(db_client: Client):
    """Verify that we can connect to Supabase and execute a simple query."""
    res = db_client.table("tourist_places").select("count", count="exact").limit(1).execute()
    assert res is not None
    assert hasattr(res, "count")

def test_places_crud(api_client: TestClient, db_client: Client):
    """Test full CRUD operations on tourist_places endpoint with real Supabase storage and teardown."""
    unique_id = uuid.uuid4()
    test_slug = f"test-dia-diem-{unique_id}"
    
    # Payload for new tourist place
    new_place = {
        "name": f"Địa điểm Kiểm thử {unique_id}",
        "name_en": f"Test Place {unique_id}",
        "slug": test_slug,
        "short_description": "Mô tả ngắn gọn về địa điểm kiểm thử.",
        "short_description_en": "A short description of the test place.",
        "full_description": "Mô tả đầy đủ và chi tiết về địa điểm kiểm thử tự động.",
        "full_description_en": "Detailed full description for automated testing.",
        "image_url": "https://images.unsplash.com/photo-1542044896530-05d85be9b11a?w=800",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "audio_url_en": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "latitude": 11.385423,
        "longitude": 106.172431,
        "category": "phong_canh",
        "status": "published"
    }

    created_id = None
    try:
        # 1. CREATE (POST)
        post_response = api_client.post("/api/places/", json=new_place)
        assert post_response.status_code == 200
        post_data = post_response.json()
        assert post_data["slug"] == test_slug
        assert "id" in post_data
        created_id = post_data["id"]

        # 2. READ ALL (GET)
        get_all_response = api_client.get("/api/places/")
        assert get_all_response.status_code == 200
        places_list = get_all_response.json()
        assert any(p["slug"] == test_slug for p in places_list)

        # 3. READ ONE BY SLUG (GET /{slug})
        get_one_response = api_client.get(f"/api/places/{test_slug}")
        assert get_one_response.status_code == 200
        one_data = get_one_response.json()
        assert one_data["id"] == created_id
        assert one_data["name"] == new_place["name"]

        # 4. UPDATE (PUT)
        update_payload = {
            "name": f"Địa điểm Kiểm thử {unique_id} - Đã cập nhật",
            "category": "dich_vu"
        }
        put_response = api_client.put(f"/api/places/{created_id}", json=update_payload)
        assert put_response.status_code == 200
        put_data = put_response.json()
        assert put_data["name"] == update_payload["name"]
        assert put_data["category"] == update_payload["category"]

    finally:
        # 5. DELETE (Cleanup)
        if created_id:
            delete_response = api_client.delete(f"/api/places/{created_id}")
            assert delete_response.status_code == 200
            
            # Double check delete from DB
            db_check = db_client.table("tourist_places").select("*").eq("id", str(created_id)).execute()
            assert len(db_check.data) == 0

def test_feedback_creation(api_client: TestClient, db_client: Client):
    """Test feedback report submission via API and verify Supabase record."""
    unique_content = f"Nội dung phản ánh kiểm thử tự động lúc {uuid.uuid4()}"
    feedback_payload = {
        "reporter_name": "Kiểm thử viên Tự động",
        "phone": "0987654321",
        "report_type": "ve_sinh",
        "content": unique_content,
        "image_url": "https://example.com/test-feedback.jpg",
        "latitude": 11.378345,
        "longitude": 106.168924
    }

    created_id = None
    try:
        # Submit feedback via FastAPI endpoint
        response = api_client.post("/api/feedback/", json=feedback_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["content"] == unique_content
        assert "id" in data
        created_id = data["id"]

        # Verify insertion in real Supabase DB
        db_res = db_client.table("feedback_reports").select("*").eq("id", str(created_id)).execute()
        assert len(db_res.data) == 1
        assert db_res.data[0]["content"] == unique_content
        assert db_res.data[0]["status"] == "new"

    finally:
        # Cleanup
        if created_id:
            db_client.table("feedback_reports").delete().eq("id", str(created_id)).execute()

def test_announcements_retrieval(api_client: TestClient, db_client: Client):
    """Test announcements retrieval from API and verify a seeded announcement."""
    unique_title = f"Thông báo Khẩn {uuid.uuid4()}"
    
    # Directly insert test announcement in DB
    db_ann = db_client.table("announcements").insert({
        "title": unique_title,
        "content": "Đây là nội dung thông báo khẩn cấp phục vụ chạy kiểm thử tự động.",
        "type": "emergency",
        "status": "published"
    }).execute()
    
    assert len(db_ann.data) == 1
    created_id = db_ann.data[0]["id"]

    try:
        # Fetch announcements via API
        response = api_client.get("/api/announcements/")
        assert response.status_code == 200
        announcements = response.json()
        
        # Verify the new announcement appears in results
        assert any(a["title"] == unique_title for a in announcements)
        
    finally:
        # Cleanup
        db_client.table("announcements").delete().eq("id", str(created_id)).execute()
