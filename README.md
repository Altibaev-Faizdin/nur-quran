# 🌙 Noor Al-Quran — نور القرآن

A comprehensive Islamic web application providing Quranic texts, audio recitations, prayer times, and more.
Built with a **Django REST Framework** backend and a lightweight **Vanilla HTML/CSS/JS** frontend.

---

## ✨ Features
- 📖 **Quran** — All 114 Surahs with Arabic text, translations (EN, RU, UZ), and deep-linking support.
- 🎙️ **9 Reciters** — High-quality MP3 audio recitations (Mishary Alafasy, Abdul Basit, Saad Al-Ghamdi, and more).
- 🕐 **Prayer Times** — Geolocation-based prayer times with Adhan notifications.
- 📜 **Hadith** — Read Hadiths from various collections.
- 📿 **Tasbih Counter** — Digital dhikr counter.
- 🔖 **Bookmarks** — Save your favorite ayahs with secure JWT authentication.
- 🤲 **Daily Dua & 99 Names of Allah** — Essential supplications and divine names.
- 🕋 **Qibla Compass** — Find the direction to Mecca.
- 🌍 **Multilingual** — English, Russian, Uzbek UI.

---

## 🛠️ Requirements
- **Python 3.11+**
- **PostgreSQL** (production) or SQLite (development)
- **Redis** (optional, for caching external API responses)

---

## 💻 Local Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/Altibaev-Faizdin/nur-quran.git
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

Edit `.env` with your values, then:
```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```
✅ Backend running at: **http://localhost:8000**

### 3. Frontend Setup (New Terminal)
```bash
cd frontend
python3 -m http.server 3000
```
✅ Frontend available at: **http://localhost:3000**

---

## 🔐 Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the values:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SECRET_KEY` | **Yes** | Django secret key | `your-50+-char-random-string` |
| `DEBUG` | **Yes** | Enable debug mode | `False` |
| `DATABASE_URL` | **Yes** | Database connection string | `postgres://user:pass@host:5432/db` |
| `ALLOWED_HOSTS` | **Yes (prod)** | Comma-separated allowed domains | `api.nurquran.com` |
| `CORS_ALLOWED_ORIGINS` | **Yes (prod)** | Allowed frontend origins | `https://nurquran.com` |
| `REDIS_URL` | No | Redis URL for caching | `redis://127.0.0.1:6379/1` |
| `SECURE_SSL_REDIRECT` | No | Set `False` behind a reverse proxy (Render/Railway) | `False` |

---

## 🚀 Deployment (Production)

Fully ready for deployment on **Render**, **Railway**, or any standard Linux VPS.

### Deployment Checklist:
1. Set `DEBUG=False`.
2. Set a secure, random `SECRET_KEY` (50+ characters).
3. Provide `DATABASE_URL` (PostgreSQL).
4. Provide `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`.
5. Run: `python manage.py migrate`
6. Run: `python manage.py collectstatic --noinput`

**Procfile:**
```text
web: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

The backend uses **WhiteNoise** to serve static files automatically.

**Frontend:** Deploy the `frontend/` directory to Netlify. Update `netlify.toml` to proxy `/api/*` to your backend URL.

---

## 🧪 Running Tests
```bash
cd backend
source venv/bin/activate
python manage.py test
```

---

## 🏗️ Architecture

```
nur-quran/
├── backend/          # Django REST Framework API
│   ├── api/          # Models, views, serializers, tests
│   ├── config/       # Django settings, WSGI, root URLs
│   └── requirements.txt
├── frontend/         # Static Vanilla HTML/CSS/JS
│   ├── pages/        # Individual feature pages
│   ├── shared.js     # Global logic, auth, API calls
│   ├── shared.css    # Global styles
│   └── i18n.js       # Multilingual support
└── netlify.toml      # Frontend deployment + API proxy config
```

---
Made with ❤️ for the Ummah · Free Forever · No Ads
