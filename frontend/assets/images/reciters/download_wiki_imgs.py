import urllib.request
import io
from PIL import Image

def dl(url, name):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        img_data = urllib.request.urlopen(req).read()
        img = Image.open(io.BytesIO(img_data)).convert('RGB')
        img.thumbnail((800, 800))
        img.save(name, 'WEBP', quality=85)
        print(f"Saved {name}")
    except Exception as e:
        print(f"Error {name}: {e}")

dl('https://upload.wikimedia.org/wikipedia/commons/2/24/%D0%9C%D0%B8%D1%88%D0%B0%D1%80%D0%B8_%D0%A0%D0%B0%D1%88%D0%B8%D0%B4.jpg', 'mishary_alafasy.webp')
dl('https://upload.wikimedia.org/wikipedia/commons/e/ee/Elminshwey.jpg', 'minshawi.webp')
