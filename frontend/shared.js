/* ═══════════════════════════════════════════════
   shared.js — Noor Al-Quran Global Logic & Data
   ═══════════════════════════════════════════════ */

'use strict';

// ── XSS PROTECTION HELPER ──
function safeHTML(str) {
  var d = document.createElement('div');
  d.textContent = (str === undefined || str === null) ? '' : str;
  return d.innerHTML;
}
window.safeHTML = safeHTML;

// ── PRAYER TIMER TRACKER ──
var _prayerTimers = [];

// ── UNIFIED ROBUST STORAGE MANAGER ──
const StorageManager = {
  _prefix: 'nq_',
  get: function(key, defaultVal) {
    try {
      var v = localStorage.getItem(this._prefix + key);
      if (v === null) v = localStorage.getItem(key);
      if (v === null) return defaultVal;
      try {
        return JSON.parse(v);
      } catch (e) {
        return v;
      }
    } catch (e) {
      return defaultVal;
    }
  },
  set: function(key, val) {
    try {
      var serialized = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val);
      localStorage.setItem(this._prefix + key, serialized);
      if (['access_token', 'refresh_token', 'username', 'lang'].includes(key)) {
        try { localStorage.setItem(key, serialized); } catch (e) {}
      }
      return true;
    } catch (e) {
      console.warn('StorageManager.set quota exceeded or disabled', e);
      return false;
    }
  },
  remove: function(key) {
    try {
      localStorage.removeItem(this._prefix + key);
      localStorage.removeItem(key);
    } catch (e) {}
  }
};
window.StorageManager = StorageManager;
window.storageGet = function(k, d) { return StorageManager.get(k, d); };
window.storageSet = function(k, v) { return StorageManager.set(k, v); };
window.storageRemove = function(k) { return StorageManager.remove(k); };

// ── API BASE & ZERO-FAILURE DUAL FALLBACK ──
const isDevPort = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
                  window.location.port !== '' && window.location.port !== '8000';
const API_BASE = window.NQ_API_BASE || (isDevPort ? 'http://localhost:8000/api' : '/api');
const PUBLIC_QURAN_API = 'https://api.alquran.cloud/v1';
window.API_BASE = API_BASE;
window.PUBLIC_QURAN_API = PUBLIC_QURAN_API;

// ── RESILIENT SURAH FETCHER (Offline IndexedDB -> Backend -> alquran.cloud) ──
async function fetchSurahData(surahNum, lang) {
  lang = lang || 'en';
  const editionMap = { en: 'en.asad', ru: 'ru.kuliev', uz: 'uz.sodik' };
  const edition = editionMap[lang] || 'en.asad';

  // 1. Check native IndexedDB cache first
  if (window.NoorDB && typeof window.NoorDB.getSurah === 'function') {
    try {
      const cached = await window.NoorDB.getSurah(surahNum, lang);
      if (cached && (cached.code === 200 || cached.data)) {
        if (!navigator.onLine) {
          return cached;
        }
        _backgroundSyncSurah(surahNum, lang, edition);
        return cached;
      }
    } catch (e) {}
  }

  // 2. Try configured backend API first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE}/surahs/${surahNum}/?lang=${lang}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const d = await res.json();
      if (d && (d.code === 200 || d.data)) {
        if (window.NoorDB && window.NoorDB.saveSurah) {
          window.NoorDB.saveSurah(surahNum, lang, d);
        }
        return d;
      }
    }
  } catch (e) {
    // Backend offline / timeout -> proceed directly to alquran.cloud
  }

  // 3. Fallback to public API alquran.cloud
  try {
    const pubUrl = `https://api.alquran.cloud/v1/surah/${surahNum}/editions/quran-uthmani,${edition}`;
    const res = await fetch(pubUrl);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const d = await res.json();
    if (window.NoorDB && window.NoorDB.saveSurah) {
      window.NoorDB.saveSurah(surahNum, lang, d);
    }
    return d;
  } catch (e) {
    if (window.NoorDB && window.NoorDB.getSurah) {
      try {
        const lastResort = await window.NoorDB.getSurah(surahNum, lang);
        if (lastResort) return lastResort;
      } catch (err) {}
    }
    console.warn('Fallback to basic uthmani text for surah ' + surahNum, e);
    const singleUrl = `https://api.alquran.cloud/v1/surah/${surahNum}`;
    const res = await fetch(singleUrl);
    const d = await res.json();
    return {
      code: 200,
      data: [
        { edition: { identifier: 'quran-uthmani' }, ayahs: d.data.ayahs },
        { edition: { identifier: edition }, ayahs: d.data.ayahs.map(a => ({ numberInSurah: a.numberInSurah, text: '' })) }
      ]
    };
  }
}

async function _backgroundSyncSurah(surahNum, lang, edition) {
  try {
    const res = await fetch(`${API_BASE}/surahs/${surahNum}/?lang=${lang}`);
    if (res.ok) {
      const d = await res.json();
      if (d && (d.code === 200 || d.data) && window.NoorDB) {
        window.NoorDB.saveSurah(surahNum, lang, d);
      }
    }
  } catch (e) {}
}
window.fetchSurahData = fetchSurahData;

// ── RECITERS DATA ──
// Alafasy removed; Sherif Mostafa and Sheikh Saud Al-Juma'a added.
const RECITERS = [
  {
    id: 'abdulbasit',
    server: 'https://server7.mp3quran.net/basit/',
    photo: '../assets/images/reciters/abdulbasit.webp?v=2',
    ar: 'عبد الباسط عبد الصمد',
    en: 'Abdul Basit Abd us-Samad',
    style: 'Mujawwad',
    country: 'Egypt',
    init: 'ع',
    bio: 'Sheikh Abdul Basit was an Egyptian reciter widely regarded as one of the greatest Quran reciters of all time. His iconic recitations are broadcast worldwide.',
    page: 'reciter-abdulbasit.html',
  },
  {
    id: 'ghamdi',
    server: 'https://server7.mp3quran.net/s_gmd/',
    photo: '../assets/images/reciters/ghamdi.webp?v=2',
    ar: 'سعد الغامدي',
    en: 'Saad Al-Ghamdi',
    style: 'Murattal',
    country: 'Saudi Arabia',
    init: 'س',
    bio: "Sheikh Saad Al-Ghamdi is a Saudi reciter beloved for his clear, calm and melodious recitation style, widely listened to for daily Quran reading.",
    page: 'reciter-ghamdi.html',
  },
  {
    id: 'minshawi',
    server: 'https://server10.mp3quran.net/minsh/',
    photo: '../assets/images/reciters/minshawi.webp?v=2',
    ar: 'محمد صديق المنشاوي',
    en: 'Mohamed Siddiq El-Minshawi',
    style: 'Mujawwad',
    country: 'Egypt',
    init: 'م',
    bio: 'Sheikh El-Minshawi was an Egyptian reciter known for his deep emotional connection to the Quran, carrying profound spiritual depth.',
    page: 'reciter-minshawi.html',
  },
  {
    id: 'maher',
    server: 'https://server12.mp3quran.net/maher/',
    photo: '../assets/images/reciters/maher.webp?v=2',
    ar: 'ماهر المعيقلي',
    en: 'Maher Al Muaiqly',
    style: 'Murattal',
    country: 'Saudi Arabia',
    init: 'م',
    bio: 'Sheikh Maher Al Muaiqly is the Imam of the Grand Mosque in Makkah, celebrated for his resonant and moving recitation during Taraweeh prayers.',
    page: 'reciter-maher.html',
  },
  {
    id: 'mishary_alafasy',
    server: 'https://server8.mp3quran.net/afs/',
    photo: '../assets/images/reciters/mishary_alafasy.webp?v=2',
    ar: 'مشاري العفاسي',
    en: 'Mishary Alafasy',
    style: 'Murattal',
    country: 'Kuwait',
    init: 'م',
    bio: 'Sheikh Mishary Alafasy is a world-renowned Quran reciter, Imam, and Munshid from Kuwait, famous for his distinct and beautiful recitation style.',
    page: 'reciter-alafasy.html',
  },
  {
    id: 'islam_sobhi',
    server: 'https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/',
    photo: '../assets/images/reciters/islam_sobhi.webp?v=2',
    ar: 'إسلام صبحي',
    en: 'Islam Sobhi',
    style: 'Murattal',
    country: 'Egypt',
    init: 'إ',
    bio: 'Sheikh Islam Sobhi is a young Egyptian Quran reciter whose exceptionally moving voice has made him one of the most widely loved reciters of his generation, with millions of followers worldwide.',
    page: 'reciter-islam-sobhi.html',
  },
  {
    id: 'yasser_dosari',
    server: 'https://server11.mp3quran.net/yasser/',
    photo: '../assets/images/reciters/yasser_dosari.webp?v=2',
    ar: 'ياسر الدوسري',
    en: 'Yasser Al-Dosari',
    style: 'Murattal',
    country: 'Saudi Arabia',
    init: 'ي',
    bio: 'Sheikh Yasser Al-Dosari is the Imam of Masjid Al-Haram in Makkah, celebrated for his deeply emotional and powerful recitation that moves the hearts of listeners during Taraweeh prayers and beyond.',
    page: 'reciter-yasser.html',
  },
  {
    id: 'sherif_mostafa',
    server: 'https://download.quranplayermp3.com/quran/mix/Sherif-Mostafa/',
    photo: '../assets/images/reciters/sherif_mostafa.webp?v=2',
    ar: 'شريف مصطفى',
    en: 'Sherif Mostafa',
    style: 'Murattal',
    country: 'Egypt',
    init: 'ش',
    bio: 'Sheikh Sherif Mostafa is an Egyptian Quran reciter known for his deeply moving and spiritual recitation style, bringing comfort and tranquility to listeners worldwide.',
    page: 'reciter-sherif-mostafa.html',
  },
  {
    id: 'abdurrahman_mossad',
    server: 'https://download.quranplayermp3.com/quran/mix/Abdul-Rahman-Mosad/',
    photo: '../assets/images/reciters/abdurrahman_mossad.webp?v=2',
    ar: 'عبدالرحمن مسعد',
    en: 'Abdurrahman Mossad',
    style: 'Murattal',
    country: 'Egypt',
    init: 'ع',
    bio: 'Sheikh Abdurrahman Mossad is a young Egyptian Quran reciter whose heartfelt and powerful voice has gained him millions of followers, known for his deeply emotional recitations that touch the soul.',
    page: 'reciter-abdurrahman-mossad.html',
  },
  {
    id: 'raad_kurdi',
    server: 'https://server6.mp3quran.net/kurdi/',
    photo: '../assets/images/reciters/raad_kurdi.webp?v=2',
    ar: 'رعد محمد الكردي',
    en: 'Raad Mohammad Al Kurdi',
    style: 'Murattal',
    country: 'Iraq',
    init: 'ر',
    bio: 'Sheikh Raad Mohammad Al Kurdi is an Iraqi Quran reciter and Imam known for his beautiful, distinct, and emotional recitation style.',
    page: 'reciter-raad-kurdi.html',
  }
];

