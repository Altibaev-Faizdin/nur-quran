# AUDIT/FIX_LOG.md — Журнал исправлений и доказательств

В данном документе фиксируются реальные логи выполнения команд, результаты тестов, таблицы верификации и замеры до и после исправления дефектов.

---

## 1. Базовое состояние (Baseline) — До исправлений

### 1.1. Проверка запуска без переменных окружения (manage.py check)
```bash
python3 manage.py check
```
**Результат:**
```text
Traceback (most recent call last):
  File "manage.py", line 14, in <module>
    main()
  File "config/settings.py", line 22, in <module>
    raise ValueError("SECRET_KEY environment variable is not set and DEBUG is False.")
ValueError: SECRET_KEY environment variable is not set and DEBUG is False.
```

### 1.2. Проверка сборки зависимостей (pip install -r backend/requirements.txt)
При `psycopg2-binary==2.9.9` сборка wheel падает:
```text
Building wheels for collected packages: psycopg2-binary
  Building wheel for psycopg2-binary (pyproject.toml) ... error
  ./psycopg/psycopg.h:36:10: fatal error: libpq-fe.h: No such file or directory
     36 | #include <libpq-fe.h>
```

### 1.3. Базовый статический анализ (ruff)
Зафиксировано 39 замечаний (F401 неиспользуемые импорты, E501 длина строк, RUF012 мутабельные атрибуты классов в ViewSets, EXE001 флаг manage.py).

---

## 2. Логи выполнения фаз

### 2.1. Фаза 1: Корректность и сборка

#### 2.1.1. Проверка линтера и форматтера (ruff)
```bash
.venv/bin/ruff format --check backend/ && .venv/bin/ruff check backend/
```
**Результат:**
```text
16 files already formatted
All checks passed!
```

#### 2.1.2. Прогон модульных тестов и сбор покрытия (coverage)
```bash
DEBUG=True .venv/bin/coverage run backend/manage.py test api && .venv/bin/coverage report -m
```
**Результат:**
```text
Found 36 test(s).
Creating test database for alias 'default'...
System check identified no issues (0 silenced).
....................................
----------------------------------------------------------------------
Ran 36 tests in 47.362s

OK
Destroying test database for alias 'default'...
Name                                          Stmts   Miss  Cover   Missing
---------------------------------------------------------------------------
backend/api/__init__.py                           0      0   100%
backend/api/management/__init__.py                0      0   100%
backend/api/management/commands/__init__.py       0      0   100%
backend/api/middleware.py                        14      2    86%   24-39
backend/api/models.py                            30      2    93%   24, 51
backend/api/serializers.py                       39      1    97%   151
backend/api/urls.py                               8      0   100%
backend/api/views.py                            210     18    91%   65-72, 168, 189, 975, 1009, 1016-1017, 1084, 1096, 1103-1104, 1133-1134
---------------------------------------------------------------------------
TOTAL                                           301     23    92%
```
Все 36 тестов прошли успешно (100% green), итоговое покрытие API составило **92%** (требование: >= 90%).

#### 2.1.3. Верификация офлайн-расчётов времени намаза
Тестирование алгоритма с нормализацией углов через `fixAngle` (mod 360) на экстремальных и стандартных широтах (Мекка 21.42°N, Москва 55.75°N, Лондон 51.50°N):
- Мекка (метод Umm al-Qura): Fajr 04:11, Sunrise 05:39, Dhuhr 12:22, Asr 15:42, Maghrib 19:06, Isha 20:36 (разница с эталоном AlAdhan: 0 минут).
- Высокие широты (Москва/Лондон): успешно отрабатывает правило `OneSeventh`, устраняя ошибку белых ночей без падений в NaN/null.

#### 2.1.4. Доступность аудиофайлов чтецов (10 чтецов)
Проведена live-валидация доступности сур:
- Mishary, AbdulBaset, Alafasy, Menshawi, Minshawi Mujawwad, Husary, Sudais: 114 из 114 сур на EveryAyah.
- Saad Al-Ghamdi: подтвержден источник EveryAyah (`Ghamadi_40kbps`) и MP3Quran (`server7.mp3quran.net/s_gmd/`).
- Raad Al-Kurdi: 114 сур на MP3Quran (`server6.mp3quran.net/kurdi/`).
- Islam Sobhi: 112 сур на MP3Quran (отсутствуют суры 36 и 45, зафиксировано в UI).
- Sherif Mostafa и Abdurrahman Mossad: локальные высококачественные файлы в `frontend/audio/`.
Матрица доступности сохранена в `frontend/data/reciter-availability.json`.

---

### 2.2. Фаза 2: Безопасность (Security & Hardening)

#### 2.2.1. Автоматический тест безопасности (scripts/verify-security.mjs)
```bash
node scripts/verify-security.mjs
```
**Результат:**
```text
🔒 Starting Security & Hardening Verification...

✅ All security and hardening verification checks PASSED!
```
- Проверено отсутствие жестко закодированных `http://localhost:8000` (заменен на динамический `API_BASE`).
- Проверено полное удаление фиктивного токена `demo-session-token` и тихих fallback-логинов.
- Проверено отсутствие `eval()`, `document.write()`.
- Проверена очистка `backend/staticfiles` из индекса git (`git rm -r --cached`).
- Проверено наличие шаблона конфигурации `.env.example`.

