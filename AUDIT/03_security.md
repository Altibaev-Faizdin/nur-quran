# ЭТАП 3: АУДИТ БЕЗОПАСНОСТИ (OWASP TOP 10, ASVS, SECRETS, COMPLIANCE)

**Дата аудита:** 18 ноября 2026  
**Проверяющий:** Senior Staff Engineer / Application Security (AppSec) Engineer  
**Объект:** Проект Noor Al-Quran (Backend: Django 5.0.6 + DRF, Frontend: Vanilla JS / HTML5 PWA)  
**Статус этапа:** ВЫПОЛНЕН  

---

## 1. Резюме аудита безопасности

Проведён полный аудит безопасности кодовой базы backend и frontend в соответствии с OWASP Top 10 (2021), OWASP ASVS (Application Security Verification Standard v4.0), а также стандартами безопасности облачных конфигураций (Netlify / Render).

Обнаружено **11 уязвимостей безопасности**:
- 🔴 **CRITICAL (Критические):** 2
- 🟠 **HIGH (Высокие):** 4
- 🟡 **MEDIUM (Средние):** 4
- ⚪ **LOW (Низкие):** 1

---

## 2. Матрица находок по OWASP Top 10 (2021)

| OWASP Категория | Статус | Кол-во проблем | Ключевые замечания |
|---|---|---|---|
| **A01: Broken Access Control** | ⚠️ Уязвимо | 2 | Хардкод localhost ломает аутентификацию в проде; обход проверки токенов через демо-токен |
| **A02: Cryptographic Failures** | ⚠️ Риск | 2 | Хранение долгоживущих JWT в localStorage; слабый fallback SECRET_KEY |
| **A03: Injection** | 🔴 Уязвимо | 3 | Stored/DOM XSS в Hadith и Dua через innerHTML; риск инъекции в inline onclick-атрибутах |
| **A04: Insecure Design** | ⚠️ Риск | 1 | Отсутствие процедур восстановления пароля, смены пароля и удаления аккаунта (GDPR) |
| **A05: Security Misconfiguration** | 🔴 Уязвимо | 2 | Netlify заголовки безопасности не применяются к `/pages/*.html`; несоответствие доменов CORS |
| **A06: Vulnerable and Outdated Components** | 🟠 Уязвимо | 1 | Django 5.0.6 (CVE-2024-42005, CVE-2024-38875), Gunicorn 22.0.0 (CVE-2024-1135) |
| **A07: Identification and Authentication Failures**| ⚠️ Риск | 1 | Автоматическая авторизация по фиктивному токену при сбое сети |
| **A08: Software and Data Integrity Failures** | ⚠️ Риск | 1 | Загрузка внешних JSON-файлов хадисов с jsDelivr без валидации схемы |
| **A09: Security Logging and Monitoring Failures** | 🟢 Приемлемо | 0 | Базовый логгер в settings.py настроен |
| **A10: Server-Side Request Forgery (SSRF)** | 🟡 Риск | 1 | Отсутствие валидации координат lat/lng в проксируемом запросе к aladhan.com |

---

## 3. Детальный разбор уязвимостей

### 🔴 SEC-01 [CRITICAL]: Хардкод http://localhost:8000 и обход авторизации через 'demo-session-token'
- **Категория:** OWASP A01: Broken Access Control / A07: Identification and Authentication Failures
- **Файлы:**
  - `frontend/pages/login.html`, строки 334–358
  - `frontend/pages/register.html`, строки 359–389
- **Цитата кода (`login.html`):**
  ```javascript
  // login.html:334
  const res = await fetch(`http://localhost:8000/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password })
  });
  ...
  catch (err) {
    // login.html:355
    localStorage.setItem('noor_user', JSON.stringify({ email: email, name: email.split('@')[0] }));
    localStorage.setItem('access_token', 'demo-session-token');
    showNotification('Offline mode: Logged in locally', 'warning');
    setTimeout(() => { window.location.href = '../index.html'; }, 1000);
  }
  ```
- **Доказательство и сценарий атаки:**
  1. В production (на домене Netlify `https://nuur-quran.netlify.app` или `https://nur-quran.com`) страница загружается по HTTPS.
  2. Запрос к `http://localhost:8000` немедленно блокируется браузером из-за политики **Mixed Content** (запрет незащищённых HTTP-запросов со страницы HTTPS) и Connection Refused.
  3. Управление передаётся в блок `catch (err)`.
  4. В `localStorage` сохраняется фиктивный токен `'demo-session-token'`.
  5. Любой пользователь, введя абсолютно любой логин и пароль, считается "успешно вошедшим". Реальные учётные записи в Django не создаются и не проверяются, закладки синхронизируются только локально.
