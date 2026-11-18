# AUDIT/OWNER_ACTIONS.md — Действия для владельца проекта

В данном документе собираются все задачи и параметры, которые требуют конфигурирования владельцем в боевой инфраструктуре (секреты, боевые домены, DNS, почта SMTP, юридические реквизиты).

---

## 1. Переменные окружения (Environment Variables)

### Production Backend (Render / PaaS)
В панели управления Render (Environment Variables) необходимо задать следующие параметры:
```env
DEBUG=False
SECRET_KEY=<СГЕНЕРИРОВАННЫЙ_КРИПТОСТОЙКИЙ_КЛЮЧ_МИНИМУМ_50_СИМВОЛОВ>
ALLOWED_HOSTS=nur-quran.onrender.com,api.nur-quran.com,nuur-quran.netlify.app,nur-quran.netlify.app
CORS_ALLOWED_ORIGINS=https://nuur-quran.netlify.app,https://nur-quran.netlify.app,https://nur-quran.com
DATABASE_URL=postgres://user:password@host:port/database_name
REDIS_URL=redis://default:password@host:port (опционально)
NUM_PROXIES=1
SENTRY_DSN=https://... (опционально для мониторинга ошибок)
```

> **Генерация безопасного SECRET_KEY:**
> ```bash
> python3 -c "import secrets; print(secrets.token_urlsafe(50))"
> ```

### Production Frontend (Netlify)
В `netlify.toml` / настройках Netlify Environment:
- Убедиться, что домен проксирования бэкенда совпадает с реальным URL сервиса на Render.

---

## 2. Настройка почты (SMTP) для сброса паролей
- Для отправки писем со ссылками на сброс пароля требуется подключить реальный SMTP-сервис (SendGrid, Mailgun, Amazon SES, Яндекс 360, Google Workspace).
- Переменные:
  - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `DEFAULT_FROM_EMAIL`.

---

## 3. Юридические данные и контактная информация
В файлах `frontend/pages/privacy.html` и `frontend/pages/terms.html`:
- Заменить плейсхолдер `[EMAIL ВЛАДЕЛЬЦА / ПОДДЕРЖКИ]` на официальный адрес электронной почты проекта.

---

## 4. Лицензии и права на переводы и аудио
- Текст Корана: `quran-uthmani` (Tanzil Project, CC-BY-ND).
- Переводы:
  - Русский: Эльмир Кулиев (общественное достояние / свободное использование в религиозно-просветительских целях).
  - Английский: Muhammad Asad.
  - Узбекский: Шейх Мухаммад Садык Мухаммад Юсуф (Hilol Nashr).
- Аудиозаписи: EveryAyah / MP3Quran (свободное распространение в некоммерческих исламских приложениях).

---

## 5. Тестирование на реальных физических устройствах
- Проверить компас Киблы на реальном iPhone в Safari (проверка работы модального окна разрешения `DeviceOrientationEvent.requestPermission()`).
- Проверить вибрацию тасбиха на Android Chrome.
- Сверить время намаза в приложении с местным расписанием мечети/муфтията для вашего города.

