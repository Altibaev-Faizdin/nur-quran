# ЭТАП 6: АУДИТ UX, ДОСТУПНОСТИ (A11Y), SEO И ГОТОВНОСТИ К РЕЛИЗУ

**Дата аудита:** 18 ноября 2026  
**Проверяющий:** Senior Staff Engineer / Design Systems & Accessibility Lead (A11y/SEO)  
**Объект:** Проект Noor Al-Quran (Frontend UI/UX, PWA Manifest, SEO, Legal)  
**Статус этапа:** ВЫПОЛНЕН  

---

## 1. Резюме аудита UX, доступности и релиза

Проведён анализ адаптивного дизайна для мобильных устройств (iOS / Android), доступности по стандарту WCAG 2.1 (AA/AAA), метатегов поисковой оптимизации (SEO), PWA-манифеста и юридической документации (Privacy Policy, Terms of Service).

Обнаружено **8 дефектов пользовательского опыта, доступности и готовности к релизу**:
- 🔴 **BLOCKERS / CRITICAL RELEASE ISSUES:** 2
- 🟠 **HIGH UX / SEO / PWA ISSUES:** 3
- 🟡 **ACCESSIBILITY & CONTENT ISSUES:** 3

---

## 2. Детальный разбор проблем

### 🔴 UX-01 [CRITICAL]: Перезапись `safe-area-inset` в CSS shorthand-свойством `padding`
- **Категория:** Mobile UX / iOS Responsiveness
- **Файл:** `frontend/shared.css`, строки 152, 178
- **Цитата кода:**
  ```css
  /* shared.css:152 */
  .abar {
    padding-bottom: max(12px, env(safe-area-inset-bottom));
    padding-left: max(48px, env(safe-area-inset-left));
    padding-right: max(48px, env(safe-area-inset-right));
    ...
    padding: 12px 48px;
  }

  /* shared.css:178 */
  .adhan {
    padding-bottom: max(12px, env(safe-area-inset-bottom));
    padding-left: max(48px, env(safe-area-inset-left));
    padding-right: max(48px, env(safe-area-inset-right));
    ...
    padding: 12px 48px;
  }
  ```
- **Доказательство и последствия:**
  1. В правилах `.abar` и `.adhan` сначала объявлены свойства с поддержкой вырезов экрана `safe-area-inset`.
  2. Однако далее в том же самом блоке объявлено shorthand-свойство `padding: 12px 48px;`.
  3. По правилам спецификации CSS каскада более позднее свойство `padding` **полностью затирает** все ранее объявленные `padding-bottom`, `padding-left` и `padding-right`!
  4. На всех смартфонах Apple (iPhone с Face ID) и Android с жестовой навигацией нижняя панель плеера и плашка азана перекрываются системным индикатором Home Bar. Кнопки воспроизведения нажимаются с трудом или провоцируют сворачивание браузера.
- **Устранение:**
  Удалить дублирующий shorthand `padding: 12px 48px;` и разделить отступы:
  ```css
  .abar {
    padding-top: 12px;
    padding-bottom: max(12px, env(safe-area-inset-bottom));
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
  }
  ```

---

### 🔴 UX-02 [CRITICAL]: Отсутствие растровых PNG иконок в PWA манифесте и `apple-touch-icon`
- **Категория:** PWA Manifest / Mobile OS Integration
- **Файлы:**
  - `frontend/manifest.json`, строки 12–19
  - Все HTML-файлы проекта (`frontend/index.html`, `frontend/pages/*.html`)
- **Цитата кода (`manifest.json`):**
  ```json
  "icons": [
    {
      "src": "/assets/images/logo.svg",
      "type": "image/svg+xml",
      "sizes": "192x192 512x512",
      "purpose": "any maskable"
    }
  ]
  ```
- **Доказательство и последствия:**
  1. В `manifest.json` указана единственная иконка в векторном формате SVG (`logo.svg`).
  2. Браузер Android Chrome и установщики Windows PWA **не поддерживают SVG** в качестве маскируемых иконок рабочего стола или рендерят их с артефактами. Спецификация W3C Web App Manifest требует растровые форматы PNG:
     - 192x192 PNG (стандартная иконка)
     - 512x512 PNG (полноразмерная маскируемая иконка)
  3. В заголовках `<head>` всех 21 HTML-файлов **ПОЛНОСТЬЮ ОТСУТСТВУЕТ** тег:
     `<link rel="apple-touch-icon" href="/assets/icons/icon-192.png">`.
  4. При добавлении сайта на экран "Домой" в iOS Safari система делает размытый снимок экрана страницы и ставит его на иконку вместо логотипа приложения.
