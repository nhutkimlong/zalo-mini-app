import os
import re

d = r'D:\AICoworker\06-chuyen-doi-so\chatbot-knowledge'
files = [f for f in os.listdir(d) if f.endswith('.md') and f != 'index.md']

id_to_file = {}
duplicates = []

for f in files:
    filepath = os.path.join(d, f)
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
        match = re.search(r'id:\s*"([^"]+)"', content)
        if match:
            doc_id = match.group(1)
            if doc_id in id_to_file:
                # We have a duplicate! Keep the one with the newer modified time or longer name?
                # Actually, let's just flag it for now
                duplicates.append((id_to_file[doc_id], f))
            else:
                id_to_file[doc_id] = f

if duplicates:
    print('Found files with duplicate IDs:')
    for f1, f2 in duplicates:
        print(f'DUPLICATE: {f1} and {f2}')
else:
    print('No duplicate IDs found among files.')

# Another check: look at files that DO NOT have an ID (i.e. we missed frontmatter or they are old junk)
for f in files:
    filepath = os.path.join(d, f)
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
        if 'id: "' not in content:
            print(f'MISSING ID (POTENTIAL JUNK): {f}')
