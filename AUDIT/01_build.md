# ЭТАП 1: Сборка, Запуск, Тесты и Линтеры — Noor Al-Quran

**Дата аудита:** 18 ноября 2026  
**Окружение:** Linux x86_64, Python 3.14.7 / 3.12.3 target, Node.js v22.23.4, npm 10.9.9  
**Статус проверки этапа:** Завершён  

---

## 1. Установка зависимостей с нуля

### 1.1. Backend (`pip install -r requirements.txt`) — ❌ СБОЙ УСТАНОВКИ
При выполнении команды `pip install -r backend/requirements.txt` в чистом виртуальном окружении установка **завершается фатальной ошибкой сборки пакета `psycopg2-binary==2.9.9`**.

**Реальный вывод терминала:**
```
Building wheels for collected packages: psycopg2-binary
  Building wheel for psycopg2-binary (pyproject.toml) ... error
  error: subprocess-exited-with-error
  
  × Building wheel for psycopg2-binary (pyproject.toml) did not run successfully.
  │ exit code: 1
  ╰─> [47 lines of output]
      ...
      building 'psycopg2._psycopg' extension
      x86_64-linux-gnu-gcc ... -c psycopg/adapter_asis.c -o build/...
      In file included from psycopg/adapter_asis.c:28:
      ./psycopg/psycopg.h:36:10: fatal error: libpq-fe.h: No such file or directory
         36 | #include <libpq-fe.h>
            |          ^~~~~~~~~~~~
      compilation terminated.
      
      It appears you are missing some prerequisite to build the package from source.
      error: Command '['x86_64-linux-gnu-gcc', ...]' returned non-zero exit status 1.
  ERROR: Failed building wheel for psycopg2-binary
Failed to build psycopg2-binary
error: failed-wheel-build-for-install
```
**Причина:** Пакет `psycopg2-binary==2.9.9` не имеет скомпилированных wheel-пакетов под современные версии Python/дистрибутивы, пытается скомпилироваться из исходников и падает из-за отсутствия заголовочных файлов PostgreSQL (`libpq-dev`).  
**Решение:** Обновить пакет до `psycopg2-binary>=2.9.10` либо перейти на современный драйвер `psycopg[binary]>=3.1`.

### 1.2. Frontend (`npm audit` / `npm install`) — ⚠️ ОТСУТСТВИЕ СИСТЕМЫ СБОРКИ
В `frontend/package.json` объявлены только скрипты запуска:
```json
{
  "name": "noor-alquran-frontend",
  "version": "1.0.0",
  "scripts": {
    "start": "python3 -m http.server 3000",
    "serve": "http-server -c-1 -p 3000"
  }
}
```
Команда `npm audit` завершается с ошибкой:
```
npm error code ENOLOCK
npm error audit This command requires an existing lockfile.
```
**Вывод:** На фронтенде отсутствуют `dependencies`, `devDependencies`, `package-lock.json`, линтеры (ESLint/Prettier) и сборщики (Vite/Webpack/esbuild). Проект раздаётся как набор «сырых» файлов.

---

## 2. Запуск проекта из коробки (Out-of-the-box)

### 2.1. Backend (`python manage.py check`) — ❌ КРАШ БЕЗ .ENV
При попытке выполнить `manage.py check` сразу после клонирования репозитория сервер падает с исключением:

**Реальный вывод:**
```
Traceback (most recent call last):
  File "/home/weenzox/Documents/nur-quran/backend/manage.py", line 14, in <module>
    main()
  File "/home/weenzox/Documents/nur-quran/backend/config/settings.py", line 22, in <module>
    raise ValueError("SECRET_KEY environment variable is not set and DEBUG is False.")
ValueError: SECRET_KEY environment variable is not set and DEBUG is False.
```
**Причина:** `backend/config/settings.py`, строки 15-22:
```python
DEBUG = os.getenv('DEBUG', 'False') == 'True'
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = 'django-insecure-change-this-in-production-noor-alquran-2024'
    else:
        raise ValueError("SECRET_KEY environment variable is not set and DEBUG is False.")
```
Поскольку файла `.env` в репозитории нет (только `.env.example`), по умолчанию `DEBUG` равен `False`, а `SECRET_KEY` пуст. Проект не может запуститься локально без явного создания `.env`.

### 2.2. Запуск с тестовым окружением (`DEBUG=True SECRET_KEY=...`) — ✅ УСПЕШНО
При передаче валидных переменных окружения:
```bash
DEBUG=True SECRET_KEY=test-secret-key python manage.py check
# Результат: System check identified no issues (0 silenced).
```

---

## 3. Линтеры и Статический Анализ Кода

### 3.1. Синтаксический анализ Python (`py_compile`) — ✅ 0 ошибок
Все файлы бэкенда компилируются без синтаксических ошибок в AST.

