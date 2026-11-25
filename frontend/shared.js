/* ═══════════════════════════════════════════════
   shared.js — Noor Al-Quran Global Logic & Data
   ═══════════════════════════════════════════════ */

'use strict';

// ── XSS PROTECTION HELPER ──
function safeHTML(str) {
  if (typeof document === 'undefined') {
    return String(str === undefined || str === null ? '' : str)
      .replace(/[&<>"']/g, function(c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
  }
  var d = document.createElement('div');
  d.textContent = (str === undefined || str === null) ? '' : str;
  return d.innerHTML;
}
if (typeof window !== 'undefined') window.safeHTML = safeHTML;

// ── PRAYER TIMER TRACKER ──
var _prayerTimers = [];

// ── UNIFIED ROBUST STORAGE MANAGER (NO SECRETS / NO TOKENS) ──
const NoorStorage = {
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
      // Never persist bearer or refresh tokens in Web Storage
      if (key === 'access_token' || key === 'refresh_token') return false;
      var serialized = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val);
      localStorage.setItem(this._prefix + key, serialized);
      if (key === 'username' || key === 'lang') {
        try {
          localStorage.setItem(key, serialized);
        } catch (e) {
          console.warn('Legacy mirror set failed:', e);
        }
      }
      return true;
    } catch (e) {
      console.warn('NoorStorage.set quota exceeded or disabled', e);
      return false;
    }
  },
  remove: function(key) {
    try {
      localStorage.removeItem(this._prefix + key);
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('NoorStorage.remove error:', e);
    }
  }
};
if (typeof window !== 'undefined') {
  window.NoorStorage = NoorStorage;
  window.StorageManager = NoorStorage;
  window.storageGet = function(k, d) { return NoorStorage.get(k, d); };
  window.storageSet = function(k, v) { return NoorStorage.set(k, v); };
  window.storageRemove = function(k) { return NoorStorage.remove(k); };
  window.onReady = function(fn) {
    if (typeof document === 'undefined') return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  };
}

// ── API BASE & ZERO-FAILURE DUAL FALLBACK ──
const API_BASE = (typeof window !== 'undefined' && window.NQ_API_BASE) ? window.NQ_API_BASE : '/api';
const PUBLIC_QURAN_API = 'https://api.alquran.cloud/v1';
if (typeof window !== 'undefined') {
  window.API_BASE = API_BASE;
  window.PUBLIC_QURAN_API = PUBLIC_QURAN_API;
  try {
    ['access_token', 'refresh_token', 'nq_access_token', 'nq_refresh_token'].forEach(function(k) {
      localStorage.removeItem(k);
    });
  } catch (e) { /* storage disabled */ }
}

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
    } catch (e) {
      console.warn('IndexedDB cache lookup failed for surah ' + surahNum, e);
    }
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
      } catch (err) {
        console.warn('IndexedDB last resort lookup failed for surah ' + surahNum, err);
      }
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
  } catch (e) {
    console.warn('Background surah sync failed for surah ' + surahNum, e);
  }
}
if (typeof window !== 'undefined') window.fetchSurahData = fetchSurahData;

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
    page: 'reciter.html?id=abdulbasit',
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
    page: 'reciter.html?id=ghamdi',
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
    page: 'reciter.html?id=minshawi',
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
    page: 'reciter.html?id=maher',
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
    page: 'reciter.html?id=mishary_alafasy',
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
    page: 'reciter.html?id=islam_sobhi',
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
    page: 'reciter.html?id=yasser_dosari',
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
    page: 'reciter.html?id=sherif_mostafa',
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
    page: 'reciter.html?id=abdurrahman_mossad',
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
    page: 'reciter.html?id=raad_kurdi',
  }
];
if (typeof window !== 'undefined') {
  window.RECITERS = RECITERS;
}

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
if (typeof window !== 'undefined') {
  window.SURAHS = SURAHS;
}

const RECITER_SURAH_AVAILABILITY = {
  abdurrahman_mossad: [1, 29],
  sherif_mostafa: [65, 66, 67, 71, 75, 76, 77, 89],
  islam_sobhi_excluded: [36, 45],
};
const MOSSAD_AVAILABLE = RECITER_SURAH_AVAILABILITY.abdurrahman_mossad;
const SHERIF_AVAILABLE = RECITER_SURAH_AVAILABILITY.sherif_mostafa;

function getReciterAvailableSurahs(reciterId) {
  if (reciterId === 'abdurrahman_mossad') {
    return SURAHS.filter(function(s) { return RECITER_SURAH_AVAILABILITY.abdurrahman_mossad.includes(s.n); });
  }
  if (reciterId === 'sherif_mostafa') {
    return SURAHS.filter(function(s) { return RECITER_SURAH_AVAILABILITY.sherif_mostafa.includes(s.n); });
  }
  if (reciterId === 'islam_sobhi') {
    return SURAHS.filter(function(s) { return !RECITER_SURAH_AVAILABILITY.islam_sobhi_excluded.includes(s.n); });
  }
  return SURAHS;
}
if (typeof window !== 'undefined') {
  window.MOSSAD_AVAILABLE = MOSSAD_AVAILABLE;
  window.SHERIF_AVAILABLE = SHERIF_AVAILABLE;
  window.getReciterAvailableSurahs = getReciterAvailableSurahs;
}

// ── STARS (respects prefers-reduced-motion, batched lightweight canvas rendering) ──
if (typeof window !== 'undefined' && typeof document !== 'undefined') (function () {
  const c = document.getElementById('sc'); if (!c) return;
  const x = c.getContext('2d'); if (!x) return;
  const COLORS = ['#ffffff', '#fffde0', '#d0e8ff', '#f0d060'];
  let buckets = [[], [], [], []];
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timerId = null;
  function rs() {
    c.width = innerWidth; c.height = innerHeight;
    buckets = [[], [], [], []];
    const maxStars = c.width < 900 ? 45 : 95;
    const n = Math.min(maxStars, Math.floor(c.width * c.height / 14000));
    for (let i = 0; i < n; i++) {
      const sz = Math.random() > 0.7 ? 2 : 1.5;
      buckets[i % 4].push({
        x: Math.floor(Math.random() * c.width),
        y: Math.floor(Math.random() * c.height),
        s: sz,
        a: 0.35 + Math.random() * 0.55,
      });
    }
  }
  function drawOnce() {
    x.clearRect(0, 0, c.width, c.height);
    for (let b = 0; b < 4; b++) {
      x.fillStyle = COLORS[b];
      const list = buckets[b];
      for (let i = 0; i < list.length; i++) {
        const v = list[i];
        x.globalAlpha = v.a;
        x.fillRect(v.x, v.y, v.s, v.s);
      }
    }
    x.globalAlpha = 1;
  }
  function startStars() {
    if (timerId) clearInterval(timerId);
    rs();
    drawOnce();
    if (!reducedMotion) {
      timerId = setInterval(function () {
        if (document.hidden) return;
        for (let b = 0; b < 4; b++) {
          const list = buckets[b];
          if (list.length) {
            const idx = Math.floor(Math.random() * list.length);
            list[idx].a = 0.3 + Math.random() * 0.65;
          }
        }
        drawOnce();
      }, 220);
    }
  }
  window.addEventListener('resize', function () {
    if (buckets[0].length) { rs(); drawOnce(); }
  });
  window.addEventListener('load', function () {
    setTimeout(startStars, 800);
  }, { once: true });
})();

