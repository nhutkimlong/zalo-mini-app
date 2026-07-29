import os
import re
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env')
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
supabase = create_client(url, key)

files_to_sync = [
    'dich-vu-luu-tru-khach-san-nha-nghi.md',
    'gui-hanh-ly-do-an-do-le-tai-khu-du-lich.md',
    'xe-lan-va-loi-di-cho-nguoi-khuyet-tat.md',
    'su-tich-ong-da-nut-doi-chua-hang.md'
]
d = r'D:\AICoworker\06-chuyen-doi-so\chatbot-knowledge'

for f in files_to_sync:
    filepath = os.path.join(d, f)
    with open(filepath, 'r', encoding='utf-8') as file:
        original = file.read()
    
    match = re.search(r'id:\s*"([^"]+)"', original)
    if not match:
        print(f"Skipping {f}, no ID found.")
        continue
        
    doc_id = match.group(1)
    
    # Strip frontmatter
    parts = original.split('---', 2)
    if len(parts) >= 3:
        clean_content = parts[2].strip()
    else:
        clean_content = original.strip()
        
    supabase.table('knowledge_articles').update({'content': clean_content}).eq('id', doc_id).execute()
    print(f"Synced {f} to Supabase")

# Also reindex by importing the embedding service directly
import sys
sys.path.append(os.getcwd())
from app.services.embedding_service import embedding_service

print("Reindexing updated articles...")
for f in files_to_sync:
    filepath = os.path.join(d, f)
    with open(filepath, 'r', encoding='utf-8') as file:
        original = file.read()
        
    match_id = re.search(r'id:\s*"([^"]+)"', original)
    match_title = re.search(r'title:\s*"([^"]+)"', original)
    match_category = re.search(r'category:\s*"([^"]+)"', original)
    
    if match_id and match_title:
        doc_id = match_id.group(1)
        title = match_title.group(1)
        category = match_category.group(1) if match_category else 'khac'
        
        parts = original.split('---', 2)
        if len(parts) >= 3:
            clean_content = parts[2].strip()
        else:
            clean_content = original.strip()
            
        embedding_service.index_article(
            article_id=doc_id,
            title=title,
            content=clean_content,
            category=category
        )
        print(f"Reindexed {title}")
