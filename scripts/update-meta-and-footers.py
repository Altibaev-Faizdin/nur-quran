#!/usr/bin/env python3
"""
scripts/update-meta-and-footers.py
Synchronize meta tags, OpenGraph 1200x630 cards, PWA icons, and legal footer links across all HTML files.
"""

import os
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(ROOT_DIR, 'frontend')

OG_TAGS = """  <meta property="og:image" content="https://noor-al-quran.netlify.app/assets/images/og-preview.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://noor-al-quran.netlify.app/assets/images/og-preview.png">
  <link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/images/favicon-16x16.png">
  <link rel="shortcut icon" href="/favicon.ico">"""

def update_html_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    orig_content = content
    rel_path = os.path.relpath(file_path, FRONTEND_DIR)
    is_in_pages = 'pages' in rel_path

    priv_link = 'privacy.html' if is_in_pages else 'pages/privacy.html'
    terms_link = 'terms.html' if is_in_pages else 'pages/terms.html'

    # 1. Update OG and icons in head
    # Replace old og:image lines if present
    content = re.sub(r'<meta\s+property=["\']og:image["\'][^>]*>', '', content)
    content = re.sub(r'<meta\s+property=["\']og:image:width["\'][^>]*>', '', content)
    content = re.sub(r'<meta\s+property=["\']og:image:height["\'][^>]*>', '', content)
    content = re.sub(r'<meta\s+property=["\']og:image:type["\'][^>]*>', '', content)
    content = re.sub(r'<meta\s+name=["\']twitter:card["\'][^>]*>', '', content)
    content = re.sub(r'<meta\s+name=["\']twitter:image["\'][^>]*>', '', content)
    content = re.sub(r'<link\s+rel=["\']apple-touch-icon["\'][^>]*>', '', content)

    # Insert standard OG block before </head> or after <meta property="og:description"
    if '<meta property="og:description"' in content:
        content = re.sub(
            r'(<meta\s+property=["\']og:description["\'][^>]*>)',
            r'\1\n' + OG_TAGS,
            content,
            count=1
        )
    elif '</head>' in content:
        content = content.replace('</head>', OG_TAGS + '\n</head>', 1)

    # 2. Update Footer with Privacy & Terms links
    footer_pattern = re.compile(r'<footer>(.*?)</footer>', re.DOTALL)
    footer_match = footer_pattern.search(content)
    if footer_match:
        old_footer = footer_match.group(0)
        legal_block = f'<div class="fc" style="margin:6px 0"><a href="{priv_link}" style="color:var(--goldL);margin-right:14px;text-decoration:none" data-i18n="footer_privacy">Privacy & Sources</a><a href="{terms_link}" style="color:var(--goldL);text-decoration:none" data-i18n="footer_terms">Terms of Service</a></div>'
        
        if 'privacy.html' not in old_footer and 'terms.html' not in old_footer:
            new_footer = old_footer.replace(
                '</footer>',
                f'  {legal_block}\n  </footer>'
            )
            content = content.replace(old_footer, new_footer)

    if content != orig_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {rel_path}")

def main():
    for root, _, files in os.walk(FRONTEND_DIR):
        for f in sorted(files):
            if f.endswith('.html'):
                update_html_file(os.path.join(root, f))

if __name__ == '__main__':
    main()

