-- Active: Supabase PostgreSQL
-- Mini App Zalo Trợ lý du lịch số Khu du lịch quốc gia Núi Bà Đen
-- Database Schema Definition

-- Enable the pgvector extension to allow vector similarity search
create extension if not exists vector;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table 1: App Users (Visitors & Officials)
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  zalo_user_id text unique,
  name text,
  phone text,
  avatar_url text,
  role text default 'visitor', -- 'visitor', 'editor', 'admin'
  created_at timestamptz default now()
);

-- Table 2: Knowledge Articles (Source material for RAG)
create table if not exists knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null, -- 've_va_gio_mo_cua', 'di_chuyen', 'noi_quy', 'lich_su', 'khac'
  visibility text default 'public', -- 'public', 'private'
  source text,
  status text default 'draft', -- 'draft', 'published', 'archived'
  updated_by uuid references app_users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table 3: Knowledge Chunks (Segmented chunks with embeddings for RAG)
create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references knowledge_articles(id) on delete cascade,
  chunk_text text not null,
  embedding vector(3072), -- 3072 dimensions for Gemini embeddings
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Table 4: Tourist Places & Monuments
create table if not exists tourist_places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  short_description text,
  full_description text,
  image_url text,
  audio_url text,
  audio_url_en text,
  audio_enabled boolean not null default false,
  latitude numeric(9,6),
  longitude numeric(9,6),
  category text, -- 'tam_linh', 'phong_canh', 'dich_vu'
  status text default 'published', -- 'draft', 'published', 'archived'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table 5: Announcements & Alerts
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  type text default 'general', -- 'general', 'emergency', 'weather', 'festival'
  status text default 'published', -- 'draft', 'published', 'archived'
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Table 6: Feedback & Complaints from Tourists
create table if not exists feedback_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_name text,
  phone text,
  report_type text not null, -- 've_sinh', 'gia_ca', 'an_ninh', 'thai_do', 'ha_tang', 'cheo_keo', 'gop_y', 'khac'
  content text not null,
  image_url text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  status text default 'new', -- 'new', 'in_progress', 'resolved', 'spam'
  assigned_unit text, -- BQL, Doi Trat Tu, Cong Ty Cap Treo, etc.
  internal_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table 7: Chat Conversation Logs (for chatbot audit)
create table if not exists chat_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete set null,
  channel text default 'mini_app', -- 'mini_app', 'zalo_oa'
  question text not null,
  answer text,
  source_article_ids jsonb default '[]'::jsonb, -- Array of UUIDs referenced
  confidence_score numeric(4,3), -- 0.000 to 1.000
  model text,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  estimated_cost_usd numeric(12,8) not null default 0,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS) optionally - in mock/seed we assume basic tables accessible
-- Create indexes for performance
create index if not exists idx_knowledge_chunks_article_id on knowledge_chunks(article_id);
create index if not exists idx_feedback_reports_status on feedback_reports(status);
create index if not exists idx_announcements_status on announcements(status);
create index if not exists idx_tourist_places_slug on tourist_places(slug);

alter table tourist_places add column if not exists audio_url_en text;
alter table tourist_places add column if not exists audio_enabled boolean not null default false;

alter table chat_logs add column if not exists model text;
alter table chat_logs add column if not exists prompt_tokens integer not null default 0;
alter table chat_logs add column if not exists completion_tokens integer not null default 0;
alter table chat_logs add column if not exists total_tokens integer not null default 0;
alter table chat_logs add column if not exists estimated_cost_usd numeric(12,8) not null default 0;

-- Create a vector similarity match function
-- This allows performing cosine similarity calculations directly from our FastAPI backend via RPC
create or replace function match_chunks (
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  filter_visibility text default 'public'
)
returns table (
  id uuid,
  article_id uuid,
  chunk_text text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    kc.id,
    kc.article_id,
    kc.chunk_text,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) as similarity
  from knowledge_chunks kc
  join knowledge_articles ka on kc.article_id = ka.id
  where ka.visibility = filter_visibility and ka.status = 'published'
    and 1 - (kc.embedding <=> query_embedding) > match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Trigger function to update updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_knowledge_articles_updated_at
before update on knowledge_articles
for each row execute function update_updated_at_column();

create trigger update_tourist_places_updated_at
before update on tourist_places
for each row execute function update_updated_at_column();

create trigger update_feedback_reports_updated_at
before update on feedback_reports
for each row execute function update_updated_at_column();
