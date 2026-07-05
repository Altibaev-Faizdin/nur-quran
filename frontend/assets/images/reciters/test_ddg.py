import requests
import re

html = requests.get("https://html.duckduckgo.com/html/?q=Sherif+Mostafa+reciter", headers={"User-Agent": "Mozilla/5.0"}).text
for m in re.finditer(r'src="([^"]+\.jpg)"', html):
    print(m.group(1))
