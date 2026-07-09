# 🌙 Noor Al-Quran — نور القرآن

A comprehensive web application providing Quranic texts, audio recitations, prayer times, and more. 
Built with a **Django REST Framework** backend and a lightweight **Vanilla HTML/CSS/JS** frontend.

---

## ✨ Features
- 📖 **Quran** — All 114 Surahs with Arabic text, translations (EN, RU, UZ), and deep-linking support.
- 🎙️ **10 Reciters** — High-quality audio recitations (e.g. Mishary Alafasy, Abdul Basit, Saad Al-Ghamdi, etc).
- 🕐 **Prayer Times** — Geolocation-based prayer times with Adhan notifications.
- 📜 **Hadith** — Read Hadiths from various collections.
- 📿 **Tasbih Counter** — Digital dhikr counter with auto-saving.
- 🔖 **Bookmarks** — Save your favorite ayahs with secure JWT authentication.
- 🤲 **Daily Dua & 99 Names of Allah** — Essential supplications.
- 🕋 **Qibla Compass** — Find the direction to Mecca.

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
The frontend requires a proxy to avoid CORS issues locally while communicating with the backend. Use the provided proxy script:
```bash
cd frontend
python3 run_local.py
```
✅ Frontend available at: **http://localhost:8080**

---

## 🐳 Docker Setup (Optional)
If you prefer using Docker, you can create a `docker-compose.yml` that builds the backend using gunicorn and serves the static frontend via Nginx. *(Dockerfiles not included by default to keep the repo lightweight, but standard Python/Nginx images work out-of-the-box).*

---

## 🚀 Deployment (Production)

This project is fully ready for deployment on platforms like **Render**, **Railway**, or a standard **Ubuntu VPS**.

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

## 🔐 Environment Variables (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key (Required in Prod) | `your-long-random-string` |
| `DEBUG` | Enable debug mode (True/False) | `False` |
| `DATABASE_URL` | Database connection string | `postgres://user:pass@host:5432/db` |
| `REDIS_URL` | Redis URL for caching (Optional) | `redis://127.0.0.1:6379/1` |
| `ALLOWED_HOSTS` | Comma-separated allowed domains | `api.nurquran.com,localhost` |
| `CORS_ALLOWED_ORIGINS`| Allowed frontend origins | `https://nurquran.com` |

---
Made with ❤️ for the Ummah · Free Forever
