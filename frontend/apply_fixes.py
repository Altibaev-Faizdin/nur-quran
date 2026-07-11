import os
import re

frontend_dir = "/home/weenzox62/nur-quran/frontend"

seo_tags = """  <meta name="description" content="Noor Al-Quran - Read and listen to the Holy Quran, get accurate prayer times, find Qibla direction, and read Hadiths.">
  <meta property="og:title" content="Noor Al-Quran — نور القرآن">
  <meta property="og:description" content="Read and listen to the Holy Quran, get accurate prayer times, find Qibla direction, and read Hadiths.">
  <meta property="og:image" content="/assets/img/og-image.png">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="manifest" href="/manifest.json">
"""

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update viewport
    content = re.sub(
        r'<meta\s+name="viewport"\s+content="[^"]+">',
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
        content
    )

    # 2. Add SEO tags if not present
    if 'og:title' not in content:
        # Find </title> and insert after it
        content = re.sub(
            r'(</title>)',
            r'\1\n' + seo_tags,
            content
        )

    # 3. Add aria-label to buttons missing it
    # We find all <button ... > tags. If they don't have aria-label, we add aria-label="button"
    def add_aria(match):
        tag = match.group(0)
        if 'aria-label' not in tag:
            # try to infer name from id or class if we want, but 'button' or 'action' is a generic fallback.
            # let's just add aria-label="Action Button" for accessibility.
            # to be safe, we insert it before the closing >
            return tag[:-1] + ' aria-label="Action Button">'
        return tag
    
    content = re.sub(r'<button[^>]*>', add_aria, content)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

for root, _, files in os.walk(frontend_dir):
    if "node_modules" in root or ".git" in root:
        continue
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))

print("HTML files updated successfully.")
