import glob
import os
import re

html_files = glob.glob('/home/weenzox62/nur-quran/frontend/pages/*.html')

fstrip_html = """
    <!-- BOTTOM NAV -->
    <div class="fstrip">
      <a href="../pages/quran.html" class="fitem">
        <div class="fic">📖</div><div class="flb">Quran</div>
      </a>
      <a href="../pages/reciters.html" class="fitem">
        <div class="fic">🎙️</div><div class="flb">Reciters</div>
      </a>
      <a href="../pages/prayer.html" class="fitem">
        <div class="fic">🕐</div><div class="flb">Prayer</div>
      </a>
      <a href="../pages/bookmarks.html" class="fitem">
        <div class="fic">🔖</div><div class="flb">Saved</div>
      </a>
    </div>
"""

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<div class="fstrip">' in content:
        continue
        
    # We want to insert the fstrip before <footer>
    # or before </body>
    if '<footer>' in content:
        content = content.replace('<footer>', fstrip_html + '\n  <footer>')
    else:
        content = content.replace('</body>', fstrip_html + '\n</body>')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("fstrip added to all pages.")
