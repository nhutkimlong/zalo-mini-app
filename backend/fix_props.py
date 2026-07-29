import os
import re
from dotenv import load_dotenv
from supabase import create_client

def remove_vietnamese_accents(s):
    s = re.sub(r'[àáạảãâầấậẩẫăằắặẳẵ]', 'a', s)
    s = re.sub(r'[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]', 'A', s)
    s = re.sub(r'[èéẹẻẽêềếệểễ]', 'e', s)
    s = re.sub(r'[ÈÉẸẺẼÊỀẾỆỂỄ]', 'E', s)
    s = re.sub(r'[òóọỏõôồốộổỗơờớợởỡ]', 'o', s)
    s = re.sub(r'[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]', 'O', s)
    s = re.sub(r'[ìíịỉĩ]', 'i', s)
    s = re.sub(r'[ÌÍỊỈĨ]', 'I', s)
    s = re.sub(r'[ùúụủũưừứựửữ]', 'u', s)
    s = re.sub(r'[ÙÚỤỦŨƯỪỨỰỬỮ]', 'U', s)
    s = re.sub(r'[ỳýỵỷỹ]', 'y', s)
    s = re.sub(r'[ỲÝỴỶỸ]', 'Y', s)
    s = re.sub(r'[đ]', 'd', s)
    s = re.sub(r'[Đ]', 'D', s)
    return s

def slugify(value):
    value = remove_vietnamese_accents(str(value))
    value = re.sub(r'[^\w\s-]', '', value).strip().lower()
    return re.sub(r'[-\s]+', '-', value)

load_dotenv('.env')
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
supabase = create_client(url, key)
response = supabase.table('knowledge_articles').select('*').execute()

output_dir = r'D:\AICoworker\06-chuyen-doi-so\chatbot-knowledge'
os.makedirs(output_dir, exist_ok=True)

synced_filenames = set()
for item in response.data:
    title = item.get('title')
    content = item.get('content') or ''
    if not title: continue
    
    slug = slugify(title)
    filename = f'{slug}.md'
    filepath = os.path.join(output_dir, filename)
    
    content_stripped = content.strip()
    if not content_stripped.startswith('---'):
        safe_title = title.replace('"', '\\"')
        props = [
            '---',
            f'id: "{item.get("id", "")}"',
            f'title: "{safe_title}"',
            f'category: "{item.get("category", "")}"',
            f'status: "{item.get("status", "published")}"',
            f'source: "{item.get("source", "")}"',
            'sync: true',
            '---\n\n'
        ]
        content = "\n".join(props) + content_stripped
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Saved: {filename}')
    synced_filenames.add(filename)

# Cleanup: delete local .md files that are no longer in Supabase
for f in os.listdir(output_dir):
    if f.endswith('.md') and f != 'index.md' and f not in synced_filenames:
        stray_filepath = os.path.join(output_dir, f)
        os.remove(stray_filepath)
        print(f'Deleted missing article from local: {f}')
