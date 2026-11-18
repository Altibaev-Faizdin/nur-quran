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
*(Будут дополняться по ходу выполнения работ)*