#### 2.2.2. Проверка заголовков безопасности и CSP (netlify.toml)
В `netlify.toml` добавлены глобальные заголовки для `/*`:
- `Content-Security-Policy`: строгие директивы `default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, доверенные CDN и API.
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

#### 2.2.3. Проверка продовой конфигурации Django (check --deploy)
```bash
DEBUG=False SECRET_KEY="<50+ char random key>" ALLOWED_HOSTS="nur-quran.onrender.com" .venv/bin/python backend/manage.py check --deploy
```
**Результат:**
```text
System check identified no issues (0 silenced).
```
0 предупреждений безопасности.

#### 2.2.4. Повторный прогон бэкенд-тестов после Phase 2 правок
```bash
DEBUG=True .venv/bin/python backend/manage.py test api
```
**Результат:**
```text
Ran 36 tests in 40.090s
OK
```
Все 36 тестов пройдены успешно.

---

### 2.3. Фаза 3: Offline / PWA / Надёжность (Reliability)

#### 2.3.1. Архитектура Service Worker v2.0 (frontend/sw.js)
- Заменен ошибочный `Cache-First` для HTML-документов на `Network-First` с фолбэком на кэш и страницу `offline.html`.
- Создана полноценная оффлайн-страница `frontend/pages/offline.html`, стилизованная под единый дизайн приложения, с локализованной навигацией по офлайн-модулям (Коран, Тасбих, Намаз, Закладки).
- Исключены из кэширования все запросы аутентификации (`/api/auth/`, `/token/`).

#### 2.3.2. Нативное хранилище IndexedDB (frontend/idb-store.js)
- Создан модуль `NoorDB` (база `NoorQuranDB`, хранилища `surahs`, `hadiths`, `meta`).
- Обновлена функция `fetchSurahData`: мгновенная отдача из IndexedDB при отсутствии сети или в фоновом режиме `stale-while-revalidate`.
- Внедрена кнопка скачивания всего Корана (114 сур) в память устройства с реальным индикатором прогресса и байтов.
- В модуле хадисов (`hadith.html`) коллекции кэшируются в IndexedDB, предотвращая повторное скачивание многомегабайтных коллекций через сеть.

#### 2.3.3. Версионирование ассетов (scripts/version-assets.mjs)
```bash
node scripts/version-assets.mjs
```
Скрипт подсчитал MD5-хеши `shared.css`, `shared.js`, `idb-store.js`, `i18n.js` и обновил параметры версионирования `?v=<hash>` во всех 24 HTML-файлах приложения.

#### 2.3.4. Оптимизация серверов приложений (Procfile)
- В `Procfile` и `backend/Procfile` настроен пул потоков gunicorn:
  `--worker-class gthread --workers 2 --threads 4 --timeout 30 --max-requests 1000 --max-requests-jitter 100`
- Устранена блокировка рабочих процессов при долгих сетевых запросах к внешним API.


---

### 2.4. Фаза 4: Аудио и Чтецы (Unified Audio Engine)

#### 2.4.1. Единый аудиоплеер NoorAudioManager (frontend/shared.js)
- Спроектирован и внедрен единый синглтон-модуль `NoorAudioManager`, управляющий единственным экземпляром `HTMLAudioElement`.
- Реализованы режимы `ayah` (поаятное воспроизведение) и `surah` (воспроизведение полной суры) с синхронизацией глобального состояния.
- Внедрен каскад зеркал: при ошибке сети или 404 плеер автоматически пробует альтернативные серверы (EveryAyah, Islamic CDN, MP3Quran, резервные зеркала) без прерывания пользовательского опыта.
- Обработаны все promise-исключения `play()`: `AbortError` игнорируется при быстром переключении треков, `NotAllowedError` отображает вежливую подсказку, сетевые ошибки активируют следующее зеркало.
- Устранены 26 пустых блоков `catch` по всему проекту (`shared.js`, `bookmarks.html`, `tasbih.html`, `hijri.html`).
- Реализована поддержка MediaSession API (обложки, названия сур, аяты, артист, клавиши управления воспроизведением).

#### 2.4.2. Единый шаблон reciter.html?id=... (ARCH-02)
- Создан динамический шаблон `frontend/pages/reciter.html`, загружающий метаданные чтеца по `?id=...` из реестра `RECITERS`.
- В `netlify.toml` и `frontend/_redirects` настроены 301-редиректы для всех 10 старых страниц `reciter-*.html`.
- В сетке сур `buildSurahGrid` отображаются все 114 сур, при этом физически отсутствующие записи чтецов снабжены меткой "Soon · Скоро" и защищены от ложных 404 сетевых запросов.

#### 2.4.3. Выбор чтеца в Коране (quran.html)
- Добавлен селектор чтецов в панель инструментов чтения `reading-controls` с сохранением предпочтения в `localStorage` (`nq_quran_reciter`).
- Устранен race condition в `nextA()` и `onAyahEnded()`: переход между сурами ожидает завершения асинхронного `openS()`.

#### 2.4.4. Верификация аудио (scripts/verify-audio.mjs)
```bash
node scripts/verify-audio.mjs
```
- Проверены локальные аудиофайлы чтецов Шерифа Мостафы (8 сур) и Абдуррахмана Моссада (2 суры).
- Проверены онлайн-эндпоинты и каскады зеркал для всех 10 чтецов: 11/11 проверок успешно пройдены.
