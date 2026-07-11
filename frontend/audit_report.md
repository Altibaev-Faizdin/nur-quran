# Noor Al-Quran Frontend Audit Report

## 1. Viewport & SEO (HTML Files)

- **index.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **index.html**: Missing SEO tags: description, og:title, og:description, og:image, twitter:card
- **index.html**: Has buttons without aria-label (found 5).
- **pages/names.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/names.html**: Missing SEO tags: description, og:title, og:description, og:image, twitter:card
- **pages/bookmarks.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`
- **pages/bookmarks.html**: Missing SEO tags: description, og:title, og:description, og:image, twitter:card
- **pages/bookmarks.html**: Has buttons without aria-label (found 2).
- **pages/reciter-alafasy.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/reciter-alafasy.html**: Missing SEO tags: og:title, og:description, og:image, twitter:card
- **pages/reciter-alafasy.html**: Has buttons without aria-label (found 10).
- **pages/dua.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/dua.html**: Missing SEO tags: description, og:title, og:description, og:image, twitter:card
- **pages/dua.html**: Has buttons without aria-label (found 7).
- **pages/qibla.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/qibla.html**: Missing SEO tags: description, og:title, og:description, og:image, twitter:card
- **pages/qibla.html**: Has buttons without aria-label (found 3).
- **pages/reciters.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/reciters.html**: Missing SEO tags: description, og:title, og:description, og:image, twitter:card
- **pages/reciters.html**: Has buttons without aria-label (found 5).
- **pages/tasbih.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/tasbih.html**: Missing SEO tags: description, og:title, og:description, og:image, twitter:card
- **pages/tasbih.html**: Has buttons without aria-label (found 6).
- **pages/reciter-minshawi.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/reciter-minshawi.html**: Missing SEO tags: og:title, og:description, og:image, twitter:card
- **pages/reciter-minshawi.html**: Has buttons without aria-label (found 10).
- **pages/reciter-maher.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/reciter-maher.html**: Missing SEO tags: og:title, og:description, og:image, twitter:card
- **pages/reciter-maher.html**: Has buttons without aria-label (found 10).
- **pages/reciter-ghamdi.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/reciter-ghamdi.html**: Missing SEO tags: og:title, og:description, og:image, twitter:card
- **pages/reciter-ghamdi.html**: Has buttons without aria-label (found 10).
- **pages/quran.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/quran.html**: Missing SEO tags: description, og:title, og:description, og:image, twitter:card
- **pages/quran.html**: Has buttons without aria-label (found 12).
- **pages/reciter-yasser.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/reciter-yasser.html**: Missing SEO tags: og:title, og:description, og:image, twitter:card
- **pages/reciter-yasser.html**: Has buttons without aria-label (found 10).
- **pages/hijri.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/hijri.html**: Missing SEO tags: description, og:title, og:description, og:image, twitter:card
- **pages/hadith.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/hadith.html**: Missing SEO tags: og:title, og:description, og:image, twitter:card
- **pages/hadith.html**: Has buttons without aria-label (found 14).
- **pages/reciter-sherif-mostafa.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/reciter-sherif-mostafa.html**: Missing SEO tags: og:title, og:description, og:image, twitter:card
- **pages/reciter-sherif-mostafa.html**: Has buttons without aria-label (found 10).
- **pages/reciter-abdulbasit.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/reciter-abdulbasit.html**: Missing SEO tags: og:title, og:description, og:image, twitter:card
- **pages/reciter-abdulbasit.html**: Has buttons without aria-label (found 10).
- **pages/reciter-raad-kurdi.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/reciter-raad-kurdi.html**: Missing SEO tags: og:title, og:description, og:image, twitter:card
- **pages/reciter-raad-kurdi.html**: Has buttons without aria-label (found 10).
- **pages/prayer.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/prayer.html**: Missing SEO tags: description, og:title, og:description, og:image, twitter:card
- **pages/prayer.html**: Has buttons without aria-label (found 2).
- **pages/reciter-abdurrahman-mossad.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/reciter-abdurrahman-mossad.html**: Missing SEO tags: og:title, og:description, og:image, twitter:card
- **pages/reciter-abdurrahman-mossad.html**: Has buttons without aria-label (found 10).
- **pages/reciter-islam-sobhi.html**: Incorrect viewport. Found: `width=device-width, initial-scale=1.0`
- **pages/reciter-islam-sobhi.html**: Missing SEO tags: og:title, og:description, og:image, twitter:card
- **pages/reciter-islam-sobhi.html**: Has buttons without aria-label (found 10).

## 2. CSS Analysis (Responsive, Safe Area)

- **shared.css**: No safe-area-insets used.
- **shared.css**: Found breakpoints: @media(max-width:768px)
- **shared.css**: Missing landscape media queries.

## 3. JS Analysis (Console, Errors, Fetch)

- **reciter-player.js**: Found 3 console logs.
- **shared.js**: Found 3 console logs.

## 4. Root Files

- Missing `manifest.json`
- Missing `robots.txt`
- Missing `sitemap.xml`