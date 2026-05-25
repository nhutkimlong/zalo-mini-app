from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from uuid import UUID
from supabase import Client, create_client
from app.core.config import settings
from app.models.places import PlaceResponse, PlaceCreate, PlaceUpdate

router = APIRouter(prefix="/api/places", tags=["Places"])

def get_db():
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return None
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# High-fidelity offline local mock database
OFFLINE_PLACES = [
    {
        "id": "e1c3d359-fe2c-42da-9d19-d94dfcedb011",
        "name": "Chùa Bà (Linh Sơn Tiên Thạch Tự)",
        "slug": "chua-ba-linh-son-tien-thach-tu",
        "name_en": "Ba Temple (Linh Son Tien Thach Tu)",
        "short_description": "Ngôi chùa cổ hơn 300 năm tuổi, trung tâm hành hương linh thiêng nhất tại Núi Bà Đen.",
        "short_description_en": "An ancient temple over 300 years old, the most sacred pilgrimage center of Ba Den Mountain.",
        "full_description": "Linh Sơn Tiên Thạch Tự (thường gọi là Chùa Bà) nằm ở độ cao 350m giữa sườn núi Bà Đen. Ngôi chùa được khởi dựng từ thế kỷ 18, gắn liền với huyền thoại sắc phong Linh Sơn Thánh Mẫu (Bà Đen). Kiến trúc Chùa Bà pha trộn giữa nghệ thuật chùa cổ Nam Bộ và các đường nét hiện đại sau nhiều lần trùng tu. Hàng quan khách đổ về đây hàng năm vào dịp Tết và Lễ hội Vía Bà để cầu bình an, tài lộc.",
        "full_description_en": "Linh Son Tien Thach Tu (commonly known as Ba Temple) is located at an altitude of 350m on the slopes of Ba Den Mountain. The temple was built in the 18th century, associated with the legend of Linh Son Thanh Mau (Black Virgin). Its architecture merges traditional Southern Vietnamese art with modern features. Millions of tourists visit every year to pray for peace and prosperity.",
        "image_url": "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=800",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "audio_url_en": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "audio_enabled": True,
        "latitude": 11.378345,
        "longitude": 106.168924,
        "category": "tam_linh",
        "status": "published",
        "created_at": "2026-05-21T00:00:00Z",
        "updated_at": "2026-05-21T00:00:00Z"
    },
    {
        "id": "e1c3d359-fe2c-42da-9d19-d94dfcedb012",
        "name": "Điện Bà (Đền thờ Linh Sơn Thánh Mẫu)",
        "slug": "dien-ba-den-tho-linh-son-thanh-mau",
        "name_en": "Ba Shrine (Linh Son Thanh Mau Shrine)",
        "short_description": "Nơi thờ chính Linh Sơn Thánh Mẫu Bà Đen - biểu tượng tâm linh tối cao của tỉnh Tây Ninh.",
        "short_description_en": "The primary shrine dedicated to Linh Son Thanh Mau (Black Virgin) - the supreme spiritual symbol of Tay Ninh.",
        "full_description": "Điện Bà nằm ngay sát bên cạnh Chùa Bà, được xây dựng ẩn sâu vào lòng một hang đá tự nhiên. Đây là nơi thờ Linh Sơn Thánh Mẫu, vị thần bảo hộ vùng đất Tây Ninh. Không gian Điện Bà luôn nghi ngút khói hương và tràn đầy không khí trang nghiêm.",
        "full_description_en": "Ba Shrine is nestled adjacent to Ba Temple, built deep inside a natural cave. It serves as the primary sanctuary for Linh Son Thanh Mau, the patron deity of Tay Ninh. The shrine is always filled with incense smoke and a solemn atmosphere, carrying legends of her protection and benevolence.",
        "image_url": "https://images.unsplash.com/photo-1604999333679-b86d54738315?w=800",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "audio_url_en": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "audio_enabled": True,
        "latitude": 11.378512,
        "longitude": 106.169101,
        "category": "tam_linh",
        "status": "published",
        "created_at": "2026-05-21T00:00:00Z",
        "updated_at": "2026-05-21T00:00:00Z"
    },
    {
        "id": "e1c3d359-fe2c-42da-9d19-d94dfcedb013",
        "name": "Tượng Phật Bà Tây Bổ Đà Sơn",
        "slug": "tuong-phat-ba-tay-bo-da-son",
        "name_en": "Tay Bo Da Son Bodhisattva Statue",
        "short_description": "Tượng Phật Bà bằng đồng cao nhất châu Á nằm trên đỉnh núi Bà Đen huyền thoại.",
        "short_description_en": "The tallest bronze Bodhisattva statue in Asia, reigning atop the legendary Ba Den Peak.",
        "full_description": "Tượng Phật Bà Tây Bổ Đà Sơn tọa lạc ngự trị trên đỉnh núi Bà Đen ở độ cao 986m. Đại tượng Phật có tổng chiều cao 72m, được đúc từ hơn 170 tấn đồng đỏ tinh xảo.",
        "full_description_en": "Standing tall at 986m on the peak, Tay Bo Da Son Bodhisattva Statue has a height of 72m, cast from 170 tons of high-grade copper. The statue represents Avalokitesvara Bodhisattva standing on a lotus throne. Below the statue is a modern Buddhist museum featuring state-of-the-art 3D mapping technology.",
        "image_url": "https://images.unsplash.com/photo-1542044896530-05d85be9b11a?w=800",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        "audio_url_en": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        "audio_enabled": True,
        "latitude": 11.385423,
        "longitude": 106.172431,
        "category": "tam_linh",
        "status": "published",
        "created_at": "2026-05-21T00:00:00Z",
        "updated_at": "2026-05-21T00:00:00Z"
    },
    {
        "id": "e1c3d359-fe2c-42da-9d19-d94dfcedb014",
        "name": "Đỉnh Núi Bà Đen (Độ cao 986m)",
        "slug": "dinh-nui-ba-den-do-cao-986m",
        "name_en": "Ba Den Mountain Peak (986m)",
        "short_description": "Nóc nhà Nam Bộ với mây phủ quanh năm và khuôn viên cảnh quan hoa rực rỡ.",
        "short_description_en": "The Roof of Southern Vietnam, covered in clouds year-round with a magnificent flower garden.",
        "full_description": "Đỉnh Núi Bà Đen với độ cao 986m là đỉnh núi cao nhất khu vực Nam Bộ. Nơi đây có khí hậu mát mẻ ôn hòa quanh năm, thường xuyên có mây mù bao phủ tạo nên cảnh tượng bồng lai tiên cảnh.",
        "full_description_en": "At 986m, Ba Den Mountain Peak is the highest peak in Southern Vietnam. It offers a cool, pleasant climate with mist frequently rolling in. The peak is decorated with vast gardens of hundreds of blooming flowers, the bronze 986m peak marker, and a spacious square overlooking the peaceful Dau Tieng lake.",
        "image_url": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        "audio_url_en": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        "audio_enabled": True,
        "latitude": 11.385555,
        "longitude": 106.172555,
        "category": "phong_canh",
        "status": "published",
        "created_at": "2026-05-21T00:00:00Z",
        "updated_at": "2026-05-21T00:00:00Z"
    },
    {
        "id": "e1c3d359-fe2c-42da-9d19-d94dfcedb015",
        "name": "Hệ thống Cáp treo Sun World BaDen Mountain",
        "slug": "he-thong-cap-treo-sun-world-baden-mountain",
        "name_en": "Sun World BaDen Mountain Cable Car System",
        "short_description": "Phương tiện di chuyển hiện đại đưa du khách lên Chùa Bà và Đỉnh Núi nhanh chóng.",
        "short_description_en": "Modern cable car system taking tourists to Ba Temple and the Peak swiftly.",
        "full_description": "Hệ thống cáp treo gồm Tuyến cáp Chùa Hang và Tuyến cáp Vân Sơn, được tổ chức Guinness công nhận nhà ga lớn nhất thế giới.",
        "full_description_en": "This system comprises two primary routes: Chua Hang (to Ba Temple in 5 mins) and Van Son (directly to the peak in 8 mins). The Van Son Station is certified by Guinness World Records as the largest cable car station in the world, with unique art-filled architecture.",
        "image_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        "audio_url_en": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        "audio_enabled": True,
        "latitude": 11.371234,
        "longitude": 106.162345,
        "category": "dich_vu",
        "status": "published",
        "created_at": "2026-05-21T00:00:00Z",
        "updated_at": "2026-05-21T00:00:00Z"
    }
]

