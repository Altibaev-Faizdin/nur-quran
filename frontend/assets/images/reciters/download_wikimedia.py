import urllib.request
import urllib.parse
import json
import os
import io
from PIL import Image

reciters = {
  'abdul-basit': 'Abdul Basit',
  'saad-al-ghamdi': 'Saad Al Ghamdi',
  'minshawi': 'Mohamed Siddiq El-Minshawi',
  'maher': 'Maher Al Muaiqly',
  'mishary': 'Mishary Alafasy',
  'islam-sobhi': 'Islam Sobhi',
  'yasser': 'Yasser Al-Dosari',
  'sherif-mostafa': 'Sherif Mostafa',
  'abdulrahman-mossad': 'Abdurrahman Mossad',
  'raad-al-kurdi': 'Raad Kurdi'
}

for k, q in reciters.items():
    print(f"Searching Wikimedia for {q}...")
    url = f"https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch={urllib.parse.quote(q)}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url"
    req = urllib.request.Request(url, headers={'User-Agent': 'NurQuranScript/1.0 (test@test.com)'})
    try:
        response = urllib.request.urlopen(req).read()
        data = json.loads(response)
        if 'query' in data and 'pages' in data['query']:
            pages = data['query']['pages']
            for page_id in pages:
                img_url = pages[page_id]['imageinfo'][0]['url']
                print(f"Found {img_url}")
                img_req = urllib.request.Request(img_url, headers={'User-Agent': 'NurQuranScript/1.0 (test@test.com)'})
                img_data = urllib.request.urlopen(img_req).read()
                img = Image.open(io.BytesIO(img_data)).convert('RGB')
                if img.width < 400:
                    print(f"Image too small ({img.width}x{img.height})")
                    continue
                img.thumbnail((800, 800))
                out_path = f"{k}.webp"
                img.save(out_path, 'WEBP', quality=85)
                print(f"Saved {out_path} ({img.size[0]}x{img.size[1]})")
        else:
            print("No image found.")
    except Exception as e:
        print(f"Error: {e}")
