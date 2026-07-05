import urllib.request
import urllib.parse
import json
import os
import io
from PIL import Image

reciters = {
  'abdulbasit': 'Abdul Basit Quran',
  'ghamdi': 'Saad Al Ghamdi Quran',
  'minshawi': 'Mohamed Siddiq El-Minshawi',
  'maher': 'Maher Al Muaiqly',
  'mishary_alafasy': 'Mishary Alafasy',
  'islam_sobhi': 'Islam Sobhi',
  'yasser_dosari': 'Yasser Al-Dosari',
  'sherif_mostafa': 'Sherif Mostafa',
  'abdurrahman_mossad': 'Abdurrahman Mossad',
  'raad_kurdi': 'Raad Mohammad Al Kurdi'
}

for k, q in reciters.items():
    print(f"Searching iTunes for {q}...")
    url = f"https://itunes.apple.com/search?term={urllib.parse.quote(q)}&entity=album&limit=1"
    req = urllib.request.Request(url, headers={'User-Agent': 'NurQuranProject/1.0'})
    try:
        response = urllib.request.urlopen(req).read()
        data = json.loads(response)
        if data['resultCount'] > 0:
            img_url = data['results'][0]['artworkUrl100']
            img_url = img_url.replace('100x100bb', '800x800bb')
            print(f"Found {img_url}")
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'NurQuranProject/1.0'})
            img_data = urllib.request.urlopen(img_req).read()
            img = Image.open(io.BytesIO(img_data)).convert('RGB')
            out_path = f"{k}.webp"
            img.save(out_path, 'WEBP', quality=85)
            print(f"Saved {out_path} ({img.size[0]}x{img.size[1]})")
        else:
            print(f"No results for {q}")
    except Exception as e:
        print(f"Error: {e}")
