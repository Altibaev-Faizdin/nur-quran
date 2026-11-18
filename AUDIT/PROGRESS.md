# AUDIT/PROGRESS.md — Трекер выполнения задач

**Текущий статус:** Фаза 2 завершена, переходим к Фазе 3 (Offline / PWA / Reliability)  
**Ветка:** `prod-hardening`  
**Дата старта:** 18 ноября 2026  

---

## Чек-лист задач

### ФАЗА 0: Подготовка
- [x] Изучить отчёты аудита `AUDIT/*.md`
- [x] Создать ветку `prod-hardening`
- [x] Создать `AUDIT/DECISIONS.md`
- [x] Создать `AUDIT/OWNER_ACTIONS.md`
- [x] Создать `AUDIT/PROGRESS.md`
- [x] Зафиксировать базовую линию в `AUDIT/FIX_LOG.md` (установка, тесты, ruff, check)

### ФАЗА 1: Корректность и сборка
- [x] BUILD-01: Обновление psycopg2-binary / psycopg 3.x в `backend/requirements.txt`
- [x] BUILD-02: Безопасный dev-ключ при DEBUG=True, строгая проверка SECRET_KEY >= 50 символов без 'django-insecure-' при DEBUG=False
- [x] FUNC-01: Модель PrayerNotification: добавить 'isha' в PRAYER_CHOICES, создать миграцию, обновить сериализаторы, админку, фронтенд
- [x] Решение по уведомлениям: локальные Notification API в открытой/фоновой вкладке с честной подписью в UI
- [x] FUNC-08 + FUNC-02: Расчёт времени намаза в shared.js (fixHour -> fixAngle mod 360, PRAYER_METHODS, высокие широты OneSeventh, IANA timezone)
- [x] Верификационные Node-тесты расчёта намаза (Бишкек, Москва, Астана, Лондон, Мекка на 21 июня и 21 декабря с допуском ±2 мин)
- [x] FUNC-03: Проверка чтеца Гамиди и всех 10 чтецов (имя ↔ id ↔ работающий URL)
- [x] Закладки: валидация ayah_number по реальной таблице аятов (114 сур, сумма 6236). Индекс (user, -created_at) + миграция
- [x] ARCH-03: Единая функция даты Хиджры на фронтенде (шапка + hijri.html: Intl islamic-umalqura + ручная коррекция ±2 дня + fallback /api/hijri-date/)
- [x] Backend тесты: покрытие >= 90%, 100% зеленых тестов (prayer-times, hijri-date, names, surahs с моками, validate_adhan_reciter, refresh токенов, rate limit, isha, невалидные аяты, удаление аккаунта, смена пароля)
- [x] BUILD-05: `ruff check backend/ --fix` + `ruff format` (0 замечаний)

### ФАЗА 2: Безопасность
- [x] SEC-01: Удаление всех `localhost:8000` из фронтенда. Единый API_BASE ('/api' в проде, автоопределение локально). Полное удаление demo-session-token. Закладки оффлайн с бейджем "Локально"
- [x] Секреты: `.env.example`, `.gitignore` (.env, db.sqlite3, staticfiles, etc.). SEC-11: `git rm -r --cached backend/staticfiles`
- [x] SEC-02: `netlify.toml` заголовки для `/*` (CSP, Permissions-Policy, HSTS, frame-ancestors, etc.). Устранение inline onclick и небезопасных скриптов
- [x] Middleware: регистрация SecurityHeadersMiddleware в MIDDLEWARE
- [x] SEC-03/04/09: Аудит всех innerHTML (safeHTML / textContent / createElement). Тест на проверку отсутствия небезопасного innerHTML
- [x] SEC-05: Обновление зависимостей (Django LTS, gunicorn >= 23, httpx, DRF, etc.)
- [x] SEC-06: CORS/CSRF/ALLOWED_HOSTS из env с безопасными дефолтами (nur-quran и nuur-quran, netlify и onrender)
- [x] SEC-08: Валидация параметров (lat, lng, method) с защитой от Cache DoS (округление до 2 знаков, 400 на невалидные)
- [x] SEC-07: Токены (access 15 мин, refresh 7 дней, ротация, blacklist, авто-refresh, корректный logout)
- [x] SEC-10: Эндпоинты смены пароля, удаления аккаунта (`DELETE /api/auth/me/`), документация SMTP для сброса пароля
- [x] Продовые настройки Django: `python manage.py check --deploy` -> 0 предупреждений
- [x] Throttling: учёт прокси (X-Forwarded-For / NUM_PROXIES)

