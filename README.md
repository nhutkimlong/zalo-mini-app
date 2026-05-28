# Website PWA Du Lich Nui Ba Den

He thong gom 3 phan:

- `mini-app/`: Website PWA cho du khach, React + Vite + zmp-ui.
- `backend/`: FastAPI API, RAG chatbot, TTS, upload, admin API, Beeknoee/OpenAI-compatible client.
- `admin-dashboard/`: React Admin Dashboard de quan ly noi dung, phan anh, dia danh, chat logs, va chi phi model.

Du an dang chay local khong dung Docker. File `docker-compose.yml`/`backend/Dockerfile` neu con trong repo chi la legacy, khong phai workflow chinh.

## Quick Start Local

Chay tren Windows:

```bat
run-dev.bat
```

Menu trong script:

- `1`: chay ca 3 service.
- `2`: chay backend.
- `3`: chay Mini App + Admin.
- `4`: cai/update dependencies.
- `5`: build all.
- `6`: thoat.

Ports mac dinh:

- Backend: `http://localhost:8000`
- Backend docs: `http://localhost:8000/docs`
- Mini App dev: `http://localhost:3000`
- Admin dev: `http://localhost:3001`

## Env Files

Moi phan co env rieng. Khong dung chung `.env` root.

### Backend

File thuc te: `backend/.env`

Mau: `backend/.env.example`

Backend config nam tai `backend/app/core/config.py` va luon doc file `backend/.env` bang duong dan tuyet doi, khong phu thuoc current working directory.

Bien quan trong:

```env
HOST=127.0.0.1
PORT=8000
DEBUG=True
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-or-anon-key
BEEKNOEE_BASE_URL=https://platform-api.beeknoee.com/v1
BEEKNOEE_API_KEY=your-beeknoee-api-key
BEEKNOEE_LLM_MODEL=gemini-2.5-flash
BEEKNOEE_EMBED_MODEL=gemini-embedding-2
BEEKNOEE_TTS_MODEL=google/google-tts
BEEKNOEE_INPUT_COST_PER_1M=0.30
BEEKNOEE_OUTPUT_COST_PER_1M=2.50
EMBEDDING_DIM=3072
```

Luu y: `.env` dung format `KEY=value`, khong dung `KEY: type = value`.

### Mini App

File local: `mini-app/.env`

Mau local: `mini-app/.env.example`

Mau production: `mini-app/.env.production.example`

Mini App doc cac bien public Vite:

```env
VITE_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

`VITE_SUPABASE_ANON_KEY` la public key se bi bundle vao JS client. Khong bao gio dua Supabase `service_role` vao Mini App.

### Admin Dashboard

File local: `admin-dashboard/.env`

Mau: `admin-dashboard/.env.example`

```env
VITE_BASE_URL=http://localhost:8000
```

## Supabase

Schema chinh: `database/schema.sql`

Seed sample: `database/seed.sql`

Bang quan trong:

- `knowledge_articles`: noi dung RAG va Visit Info.
- `knowledge_chunks`: vector chunks.
- `tourist_places`: dia danh, audio VI/EN.
- `announcements`: thong bao.
- `feedback_reports`: phan anh du khach.
- `chat_logs`: log chatbot, tokens, estimated cost.

Neu database da ton tai, van chay lai cac dong `alter table ... add column if not exists` trong `schema.sql` de cap nhat cot moi.

`chat_logs` hien co cac cot chi phi Beeknoee:

- `model`
- `prompt_tokens`
- `completion_tokens`
- `total_tokens`
- `estimated_cost_usd`

## Backend

Chay rieng:

```bat
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Routers chinh:

- `/api/chat/`: RAG chatbot. Payload co field `language` (`vi` hoac `en`).
- `/api/admin/knowledge`: CRUD knowledge articles.
- `/api/admin/chat-logs`: Admin chat audit.
- `/api/admin/usage-summary`: tong hop tokens/chi phi Beeknoee.
- `/api/admin/translate`: dich noi dung Admin.
- `/api/admin/tts`: tao audio.
- `/api/feedback`, `/api/places`, `/api/announcements`.

Beeknoee duoc goi qua OpenAI-compatible client. Cost la uoc tinh local bang:

```py
prompt_tokens / 1_000_000 * BEEKNOEE_INPUT_COST_PER_1M
completion_tokens / 1_000_000 * BEEKNOEE_OUTPUT_COST_PER_1M
```

## Mini App

Chay local:

```bat
cd mini-app
npm install
npm run dev
```

Build:

```bat
npm run build
```

Deploy len web/PWA:

```bat
cd mini-app
copy .env.production.example .env.production
```

Sua `mini-app/.env.production`:

