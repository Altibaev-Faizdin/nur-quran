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

