# CrawBot RAG Backend — AI Agent & Developer Guidelines

Dự án Backend cho AI Chatbot Hướng dẫn viên du lịch 4.0 Khu du lịch Quốc gia Núi Bà Đen.

---

## 🤖 HƯỚNG DẪN QUAN TRỌNG CHO AI AGENT & DEVELOPER

### 1. Nguồn tri thức gốc (Source of Truth)
- **Thư mục bài viết gốc**: `D:\AICoworker\06-chuyen-doi-so\chatbot-knowledge` (các file `.md`).
- **Cấu trúc lưu trữ kép (Dual Storage Protocol)**:
  - **Dành cho Frontend Mini App**: Cột `content` trong bảng `knowledge_articles` của Supabase phải lưu trữ định dạng **JSON** để phục vụ hiển thị UI đa ngôn ngữ (Tiếng Việt, Anh, Khmer) trên giao diện `VisitInfoPage.tsx`. **TUYỆT ĐỐI KHÔNG** chuyển cột `content` trong Supabase sang văn bản thuần.
  - **Dành cho Chatbot RAG Vector Search**: Bộ ngắt đoạn `embedding_service.py` sẽ **tự động bóc tách và chuyển đổi (Flatten)** khối JSON thành **văn bản Markdown tự nhiên** trước khi lưu vào bảng `knowledge_chunks` (Vector DB).

---

## 🔄 QUY TRÌNH CẬP NHẬT DỮ LIỆU TRI THỨC MỚI (SYNC & RE-INDEX)

Khi thêm bài viết mới hoặc sửa đổi nội dung giá vé/lịch hoạt động/thông tin di tích:

### Bước 1: Sửa/Thêm file trong thư mục tri thức
Sửa hoặc thêm file `.md` trong `D:\AICoworker\06-chuyen-doi-so\chatbot-knowledge`.

### Bước 2: Đồng bộ lên Supabase Database
Chạy script đồng bộ dữ liệu vào bảng `knowledge_articles`:
```bash
d:\CODE\zalo-mini-app\backend\venv\Scripts\python.exe sync_local_to_supabase.py
```

### Bước 3: Đánh lại chỉ mục Vector Embedding (Re-index)
Chạy script tự động giải mã JSON -> Markdown -> tạo Vector Embedding đưa vào `knowledge_chunks`:
```bash
d:\CODE\zalo-mini-app\backend\venv\Scripts\python.exe reindex.py
```

### Bước 4: Kiểm tra kết quả phản hồi của Chatbot
Chạy câu lệnh test truy vấn RAG trực tiếp:
```bash
d:\CODE\zalo-mini-app\backend\venv\Scripts\python.exe -c "from app.services.rag_service import rag_service; res = rag_service.ask('Combo buffet & vé cáp treo?'); print(res.answer)"
```

---

## 📁 CẤU TRÚC DỰ ÁN & SCRIPT TIỆN ÍCH

```plaintext
backend/
├── app/
│   ├── core/           # Cấu hình môi trường (config.py)
│   ├── models/         # Schema dữ liệu Chat, Knowledge
│   ├── routers/        # API Endpoints (/api/chat, /api/knowledge)
│   └── services/       
│       ├── embedding_service.py  # Xử lý Embedding & Tự động định dạng JSON -> Text cho RAG
│       ├── rag_service.py        # RAG Engine chính (LLM Beeknoee)
│       └── moderation_service.py # Kiểm duyệt câu hỏi an toàn
├── sync_local_to_supabase.py     # Script đồng bộ từ Markdown local sang Supabase
├── reindex.py                    # Script đánh lại Vector Embedding RAG
├── sync_to_supabase.py           # Script đồng bộ từng bài viết lẻ
├── generate_new_articles.py      # Tool hỗ trợ sinh bài viết mới
└── rewrite_content.py            # Tool chuẩn hóa nội dung bài viết
```

---

## ⚠️ QUY TẮC AN TOÀN KHI CODE (AI RULES)
1. Không sửa đổi phương thức parse JSON của `index_article` trong `embedding_service.py` nếu không hiểu rõ cấu trúc JSON của Frontend (`tickets`, `schedules`).
2. Mọi script chạy Python trong dự án này nên dùng virtual environment: `backend/venv/Scripts/python.exe`.
