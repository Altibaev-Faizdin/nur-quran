import glob
import re

html_files = glob.glob('/home/weenzox62/nur-quran/frontend/**/*.html', recursive=True)

langs_regex = re.compile(r'<div class="langs">\s*<button.*?</button>\s*<button.*?</button>\s*<button.*?</button>\s*</div>', re.DOTALL)

for file_path in html_files:
    if file_path.endswith('quran.html'):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = langs_regex.sub('', content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Removed .langs from {file_path}")

print("Language switcher removed from non-quran pages.")