// ── CURSOR ──
if (typeof window !== 'undefined' && typeof document !== 'undefined') (function () {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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

// ── HIJRI DATE (cached Intl formatter) ──
var _hijriFmt = null;
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
    if (!_hijriFmt) {
      _hijriFmt = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
    }
    const parts = _hijriFmt.formatToParts(d);
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
if (typeof window !== 'undefined') {
  window.toHijri = toHijri;
}
const HM = ['Muharram', 'Safar', 'Rabi I', 'Rabi II', 'Jumada I', 'Jumada II', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhul Qa'dah", 'Dhul Hijjah'];
const HMA = ['مُحَرَّم', 'صَفَر', 'رَبِيع الأَوَّل', 'رَبِيع الآخِر', 'جُمَادَى الأُولَى', 'جُمَادَى الآخِرَة', 'رَجَب', 'شَعْبَان', 'رَمَضَان', 'شَوَّال', 'ذُو القَعْدَة', 'ذُو الحِجَّة'];
if (typeof window !== 'undefined') {
  window.HM = HM;
  window.HMA = HMA;
}

// ── CLOCK ──
if (typeof window !== 'undefined' && typeof document !== 'undefined') (function () {
  const D = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let lastDayKey = '';
  let _timerStarted = false;
  function upd() {
    if (!document.getElementById('ct') && !document.getElementById('hd')) return;
    const n = new Date();
    const h = String(n.getHours()).padStart(2, '0'), m = String(n.getMinutes()).padStart(2, '0'), s = String(n.getSeconds()).padStart(2, '0');
    set('ct', `${h}:${m}:${s}`);
    const dayKey = `${n.getFullYear()}-${n.getMonth()}-${n.getDate()}`;
    if (dayKey !== lastDayKey) {
      lastDayKey = dayKey;
      set('cd', `${D[n.getDay()]}, ${M[n.getMonth()]} ${n.getDate()}, ${n.getFullYear()}`);
      const hj = toHijri(n);
      set('ch', `${hj.day} ${HM[hj.month]} ${hj.year} AH`);
      set('hd', hj.day); set('hm', `${HM[hj.month]} ${hj.year} AH`); set('ha', HMA[hj.month]);
    }
  }
  function startClock() {
    if (_timerStarted) return;
    _timerStarted = true;
    upd();
    setInterval(upd, 1000);
  }
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(function () { setTimeout(startClock, 80); });
  } else {
    setTimeout(startClock, 80);
  }
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
  var asrHanafi = options.hanafi !== undefined
    ? !!options.hanafi
    : (options.school === 1 || options.school === 'Hanafi');
  var highLatMethod = options.highLatitude || 'AngleBased';

  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var timezone = typeof options.timezone === 'number' ? options.timezone : -date.getTimezoneOffset() / 60;
  // Julian Day at local noon (~12h - timezone/24) improves accuracy across longitude/timezone boundaries
  var D = (367 * year) - Math.floor((7 * (year + Math.floor((month + 9) / 12))) / 4)
    + Math.floor((275 * month) / 9) + day - 730531.5 + (0.5 - timezone / 24);

  var L = fixAngle(280.461 + 0.9856474 * D);
  var M = fixAngle(357.528 + 0.9856003 * D);
  var Lambda = fixAngle(L + 1.915 * Math.sin(rad(M)) + 0.020 * Math.sin(rad(2 * M)));
  var obliq = 23.439 - 0.0000004 * D;
  var alpha = deg(Math.atan2(Math.cos(rad(obliq)) * Math.sin(rad(Lambda)), Math.cos(rad(Lambda)))) / 15;
  var delta = deg(Math.asin(Math.sin(rad(obliq)) * Math.sin(rad(Lambda))));
  var equationOfTime = (L / 15) - fixHour(alpha);
  if (equationOfTime > 12) equationOfTime -= 24;
  if (equationOfTime < -12) equationOfTime += 24;

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
  var ishaFloat = method.ishaInterval
    ? (maghribFloat !== null ? fixHour(maghribFloat + method.ishaInterval / 60) : null)
    : sunAngleTime(method.isha, 1);

  if (sunriseFloat !== null && maghribFloat !== null && highLatMethod !== 'None') {
    var nightPortion = fixHour(24 - maghribFloat + sunriseFloat);
    if (fajrFloat === null) {
      var fajrDiff = highLatMethod === 'NightMiddle'
        ? nightPortion / 2
        : highLatMethod === 'OneSeventh'
          ? nightPortion / 7
          : (method.fajr / 60) * nightPortion;
      fajrFloat = fixHour(sunriseFloat - fajrDiff);
    }
    if (ishaFloat === null && !method.ishaInterval) {
      var ishaDiff = highLatMethod === 'NightMiddle'
        ? nightPortion / 2
        : highLatMethod === 'OneSeventh'
          ? nightPortion / 7
          : (method.isha / 60) * nightPortion;
      ishaFloat = fixHour(maghribFloat + ishaDiff);
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

function calculateQiblaBearing(latitude, longitude) {
  var mLat = 21.4225 * Math.PI / 180;
  var mLon = 39.8262 * Math.PI / 180;
  var lat = latitude * Math.PI / 180;
  var lon = longitude * Math.PI / 180;
  var dLon = mLon - lon;
  var y = Math.sin(dLon) * Math.cos(mLat);
  var x = Math.cos(lat) * Math.sin(mLat) - Math.sin(lat) * Math.cos(mLat) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function calculateQiblaDistanceKm(latitude, longitude) {
  var R = 6371;
  var mLat = 21.4225 * Math.PI / 180;
  var mLon = 39.8262 * Math.PI / 180;
  var lat = latitude * Math.PI / 180;
  var lon = longitude * Math.PI / 180;
  var dLat = mLat - lat;
  var dLon = mLon - lon;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(lat) * Math.cos(mLat) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)));
}

if (typeof window !== 'undefined') {
  window.calculateOfflinePrayerTimes = calculateOfflinePrayerTimes;
  window.calculateQiblaBearing = calculateQiblaBearing;
  window.calculateQiblaDistanceKm = calculateQiblaDistanceKm;
}

// ── PRAYER SETTINGS & OFFLINE ENGINE ──
function getPrayerSettings() {
  var method = 3; // Default MWL
  var school = 0; // Default Shafi / Standard
  try {
    var m = localStorage.getItem('nq_prayer_method');
    if (m !== null && !isNaN(parseInt(m, 10))) {
      method = parseInt(m, 10);
    }
    var s = localStorage.getItem('nq_prayer_school');
    if (s !== null && !isNaN(parseInt(s, 10))) {
      school = parseInt(s, 10);
    }
  } catch (e) {
    console.warn('Error reading prayer settings from localStorage:', e);
  }
  return { method: method, school: school, hanafi: school === 1 };
}
if (typeof window !== 'undefined') window.getPrayerSettings = getPrayerSettings;

// ── PRAYER TIMES ──
function loadPrayer(userInitiated) {
  var settings = getPrayerSettings();
  var cacheKey = 'prayer_cache_' + settings.method + '_' + settings.school;
  var PRAYER_CACHE_TTL = 30 * 60 * 1000;
  var cached = null;
  try {
    var raw = localStorage.getItem(cacheKey);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts < PRAYER_CACHE_TTL) cached = parsed.data;
    }
  } catch(e) {
    console.warn('Error reading prayer cache:', e);
  }
  if (cached && !userInitiated) {
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
    } catch(e) {
      console.warn('Error reading last_coords:', e);
    }
    var la = lastCoords ? lastCoords.lat : 21.3891;
    var lo = lastCoords ? lastCoords.lng : 39.8579;
    var t = calculateOfflinePrayerTimes(la, lo, new Date(), { method: settings.method, hanafi: settings.hanafi });
    set('ft', t.Fajr); set('srt', t.Sunrise); set('dt', t.Dhuhr);
    set('at', t.Asr); set('mt', t.Maghrib); set('it', t.Isha);
    hlPrayer(t); schedulePrayer(t);
    const b = document.querySelector('.pbar .bsm');
    if (b) b.textContent = "📍 Offline Calc";
  };
  var fetchPrayer = function (la, lo) {
    try { localStorage.setItem('last_coords', JSON.stringify({lat: la, lng: lo})); } catch(e) {
      console.warn('Error saving last_coords:', e);
    }
    fetch(`${API_BASE}/prayer-times/?lat=${la}&lng=${lo}&method=${settings.method}&school=${settings.school}`)
      .then(r => r.json()).then(d => {
        if (!d || !d.data || !d.data.timings) throw new Error('Invalid prayer data response');
        const t = d.data.timings;
        try { localStorage.setItem(cacheKey, JSON.stringify({ts: Date.now(), data: t})); } catch(e) {
          console.warn('Error saving prayer cache:', e);
        }
        set('ft', t.Fajr); set('srt', t.Sunrise); set('dt', t.Dhuhr);
        set('at', t.Asr); set('mt', t.Maghrib); set('it', t.Isha);
        hlPrayer(t); schedulePrayer(t);
        const b = document.querySelector('.pbar .bsm');
        if (b) b.textContent = "📍 My Location";
      }).catch(err);
  };
  var fb = async function () {
    try {
      var lastRaw = localStorage.getItem('last_coords');
      if (lastRaw && !userInitiated) {
        var c = JSON.parse(lastRaw);
        if (c && typeof c.lat === 'number' && typeof c.lng === 'number') {
          return fetchPrayer(c.lat, c.lng);
        }
      }
    } catch (e) { /* ignore */ }
    err();
  };
  if (!userInitiated || typeof navigator === 'undefined' || !navigator.geolocation) {
    return fb();
  }
  navigator.geolocation.getCurrentPosition(
    function (pos) { fetchPrayer(pos.coords.latitude, pos.coords.longitude); },
    async function () {
      try {
        let r = await fetch('https://ipapi.co/json/');
        let d = await r.json();
        if (d && d.latitude && d.longitude) return fetchPrayer(d.latitude, d.longitude);
      } catch(e) { console.warn('ipapi lookup failed:', e); }
      fb();
    },
    { timeout: 7000 }
  );
}
if (typeof window !== 'undefined') window.loadPrayer = loadPrayer;

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
    adhanAud.play().catch(function(err) {
      if (err && err.name === 'NotAllowedError') {
        console.info('Adhan audio autoplay blocked by browser policy; user interaction needed.');
      } else if (err && err.name !== 'AbortError') {
        console.warn('Adhan audio play error:', err);
      }
    });
  }
}
function closeAdhan() {
  const b = document.getElementById('adhan');
  if (b) b.classList.remove('show');
  var adhanAud = document.getElementById('adhan-audio');
  if (adhanAud) { adhanAud.pause(); adhanAud.currentTime = 0; }
}

