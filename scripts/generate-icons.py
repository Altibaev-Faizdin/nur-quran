#!/usr/bin/env python3
"""
scripts/generate-icons.py
Generate PWA icons, apple-touch-icon, favicons, and og-preview.png.
"""

import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')
IMG_DIR = os.path.join(FRONTEND_DIR, 'assets', 'images')
SVG_PATH = os.path.join(IMG_DIR, 'logo.svg')

os.makedirs(IMG_DIR, exist_ok=True)

def render_svg_to_png(svg_path, out_path, size):
    cmd = [
        'convert',
        '-background', 'none',
        '-density', '300',
        svg_path,
        '-resize', f'{size}x{size}',
        out_path
    ]
    subprocess.run(cmd, check=True)
    print(f"Generated: {out_path} ({size}x{size})")

def generate_maskable(base_png, out_path, size):
    # Maskable icons need ~10-15% safe padding
    img = Image.open(base_png).convert("RGBA")
    canvas = Image.new("RGBA", (size, size), (2, 8, 24, 255))
    inner_size = int(size * 0.76)
    offset = (size - inner_size) // 2
    resized = img.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
    canvas.paste(resized, (offset, offset), resized)
    canvas.save(out_path, format="PNG", optimize=True)
    print(f"Generated maskable: {out_path} ({size}x{size})")

def generate_og_preview(logo_png, out_path):
    width, height = 1200, 630
    card = Image.new("RGBA", (width, height), (2, 8, 24, 255))
    draw = ImageDraw.Draw(card)

    # Subtle background gradient
    for y in range(height):
        ratio = y / height
        r = int(2 + (11 - 2) * (1 - abs(ratio - 0.5) * 2))
        g = int(8 + (27 - 8) * (1 - abs(ratio - 0.5) * 2))
        b = int(24 + (56 - 24) * (1 - abs(ratio - 0.5) * 2))
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

    # Gold decorative border
    draw.rectangle([(20, 20), (width - 20, height - 20)], outline=(212, 160, 23, 100), width=2)
    draw.rectangle([(26, 26), (width - 26, height - 26)], outline=(212, 160, 23, 40), width=1)

    # Corner ornaments
    orn_len = 36
    draw.line([(20, 20), (20 + orn_len, 20)], fill=(245, 225, 151, 255), width=4)
    draw.line([(20, 20), (20, 20 + orn_len)], fill=(245, 225, 151, 255), width=4)
    draw.line([(width - 20, 20), (width - 20 - orn_len, 20)], fill=(245, 225, 151, 255), width=4)
    draw.line([(width - 20, 20), (width - 20, 20 + orn_len)], fill=(245, 225, 151, 255), width=4)
    draw.line([(20, height - 20), (20 + orn_len, height - 20)], fill=(245, 225, 151, 255), width=4)
    draw.line([(20, height - 20), (20, height - 20 - orn_len)], fill=(245, 225, 151, 255), width=4)
    draw.line([(width - 20, height - 20), (width - 20 - orn_len, height - 20)], fill=(245, 225, 151, 255), width=4)
    draw.line([(width - 20, height - 20), (width - 20, height - 20 - orn_len)], fill=(245, 225, 151, 255), width=4)

    # Paste Logo
    logo = Image.open(logo_png).convert("RGBA")
    logo_size = 400
    logo_resized = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    card.paste(logo_resized, (70, 115), logo_resized)

    # Try loading system fonts or default
    font_large = None
    font_medium = None
    font_small = None
    font_arabic = None

    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"
    ]
    for p in font_paths:
        if os.path.exists(p):
            font_large = ImageFont.truetype(p, 58)
            font_medium = ImageFont.truetype(p, 30)
            font_small = ImageFont.truetype(p, 20)
            break

    if not font_large:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # Draw Typography
    text_x = 520
    draw.text((text_x, 150), "Noor Al-Quran", fill=(245, 225, 151, 255), font=font_large)
    draw.text((text_x, 230), "نور القرآن الكريم", fill=(212, 160, 23, 230), font=font_medium)
    draw.text((text_x, 290), "The Holy Quran & Islamic Daily Companion", fill=(230, 235, 245, 255), font=font_medium)

    # Divider
    draw.line([(text_x, 345), (width - 100, 345)], fill=(212, 160, 23, 80), width=2)

    # Feature badges
    features = [
        "📖 Complete Quran (114 Surahs)",
        "🎙️ 10 Renowned Reciters",
        "🕌 Accurate Prayer Times",
        "🧭 3D Qibla Compass & Tasbih",
        "⚡ 100% Free & Works Offline"
    ]
    badge_y = 375
    for feat in features:
        draw.text((text_x, badge_y), feat, fill=(168, 192, 232, 255), font=font_small)
        badge_y += 34

    card.save(out_path, format="PNG", optimize=True)
    print(f"Generated OG Preview: {out_path} (1200x630)")

def main():
    print("=== Generating Application Icons & Media Assets ===")

    p512 = os.path.join(IMG_DIR, "icon-512.png")
    p192 = os.path.join(IMG_DIR, "icon-192.png")
    p180 = os.path.join(IMG_DIR, "apple-touch-icon.png")
    p32  = os.path.join(IMG_DIR, "favicon-32x32.png")
    p16  = os.path.join(IMG_DIR, "favicon-16x16.png")
    ico  = os.path.join(FRONTEND_DIR, "favicon.ico")
    og   = os.path.join(IMG_DIR, "og-preview.png")

    # Render base icons
    render_svg_to_png(SVG_PATH, p512, 512)
    render_svg_to_png(SVG_PATH, p192, 192)
    render_svg_to_png(SVG_PATH, p180, 180)
    render_svg_to_png(SVG_PATH, p32, 32)
    render_svg_to_png(SVG_PATH, p16, 16)

    # Maskable icons
    generate_maskable(p512, os.path.join(IMG_DIR, "icon-maskable-512.png"), 512)
    generate_maskable(p192, os.path.join(IMG_DIR, "icon-maskable-192.png"), 192)

    # Multi-resolution favicon.ico
    img32 = Image.open(p32)
    img16 = Image.open(p16)
    img48 = Image.open(p192).resize((48, 48), Image.Resampling.LANCZOS)
    img32.save(ico, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[img16, img48])
    print(f"Generated multi-resolution ICO: {ico}")

    # OpenGraph raster image (1200x630)
    generate_og_preview(p512, og)

    print("=== All Icons and Visual Assets Generated Successfully ===")

if __name__ == '__main__':
    main()