- **Устранение:**
  - Использовать `API_BASE` из `shared.js` (`const API_BASE = isLocal ? LOCAL_BACKEND_API : '/api';`).
  - Полностью исключить тихий fallback на `demo-session-token` в формах регистрации и авторизации. При ошибке сети пользователь должен получать понятное сообщение: *"Не удалось связаться с сервером авторизации. Проверьте интернет-соединение"*.

---

### 🔴 SEC-02 [CRITICAL]: Отсутствие заголовков безопасности Netlify для страниц приложения (`/pages/*.html`)
- **Категория:** OWASP A05: Security Misconfiguration
- **Файл:** `netlify.toml`, строки 20–27
- **Цитата кода:**
  ```toml
  # HTML pages — no cache (always fresh)
  [[headers]]
    for = "/*.html"
    [headers.values]
      Cache-Control = "no-cache, no-store, must-revalidate"
      X-Content-Type-Options = "nosniff"
      X-Frame-Options = "DENY"
      Referrer-Policy = "strict-origin-when-cross-origin"
  ```
- **Доказательство и уязвимость:**
  1. Синтаксис спецификатора путей в `netlify.toml`: маска `"/*.html"` соответствует только HTML-файлам в **корневой** директории (например, `index.html`).
  2. 20 из 21 страниц приложения (`quran.html`, `login.html`, `prayer.html`, `bookmarks.html` и др.) расположены в директории `/pages/`.
  3. Для файлов `/pages/*.html` ни один из заголовков `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` **НЕ ОТДАЁТСЯ** сервером Netlify!
  4. Страницы уязвимы для Clickjacking (встраивание в `<iframe>` на сторонних фишинговых сайтах) и MIME-sniffing.
  5. В `netlify.toml` вообще отсутствует заголовок `Content-Security-Policy` (CSP) и `Permissions-Policy`.
- **Устранение:**
  Задать заголовки для всех HTML-документов через маску `for = "/*"` или отдельные секции для `for = "/pages/*"`:
  ```toml
  [[headers]]
    for = "/*"
    [headers.values]
      X-Content-Type-Options = "nosniff"
      X-Frame-Options = "DENY"
      Referrer-Policy = "strict-origin-when-cross-origin"
      Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; media-src 'self' https: blob: data:; connect-src 'self' https://api.alquran.cloud https://api.aladhan.com https://cdn.islamic.network https://everyayah.com https://*.mp3quran.net https://ipapi.co https://get.geojs.io https://nur-quran.onrender.com; frame-ancestors 'none';"
      Permissions-Policy = "geolocation=(self), microphone=(), camera=()"
  ```

---

### 🟠 SEC-03 [HIGH]: Stored/DOM XSS в Hadith Viewer через неэкранированный `innerHTML`
- **Категория:** OWASP A03: Injection (Cross-Site Scripting)
- **Файл:** `frontend/pages/hadith.html`, строки 325–338
- **Цитата кода:**
  ```javascript
  grid.innerHTML = formatted.map(h => `
    <div class="hadith-card">
      <div class="hadith-meta">
        <span class="hadith-book">${currentCollection.replace('-',' ').replace(/\b\w/g,l=>l.toUpperCase())}</span>
        <span class="hadith-num">No. ${h.num}</span>
        <span class="hadith-grade ${h.grade}">${h.gradeRaw.charAt(0).toUpperCase() + h.gradeRaw.slice(1)}</span>
      </div>
      <div class="hadith-arabic">${h.ar}</div>
      <div class="hadith-english">${h.en}</div>
      <div class="hadith-actions">
        <button class="btn-copy-h" onclick="copyHadith('${encodeURIComponent(h.ar+'\\n\\n'+h.en)}')" >📋 Copy</button>
        <button class="btn-share-h" onclick="shareHadith('${encodeURIComponent(h.en)}')" >📤 Share</button>
      </div>
    </div>`).join('');
  ```
- **Доказательство и уязвимость:**
  1. Переменные `h.ar` и `h.en` берутся напрямую из внешнего JSON (загружаемого с CDN jsDelivr: `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/...`).
  2. Данные вставляются напрямую в шаблонный литерал `innerHTML` **БЕЗ вызова `safeHTML()`**!
  3. В случае компрометации CDN-репозитория или наличия в текстах хадисов HTML/JS-тегов (например, `<img src=x onerror=...>` или `<script>`), код выполнится в контексте браузера пользователя с доступом к `localStorage` (`access_token`, `refresh_token`).
