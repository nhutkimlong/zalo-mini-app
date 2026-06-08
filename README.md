# Hệ thống Website PWA & Trợ lý ảo Du Lịch Núi Bà Đen

Hệ thống cung cấp trải nghiệm du lịch số và quản trị thông minh cho Khu du lịch Núi Bà Đen thông qua Website PWA (Frontend) và Admin Dashboard, tích hợp trợ lý AI (RAG Chatbot) và Audio Guide.

> **Lưu ý:** Dự án này hiện tại là một **Web App / PWA (Progressive Web App) độc lập**, hoạt động bình thường trên trình duyệt, không còn là nền tảng Zalo Mini App.

## Quick Start

Khởi chạy hệ thống trên Windows bằng script tự động:

```bat
run-dev.bat
```

Menu trong script:
- `1`: Khởi chạy toàn bộ hệ thống (Frontend, Backend, Admin).
- `2`: Chỉ chạy Backend.
- `3`: Chạy Frontend Client + Admin.

Ports mặc định:
- Backend: `http://localhost:8000` (Docs: `/docs`)
- Frontend Client (PWA): `http://localhost:3000` (hoặc 3002)
- Admin Dashboard: `http://localhost:3001`

## Features

- **Frontend Client (`mini-app/`)**: Website PWA dành cho du khách tra cứu giá vé, xem bản đồ, nghe Audio Guide và trò chuyện với trợ lý du lịch AI.
- **Backend API (`backend/`)**: Xây dựng bằng FastAPI, xử lý RAG chatbot (tích hợp Beeknoee/OpenAI-compatible client), TTS (chuyển đổi văn bản thành giọng nói), upload file và cung cấp Admin API.
- **Admin Dashboard (`admin-dashboard/`)**: Quản lý thông tin địa danh, Hướng dẫn tham quan (giá vé, giờ mở cửa), theo dõi phản ánh từ du khách, và kiểm toán (audit) lịch sử Chatbot.
- **Kiểm soát thông tin động**: Giá vé và giờ mở cửa được lưu trữ dưới dạng structured JSON từ Admin, giúp Frontend tự động render mà không cần hard-code.
- **Đa ngôn ngữ**: Hệ thống phân tích và trả lời theo ngôn ngữ của hệ thống hoặc yêu cầu của người dùng (VI/EN).

## Configuration

Các thành phần chạy hoàn toàn độc lập, không dùng chung `.env` ở thư mục root. Mỗi thư mục có file cấu hình riêng.

| Component | File cấu hình | Biến quan trọng (Ví dụ) |
|-----------|---------------|-------------------------|
| Backend | `backend/.env` | `SUPABASE_KEY`, `BEEKNOEE_API_KEY`, `BEEKNOEE_LLM_MODEL` |
| Frontend | `mini-app/.env.production` | `VITE_BASE_URL`, `VITE_SUPABASE_URL` |
| Admin | `admin-dashboard/.env` | `VITE_BASE_URL` |

> **Lưu ý bảo mật:** `VITE_SUPABASE_ANON_KEY` là public key. Không bao giờ cấu hình Supabase `service_role` key vào trong các file `.env` của Frontend và Admin.

## Documentation

- **Cơ sở dữ liệu (Supabase)**: Lược đồ cơ sở dữ liệu (`schema.sql`) và dữ liệu mẫu (`seed.sql`) nằm trong thư mục `database/`. Các bảng cốt lõi: `knowledge_articles` (RAG), `chat_logs` (Lịch sử + Cost).
- **Backend Architecture**: Backend đọc biến môi trường tại `app/core/config.py` bằng đường dẫn tuyệt đối. RAG Service tính chi phí dựa trên token thực tế (Input/Output cost).
- **Deploy Backend**: File `render.yaml` hỗ trợ Native Python deployment trên môi trường Render.
- **Deploy Frontend/PWA**: Chạy lệnh `npm run build` ở `mini-app/`. Ứng dụng PWA sẽ được đóng gói ở `dist/` cùng với Service Worker (`sw.js`).
- **AI Handoff Notes**: AI Agent cần lưu ý không cài đặt lại cấu trúc Docker, hệ thống ưu tiên chạy Native Local; Backend không hardcode đường dẫn tương đối để đọc file `.env`. 

## License

Proprietary
