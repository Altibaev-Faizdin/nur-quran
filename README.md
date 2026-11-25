# 🌙 Noor Al-Quran — نور القرآن

Islamic PWA providing the Holy Quran (114 Surahs), 10 reciter streams, offline astronomical prayer times, Qibla compass, Hadiths, 99 Names of Allah, Tasbih, Hijri calendar, and synced bookmarks across **RU / EN / UZ**.

- **Backend:** Python 3.12+ · Django 6 · Django REST Framework · SimpleJWT (`HttpOnly` cookie rotation + password-versioned access tokens) · PostgreSQL / SQLite
- **Frontend:** Vanilla HTML5 / CSS3 / ES6+ PWA (Service Worker, IndexedDB `NoorDB`, strict CSP without `'unsafe-inline'`, zero ads/trackers)

---

## 💻 Local Setup (Full-Stack Single Server)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env   # For local dev with HTTP, set DEBUG=True

python backend/manage.py migrate
python backend/manage.py runserver 0.0.0.0:8000
```

Open `http://127.0.0.1:8000/` — Django serves both `/api/*` and the complete `frontend/` PWA cleanly on one origin with `HttpOnly` cookie authentication.

---

## 🧪 Running Tests & Linters

```bash
# Backend checks (Django + Ruff + Coverage)
export DEBUG=False ALLOWED_HOSTS=localhost,127.0.0.1
export SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_urlsafe(52))')"
ruff check backend/ && ruff format --check backend/
python3 backend/manage.py makemigrations --check --dry-run
python3 backend/manage.py check --deploy
PYTHONPATH=backend coverage run backend/manage.py test api && coverage report --fail-under=85 -m

# Frontend QA, Security, Math & Playwright E2E (runs live Django backend)
npm ci
npm run lint
npm run format:check
npm test
npm run test:e2e
npm run test:audio
```

---

## 🚀 Deployment (Render + Netlify)

- **Backend (Render / Gunicorn + PostgreSQL):**
  - Build: `pip install -r backend/requirements.txt && python backend/manage.py collectstatic --noinput && python backend/manage.py migrate`
  - Start (`Procfile`): `cd backend && gunicorn config.wsgi:application --worker-class gthread --workers 2 --threads 4 --timeout 30 --max-requests 1000 --max-requests-jitter 100 --bind 0.0.0.0:$PORT`
  - Health check: `GET /api/health/` -> `{"status": "ok", "app": "Noor Al-Quran", "db": "connected"}`
  - Required env vars (see [`.env.example`](.env.example)): `DEBUG=False`, `SECRET_KEY` (>= 50 chars), `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `DATABASE_URL` (optional: `COOKIE_SECURE`, `COOKIE_SAMESITE`, `NUM_PROXIES=1`, `AUDIO_CDN_BASE`, `REDIS_URL`).
- **Frontend (Netlify):** publish directory `frontend`; root [`netlify.toml`](netlify.toml) enforces strict CSP (zero `'unsafe-inline'`), HSTS, cache headers, 301 legacy reciter redirects, and `/api/*` proxy to backend. Keep hashes synced with `npm run version-assets`.

Licensed under the [MIT License](LICENSE). Free Forever · No Ads.