function changeAdhanReciter(val) {
  NoorStorage.set('adhan_reciter', val);
  var sel = document.getElementById('adhanReciterSel');
  if (sel && sel.value !== val) sel.value = val;
  if (typeof NoorAuth !== 'undefined' && NoorAuth.isAuthenticated() && typeof window !== 'undefined' && typeof window.authFetch === 'function') {
    window.authFetch(`${API_BASE}/notifications/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prayer_name: 'fajr', adhan_reciter: val, is_enabled: true }),
    }).catch(function () { /* ignore offline notification sync error */ });
  }
}

// ── QIBLA ──
function getQibla() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(function (pos) {
    const b = calculateQiblaBearing(pos.coords.latitude, pos.coords.longitude);
    const qa = document.getElementById('qa'); if (qa) qa.style.transform = `translateX(-50%) translateY(-100%) rotate(${b}deg)`;
    set('qt', `Qibla: ${Math.round(b)}° from North`);
  });
}
if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
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
if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof IntersectionObserver !== 'undefined') (function () {
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
  if (typeof document === 'undefined' || !document.body) return;
  function getBanner() {
    var existing = document.getElementById('noor-offline-banner');
    if (existing) return existing;
    var banner = document.createElement('div');
    banner.id = 'noor-offline-banner';
    banner.className = 'noor-offline-banner';
    var text = (window.LANG === 'ru' ? 'Нет подключения к сети' : (window.LANG === 'uz' ? "Internetga ulanish yo'q" : 'No internet connection'));
    var icSpan = document.createElement('span');
    icSpan.textContent = '⚡';
    var txtSpan = document.createElement('span');
    txtSpan.textContent = text;
    banner.appendChild(icSpan);
    banner.appendChild(document.createTextNode(' '));
    banner.appendChild(txtSpan);
    document.body.prepend(banner);
    return banner;
  }

  function updateStatus() {
    if (!navigator.onLine) {
      getBanner().classList.add('show');
    } else {
      var banner = document.getElementById('noor-offline-banner');
      if (banner && banner.classList.contains('show')) {
        banner.classList.remove('show');
        var backText = (window.LANG === 'ru' ? 'Подключение к сети восстановлено' : (window.LANG === 'uz' ? 'Internetga ulanish tiklandi' : 'Back online'));
        showToast(backText, 'success', 3000);
      }
    }
  }

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  if (!navigator.onLine) getBanner().classList.add('show');
}
if (typeof window !== 'undefined') window.initNetworkTracker = initNetworkTracker;

// ── RUNTIME CONFIG (AUDIO CDN) ──
async function _loadRuntimeConfig() {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return;
  if (window.NQ_AUDIO_CDN_BASE !== undefined) return;
  try {
    var res = await fetch(`${API_BASE}/config/`);
    if (res.ok) {
      var cfg = await res.json();
      if (cfg && cfg.audioCdnBase) {
        window.NQ_AUDIO_CDN_BASE = String(cfg.audioCdnBase).replace(/\/+$/, '') + '/';
      }
    }
  } catch (e) { /* Static/offline deployments operate without backend config */ }
}

// ── IN-MEMORY ACCESS TOKEN + HTTPONLY COOKIE AUTH MANAGER ──
const NoorAuth = (function () {
  var _accessToken = null;
  var _username = null;
  var _refreshPromise = null;

  function _syncUIState() {
    if (typeof document === 'undefined' || !document.body) return;
    var hasSession = !!(_accessToken && isTokenValid(_accessToken, 5)) || isHintActive();
    if (hasSession) {
      document.body.classList.add('is-logged-in');
      var uname = _username || getUsername();
      if (uname) {
        document.querySelectorAll('[data-username]').forEach(function (el) { el.textContent = uname; });
      }
    } else {
      document.body.classList.remove('is-logged-in');
    }
  }

  function isHintActive() {
    try { return localStorage.getItem('nq_session_hint') === '1'; } catch (e) { return false; }
  }

  function setSession(data) {
    if (data && data.access) _accessToken = data.access;
    if (data && data.username) {
      _username = data.username;
      try { localStorage.setItem('nq_username_hint', data.username); } catch (e) { /* ignore */ }
    }
    try { localStorage.setItem('nq_session_hint', '1'); } catch (e) { /* ignore */ }
    _syncUIState();
  }

  function clearSession() {
    _accessToken = null;
    _username = null;
    try {
      ['nq_session_hint', 'nq_username_hint', 'username', 'access_token', 'refresh_token', 'nq_access_token', 'nq_refresh_token', 'prayer_cache'].forEach(function (k) {
        localStorage.removeItem(k);
      });
    } catch (e) { /* ignore */ }
    _syncUIState();
  }

  function getAccessToken() { return _accessToken; }

  function getUsername() {
    if (_username) return _username;
    try { return localStorage.getItem('nq_username_hint') || ''; } catch (e) { return ''; }
  }

  function isAuthenticated() {
    return !!(_accessToken && isTokenValid(_accessToken, 5)) || isHintActive();
  }

  async function refreshAccessToken() {
    if (_refreshPromise) return _refreshPromise;
    _refreshPromise = (async function () {
      var res = await fetch(`${API_BASE}/auth/refresh/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        clearSession();
        throw new Error('Refresh rejected');
      }
      var data = await res.json();
      if (!data || !data.access) {
        clearSession();
        throw new Error('Invalid refresh response');
      }
      setSession({ access: data.access, username: data.username || getUsername() });
      return data.access;
    })().finally(function () {
      _refreshPromise = null;
    });
    return _refreshPromise;
  }

  async function restoreSession() {
    if (_accessToken && isTokenValid(_accessToken, 30)) {
      _syncUIState();
      return _accessToken;
    }
    if (!isHintActive()) {
      _syncUIState();
      return null;
    }
    try {
      return await refreshAccessToken();
    } catch (e) {
      return null;
    }
  }

  return {
    setSession: setSession,
    clearSession: clearSession,
    getAccessToken: getAccessToken,
    getUsername: getUsername,
    isAuthenticated: isAuthenticated,
    refreshAccessToken: refreshAccessToken,
    restoreSession: restoreSession,
    syncUIState: _syncUIState,
  };
})();
if (typeof window !== 'undefined') window.NoorAuth = NoorAuth;

// ── SERVICE WORKER REGISTRATION & GLOBAL DELEGATION ──
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  var _isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || _isLocalHost)) {
    window.addEventListener('load', function () {
      var swPath = window.location.pathname.includes('/pages/') ? '../sw.js' : 'sw.js';
      navigator.serviceWorker.register(swPath).catch(function (err) {
        console.warn('Service worker registration error:', err);
      });
    });
  }

  function _activateAsyncFonts() {
    var gf = document.getElementById('noorFonts');
    if (gf && gf.media === 'print') gf.media = 'all';
  }

  document.addEventListener('DOMContentLoaded', function () {
    _activateAsyncFonts();
    initNetworkTracker();
    applyReadingSettings();

    setTimeout(function () {
      _loadRuntimeConfig();
      NoorAuth.restoreSession();
    }, 60);

    document.querySelectorAll('.mob-nav a, .mob-nav button').forEach(function (el) {
      el.addEventListener('click', function () {
        if (navigator.vibrate) navigator.vibrate(12);
      });
    });

    var savedAdhan = null;
    try { savedAdhan = localStorage.getItem('adhan_reciter'); } catch (e) { /* ignore */ }
    var adhanSel = document.getElementById('adhanReciterSel');
    if (adhanSel) {
      if (savedAdhan) adhanSel.value = savedAdhan;
      adhanSel.addEventListener('change', function () { changeAdhanReciter(this.value); });
    }

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('.dropdown > a, .dropdown > .nav-trigger');
      if (trigger) {
        e.preventDefault();
        e.stopPropagation();
        var parent = trigger.parentElement;
        var wasActive = parent.classList.contains('active');
        document.querySelectorAll('.dropdown.active').forEach(function (d) {
          d.classList.remove('active');
          var t = d.querySelector('.nav-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
        if (!wasActive) {
          parent.classList.add('active');
          trigger.setAttribute('aria-expanded', 'true');
        }
        return;
      }
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown.active').forEach(function (d) {
          d.classList.remove('active');
          var t = d.querySelector('.nav-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
      }

      var actEl = e.target.closest('[data-action]');
      if (!actEl) return;
      var action = actEl.getAttribute('data-action');
      if (action === 'toggle-mobile-account') {
        window.toggleMobileAccount();
      } else if (action === 'toggle-lang') {
        window.toggleLanguageMenu();
      } else if (action === 'logout') {
        window.doLogout();
      } else if (action === 'load-prayer') {
        loadPrayer(true);
      } else if (action === 'close-adhan') {
        closeAdhan();
      } else if (action === 'reload') {
        window.location.reload();
      } else if (action === 'load-surahs') {
        loadSurahs();
      } else if (action === 'go-quran') {
        window.location.href = 'quran.html';
      } else if (action === 'filter-reset' && typeof window.filterS === 'function') {
        window.filterS('');
      } else if (action === 'open-surah' && typeof window.openS === 'function') {
        var sn = parseInt(actEl.getAttribute('data-surah'), 10);
        if (sn) window.openS(sn);
      } else if (action === 'set-lang' && typeof window.setLanguage === 'function') {
        var lang = actEl.getAttribute('data-lang');
        if (lang) window.setLanguage(lang);
        var panel = document.getElementById('lang-panel');
        if (panel) panel.remove();
      }
    });

    setTimeout(function () {
      if (document.getElementById('ft')) loadPrayer(false);
      if (document.getElementById('pbgrid')) loadPrayerBig(false);
    }, 0);
    setTimeout(function () {
      if (document.getElementById('rg')) loadReciters();
      if (document.getElementById('ng')) loadNames();
    }, 24);
  });
}

