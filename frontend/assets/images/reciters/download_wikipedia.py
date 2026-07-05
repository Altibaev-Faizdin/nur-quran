import wikipedia
import urllib.request
import os
import io
from PIL import Image

reciters = {
  'abdul-basit': 'Abdul_Basit_%27Abd_us-Samad',
  'saad-al-ghamdi': 'Saad_al-Ghamdi',
  'minshawi': 'Mohamed_Siddiq_El-Minshawi',
  'maher': 'Maher_Al-Muaiqly',
  'mishary': 'Mishari_ibn_Rashid_al-Afasi',
  'yasser': 'Yasser_Al-Dosari'
}

for k, title in reciters.items():
    print(f"Searching Wikipedia for {title}...")
    try:
        page = wikipedia.page(title, auto_suggest=False)
        saved = False
        for img_url in page.images:
            if img_url.endswith('.jpg') or img_url.endswith('.png'):
                print(f"Trying {img_url}")
                try:
                    req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                    img_data = urllib.request.urlopen(req).read()
                    img = Image.open(io.BytesIO(img_data)).convert('RGB')
                    if img.width >= 300 and img.height >= 300:
                        img.thumbnail((800, 800))
                        out_path = f"{k}.webp"
                        img.save(out_path, 'WEBP', quality=85)
                        print(f"Saved {out_path} ({img.size[0]}x{img.size[1]})")
                        saved = True
                        break
                except Exception as e:
                    print(f"Error {e}")
        if not saved:
            print("No suitable image found.")
    except Exception as e:
        print(f"Error: {e}")
