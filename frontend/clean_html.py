import os
import glob
import re

html_files = glob.glob('/home/weenzox62/nur-quran/frontend/**/*.html', recursive=True)

# The fragment left over by the broken regex
broken_fragment_pattern_1 = re.compile(
    r'\s*</a>\s*<a href="[^"]+" class="fitem">\s*<div class="fic">🎙️</div><div class="flb">Reciters</div>\s*</a>.*?\s*</div>\n\s*<!-- MOBILE NAV -->',
    re.DOTALL
)

# For index.html, it might look a bit different
broken_fragment_pattern_2 = re.compile(
    r'\s*</a>\s*<a href="pages/reciters.html" class="fitem">\s*<div class="fic">🎙️</div>\s*<div class="flb">Reciters</div>\s*</a>.*?\s*</div>\n\s*<!-- MOBILE NAV -->',
    re.DOTALL
)

# Also we need to delete .fstrip from index.html if it still has it
fstrip_pattern_full = re.compile(
    r'<!-- FEATURES -->\s*<div class="fstrip">.*?</div>\n\s*(?:</main>|<footer>)',
    re.DOTALL
)

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = broken_fragment_pattern_1.sub('\n<!-- MOBILE NAV -->', content)
    new_content = broken_fragment_pattern_2.sub('\n<!-- MOBILE NAV -->', new_content)
    
    # In index.html, the original features strip might still exist. Let's find it more robustly.
    # Actually, we can just look for <div class="fstrip">...</div> and delete it if it exists.
    if 'index.html' in file:
        new_content = re.sub(r'<!-- FEATURES -->\s*<div class="fstrip">.*?\s*</div>\n\s*</div>', '', new_content, flags=re.DOTALL)
        new_content = re.sub(r'<div class="fstrip">.*?<div class="fic">🔖</div>\s*<div class="flb">Saved</div>\s*</a>\s*</div>', '', new_content, flags=re.DOTALL)
    
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Cleaned broken HTML in {file}")

print("Done.")