// ── SURAH DATA (114 surahs) ──
var SURAHS = [
  { n: 1, ar: 'الفاتحة', en: 'Al-Fatihah', v: 7 }, { n: 2, ar: 'البقرة', en: 'Al-Baqarah', v: 286 }, { n: 3, ar: 'آل عمران', en: "Ali 'Imran", v: 200 },
  { n: 4, ar: 'النساء', en: "An-Nisa'", v: 176 }, { n: 5, ar: 'المائدة', en: "Al-Ma'idah", v: 120 }, { n: 6, ar: 'الأنعام', en: "Al-An'am", v: 165 },
  { n: 7, ar: 'الأعراف', en: "Al-A'raf", v: 206 }, { n: 8, ar: 'الأنفال', en: 'Al-Anfal', v: 75 }, { n: 9, ar: 'التوبة', en: 'At-Tawbah', v: 129 },
  { n: 10, ar: 'يونس', en: 'Yunus', v: 109 }, { n: 11, ar: 'هود', en: 'Hud', v: 123 }, { n: 12, ar: 'يوسف', en: 'Yusuf', v: 111 },
  { n: 13, ar: 'الرعد', en: "Ar-Ra'd", v: 43 }, { n: 14, ar: 'إبراهيم', en: 'Ibrahim', v: 52 }, { n: 15, ar: 'الحجر', en: 'Al-Hijr', v: 99 },
  { n: 16, ar: 'النحل', en: 'An-Nahl', v: 128 }, { n: 17, ar: 'الإسراء', en: "Al-Isra'", v: 111 }, { n: 18, ar: 'الكهف', en: 'Al-Kahf', v: 110 },
  { n: 19, ar: 'مريم', en: 'Maryam', v: 98 }, { n: 20, ar: 'طه', en: 'Ta-Ha', v: 135 }, { n: 21, ar: 'الأنبياء', en: "Al-Anbiya'", v: 112 },
  { n: 22, ar: 'الحج', en: 'Al-Hajj', v: 78 }, { n: 23, ar: 'المؤمنون', en: "Al-Mu'minun", v: 118 }, { n: 24, ar: 'النور', en: 'An-Nur', v: 64 },
  { n: 25, ar: 'الفرقان', en: 'Al-Furqan', v: 77 }, { n: 26, ar: 'الشعراء', en: "Ash-Shu'ara'", v: 227 }, { n: 27, ar: 'النمل', en: 'An-Naml', v: 93 },
  { n: 28, ar: 'القصص', en: 'Al-Qasas', v: 88 }, { n: 29, ar: 'العنكبوت', en: 'Al-Ankabut', v: 69 }, { n: 30, ar: 'الروم', en: 'Ar-Rum', v: 60 },
  { n: 31, ar: 'لقمان', en: 'Luqman', v: 34 }, { n: 32, ar: 'السجدة', en: 'As-Sajdah', v: 30 }, { n: 33, ar: 'الأحزاب', en: 'Al-Ahzab', v: 73 },
  { n: 34, ar: 'سبأ', en: "Saba'", v: 54 }, { n: 35, ar: 'فاطر', en: 'Fatir', v: 45 }, { n: 36, ar: 'يس', en: 'Ya-Sin', v: 83 },
  { n: 37, ar: 'الصافات', en: 'As-Saffat', v: 182 }, { n: 38, ar: 'ص', en: 'Sad', v: 88 }, { n: 39, ar: 'الزمر', en: 'Az-Zumar', v: 75 },
  { n: 40, ar: 'غافر', en: 'Ghafir', v: 85 }, { n: 41, ar: 'فصلت', en: 'Fussilat', v: 54 }, { n: 42, ar: 'الشورى', en: 'Ash-Shura', v: 53 },
  { n: 43, ar: 'الزخرف', en: 'Az-Zukhruf', v: 89 }, { n: 44, ar: 'الدخان', en: 'Ad-Dukhan', v: 59 }, { n: 45, ar: 'الجاثية', en: 'Al-Jathiyah', v: 37 },
  { n: 46, ar: 'الأحقاف', en: 'Al-Ahqaf', v: 35 }, { n: 47, ar: 'محمد', en: 'Muhammad', v: 38 }, { n: 48, ar: 'الفتح', en: 'Al-Fath', v: 29 },
  { n: 49, ar: 'الحجرات', en: 'Al-Hujurat', v: 18 }, { n: 50, ar: 'ق', en: 'Qaf', v: 45 }, { n: 51, ar: 'الذاريات', en: 'Adh-Dhariyat', v: 60 },
  { n: 52, ar: 'الطور', en: 'At-Tur', v: 49 }, { n: 53, ar: 'النجم', en: 'An-Najm', v: 62 }, { n: 54, ar: 'القمر', en: 'Al-Qamar', v: 55 },
  { n: 55, ar: 'الرحمن', en: 'Ar-Rahman', v: 78 }, { n: 56, ar: 'الواقعة', en: "Al-Waqi'ah", v: 96 }, { n: 57, ar: 'الحديد', en: 'Al-Hadid', v: 29 },
  { n: 58, ar: 'المجادلة', en: 'Al-Mujadila', v: 22 }, { n: 59, ar: 'الحشر', en: 'Al-Hashr', v: 24 }, { n: 60, ar: 'الممتحنة', en: 'Al-Mumtahanah', v: 13 },
  { n: 61, ar: 'الصف', en: 'As-Saf', v: 14 }, { n: 62, ar: 'الجمعة', en: "Al-Jumu'ah", v: 11 }, { n: 63, ar: 'المنافقون', en: 'Al-Munafiqun', v: 11 },
  { n: 64, ar: 'التغابن', en: 'At-Taghabun', v: 18 }, { n: 65, ar: 'الطلاق', en: 'At-Talaq', v: 12 }, { n: 66, ar: 'التحريم', en: 'At-Tahrim', v: 12 },
  { n: 67, ar: 'الملك', en: 'Al-Mulk', v: 30 }, { n: 68, ar: 'القلم', en: 'Al-Qalam', v: 52 }, { n: 69, ar: 'الحاقة', en: 'Al-Haqqah', v: 52 },
  { n: 70, ar: 'المعارج', en: "Al-Ma'arij", v: 44 }, { n: 71, ar: 'نوح', en: 'Nuh', v: 28 }, { n: 72, ar: 'الجن', en: 'Al-Jinn', v: 28 },
  { n: 73, ar: 'المزمل', en: 'Al-Muzzammil', v: 20 }, { n: 74, ar: 'المدثر', en: 'Al-Muddaththir', v: 56 }, { n: 75, ar: 'القيامة', en: 'Al-Qiyamah', v: 40 },
  { n: 76, ar: 'الإنسان', en: 'Al-Insan', v: 31 }, { n: 77, ar: 'المرسلات', en: 'Al-Mursalat', v: 50 }, { n: 78, ar: 'النبأ', en: "An-Naba'", v: 40 },
  { n: 79, ar: 'النازعات', en: "An-Nazi'at", v: 46 }, { n: 80, ar: 'عبس', en: 'Abasa', v: 42 }, { n: 81, ar: 'التكوير', en: 'At-Takwir', v: 29 },
  { n: 82, ar: 'الانفطار', en: 'Al-Infitar', v: 19 }, { n: 83, ar: 'المطففين', en: 'Al-Mutaffifin', v: 36 }, { n: 84, ar: 'الانشقاق', en: 'Al-Inshiqaq', v: 25 },
  { n: 85, ar: 'البروج', en: 'Al-Buruj', v: 22 }, { n: 86, ar: 'الطارق', en: 'At-Tariq', v: 17 }, { n: 87, ar: 'الأعلى', en: "Al-A'la", v: 19 },
  { n: 88, ar: 'الغاشية', en: 'Al-Ghashiyah', v: 26 }, { n: 89, ar: 'الفجر', en: 'Al-Fajr', v: 30 }, { n: 90, ar: 'البلد', en: 'Al-Balad', v: 20 },
  { n: 91, ar: 'الشمس', en: 'Ash-Shams', v: 15 }, { n: 92, ar: 'الليل', en: 'Al-Layl', v: 21 }, { n: 93, ar: 'الضحى', en: 'Ad-Duha', v: 11 },
  { n: 94, ar: 'الشرح', en: 'Ash-Sharh', v: 8 }, { n: 95, ar: 'التين', en: 'At-Tin', v: 8 }, { n: 96, ar: 'العلق', en: "Al-'Alaq", v: 19 },
  { n: 97, ar: 'القدر', en: 'Al-Qadr', v: 5 }, { n: 98, ar: 'البينة', en: 'Al-Bayyinah', v: 8 }, { n: 99, ar: 'الزلزلة', en: 'Az-Zalzalah', v: 8 },
  { n: 100, ar: 'العاديات', en: "Al-'Adiyat", v: 11 }, { n: 101, ar: 'القارعة', en: "Al-Qari'ah", v: 11 }, { n: 102, ar: 'التكاثر', en: 'At-Takathur', v: 8 },
  { n: 103, ar: 'العصر', en: "Al-'Asr", v: 3 }, { n: 104, ar: 'الهمزة', en: 'Al-Humazah', v: 9 }, { n: 105, ar: 'الفيل', en: 'Al-Fil', v: 5 },
  { n: 106, ar: 'قريش', en: 'Quraysh', v: 4 }, { n: 107, ar: 'الماعون', en: "Al-Ma'un", v: 7 }, { n: 108, ar: 'الكوثر', en: 'Al-Kawthar', v: 3 },
  { n: 109, ar: 'الكافرون', en: 'Al-Kafirun', v: 6 }, { n: 110, ar: 'النصر', en: 'An-Nasr', v: 3 }, { n: 111, ar: 'المسد', en: 'Al-Masad', v: 5 },
  { n: 112, ar: 'الإخلاص', en: 'Al-Ikhlas', v: 4 }, { n: 113, ar: 'الفلق', en: 'Al-Falaq', v: 5 }, { n: 114, ar: 'الناس', en: 'An-Nas', v: 6 },
];
window.SURAHS = SURAHS;

const MOSSAD_AVAILABLE = [
  10, 19, 23, 29, 32, 49, 73, 78, 87, 88, 100, 107
];

const SHERIF_AVAILABLE = [
  13, 15, 19, 20, 31, 32, 53, 55, 56, 57, 60,
  61, 62, 63, 64, 65, 66, 67, 71, 75, 76, 77, 89
];

// ── STARS ──
(function () {
  const c = document.getElementById('sc'); if (!c) return;
  const x = c.getContext('2d'); let s = [];
  function rs() {
    c.width = innerWidth; c.height = innerHeight; s = [];
    const n = Math.floor(c.width * c.height / 2800);
    for (let i = 0; i < n; i++) s.push({
      x: Math.random() * c.width, y: Math.random() * c.height,
      r: Math.random() * 1.7 + 0.2, a: Math.random(),
      sp: Math.random() * 0.008 + 0.002, ph: Math.random() * Math.PI * 2,
      col: ['#fff', '#fffde0', '#d0e8ff', '#f0d060'][Math.floor(Math.random() * 4)],
    });
  }
  function draw() {
    x.clearRect(0, 0, c.width, c.height);
    const t = Date.now() * 0.001;
    s.forEach(v => {
      const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * v.sp * 10 + v.ph));
      x.beginPath(); x.arc(v.x, v.y, v.r, 0, Math.PI * 2);
      x.fillStyle = v.col; x.globalAlpha = a * v.a; x.fill();
      if (v.r > 1.2) {
        x.beginPath(); x.arc(v.x, v.y, v.r * 2.5, 0, Math.PI * 2);
        x.fillStyle = v.col; x.globalAlpha = a * v.a * 0.12; x.fill();
      }
      x.globalAlpha = 1;
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', rs); rs(); draw();
})();

// ── CURSOR ──
(function () {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const d = document.getElementById('cur'), t = document.getElementById('cur-t');
  if (!d || !t) return;
  let mx = 0, my = 0, tx = 0, ty = 0;
  let rafId = null;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    d.style.left = mx - 5 + 'px'; d.style.top = my - 5 + 'px';
    if (!rafId) {
      rafId = requestAnimationFrame(updateTrailingCursor);
    }
  }, { passive: true });

  function updateTrailingCursor() {
    tx += (mx - tx) * 0.12;
    ty += (my - ty) * 0.12;
    t.style.left = tx - 14 + 'px';
    t.style.top = ty - 14 + 'px';
    if (Math.abs(mx - tx) > 0.1 || Math.abs(my - ty) > 0.1) {
      rafId = requestAnimationFrame(updateTrailingCursor);
    } else {
      rafId = null;
    }
  }
})();

