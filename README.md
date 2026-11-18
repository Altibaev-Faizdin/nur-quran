# 🌙 Noor Al-Quran — نور القرآن

[![Release](https://img.shields.io/badge/release-v2.0.0--production-gold.svg)](https://github.com/Altibaev-Faizdin/nur-quran/releases)
[![Build & Tests](https://img.shields.io/badge/tests-36%2F36%20passing-brightgreen.svg)](scripts/test-runner.mjs)
[![Coverage](https://img.shields.io/badge/coverage-92%25-brightgreen.svg)](backend/config/settings.py)
[![Code Style](https://img.shields.io/badge/code%20style-ruff-000000.svg)](pyproject.toml)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success.svg)](frontend/manifest.json)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A high-performance, hardened, market-ready Islamic digital platform providing sacred Quranic texts, continuous audio streaming across 10 reciters, high-latitude prayer times, 3D Qibla compass, and canonical Hadiths.
Built with a **Django REST Framework** backend and a lightweight, accessible **Vanilla HTML5/CSS3/ES6+** frontend.

---

## ✨ Architectural Highlights (v2.0.0)

- 📖 **Authentic Quran Reader** — All 114 Surahs with verified Uthmani script (King Fahd Complex / Tanzil.net), certified translations (Elmir Kuliev in Russian, Muhammad Asad in English, Sheikh Muhammad Sodiq in Uzbek), and transliteration.
- 🎙️ **Unified NoorAudioManager** — Single `HTMLAudioElement` singleton with multi-server cascade fallbacks (EveryAyah, Islamic CDN, MP3Quran), race condition prevention, MediaSession API lockscreen integration, and memorization repeat modes (1x, 3x, ∞).
- 🎛️ **Unified Reciter Template (`reciter.html?id=...`)** — Single dynamic template supporting all 10 reciters, with live availability auditing (`reciter-availability.json`) and 301 legacy redirects.
- ⚡ **PWA & Offline First** — Service Worker v2.0 with Network-First navigation caching, native IndexedDB (`NoorDB`) offline Quran storage with real-time download progress, and graceful `offline.html` fallback.
- 🕐 **Astronomical Prayer Calculations** — Offline calculation engine with One-Seventh rule for high-latitude regions (>48°N: Moscow, London, Kazan, Astana) preventing missing timings.
- 🧭 **3D Qibla Compass** — Live gyroscope orientation with iOS `DeviceOrientationEvent.requestPermission()` support, `webkitCompassHeading` accuracy, and in-page modal coordinate input.
- 🛡️ **Hardened AppSec** — Content Security Policy (CSP), strict CORS/CSRF cookies, rate-limiting (5 req/min on `/api/auth/`), cryptographically enforced SECRET_KEY, and zero XSS through safe HTML helpers.
- 🌍 **Full Tri-lingual Localization** — Comprehensive 100% parity across Russian (`ru`), English (`en`), and Uzbek (`uz`) with real-time `langChange` DOM dispatch.
- 🔒 **Transparent Legal & Sources** — Dedicated [`Privacy Policy`](frontend/pages/privacy.html) and [`Terms of Service`](frontend/pages/terms.html) with zero-tracking commitment and authoritative scholarly attributions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python 3.12+, Django 6.1.3, Django REST Framework 3.18.3, WhiteNoise, Gunicorn (gthread) |
| **Frontend** | Vanilla JavaScript (ES6+), CSS3 (Safe-Area Insets, Glassmorphism), HTML5, Service Worker v2, IndexedDB |
| **Audio** | HTML5 Audio, EveryAyah CDN, Islamic Network CDN, MP3Quran CDN, MediaSession API |
| **Security** | Content Security Policy, HSTS, Secure Cookies, PBKDF2/SHA-256 Auth, Rate Limiting |
| **Testing & CI** | Django TestCase (92% coverage), Node.js Custom Test Runner, Ruff, GitHub Actions CI |

---

## 💻 Local Setup & Quickstart

### 1. Clone the repository
```bash
git clone https://github.com/Altibaev-Faizdin/nur-quran.git
cd nur-quran
```

### 2. Backend Setup
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env

# Run migrations
python backend/manage.py migrate

# Start backend server
python backend/manage.py runserver 0.0.0.0:8000
```
✅ Backend running at: **http://localhost:8000** (Health Check: `/api/health/`)

### 3. Frontend Setup
In a new terminal window:
```bash
npm run serve
# Or: python3 -m http.server 3000 --directory frontend
```
✅ Frontend available at: **http://localhost:3000**

---

## 🧪 Testing & Quality Assurance

### Run Frontend Automated Test Suite
```bash
npm test
```
*Verifies 114 surahs, 6236 verses, high-latitude prayer calculations, i18n key parity (RU/EN/UZ), and internal link integrity.*

### Run Backend Tests with Coverage (>= 90%)
```bash
source .venv/bin/activate
coverage run backend/manage.py test api
coverage report -m
```
*Runs all 36 test cases with **92% line coverage**.*

### Run Code Quality Linter
```bash
ruff check backend/
ruff format --check backend/
```

### Run Audio Mirror Verification
```bash
npm run test:audio
```

---

## 🚀 Production Deployment

See complete step-by-step instructions in [docs/DEPLOY.md](docs/DEPLOY.md):
- **Frontend:** Netlify (`netlify.toml` with global CSP and 301 redirects)
- **Backend:** Render / Railway / Fly.io / Linux VPS (Gunicorn + Nginx)
- **Deployment Check:** `python backend/manage.py check --deploy`

---

## 📜 Canonical Islamic Sources & Attribution

- **Holy Quran Arabic Text:** King Fahd Complex for the Printing of the Holy Quran (Madinah Munawwarah) & Tanzil.net.
- **Russian Translation:** Elmir Kuliev (Эльмир Кулиев).
- **English Translation:** Muhammad Asad (*The Message of the Qur'an*) & Abdullah Yusuf Ali.
- **Uzbek Translation:** Sheikh Muhammad Sodiq Muhammad Yusuf (*Tafsiri Hilol*).
- **Audio Archives:** EveryAyah.com & MP3Quran.net across 10 certified Qaris.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
Free Forever · No Ads · Made with ❤️ for the Ummah
