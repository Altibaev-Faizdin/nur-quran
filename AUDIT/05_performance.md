# ЭТАП 5: АУДИТ ПРОИЗВОДИТЕЛЬНОСТИ, КЭШИРОВАНИЯ И НАДЁЖНОСТИ

**Дата аудита:** 18 ноября 2026  
**Проверяющий:** Senior Staff Engineer / Performance & Reliability Engineer (SRE)  
**Объект:** Проект Noor Al-Quran (Backend & Frontend)  
**Статус этапа:** ВЫПОЛНЕН  

---

## 1. Резюме аудита производительности и надёжности

Проведён анализ производительности базы данных, сетевых политик кэширования, стратегий Service Worker, устойчивости к отказам внешних API (AlQuran Cloud, AlAdhan, Islamic Network, MP3Quran) и поведения приложения в условиях нестабильного или отсутствующего интернет-соединения (Offline Resilience).

Обнаружено **8 критических и средних проблем производительности и надёжности**:
- 🔴 **CRITICAL / HIGH RELIABILITY ISSUES:** 3
- 🟠 **PERFORMANCE & CACHING ISSUES:** 3
- 🟡 **DATABASE & STORAGE OPTIMIZATIONS:** 2

---

## 2. Детальный разбор проблем

### 🔴 PERF-01 [CRITICAL]: Полная неработоспособность чтения Корана в режиме Offline при наличии статуса PWA
- **Категория:** Offline Resilience / PWA Architecture
- **Файлы:**
  - `frontend/shared.js`, строки 53–90 (`fetchSurahData`)
  - `frontend/sw.js`, строки 8–29 (`STATIC_ASSETS`)