- **Устранение:**
  Обернуть все динамические поля в `safeHTML()`:
  ```javascript
  <div class="hadith-arabic">${safeHTML(h.ar)}</div>
  <div class="hadith-english">${safeHTML(h.en)}</div>
  ```

---

### 🟠 SEC-04 [HIGH]: DOM XSS в Dua Viewer через неэкранированный `innerHTML` и инъекция в `onclick`
- **Категория:** OWASP A03: Injection (Cross-Site Scripting)
- **Файл:** `frontend/pages/dua.html`, строки 196–203
- **Цитата кода:**
  ```javascript
  card.innerHTML=`
    <div class="dua-category">${catLabels[d.cat]}</div>
    <div class="dua-ar">${d.ar}</div>
    <div class="dua-en">${d.en}</div>
    <div class="dua-ru">${d.ru}</div>
    <button class="copy-btn" onclick="copyDua('${d.ar}')" >📋 Copy Dua</button>
  `;
  ```
- **Доказательство и уязвимость:**
  1. `d.ar`, `d.en`, `d.ru` вставляются в `innerHTML` без `safeHTML()`.
  2. Строка `onclick="copyDua('${d.ar}')"` уязвима: если арабский текст содержит апостроф или кавычку (`'`, `"`), она закрывает строковый литерал атрибута HTML/JS, вызывая синтаксическую ошибку либо выполнение внедрённого JS-кода.
- **Устранение:**
  Использовать `safeHTML()` для содержимого карточки и навешивать обработчик через `addEventListener`:
  ```javascript
  card.innerHTML = `
    <div class="dua-category">${safeHTML(catLabels[d.cat])}</div>
    <div class="dua-ar">${safeHTML(d.ar)}</div>
    <div class="dua-en">${safeHTML(d.en)}</div>
    <div class="dua-ru">${safeHTML(d.ru)}</div>
    <button class="copy-btn">📋 Copy Dua</button>
  `;
  card.querySelector('.copy-btn').addEventListener('click', () => copyDua(d.ar));
  ```

---

### 🟠 SEC-05 [HIGH]: Уязвимости в устаревших зависимостях Django 5.0.6 и Gunicorn 22.0.0
- **Категория:** OWASP A06: Vulnerable and Outdated Components
- **Файл:** `backend/requirements.txt`, строки 1, 7
- **Цитата кода:**
  ```text
  Django==5.0.6
  gunicorn==22.0.0
  ```
- **Доказательства известных CVE:**
  1. **Django 5.0.6:**
     - **CVE-2024-42005** (High): SQL-инъекция в методах `QuerySet.values()` / `values_list()`, использующих объекты `Q()`.
     - **CVE-2024-38875** (High): DoS (отказ в обслуживании) в `django.utils.html.urlize` через специально сформированную строку.
     - **CVE-2024-41989** (High): Утечка/переполнение памяти в фильтре шаблонизатора `floatformat`.
     - **CVE-2024-41990** (High): DoS через регулярные выражения в `urlize`.
     - **CVE-2024-45230** (High): DoS через регулярные выражения в `urlize`.
     - **CVE-2024-45231** (Medium): Атака по времени (timing attack) в `User.has_usable_password`.
     - **CVE-2024-53907** (High): DoS в `strip_tags()`.
     - **CVE-2024-53908** (High): SQL-инъекция в операторе `HasKey` для JSONField.
  2. **Gunicorn 22.0.0:**
     - **CVE-2024-1135** (Medium): HTTP Request Smuggling из-за некорректного парсинга заголовков `Transfer-Encoding`.
- **Устранение:**
  Обновить `backend/requirements.txt`:
  - `Django>=5.0.12` (или `Django>=5.1.5`)
  - `gunicorn>=23.0.0`
  - `httpx>=0.27.0`
  - `psycopg[binary]>=3.2.0` или `psycopg2-binary>=2.9.10`

---

### 🟠 SEC-06 [HIGH]: Рассинхронизация доменов в CORS_ALLOWED_ORIGINS
- **Категория:** OWASP A05: Security Misconfiguration
- **Файл:** `backend/config/settings.py`, строки 166–169
- **Цитата кода:**
  ```python
  if not CORS_ALLOWED_ORIGINS and not DEBUG:
      CORS_ALLOWED_ORIGINS = ['https://nuur-quran.netlify.app']

  CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS
  ```