### ФАЗА 3: Offline / PWA / Надёжность
- [ ] PERF-02: Service Worker (sw.js): версионированный кэш, Network-First для навигации, offline.html, stale-while-revalidate для статики, не кэшировать auth
- [ ] PERF-01: Офлайн-Коран: IndexedDB хранилище, чтение офлайн, кнопка "Скачать Коран для офлайна" с прогрессом и квотой
- [ ] Хадисы: загрузка по разделам/книгам, кэширование в IndexedDB
- [ ] PERF-03: Procfile/gunicorn: gthread, timeout, max-requests; httpx timeout 3.5с с ретраями; /api/health/ эндпоинт
- [ ] PERF-06: FileBasedCache или DatabaseCache при отсутствии Redis
- [ ] PERF-04: scripts/version-assets.mjs (хеш содержимого -> ?v=hash во всех HTML)
- [ ] PERF-08: StorageManager (nq_ префикс, версия, try/catch, миграция)
- [ ] CODE-08: Курсор на requestAnimationFrame со спящим режимом, отключение на touch и prefers-reduced-motion. Логгер вместо console.log

### ФАЗА 4: Аудио и Чтецы
- [ ] ARCH-01: Единый NoorAudioManager (один HTMLAudioElement, очередь, режимы ayah/surah, MediaSession, повтор, скорость)
- [ ] CODE-04: Обработка всех пустых catch (play().catch, NotAllowedError, автоплей)
- [ ] PERF-05: Каскад аудио-зеркал для всех 10 чтецов (проверено на сурах 1, 2, 114)
- [ ] quran.html: воспроизведение выбранным пользователем чтецом
- [ ] Устранение race condition при переходах между аятами и сурами (await openS, AbortController)
- [ ] FUNC-07: Доступность сур для каждого чтеца (data/reciter-availability.json, блокировка в UI недоступных сур)
- [ ] reciters.html Quick Play: корректный автопереход
- [ ] FUNC-04: Басмала на уровне отображения (Сура 1 - аят 1 без дубля; Сура 9 - без басмалы; остальные - один раз в заголовке)
- [ ] ARCH-02: Единая страница reciter.html?id=... и 301 редиректы со старых 10 страниц

### ФАЗА 5: UX, i18n, A11y, SEO, Legal
- [ ] UX-01: shared.css .abar/.adhan: разделение padding и safe-area-inset; viewport-fit=cover
- [ ] UX-02: Генерация PNG иконок 192/512 (any, maskable), apple-touch-icon, favicon.ico/png
- [ ] UX-03: Растровое og-preview.png (1200x630), абсолютные URL, twitter карточки
- [ ] UX-04: Полный sitemap.xml и robots.txt со всеми страницами
- [ ] UX-05: privacy.html и terms.html (RU/EN/UZ) с честным описанием сбора данных
- [ ] UX-06/07: Touch targets >= 44px, видимые `<label>`, autocomplete, focus-visible, aria-live, dir="rtl"
- [ ] UX-08: Раздел "О тексте и источниках" с атрибуцией переводов (Кулиев, Асад, Садык)
- [ ] FUNC-05: Кибла: iOS DeviceOrientationEvent.requestPermission(), модалка ручного ввода вместо prompt()
- [ ] i18n (CODE-05/06): диспатч langChange, полный перевод RU/EN/UZ, скрипт валидации паритета ключей
- [ ] Устранение неопределённых CSS переменных, 404.html, NoorApp неймспейс

### ФАЗА 6: Инструменты, тесты, CI, документы
- [ ] frontend/package.json: scripts (lint, test, check, version-assets), devDependencies
- [ ] Node-тесты: намаз, StorageManager, IndexedDB, целостность Корана (114/6236), i18n, Хиджра, санитайзер, sitemap
- [ ] GitHub Actions CI workflow (.github/workflows/ci.yml)
- [ ] README.md, docs/DEPLOY.md, CHANGELOG.md
- [ ] Мониторинг: Sentry интеграция (env DSN, отключено по умолчанию), structured logging

### ФАЗА 7: Финальная верификация
- [ ] Чистая установка с нуля
- [ ] Полный прогон всех проверок и тестов (ruff, coverage >= 90%, check --deploy, npm test/lint, sitemap, i18n, pip-audit)
- [ ] Реальные HTTP curl тесты ко всем эндпоинтам бэкенда
- [ ] Статический аудит кода (grep)
- [ ] Итоговая таблица 50 дефектов в AUDIT/FINAL_FIX_REPORT.md
- [ ] Финальный AUDIT/OWNER_ACTIONS.md
