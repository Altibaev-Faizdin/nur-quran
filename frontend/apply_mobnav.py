import glob
import os

html_files = glob.glob('/home/weenzox62/nur-quran/frontend/**/*.html', recursive=True)

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<div class="mob-nav">' in content:
        continue
        
    # Replace the previous .fstrip injected if any
    if '<!-- BOTTOM NAV -->' in content:
        import re
        content = re.sub(r'<!-- BOTTOM NAV -->.*?</div>\n', '', content, flags=re.DOTALL)
        
    # Calculate relative paths
    is_root = os.path.basename(os.path.dirname(file_path)) == 'frontend'
    
    home_link = "index.html" if is_root else "../index.html"
    pages_prefix = "pages/" if is_root else ""
    
    mob_nav_html = f"""
<!-- MOBILE NAV -->
<div class="mob-nav">
  <a href="{home_link}">
    <div class="mn-ic">🏠</div>
    <div>Home</div>
  </a>
  <a href="{pages_prefix}quran.html">
    <div class="mn-ic">📖</div>
    <div>Quran</div>
  </a>
  <a href="{pages_prefix}reciters.html">
    <div class="mn-ic">🎙️</div>
    <div>Reciters</div>
  </a>
  <a href="{pages_prefix}prayer.html">
    <div class="mn-ic">🕐</div>
    <div>Prayer</div>
  </a>
  <a href="{pages_prefix}bookmarks.html">
    <div class="mn-ic">🔖</div>
    <div>Saved</div>
  </a>
</div>
"""
    
    if '</body>' in content:
        content = content.replace('</body>', mob_nav_html + '\n</body>')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("mob-nav added to all pages with correct relative links.")