### 3.2. Линтер Python (`ruff check backend`) — ❌ 39 ЗАМЕЧАНИЙ
Запуск профессионального линтера `ruff` выявил **39 проблем**:
- **F401 (Unused imports):**
  - `backend/api/views.py:16` — `UserRateThrottle` импортирован, но не используется.
  - `backend/api/views.py:28` — `NameOfAllahSerializer` импортирован, но не используется.
- **F841 (Unused local variables):**
  - `backend/api/views.py:78` — переменная `exc` в `except Exception as exc:` не используется.
- **RUF012 (Mutable default values for class attributes):**
  - `backend/api/views.py:155, 156, 157` (`PrayerNotificationViewSet`): списки `permission_classes`, `filter_backends`, `filterset_fields` объявлены как изменяемые атрибуты класса без `ClassVar`.
  - `backend/api/views.py:171, 172, 173, 174, 175` (`BookmarkViewSet`): списки `permission_classes`, `filter_backends`, `filterset_fields`, `ordering_fields`, `ordering` объявлены как изменяемые атрибуты класса.
  - `backend/api/views.py:331` (`CustomTokenObtainPairView`): `throttle_classes = [AuthRateThrottle]`.
- **EXE001 (Shebang без исполняемого флага):**
  - `backend/manage.py:1` содержит `#!/usr/bin/env python`, но файл не имеет прав на исполнение (`chmod +x`).

### 3.3. Синтаксический анализ JavaScript (`node --check`) — ✅ 0 синтаксических ошибок
Файлы `frontend/shared.js`, `frontend/i18n.js`, `frontend/reciter-player.js`, `frontend/sw.js` успешно проходят валидацию V8.

---

## 4. Юнит-тесты и Покрытие кода (Test Coverage)

### 4.1. Результаты прогона тестов (`python manage.py test api`)
Запущено **16 тестов**, все 16 завершились со статусом `OK` за 9.7 секунд.

**Варнинг безопасности во время тестов:**
```
/jwt/api_jwt.py:149: InsecureKeyLengthWarning: The HMAC key is 21 bytes long, 
which is below the minimum recommended length of 32 bytes for SHA256. See RFC 7518 Section 3.2.
```

### 4.2. Анализ покрытия тестами (`coverage report -m`)
Общий процент покрытия бэкенда: **84%**.

```
Name                 Stmts   Miss  Cover   Missing Lines
---------------------------------------------------------------------------------
api/models.py           29      2    93%   23, 48
api/serializers.py      31      4    87%   24, 41-45
api/views.py           153     49    68%   62-80, 92-93, 103-118, 128-134, 144-147, 
                                           311, 344, 355, 362-365, 369, 375, 378, 382-383
config/settings.py      65     19    71%   ...
---------------------------------------------------------------------------------
TOTAL                  462     76    84%
```

### 4.3. Критические «белые пятна» в тестировании (Что НЕ покрыто вообще):
1. **Эндпоинты Корана:** `/api/surahs/` и `/api/surahs/<int>/` — **0 тестов** (строки 92-118 в `views.py`).
2. **Времена намаза и Хиджра:** `/api/prayer-times/` и `/api/hijri-date/` — **0 тестов** (строки 128-147).
3. **99 Имен Аллаха:** `/api/names/` — **0 тестов** (строка 311).
4. **Обработка сбоев внешних API:** логика таймаутов и падений в `fetch_external_api` — **0 тестов** (строки 62-80).
5. **Валидация чтецов азана:** `validate_adhan_reciter` в `serializers.py` — **0 тестов** (строки 41-45).
6. **Обновление токенов (JWT Refresh):** эндпоинты `/api/token/refresh/` и `/api/auth/refresh/` — **0 тестов**.
7. **Rate Limiting:** ограничение 5 запросов/мин на регистрацию и вход — **0 тестов**.
8. **Frontend:** Ни одного автоматизированного теста (Unit / Integration / E2E).

---

## 5. Различия Production и Development

1. **Отсутствие минификации и бандлинга (Frontend):**
   В продакшн отдаются тяжелые несжатые скрипты:
   - `frontend/shared.js`: 1 811 строк (~65 КБ).
   - `frontend/reciter-player.js`: 630 строк (~23 КБ).
   - `frontend/shared.css`: ~25 КБ.
   Замедляет загрузку на мобильных устройствах при плохом интернет-соединении (3G/EDGE).
2. **Отладочные логи в коде:**
   В клиентских скриптах присутствуют вызовы `console.warn`, `console.error` и `console.debug` (`frontend/shared.js:84`, `frontend/reciter-player.js:208, 370, 453, 582, 618`).
3. **WhiteNoise Collectstatic:**
   Команда `collectstatic --dry-run` отрабатывает корректно (162 файла), но директория `backend/staticfiles` сохранена в Git репозитории, засоряя историю версий бинарными и дублирующими файлами.

---
**ЭТАП 1 ЗАВЕРШЁН: проверено 11 файлов/команд, найдено 6 проблем**
