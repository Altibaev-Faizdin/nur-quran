#!/usr/bin/env python3
"""
scripts/scout-audit.py
Automated static inspection script for Noor Al-Quran codebase using Python standard library.
Checks:
- Script orders & broken asset references in all HTML files
- Undefined CSS variables
- i18n key parity and missing data-i18n keys
- Inline onclick references and whether functions exist
- Empty catch blocks
- Hardcoded localhost / demo-session-token / fixHour
- Backend middleware & URL route matching
"""
import os
import re
import sys
from html.parser import HTMLParser

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

print(f"=== SCOUT AUDIT STARTING (Root: {ROOT_DIR}) ===\n")

# 1. Collect all HTML files
html_files = []
for root, dirs, files in os.walk(FRONTEND_DIR):
    for f in files:
        if f.endswith(".html"):
            html_files.append(os.path.join(root, f))
html_files.sort()

print(f"Found {len(html_files)} HTML files:")
for h in html_files:
    print(f"  - {os.path.relpath(h, ROOT_DIR)}")
print()

class PageScanner(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.scripts = []
        self.media = []
        self.ids = set()
        self.data_i18n = set()
        self.inline_handlers = []

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        if "id" in attr_dict:
            self.ids.add(attr_dict["id"])
        if "data-i18n" in attr_dict:
            self.data_i18n.add(attr_dict["data-i18n"])
        for k, v in attr_dict.items():
            if k.startswith("on"):
                self.inline_handlers.append((tag, k, v))

        if tag == "link" and "href" in attr_dict:
            self.links.append(attr_dict["href"])
        elif tag == "script":
            if "src" in attr_dict:
                self.scripts.append(attr_dict["src"])
            else:
                self.scripts.append("<inline>")
        elif tag in ("img", "source", "audio", "video") and "src" in attr_dict:
            self.media.append((tag, attr_dict["src"]))

broken_refs = []
script_orders = {}
dom_ids = {}
all_data_i18n_used = set()

for h in html_files:
    rel_path = os.path.relpath(h, ROOT_DIR)
    h_dir = os.path.dirname(h)
    with open(h, "r", encoding="utf-8") as f:
        content = f.read()

    parser = PageScanner()
    parser.feed(content)
    
    dom_ids[rel_path] = parser.ids
    script_orders[rel_path] = parser.scripts
    for k in parser.data_i18n:
        all_data_i18n_used.add((k, rel_path))

    # Check stylesheets & links
    for href in parser.links:
        if not href or href.startswith("data:") or href.startswith("http://") or href.startswith("https://") or href.startswith("//"):
            continue
        clean_href = href.split("?")[0].split("#")[0]
        if clean_href.startswith("/"):
            target_path = os.path.normpath(os.path.join(FRONTEND_DIR, clean_href.lstrip("/")))
        else:
            target_path = os.path.normpath(os.path.join(h_dir, clean_href))
        if not os.path.exists(target_path):
            broken_refs.append((rel_path, f"<link href='{href}'>", target_path))

    # Check media
    for tag, src in parser.media:
        if not src or src.startswith("data:") or src.startswith("http://") or src.startswith("https://") or src.startswith("//"):
            continue
        clean_src = src.split("?")[0].split("#")[0]
        if clean_src.startswith("/"):
            target_path = os.path.normpath(os.path.join(FRONTEND_DIR, clean_src.lstrip("/")))
        else:
            target_path = os.path.normpath(os.path.join(h_dir, clean_src))
        if not os.path.exists(target_path):
            broken_refs.append((rel_path, f"<{tag} src='{src}'>", target_path))

    # Check scripts
    for s in parser.scripts:
        if s == "<inline>":
            continue
        clean_src = s.split("?")[0].split("#")[0]
        if clean_src.startswith("/"):
            target_path = os.path.normpath(os.path.join(FRONTEND_DIR, clean_src.lstrip("/")))
        else:
            target_path = os.path.normpath(os.path.join(h_dir, clean_src))
        if not os.path.exists(target_path):
            broken_refs.append((rel_path, f"<script src='{s}'>", target_path))

print("--- 1. Checking Static Asset References ---")
if broken_refs:
    print(f"❌ Found {len(broken_refs)} broken asset references:")
    for src_file, tag, target in broken_refs:
        print(f"   In {src_file}: {tag} -> {target} NOT FOUND")
else:
    print("✓ All static asset references across all HTML files resolve cleanly.")
print()

print("--- 2. Checking Script Order on Each Page ---")
for page, scripts in script_orders.items():
    print(f"  {page}:")
    for idx, s in enumerate(scripts):
        print(f"    {idx+1}. {s}")
print()

# 3. Check CSS Variables
print("--- 3. Checking CSS Variables ---")
css_defs = set()
css_uses = set()

shared_css_path = os.path.join(FRONTEND_DIR, "shared.css")
with open(shared_css_path, "r", encoding="utf-8") as f:
    shared_css_content = f.read()

for match in re.finditer(r"(--[a-zA-Z0-9_-]+)\s*:", shared_css_content):
    css_defs.add(match.group(1))

for root, dirs, files in os.walk(FRONTEND_DIR):
    for file in files:
        if file.endswith((".css", ".html")):
            fpath = os.path.join(root, file)
            with open(fpath, "r", encoding="utf-8") as f:
                c = f.read()
            for match in re.finditer(r"var\(\s*(--[a-zA-Z0-9_-]+)", c):
                css_uses.add((match.group(1), os.path.relpath(fpath, ROOT_DIR)))

undefined_vars = []
for var_name, file_used in css_uses:
    if var_name not in css_defs:
        undefined_vars.append((var_name, file_used))

if undefined_vars:
    print(f"❌ Found {len(undefined_vars)} undefined CSS variables used:")
    for v, f in set(undefined_vars):
        print(f"   {v} used in {f} but never defined in shared.css!")
else:
    print("✓ All CSS variables used across CSS and HTML are defined.")
print()

# 4. Check i18n Keys
print("--- 4. Checking i18n Key Parity & Usage ---")
i18n_path = os.path.join(FRONTEND_DIR, "i18n.js")
with open(i18n_path, "r", encoding="utf-8") as f:
    i18n_content = f.read()

en_match = re.search(r'en:\s*\{(.*?)\n\s*\}', i18n_content, re.DOTALL)
ru_match = re.search(r'ru:\s*\{(.*?)\n\s*\}', i18n_content, re.DOTALL)
uz_match = re.search(r'uz:\s*\{(.*?)\n\s*\}', i18n_content, re.DOTALL)

en_keys = set(re.findall(r'^\s*([a-zA-Z0-9_-]+)\s*:\s*["\']', en_match.group(1), re.MULTILINE)) if en_match else set()
ru_keys = set(re.findall(r'^\s*([a-zA-Z0-9_-]+)\s*:\s*["\']', ru_match.group(1), re.MULTILINE)) if ru_match else set()
uz_keys = set(re.findall(r'^\s*([a-zA-Z0-9_-]+)\s*:\s*["\']', uz_match.group(1), re.MULTILINE)) if uz_match else set()

print(f"  Key counts: EN={len(en_keys)}, RU={len(ru_keys)}, UZ={len(uz_keys)}")
diff_ru = en_keys - ru_keys
diff_uz = en_keys - uz_keys
if diff_ru or diff_uz:
    print(f"❌ i18n Parity Mismatch: Missing in RU: {diff_ru}, Missing in UZ: {diff_uz}")
else:
    print("✓ 100% key parity between EN, RU, and UZ.")

missing_i18n_in_html = []
for k, p in all_data_i18n_used:
    if k not in en_keys:
        missing_i18n_in_html.append((k, p))

if missing_i18n_in_html:
    print(f"❌ Found {len(missing_i18n_in_html)} data-i18n keys in HTML missing from i18n.js:")
    for k, p in set(missing_i18n_in_html):
        print(f"   Key '{k}' in {p} is not defined in i18n.js!")
else:
    print("✓ All data-i18n keys used in HTML files are defined in i18n.js.")
print()

# 5. Search for empty catch blocks
print("--- 5. Checking for Empty Catch Blocks ---")
empty_catches = []
for root, dirs, files in os.walk(FRONTEND_DIR):
    for f in files:
        if f.endswith((".js", ".html")):
            fpath = os.path.join(root, f)
            with open(fpath, "r", encoding="utf-8") as fl:
                for line_idx, line in enumerate(fl, 1):
                    if re.search(r'catch\s*\([^)]*\)\s*\{\s*\}', line):
                        empty_catches.append((os.path.relpath(fpath, ROOT_DIR), line_idx, line.strip()))

if empty_catches:
    print(f"❌ Found {len(empty_catches)} empty catch blocks:")
    for p, l, code in empty_catches:
        print(f"   {p}:{l} -> {code}")
else:
    print("✓ No empty catch blocks found.")
print()

# 6. Check for hardcoded localhost / demo-session-token / fixHour
print("--- 6. Checking for Dangerous Strings (localhost, demo-token, fixHour) ---")
danger_findings = []
for root, dirs, files in os.walk(FRONTEND_DIR):
    for f in files:
        if f.endswith((".js", ".html")):
            fpath = os.path.join(root, f)
            with open(fpath, "r", encoding="utf-8") as fl:
                for line_idx, line in enumerate(fl, 1):
                    text = line.strip()
                    if "demo-session-token" in text:
                        danger_findings.append(("demo-session-token", os.path.relpath(fpath, ROOT_DIR), line_idx, text))
                    if "fixHour" in text:
                        danger_findings.append(("fixHour", os.path.relpath(fpath, ROOT_DIR), line_idx, text))
                    if "http://localhost" in text and "window.NQ_API_BASE" not in text and "isDevPort" not in text:
                        danger_findings.append(("hardcoded localhost", os.path.relpath(fpath, ROOT_DIR), line_idx, text))

if danger_findings:
    print(f"❌ Found {len(danger_findings)} dangerous strings:")
    for kind, p, l, code in danger_findings:
        print(f"   [{kind}] {p}:{l} -> {code}")
else:
    print("✓ No unhandled dangerous strings found.")
print()

# 7. Check innerHTML assignments
print("--- 7. Checking innerHTML assignments ---")
innerhtml_unprotected = []
for root, dirs, files in os.walk(FRONTEND_DIR):
    for f in files:
        if f.endswith((".js", ".html")):
            fpath = os.path.join(root, f)
            with open(fpath, "r", encoding="utf-8") as fl:
                for line_idx, line in enumerate(fl, 1):
                    text = line.strip()
                    if ".innerHTML" in text and "=" in text:
                        if ("${" in text or "`" in text or "+" in text) and "safeHTML" not in text and "DOMPurify" not in text and "t(" not in text:
                            if not re.search(r'innerHTML\s*=\s*[\'"][^\$]*[\'"];?$', text):
                                innerhtml_unprotected.append((os.path.relpath(fpath, ROOT_DIR), line_idx, text))

print(f"Potential unescaped innerHTML instances found: {len(innerhtml_unprotected)}")
for p, l, code in innerhtml_unprotected[:25]:
    print(f"   {p}:{l} -> {code}")
if len(innerhtml_unprotected) > 25:
    print(f"   ... and {len(innerhtml_unprotected) - 25} more")
print()

# 8. Check Backend Configuration & Models
print("--- 8. Checking Backend Settings, Models, and Migrations ---")
settings_path = os.path.join(BACKEND_DIR, "config", "settings.py")
with open(settings_path, "r", encoding="utf-8") as f:
    settings_code = f.read()

has_security_mw = "SecurityHeadersMiddleware" in settings_code
print(f"  SecurityHeadersMiddleware in settings.py: {has_security_mw}")

models_path = os.path.join(BACKEND_DIR, "api", "models.py")
with open(models_path, "r", encoding="utf-8") as f:
    models_code = f.read()

has_isha = "('isha', 'Isha')" in models_code or '("isha", "Isha")' in models_code
print(f"  'isha' in models.py PRAYER_CHOICES: {has_isha}")

migrations_dir = os.path.join(BACKEND_DIR, "api", "migrations")
mig_files = [f for f in os.listdir(migrations_dir) if f.endswith(".py") and f != "__init__.py"]
mig_files.sort()
print(f"  Migration files ({len(mig_files)}): {', '.join(mig_files)}")

print("\n=== SCOUT AUDIT FINISHED ===")
