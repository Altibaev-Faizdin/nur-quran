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

dl('https://i.pinimg.com/564x/d7/69/37/d76937e3aba6baa1d552ec1c2bfe1b1a.jpg', 'sherif_mostafa.webp')
dl('https://artwork.qurancentral.com/raad-mohammad-al-kurdi.jpg', 'raad_kurdi.webp')