// ── HIJRI DATE ──
function toHijri(date, adjustment) {
  date = date || new Date();
  if (typeof adjustment !== 'number') {
    try {
      adjustment = parseInt(localStorage.getItem('nq_hijri_adj') || '0', 10);
      if (isNaN(adjustment)) adjustment = 0;
    } catch (e) {
      adjustment = 0;
    }
  }
  const d = new Date(date.getTime() + adjustment * 86400000);
  try {
    const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    }).formatToParts(d);
    let y = 1445, m = 1, day = 1;
    parts.forEach(p => {
      if (p.type === 'year') y = parseInt(p.value, 10);
      if (p.type === 'month') m = parseInt(p.value, 10);
      if (p.type === 'day') day = parseInt(p.value, 10);
    });
    return { day: day, month: m - 1, year: y };
  } catch (err) {
    const jd = Math.floor(d.getTime() / 86400000) + 2440587.5;
    let l = Math.floor(jd) - 1948440 + 10632, n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
    l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    return { day: l - Math.floor((709 * Math.floor((24 * l) / 709)) / 24), month: Math.floor((24 * l) / 709) - 1, year: 30 * n + j - 30 };
  }
}
window.toHijri = toHijri;
const HM = ['Muharram', 'Safar', 'Rabi I', 'Rabi II', 'Jumada I', 'Jumada II', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhul Qa'dah", 'Dhul Hijjah'];
const HMA = ['مُحَرَّم', 'صَفَر', 'رَبِيع الأَوَّل', 'رَبِيع الآخِر', 'جُمَادَى الأُولَى', 'جُمَادَى الآخِرَة', 'رَجَب', 'شَعْبَان', 'رَمَضَان', 'شَوَّال', 'ذُو القَعْدَة', 'ذُو الحِجَّة'];
window.HM = HM;
window.HMA = HMA;

// ── CLOCK ──
(function () {
  const D = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function upd() {
    const n = new Date();
    const h = String(n.getHours()).padStart(2, '0'), m = String(n.getMinutes()).padStart(2, '0'), s = String(n.getSeconds()).padStart(2, '0');
    set('ct', `${h}:${m}:${s}`);
    set('cd', `${D[n.getDay()]}, ${M[n.getMonth()]} ${n.getDate()}, ${n.getFullYear()}`);
    const hj = toHijri(n);
    set('ch', `${hj.day} ${HM[hj.month]} ${hj.year} AH`);
    set('hd', hj.day); set('hm', `${HM[hj.month]} ${hj.year} AH`); set('ha', HMA[hj.month]);
  }
  setInterval(upd, 1000); upd();
})();

// ── DOM HELPER ──
function set(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

// ── ASTRONOMICAL OFFLINE PRAYER TIMES CALCULATION ──
function calculateOfflinePrayerTimes(latitude, longitude, date, options) {
  date = date || new Date();
  options = options || {};
  var rad = function(d) { return d * Math.PI / 180; };
  var deg = function(r) { return r * 180 / Math.PI; };
  var fixHour = function(h) { h = h - 24 * Math.floor(h / 24); return h < 0 ? h + 24 : h; };
  var fixAngle = function(a) { a = a - 360 * Math.floor(a / 360); return a < 0 ? a + 360 : a; };

  var methods = {
    1: { fajr: 18, isha: 18 },           // Karachi
    2: { fajr: 15, isha: 15 },           // ISNA
    3: { fajr: 18, isha: 17 },           // MWL (default)
    4: { fajr: 18.5, ishaInterval: 90 }, // Makkah Umm al-Qura
    5: { fajr: 19.5, isha: 17.5 },       // Egyptian Authority
    13: { fajr: 18, isha: 17 },          // Diyanet
    14: { fajr: 16, isha: 15 }           // SAMRF Russia
  };

  var methodId = options.method || 3;
  var method = methods[methodId] || methods[3];
  var asrHanafi = !!options.hanafi;

  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var D = (367 * year) - Math.floor((7 * (year + Math.floor((month + 9) / 12))) / 4) + Math.floor((275 * month) / 9) + day - 730531.5;

  var L = fixAngle(280.461 + 0.9856474 * D);
  var M = fixAngle(357.528 + 0.9856003 * D);
  var Lambda = fixAngle(L + 1.915 * Math.sin(rad(M)) + 0.020 * Math.sin(rad(2 * M)));
  var obliq = 23.439 - 0.0000004 * D;
  var alpha = deg(Math.atan2(Math.cos(rad(obliq)) * Math.sin(rad(Lambda)), Math.cos(rad(Lambda)))) / 15;
  var delta = deg(Math.asin(Math.sin(rad(obliq)) * Math.sin(rad(Lambda))));
  var equationOfTime = (L / 15) - fixHour(alpha);

  var timezone = typeof options.timezone === 'number' ? options.timezone : -date.getTimezoneOffset() / 60;
  var noon = fixHour(12 + timezone - (longitude / 15) - equationOfTime);

  var sunAngleTime = function(angle, direction) {
    var val = (-Math.sin(rad(angle)) - Math.sin(rad(latitude)) * Math.sin(rad(delta))) /
              (Math.cos(rad(latitude)) * Math.cos(rad(delta)));
    if (val > 1 || val < -1) return null;
    var hourAngle = deg(Math.acos(val)) / 15;
    return fixHour(noon + (direction * hourAngle));
  };

  var asrTime = function() {
    var diff = Math.abs(latitude - delta);
    var shadowFactor = asrHanafi ? 2 : 1;
    var angle = deg(Math.atan(shadowFactor + Math.tan(rad(diff))));
    var val = (Math.sin(rad(90 - angle)) - Math.sin(rad(latitude)) * Math.sin(rad(delta))) /
              (Math.cos(rad(latitude)) * Math.cos(rad(delta)));
    if (val > 1 || val < -1) return fixHour(noon + (asrHanafi ? 3.8 : 3.2));
    var hourAngle = deg(Math.acos(val)) / 15;
    return fixHour(noon + hourAngle);
  };

  var sunriseFloat = sunAngleTime(0.833, -1);
  var maghribFloat = sunAngleTime(0.833, 1);
  var fajrFloat = sunAngleTime(method.fajr, -1);
  var ishaFloat = method.ishaInterval ? fixHour(maghribFloat + method.ishaInterval / 60) : sunAngleTime(method.isha, 1);

  if (sunriseFloat !== null && maghribFloat !== null) {
    var nightPortion = fixHour(24 - maghribFloat + sunriseFloat);
    if (fajrFloat === null || Math.abs(latitude) > 55) {
      var fajrPortion = (method.fajr / 60) * (nightPortion / 2);
      fajrFloat = fixHour(sunriseFloat - Math.min(nightPortion / 7, fajrPortion));
    }
    if (ishaFloat === null || (Math.abs(latitude) > 55 && !method.ishaInterval)) {
      var ishaPortion = (method.isha / 60) * (nightPortion / 2);
      ishaFloat = fixHour(maghribFloat + Math.min(nightPortion / 7, ishaPortion));
    }
  }

  var toHHMM = function(floatHour) {
    if (floatHour === null || isNaN(floatHour)) return '--:--';
    floatHour = fixHour(floatHour + 0.5 / 60);
    var h = Math.floor(floatHour);
    var m = Math.floor((floatHour - h) * 60);
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  };

  return {
    Fajr: toHHMM(fajrFloat),
    Sunrise: toHHMM(sunriseFloat),
    Dhuhr: toHHMM(noon),
    Asr: toHHMM(asrTime()),
    Maghrib: toHHMM(maghribFloat),
    Isha: toHHMM(ishaFloat)
  };
}
window.calculateOfflinePrayerTimes = calculateOfflinePrayerTimes;

// ── PRAYER TIMES ──
function loadPrayer() {
  // Check localStorage cache (TTL: 30 minutes)
  var PRAYER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes in ms
  var cached = null;
  try {
    var raw = localStorage.getItem('prayer_cache');
    if (raw) {
      var parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts < PRAYER_CACHE_TTL) cached = parsed.data;
    }
  } catch(e) {}
  if (cached) {
    var t = cached;
    set('ft', t.Fajr); set('srt', t.Sunrise); set('dt', t.Dhuhr);
    set('at', t.Asr); set('mt', t.Maghrib); set('it', t.Isha);
    hlPrayer(t); schedulePrayer(t);
    return;
  }

  var err = function() {
    var lastCoords = null;
    try {
      var raw = localStorage.getItem('last_coords');
      if (raw) lastCoords = JSON.parse(raw);
    } catch(e) {}
    var la = lastCoords ? lastCoords.lat : 21.3891;
    var lo = lastCoords ? lastCoords.lng : 39.8579;
    var t = calculateOfflinePrayerTimes(la, lo);
    set('ft', t.Fajr); set('srt', t.Sunrise); set('dt', t.Dhuhr);
    set('at', t.Asr); set('mt', t.Maghrib); set('it', t.Isha);
    hlPrayer(t); schedulePrayer(t);
    const b = document.querySelector('.pbar .bsm');
    if (b) b.textContent = "📍 Offline Calc";
  };
  var fetchPrayer = function (la, lo) {
    try { localStorage.setItem('last_coords', JSON.stringify({lat: la, lng: lo})); } catch(e) {}
    fetch(`${API_BASE}/prayer-times/?lat=${la}&lng=${lo}&method=2`)
      .then(r => r.json()).then(d => {
        const t = d.data.timings;
        // Cache the result
        try { localStorage.setItem('prayer_cache', JSON.stringify({ts: Date.now(), data: t})); } catch(e) {}
        set('ft', t.Fajr); set('srt', t.Sunrise); set('dt', t.Dhuhr);
        set('at', t.Asr); set('mt', t.Maghrib); set('it', t.Isha);
        hlPrayer(t); schedulePrayer(t);
        const b = document.querySelector('.pbar .bsm');
        if (b) b.textContent = "📍 My Location";
      }).catch(err);
  };
  var fb = async function () {
    try {
      let r = await fetch('https://ipapi.co/json/');
      let d = await r.json();
      if (d.latitude) return fetchPrayer(d.latitude, d.longitude);
    } catch(e) {}
    try {
      let r2 = await fetch('https://get.geojs.io/v1/ip/geo.json');
      let d2 = await r2.json();
      if (d2.latitude) return fetchPrayer(d2.latitude, d2.longitude);
    } catch(e) {}
    err();
  };
  if (!navigator.geolocation) return fb();
  navigator.geolocation.getCurrentPosition(function (pos) { fetchPrayer(pos.coords.latitude, pos.coords.longitude); }, fb);
}

function hlPrayer(t) {
  const cur = new Date().getHours() * 60 + new Date().getMinutes();
  const tm = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const ps = [{ id: 'fi', m: tm(t.Fajr) }, { id: 'si', m: tm(t.Sunrise) }, { id: 'di', m: tm(t.Dhuhr) }, { id: 'ai', m: tm(t.Asr) }, { id: 'mi', m: tm(t.Maghrib) }, { id: 'ii', m: tm(t.Isha) }];
  ps.forEach(p => { const e = document.getElementById(p.id); if (e) e.classList.remove('on'); });
  for (let i = ps.length - 1; i >= 0; i--) { if (cur >= ps[i].m) { const e = document.getElementById(ps[i].id); if (e) { e.classList.add('on'); break; } } }
}

function schedulePrayer(t) {
  _prayerTimers.forEach(function(id) { clearTimeout(id); });
  _prayerTimers = [];
  ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach(function(nm) {
    const [h, m] = t[nm].split(':').map(Number);
    const now = new Date(), tgt = new Date(); tgt.setHours(h, m, 0, 0);
    const diff = tgt - now;
    if (diff > 0 && diff < 86400000) _prayerTimers.push(setTimeout(function() { showAdhan(nm, t[nm]); }, diff));
  });
}

function showAdhan(nm, time) {
  const b = document.getElementById('adhan'); if (!b) return;
  set('adn', `Time for ${nm} Prayer`); set('ads', `${time} — ${nm} prayer time`);
  var savedReciter = localStorage.getItem('adhan_reciter') || 'mishary_alafasy';
  var sel = document.getElementById('adhanReciterSel');
  if (sel) sel.value = savedReciter;
  b.classList.add('show');
  // Play adhan audio for selected reciter
  var reciter = savedReciter;
  var reciterObj = RECITERS.find(function(r) { return r.id === reciter || (reciter === 'mishary' && r.id === 'mishary_alafasy'); });
  if (reciterObj) {
    var adhanAud = document.getElementById('adhan-audio');
    if (!adhanAud) {
      adhanAud = document.createElement('audio');
      adhanAud.id = 'adhan-audio';
      document.body.appendChild(adhanAud);
    }
    adhanAud.src = reciterObj.server + '001.mp3';
    adhanAud.play().catch(function() {});
  }
}
function closeAdhan() {
  const b = document.getElementById('adhan');
  if (b) b.classList.remove('show');
  var adhanAud = document.getElementById('adhan-audio');
  if (adhanAud) { adhanAud.pause(); adhanAud.currentTime = 0; }
}

function changeAdhanReciter(val) {
  storageSet('adhan_reciter', val);
  var sel = document.getElementById('adhanReciterSel');
  if (sel && sel.value !== val) sel.value = val;
}

// ── QIBLA ──
function getQibla() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(function (pos) {
    const la = pos.coords.latitude * Math.PI / 180, lo = pos.coords.longitude * Math.PI / 180;
    const mla = 21.3891 * Math.PI / 180, mlo = 39.8579 * Math.PI / 180, dl = mlo - lo;
    const xx = Math.sin(dl) * Math.cos(mla), yy = Math.cos(la) * Math.sin(mla) - Math.sin(la) * Math.cos(mla) * Math.cos(dl);
    const b = (Math.atan2(xx, yy) * 180 / Math.PI + 360) % 360;
    const qa = document.getElementById('qa'); if (qa) qa.style.transform = `translateX(-50%) translateY(-100%) rotate(${b}deg)`;
    set('qt', `Qibla: ${Math.round(b)}° from North`);
  });
}
if (window.DeviceOrientationEvent) {
  window.addEventListener('deviceorientation', function (e) {
    const cn = document.getElementById('cn'); if (cn) cn.style.transform = `translateX(-50%) translateY(-100%) rotate(${e.alpha || 0}deg)`;
  });
}