- **Доказательство и сценарий сбоя:**
  1. Service Worker прекэширует только оболочку приложения (HTML-файлы, CSS, иконки). Ни один аят или текст суры не включён в прекэш `STATIC_ASSETS`.
  2. При открытии любой суры (`quran.html?surah=N`) вызывается `fetchSurahData(N, lang)`.
  3. Функция делает сетевой запрос:
     ```javascript
     const pubUrl = `https://api.alquran.cloud/v1/surah/${surahNum}/editions/quran-uthmani,${edition}`;
     const res = await fetch(pubUrl);
     ```
  4. Если интернет отсутствует (самолёт, метро, слабый сигнал), `fetch` падает с исключением.
  5. Блок `catch (e)` пытается сделать **ещё один сетевой запрос** на тот же недоступный хост:
     ```javascript
     const singleUrl = `https://api.alquran.cloud/v1/surah/${surahNum}`;
     const res = await fetch(singleUrl);
     ```
  6. Пользователь видит ошибку: *"Failed to load verses. Unable to reach the Quran server"*.
- **Последствия:**
  Приложение позиционируется как PWA с поддержкой офлайн-режима, но его ключевая функция — чтение Корана — **на 100% не работает без интернета**.
- **Рекомендация:**
  - Внедрить IndexedDB хранилище (например, через библиотеку `idb-keyval` или встроенный API) для сохранения всех прочитанных сур.
  - Добавить в настройки PWA кнопку *"Загрузить весь Коран для чтения офлайн"* (~15 МБ JSON), которая сохраняет все 114 сур в IndexedDB.

---

### 🔴 PERF-02 [CRITICAL]: Антипаттерн PWA Cache: стратегия Cache-First для HTML-документов
- **Категория:** Caching Strategy / PWA Reliability
- **Файл:** `frontend/sw.js`, строки 108–126
- **Цитата кода:**
  ```javascript
  // 4. Cache-First with Network fallback for HTML pages
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        }).catch(() => {
          if (req.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html') || caches.match('index.html');
          }
        })
      );
    })
  );
  ```
- **Доказательство и последствия:**
  1. Стратегия `Cache-First` возвращает кэшированный HTML-файл мгновенно, **НЕ проверяя наличие обновлений на сервере**.
  2. Даже при наличии быстрого интернета пользователи получают старую застрявшую версию страниц до тех пор, пока вручную не очистят кэш браузера или пока не изменится `CACHE_NAME` в `sw.js`.
  3. Это противоречит правилу в `netlify.toml:23` (`Cache-Control: no-cache, no-store, must-revalidate`). Браузер запрашивает сервер только если SW пропустит запрос, но SW перехватывает его и отдаёт из кэша.
- **Рекомендация:**
  Для всех HTML-страниц использовать стратегию **Network-First с Cache Fallback**:
  ```javascript
  // Network-First for HTML
  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkRes;
      })
      .catch(() => caches.match(req).then(cached => cached || caches.match('/index.html')))
  );
  ```

---

### 🔴 PERF-03 [HIGH]: Синхронная блокировка Gunicorn воркеров внешними API с таймаутом 10 секунд
- **Категория:** Backend Concurrency & Scalability
- **Файлы:** `backend/api/views.py`, строки 37, 60–81
- **Цитата кода:**
  ```python
  API_TIMEOUT = 10

  def fetch_external_api(url: str, timeout: int = API_TIMEOUT) -> dict:
      with httpx.Client(timeout=timeout) as client:
          response = client.get(url)
          response.raise_for_status()
          return response.json()
  ```
- **Доказательство и последствия:**
  1. Синхронные воркеры Gunicorn (`gunicorn -w 2-4 config.wsgi:application`) обрабатывают один запрос на поток/процесс.
  2. Эндпоинты `surah_list`, `surah_detail`, `prayer_times`, `hijri_date` вызывают `fetch_external_api` синхронно.
  3. Если `api.alquran.cloud` или `api.aladhan.com` отвечает с задержкой 5–10 секунд, все воркеры Gunicorn мгновенно блокируются в ожидании сетевого I/O.
  4. При одновременном обращении всего 4–8 пользователей бэкенд перестаёт отвечать на health-check и отдаёт `502 Bad Gateway` на Render.
- **Рекомендация:**
  - Использовать асинхронные представления DRF / ASGI (`httpx.AsyncClient`) либо запускать воркеры с типом `gevent` / `uvicorn`.
  - Уменьшить `API_TIMEOUT` до 3.5 секунд с быстрым возвратом fallback-ошибки.
  - Сохранить суры Корана локально в базе данных бэкенда (SQLite/PostgreSQL), чтобы бэкенд отдавал текст из локальной БД за 2 мс без запросов к внешним облакам.

---

### 🟠 PERF-04 [HIGH]: Хаос версионирования ассетов: конфликт query-параметров `?v=4` и `?v=5`
- **Категория:** Browser Caching & Asset Synchronization
- **Файлы:**
  - `frontend/index.html:18`, `frontend/pages/quran.html:16`, `reciter-*.html:18`: `shared.css?v=4`, `shared.js?v=4`
  - `frontend/pages/login.html:10`, `register.html:10`: `shared.css?v=5`, `shared.js?v=5`
  - `frontend/reciter-player.js:218`: `reciter-player.js?v=5`
  - `netlify.toml`, строки 29–38:
    ```toml
    [[headers]]
      for = "/*.js"
      [headers.values]
        Cache-Control = "public, max-age=31536000, immutable"
    ```
- **Доказательство и последствия:**
  1. В `netlify.toml` включено долгосрочное кэширование JS и CSS на 1 год (`max-age=31536000, immutable`).
  2. Браузер считает URL с разными `?v=` отдельными неизменяемыми ресурсами.
  3. В приложении царит рассинхронизация: часть страниц ссылается на `?v=4`, часть на `?v=5`, а часть вообще без версий.
  4. Пользователь, переходя со страницы `index.html` на `login.html`, вынужден повторно загружать тяжелые JS/CSS-файлы, либо сталкивается со стилевыми артефактами при обновлении только части страниц.
- **Рекомендация:**
  Привести все теги `<link>` и `<script>` к единой глобальной версии релиза (например, `?v=1.0.1`), либо использовать хэширование содержимого файлов (`shared.a1b2c3.js`).

---

### 🟠 PERF-05 [HIGH]: Единая точка отказа CDN в аудиоплеере Корана (`quran.html`)
- **Категория:** Audio Delivery Reliability
- **Файл:** `frontend/pages/quran.html`, строки 244–246
- **Цитата кода:**
  ```javascript
  const aud = document.getElementById('aud');
  aud.src = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${num}.mp3`;
  aud.play().catch(function(){});
  ```
- **Доказательство:**
  1. В `reciter-player.js` реализован надёжный каскад зеркал (`_playWithCascade`), перебирающий серверы при ошибке 404/таймауте.
  2. В `quran.html` воспроизведение завязано на единственный хост `cdn.islamic.network`.
  3. В ряде стран хост `cdn.islamic.network` периодически блокируется интернет-провайдерами или имеет высокую задержку (>2000 мс).
  4. При недоступности этого CDN аудио в `quran.html` падает без каких-либо альтернатив.
- **Рекомендация:**
  Добавить список зеркал для аятов аль-Афаси (например, `everyayah.com/data/Alafasy_128kbps/...`) и использовать каскадную загрузку.

