import glob
import os

html_files = glob.glob('/home/weenzox62/nur-quran/frontend/**/*.html', recursive=True)

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace shared.css
    content = content.replace('href="../shared.css"', 'href="../shared.css?v=3"')
    content = content.replace('href="../shared.css?v=2"', 'href="../shared.css?v=3"')
    content = content.replace('href="shared.css"', 'href="shared.css?v=3"')
    content = content.replace('href="shared.css?v=2"', 'href="shared.css?v=3"')
    
    # Replace shared.js
    content = content.replace('src="../shared.js"', 'src="../shared.js?v=3"')
    content = content.replace('src="../shared.js?v=2"', 'src="../shared.js?v=3"')
    content = content.replace('src="shared.js"', 'src="shared.js?v=3"')
    content = content.replace('src="shared.js?v=2"', 'src="shared.js?v=3"')
    
    # Replace reciter-player.js
    content = content.replace('src="../reciter-player.js"', 'src="../reciter-player.js?v=3"')
    content = content.replace('src="../reciter-player.js?v=2"', 'src="../reciter-player.js?v=3"')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Cache busted in all HTML files.")
