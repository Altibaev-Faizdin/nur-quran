# 🌙 Noor Al-Quran — نور القرآن

[![Release](https://img.shields.io/badge/release-v1.0.0--production-gold.svg)](https://github.com/Altibaev-Faizdin/nur-quran/releases)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success.svg)](frontend/manifest.json)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A high-performance, production-ready web application providing Quranic texts, audio recitations, prayer times, Qibla compass, and more. 
Built with a **Django REST Framework** backend and a modern, accessible **Vanilla HTML5/CSS3/ES6+** frontend.

---

## ✨ Features

- 📖 **Quran Reader** — All 114 Surahs with verified Uthmani Arabic text, translations (EN, RU, UZ), transliteration, and deep-linking.
- 🎛️ **Reading Controls** — Dynamic font resizer (A- / A+), Tashkeel ligatures (`Amiri`, `Scheherazade New`), and view toggles (*Arabic only*, *With translation*, *Transliteration*).
- 🎧 **Sticky Global Audio Player** — Continuous playback with active ayah highlighting (`.ac.playing`), smooth scroll tracking, playback speed cycling (`0.75x`, `1x`, `1.25x`, `1.5x`), memorization repeat modes (1x, 3x, ∞), and full **MediaSession API** integration for lockscreen control.
- 🎙️ **Reciters Catalog** — High-quality recitations from Mishary Alafasy, Abdul Basit, Saad Al-Ghamdi, Maher Al Muaiqly, El-Minshawi, and more.
- 🕐 **Prayer Times & Offline Fallback** — Automatic location-based prayer calculation with astronomical mathematical fallback in pure JS when offline.
- ⚡ **PWA & Offline First** — Service Worker (`sw.js`) with Stale-While-Revalidate caching for instant loads and network-first API caching.
- 🛡️ **Hardened Security** — Content Security Policy (CSP), strict CORS/CSRF cookies, rate-limiting (5 req/min on `/api/auth/`), and seamless JWT Token Rotation.
- 💎 **Premium UI/UX** — CSS Shimmer skeleton loading screens, state boundary screens, iOS/Android glassmorphic bottom navigation with haptic feedback, and a unified Toast notification system.
- 🔖 **Cloud Bookmarks** — Secure user bookmarks synced via JWT authentication.
- 📿 **Tasbih & Tools** — Digital dhikr counter with vibration feedback, Qibla compass with GPS/manual coordinates, Hijri calendar, and Daily Duas.
- 📤 **Social Sharing** — One-click Ayah and Qibla sharing with Web Share API and clipboard fallback.

---

## 🛠️ Requirements
- **Python 3.8+** (Tested on Python 3.11)
- **PostgreSQL** (Recommended for Production) or SQLite (Development)
- **Redis** (Optional, for caching external API calls)

---

## 💻 Local Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/nur-quran.git
cd nur-quran
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Configure your `.env` file (see Environment Variables section). Then apply migrations and start the server:
```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```
✅ Backend running at: **http://localhost:8000**

### 3. Frontend Setup (New Terminal)
Serve the static frontend files using a local HTTP server:
```bash
cd frontend
python3 -m http.server 3000
```
✅ Frontend available at: **http://localhost:3000**

---

## 🐳 Docker Setup (Optional)
If you prefer using Docker, you can create a `docker-compose.yml` that builds the backend using gunicorn and serves the static frontend via Nginx. *(Dockerfiles not included by default to keep the repo lightweight, but standard Python/Nginx images work out-of-the-box).*

---

## 🚀 Deployment (Production)

This project is fully ready for deployment on platforms like **Render**, **Railway**, or a standard **Ubuntu / Linux VPS**.

### Deployment Checklist:
1. Set `DEBUG=False` in your production environment.
2. Set a secure, random `SECRET_KEY`.
3. Provide your `DATABASE_URL` (PostgreSQL).
4. Provide `ALLOWED_HOSTS` (e.g. `yourdomain.com`).
5. Run migrations: `python manage.py migrate`.
6. Collect static files: `python manage.py collectstatic`.

**Procfile (For Render/Railway):**
```text
web: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```
The backend uses **WhiteNoise** to automatically serve static files.


---
Made with ❤️ for the Ummah · Free Forever
