import os
import re

def analyze():
    report = []
    report.append("# Noor Al-Quran Frontend Audit Report\n")
    
    frontend_dir = "/home/weenzox62/nur-quran/frontend"
    
    html_files = []
    css_files = []
    js_files = []
    
    for root, _, files in os.walk(frontend_dir):
        if "node_modules" in root or ".git" in root:
            continue
        for file in files:
            path = os.path.join(root, file)
            if file.endswith('.html'): html_files.append(path)
            elif file.endswith('.css'): css_files.append(path)
            elif file.endswith('.js'): js_files.append(path)

    # 1. Viewport & SEO Analysis
    report.append("## 1. Viewport & SEO (HTML Files)\n")
    for html in html_files:
        with open(html, 'r') as f:
            content = f.read()
            name = os.path.relpath(html, frontend_dir)
            
            # Check viewport
            viewport = re.search(r'<meta\s+name="viewport"\s+content="([^"]+)"', content)
            if not viewport:
                report.append(f"- **{name}**: Missing viewport meta tag.")
            elif viewport.group(1) != "width=device-width, initial-scale=1, viewport-fit=cover":
                report.append(f"- **{name}**: Incorrect viewport. Found: `{viewport.group(1)}`")
            
            # Check SEO
            seo_tags = ['description', 'og:title', 'og:description', 'og:image', 'twitter:card']
            missing_seo = []
            for tag in seo_tags:
                if f'name="{tag}"' not in content and f'property="{tag}"' not in content:
                    missing_seo.append(tag)
            if missing_seo:
                report.append(f"- **{name}**: Missing SEO tags: {', '.join(missing_seo)}")
                
            # Check ARIA on buttons
            buttons = re.findall(r'<button[^>]*>', content)
            missing_aria_buttons = [b for b in buttons if 'aria-label' not in b and '>' in b and not re.search(r'>\s*\w+', b)]
            if missing_aria_buttons:
                report.append(f"- **{name}**: Has buttons without aria-label (found {len(missing_aria_buttons)}).")

    # 2. CSS Analysis (Responsive & Safe Area)
    report.append("\n## 2. CSS Analysis (Responsive, Safe Area)\n")
    for css in css_files:
        with open(css, 'r') as f:
            content = f.read()
            name = os.path.relpath(css, frontend_dir)
            
            # Check safe area
            if 'env(safe-area' not in content:
                report.append(f"- **{name}**: No safe-area-insets used.")
            else:
                report.append(f"- **{name}**: Safe-area-insets found.")
                
            # Check breakpoints
            media_queries = re.findall(r'@media\s*\([^\{]+', content)
            report.append(f"- **{name}**: Found breakpoints: {', '.join(media_queries).strip()}")
            if not any('landscape' in mq for mq in media_queries):
                report.append(f"- **{name}**: Missing landscape media queries.")

    # 3. JS Analysis
    report.append("\n## 3. JS Analysis (Console, Errors, Fetch)\n")
    for js in js_files:
        with open(js, 'r') as f:
            content = f.read()
            name = os.path.relpath(js, frontend_dir)
            
            consoles = len(re.findall(r'console\.', content))
            if consoles > 0:
                report.append(f"- **{name}**: Found {consoles} console logs.")
                
            fetches = len(re.findall(r'fetch\(', content))
            catch_blocks = len(re.findall(r'\.catch\(', content)) + len(re.findall(r'catch\s*\(', content))
            if fetches > catch_blocks:
                report.append(f"- **{name}**: Found {fetches} fetch calls but only {catch_blocks} catch blocks. Possible unhandled rejections.")

    # 4. Check for top-level files
    report.append("\n## 4. Root Files\n")
    for f in ['manifest.json', 'robots.txt', 'sitemap.xml']:
        if not os.path.exists(os.path.join(frontend_dir, f)):
            report.append(f"- Missing `{f}`")

    with open('/home/weenzox62/nur-quran/frontend/audit_report.md', 'w') as f:
        f.write('\n'.join(report))

if __name__ == "__main__":
    analyze()
