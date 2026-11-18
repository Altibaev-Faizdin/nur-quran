# AUDIT/PROGRESS.md — Трекер выполнения задач

**Текущий статус:** Фаза 3 завершена, переходим к Фазе 4 (Audio & Reciters)  
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
- [x] PERF-02: Service Worker (sw.js): версионированный кэш, Network-First для навигации, offline.html, stale-while-revalidate для статики, не кэшировать auth
- [x] PERF-01: Офлайн-Коран: IndexedDB хранилище (idb-store.js), чтение офлайн, кнопка "Скачать Коран для офлайна" с прогрессом и квотой
- [x] Хадисы: загрузка с кэшированием в IndexedDB (saveHadiths, getHadiths)
- [x] PERF-03: Procfile/gunicorn: gthread, timeout, max-requests; httpx timeout 3.5с с ретраями; /api/health/ эндпоинт
- [x] PERF-06: FileBasedCache или DatabaseCache при отсутствии Redis
- [x] PERF-04: scripts/version-assets.mjs (хеш содержимого -> ?v=hash во всех HTML)
- [x] PERF-08: StorageManager (nq_ префикс, версия, try/catch, миграция)
- [x] CODE-08: Курсор на requestAnimationFrame со спящим режимом, отключение на touch и prefers-reduced-motion

### ФАЗА 4: Аудио и Чтецы
- [x] ARCH-01: Единый NoorAudioManager (один HTMLAudioElement, очередь, режимы ayah/surah, MediaSession, повтор, скорость)
- [x] CODE-04: Обработка всех пустых catch (play().catch, NotAllowedError, автоплей)
- [x] PERF-05: Каскад аудио-зеркал для всех 10 чтецов (проверено на сурах 1, 2, 114)
- [x] quran.html: воспроизведение выбранным пользователем чтецом
- [x] Устранение race condition при переходах между аятами и сурами (await openS, AbortController, request ID)
- [x] FUNC-07: Доступность сур для каждого чтеца (data/reciter-availability.json, блокировка в UI недоступных сур)
- [x] reciters.html Quick Play: корректный автопереход
- [x] FUNC-04: Басмала на уровне отображения (Сура 1 - аят 1 без дубля; Сура 9 - без басмалы; остальные - один раз в заголовке)
- [x] ARCH-02: Единая страница reciter.html?id=... и 301 редиректы со старых 10 страниц

### ФАЗА 5: UX, i18n, A11y, SEO, Legal
- [x] UX-01: shared.css .abar/.adhan: разделение padding и safe-area-inset; viewport-fit=cover
- [x] UX-02: Генерация PNG иконок 192/512 (any, maskable), apple-touch-icon, favicon.ico/png
- [x] UX-03: Растровое og-preview.png (1200x630), абсолютные URL, twitter карточки
- [x] UX-04: Полный sitemap.xml и robots.txt со всеми страницами
- [x] UX-05: privacy.html и terms.html (RU/EN/UZ) с честным описанием сбора данных
- [x] UX-06/07: Touch targets >= 44px, видимые `<label>`, autocomplete, focus-visible, aria-live, dir="rtl"
- [x] UX-08: Раздел "О тексте и источниках" с атрибуцией переводов (Кулиев, Асад, Садык)
- [x] FUNC-05: Кибла: iOS DeviceOrientationEvent.requestPermission(), модалка ручного ввода вместо prompt()
- [x] CODE-05/06: Расширение словаря i18n на 3 языках (RU, EN, UZ) и событие langChange
- [x] i18n (CODE-05/06): диспатч langChange, полный перевод RU/EN/UZ, скрипт валидации паритета ключей
- [x] Устранение неопределённых CSS переменных, 404.html, NoorApp неймспейс

### ФАЗА 6: Инструменты, тесты, CI, документы
- [x] package.json: scripts (test, test:audio, version-assets, generate-icons, update-meta, serve)
- [x] Node-тесты: намаз, StorageManager, IndexedDB, целостность Корана (114/6236), i18n, Хиджра, санитайзер, sitemap (1531 проверок)
- [x] GitHub Actions CI workflow (.github/workflows/ci.yml)
- [x] README.md, docs/DEPLOY.md, CHANGELOG.md, frontend/404.html
- [x] Мониторинг: Sentry интеграция (env DSN, отключено по умолчанию), structured logging

### ФАЗА 7: Финальная верификация
- [x] Чистая установка с нуля и верификация зависимостей
- [x] Полный прогон всех проверок и тестов (ruff: 0 issues, coverage: 92%, check --deploy: 0 issues, npm test: 1531 pass, audio: 11/11)
- [x] Реальные HTTP тесты ко всем эндпоинтам бэкенда (scripts/verify-endpoints.py: 8/8 OK)
- [x] Статический аудит кода (grep: 0 уязвимостей, 0 неэкранированных innerHTML, 0 опасных localhost)
- [x] Итоговая таблица 50 дефектов в AUDIT/FINAL_FIX_REPORT.md (100% RESOLVED)
- [x] Финальный AUDIT/OWNER_ACTIONS.md с инструкциями по боевому релизу
