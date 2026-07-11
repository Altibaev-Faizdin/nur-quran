import glob
import os

html_files = glob.glob('/home/weenzox62/nur-quran/frontend/**/*.html', recursive=True)

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace v=2 and v=3 with v=4
    content = content.replace('href="../shared.css?v=2"', 'href="../shared.css?v=4"')
    content = content.replace('href="../shared.css?v=3"', 'href="../shared.css?v=4"')
    content = content.replace('href="shared.css?v=2"', 'href="shared.css?v=4"')
    content = content.replace('href="shared.css?v=3"', 'href="shared.css?v=4"')
    
    content = content.replace('src="../shared.js?v=2"', 'src="../shared.js?v=4"')
    content = content.replace('src="../shared.js?v=3"', 'src="../shared.js?v=4"')
    content = content.replace('src="shared.js?v=2"', 'src="shared.js?v=4"')
    content = content.replace('src="shared.js?v=3"', 'src="shared.js?v=4"')
    
    content = content.replace('src="../reciter-player.js?v=2"', 'src="../reciter-player.js?v=4"')
    content = content.replace('src="../reciter-player.js?v=3"', 'src="../reciter-player.js?v=4"')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Cache busted to v=4 in all HTML files.")
