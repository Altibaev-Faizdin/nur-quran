import re

path = "/home/weenzox62/nur-quran/frontend/shared.css"
with open(path, 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Add safe-area to top nav
# Find `nav{` and add safe-area
css = re.sub(
    r'nav\{',
    r'nav{padding-top: max(15px, env(safe-area-inset-top)); padding-left: max(48px, env(safe-area-inset-left)); padding-right: max(48px, env(safe-area-inset-right)); ',
    css, count=1
)

# 2. Add safe-area to bottom bars (.abar, .adhan)
css = re.sub(
    r'\.abar\{',
    r'.abar{padding-bottom: max(12px, env(safe-area-inset-bottom)); padding-left: max(48px, env(safe-area-inset-left)); padding-right: max(48px, env(safe-area-inset-right)); ',
    css, count=1
)
css = re.sub(
    r'\.adhan\{',
    r'.adhan{padding-bottom: max(12px, env(safe-area-inset-bottom)); padding-left: max(48px, env(safe-area-inset-left)); padding-right: max(48px, env(safe-area-inset-right)); ',
    css, count=1
)

# 3. Add landscape media query
landscape_mq = """
@media (max-height: 500px) and (orientation: landscape) {
  nav { padding: max(10px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)); }
  .nav-links { display: none; }
  .sec { padding: 40px 18px; }
  .pbar, .adhan { padding-bottom: max(10px, env(safe-area-inset-bottom)); }
  .abar { padding-bottom: max(10px, env(safe-area-inset-bottom)); }
  .moon { width: 50px; height: 50px; top: 40px; }
  footer { padding: 24px 18px; }
}
"""

css += "\n" + landscape_mq

with open(path, 'w', encoding='utf-8') as f:
    f.write(css)

print("shared.css updated")
