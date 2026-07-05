import os
import time
from duckduckgo_search import DDGS
from PIL import Image
import urllib.request
import io

reciters = {
  'abdul-basit': 'Abdul Basit Abd us-Samad quran reciter high quality',
  'saad-al-ghamdi': 'Saad Al-Ghamdi quran reciter',
  'minshawi': 'Mohamed Siddiq El-Minshawi quran reciter',
  'maher': 'Maher Al Muaiqly quran reciter',
  'mishary': 'Mishary Alafasy quran reciter',
  'islam-sobhi': 'Islam Sobhi quran reciter',
  'yasser': 'Yasser Al-Dosari quran reciter',
  'sherif-mostafa': 'Sherif Mostafa quran reciter',
  'abdulrahman-mossad': 'Abdurrahman Mossad quran reciter',
  'raad-al-kurdi': 'Raad Mohammad Al Kurdi quran reciter'
}

ddgs = DDGS()

for k, q in reciters.items():
    print(f'Searching for {k}...')
    try:
        results = ddgs.images(q, max_results=5)
        for res in results:
            url = res['image']
            print(f'Trying {url}')
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=10) as response:
                    img_data = response.read()
                img = Image.open(io.BytesIO(img_data)).convert('RGB')
                
                # Check resolution
                if img.width >= 400 and img.height >= 400:
                    # Compress and save as WebP
                    img.thumbnail((800, 800))
                    out_path = f'{k}.webp'
                    img.save(out_path, 'WEBP', quality=85)
                    size_kb = os.path.getsize(out_path) / 1024
                    print(f'Saved {out_path} ({img.size[0]}x{img.size[1]}, {size_kb:.1f} KB)')
                    break
                else:
                    print(f'Too small ({img.width}x{img.height})')
            except Exception as e:
                print(f'Error downloading {url}: {e}')
                continue
    except Exception as e:
        print(f'Search error for {k}: {e}')
    time.sleep(2)
