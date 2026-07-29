import os
import re
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env')
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
supabase = create_client(url, key)

local_dir = r'D:\AICoworker\06-chuyen-doi-so\chatbot-knowledge'
local_files = [f for f in os.listdir(local_dir) if f.endswith('.md') and f != 'index.md']

local_docs = {}

# 1. Parse all local files
for filename in local_files:
    filepath = os.path.join(local_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match_id = re.search(r'id:\s*"([^"]+)"', content)
    match_title = re.search(r'title:\s*"([^"]+)"', content)
    match_category = re.search(r'category:\s*"([^"]+)"', content)
    
    if match_id and match_title:
        doc_id = match_id.group(1)
        title = match_title.group(1)
        category = match_category.group(1) if match_category else 'di_tich'
        
        # Split frontmatter
        parts = content.split('---', 2)
        if len(parts) >= 3:
            clean_content = parts[2].strip()
        else:
            clean_content = content.strip()
            
        local_docs[doc_id] = {
            'filename': filename,
            'title': title,
            'category': category,
            'content': clean_content
        }

print(f"Found {len(local_docs)} official articles in local directory.")

# 2. Get all articles from Supabase
response = supabase.table('knowledge_articles').select('id, title').execute()
supabase_docs = {item['id']: item for item in response.data}

print(f"Found {len(supabase_docs)} articles in Supabase.")

# 3. Delete records from Supabase that are NOT in local directory
deleted_count = 0
for db_id, db_item in supabase_docs.items():
    if db_id not in local_docs:
        print(f"DELETING from Supabase (Not in local): [{db_id}] {db_item.get('title')}")
        supabase.table('knowledge_articles').delete().eq('id', db_id).execute()
        deleted_count += 1

print(f"Deleted {deleted_count} extraneous articles from Supabase.")

# 4. Update or Insert records in Supabase with local content
updated_count = 0
inserted_count = 0
for doc_id, doc_data in local_docs.items():
    if doc_id in supabase_docs:
        supabase.table('knowledge_articles').update({
            'title': doc_data['title'],
            'content': doc_data['content'],
            'category': doc_data['category'],
            'status': 'published',
            'visibility': 'public'
        }).eq('id', doc_id).execute()
        updated_count += 1
    else:
        print(f"INSERTING into Supabase (New local doc): [{doc_id}] {doc_data['title']}")
        supabase.table('knowledge_articles').insert({
            'id': doc_id,
            'title': doc_data['title'],
            'content': doc_data['content'],
            'category': doc_data['category'],
            'status': 'published',
            'visibility': 'public'
        }).execute()
        inserted_count += 1

print(f"Updated {updated_count} articles and inserted {inserted_count} new articles.")
print("SYNC COMPLETE. Local directory is now the source of truth.")
