"""
Smart Incremental Sync & Reindex Script for CrawBot RAG
Reads local markdown files from D:\\AICoworker\\06-chuyen-doi-so\\chatbot-knowledge,
calculates MD5 content hashes, and ONLY updates/reindexes files that have actually changed.
Reduces Supabase load & Beeknoee API usage by 95% - 100%!
"""
import os
import re
import hashlib
import json
import sys
from dotenv import load_dotenv
from supabase import create_client

sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.services.embedding_service import embedding_service

load_dotenv('.env')
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')

if not url or not key:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env")
    sys.exit(1)

supabase = create_client(url, key)

local_dir = r'D:\AICoworker\06-chuyen-doi-so\chatbot-knowledge'
cache_file = os.path.join(os.path.dirname(__file__), 'local_sync_cache.json')

# Load existing local cache
local_cache = {}
if os.path.exists(cache_file):
    try:
        with open(cache_file, 'r', encoding='utf-8') as f:
            local_cache = json.load(f)
    except Exception:
        local_cache = {}

if not os.path.exists(local_dir):
    print(f"Error: Local knowledge directory '{local_dir}' not found.")
    sys.exit(1)

local_docs = {}

for root, _, files in os.walk(local_dir):
    for filename in files:
        if filename.endswith('.md') and filename != 'index.md':
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            match_id = re.search(r'id:\s*"([^"]+)"', content)
            match_title = re.search(r'title:\s*"([^"]+)"', content)
            match_category = re.search(r'category:\s*"([^"]+)"', content)

            if match_id and match_title:
                doc_id = match_id.group(1)
                title = match_title.group(1)
                category = match_category.group(1) if match_category else 'di_tich'

                parts = content.split('---', 2)
                clean_content = parts[2].strip() if len(parts) >= 3 else content.strip()
                
                # Calculate MD5 hash of clean content + title
                content_hash = hashlib.md5(f"{title}:{category}:{clean_content}".encode('utf-8')).hexdigest()

                local_docs[doc_id] = {
                    'filepath': filepath,
                    'filename': filename,
                    'title': title,
                    'category': category,
                    'content': clean_content,
                    'hash': content_hash
                }

print(f"[SmartSync] Found {len(local_docs)} official articles in local directory.")

# 1. Fetch current articles from Supabase
response = supabase.table('knowledge_articles').select('id, title').execute()
supabase_docs = {item['id']: item for item in response.data}

# 2. Identify removed files
deleted_count = 0
for db_id, db_item in supabase_docs.items():
    if db_id not in local_docs:
        print(f"[SmartSync] DELETING extraneous doc from Supabase: [{db_id}] {db_item.get('title')}")
        supabase.table('knowledge_chunks').delete().eq('article_id', db_id).execute()
        supabase.table('knowledge_articles').delete().eq('id', db_id).execute()
        deleted_count += 1

# 3. Incremental Sync & Reindex
updated_count = 0
skipped_count = 0
new_cache = {}

for doc_id, doc_data in local_docs.items():
    cached_hash = local_cache.get(doc_id)
    current_hash = doc_data['hash']
    new_cache[doc_id] = current_hash

    # Check if doc changed or is missing from Supabase
    if cached_hash == current_hash and doc_id in supabase_docs:
        skipped_count += 1
        print(f"[SmartSync] SKIP (Unchanged): [{doc_id}] {doc_data['title']}")
        continue

    print(f"\n[SmartSync] PROCESSING (Changed/New): [{doc_id}] {doc_data['title']}")
    
    # Upsert into knowledge_articles
    if doc_id in supabase_docs:
        supabase.table('knowledge_articles').update({
            'title': doc_data['title'],
            'content': doc_data['content'],
            'category': doc_data['category'],
            'status': 'published',
            'visibility': 'public'
        }).eq('id', doc_id).execute()
    else:
        supabase.table('knowledge_articles').insert({
            'id': doc_id,
            'title': doc_data['title'],
            'content': doc_data['content'],
            'category': doc_data['category'],
            'status': 'published',
            'visibility': 'public'
        }).execute()

    # Reindex chunks for this specific article only
    ok = embedding_service.index_article(
        article_id=doc_id,
        title=doc_data['title'],
        content=doc_data['content'],
        category=doc_data['category']
    )
    if ok:
        updated_count += 1

# Save new cache
with open(cache_file, 'w', encoding='utf-8') as f:
    json.dump(new_cache, f, indent=2)

print("\n" + "="*50)
print(f"[SmartSync] COMPLETE SUMMARY:")
print(f"  - Total local articles: {len(local_docs)}")
print(f"  - Skipped (0 API/DB load): {skipped_count}")
print(f"  - Updated & Reindexed: {updated_count}")
print(f"  - Extraneous Deleted: {deleted_count}")
print("="*50)