// ── TASBIH (renamed to avoid conflict with tasbih.html) ──
const TASBIH_DHIKRS = [{ ar: 'سُبْحَانَ اللَّهِ', max: 33 }, { ar: 'الْحَمْدُ لِلَّهِ', max: 33 }, { ar: 'اللَّهُ أَكْبَرُ', max: 34 }];
var TC = 0, TI = 0;
function tasbihTap() { var mx = TASBIH_DHIKRS[TI].max; if (TC < mx) { TC++; updT(); } }
function tasbihReset() { TC = 0; updT(); }
function setDhikr(i) { TI = i; TC = 0; updT(); document.querySelectorAll('.db').forEach(function (b, j) { b.classList.toggle('on', j === i); }); }
function updT() { set('tsc', TC); set('tsl', TASBIH_DHIKRS[TI].ar); var b = document.getElementById('tsb'); if (b) b.style.width = (TC / TASBIH_DHIKRS[TI].max * 100) + '%'; }

// ── DUA ──
const DUAS = [
  { ar: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا', en: '"O Allah, by You we enter the morning and by You we enter the evening."', ru: '«О Аллах, с Тобой мы вошли в утро и с Тобой мы вошли в вечер.»' },
  { ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً', en: '"Our Lord, give us good in this world and good in the Hereafter."', ru: '«Господь наш, даруй нам добро в этом мире и добро в мире ином.»' },
  { ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ', en: '"O Allah, I ask You for well-being in this world and in the Hereafter."', ru: '«О Аллах, я прошу Тебя о благополучии.»' },
  { ar: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', en: '"My Lord, expand for me my breast and ease for me my task."', ru: '«Господь мой, расширь мне грудь и облегчи мне дело.»' },
  { ar: 'اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي', en: '"O Allah, forgive me and have mercy on me."', ru: '«О Аллах, прости меня и помилуй меня.»' },
];
var DI = 0;
function nextDua() { DI = (DI + 1) % DUAS.length; updD(); }
function updD() { var d = DUAS[DI]; set('dua', d.ar); set('dut', d.en); set('dutr', d.ru || ''); }

// ── SCROLL ANIMATION ──
(function () {
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('vis'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fi').forEach(function (el) { obs.observe(el); });
})();

// ── LANGUAGE ──
var LANG = 'en';
function setLang(l, btn) {
  LANG = l;
  document.querySelectorAll('.lb').forEach(function (b) { b.classList.remove('on'); });
  if (btn) btn.classList.add('on');
  document.dispatchEvent(new CustomEvent('langChange', { detail: l }));
}

// ── ONLINE / OFFLINE STATUS TRACKER ──
function initNetworkTracker() {
  var banner = document.getElementById('noor-offline-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'noor-offline-banner';
    banner.className = 'noor-offline-banner';
    var text = (window.LANG === 'ru' ? 'Нет подключения к сети' : (window.LANG === 'uz' ? "Internetga ulanish yo'q" : 'No internet connection'));
    banner.innerHTML = '<span>⚡</span> <span>' + text + '</span>';
    document.body.prepend(banner);
  }

  function updateStatus() {
    if (!navigator.onLine) {
      banner.classList.add('show');
    } else {
      if (banner.classList.contains('show')) {
        banner.classList.remove('show');
        var backText = (window.LANG === 'ru' ? 'Подключение к сети восстановлено' : (window.LANG === 'uz' ? 'Internetga ulanish tiklandi' : 'Back online'));
        showToast(backText, 'success', 3000);
      }
    }
  }

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  if (!navigator.onLine) banner.classList.add('show');
}
window.initNetworkTracker = initNetworkTracker;

// ── SERVICE WORKER REGISTRATION ──
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || isLocal)) {
  window.addEventListener('load', function() {
    var swPath = window.location.pathname.includes('/pages/') ? '../sw.js' : 'sw.js';
    navigator.serviceWorker.register(swPath).catch(function() {});
  });
}

document.addEventListener('DOMContentLoaded', function () {
  // Global init
  checkAuthVisibility();
  initNetworkTracker();
  applyReadingSettings();

  // Mobile navigation haptic feedback
  document.querySelectorAll('.mob-nav a').forEach(function(el) {
    el.addEventListener('click', function() {
      if (navigator.vibrate) navigator.vibrate(12);
    });
  });

  var savedAdhan = localStorage.getItem('adhan_reciter');
  var adhanSel = document.getElementById('adhanReciterSel');
  if (adhanSel && savedAdhan) adhanSel.value = savedAdhan;
  
  document.addEventListener('click', function (e) {
    var dropLink = e.target.closest('.dropdown > a');
    if (dropLink) {
      e.preventDefault(); e.stopPropagation();
      var parent = dropLink.parentElement;
      var wasActive = parent.classList.contains('active');
      document.querySelectorAll('.dropdown.active').forEach(function (d) { d.classList.remove('active'); });
      if (!wasActive) parent.classList.add('active');
    } else if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown.active').forEach(function (d) { d.classList.remove('active'); });
    }
  });

  // Page-specific init
  // if (document.getElementById('grid')) loadSurahs(); // Handled by window.SURAHS in quran.html
  if (document.getElementById('rg')) loadReciters();
  if (document.getElementById('pbgrid')) loadPrayerBig();
  if (document.getElementById('ng')) loadNames();
});

window.doLogout = function() {
  const refresh = localStorage.getItem('refresh_token');
  if (refresh) {
    try {
      fetch(`${API_BASE}/auth/logout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refresh })
      }).catch(function() {});
    } catch (e) {}
  }
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('username');
  localStorage.removeItem('prayer_cache');
  // Smart redirect: detect if we're inside /pages/ subdirectory
  const isInPages = window.location.pathname.includes('/pages/');
  window.location.href = isInPages ? 'login.html' : 'pages/login.html';
};

// ── LANGUAGE MENU ──
window.toggleLanguageMenu = function() {
  var existing = document.getElementById('lang-panel');
  if (existing) { existing.remove(); return; }
  var panel = document.createElement('div');
  panel.id = 'lang-panel';
  panel.style.cssText = 'position:fixed;bottom:80px;right:16px;background:rgba(15,20,40,.97);border:1px solid rgba(168,192,232,.25);border-radius:14px;padding:16px 20px;z-index:10000;backdrop-filter:blur(16px);min-width:160px;box-shadow:0 8px 32px rgba(0,0,0,.5)';
  var langs = [{code:'en',label:'English 🇬🇧'},{code:'ru',label:'Русский 🇷🇺'},{code:'uz',label:"O'zbek 🇺🇿"}];
  var saved = localStorage.getItem('lang') || 'en';
  panel.innerHTML = '<div style="color:var(--gold,#d4a017);font-size:.75rem;font-weight:700;letter-spacing:1px;margin-bottom:12px;text-transform:uppercase">Language</div>' +
    langs.map(l => '<button onclick="window.setLanguage(\''+l.code+'\');document.getElementById(\'lang-panel\')?.remove()" style="display:block;width:100%;text-align:left;background:'+(saved===l.code?'rgba(168,192,232,.15)':'none')+';border:none;color:'+(saved===l.code?'#a8c0e8':'#ccc')+';padding:8px 4px;border-radius:8px;cursor:pointer;font-size:.88rem;font-weight:'+(saved===l.code?'700':'400')+'">'+l.label+'</button>').join('');
  document.body.appendChild(panel);
  setTimeout(function() { document.addEventListener('click', function handler(e) { if (!panel.contains(e.target)) { panel.remove(); document.removeEventListener('click', handler); } }); }, 10);
};


// ── JWT SESSION & SEAMLESS TOKEN ROTATION ──
function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}
window.parseJwt = parseJwt;

function isTokenValid(token, bufferSeconds) {
  if (!token) return false;
  bufferSeconds = bufferSeconds !== undefined ? bufferSeconds : 30;
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > (now + bufferSeconds);
}
window.isTokenValid = isTokenValid;

let _refreshPromise = null;
async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async function() {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) throw new Error('No refresh token available');

    if (!isTokenValid(refresh, 5)) {
      window.doLogout();
      throw new Error('Refresh token expired');
    }

    let res;
    try {
      res = await fetch(`${API_BASE}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refresh })
      });
      if (!res.ok) {
        res = await fetch(`${API_BASE}/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refresh })
        });
      }
    } catch (netErr) {
      throw netErr;
    }

    if (res.ok) {
      const data = await res.json();
      if (data.access) storageSet('access_token', data.access);
      if (data.refresh) storageSet('refresh_token', data.refresh);
      return data.access;
    } else {
      window.doLogout();
      throw new Error('Refresh rejected');
    }
  })().finally(function() {
    _refreshPromise = null;
  });

  return _refreshPromise;
}
window.refreshAccessToken = refreshAccessToken;

window.authFetch = async function(url, options) {
  options = options || {};
  let token = localStorage.getItem('access_token');

  // Preemptive validation: if access token expired or expiring soon, refresh before request
  if (token && !isTokenValid(token, 30)) {
    try {
      token = await refreshAccessToken();
    } catch (e) {
      token = null;
    }
  }

  if (!options.headers) options.headers = {};
  if (token) options.headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    throw err;
  }

  // Intercept 401: seamless Token Rotation and automatic retry
  if (res.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      if (newToken) {
        options.headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(url, options);
      }
    } catch (e) {
      window.doLogout();
    }
  }
  return res;
};

// ── SKELETON / SHIMMER LOADERS ──
function getSurahSkeletons(count) {
  count = count || 12;
  var html = '<div class="skeleton-grid">';
  for (var i = 0; i < count; i++) {
    html += '<div class="skeleton-card">' +
              '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">' +
                '<div class="skeleton skeleton-circle"></div>' +
                '<div style="flex:1">' +
                  '<div class="skeleton skeleton-line h-title"></div>' +
                  '<div class="skeleton skeleton-line short"></div>' +
                '</div>' +
              '</div>' +
              '<div class="skeleton skeleton-line mid"></div>' +
            '</div>';
  }
  html += '</div>';
  return html;
}
window.getSurahSkeletons = getSurahSkeletons;

function getAyahSkeletons(count) {
  count = count || 6;
  var html = '';
  for (var i = 0; i < count; i++) {
    html += '<div class="ac card skeleton-card" style="margin-bottom:14px">' +
              '<div class="at" style="margin-bottom:16px">' +
                '<div class="skeleton" style="width:28px;height:22px;border-radius:12px"></div>' +
                '<div class="skeleton" style="width:60px;height:24px;border-radius:6px"></div>' +
              '</div>' +
              '<div class="skeleton skeleton-line long" style="height:26px;margin-bottom:12px"></div>' +
              '<div class="skeleton skeleton-line mid" style="height:24px;margin-bottom:16px"></div>' +
              '<div class="skeleton skeleton-line long" style="height:14px"></div>' +
              '<div class="skeleton skeleton-line short" style="height:14px"></div>' +
            '</div>';
  }
  return html;
}
window.getAyahSkeletons = getAyahSkeletons;

function getNamesSkeletons(count) {
  count = count || 16;
  var html = '<div class="skeleton-names-grid">';
  for (var i = 0; i < count; i++) {
    html += '<div class="nc card skeleton-card" style="padding:24px 16px;text-align:center">' +
              '<div class="skeleton" style="width:24px;height:16px;margin:0 auto 12px;border-radius:10px"></div>' +
              '<div class="skeleton" style="width:70%;height:32px;margin:0 auto 10px;border-radius:8px"></div>' +
              '<div class="skeleton skeleton-line short" style="margin:0 auto 6px"></div>' +
              '<div class="skeleton skeleton-line mid" style="margin:0 auto"></div>' +
            '</div>';
  }
  html += '</div>';
  return html;
}
window.getNamesSkeletons = getNamesSkeletons;

// ── EMPTY & ERROR STATE GENERATORS ──
function getEmptyStateHTML(opts) {
  opts = opts || {};
  var icon = opts.icon || '📖';
  var title = opts.title || 'No Items Found';
  var desc = opts.description || '';
  var actText = opts.actionText || '';
  var actFn = opts.actionFn || '';
  return '<div class="state-card">' +
           '<div class="state-icon">' + icon + '</div>' +
           '<h3 class="state-title">' + safeHTML(title) + '</h3>' +
           (desc ? '<p class="state-desc">' + safeHTML(desc) + '</p>' : '') +
           (actText && actFn ? '<button class="state-btn" onclick="' + actFn + '">' + safeHTML(actText) + '</button>' : '') +
         '</div>';
}
window.getEmptyStateHTML = getEmptyStateHTML;

function getErrorStateHTML(opts) {
  opts = opts || {};
  var title = opts.title || 'Something went wrong';
  var desc = opts.description || 'Unable to load content. Please check your network connection.';
  var onRetry = opts.onRetry || 'location.reload()';
  return '<div class="state-card" style="border-color:rgba(231,76,60,0.3)">' +
           '<div class="state-icon">⚠️</div>' +
           '<h3 class="state-title">' + safeHTML(title) + '</h3>' +
           '<p class="state-desc">' + safeHTML(desc) + '</p>' +
           '<button class="state-btn" onclick="' + onRetry + '">↻ Retry</button>' +
         '</div>';
}
window.getErrorStateHTML = getErrorStateHTML;

// ── AYAH SHARING HELPER ──
window.shareAyah = async function(surahNum, ayahNum, arText, trText) {
  if (!arText) {
    var ayahEl = document.getElementById('ay' + ayahNum) || document.getElementById('ayah-' + surahNum + '-' + ayahNum);
    if (ayahEl) {
      arText = ayahEl.querySelector('.aarb')?.textContent || '';
      trText = trText || ayahEl.querySelector('.aen')?.textContent || ayahEl.querySelector('.atrn')?.textContent || '';
    }
  }
  arText = arText || '';
  trText = trText || '';

  var surah = (window.SURAHS || []).find(function(s) { return s.n === surahNum; });
  var surahName = surah ? surah.en + ' (' + surah.ar + ')' : 'Surah ' + surahNum;
  var shareUrl = window.location.origin + '/pages/quran.html?surah=' + surahNum + '#ay' + ayahNum;
  var shareText = '📖 ' + surahName + ' [' + surahNum + ':' + ayahNum + ']\n\n' +
                  arText + '\n\n' +
                  (trText ? '«' + trText + '»\n\n' : '') +
                  '🌙 Read on Noor Al-Quran:\n' + shareUrl;

  if (navigator.share) {
    try {
      await navigator.share({
        title: surahName + ' — Ayah ' + ayahNum,
        text: shareText,
        url: shareUrl
      });
      return;
    } catch (e) {
      // User dismissed or share error
    }
  }

  try {
    await navigator.clipboard.writeText(shareText);
    showToast('Ayah copied to clipboard! 📋', 'success');
  } catch (e) {
    var ta = document.createElement('textarea');
    ta.value = shareText;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast('Ayah copied to clipboard! 📋', 'success');
  }
};

// ── READING CONTROLS ──
var _currentFontSize = parseFloat(localStorage.getItem('quran_font_size')) || 1.7;
var _currentViewMode = localStorage.getItem('quran_view_mode') || 'both';

function applyReadingSettings() {
  document.documentElement.style.setProperty('--ayah-font-size', _currentFontSize + 'rem');
  var alist = document.getElementById('alist');
  if (alist) {
    alist.classList.remove('view-both', 'view-arabic-only', 'view-translit');
    alist.classList.add('view-' + _currentViewMode);
  }
  document.querySelectorAll('[data-view-mode]').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-view-mode') === _currentViewMode);
  });
}
window.applyReadingSettings = applyReadingSettings;

window.changeAyahFontSize = function(delta) {
  _currentFontSize = Math.min(2.8, Math.max(1.2, _currentFontSize + delta));
  storageSet('quran_font_size', _currentFontSize.toFixed(2));
  applyReadingSettings();
};

window.setQuranViewMode = function(mode) {
  _currentViewMode = mode;
  storageSet('quran_view_mode', mode);
  applyReadingSettings();
};

// ── ADVANCED AUDIO PLAYER ENGINE ──
var _audioSpeed = 1;
var AUDIO_SPEEDS = [0.75, 1, 1.25, 1.5];
var _audioLoopMode = 'off'; // 'off' | '1x' | '3x' | 'inf'
var _loopCounter = 0;

window.cycleAudioSpeed = function() {
  var idx = AUDIO_SPEEDS.indexOf(_audioSpeed);
  _audioSpeed = AUDIO_SPEEDS[(idx + 1) % AUDIO_SPEEDS.length];
  var aud = document.getElementById('aud');
  if (aud) aud.playbackRate = _audioSpeed;
  var btn = document.getElementById('speedBtn');
  if (btn) btn.textContent = _audioSpeed + 'x';
  showToast('Playback speed: ' + _audioSpeed + 'x', 'info', 1500);
};

window.cycleAudioLoop = function() {
  var modes = ['off', '1x', '3x', 'inf'];
  var labels = { off: 'Loop: Off', '1x': 'Loop: 1x', '3x': 'Repeat 3x', inf: 'Loop: ∞' };
  var idx = modes.indexOf(_audioLoopMode);
  _audioLoopMode = modes[(idx + 1) % modes.length];
  _loopCounter = 0;
  var btn = document.getElementById('loopBtn');
  if (btn) {
    btn.textContent = _audioLoopMode === 'off' ? '🔁 Off' : _audioLoopMode === 'inf' ? '🔁 ∞' : '🔁 ' + _audioLoopMode;
    btn.classList.toggle('active', _audioLoopMode !== 'off');
  }
  showToast(labels[_audioLoopMode], 'info', 1500);
};

function updateMediaSession(surahTitle, ayahNum, reciterName) {
  if ('mediaSession' in navigator && window.MediaMetadata) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: (surahTitle || 'The Holy Quran') + (ayahNum ? ' — Ayah ' + ayahNum : ''),
        artist: reciterName || 'Noor Al-Quran',
        album: 'The Holy Quran · القرآن الكريم',
        artwork: [
          { src: '../assets/images/logo.png', sizes: '192x192', type: 'image/png' },
          { src: '../assets/images/logo.png', sizes: '512x512', type: 'image/png' }
        ]
      });
      navigator.mediaSession.setActionHandler('play', function() { if (typeof togPlay === 'function') togPlay(); });
      navigator.mediaSession.setActionHandler('pause', function() { if (typeof togPlay === 'function') togPlay(); });
      navigator.mediaSession.setActionHandler('previoustrack', function() { if (typeof prevA === 'function') prevA(); });
      navigator.mediaSession.setActionHandler('nexttrack', function() { if (typeof nextA === 'function') nextA(); });
      navigator.mediaSession.setActionHandler('seekto', function(details) {
        var aud = document.getElementById('aud');
        if (aud && details.seekTime) aud.currentTime = details.seekTime;
      });
    } catch (e) {}
  }
}
window.updateMediaSession = updateMediaSession;

function highlightPlayingAyah(ayahNum) {
  document.querySelectorAll('.ac.playing').forEach(function(el) { el.classList.remove('playing'); });
  var target = document.getElementById('ay' + ayahNum) || document.getElementById('ayah-' + ayahNum);
  if (target) {
    target.classList.add('playing');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
window.highlightPlayingAyah = highlightPlayingAyah;

// ── QURAN PAGE ──
function loadSurahs() {
  var grid = document.getElementById('grid');
  if (grid) grid.innerHTML = getSurahSkeletons(12);

  fetch(`${API_BASE}/surahs/`)
    .then(function (r) { return r.json(); }).then(function (d) {
      if (!grid) return;
      grid.innerHTML = '';
      d.data.forEach(function (s) {
        var div = document.createElement('div'); div.className = 'si card';
        div.innerHTML = `<div class="snum">${safeHTML(String(s.number))}</div><div class="sinf"><div class="sar">${safeHTML(s.name)}</div><div class="sen">${safeHTML(s.englishName)}</div><div class="sv">${safeHTML(String(s.numberOfAyahs))} verses</div></div><div class="bm mec" title="Bookmark">📌</div>`;
        div.addEventListener('click', function () { openSurah(s.number, s.name, s.englishName); });
        div.querySelector('.bm')?.addEventListener('click', function (e) {
          e.stopPropagation();
          addBM(s.number, 1);
        });
        grid.appendChild(div);
      });
      const params = new URLSearchParams(window.location.search);
      const surahParam = params.get('surah');
      if (surahParam) {
        const target = d.data.find(s => s.number == surahParam);
        if (target) {
          openSurah(target.number, target.name, target.englishName);
          setTimeout(() => {
            if(window.location.hash) {
              const el = document.querySelector(window.location.hash);
              if (el) el.scrollIntoView({behavior:'smooth',block:'center'});
            }
          }, 1000);
        }
      }
    }).catch(function (e) {
      if (grid) {
        grid.innerHTML = getErrorStateHTML({
          title: 'Failed to load Surahs',
          description: 'Could not fetch surah list. Please check your network connection.',
          onRetry: 'loadSurahs()'
        });
      }
    });
}

function openSurah(n, ar, en) {
  var r = document.getElementById('reader'); if (!r) return;
  set('rn', `SURAH ${n}`); set('rar', ar); set('ren', en);
  var rbis = document.getElementById('rbis');
  if (rbis) rbis.style.display = (n === 1 || n === 9) ? 'none' : 'block';
  var listEl = document.getElementById('alist');
  if (listEl) listEl.innerHTML = getAyahSkeletons(6);
  r.classList.add('open');
  applyReadingSettings();

  var bismillahRegex = /^بِسْمِ\s*اللَّهِ\s*الرَّحْمَٰنِ\s*الرَّحِيمِ\s*/u;
  var lang = localStorage.getItem('lang') || 'en';

  fetchSurahData(n, lang)
    .then(function (d) {
      if (!listEl) return;
      listEl.innerHTML = '';
      if (!d || !d.data) throw new Error('No data');
      var arAyahs = d.data[0].ayahs;
      var trAyahs = (d.data[1] && d.data[1].ayahs) || [];
      arAyahs.forEach(function (a, i) {
        var c = document.createElement('div'); c.className = 'ac card';
        c.id = `ayah-${n}-${a.numberInSurah}`;
        var trText = (trAyahs[i] && trAyahs[i].text) || '';
        var arText = a.text || '';
        if (n !== 1 && a.numberInSurah === 1) {
          arText = arText.replace(bismillahRegex, '');
        }
        c.innerHTML = `<div class="at"><span class="anum">${safeHTML(String(a.numberInSurah))}</span><div class="aact"><button class="abtn" onclick="playAyahQuran(${n},${a.numberInSurah})" title="Play" aria-label="Play ayah">🔊</button><button class="abtn" onclick="addBM(${n},${a.numberInSurah})" title="Bookmark" aria-label="Bookmark ayah">📌</button><button class="abtn" onclick="shareAyah(${n},${a.numberInSurah})" title="Share" aria-label="Share ayah">📤</button></div></div><div class="aarb">${safeHTML(arText)}</div><div class="aen">${safeHTML(trText)}</div><div class="atrn">${safeHTML(trText)}</div>`;
        listEl.appendChild(c);
      });
      applyReadingSettings();
    }).catch(function () {
      if (listEl) {
        listEl.innerHTML = getErrorStateHTML({
          title: 'Surah Unavailable',
          description: 'Could not load verses for this surah. Please check your connection.',
          onRetry: `openSurah(${n}, "${ar}", "${en}")`
        });
      }
    });
}
function closeR() { var r = document.getElementById('reader'); if (r) r.classList.remove('open'); }

// Play ayah on Quran page (uses abdulbasit as default)
function playAyahQuran(surahNum, ayahNum) {
  // Calculate global ayah number for islamic.network CDN
  var AYAHS_PER_SURAH = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
    112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89,
    59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30,
    52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15,
    21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
  ];
  var globalNum = 0;
  for (var i = 0; i < surahNum - 1; i++) globalNum += AYAHS_PER_SURAH[i];
  globalNum += ayahNum;

  var url = `https://cdn.islamic.network/quran/audio/128/ar.abdulbasitmurattal/${globalNum}.mp3`;
  var aud = document.getElementById('aud'); if (!aud) return;
  aud.src = url;
  aud.play().catch(function () {
    // Fallback to full surah MP3
    aud.src = `https://server7.mp3quran.net/basit/${String(surahNum).padStart(3, '0')}.mp3`;
    aud.play().catch(function (e) { /* error handled */ });
  });
  set('asn', `Surah ${surahNum} : ${ayahNum}`);
  var abar = document.getElementById('abar'); if (abar) abar.classList.add('show');
}

// Legacy alias for older HTML onclick attributes
function playAyah(s, a) { playAyahQuran(s, a); }
function playA(s, a) { playAyahQuran(s, a); }

function filterS(q) {
  document.querySelectorAll('.si').forEach(function (i) {
    i.style.display = i.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}

function addBM(s, a) {
  // Сохраняем локально в localStorage всегда!
  var localBMs = [];
  try {
    localBMs = JSON.parse(localStorage.getItem('nq_local_bookmarks') || '[]');
  } catch (e) { localBMs = []; }

  var exists = localBMs.some(function(bm) { return bm.surah_number === s && bm.ayah_number === a; });
  if (!exists) {
    localBMs.push({
      id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      surah_number: s,
      ayah_number: a,
      created_at: new Date().toISOString()
    });
    try {
      localStorage.setItem('nq_local_bookmarks', JSON.stringify(localBMs));
    } catch (e) {}
  }

  // Если пользователь авторизован на бэкенде — синхронизируем
  var token = localStorage.getItem('access_token');
  if (token) {
    authFetch(`${API_BASE}/bookmarks/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surah_number: s, ayah_number: a }),
    }).then(function (r) {
      if (r.status === 201) showToast('Bookmark saved! 🔖', 'success');
      else if (r.status === 400) showToast('Already bookmarked ✓', 'info');
    }).catch(function() {
      showToast('Bookmark saved to device 📱', 'success');
    });
  } else {
    showToast(exists ? 'Already bookmarked ✓' : 'Bookmark saved! 🔖', 'success');
  }
}

// ── UNIFIED TOAST SYSTEM (Success, Warning, Error, Info) ──
function showToast(msg, type, duration) {
  type = type || 'info';
  duration = duration !== undefined ? duration : 3500;

  var container = document.getElementById('noor-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'noor-toast-container';
    container.className = 'noor-toast-container';
    document.body.appendChild(container);
  }

  var icons = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ'
  };

  var toast = document.createElement('div');
  toast.className = 'noor-toast toast-' + type;
  toast.innerHTML = '<span class="noor-toast-icon">' + (icons[type] || '✨') + '</span>' +
                    '<span class="noor-toast-msg">' + safeHTML(msg) + '</span>' +
                    '<button class="noor-toast-close" aria-label="Dismiss">&times;</button>';

  var closeBtn = toast.querySelector('.noor-toast-close');
  var dismiss = function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 300);
  };
  if (closeBtn) closeBtn.onclick = function(e) { e.stopPropagation(); dismiss(); };
  toast.onclick = dismiss;

  container.appendChild(toast);
  requestAnimationFrame(function() {
    toast.classList.add('show');
  });

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
}
window.showToast = showToast;

// ── RECITERS PAGE ──
function loadReciters() {
  var rg = document.getElementById('rg'); if (!rg) return;
  rg.innerHTML = '';
  RECITERS.forEach(function (r) {
    var div = document.createElement('div'); div.className = 'rc card'; div.style.cursor = 'pointer';
    div.innerHTML = `
      <div class="rav" style="background:url('${encodeURI(r.photo || '')}');background-size:cover;background-position:center;color:transparent;"></div>
      <div class="rna">${safeHTML(r.ar)}</div>
      <div class="rne">${safeHTML(r.en)}</div>
      <div class="rb">${safeHTML(r.style)}</div>
      <p style="font-size:.7rem;color:var(--soft);margin:8px 0">${safeHTML(r.country)}</p>
      <div style="margin-top:12px;font-size:.75rem;color:var(--gold);text-transform:uppercase;letter-spacing:1px">View Full Page →</div>`;
    div.addEventListener('click', function () { window.location.href = r.page; });
    rg.appendChild(div);
  });

  // Quick-play selects
  var recSel = document.getElementById('reciterSel');
  var surahSel = document.getElementById('surahSel');

  if (recSel && surahSel) {
    recSel.innerHTML = '';
    RECITERS.forEach(function (r) {
      recSel.add(new Option(r.en, r.id));
    });

    function updateSurahSel() {
      surahSel.innerHTML = '';
      let displaySurahs = SURAHS;
      if (recSel.value === 'sherif_mostafa') {
        displaySurahs = SURAHS.filter(s => SHERIF_AVAILABLE.includes(s.n));
      } else if (recSel.value === 'abdurrahman_mossad') {
        displaySurahs = SURAHS.filter(s => MOSSAD_AVAILABLE.includes(s.n));
      }
      displaySurahs.forEach(function (s) {
        surahSel.add(new Option(s.n + '. ' + s.en + ' — ' + s.ar, String(s.n)));
      });
    }

    recSel.addEventListener('change', updateSurahSel);
    updateSurahSel(); // init
  }
}

var _qpPlaying = false;
function quickPlay() {
  var recSel = document.getElementById('reciterSel');
  var surahSel = document.getElementById('surahSel');
  if (!recSel || !recSel.value || !surahSel || !surahSel.value) return;
  var r = RECITERS.find(function (x) { return x.id === recSel.value; }); if (!r) return;
  var sn = parseInt(surahSel.value, 10);
  var s = SURAHS.find(function (x) { return x.n === sn; });
  var surahStr = String(sn).padStart(3, '0');
  
  var urls = [r.server + surahStr + '.mp3'];
  if (r.id === 'sherif_mostafa') {
    urls = ['../audio/sherif_mostafa/' + surahStr + '.mp3', 'https://server6.mp3quran.net/shrf/' + surahStr + '.mp3', r.server + surahStr + '.mp3'];
  } else if (r.id === 'abdurrahman_mossad') {
    urls = ['../audio/abdurrahman_mossad/' + surahStr + '.mp3', 'https://server16.mp3quran.net/mossad/' + surahStr + '.mp3', r.server + surahStr + '.mp3'];
  }
  
  var aud = document.getElementById('aud'); if (!aud) return;
  var idx = 0;
  function tryPlay() {
    if (idx >= urls.length) return;
    aud.src = urls[idx++];
    aud.volume = 0.85;
    aud.play().then(function() {
      _qpPlaying = true;
      var btn = document.getElementById('plbtn'); if (btn) btn.textContent = '⏸';
    }).catch(function() {
      tryPlay();
    });
  }
  tryPlay();

  set('asn', `Surah ${sn} — ${s ? s.en : ''}`);
  set('arcn', r.en);
  set('nowPlaying', `▶ ${r.en} — ${s ? s.en : 'Surah ' + sn}`);
  var abar = document.getElementById('abar'); if (abar) abar.classList.add('show');
}

// togPlay — used by reciters.html audio bar toggle button
function togPlay() {
  var aud = document.getElementById('aud'); if (!aud) return;
  if (aud.paused) { aud.play().catch(function () { }); _qpPlaying = true; }
  else { aud.pause(); _qpPlaying = false; }
  var btn = document.getElementById('plbtn');
  if (btn) btn.textContent = aud.paused ? '▶' : '⏸';
}

// togPlayRec — alias for reciters.html (called by togPlay override)
function togPlayRec() { togPlay(); }

function stopSurah() {
  var aud = document.getElementById('aud');
  if (aud) { aud.pause(); aud.currentTime = 0; }
  _qpPlaying = false;
  var btn = document.getElementById('plbtn'); if (btn) btn.textContent = '▶';
  closeAudio();
}

function closeAudio() {
  var abar = document.getElementById('abar'); if (abar) abar.classList.remove('show');
  var aud = document.getElementById('aud'); if (aud) aud.pause();
}

// updP — progress update for reciters.html seek bar
function updP() {
  var aud = document.getElementById('aud'); if (!aud) return;
  var p = aud.duration ? aud.currentTime / aud.duration * 100 : 0;
  var sl = document.getElementById('seekSlider'); if (sl) sl.value = p;
}
function seekAudio() {
  var aud = document.getElementById('aud');
  var sl = document.getElementById('seekSlider');
  if (!aud || !sl || !aud.duration) return;
  aud.currentTime = sl.value / 100 * aud.duration;
}
function onEnd() { stopSurah(); }

// ── PRAYER PAGE ──
function loadPrayerBig() {
  var err = function() {
    var lastCoords = null;
    try {
      var raw = localStorage.getItem('last_coords');
      if (raw) lastCoords = JSON.parse(raw);
    } catch(e) {}
    var la = lastCoords ? lastCoords.lat : 21.3891;
    var lo = lastCoords ? lastCoords.lng : 39.8579;
    var t = calculateOfflinePrayerTimes(la, lo);
    set('bft', t.Fajr); set('bst', t.Sunrise); set('bdt', t.Dhuhr);
    set('bat', t.Asr); set('bmt', t.Maghrib); set('bit', t.Isha);
    updatePrayerCards(t);
    hlPrayer(t); schedulePrayer(t);
    const msg = document.getElementById('pm-nxt');
    if (msg) msg.textContent = "Offline Mode: Prayer times calculated via astronomical math.";
  };
  var fetchPrayer = function (la, lo) {
    try { localStorage.setItem('last_coords', JSON.stringify({lat: la, lng: lo})); } catch(e) {}
    fetch(`${API_BASE}/prayer-times/?lat=${la}&lng=${lo}&method=2`)
      .then(function (r) { return r.json(); }).then(function (d) {
        var t = d.data.timings;
        set('bft', t.Fajr); set('bst', t.Sunrise); set('bdt', t.Dhuhr);
        set('bat', t.Asr); set('bmt', t.Maghrib); set('bit', t.Isha);
        updatePrayerCards(t, d.data.date);
        hlPrayer(t); schedulePrayer(t);
      }).catch(err);
  };
  var fb = async function() {
    try {
      let r = await fetch('https://ipapi.co/json/');
      let d = await r.json();
      if (d.latitude) return fetchPrayer(d.latitude, d.longitude);
    } catch(e) {}
    try {
      let r2 = await fetch('https://get.geojs.io/v1/ip/geo.json');
      let d2 = await r2.json();
      if (d2.latitude) return fetchPrayer(d2.latitude, d2.longitude);
    } catch(e) {}
    err();
  };
  if (!navigator.geolocation) return fb();
  navigator.geolocation.getCurrentPosition(function (pos) { fetchPrayer(pos.coords.latitude, pos.coords.longitude); }, fb);
}

function updatePrayerCards(t) {
  var now = new Date();
  var timeMap = { Fajr: t.Fajr, Sunrise: t.Sunrise, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha };
  var prayers = [
    { id: 'pb-fajr', name: 'Fajr', tip: 'bfl' }, { id: 'pb-sunrise', name: 'Sunrise', tip: 'bsl' },
    { id: 'pb-dhuhr', name: 'Dhuhr', tip: 'bdl' }, { id: 'pb-asr', name: 'Asr', tip: 'bal' },
    { id: 'pb-maghrib', name: 'Maghrib', tip: 'bml' }, { id: 'pb-isha', name: 'Isha', tip: 'bil' },
  ];
  prayers.forEach(function (p) {
    var e = document.getElementById(p.id); if (!e) return;
    var tm = timeMap[p.name]; if (!tm) return;
    var parts = tm.split(':').map(Number);
    var h = parts[0], m = parts[1];
    var next = new Date(); next.setHours(h, m, 0, 0);
    var diff = next - now;
    if (diff > 0 && diff < 86400000) { set(p.tip, Math.round(diff / 60000) + 'm left'); e.classList.add('now'); }
    else e.classList.remove('now');
  });
}

// ── NAMES PAGE — надежные данные без сбоев ──

// ── 99 NAMES OF ALLAH STATIC FALLBACK ──
const NAMES_OF_ALLAH_DATA = [
  {
    "num": 1,
    "arabic": "الرَّحْمَن",
    "transliteration": "Ar-Rahman",
    "meaning_en": "The Most Gracious",
    "meaning_ru": "Милостивый"
  },
  {
    "num": 2,
    "arabic": "الرَّحِيم",
    "transliteration": "Ar-Rahim",
    "meaning_en": "The Most Merciful",
    "meaning_ru": "Милосердный"
  },
  {
    "num": 3,
    "arabic": "الْمَلِك",
    "transliteration": "Al-Malik",
    "meaning_en": "The King",
    "meaning_ru": "Царь"
  },
  {
    "num": 4,
    "arabic": "الْقُدُّوس",
    "transliteration": "Al-Quddus",
    "meaning_en": "The Most Holy",
    "meaning_ru": "Пресвятой"
  },
  {
    "num": 5,
    "arabic": "السَّلَام",
    "transliteration": "As-Salam",
    "meaning_en": "The Source of Peace",
    "meaning_ru": "Мир"
  },
  {
    "num": 6,
    "arabic": "الْمُؤْمِن",
    "transliteration": "Al-Mu'min",
    "meaning_en": "The Guardian of Faith",
    "meaning_ru": "Дарующий безопасность"
  },
  {
    "num": 7,
    "arabic": "الْمُهَيْمِن",
    "transliteration": "Al-Muhaymin",
    "meaning_en": "The Protector",
    "meaning_ru": "Хранитель"
  },
  {
    "num": 8,
    "arabic": "الْعَزِيز",
    "transliteration": "Al-Aziz",
    "meaning_en": "The Mighty",
    "meaning_ru": "Могущественный"
  },
  {
    "num": 9,
    "arabic": "الْجَبَّار",
    "transliteration": "Al-Jabbar",
    "meaning_en": "The Compeller",
    "meaning_ru": "Принуждающий"
  },
  {
    "num": 10,
    "arabic": "الْمُتَكَبِّر",
    "transliteration": "Al-Mutakabbir",
    "meaning_en": "The Majestic",
    "meaning_ru": "Величественный"
  },
  {
    "num": 11,
    "arabic": "الْخَالِق",
    "transliteration": "Al-Khaliq",
    "meaning_en": "The Creator",
    "meaning_ru": "Творец"
  },
  {
    "num": 12,
    "arabic": "الْبَارِئ",
    "transliteration": "Al-Bari'",
    "meaning_en": "The Evolver",
    "meaning_ru": "Создатель"
  },
  {
    "num": 13,
    "arabic": "الْمُصَوِّر",
    "transliteration": "Al-Musawwir",
    "meaning_en": "The Fashioner",
    "meaning_ru": "Придающий форму"
  },
  {
    "num": 14,
    "arabic": "الْغَفَّار",
    "transliteration": "Al-Ghaffar",
    "meaning_en": "The Forgiver",
    "meaning_ru": "Всепрощающий"
  },
  {
    "num": 15,
    "arabic": "الْقَهَّار",
    "transliteration": "Al-Qahhar",
    "meaning_en": "The Subduer",
    "meaning_ru": "Всепобеждающий"
  },
  {
    "num": 16,
    "arabic": "الْوَهَّاب",
    "transliteration": "Al-Wahhab",
    "meaning_en": "The Bestower",
    "meaning_ru": "Дарующий"
  },
  {
    "num": 17,
    "arabic": "الرَّزَّاق",
    "transliteration": "Ar-Razzaq",
    "meaning_en": "The Provider",
    "meaning_ru": "Кормилец"
  },
  {
    "num": 18,
    "arabic": "الْفَتَّاح",
    "transliteration": "Al-Fattah",
    "meaning_en": "The Opener",
    "meaning_ru": "Открывающий"
  },
  {
    "num": 19,
    "arabic": "الْعَلِيم",
    "transliteration": "Al-Alim",
    "meaning_en": "The All-Knowing",
    "meaning_ru": "Всезнающий"
  },
  {
    "num": 20,
    "arabic": "الْقَابِض",
    "transliteration": "Al-Qabid",
    "meaning_en": "The Constrictor",
    "meaning_ru": "Сжимающий"
  },
  {
    "num": 21,
    "arabic": "الْبَاسِط",
    "transliteration": "Al-Basit",
    "meaning_en": "The Expander",
    "meaning_ru": "Расширяющий"
  },
  {
    "num": 22,
    "arabic": "الْخَافِض",
    "transliteration": "Al-Khafid",
    "meaning_en": "The Abaser",
    "meaning_ru": "Унижающий"
  },
  {
    "num": 23,
    "arabic": "الرَّافِع",
    "transliteration": "Ar-Rafi'",
    "meaning_en": "The Exalter",
    "meaning_ru": "Возвышающий"
  },
  {
    "num": 24,
    "arabic": "الْمُعِز",
    "transliteration": "Al-Mu'izz",
    "meaning_en": "The Bestower of Honor",
    "meaning_ru": "Чествующий"
  },
  {
    "num": 25,
    "arabic": "الْمُذِل",
    "transliteration": "Al-Mudhill",
    "meaning_en": "The Humiliator",
    "meaning_ru": "Унижающий"
  },
  {
    "num": 26,
    "arabic": "السَّمِيع",
    "transliteration": "As-Sami'",
    "meaning_en": "The All-Hearing",
    "meaning_ru": "Всеслышащий"
  },
  {
    "num": 27,
    "arabic": "الْبَصِير",
    "transliteration": "Al-Basir",
    "meaning_en": "The All-Seeing",
    "meaning_ru": "Всевидящий"
  },
  {
    "num": 28,
    "arabic": "الْحَكَم",
    "transliteration": "Al-Hakam",
    "meaning_en": "The Judge",
    "meaning_ru": "Судья"
  },
  {
    "num": 29,
    "arabic": "الْعَدْل",
    "transliteration": "Al-Adl",
    "meaning_en": "The Just",
    "meaning_ru": "Справедливый"
  },
  {
    "num": 30,
    "arabic": "اللَّطِيف",
    "transliteration": "Al-Latif",
    "meaning_en": "The Subtle One",
    "meaning_ru": "Тонкий"
  },
  {
    "num": 31,
    "arabic": "الْخَبِير",
    "transliteration": "Al-Khabir",
    "meaning_en": "The All-Aware",
    "meaning_ru": "Осведомлённый"
  },
  {
    "num": 32,
    "arabic": "الْحَلِيم",
    "transliteration": "Al-Halim",
    "meaning_en": "The Forbearing",
    "meaning_ru": "Терпеливый"
  },
  {
    "num": 33,
    "arabic": "الْعَظِيم",
    "transliteration": "Al-Azim",
    "meaning_en": "The Magnificent",
    "meaning_ru": "Величайший"
  },
  {
    "num": 34,
    "arabic": "الْغَفُور",
    "transliteration": "Al-Ghafur",
    "meaning_en": "The Forgiving",
    "meaning_ru": "Прощающий"
  },
  {
    "num": 35,
    "arabic": "الشَّكُور",
    "transliteration": "Ash-Shakur",
    "meaning_en": "The Appreciative",
    "meaning_ru": "Благодарный"
  },
  {
    "num": 36,
    "arabic": "الْعَلِيّ",
    "transliteration": "Al-Ali'",
    "meaning_en": "The Most High",
    "meaning_ru": "Высочайший"
  },
  {
    "num": 37,
    "arabic": "الْكَبِير",
    "transliteration": "Al-Kabir",
    "meaning_en": "The Most Great",
    "meaning_ru": "Великий"
  },
  {
    "num": 38,
    "arabic": "الْحَفِيظ",
    "transliteration": "Al-Hafiz",
    "meaning_en": "The Preserver",
    "meaning_ru": "Хранящий"
  },
  {
    "num": 39,
    "arabic": "الْمُقِيت",
    "transliteration": "Al-Muqit",
    "meaning_en": "The Nourisher",
    "meaning_ru": "Питающий"
  },
  {
    "num": 40,
    "arabic": "الْحَسِيب",
    "transliteration": "Al-Hasib",
    "meaning_en": "The Reckoner",
    "meaning_ru": "Считающий"
  },
  {
    "num": 41,
    "arabic": "الْجَلِيل",
    "transliteration": "Al-Jalil",
    "meaning_en": "The Majestic",
    "meaning_ru": "Величественный"
  },
  {
    "num": 42,
    "arabic": "الْكَرِيم",
    "transliteration": "Al-Karim",
    "meaning_en": "The Generous",
    "meaning_ru": "Щедрый"
  },
  {
    "num": 43,
    "arabic": "الرَّقِيب",
    "transliteration": "Ar-Raqib",
    "meaning_en": "The Watchful",
    "meaning_ru": "Наблюдающий"
  },
  {
    "num": 44,
    "arabic": "الْمُجِيب",
    "transliteration": "Al-Mujib",
    "meaning_en": "The Responsive",
    "meaning_ru": "Отвечающий"
  },
  {
    "num": 45,
    "arabic": "الْوَاسِع",
    "transliteration": "Al-Wasi'",
    "meaning_en": "The All-Encompassing",
    "meaning_ru": "Необъятный"
  },
  {
    "num": 46,
    "arabic": "الْحَكِيم",
    "transliteration": "Al-Hakim",
    "meaning_en": "The Wise",
    "meaning_ru": "Мудрый"
  },
  {
    "num": 47,
    "arabic": "الْوَدُود",
    "transliteration": "Al-Wadud",
    "meaning_en": "The Loving",
    "meaning_ru": "Любящий"
  },
  {
    "num": 48,
    "arabic": "الْمَجِيد",
    "transliteration": "Al-Majid",
    "meaning_en": "The Most Glorious",
    "meaning_ru": "Славный"
  },
  {
    "num": 49,
    "arabic": "الْبَاعِث",
    "transliteration": "Al-Ba'ith",
    "meaning_en": "The Resurrector",
    "meaning_ru": "Воскрешающий"
  },
  {
    "num": 50,
    "arabic": "الشَّهِيد",
    "transliteration": "Ash-Shahid",
    "meaning_en": "The Witness",
    "meaning_ru": "Свидетель"
  },
  {
    "num": 51,
    "arabic": "الْحَقّ",
    "transliteration": "Al-Haqq",
    "meaning_en": "The Truth",
    "meaning_ru": "Истина"
  },
  {
    "num": 52,
    "arabic": "الْوَكِيل",
    "transliteration": "Al-Wakil",
    "meaning_en": "The Trustee",
    "meaning_ru": "Попечитель"
  },
  {
    "num": 53,
    "arabic": "الْقَوِيّ",
    "transliteration": "Al-Qawi",
    "meaning_en": "The Most Strong",
    "meaning_ru": "Сильный"
  },
  {
    "num": 54,
    "arabic": "الْمَتِين",
    "transliteration": "Al-Matin",
    "meaning_en": "The Firm",
    "meaning_ru": "Твёрдый"
  },
  {
    "num": 55,
    "arabic": "الْوَلِيّ",
    "transliteration": "Al-Wali",
    "meaning_en": "The Protecting Friend",
    "meaning_ru": "Покровитель"
  },
  {
    "num": 56,
    "arabic": "الْحَمِيد",
    "transliteration": "Al-Hamid",
    "meaning_en": "The Praiseworthy",
    "meaning_ru": "Достохвальный"
  },
  {
    "num": 57,
    "arabic": "الْمُحْصِي",
    "transliteration": "Al-Muhsi",
    "meaning_en": "The Counter",
    "meaning_ru": "Исчисляющий"
  },
  {
    "num": 58,
    "arabic": "الْمُبْدِئ",
    "transliteration": "Al-Mubdi'",
    "meaning_en": "The Originator",
    "meaning_ru": "Начинающий"
  },
  {
    "num": 59,
    "arabic": "الْمُعِيد",
    "transliteration": "Al-Mu'id",
    "meaning_en": "The Restorer",
    "meaning_ru": "Возобновляющий"
  },
  {
    "num": 60,
    "arabic": "الْمُحْيِي",
    "transliteration": "Al-Muhyi",
    "meaning_en": "The Giver of Life",
    "meaning_ru": "Дающий жизнь"
  },
  {
    "num": 61,
    "arabic": "الْمُمِيت",
    "transliteration": "Al-Mumit",
    "meaning_en": "The Taker of Life",
    "meaning_ru": "Умерщвляющий"
  },
  {
    "num": 62,
    "arabic": "الْحَيّ",
    "transliteration": "Al-Hayy",
    "meaning_en": "The Ever-Living",
    "meaning_ru": "Вечно живой"
  },
  {
    "num": 63,
    "arabic": "الْقَيُّوم",
    "transliteration": "Al-Qayyum",
    "meaning_en": "The Self-Subsisting",
    "meaning_ru": "Самодостаточный"
  },
  {
    "num": 64,
    "arabic": "الْوَاجِد",
    "transliteration": "Al-Wajid",
    "meaning_en": "The Finder",
    "meaning_ru": "Находящий"
  },
  {
    "num": 65,
    "arabic": "الْمَاجِد",
    "transliteration": "Al-Majid",
    "meaning_en": "The Noble",
    "meaning_ru": "Благородный"
  },
  {
    "num": 66,
    "arabic": "الْوَاحِد",
    "transliteration": "Al-Wahid",
    "meaning_en": "The One",
    "meaning_ru": "Единый"
  },
  {
    "num": 67,
    "arabic": "الأَحَد",
    "transliteration": "Al-Ahad",
    "meaning_en": "The Unique",
    "meaning_ru": "Единственный"
  },
  {
    "num": 68,
    "arabic": "الصَّمَد",
    "transliteration": "As-Samad",
    "meaning_en": "The Eternal",
    "meaning_ru": "Вечный"
  },
  {
    "num": 69,
    "arabic": "الْقَادِر",
    "transliteration": "Al-Qadir",
    "meaning_en": "The Capable",
    "meaning_ru": "Могущий"
  },
  {
    "num": 70,
    "arabic": "الْمُقْتَدِر",
    "transliteration": "Al-Muqtadir",
    "meaning_en": "The Powerful",
    "meaning_ru": "Всесильный"
  },
  {
    "num": 71,
    "arabic": "الْمُقَدِّم",
    "transliteration": "Al-Muqaddim",
    "meaning_en": "The Expediter",
    "meaning_ru": "Выдвигающий вперёд"
  },
  {
    "num": 72,
    "arabic": "الْمُؤَخِّر",
    "transliteration": "Al-Mu'akhkhir",
    "meaning_en": "The Delayer",
    "meaning_ru": "Откладывающий"
  },
  {
    "num": 73,
    "arabic": "الأَوَّل",
    "transliteration": "Al-Awwal",
    "meaning_en": "The First",
    "meaning_ru": "Первый"
  },
  {
    "num": 74,
    "arabic": "الآخِر",
    "transliteration": "Al-Akhir",
    "meaning_en": "The Last",
    "meaning_ru": "Последний"
  },
  {
    "num": 75,
    "arabic": "الظَّاهِر",
    "transliteration": "Az-Zahir",
    "meaning_en": "The Manifest",
    "meaning_ru": "Явный"
  },
  {
    "num": 76,
    "arabic": "الْبَاطِن",
    "transliteration": "Al-Batin",
    "meaning_en": "The Hidden",
    "meaning_ru": "Скрытый"
  },
  {
    "num": 77,
    "arabic": "الْوَالِي",
    "transliteration": "Al-Wali",
    "meaning_en": "The Governor",
    "meaning_ru": "Правитель"
  },
  {
    "num": 78,
    "arabic": "الْمُتَعَالِي",
    "transliteration": "Al-Muta'ali",
    "meaning_en": "The Most Exalted",
    "meaning_ru": "Превознесённый"
  },
  {
    "num": 79,
    "arabic": "الْبَرّ",
    "transliteration": "Al-Barr",
    "meaning_en": "The Source of Goodness",
    "meaning_ru": "Благой"
  },
  {
    "num": 80,
    "arabic": "التَّوَّاب",
    "transliteration": "At-Tawwab",
    "meaning_en": "The Ever-Returning",
    "meaning_ru": "Принимающий покаяние"
  },
  {
    "num": 81,
    "arabic": "الْمُنْتَقِم",
    "transliteration": "Al-Muntaqim",
    "meaning_en": "The Avenger",
    "meaning_ru": "Мститель"
  },
  {
    "num": 82,
    "arabic": "الْعَفُوّ",
    "transliteration": "Al-Afuww",
    "meaning_en": "The Pardoner",
    "meaning_ru": "Прощающий"
  },
  {
    "num": 83,
    "arabic": "الرَّؤُوف",
    "transliteration": "Ar-Ra'uf",
    "meaning_en": "The Compassionate",
    "meaning_ru": "Сострадательный"
  },
  {
    "num": 84,
    "arabic": "مَالِكُ الْمُلْك",
    "transliteration": "Malik-ul-Mulk",
    "meaning_en": "Owner of All Sovereignty",
    "meaning_ru": "Владыка царства"
  },
  {
    "num": 85,
    "arabic": "ذُو الْجَلَالِ وَالإِكْرَام",
    "transliteration": "Dhul-Jalali-wal-Ikram",
    "meaning_en": "Lord of Majesty and Generosity",
    "meaning_ru": "Обладатель величия и щедрости"
  },
  {
    "num": 86,
    "arabic": "الْمُقْسِط",
    "transliteration": "Al-Muqsit",
    "meaning_en": "The Equitable",
    "meaning_ru": "Справедливый"
  },
  {
    "num": 87,
    "arabic": "الْجَامِع",
    "transliteration": "Al-Jami'",
    "meaning_en": "The Gatherer",
    "meaning_ru": "Собирающий"
  },
  {
    "num": 88,
    "arabic": "الْغَنِيّ",
    "transliteration": "Al-Ghani",
    "meaning_en": "The Self-Sufficient",
    "meaning_ru": "Богатый"
  },
  {
    "num": 89,
    "arabic": "الْمُغْنِي",
    "transliteration": "Al-Mughni",
    "meaning_en": "The Enricher",
    "meaning_ru": "Обогащающий"
  },
  {
    "num": 90,
    "arabic": "الْمَانِع",
    "transliteration": "Al-Mani'",
    "meaning_en": "The Preventer",
    "meaning_ru": "Удерживающий"
  },
  {
    "num": 91,
    "arabic": "الضَّارّ",
    "transliteration": "Ad-Darr",
    "meaning_en": "The Distresser",
    "meaning_ru": "Причиняющий вред"
  },
  {
    "num": 92,
    "arabic": "النَّافِع",
    "transliteration": "An-Nafi'",
    "meaning_en": "The Benefiter",
    "meaning_ru": "Приносящий пользу"
  },
  {
    "num": 93,
    "arabic": "النُّور",
    "transliteration": "An-Nur",
    "meaning_en": "The Light",
    "meaning_ru": "Свет"
  },
  {
    "num": 94,
    "arabic": "الْهَادِي",
    "transliteration": "Al-Hadi",
    "meaning_en": "The Guide",
    "meaning_ru": "Ведущий правым путём"
  },
  {
    "num": 95,
    "arabic": "الْبَدِيع",
    "transliteration": "Al-Badi'",
    "meaning_en": "The Incomparable",
    "meaning_ru": "Несравненный"
  },
  {
    "num": 96,
    "arabic": "الْبَاقِي",
    "transliteration": "Al-Baqi",
    "meaning_en": "The Everlasting",
    "meaning_ru": "Вечный"
  },
  {
    "num": 97,
    "arabic": "الْوَارِث",
    "transliteration": "Al-Warith",
    "meaning_en": "The Inheritor",
    "meaning_ru": "Наследующий"
  },
  {
    "num": 98,
    "arabic": "الرَّشِيد",
    "transliteration": "Ar-Rashid",
    "meaning_en": "The Rightly Guided",
    "meaning_ru": "Ведущий истинным путём"
  },
  {
    "num": 99,
    "arabic": "الصَّبُور",
    "transliteration": "As-Sabur",
    "meaning_en": "The Patient",
    "meaning_ru": "Терпеливый"
  }
];
window.NAMES_OF_ALLAH_DATA = NAMES_OF_ALLAH_DATA;

function loadNames() {
  var ng = document.getElementById('ng'); if (!ng) return;
  // Рендерим СРАЗУ из встроенных данных — 0 миллисекунд ожидания и никаких ошибок!
  renderNames(NAMES_OF_ALLAH_DATA);

  // Фоновая сверка с бэкендом
  fetch(API_BASE + '/names/')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (d && d.names && d.names.length) renderNames(d.names);
    })
    .catch(function () {});
}

function renderNames(names) {
  var ng = document.getElementById('ng'); if (!ng) return;
  ng.innerHTML = '';
  var isRu = window.LANG === 'ru' || (localStorage.getItem('lang') === 'ru');
  names.forEach(function (n) {
    var div = document.createElement('div'); div.className = 'nc card';
    var meaning = (isRu && n.meaning_ru) ? n.meaning_ru : (n.meaning_en || '');
    div.innerHTML = '<div class="nn2">' + safeHTML(String(n.num)) + '</div>' +
                    '<div class="na">' + safeHTML(n.arabic) + '</div>' +
                    '<div class="nt">' + safeHTML(n.transliteration) + '</div>' +
                    '<div class="nm">' + safeHTML(meaning) + '</div>';
    ng.appendChild(div);
  });
}

// ── PRAYER BAR (background, runs on all pages) ──
loadPrayer();

window.toggleMobileAccount = function() {
  var sheet = document.getElementById('mobAccountSheet');
  var overlay = document.getElementById('sheetOverlay');
  if (sheet) sheet.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
};

function checkAuthVisibility() {
  var token = localStorage.getItem('access_token');
  if (token) {
    document.body.classList.add('is-logged-in');
    var username = localStorage.getItem('username');
    if (username) {
      document.querySelectorAll('[data-username]').forEach(function(el) { el.textContent = username; });
    }
  } else {
    document.body.classList.remove('is-logged-in');
  }
}
