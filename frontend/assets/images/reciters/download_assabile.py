import urllib.request
from bs4 import BeautifulSoup
import urllib.parse
import os
from PIL import Image
import io

reciters = {
  'abdulbasit': 'abdul-basit-abdul-samad',
  'ghamdi': 'saad-el-ghamidi',
  'minshawi': 'mohamed-siddiq-el-minshawi',
  'maher': 'maher-al-mueaqly',
  'mishary_alafasy': 'mishary-rashid-alafasy',
  'islam_sobhi': 'islam-sobhi',
  'yasser_dosari': 'yasser-al-dosari',
  'sherif_mostafa': 'sherif-mostafa',
  'abdurrahman_mossad': 'abderrahman-mossaed',
  'raad_kurdi': 'raad-mohammad-al-kurdi'
}

for k, slug in reciters.items():
    print(f"Searching for {k} on assabile.com...")
    # we can try to search assabile
    search_url = f"https://www.assabile.com/search?q={slug}"
    req = urllib.request.Request(search_url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req).read()
        soup = BeautifulSoup(html, 'html.parser')
        
        # Find the first reciter link
        img_tag = soup.select_one('.reciter-img img')
        if not img_tag:
            img_tag = soup.select_one('img.rounded-circle')
            
        if img_tag and img_tag.get('src'):
            img_url = img_tag.get('src')
            if img_url.startswith('/'):
                img_url = 'https://www.assabile.com' + img_url
            
            print(f"Found image for {k}: {img_url}")
            
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            img_data = urllib.request.urlopen(img_req).read()
            img = Image.open(io.BytesIO(img_data)).convert('RGB')
            img.thumbnail((800, 800))
            out_path = f"{k}.webp"
            img.save(out_path, 'WEBP', quality=85)
            print(f"Saved {out_path} ({os.path.getsize(out_path)} bytes)")
        else:
            print(f"No image found for {k} on Assabile.")
    except Exception as e:
        print(f"Error for {k}: {e}")
