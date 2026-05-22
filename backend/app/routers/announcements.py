from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from supabase import Client, create_client
from app.core.config import settings
from app.models.announcements import AnnouncementResponse, AnnouncementCreate, AnnouncementUpdate

router = APIRouter(prefix="/api/announcements", tags=["Announcements"])

def get_db():
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return None
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Robust offline announcement list
OFFLINE_ANNOUNCEMENTS = [
    {
        "id": "b1c3d359-fe2c-42da-9d19-d94dfcedb041",
        "title": "Thông báo bảo trì định kỳ tuyến cáp treo Vân Sơn ngày 25/05/2026",
        "title_en": "Scheduled maintenance announcement for Van Son cable car line on May 25, 2026",
        "content": "Ban quản lý Sun World BaDen Mountain trân trọng thông báo đến Quý du khách: Tuyến cáp treo Vân Sơn (đưa khách lên đỉnh núi) sẽ tạm ngưng hoạt động trong ngày thứ Hai 25/05/2026 để tiến hành công tác bảo trì kỹ thuật định kỳ. Tuyến cáp treo Chùa Hang vẫn hoạt động bình thường.",
        "content_en": "The Management Board of Sun World BaDen Mountain respectfully informs visitors: The Van Son cable car line (transporting visitors to the mountain peak) will temporarily suspend operations on Monday, May 25, 2026, for routine technical maintenance. The Chua Hang cable car line will continue to operate normally.",
        "type": "emergency",
        "status": "published",
        "published_at": "2026-05-20T08:00:00Z",
        "created_at": "2026-05-20T08:00:00Z"
    },
    {
        "id": "b1c3d359-fe2c-42da-9d19-d94dfcedb042",
        "title": "Khai mạc Lễ hội Vía Bà Linh Sơn Thánh Mẫu năm 2026",
        "title_en": "Opening ceremony of Linh Son Thanh Mau Temple Festival 2026",
        "content": "Lễ hội Vía Bà Linh Sơn Thánh Mẫu - Di sản văn hóa phi vật thể quốc gia sẽ chính thức khai mạc từ ngày mùng 4 đến mùng 6 tháng 5 Âm lịch tại Khu di tích Núi Bà Đen. Kính mời du khách gần xa về tham dự chiêm bái.",
        "content_en": "The Linh Son Thanh Mau Temple Festival - a National Intangible Cultural Heritage - will officially open from the 4th to the 6th of the fifth lunar month at Ba Den Mountain Historical Site. We warmly invite tourists and pilgrims to attend and worship.",
        "type": "festival",
        "status": "published",
        "published_at": "2026-05-21T07:00:00Z",
        "created_at": "2026-05-21T07:00:00Z"
    },
    {
        "id": "b1c3d359-fe2c-42da-9d19-d94dfcedb043",
        "title": "Khuyến cáo an toàn phòng tránh giông sét ban chiều trên đỉnh núi",
        "title_en": "Safety advisory regarding afternoon thunderstorms and lightning on the summit",
        "content": "Theo dự báo, khu vực Núi Bà Đen xuất hiện mưa rào và giông kèm sấm sét vào các buổi chiều muộn. Ban Quản lý khuyến cáo du khách di chuyển vào nhà ga cáp treo khi trời nổi giông.",
        "content_en": "According to the weather forecast, the Ba Den Mountain area experiences showers and thunderstorms with lightning in the late afternoons. The Management Board advises visitors to move inside the cable car stations when storms approach.",
        "type": "weather",
        "status": "published",
        "published_at": "2026-05-21T15:00:00Z",
        "created_at": "2026-05-21T15:00:00Z"
    }
]

@router.get("/", response_model=List[AnnouncementResponse])
def get_announcements(type: Optional[str] = None, db: Optional[Client] = Depends(get_db)):
    if not db:
        res = OFFLINE_ANNOUNCEMENTS
        if type:
            res = [a for a in res if a["type"] == type]
        return res

    try:
        query = db.table("announcements").select("*").eq("status", "published")
        if type:
            query = query.eq("type", type)
        response = query.order("published_at", desc=True).execute()
        return response.data
    except Exception as e:
        print(f"Announcements DB error: {e}")
        res = OFFLINE_ANNOUNCEMENTS
        if type:
            res = [a for a in res if a["type"] == type]
        return res

@router.get("/{announcement_id}", response_model=AnnouncementResponse)
def get_announcement_by_id(announcement_id: UUID, db: Optional[Client] = Depends(get_db)):
    if not db:
        for a in OFFLINE_ANNOUNCEMENTS:
            if a["id"] == str(announcement_id):
                return a
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo")

    try:
        response = db.table("announcements").select("*").eq("id", str(announcement_id)).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo")
    except Exception as e:
        print(f"Announcement ID query failed: {e}")
        for a in OFFLINE_ANNOUNCEMENTS:
            if a["id"] == str(announcement_id):
                return a
        raise HTTPException(status_code=500, detail="Lỗi truy vấn cơ sở dữ liệu")

@router.post("/", response_model=AnnouncementResponse)
def create_announcement(announcement: AnnouncementCreate, db: Optional[Client] = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=503, detail="Database connection offline.")
    try:
        payload = announcement.dict()
        payload["published_at"] = datetime.utcnow().isoformat()
        response = db.table("announcements").insert(payload).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Không thể đăng thông báo")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{announcement_id}", response_model=AnnouncementResponse)
def update_announcement(announcement_id: UUID, announcement: AnnouncementUpdate, db: Optional[Client] = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=503, detail="Database connection offline.")
    try:
        response = db.table("announcements").update(announcement.dict(exclude_unset=True)).eq("id", str(announcement_id)).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo để cập nhật")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{announcement_id}")
def delete_announcement(announcement_id: UUID, db: Optional[Client] = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=503, detail="Database connection offline.")
    try:
        db.table("announcements").delete().eq("id", str(announcement_id)).execute()
        return {"status": "success", "message": "Đã xóa thông báo thành công"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
