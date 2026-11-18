# 🚀 Production Deployment Guide — Noor Al-Quran

This guide covers complete production deployment of Noor Al-Quran across:
1. **Frontend:** Netlify / Vercel / Cloudflare Pages / Static CDN
2. **Backend:** Render / Railway / Fly.io / Ubuntu Linux VPS (Nginx + Gunicorn)
3. **Database:** PostgreSQL (Neon, Supabase, AWS RDS, DigitalOcean)

---

## 📋 Production Environment Variables

Copy `.env.example` to `.env` or set these in your deployment platform dashboard:

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `DJANGO_DEBUG` | **Yes** | Must be `False` in production | `False` |
| `SECRET_KEY` | **Yes** | Cryptographically secure key (>= 50 chars) | *(generate via `python -c "import secrets; print(secrets.token_urlsafe(50))"`)* |
| `ALLOWED_HOSTS` | **Yes** | Comma-separated list of backend hostnames | `api.noor-alquran.com,noor-backend.onrender.com,localhost` |
| `CORS_ALLOWED_ORIGINS` | **Yes** | Comma-separated list of frontend HTTPS URLs | `https://noor-al-quran.netlify.app,https://noor-alquran.com` |
| `DATABASE_URL` | Optional | PostgreSQL connection string | `postgres://user:pass@ep-xyz.neon.tech/noorquran?sslmode=require` |
| `REDIS_URL` | Optional | Redis connection URL for caching external APIs | `redis://default:pass@redis-server:6379/0` |
| `SECURE_SSL_REDIRECT` | Optional | Enforce HTTPS redirect (`True` by default) | `True` |

---

## 🌐 1. Frontend Deployment (Netlify)

1. Connect your GitHub repository to **Netlify**.
2. Set **Publish directory**: `frontend`
3. Netlify will automatically detect:
   - `netlify.toml` — sets strict security headers (`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`), cache policies, and 301 redirects for reciter pages.
   - `frontend/_redirects` — fallback redirects for legacy URLs.
4. Ensure asset hashing is up to date:
   ```bash
   npm run version-assets
   ```
5. Deploy branch: `main` or `master`.

---

## 🐍 2. Backend Deployment (Render / Railway)

1. Connect repository to **Render** or **Railway**.
2. Select **Web Service** with **Python 3.12+** runtime.
3. Build command:
   ```bash
   pip install -r backend/requirements.txt && python backend/manage.py collectstatic --noinput && python backend/manage.py migrate
   ```
4. Start command:
   ```bash
   gunicorn config.wsgi:application --worker-class gthread --workers 2 --threads 4 --timeout 30 --max-requests 1000 --max-requests-jitter 100 --bind 0.0.0.0:$PORT
   ```
5. Add all required environment variables from the table above.
6. Verify deployment health check:
   ```bash
   curl -I https://<your-backend-url>/api/health/
   ```
   Should return `HTTP/1.1 200 OK` with JSON `{"status": "ok", "version": "2.0.0"}`.

---

## 🖥️ 3. Linux VPS Deployment (Nginx + Gunicorn + Systemd)

### Systemd Service (`/etc/systemd/system/noor-backend.service`):
```ini
[Unit]
Description=Noor Al-Quran Gunicorn Daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/nur-quran/backend
EnvironmentFile=/var/www/nur-quran/.env
ExecStart=/var/www/nur-quran/.venv/bin/gunicorn config.wsgi:application \
          --worker-class gthread \
          --workers 2 \
          --threads 4 \
          --timeout 30 \
          --bind 127.0.0.1:8000

Restart=always

[Install]
WantedBy=multi-user.target
```

### Nginx Configuration:
```nginx
server {
    listen 80;
    server_name api.noor-alquran.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.noor-alquran.com;

    ssl_certificate /etc/letsencrypt/live/api.noor-alquran.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.noor-alquran.com/privkey.pem;

    location /static/ {
        alias /var/www/nur-quran/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_connect_timeout 5s;
        proxy_read_timeout 35s;
    }
}
```

---

## 🔒 4. Post-Deployment Verification Checklist

- [ ] `check --deploy`: returns 0 issues
- [ ] `/api/health/`: returns `{"status": "ok"}`
- [ ] Rate limiting: 6th POST request to `/api/auth/login/` within 60s returns `HTTP 429 Too Many Requests`
- [ ] Mixed Content: no `http://localhost` warnings in browser developer tools
- [ ] PWA: Service Worker v2 registers and caches static assets; offline mode functions in Airplane Mode
- [ ] Audio: EveryAyah and MP3Quran stream smoothly without CORS or Mixed Content errors