@router.get("/", response_model=List[PlaceResponse])
def get_places(category: Optional[str] = None, db: Optional[Client] = Depends(get_db)):
    if not db:
        # Offline mode sorted by display_order, then created_at
        res = sorted(OFFLINE_PLACES, key=lambda x: (x.get("display_order", 0), x.get("created_at", "")))
        if category:
            res = [p for p in res if p["category"] == category]
        return res

    try:
        query = db.table("tourist_places").select("*").eq("status", "published")
        if category:
            query = query.eq("category", category)
        response = query.order("display_order", ascending=True).order("created_at").execute()
        return response.data
    except Exception as e:
        print(f"Places database error: {e}")
        # Graceful fallback to offline seeds on errors
        res = sorted(OFFLINE_PLACES, key=lambda x: (x.get("display_order", 0), x.get("created_at", "")))
        if category:
            res = [p for p in res if p["category"] == category]
        return res

@router.get("/{slug}", response_model=PlaceResponse)
def get_place_by_slug(slug: str, db: Optional[Client] = Depends(get_db)):
    if not db:
        # Offline mode
        for p in OFFLINE_PLACES:
            if p["slug"] == slug:
                return p
        raise HTTPException(status_code=404, detail="Không tìm thấy địa điểm tham quan")

    try:
        response = db.table("tourist_places").select("*").eq("slug", slug).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Không tìm thấy địa điểm tham quan")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Places slug query error: {e}")
        # Try local match before failing
        for p in OFFLINE_PLACES:
            if p["slug"] == slug:
                return p
        raise HTTPException(status_code=500, detail="Lỗi truy vấn cơ sở dữ liệu")

