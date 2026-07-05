import urllib.request
import urllib.parse
import json
import os
import io
from PIL import Image

reciters = {
  'abdulbasit': 'Abdul_Basit_%27Abd_us-Samad',
  'ghamdi': 'Saad_al-Ghamdi',
  'minshawi': 'Mohamed_Siddiq_El-Minshawi',
  'maher': 'Maher_Al-Muaiqly',
  'mishary_alafasy': 'Mishari_ibn_Rashid_al-Afasi',
  'yasser_dosari': 'Yasser_Al-Dosari'
}

for k, title in reciters.items():
    print(f"Searching for {title}...")
    url = f"https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles={urllib.parse.quote(title)}"
    req = urllib.request.Request(url, headers={'User-Agent': 'NurQuranProject/1.0 (test@test.com)'})
    try:
        response = urllib.request.urlopen(req).read()
        data = json.loads(response)
        pages = data.get('query', {}).get('pages', {})
        for page_id, page_data in pages.items():
            if 'original' in page_data:
                img_url = page_data['original']['source']
                print(f"Found {img_url}")
                img_req = urllib.request.Request(img_url, headers={'User-Agent': 'NurQuranProject/1.0 (test@test.com)'})
                img_data = urllib.request.urlopen(img_req).read()
                img = Image.open(io.BytesIO(img_data)).convert('RGB')
                
                # Minimum size check (adjust if needed, Wikipedia originals are usually large enough)
                if img.width >= 200:
                    img.thumbnail((800, 800))
                    out_path = f"{k}.webp"
                    img.save(out_path, 'WEBP', quality=85)
                    print(f"Saved {out_path} ({img.size[0]}x{img.size[1]})")
                else:
                    print(f"Too small: {img.width}x{img.height}")
            else:
                print("No original image found.")
    except Exception as e:
        print(f"Error: {e}")