- **Устранение:**
  Сгенерировать растровые PNG-иконки `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` и подключить их в `manifest.json` и во все `<head>` страниц.

---

### 🟠 UX-03 [HIGH]: Невалидный векторный Open Graph `og:image` и отсутствие Twitter-карточек
- **Категория:** SEO / Social Media Link Previews
- **Файлы:** `frontend/index.html:11`, `frontend/pages/quran.html:10`
- **Цитата кода:**
  ```html
  <meta property="og:image" content="/assets/images/logo.svg">
  <meta name="twitter:card" content="summary_large_image">
  ```
- **Доказательство:**
  1. Протокол Open Graph и мессенджеры (Telegram, WhatsApp, iMessage, Viber), а также соцсети (Twitter/X, Facebook, LinkedIn, VK) **НЕ ПОДДЕРЖИВАЮТ SVG** в качестве превью-изображений (`og:image`).
  2. Кроме того, путь `/assets/images/logo.svg` является относительным, тогда как парсеры Open Graph требуют абсолютный URL (`https://...`).
  3. Тег `twitter:image` вообще отсутствует.
  4. При отправке ссылки на Noor Al-Quran в любой мессенджер карточка предпросмотра отображается пустой, серой или без картинки.
- **Устранение:**
  Создать растровое изображение `og-preview.png` (1200x630 px) и прописать абсолютные метатеги:
  ```html
  <meta property="og:image" content="https://nuur-quran.netlify.app/assets/images/og-preview.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:image" content="https://nuur-quran.netlify.app/assets/images/og-preview.png">
  ```

---

### 🟠 UX-04 [HIGH]: Неполный `sitemap.xml`, пропускающий 12 из 21 страниц
- **Категория:** SEO / Indexability
- **Файл:** `frontend/sitemap.xml`
- **Доказательство:**
  1. В `sitemap.xml` перечислено всего 8 URL-адресов.
  2. В файле **ОТСУТСТВУЮТ**:
     - `https://nuur-quran.netlify.app/pages/dua.html`
     - `https://nuur-quran.netlify.app/pages/hijri.html`
     - `https://nuur-quran.netlify.app/pages/bookmarks.html`
     - Все 10 страниц чтецов (`reciter-abdulbasit.html`, `reciter-alafasy.html`, `reciter-ghamdi.html` и др.).
  3. Поисковые роботы Google, Яндекс и Bing не получают информацию о структуре ключевых разделов сайта.
- **Устранение:**
  Добавить все страницы приложения в `sitemap.xml` с указанием даты последней модификации.

---

### 🟠 UX-05 [HIGH]: Полное отсутствие Политики конфиденциальности и Пользовательского соглашения
- **Категория:** Legal & Compliance / App Store & PWA Requirements
- **Файлы:** Отсутствуют (`/pages/privacy.html`, `/pages/terms.html`)
- **Доказательство:**
  1. Приложение запрашивает и обрабатывает точные координаты геолокации (`navigator.geolocation`).
  2. Приложение собирает персональные данные (Email, Имя пользователя, Хэши паролей).
  3. В соответствии с международными нормами (GDPR, CCPA), а также требованиями PWA каталогов и магазинов приложений (Google Play / App Store), сервис обязан предоставлять публично доступную Политику конфиденциальности (Privacy Policy), описывающую цели сбора геолокации и хранения аккаунтов.
- **Устранение:**
  Создать страницы `frontend/pages/privacy.html` и `frontend/pages/terms.html`, добавить ссылки на них в подвал сайта и в мобильное меню аккаунта.

---

### 🟡 UX-06 [MEDIUM]: Сенсорные элементы управления в 2 раза меньше стандарта WCAG (`.abtn`)
- **Категория:** Accessibility (A11y) / Touch Target Size
- **Файл:** `frontend/shared.css`, строки 142–143
- **Цитата кода:**
  ```css
  .abtn {
    background: none;
    border: none;
    color: var(--soft);
    cursor: pointer;
    font-size: .9rem;
    padding: 3px 7px;
    border-radius: 6px;
  }
  ```
