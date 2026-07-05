from duckduckgo_search import DDGS
import requests
import io
from PIL import Image

def dl(name, q):
    try:
        results = DDGS().images(q, max_results=3)
        for r in results:
            url = r['image']
            print(f"Trying {url}")
            try:
                img_data = requests.get(url, timeout=5).content
                img = Image.open(io.BytesIO(img_data)).convert('RGB')
                img.thumbnail((800, 800))
                img.save(f"{name}.webp", 'WEBP', quality=85)
                print(f"Success {name}")
                return
            except Exception as e:
                print("Failed:", e)
    except Exception as e:
        print("Search failed:", e)

dl("sherif_mostafa", "القارئ شريف مصطفى photo face")
dl("raad_kurdi", "القارئ رعد محمد الكردي photo face")
