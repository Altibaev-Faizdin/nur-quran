import urllib.request
import re
import io
from PIL import Image

def dl_from_assabile(name, slug):
    try:
        url = f"https://www.assabile.com/{slug}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        
        # Find something like: <img src="https://www.assabile.com/media/photo/full_size/raad-mohammad-al-kurdi-1234.jpg"
        m = re.search(r'<img[^>]+src="([^"]+/media/photo/[^"]+)"', html)
        if m:
            img_url = m.group(1)
            print(f"Found {img_url}")
            
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            img_data = urllib.request.urlopen(img_req).read()
            img = Image.open(io.BytesIO(img_data)).convert('RGB')
            img.thumbnail((800, 800))
            img.save(name, 'WEBP', quality=85)
            print(f"Saved {name}")
        else:
            print(f"Not found in HTML for {slug}")
    except Exception as e:
        print(f"Error {name}: {e}")

dl_from_assabile('sherif_mostafa.webp', 'sherif-mostafa-486')
dl_from_assabile('raad_kurdi.webp', 'raad-mohammad-al-kurdi-362')
