# 🌙 Noor Al-Quran — نور القرآن

Full project: Django REST backend + HTML/CSS/JS frontend

---

## 📁 Structure

```
noor-alquran/
├── backend/              ← Django REST API (Python)
│   ├── config/           ← Settings, URLs
│   ├── api/              ← Views, Models, URLs
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/             ← Pure HTML/CSS/JS
    ├── index.html        ← Homepage
    ├── shared.css        ← All styles
    ├── shared.js         ← All JS logic
    └── pages/
        ├── quran.html    ← 114 Surahs + Audio player
        ├── reciters.html ← 5 Reciters
        ├── prayer.html   ← Prayer times
        ├── tools.html    ← Qibla + Tasbih + Dua + Hijri
        └── names.html    ← 99 Names of Allah
```

---

## 🚀 How to Run

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Step 1 — Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Configure if needed
python manage.py migrate
python manage.py runserver
```
✅ Backend running at: **http://localhost:8000**

### Step 2 — Frontend Setup (New Terminal)
```bash
cd frontend
python3 -m http.server 3000
```
or using Node.js:
```bash
npm install -g http-server
http-server -c-1 -p 3000
```
✅ Frontend available at: **http://localhost:3000**

### Testing
- Quran: http://localhost:3000/pages/quran.html
- Prayer Times: http://localhost:3000/pages/prayer.html
- Reciters: http://localhost:3000/pages/reciters.html
- Tools: http://localhost:3000/pages/dua.html (etc)

---

## 📡 API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/surahs/` | All 114 surahs |
| GET | `/api/surahs/<n>/?lang=en` | Surah with translation |
| GET | `/api/reciters/` | 5 reciters list |
| GET | `/api/prayer-times/?lat=&lng=` | Prayer times |
| GET | `/api/hijri-date/` | Hijri date |
| GET | `/api/names/` | 99 Names of Allah |
| GET/POST | `/api/bookmarks/` | Bookmarks |

---

## ✨ Features
- 📖 Quran — 114 Surahs, Arabic + EN + RU + UZ
- 🎙️ 5 Reciters with audio
- 🕐 Prayer times by location + Adhan alert
- 🕋 Qibla compass
- 📿 Tasbih counter
- 🤲 Daily Dua
- 📅 Hijri calendar
- ☪️ 99 Names of Allah
- 🌙 Night sky design
- 🔖 Bookmarks (saved to Django DB)

Made with ❤️ for the Ummah · Free Forever