```env
VITE_BASE_URL=https://your-public-backend-domain
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Mini App PWA

Không dùng `localhost`. `VITE_BASE_URL` trong `.env.production` phải là public HTTPS backend.

Khi chạy lệnh build (`npm run build`), hệ thống sẽ tự động đóng gói ứng dụng web PWA vào thư mục `dist/` cùng với Service Worker (`sw.js`) và Web Manifest (`manifest.json`), sẵn sàng để đưa lên hosting.

## Admin Dashboard

Chay local:

```bat
cd admin-dashboard
npm install
npm run dev
```

Build:

```bat
npm run build
```

Admin co cac man hinh chinh:

- Knowledge articles / RAG.
- Huong dan tham quan.
- Dia danh va audio VI/EN.
- Announcements.
- Feedback reports.
- Chat audit.
- Beeknoee usage/cost tab.

## Visit Info Visual Builder

Muc `ve_va_gio_mo_cua` trong `knowledge_articles` duoc Admin luu bang JSON structured:

```json
{
  "tickets": [
    {
      "title": "Tuyen cap Van Son",
      "titleEn": "Van Son Cable Route",
      "items": [
        {
          "name": "Nguoi lon",
          "nameEn": "Adult",
          "price": "400.000 VND",
          "priceEn": "400,000 VND",
          "priceOneway": "",
          "priceOnewayEn": ""
        }
      ]
    }
  ],
  "schedules": [
    {
      "title": "Tuyen dinh Van Son",
      "titleEn": "Van Son Peak Route",
      "items": [
        {
          "label": "Thu 2 - Thu 6",
          "labelEn": "Monday - Friday",
          "hours": "07:00 - 18:00",
          "hoursEn": "07:00 - 18:00",
          "note": "",
          "noteEn": ""
        }
      ]
    }
  ]
}
```

Mini App `VisitInfoPage.tsx` render gia ve va lich hoat dong tu JSON nay. Khong hard-code lich hoat dong o frontend. Neu DB chua co `schedules`, Mini App hien thong bao dang cap nhat.

## Language Behavior

Ngon ngu Mini App duoc luu trong localStorage key:

```text
zalo_mini_app_lang
```

Chatbot request gui `language` len backend. Backend chon prompt:

- `SYSTEM_PROMPT_VI`
- `SYSTEM_PROMPT_EN`

Khi `language = "en"`, chatbot phai tra loi tieng Anh ke ca khi user hoi tieng Viet hoac source document la tieng Viet.

Deep link tu Place Detail sang Chat luu:

- `preloaded_question`
- `preloaded_question_language`

Audio guide dung:

- `audio_url` cho VI
- `audio_url_en` cho EN
- `audio_enabled` de bat/tat hien thi audio.

## Deployment

### Backend Render

File `render.yaml` da chuyen sang Python native, khong Docker:

```yaml
env: python
rootDir: backend
buildCommand: pip install -r requirements.txt
startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Can set env tren Render theo `backend/.env.example`.

### Mini App PWA

Khong dung `localhost`. `VITE_BASE_URL` trong `.env.production` phai la public HTTPS backend.

```bat
cd mini-app
npm run build
```

### Admin Deploy

Admin la Vite static app. Khi deploy len hosting bat ky, set:

```env
VITE_BASE_URL=https://your-public-backend-domain
```

Neu host chung domain backend thi can cau hinh CORS/route tuong ung.

## Commands For AI Agents

Dung cac lenh nay de verify:

```bat
cd backend
venv\Scripts\python.exe -m py_compile app\core\config.py app\main.py
```

```bat
cd mini-app
npm run build
```

```bat
cd admin-dashboard
npm run build
```

Neu sua Supabase schema, xem `database/schema.sql`. Neu sua deploy backend, xem `render.yaml`. Neu sua build, xem `mini-app/.env.production.example` va `mini-app/package.json`.

## AI Handoff Notes

- User prefers Vietnamese communication.
- Project path: `D:\CODE\zalo-mini-app`.
- There is no active Git repository in this workspace.
- Do not reintroduce Docker into local dev flow unless user explicitly asks.
- Do not hard-code Supabase URL/key in Mini App source; use Vite env.
- Never put Supabase service role key in Mini App/Admin frontend env.
- `backend/app/core/config.py` must keep reading `backend/.env` by absolute path.
- Mini App PWA uses `.env.production` at build time.
- Beeknoee usage cost is estimated from completion usage and stored in `chat_logs`.
- Admin usage tab reads `/api/admin/usage-summary`.
- Visit Info ticket/schedule data should be edited from Admin Visual Builder, not hard-coded in Mini App.
- For frontend UI changes, run both Mini App and Admin builds if shared data/API changed.