if (typeof window !== 'undefined') {
  window.doLogout = function () {
    fetch(`${API_BASE}/auth/logout/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }).catch(function (err) {
      console.warn('Backend logout failed or was offline:', err);
    });
    NoorAuth.clearSession();
    var isInPages = window.location.pathname.includes('/pages/');
    window.location.href = isInPages ? 'login.html' : 'pages/login.html';
  };

  // ── LANGUAGE MENU (CSP-safe class styling) ──
  window.toggleLanguageMenu = function () {
    var existing = document.getElementById('lang-panel');
    if (existing) { existing.remove(); return; }
    var panel = document.createElement('div');
    panel.id = 'lang-panel';
    panel.className = 'lang-panel';
    var title = document.createElement('div');
    title.className = 'lang-panel-title';
    title.textContent = 'Language';
    panel.appendChild(title);

    var langs = [
      { code: 'en', label: 'English 🇬🇧' },
      { code: 'ru', label: 'Русский 🇷🇺' },
      { code: 'uz', label: "O'zbek 🇺🇿" }
    ];
    var saved = 'en';
    try { saved = localStorage.getItem('lang') || 'en'; } catch (e) { /* ignore */ }
    langs.forEach(function (l) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-option' + (saved === l.code ? ' is-active' : '');
      btn.setAttribute('data-action', 'set-lang');
      btn.setAttribute('data-lang', l.code);
      btn.textContent = l.label;
      panel.appendChild(btn);
    });
    document.body.appendChild(panel);
    setTimeout(function () {
      document.addEventListener('click', function handler(e) {
        if (!panel.contains(e.target) && !e.target.closest('[data-action="toggle-lang"]')) {
          panel.remove();
          document.removeEventListener('click', handler);
        }
      });
    }, 10);
  };
}

// ── JWT HELPERS & AUTHENTICATED FETCH (RAM TOKEN + HTTPONLY COOKIE) ──
function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    var base64Url = token.split('.')[1];
    if (!base64Url) return null;
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function isTokenValid(token, bufferSeconds) {
  if (!token) return false;
  bufferSeconds = bufferSeconds !== undefined ? bufferSeconds : 30;
  var payload = parseJwt(token);
  if (!payload || !payload.exp) return false;
  var now = Math.floor(Date.now() / 1000);
  return payload.exp > (now + bufferSeconds);
}

async function refreshAccessToken() {
  return NoorAuth.refreshAccessToken();
}

if (typeof window !== 'undefined') {
  window.parseJwt = parseJwt;
  window.isTokenValid = isTokenValid;
  window.refreshAccessToken = refreshAccessToken;

  window.authFetch = async function (url, options) {
    options = options || {};
    var token = NoorAuth.getAccessToken();

    if ((!token || !isTokenValid(token, 30)) && NoorAuth.isAuthenticated()) {
      try {
        token = await NoorAuth.refreshAccessToken();
      } catch (e) {
        token = null;
      }
    }

    var headers = Object.assign({}, options.headers || {});
    if (token) headers['Authorization'] = `Bearer ${token}`;

    var fetchOpts = Object.assign({}, options, {
      headers: headers,
      credentials: options.credentials || 'include',
    });

    var res = await fetch(url, fetchOpts);

    if (res.status === 401 && NoorAuth.isAuthenticated()) {
      try {
        var newToken = await NoorAuth.refreshAccessToken();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          res = await fetch(url, Object.assign({}, fetchOpts, { headers: headers }));
        }
      } catch (e) {
        NoorAuth.clearSession();
      }
    }
    return res;
  };
}

// ── SKELETON / SHIMMER LOADERS ──
function getSurahSkeletons(count) {
  count = count || 12;
  var html = '<div class="skeleton-grid">';
  for (var i = 0; i < count; i++) {
    html += '<div class="skeleton-card">' +
              '<div class="skel-row">' +
                '<div class="skeleton skeleton-circle"></div>' +
                '<div class="skel-flex1">' +
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

function getAyahSkeletons(count) {
  count = count || 6;
  var html = '';
  for (var i = 0; i < count; i++) {
    html += '<div class="ac card skeleton-card ac-skel">' +
              '<div class="at at-skel">' +
                '<div class="skeleton skel-num"></div>' +
                '<div class="skeleton skel-act"></div>' +
              '</div>' +
              '<div class="skeleton skeleton-line long skel-line-lg"></div>' +
              '<div class="skeleton skeleton-line mid skel-line-md"></div>' +
              '<div class="skeleton skeleton-line long skel-line-sm"></div>' +
              '<div class="skeleton skeleton-line short skel-line-sm"></div>' +
            '</div>';
  }
  return html;
}

function getNamesSkeletons(count) {
  count = count || 16;
  var html = '<div class="skeleton-names-grid">';
  for (var i = 0; i < count; i++) {
    html += '<div class="nc card skeleton-card nc-skel">' +
              '<div class="skeleton skel-nidx"></div>' +
              '<div class="skeleton skel-nar"></div>' +
              '<div class="skeleton skeleton-line short skel-ntrn"></div>' +
              '<div class="skeleton skeleton-line mid skel-nmn"></div>' +
            '</div>';
  }
  html += '</div>';
  return html;
}

// ── EMPTY & ERROR STATE GENERATORS (CSP safe: uses data-action, no onclick/style) ──
function getEmptyStateHTML(opts) {
  opts = opts || {};
  var icon = opts.icon || '📖';
  var title = opts.title || 'No Items Found';
  var desc = opts.description || '';
  var actText = opts.actionText || '';
  var actData = opts.actionName || '';
  return '<div class="state-card">' +
           '<div class="state-icon">' + safeHTML(icon) + '</div>' +
           '<h3 class="state-title">' + safeHTML(title) + '</h3>' +
           (desc ? '<p class="state-desc">' + safeHTML(desc) + '</p>' : '') +
           (actText && actData ? '<button type="button" class="state-btn" data-action="' + safeHTML(actData) + '">' + safeHTML(actText) + '</button>' : '') +
         '</div>';
}

function getErrorStateHTML(opts) {
  opts = opts || {};
  var title = opts.title || 'Something went wrong';
  var desc = opts.description || 'Unable to load content. Please check your network connection.';
  var actData = opts.actionName || 'reload';
  var surahAttr = opts.surahNum ? ' data-surah="' + Number(opts.surahNum) + '"' : '';
  return '<div class="state-card state-card--error">' +
           '<div class="state-icon">⚠️</div>' +
           '<h3 class="state-title">' + safeHTML(title) + '</h3>' +
           '<p class="state-desc">' + safeHTML(desc) + '</p>' +
           '<button type="button" class="state-btn" data-action="' + safeHTML(actData) + '"' + surahAttr + '>↻ Retry</button>' +
         '</div>';
}

if (typeof window !== 'undefined') {
  window.getSurahSkeletons = getSurahSkeletons;
  window.getAyahSkeletons = getAyahSkeletons;
  window.getNamesSkeletons = getNamesSkeletons;
  window.getEmptyStateHTML = getEmptyStateHTML;
  window.getErrorStateHTML = getErrorStateHTML;
}

// ── AYAH SHARING HELPER ──
if (typeof window !== 'undefined') {
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
}

// ── READING CONTROLS ──
var _currentFontSize = (typeof localStorage !== 'undefined' ? parseFloat(localStorage.getItem('quran_font_size')) : 0) || 1.8;
var _currentViewMode = (typeof localStorage !== 'undefined' && localStorage.getItem('quran_view_mode')) || 'both';

function applyReadingSettings() {
  if (typeof document === 'undefined') return;
  var alist = document.getElementById('alist');
  var hasReader = !!alist || !!document.querySelector('.player-wrap');
  if (hasReader && _currentFontSize !== 1.8) {
    document.documentElement.style.setProperty('--ayah-font-size', _currentFontSize + 'rem');
  } else if (hasReader) {
    document.documentElement.style.removeProperty('--ayah-font-size');
  }
  if (alist) {
    alist.classList.remove('view-both', 'view-arabic-only', 'view-translit');
    alist.classList.add('view-' + _currentViewMode);
  }
  var modeBtns = document.querySelectorAll('[data-view-mode]');
  if (modeBtns.length) {
    modeBtns.forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-view-mode') === _currentViewMode);
    });
  }
}
if (typeof window !== 'undefined') {
  window.applyReadingSettings = applyReadingSettings;

  window.changeAyahFontSize = function(delta) {
    _currentFontSize = Math.min(2.8, Math.max(1.2, _currentFontSize + delta));
    NoorStorage.set('quran_font_size', _currentFontSize.toFixed(2));
    applyReadingSettings();
  };

  window.setQuranViewMode = function(mode) {
    _currentViewMode = mode;
    NoorStorage.set('quran_view_mode', mode);
    applyReadingSettings();
  };
}

// ── ADVANCED AUDIO PLAYER ENGINE (ARCH-01, FUNC-06, PERF-05) ──
var NoorAudioManager = (function() {
  var AYAHS_PER_SURAH = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
    112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89,
    59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30,
    52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15,
    21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
  ];

  var state = {
    isPlaying: false,
    mode: 'ayah', // 'ayah' or 'surah'
    surahNum: 1,
    ayahNum: 1,
    reciterId: 'mishary_alafasy',
    speed: 1,
    loopMode: 'off', // 'off' | '1x' | '3x' | 'inf'
    loopCounter: 0,
    volume: 0.85
  };

  var _audio = null;
  var _candidateUrls = [];
  var _urlIndex = 0;
  var _requestId = 0;

  function _getAudio() {
    if (!_audio) {
      _audio = document.getElementById('aud');
      if (!_audio) {
        _audio = document.createElement('audio');
        _audio.id = 'aud';
        document.body.appendChild(_audio);
      }
      _bindEvents();
    }
    return _audio;
  }

  function _bindEvents() {
    if (!_audio) return;
    _audio.ontimeupdate = function() {
      _updateProgress();
    };
    _audio.onended = function() {
      _handleEnded();
    };
    _audio.onerror = function() {
      _tryNextMirror();
    };
  }

  function _updateProgress() {
    var a = _audio;
    if (!a) return;
    var cur = a.currentTime || 0;
    var dur = a.duration || 0;
    var pct = dur > 0 ? (cur / dur) * 100 : 0;

    var pf = document.getElementById('pf');
    if (pf) pf.style.width = pct + '%';

    var timeNow = document.getElementById('timeNow') || document.getElementById('playerTimeNow');
    var timeDur = document.getElementById('timeDur') || document.getElementById('playerTimeDur');
    if (timeNow) timeNow.textContent = _formatTime(cur);
    if (timeDur && dur > 0) timeDur.textContent = _formatTime(dur);

    var seekSlider = document.getElementById('seekSlider') || document.getElementById('playerSeekSlider');
    if (seekSlider && !seekSlider.dataset.dragging) {
      seekSlider.value = pct;
    }
  }

  function _formatTime(sec) {
    if (isNaN(sec) || sec < 0) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function _handleEnded() {
    if (state.loopMode === 'inf') {
      _replayCurrent();
      return;
    }
    if (state.loopMode === '3x') {
      state.loopCounter++;
      if (state.loopCounter < 3) {
        _replayCurrent();
        return;
      }
      state.loopCounter = 0;
    }
    if (state.loopMode === '1x') {
      state.isPlaying = false;
      _syncUI();
      return;
    }

    next();
  }

  function _replayCurrent() {
    var a = _getAudio();
    if (a) {
      a.currentTime = 0;
      a.play().then(function() {
        state.isPlaying = true;
        _syncUI();
      }).catch(function(err) {
        if (err.name !== 'AbortError') {
          state.isPlaying = false;
          _syncUI();
        }
      });
    }
  }

  function _getGlobalAyah(surahNum, ayahNum) {
    var num = 0;
    for (var i = 0; i < surahNum - 1; i++) {
      num += (AYAHS_PER_SURAH[i] || 0);
    }
    return num + ayahNum;
  }

  function _buildCandidates(surahNum, ayahNum, reciterId, mode) {
    var sPadded = String(surahNum).padStart(3, '0');
    var aPadded = String(ayahNum).padStart(3, '0');
    var urls = [];

    if (mode === 'ayah') {
      var globalNum = _getGlobalAyah(surahNum, ayahNum);
      if (reciterId === 'mishary_alafasy') {
        urls.push('https://cdn.islamic.network/quran/audio/128/ar.alafasy/' + globalNum + '.mp3');
        urls.push('https://everyayah.com/data/Alafasy_128kbps/' + sPadded + aPadded + '.mp3');
        urls.push('https://everyayah.com/data/Alafasy_64kbps/' + sPadded + aPadded + '.mp3');
      } else if (reciterId === 'abdulbasit') {
        urls.push('https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/' + sPadded + aPadded + '.mp3');
        urls.push('https://cdn.islamic.network/quran/audio/64/ar.abdulbasitmurattal/' + globalNum + '.mp3');
        urls.push('https://everyayah.com/data/Abdul_Basit_Murattal_64kbps/' + sPadded + aPadded + '.mp3');
      } else if (reciterId === 'ghamdi') {
        urls.push('https://everyayah.com/data/Ghamadi_40kbps/' + sPadded + aPadded + '.mp3');
      } else if (reciterId === 'minshawi') {
        urls.push('https://cdn.islamic.network/quran/audio/128/ar.minshawi/' + globalNum + '.mp3');
        urls.push('https://everyayah.com/data/Minshawy_Murattal_128kbps/' + sPadded + aPadded + '.mp3');
      } else if (reciterId === 'maher') {
        urls.push('https://cdn.islamic.network/quran/audio/128/ar.mahermuaiqly/' + globalNum + '.mp3');
        urls.push('https://everyayah.com/data/MaherAlMuaiqly128kbps/' + sPadded + aPadded + '.mp3');
      } else if (reciterId === 'yasser_dosari') {
        urls.push('https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/' + sPadded + aPadded + '.mp3');
      } else {
        urls.push('https://cdn.islamic.network/quran/audio/128/ar.alafasy/' + globalNum + '.mp3');
        urls.push('https://everyayah.com/data/Alafasy_128kbps/' + sPadded + aPadded + '.mp3');
      }
    } else {
      var recObj = (window.RECITERS || []).find(function(r) { return r.id === reciterId; });
      var baseServer = recObj ? recObj.server : 'https://server8.mp3quran.net/afs/';
      var cdnBase = (typeof window !== 'undefined' && window.NQ_AUDIO_CDN_BASE) ? window.NQ_AUDIO_CDN_BASE : '';
      var CDN_MAP = {
        abdulbasit: 'https://cdn.mp3quran.net/audio/abdulbasit-abdulsamad/r3/',
        ghamdi: 'https://cdn.mp3quran.net/audio/saad-ghamdi/r1/',
        minshawi: 'https://cdn.mp3quran.net/audio/muhammad-minshawi/r1/',
        maher: 'https://cdn.mp3quran.net/audio/maher-muaiqly/r1/',
        mishary_alafasy: 'https://cdn.mp3quran.net/audio/mishary-alafasy/r1/',
        islam_sobhi: 'https://cdn.mp3quran.net/audio/islam-sobhi/r1/',
        yasser_dosari: 'https://cdn.mp3quran.net/audio/yasser-dosari/r1/',
        raad_kurdi: 'https://cdn.mp3quran.net/audio/raad-kurdi/r1/'
      };

      if (cdnBase) {
        urls.push(cdnBase + reciterId + '/' + sPadded + '.mp3');
      }
      if (CDN_MAP[reciterId]) {
        urls.push(CDN_MAP[reciterId] + sPadded + '.mp3');
      }

      if (reciterId === 'sherif_mostafa') {
        urls.push('https://server6.mp3quran.net/shrf/' + sPadded + '.mp3');
        urls.push('https://download.quranplayermp3.com/quran/mix/Sherif-Mostafa/' + sPadded + '.mp3');
      } else if (reciterId === 'abdurrahman_mossad') {
        urls.push('https://server16.mp3quran.net/mossad/' + sPadded + '.mp3');
        urls.push('https://download.quranplayermp3.com/quran/mix/Abdul-Rahman-Mosad/' + sPadded + '.mp3');
      } else if (reciterId === 'islam_sobhi') {
        urls.push('https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/' + sPadded + '.mp3');
        urls.push('https://download.quranplayermp3.com/quran/mix/Islam-Sobhi/' + sPadded + '.mp3');
      } else if (reciterId === 'raad_kurdi') {
        urls.push('https://server6.mp3quran.net/kurdi/' + sPadded + '.mp3');
        urls.push('https://download.quranplayermp3.com/quran/mix/Raad-Al-Kurdi/' + sPadded + '.mp3');
      }

      var QPM_MAP = {
        mishary_alafasy: 'https://download.quranplayermp3.com/quran/mix/Mishary-Rashid-Alafasy/',
        abdulbasit: 'https://download.quranplayermp3.com/quran/mix/Abdul-Basit/',
        ghamdi: 'https://download.quranplayermp3.com/quran/mix/Saad-Al-Ghamdi/',
        minshawi: 'https://download.quranplayermp3.com/quran/mix/Mohamed-Siddiq-El-Minshawi/',
        maher: 'https://download.quranplayermp3.com/quran/mix/Maher-Al-Muaiqly/',
        yasser_dosari: 'https://download.quranplayermp3.com/quran/mix/Yasser-Al-Dosari/'
      };
      if (QPM_MAP[reciterId]) {
        urls.push(QPM_MAP[reciterId] + sPadded + '.mp3');
      }

      if (baseServer) {
        var baseFullUrl = baseServer + sPadded + '.mp3';
        if (!urls.includes(baseFullUrl)) urls.push(baseFullUrl);
      }
      if (reciterId === 'sherif_mostafa' || reciterId === 'abdurrahman_mossad') {
        var audioDirPrefix = (typeof window !== 'undefined' && window.location && window.location.pathname.includes('/pages/')) ? '../audio/' : 'audio/';
        urls.push(audioDirPrefix + reciterId + '/' + sPadded + '.mp3');
      }
    }
    return urls;
  }

  function _playWithCandidates() {
    var a = _getAudio();
    if (!a || _urlIndex >= _candidateUrls.length) {
      state.isPlaying = false;
      _syncUI();
      if (typeof showToast === 'function') {
        showToast('Audio stream unavailable. Please check your network or try another reciter.', 'warning');
      }
      return;
    }

    var targetUrl = _candidateUrls[_urlIndex];
    var thisReq = _requestId;
    a.src = targetUrl;
    a.playbackRate = state.speed;
    a.volume = state.volume;

    var p = a.play();
    if (p !== undefined) {
      p.then(function() {
        if (thisReq !== _requestId) return;
        state.isPlaying = true;
        _syncUI();
        _updateMediaSession();
      }).catch(function(err) {
        if (thisReq !== _requestId) return;
        if (err.name === 'AbortError') return;
        if (err.name === 'NotAllowedError') {
          state.isPlaying = false;
          _syncUI();
          if (typeof showToast === 'function') {
            showToast('Audio autoplay blocked by browser. Tap play to listen.', 'info');
          }
          return;
        }
        _tryNextMirror();
      });
    }
  }

  function _tryNextMirror() {
    _urlIndex++;
    if (_urlIndex < _candidateUrls.length) {
      _playWithCandidates();
    } else {
      state.isPlaying = false;
      _syncUI();
      if (typeof showToast === 'function') {
        showToast('Audio stream unavailable for this verse.', 'warning');
      }
    }
  }

  function _syncUI() {
    var plbtn = document.getElementById('plbtn');
    if (plbtn) plbtn.textContent = state.isPlaying ? '⏸' : '▶';

    var playerPlayBtn = document.getElementById('playerPlayBtn');
    if (playerPlayBtn) playerPlayBtn.textContent = state.isPlaying ? '⏸' : '▶';

    var abar = document.getElementById('abar');
    if (abar) abar.classList.add('show');

    var sObj = (window.SURAHS || []).find(function(x) { return x.n === state.surahNum; });
    var rObj = (window.RECITERS || []).find(function(x) { return x.id === state.reciterId; });

    if (state.mode === 'ayah') {
      var sName = sObj ? (sObj.ar + ' — ' + sObj.en) : ('Surah ' + state.surahNum);
      if (typeof set === 'function') {
        set('asn', sName + ' : Ayah ' + state.ayahNum);
        set('arcn', rObj ? rObj.en : 'Mishary Alafasy');
        set('nowPlaying', '▶ ' + (rObj ? rObj.en : 'Reciter') + ' — ' + sName);
      }
      if (typeof highlightPlayingAyah === 'function') {
        highlightPlayingAyah(state.ayahNum);
      }
    } else {
      var surahTitle = sObj ? (sObj.n + '. ' + sObj.en + ' — ' + sObj.ar) : ('Surah ' + state.surahNum);
      if (typeof set === 'function') {
        set('asn', surahTitle);
        set('arcn', rObj ? rObj.en : '');
        set('nowPlaying', '▶ ' + (rObj ? rObj.en : '') + ' — ' + (sObj ? sObj.en : 'Surah ' + state.surahNum));
      }
    }

    document.dispatchEvent(new CustomEvent('noor-audio-statechange', { detail: state }));
  }

  function _updateMediaSession() {
    var sObj = (window.SURAHS || []).find(function(x) { return x.n === state.surahNum; });
    var rObj = (window.RECITERS || []).find(function(x) { return x.id === state.reciterId; });
    var title = sObj ? sObj.en : ('Surah ' + state.surahNum);
    var recName = rObj ? rObj.en : 'Noor Al-Quran';
    if (typeof updateMediaSession === 'function') {
      updateMediaSession(title, state.mode === 'ayah' ? state.ayahNum : null, recName);
    }
  }

  function playAyah(s, a, reciterId) {
    _requestId++;
    state.mode = 'ayah';
    state.surahNum = s;
    state.ayahNum = a;
    if (reciterId) state.reciterId = reciterId;
    _candidateUrls = _buildCandidates(s, a, state.reciterId, 'ayah');
    _urlIndex = 0;
    _playWithCandidates();
  }

  function playSurah(s, reciterId) {
    _requestId++;
    state.mode = 'surah';
    state.surahNum = s;
    state.ayahNum = 1;
    if (reciterId) state.reciterId = reciterId;
    _candidateUrls = _buildCandidates(s, 1, state.reciterId, 'surah');
    _urlIndex = 0;
    _playWithCandidates();
  }

  function togglePlay() {
    var a = _getAudio();
    if (!a) return;
    if (state.isPlaying) {
      a.pause();
      state.isPlaying = false;
      _syncUI();
    } else {
      if (!a.src) {
        if (state.mode === 'ayah') playAyah(state.surahNum, state.ayahNum, state.reciterId);
        else playSurah(state.surahNum, state.reciterId);
        return;
      }
      var p = a.play();
      if (p !== undefined) {
        p.then(function() {
          state.isPlaying = true;
          _syncUI();
        }).catch(function(err) {
          state.isPlaying = false;
          _syncUI();
          if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
            if (typeof showToast === 'function') {
              showToast('Playback could not be started.', 'warning');
            }
          }
        });
      }
    }
  }

  function pause() {
    var a = _getAudio();
    if (a) a.pause();
    state.isPlaying = false;
    _syncUI();
  }

  function stop() {
    var a = _getAudio();
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    state.isPlaying = false;
    _syncUI();
  }

  function next() {
    var sObj = (window.SURAHS || []).find(function(x) { return x.n === state.surahNum; });
    var maxV = sObj ? (sObj.v || 999) : 999;
    if (state.mode === 'ayah') {
      if (state.ayahNum < maxV) {
        playAyah(state.surahNum, state.ayahNum + 1, state.reciterId);
      } else if (state.surahNum < 114) {
        if (typeof window !== 'undefined' && typeof window.openS === 'function') {
          window.openS(state.surahNum + 1).then(function() {
            playAyah(state.surahNum + 1, 1, state.reciterId);
          }).catch(function() {
            playAyah(state.surahNum + 1, 1, state.reciterId);
          });
        } else {
          playAyah(state.surahNum + 1, 1, state.reciterId);
        }
      }
    } else {
      var surahSel = document.getElementById('surahSel');
      if (surahSel && surahSel.selectedIndex < surahSel.options.length - 1) {
        surahSel.selectedIndex++;
        playSurah(parseInt(surahSel.value, 10), state.reciterId);
      } else if (state.surahNum < 114) {
        playSurah(state.surahNum + 1, state.reciterId);
      }
    }
  }

  function prev() {
    if (state.mode === 'ayah') {
      if (state.ayahNum > 1) {
        playAyah(state.surahNum, state.ayahNum - 1, state.reciterId);
      }
    } else {
      var surahSel = document.getElementById('surahSel');
      if (surahSel && surahSel.selectedIndex > 0) {
        surahSel.selectedIndex--;
        playSurah(parseInt(surahSel.value, 10), state.reciterId);
      } else if (state.surahNum > 1) {
        playSurah(state.surahNum - 1, state.reciterId);
      }
    }
  }

  function seek(target) {
    var a = _getAudio();
    if (!a || !a.duration) return;
    if (target <= 1) {
      a.currentTime = target * a.duration;
    } else {
      a.currentTime = Math.min(target, a.duration);
    }
  }

  function setSpeed(rate) {
    state.speed = rate;
    var a = _getAudio();
    if (a) a.playbackRate = rate;
    var btn = document.getElementById('speedBtn');
    if (btn) btn.textContent = rate + 'x';
    if (typeof showToast === 'function') {
      showToast('Playback speed: ' + rate + 'x', 'info', 1500);
    }
  }

  function setLoop(mode) {
    state.loopMode = mode;
    state.loopCounter = 0;
    var btn = document.getElementById('loopBtn');
    if (btn) {
      btn.textContent = mode === 'off' ? '🔁 Off' : mode === 'inf' ? '🔁 ∞' : '🔁 ' + mode;
      btn.classList.toggle('active', mode !== 'off');
    }
    var labels = { off: 'Loop: Off', '1x': 'Loop: 1x', '3x': 'Repeat 3x', inf: 'Loop: ∞' };
    if (typeof showToast === 'function') {
      showToast(labels[mode] || mode, 'info', 1500);
    }
  }

  function setVolume(vol) {
    state.volume = Math.max(0, Math.min(1, vol));
    var a = _getAudio();
    if (a) a.volume = state.volume;
  }

  return {
    state: state,
    playAyah: playAyah,
    playSurah: playSurah,
    togglePlay: togglePlay,
    pause: pause,
    stop: stop,
    next: next,
    prev: prev,
    seek: seek,
    setSpeed: setSpeed,
    setLoop: setLoop,
    setVolume: setVolume,
    init: function() { _getAudio(); }
  };
})();
if (typeof window !== 'undefined') {
  window.NoorAudioManager = NoorAudioManager;

  window.cycleAudioSpeed = function() {
    var idx = AUDIO_SPEEDS.indexOf(NoorAudioManager.state.speed);
    var nextSpeed = AUDIO_SPEEDS[(idx + 1) % AUDIO_SPEEDS.length];
    NoorAudioManager.setSpeed(nextSpeed);
  };

  window.cycleAudioLoop = function() {
    var modes = ['off', '1x', '3x', 'inf'];
    var idx = modes.indexOf(NoorAudioManager.state.loopMode);
    var nextLoop = modes[(idx + 1) % modes.length];
    NoorAudioManager.setLoop(nextLoop);
  };
}

var _audioSpeed = 1;
var AUDIO_SPEEDS = [0.75, 1, 1.25, 1.5];
var _audioLoopMode = 'off';

function updateMediaSession(surahTitle, ayahNum, reciterName) {
  if ('mediaSession' in navigator && window.MediaMetadata) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: (surahTitle || 'The Holy Quran') + (ayahNum ? ' — Ayah ' + ayahNum : ''),
        artist: reciterName || 'Noor Al-Quran',
        album: 'The Holy Quran · القرآن الكريم',
        artwork: [
          { src: '/assets/images/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/assets/images/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });
      navigator.mediaSession.setActionHandler('play', function() { if (typeof window.togPlay === 'function') window.togPlay(); else NoorAudioManager.togglePlay(); });
      navigator.mediaSession.setActionHandler('pause', function() { if (typeof window.togPlay === 'function') window.togPlay(); else NoorAudioManager.togglePlay(); });
      navigator.mediaSession.setActionHandler('previoustrack', function() { if (typeof window.prevA === 'function') window.prevA(); else NoorAudioManager.prev(); });
      navigator.mediaSession.setActionHandler('nexttrack', function() { if (typeof window.nextA === 'function') window.nextA(); else NoorAudioManager.next(); });
      navigator.mediaSession.setActionHandler('seekto', function(details) {
        var aud = document.getElementById('aud');
        if (aud && details.seekTime) aud.currentTime = details.seekTime;
      });
    } catch (e) {
      console.warn('Saving local bookmarks failed:', e);
    }
  }
}
if (typeof window !== 'undefined') window.updateMediaSession = updateMediaSession;

function highlightPlayingAyah(ayahNum) {
  document.querySelectorAll('.ac.playing').forEach(function(el) { el.classList.remove('playing'); });
  var target = document.getElementById('ay' + ayahNum) || document.getElementById('ayah-' + ayahNum);
  if (target) {
    target.classList.add('playing');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
if (typeof window !== 'undefined') window.highlightPlayingAyah = highlightPlayingAyah;

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
    }).catch(function () {
      if (grid) {
        grid.innerHTML = getErrorStateHTML({
          title: 'Failed to load Surahs',
          description: 'Could not fetch surah list. Please check your network connection.',
          actionName: 'load-surahs'
        });
      }
    });
}

function openSurah(n, ar, en) {
  var r = document.getElementById('reader'); if (!r) return;
  set('rn', `SURAH ${n}`); set('rar', ar); set('ren', en);
  var rbis = document.getElementById('rbis');
  if (rbis) rbis.classList.toggle('hidden', n === 1 || n === 9);
  var listEl = document.getElementById('alist');
  if (listEl) listEl.innerHTML = getAyahSkeletons(6);
  r.classList.add('open');
  applyReadingSettings();

  var bismillahRegex = /^بِسْمِ\s*[ٱا]للَّ?[-ـ\u0640]*[ٰ\u0670]?هِ\s*[ٱا]لرَّحْمَ?[-ـ\u0640]*[ٰ\u0670]?نِ\s*[ٱا]لرَّحِيمِ\s*/u;
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
        var at = document.createElement('div'); at.className = 'at';
        var anum = document.createElement('span'); anum.className = 'anum'; anum.textContent = String(a.numberInSurah);
        var aact = document.createElement('div'); aact.className = 'aact';

        var bPlay = document.createElement('button'); bPlay.type = 'button'; bPlay.className = 'abtn';
        bPlay.title = 'Play'; bPlay.setAttribute('aria-label', 'Play ayah'); bPlay.textContent = '🔊';
        bPlay.addEventListener('click', function () { playAyahQuran(n, a.numberInSurah); });

        var bBm = document.createElement('button'); bBm.type = 'button'; bBm.className = 'abtn';
        bBm.title = 'Bookmark'; bBm.setAttribute('aria-label', 'Bookmark ayah'); bBm.textContent = '📌';
        bBm.addEventListener('click', function () { addBM(n, a.numberInSurah); });

        var bSh = document.createElement('button'); bSh.type = 'button'; bSh.className = 'abtn';
        bSh.title = 'Share'; bSh.setAttribute('aria-label', 'Share ayah'); bSh.textContent = '📤';
        bSh.addEventListener('click', function () { window.shareAyah(n, a.numberInSurah); });

        aact.append(bPlay, bBm, bSh);
        at.append(anum, aact);

        var dAr = document.createElement('div'); dAr.className = 'aarb'; dAr.textContent = arText;
        var dEn = document.createElement('div'); dEn.className = 'aen'; dEn.textContent = trText;
        var dTrn = document.createElement('div'); dTrn.className = 'atrn'; dTrn.textContent = trText;

        c.append(at, dAr, dEn, dTrn);
        listEl.appendChild(c);
      });
      applyReadingSettings();
    }).catch(function () {
      if (listEl) {
        listEl.innerHTML = getErrorStateHTML({
          title: 'Surah Unavailable',
          description: 'Could not load verses for this surah. Please check your connection.',
          actionName: 'open-surah',
          surahNum: n
        });
      }
    });
}
function closeR() { var r = document.getElementById('reader'); if (r) r.classList.remove('open'); }

// Play ayah on Quran page (uses selected reciter or mishary_alafasy)
function playAyahQuran(surahNum, ayahNum) {
  var reciter = localStorage.getItem('nq_quran_reciter') || 'mishary_alafasy';
  NoorAudioManager.playAyah(surahNum, ayahNum, reciter);
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
  var localBMs;
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
    } catch (e) {
      console.warn('Saving local bookmarks failed:', e);
    }
  }

  // Если пользователь авторизован на бэкенде — синхронизируем
  if (typeof NoorAuth !== 'undefined' && NoorAuth.isAuthenticated() && typeof window !== 'undefined' && typeof window.authFetch === 'function') {
    window.authFetch(`${API_BASE}/bookmarks/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surah_number: s, ayah_number: a }),
    }).then(function (r) {
      if (r.status === 201) showToast('Bookmark saved! 🔖', 'success');
      else if (r.status === 400) showToast('Already bookmarked ✓', 'info');
    }).catch(function () {
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
if (typeof window !== 'undefined') window.showToast = showToast;

// ── RECITERS PAGE ──
function loadReciters() {
  var rg = document.getElementById('rg'); if (!rg) return;
  rg.innerHTML = '';
  RECITERS.forEach(function (r) {
    var link = document.createElement('a');
    link.href = r.page;
    link.className = 'rc card';
    link.style.textDecoration = 'none';

    var img = document.createElement('img');
    img.className = 'rav-img';
    img.src = r.photo || '/assets/images/icon-192.png';
    img.alt = r.en;
    img.width = 80;
    img.height = 80;
    img.loading = 'lazy';

    var ar = document.createElement('div'); ar.className = 'rna'; ar.textContent = r.ar;
    var en = document.createElement('div'); en.className = 'rne'; en.textContent = r.en;
    var badge = document.createElement('div'); badge.className = 'rb'; badge.textContent = r.style;
    var country = document.createElement('p'); country.className = 'rc-country'; country.textContent = r.country;
    var cta = document.createElement('div'); cta.className = 'rc-cta'; cta.textContent = 'View Full Page →';

    link.append(img, ar, en, badge, country, cta);
    rg.appendChild(link);
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
      var displaySurahs = getReciterAvailableSurahs(recSel.value);
      displaySurahs.forEach(function (s) {
        surahSel.add(new Option(s.n + '. ' + s.en + ' — ' + s.ar, String(s.n)));
      });
    }

    recSel.addEventListener('change', updateSurahSel);
    updateSurahSel();
  }
}

var _qpPlaying = false;
function quickPlay() {
  var recSel = document.getElementById('reciterSel');
  var surahSel = document.getElementById('surahSel');
  if (!recSel || !recSel.value || !surahSel || !surahSel.value) return;
  var sn = parseInt(surahSel.value, 10);
  NoorAudioManager.playSurah(sn, recSel.value);
}

// togPlay — used by reciters.html and general audio bars
function togPlay() {
  NoorAudioManager.togglePlay();
}

// togPlayRec — alias for reciters.html
function togPlayRec() {
  NoorAudioManager.togglePlay();
}

function stopSurah() {
  NoorAudioManager.stop();
  closeAudio();
}

function closeAudio() {
  var abar = document.getElementById('abar'); if (abar) abar.classList.remove('show');
  NoorAudioManager.pause();
}

// updP — progress update for reciters.html seek bar
function updP() {
  var aud = document.getElementById('aud'); if (!aud) return;
  var p = aud.duration ? aud.currentTime / aud.duration * 100 : 0;
  var sl = document.getElementById('seekSlider'); if (sl) sl.value = p;
}
function seekAudio() {
  var sl = document.getElementById('seekSlider');
  if (sl) NoorAudioManager.seek(parseFloat(sl.value) / 100);
}
function onEnd() {
  NoorAudioManager.next();
}

// ── PRAYER PAGE ──
function loadPrayerBig(userInitiated) {
  var settings = getPrayerSettings();
  var cacheKey = 'prayer_cache_' + settings.method + '_' + settings.school;
  var err = function() {
    var lastCoords = null;
    try {
      var raw = localStorage.getItem('last_coords');
      if (raw) lastCoords = JSON.parse(raw);
    } catch(e) {
      console.warn('Error reading last_coords:', e);
    }
    var la = lastCoords ? lastCoords.lat : 21.3891;
    var lo = lastCoords ? lastCoords.lng : 39.8579;
    var t = calculateOfflinePrayerTimes(la, lo, new Date(), { method: settings.method, hanafi: settings.hanafi });
    set('bft', t.Fajr); set('bst', t.Sunrise); set('bdt', t.Dhuhr);
    set('bat', t.Asr); set('bmt', t.Maghrib); set('bit', t.Isha);
    set('ft', t.Fajr); set('srt', t.Sunrise); set('dt', t.Dhuhr);
    set('at', t.Asr); set('mt', t.Maghrib); set('it', t.Isha);
    updatePrayerCards(t);
    hlPrayer(t); schedulePrayer(t);
    const msg = document.getElementById('pm-nxt');
    if (msg) msg.textContent = "Offline Mode: Prayer times calculated via astronomical math.";
    const loc = document.getElementById('locLabel');
    if (loc) loc.textContent = "📍 Calculated offline for last known position";
  };
  var fetchPrayer = function (la, lo) {
    try { localStorage.setItem('last_coords', JSON.stringify({lat: la, lng: lo})); } catch(e) {
      console.warn('Error saving last_coords:', e);
    }
    fetch(`${API_BASE}/prayer-times/?lat=${la}&lng=${lo}&method=${settings.method}&school=${settings.school}`)
      .then(function (r) { return r.json(); }).then(function (d) {
        if (!d || !d.data || !d.data.timings) throw new Error('Invalid prayer data response');
        var t = d.data.timings;
        try { localStorage.setItem(cacheKey, JSON.stringify({ts: Date.now(), data: t})); } catch(e) {
          console.warn('Error saving prayer cache:', e);
        }
        set('bft', t.Fajr); set('bst', t.Sunrise); set('bdt', t.Dhuhr);
        set('bat', t.Asr); set('bmt', t.Maghrib); set('bit', t.Isha);
        set('ft', t.Fajr); set('srt', t.Sunrise); set('dt', t.Dhuhr);
        set('at', t.Asr); set('mt', t.Maghrib); set('it', t.Isha);
        updatePrayerCards(t, d.data.date);
        hlPrayer(t); schedulePrayer(t);
        const city = (d.data.meta && d.data.meta.timezone) || '';
        const loc = document.getElementById('locLabel');
        if (loc) loc.textContent = `📍 Location found · ${city}`;
      }).catch(err);
  };
  var fb = async function() {
    const loc = document.getElementById('locLabel');
    if (loc) loc.textContent = "Using IP Location Fallback...";
    try {
      let r = await fetch('https://ipapi.co/json/');
      let d = await r.json();
      if (d && d.latitude && d.longitude) return fetchPrayer(d.latitude, d.longitude);
    } catch(e) {
      console.warn('ipapi fallback failed:', e);
    }
    try {
      let r2 = await fetch('https://get.geojs.io/v1/ip/geo.json');
      let d2 = await r2.json();
      if (d2 && d2.latitude && d2.longitude) return fetchPrayer(d2.latitude, d2.longitude);
    } catch(e) {
      console.warn('geojs fallback failed:', e);
    }
    err();
  };
  if (!userInitiated || typeof navigator === 'undefined' || !navigator.geolocation) {
    try {
      var lastRaw = localStorage.getItem('last_coords');
      if (lastRaw) {
        var lc = JSON.parse(lastRaw);
        if (lc && typeof lc.lat === 'number' && typeof lc.lng === 'number') {
          return fetchPrayer(lc.lat, lc.lng);
        }
      }
    } catch (e) { /* ignore */ }
    return err();
  }
  navigator.geolocation.getCurrentPosition(
    function (pos) { fetchPrayer(pos.coords.latitude, pos.coords.longitude); },
    fb,
    { timeout: 7000 }
  );
}
if (typeof window !== 'undefined') window.loadPrayerBig = loadPrayerBig;

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

function loadNames() {
  var ng = document.getElementById('ng'); if (!ng) return;
  if (Array.isArray(window.NAMES_OF_ALLAH_DATA) && window.NAMES_OF_ALLAH_DATA.length) {
    renderNames(window.NAMES_OF_ALLAH_DATA);
  } else {
    ng.innerHTML = getNamesSkeletons(16);
  }

  fetch(API_BASE + '/names/')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (d && d.names && d.names.length) renderNames(d.names);
    })
    .catch(function (err) {
      console.warn('Background names update skipped:', err);
    });
}