OPTIONAL_PLACE_FIELDS = {"audio_enabled", "audio_url_en", "name_en", "short_description_en", "full_description_en"}


def _execute_with_optional_fields(call_factory, payload: dict):
    """Run a Supabase write, dropping unknown columns one at a time and retrying."""
    data = dict(payload)
    while True:
        try:
            response = call_factory(data).execute()
            return response, data
        except Exception as exc:
            message = str(exc)
            missing = None
            for field in list(data.keys()):
                if field in OPTIONAL_PLACE_FIELDS and f"'{field}'" in message:
                    missing = field
                    break
            if not missing:
                raise
            print(f"[places] dropping unsupported column '{missing}'. Migration needed.")
            data.pop(missing, None)
            if not data:
                raise


@router.post("/", response_model=PlaceResponse)
def create_place(place: PlaceCreate, db: Optional[Client] = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=503, detail="Database connection offline.")
    try:
        response, _ = _execute_with_optional_fields(
            lambda payload: db.table("tourist_places").insert(payload),
            place.dict(),
        )
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Không thể tạo địa điểm")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{place_id}", response_model=PlaceResponse)
def update_place(place_id: UUID, place: PlaceUpdate, db: Optional[Client] = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=503, detail="Database connection offline.")
    try:
        response, _ = _execute_with_optional_fields(
            lambda payload: db.table("tourist_places").update(payload).eq("id", str(place_id)),
            place.dict(exclude_unset=True),
        )
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Không tìm thấy địa điểm để cập nhật")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{place_id}")
def delete_place(place_id: UUID, db: Optional[Client] = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=503, detail="Database connection offline.")
    try:
        response = db.table("tourist_places").delete().eq("id", str(place_id)).execute()
        return {"status": "success", "message": "Đã xóa địa điểm thành công"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