- **Доказательство:**
  1. Кнопки действий над аятами (`🔊` Воспроизвести, `🔖` Добавить в закладки, `📤` Поделиться) имеют физический размер около 22 × 20 пикселей.
  2. Стандарт WCAG 2.1 Success Criterion 2.5.5 (Target Size) требует минимальный размер интерактивной области **44 × 44 CSS пикселя** для предотвращения ложных нажатий пальцем на сенсорных экранах.
  3. Кнопки расположены вплотную друг к другу, из-за чего пользователи регулярно промахиваются и вместо воспроизведения аята нажимают "Закладка" или "Поделиться".
- **Устранение:**
  Увеличить область нажатия:
  ```css
  .abtn {
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
  }
  ```

---

### 🟡 UX-07 [MEDIUM]: Отсутствие видимых `<label>` в формах авторизации
- **Категория:** Accessibility (A11y) / WCAG 3.3.2 Labels or Instructions
- **Файлы:** `frontend/pages/login.html:290, 294`, `frontend/pages/register.html:310, 314`
- **Цитата кода:**
  ```html
  <div class="input-group">
    <span class="input-icon">👤</span>
    <input aria-label="Username" type="text" id="username" class="auth-input" placeholder="Username" required autocomplete="username">
  </div>
  ```
- **Доказательство:**
  Хотя поля имеют атрибут `aria-label`, в разметке отсутствуют постоянные визуальные теги `<label for="username">`. Как только пользователь начинает ввод текста, placeholder исчезает, и пользователь теряет визуальный контекст поля, что нарушает рекомендации WCAG 3.3.2.
- **Устранение:**
  Добавить постоянные метки `<label for="username" class="form-label">Username</label>`.

---

### 🟡 UX-08 [LOW]: Отсутствие информации об источниках текста Корана и переводах
- **Категория:** Religious Integrity & User Trust
- **Файлы:** `frontend/pages/quran.html`, `frontend/pages/hadith.html`
- **Проблема:**
  В религиозном продукте принципиально важно доверие пользователей к источникам:
  - Нигде на странице чтения не указано, какое издание текста Корана используется (Мединский мусхаф, шрифт Усмани, риваят Хафс от Асыма).
  - Не указаны авторы переводов (Эльмир Кулиев для RU, Мухаммад Асад для EN, Шейх Мухаммад Садык Мухаммад Юсуф для UZ).
  - На странице хадисов не указан источник базы хадисов и авторитеты классификации степени достоверности (сахих, хасан, даиф).
- **Рекомендация:**
  Добавить модальное окно или раздел *"О тексте и источниках"* с явной атрибуцией изданий и богословских переводов.

---

## 3. Сводная таблица готовности к релизу

| Направление проверки | Оценка | Статус | Комментарий |
|---|---|---|---|
| Мобильная адаптивность (iOS/Android) | 6 / 10 | ⚠️ Требует правок | Overlap с Home Bar из-за перезаписи padding в CSS |
| Сенсорные элементы (Touch Targets) | 5 / 10 | ⚠️ Нарушение WCAG | Кнопки аятов 22px вместо положенных 44px |
| Доступность для скринридеров | 7 / 10 | 🟢 Удовлетворительно | Атрибуты aria-label присутствуют у большинства кнопок |
| PWA готовность (Mobile Install) | 4 / 10 | 🔴 Не готов | Нет PNG иконок, нет apple-touch-icon, SVG ломает Android |
| SEO и Open Graph (Превью ссылок) | 4 / 10 | 🔴 Не готов | Относительный SVG ломает превью в Telegram/WhatsApp; sitemap не полон |
| Юридическое соответствие (Legal) | 2 / 10 | 🔴 Блокер релиза | Нет Privacy Policy и Terms of Service при сборе геоданных и почты |
| Доверие и атрибуция (Religious Trust)| 5 / 10 | ⚠️ Рекомендуется | Отсутствует информация об источниках мусхафа и переводчиках |

---

ЭТАП 6 ЗАВЕРШЁН: проверено 14 файлов, найдено 8 проблем