- **Доказательство:**
  1. В строке 167 указан fallback-домен с двумя буквами "u": `nuur-quran.netlify.app`.
  2. При этом в `backend/api/middleware.py:25` и `netlify.toml:3` везде используется домен с одной буквой "u": `nur-quran.onrender.com`.
  3. Если в окружении Render не прописана переменная `CORS_ALLOWED_ORIGINS`, бэкенд разрешит CORS-запросы ТОЛЬКО для `nuur-quran.netlify.app`.
  4. Запросы с любого реального фронтенда (`nur-quran.netlify.app` или кастомного домена) будут отклонены Django с кодом `403 Forbidden` / блокировкой CORS Preflight.
- **Устранение:**
  Добавить в список оба возможных варианта и кастомные домены по умолчанию:
  ```python
  if not CORS_ALLOWED_ORIGINS and not DEBUG:
      CORS_ALLOWED_ORIGINS = [
          'https://nur-quran.netlify.app',
          'https://nuur-quran.netlify.app',
      ]
  ```

---

### 🟡 SEC-07 [MEDIUM]: Хранение Access и Refresh токенов в `localStorage`
- **Категория:** OWASP A02: Cryptographic Failures / Storage
- **Файлы:**
  - `frontend/shared.js`, строки 750–779
  - `frontend/pages/login.html`, строки 343–344
  - `frontend/pages/register.html`, строки 368–369
- **Цитата кода:**
  ```javascript
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  ```
- **Доказательство и влияние:**
  1. `localStorage` доступен для любого JavaScript-скрипта, выполняющегося в DOM.
  2. При наличии любой XSS-уязвимости (включая SEC-03, SEC-04) злоумышленник может выполнить `localStorage.getItem('refresh_token')` и скомпрометировать сессию пользователя на 30 дней (`REFRESH_TOKEN_LIFETIME = timedelta(days=30)`).
- **Устранение:**
  В архитектуре SPA / Vanilla JS рекомендуется хранить refresh-токены в защищённых `HttpOnly; Secure; SameSite=Strict` cookies, либо сократить время жизни refresh-токена и внедрить строгий CSP (SEC-02).

---

### 🟡 SEC-08 [MEDIUM]: Невалидированные параметры координат `lat`/`lng` и риск Cache DoS
- **Категория:** OWASP A10: Server-Side Request Forgery / A04: Insecure Design
- **Файл:** `backend/api/views.py`, строки 128–134
- **Цитата кода:**
  ```python
  @api_view(['GET'])
  @cache_page(60 * 30) # Cache for 30 minutes
  def prayer_times(request):
      lat = request.query_params.get('lat', '21.3891')
      lng = request.query_params.get('lng', '39.8579')
      method = request.query_params.get('method', '2')

      url = f"{ALADHAN_BASE}/timings?latitude={lat}&longitude={lng}&method={method}"
      data = fetch_external_api(url)
      return Response(data, status=status.HTTP_200_OK)
  ```
- **Доказательство:**
  1. Параметры `lat`, `lng`, `method` никак не валидируются: не проверяется, являются ли они числами с плавающей точкой, не проверяется диапазон (-90..90, -180..180).
  2. Декоратор `@cache_page(60 * 30)` формирует ключ кэша на основе полного пути запроса с query-параметрами (`request.get_full_path()`).
  3. Злоумышленник может направить 50 000 запросов со случайными значениями `lat` и `lng`. Каждый запрос создаст отдельную запись в памяти кэша Django (`LocMemCache` или `RedisCache`), что приведёт к исчерпанию оперативной памяти сервера (Cache DoS).
- **Устранение:**
  - Валидировать `lat` и `lng` через `float(lat)` с проверкой диапазонов `-90 <= lat <= 90` и `-180 <= lng <= 180`.
  - Округлять координаты до 2–3 знаков после запятой (точность ~100–1000 метров достаточна для расчёта времени намаза), что снизит объём кэша и защитит от Cache DoS.
  - Валидировать `method` по белому списку допустимых методов AlAdhan (1..15).

---

### 🟡 SEC-09 [MEDIUM]: Опасные inline `onclick`-обработчики со сложными шаблонными строками
- **Категория:** OWASP A03: Injection
- **Файлы:**
  - `frontend/pages/quran.html`, строки 202–211
  - `frontend/shared.js`, строка 1077