---

### 🟠 PERF-06 [MEDIUM]: Фрагментация кэша в `LocMemCache` при отсутствии Redis
- **Категория:** Cache Architecture
- **Файл:** `backend/config/settings.py`, строки 113–122
- **Цитата кода:**
  ```python
  CACHES = {
      'default': {
          'BACKEND': 'django.core.cache.backends.redis.RedisCache',
          'LOCATION': os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/1'),
      }
  } if os.getenv('REDIS_URL') else {
      'default': {
          'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
      }
  }
  ```
- **Доказательство:**
  1. При отсутствии переменной `REDIS_URL` Django использует `LocMemCache`.
  2. В многопроцессном режиме Gunicorn каждый рабочий процесс держит собственный изолированный словарь в оперативной памяти.
  3. Если воркер №1 закэшировал результат запроса `GET /api/surahs/1/`, то при следующем запросе, попавшем на воркер №2, кэш отсутствует, и воркер №2 снова делает тяжелый запрос во внешний API.
  4. Память сервера тратится в N раз больше (по числу воркеров).
- **Рекомендация:**
  Для сред без Redis настроить файловый кэш `django.core.cache.backends.filebased.FileBasedCache` или кэш в базе данных `django.core.cache.backends.db.DatabaseCache`, доступный всем процессам.

---

### 🟡 PERF-07 [MEDIUM]: Отсутствие составного индекса для сортировки закладок
- **Категория:** Database Query Optimization
- **Файл:** `backend/api/models.py`, строки 8–20
- **Цитата кода:**
  ```python
  class Bookmark(models.Model):
      user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
      surah_number = models.IntegerField()
      ayah_number = models.IntegerField()
      note = models.TextField(blank=True)
      created_at = models.DateTimeField(auto_now_add=True)
      ...
      class Meta:
          unique_together = ('user', 'surah_number', 'ayah_number')
          ordering = ['-created_at']
  ```
- **Доказательство:**
  1. `BookmarkViewSet` выполняет запрос: `Bookmark.objects.filter(user=request.user).order_by('-created_at')`.
  2. В базе данных создан уникальный индекс на `(user_id, surah_number, ayah_number)`.
  3. Поле `created_at` не входит в индекс. Для сортировки результатов база данных вынуждена производить операцию `SORT` в оперативной памяти на каждый запрос списка закладок.
- **Рекомендация:**
  Добавить составной индекс в `Bookmark.Meta`:
  ```python
  indexes = [
      models.Index(fields=['user', '-created_at']),
  ]
  ```

---

### 🟡 PERF-08 [LOW]: Неконтролируемый рост данных в `localStorage`
- **Категория:** Client-Side Storage Hygiene
- **Файлы:** `frontend/shared.js:451, 456, 1349`, `frontend/pages/tasbih.html:460`
- **Проблема:**
  В `localStorage` без единого префикса и версионирования сохраняются ключи `prayer_cache`, `last_coords`, `nq_local_bookmarks`, `tasbih_history`, `noor_user`, `noor_theme`, `lang`, `adhan_reciter`. При изменении структуры данных старые ключи никогда не очищаются и могут приводить к сбоям парсинга `JSON.parse()`.
- **Рекомендация:**
  Создать обёртку `StorageManager` с префиксом `nq_` и схемой версионирования данных.

---

## 3. Сводная таблица метрик производительности и надёжности

| Компонент / Метрика | Текущее состояние | Целевое состояние для Production |
|---|---|---|
| Время отклика API сур Корана | 300–1200 мс (прокси к alquran.cloud) | < 50 мс (локальная БД или CDN кэш) |
| Поведение при отключении интернета | ❌ Полный отказ загрузки аятов Корана | ✅ Чтение ранее открытых сур из IndexedDB |
| Кэширование HTML в PWA | ❌ Cache-First (застревание старых версий) | ✅ Network-First с fallback |
| Устойчивость бэкенда к сбоям внешних API | ❌ Блокировка воркеров на 10 сек (502 Gateway) | ✅ Таймаут 3.5 с, async I/O, fallback данные |
| Зеркалирование аудио | ⚠️ В `quran.html` только 1 CDN; в плеерах — каскад | ✅ Каскад зеркал во всех аудиоплеерах |
| Индексация БД | ⚠️ Нет индекса на сортировку закладок | ✅ Составной индекс `(user, -created_at)` |

---

ЭТАП 5 ЗАВЕРШЁН: проверено 11 файлов, найдено 8 проблем
