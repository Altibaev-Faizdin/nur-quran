# 🚀 Production Deployment Guide — Noor Al-Quran

Noor Al-Quran deploys seamlessly as:
- **Backend:** Render / Railway / VPS running Django + Gunicorn (`Procfile`) + PostgreSQL (`DATABASE_URL`)
- **Frontend:** Netlify publishing `frontend/` (`netlify.toml` proxies `/api/*` to backend & applies strict CSP)

---

## 📋 Environment Variables

Set these on your backend service (see [`.env.example`](../.env.example)):

| Variable | Required | Notes |
| :--- | :--- | :--- |
| `DEBUG` | Yes | Must be `False` in production |
| `SECRET_KEY` | Yes | Cryptographic string >= 50 characters (fail-fast if absent/weak) |
| `ALLOWED_HOSTS` | Yes | Comma-separated backend hosts (e.g. `nur-quran.onrender.com`) |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated frontend origins (e.g. `https://noor-al-quran.netlify.app`) |
| `DATABASE_URL` | Recommended | PostgreSQL DSN for persistent production storage |
| `COOKIE_SECURE` | Production `True` | `HttpOnly` refresh cookie TLS flag (`True` by default when `DEBUG=False`) |
| `COOKIE_SAMESITE` | Optional | `Lax` (default) or `None` when frontend and backend use separate sites |
| `NUM_PROXIES` | Optional | `1` behind Render / Nginx reverse proxy for accurate throttling |
| `AUDIO_CDN_BASE` | Optional | Base CDN URL overriding custom audio mirror path via `/api/config/` |
| `REDIS_URL` | Optional | Redis URL for shared cache (falls back to FileBasedCache) |

---

## 🌐 1. Frontend (Netlify)

- **Publish directory:** `frontend`
- Root `netlify.toml` enforces strict CSP (no `'unsafe-inline'`), HSTS, `X-Frame-Options: DENY`, cache control, 301 legacy reciter redirects, and `/api/*` proxy to Render.
- Keep asset hashes synced before deploying static changes: `npm run version-assets`.

## 🐍 2. Backend (Render / Gunicorn)

- **Build command:**
  ```bash
  pip install -r backend/requirements.txt && python backend/manage.py collectstatic --noinput && python backend/manage.py migrate
  ```
- **Start command (`Procfile`):**
  ```bash
  cd backend && gunicorn config.wsgi:application --worker-class gthread --workers 2 --threads 4 --timeout 30 --max-requests 1000 --max-requests-jitter 100 --bind 0.0.0.0:$PORT
  ```
- **Health check:** `GET /api/health/` -> `{"status": "ok", "app": "Noor Al-Quran", "db": "connected"}`
