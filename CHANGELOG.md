# Changelog

All notable changes to the Noor Al-Quran platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] — 2026-11-18 · Complete Production Hardening Release

### 🛡️ Security & AppSec
- **SEC-01:** Replaced localhost:8000 hardcoded endpoints with dynamic `API_BASE` resolution based on environment and port.
- **SEC-02:** Global security headers deployed across all Netlify routes (`/*`) including CSP, HSTS, `X-Content-Type-Options: nosniff`, and `Permissions-Policy`.
- **SEC-03, SEC-04:** Eliminated innerHTML XSS vulnerabilities in Hadith collections, Daily Dua, Tasbih, and Bookmarks using DOM-safe helpers and event delegation.
- **SEC-05:** Upgraded all backend dependencies (Django 6.1.3, DRF 3.18.3, Gunicorn 23.0.0, psycopg2-binary 2.9.13).
- **SEC-06:** Cryptographic secret key enforcement (>= 50 chars when `DEBUG=False`), blocking `django-insecure-` prefix in production.
- **SEC-11:** Removed 98,375 lines of checked-in staticfiles from git repository tracking.
- **SEC-12:** Cleaned up `.env` secrets from git index, provided fully documented `.env.example`.

### ⚡ Reliability, Offline & Performance
- **PERF-01:** Built native IndexedDB store (`idb-store.js`) caching all 114 Quran surahs, multi-lingual translations, and hadiths with one-click download progress.
- **PERF-02:** Service Worker v2.0 with Network-First strategy for HTML navigation, graceful fallback to `offline.html`, and Stale-While-Revalidate for static assets.
- **PERF-03:** Tuned Gunicorn worker pool to `gthread` (2 workers, 4 threads, 30s timeout) preventing I/O thread starvation.
- **PERF-04:** Dynamic MD5 asset hash versioning script (`version-assets.mjs`) synchronized across all 27 HTML pages.
- **PERF-06:** FileBasedCache / DatabaseCache fallback when Redis is unconfigured.
- **PERF-07:** Database composite index on `Bookmark(user, -created_at)` for instant bookmark retrieval.

### 🎙️ Audio Engine & Reciters
- **ARCH-01:** Unified singleton `NoorAudioManager` managing a single `HTMLAudioElement`, multi-mirror cascades, MediaSession API, speed and loop modes.
- **ARCH-02:** Replaced 2,780 lines of duplicate reciter templates with unified `frontend/pages/reciter.html?id=...` and 301 Netlify redirects.
- **FUNC-03:** Corrected Saad Al-Ghamdi audio mapping to authentic EveryAyah and MP3Quran servers.
- **FUNC-04:** Basmala display fix: Surah 1 has Basmala as Ayah 1 (no duplicate header); Surah 9 has no Basmala; Surahs 2-114 display decorative Basmala.
- **FUNC-06:** Race condition prevention in ayah and surah transitions via request IDs and async `openS()` completion awaiting.
- **FUNC-07:** Available surahs catalog check (`reciter-availability.json`); disabled missing surahs with "Soon · Скоро" badge avoiding 404 errors.

### 📱 UX, Accessibility, SEO & Legal
- **UX-01:** Fixed iOS safe area insets on `.abar` and `.adhan` bottom bars (`viewport-fit=cover`).
- **UX-02:** Generated true raster PNG icons (192x192, 512x512, maskable, apple-touch-icon, favicon.ico).
- **UX-03:** Generated 1200x630 `og-preview.png` for Telegram, WhatsApp, Twitter, and Facebook rich preview cards.
- **UX-04:** Comprehensive `sitemap.xml` and `robots.txt` covering all active application pages.
- **UX-05, UX-08:** Published localized `privacy.html` and `terms.html` with explicit canonical sources attribution (Uthmani, Kuliev, Asad, Sodik).
- **UX-06, UX-07:** Touch targets enlarged to >= 44x44px; screen-reader accessible form labels (`.sr-only`) and autocomplete attributes added.
- **FUNC-05:** Qibla compass iOS permission request (`DeviceOrientationEvent.requestPermission()`) and modal coordinate input.
- **CODE-05, CODE-06:** Expanded `i18n.js` to >80 keys with full RU/EN/UZ parity and real-time `langChange` event dispatch.

### 🧪 QA & CI/CD
- **BUILD-03:** Added root `package.json` with automated test runners and build scripts.
- **BUILD-04:** Expanded Django test suite to 36 tests with **92% line coverage** across views, serializers, models, and middleware.
- **CI:** Built GitHub Actions CI pipeline running backend quality checks, Ruff PEP 8 linting, `check --deploy`, and frontend tests.
