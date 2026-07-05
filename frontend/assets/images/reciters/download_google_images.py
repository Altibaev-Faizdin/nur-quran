import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
import os
import io
from PIL import Image

reciters = {
  'abdul-basit': 'Abdul Basit Abd us-Samad reciter 800x800',
  'saad-al-ghamdi': 'Saad Al-Ghamdi reciter photo',
  'minshawi': 'Mohamed Siddiq El-Minshawi reciter photo',
  'maher': 'Maher Al Muaiqly reciter photo',
  'mishary': 'Mishary Alafasy reciter photo',
  'islam-sobhi': 'Islam Sobhi reciter photo',
  'yasser': 'Yasser Al-Dosari reciter photo',
  'sherif-mostafa': 'Sherif Mostafa reciter photo',
  'abdulrahman-mossad': 'Abdurrahman Mossad reciter photo',
  'raad-al-kurdi': 'Raad Mohammad Al Kurdi reciter photo'
}

for k, q in reciters.items():
    print(f"Searching Google Images for {k}...")
    try:
        url = "https://www.google.com/search?tbm=isch&q=" + urllib.parse.quote(q)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        html = urllib.request.urlopen(req).read()
        soup = BeautifulSoup(html, 'html.parser')
        
        # In non-JS google images, images are just <img> tags. The first one is usually the Google logo.
        # We can look for the first img inside the results.
        imgs = soup.find_all('img')
        saved = False
        for img in imgs[1:5]: # Skip the first one (usually logo)
            src = img.get('src')
            if src and src.startswith('http'):
                print(f"Trying {src}")
                try:
                    img_req = urllib.request.Request(src, headers={'User-Agent': 'Mozilla/5.0'})
                    img_data = urllib.request.urlopen(img_req).read()
                    image = Image.open(io.BytesIO(img_data)).convert('RGB')
                    image = image.resize((500, 500), Image.Resampling.LANCZOS)
                    out_path = f"{k}.webp"
                    image.save(out_path, 'WEBP', quality=85)
                    print(f"Saved {out_path}")
                    saved = True
                    break
                except Exception as e:
                    print(f"Error downloading {src}: {e}")
        if not saved:
            print(f"Could not find an image for {k}")
    except Exception as e:
        print(f"Search error for {k}: {e}")