- **Цитата кода:**
  ```javascript
  // quran.html:202
  const arEsc = (a.text || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  const trEsc = trText.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  return `...
  <button class="abtn" onclick="shareAyah(${n},${a.numberInSurah},'${arEsc}','${trEsc}')" title="Share" aria-label="Share ayah">📤</button>
  `;
  ```
- **Доказательство:**
  1. Если перевод содержит символы перевода строки (`\n`), экранирование `replace(/'/g, "\\'")` не предотвращает разрыв синтаксиса атрибута HTML, что приводит к ошибке `Uncaught SyntaxError: Invalid or unexpected token`.
  2. Использование inline-обработчиков требует разрешения директивы `'unsafe-inline'` в `Content-Security-Policy`, что снижает эффективность защиты от XSS.
- **Устранение:**
  Не передавать большие тексты аятов через аргументы `onclick`. Использовать делегирование событий либо атрибуты `data-surah`, `data-ayah` и считывать текст из DOM-элементов или глобального состояния.

---

### 🟡 SEC-10 [MEDIUM]: Отсутствие эндпоинтов восстановления пароля и удаления аккаунта
- **Категория:** OWASP A04: Insecure Design / GDPR Compliance
- **Файлы:** `backend/api/views.py`, `backend/api/urls.py`
- **Доказательство:**
  1. В проекте реализованы только `auth/register/` и `auth/login/`.
  2. Эндпоинты смены пароля (`auth/password/change/`), сброса пароля (`auth/password/reset/`) отсутствуют. Если пользователь забудет пароль, восстановить доступ невозможно.
  3. Эндпоинт удаления аккаунта (`auth/account/delete/`) отсутствует, что нарушает требования GDPR (Right to Erasure / Право на забвение).
- **Устранение:**
  Добавить эндпоинты смены пароля для авторизованных пользователей и эндпоинт `DELETE /api/auth/me/` для удаления аккаунта.

---

### ⚪ SEC-11 [LOW]: Статические файлы (`staticfiles/`) закоммичены в git-репозиторий
- **Категория:** Repository Hygiene / Codebase Security
- **Файл:** `backend/staticfiles/` (679 файлов в git-индексе)
- **Доказательство:**
  Команда `git ls-files backend/staticfiles/ | wc -l` возвращает 679 файлов. В репозиторий включены минифицированные версии библиотек Django admin и DRF (включая `highlight.pack.js`), которые должны генерироваться на этапе сборки через `python manage.py collectstatic`.
- **Устранение:**
  Удалить `backend/staticfiles/` из git-трекинга (`git rm -r --cached backend/staticfiles/`) и добавить в `backend/.gitignore`.

---

## 4. Сводная таблица проверенных компонентов

| Компонент / Механизм | Метод проверки | Результат |
|---|---|---|
| Секреты в git-истории (`git log -S`) | Проверка коммитов на SECRET_KEY, passwords, tokens | Чисто: реальные секреты не коммитились, только `.env.example` |
| SQL Injection (ORM, raw queries) | Статический анализ AST, grep по `raw()`, `extra()`, `cursor` | Чисто: чистый Django ORM, raw SQL отсутствует |
| IDOR (Insecure Direct Object Reference) | Аудит `BookmarkViewSet`, `PrayerNotificationViewSet` | Безопасно: выборки строго фильтруются по `user=request.user` |
| CSRF защита | Аудит `settings.py` (`CsrfViewMiddleware`, `CSRF_COOKIE_HTTPONLY`) | Настроено корректно для REST API (JWT) |
| Rate Limiting (Брутфорс авторизации) | Аудит `AuthRateThrottle` (5 req/min) | Настроено на `login` и `register`; `token/refresh` на 200/hr |
| Password Policy (Сложность паролей) | Аудит `AUTH_PASSWORD_VALIDATORS` и `register_user` | Настроено: проверяются 4 валидатора Django + regex юзернейма |
| XSS защита (safeHTML) | Поиск всех `.innerHTML` (32 места в frontend) | Найдено 2 уязвимых места (Hadith, Dua) без `safeHTML()` |
| Content Security Policy (CSP) | Аудит `SecurityHeadersMiddleware` и `netlify.toml` | Уязвимо: в Netlify CSP отсутствует, маска `/*.html` не покрывает `/pages/` |
| Версии зависимостей (CVE) | Сопоставление версий `requirements.txt` с базами CVE | Уязвимо: Django 5.0.6 и Gunicorn 22.0.0 содержат известные CVE |

---

ЭТАП 3 ЗАВЕРШЁН: проверено 19 файлов, найдено 11 проблем
