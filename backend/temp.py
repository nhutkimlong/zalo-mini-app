import os
import re

d = r'D:\AICoworker\06-chuyen-doi-so\chatbot-knowledge'
files = [f for f in os.listdir(d) if f.endswith('.md') and f != 'index.md']

table = '| # | Tệp tin nguồn | Phân loại |\n|---|---|---|\n'
for i, f in enumerate(sorted(files), 1):
    path = os.path.join(d, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    title_match = re.search(r'title:\s*"([^"]+)"', content)
    cat_match = re.search(r'category:\s*"([^"]+)"', content)
    title = title_match.group(1) if title_match else f
    cat = cat_match.group(1) if cat_match else 'di_tich'
    
    table += f'| {i} | [[{f}|{title}]] | `{cat}` |\n'

index_path = os.path.join(d, 'index.md')
with open(index_path, 'r', encoding='utf-8') as idx:
    idx_content = idx.read()

start_marker = '## 🗂️ Danh mục Tri thức đã được Phê duyệt'
end_marker = '## 🛠️ Quy trình cập nhật và nạp dữ liệu AI (RAG Pipeline)'

start_idx = idx_content.find(start_marker)
end_idx = idx_content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_content = idx_content[:start_idx + len(start_marker)] + '\n\n' + table + '\n---\n\n' + idx_content[end_idx:]
    with open(index_path, 'w', encoding='utf-8') as idx:
        idx.write(new_content)
    print('Updated index.md')
else:
    print('Markers not found')
