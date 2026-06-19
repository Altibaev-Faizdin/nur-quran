# Noor Al-Quran — Complete Setup & Deployment Guide

## Quick Start (5 minutes)

### 1️⃣ Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
✅ API running at http://localhost:8000

### 2️⃣ Frontend Setup (New Terminal)
```bash
cd frontend
python3 -m http.server 3000
```
✅ Site available at http://localhost:3000

## Project Features ✨

- 📖 **Quran** — 114 Surahs with Arabic + English + Russian + Uzbek texts
- 🎙️ **Reciters** — 5 world-renowned Quran reciters with audio playback
- 🕐 **Prayer Times** — Auto-detect location & show daily prayer schedule
- 🕋 **Qibla Compass** — Find Mecca direction with device orientation
- 📿 **Tasbih Counter** — Digital prayer beads with 3 dhikr modes
- 🤲 **Daily Dua** — Authentic supplications from Islamic tradition
- 📅 **Hijri Calendar** — Convert Gregorian to Islamic lunar calendar
- ☪️ **99 Names of Allah** — Asmaul Husna with meanings in 3 languages

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/surahs/` | All 114 surahs |
| GET | `/api/surahs/<n>/?lang=en` | Surah with translation |
| GET | `/api/reciters/` | 5 reciters list |
| GET | `/api/prayer-times/?lat=X&lng=Y` | Prayer times by coordinates |
| GET | `/api/hijri-date/` | Today's Hijri date |
| GET | `/api/names/` | 99 Names of Allah |
| GET/POST | `/api/bookmarks/` | Save verse bookmarks |

## Configuration

### Environment Variables (.env)
```env
SECRET_KEY=your-secret-key-here
DEBUG=True  # Set to False in production
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Deployment

### Using Gunicorn
```bash
pip install gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

### Using Docker
```dockerfile
FROM python:3.10
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

## Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari & Android Chrome

## Security Notes
1. Change `SECRET_KEY` in production
2. Set `DEBUG = False` in production
3. Update `ALLOWED_HOSTS` with your domain
4. Use HTTPS in production
5. Configure proper CORS origins

## Troubleshooting

**API not responding?**
- Check if backend is running: `http://localhost:8000/api/surahs/`
- Verify CORS headers

**Prayer times not loading?**
- Allow location permission in browser
- Check internet connection
- Verify firewall doesn't block api.aladhan.com

**Audio not playing?**
- Check browser audio permissions
- Verify network connection
- Try different reciter

## Credits
Made with ❤️ for the Ummah  
External APIs: Al-Quran Cloud, Aladhan, TVQuran