function renderNames(names) {
  var ng = document.getElementById('ng'); if (!ng) return;
  ng.innerHTML = '';
  var isRu = (typeof window !== 'undefined' && window.LANG === 'ru') || (localStorage.getItem('lang') === 'ru');
  var frag = document.createDocumentFragment();
  names.forEach(function (n) {
    var div = document.createElement('div'); div.className = 'nc card';
    var meaning = (isRu && n.meaning_ru) ? n.meaning_ru : (n.meaning_en || '');
    var nNum = document.createElement('div'); nNum.className = 'nn2'; nNum.textContent = String(n.num);
    var nAr = document.createElement('div'); nAr.className = 'na'; nAr.textContent = n.arabic || '';
    var nTr = document.createElement('div'); nTr.className = 'nt'; nTr.textContent = n.transliteration || '';
    var nMn = document.createElement('div'); nMn.className = 'nm'; nMn.textContent = meaning;
    div.append(nNum, nAr, nTr, nMn);
    frag.appendChild(div);
  });
  ng.appendChild(frag);
}

if (typeof window !== 'undefined') {
  window.toggleMobileAccount = function() {
    var sheet = document.getElementById('mobAccountSheet');
    var overlay = document.getElementById('sheetOverlay');
    if (sheet) sheet.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
  };
}

function checkAuthVisibility() {
  if (typeof NoorAuth !== 'undefined' && typeof NoorAuth.syncUIState === 'function') {
    NoorAuth.syncUIState();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateOfflinePrayerTimes,
    calculateQiblaBearing,
    calculateQiblaDistanceKm,
    toHijri,
    SURAHS,
    RECITERS,
    getReciterAvailableSurahs,
    parseJwt,
    isTokenValid,
  };
}
