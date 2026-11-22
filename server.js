import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.join(__dirname, 'frontend');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const SECRET_KEY = process.env.SECRET_KEY || crypto.randomBytes(32).toString('hex');

const ALQURAN_BASE = 'https://api.alquran.cloud/v1';
const ALADHAN_BASE = 'https://api.aladhan.com/v1';
const UPSTREAM_TIMEOUT_MS = 5000;

const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89,
  59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30,
  52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15,
  21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

const VALID_PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const VALID_RECITERS = [
  'mishary',
  'abdulbasit',
  'ghamdi',
  'minshawi',
  'maher',
  'islam_sobhi',
  'yasser_dosari',
  'sherif_mostafa',
  'abdurrahman_mossad',
  'raad_kurdi'
];

const NAMES_OF_ALLAH = [
  { num: 1, arabic: 'الرَّحْمَن', transliteration: 'Ar-Rahman', meaning_en: 'The Most Gracious', meaning_ru: 'Милостивый' },
  { num: 2, arabic: 'الرَّحِيم', transliteration: 'Ar-Rahim', meaning_en: 'The Most Merciful', meaning_ru: 'Милосердный' },
  { num: 3, arabic: 'الْمَلِك', transliteration: 'Al-Malik', meaning_en: 'The King', meaning_ru: 'Царь' },
  { num: 4, arabic: 'الْقُدُّوس', transliteration: 'Al-Quddus', meaning_en: 'The Most Holy', meaning_ru: 'Пресвятой' },
  { num: 5, arabic: 'السَّلَام', transliteration: 'As-Salam', meaning_en: 'The Source of Peace', meaning_ru: 'Мир' },
  { num: 6, arabic: 'الْمُؤْمِن', transliteration: "Al-Mu'min", meaning_en: 'The Guardian of Faith', meaning_ru: 'Дарующий безопасность' },
  { num: 7, arabic: 'الْمُهَيْمِن', transliteration: 'Al-Muhaymin', meaning_en: 'The Protector', meaning_ru: 'Хранитель' },
  { num: 8, arabic: 'الْعَزِيز', transliteration: 'Al-Aziz', meaning_en: 'The Mighty', meaning_ru: 'Могущественный' },
  { num: 9, arabic: 'الْجَبَّار', transliteration: 'Al-Jabbar', meaning_en: 'The Compeller', meaning_ru: 'Принуждающий' },
  { num: 10, arabic: 'الْمُتَكَبِّر', transliteration: 'Al-Mutakabbir', meaning_en: 'The Majestic', meaning_ru: 'Величественный' },
  { num: 11, arabic: 'الْخَالِق', transliteration: 'Al-Khaliq', meaning_en: 'The Creator', meaning_ru: 'Творец' },
  { num: 12, arabic: 'الْبَارِئ', transliteration: "Al-Bari'", meaning_en: 'The Evolver', meaning_ru: 'Создатель' },
  { num: 13, arabic: 'الْمُصَوِّر', transliteration: 'Al-Musawwir', meaning_en: 'The Fashioner', meaning_ru: 'Придающий форму' },
  { num: 14, arabic: 'الْغَفَّار', transliteration: 'Al-Ghaffar', meaning_en: 'The Forgiver', meaning_ru: 'Всепрощающий' },
  { num: 15, arabic: 'الْقَهَّار', transliteration: 'Al-Qahhar', meaning_en: 'The Subduer', meaning_ru: 'Всепобеждающий' },
  { num: 16, arabic: 'الْوَهَّاب', transliteration: 'Al-Wahhab', meaning_en: 'The Bestower', meaning_ru: 'Дарующий' },
  { num: 17, arabic: 'الرَّزَّاق', transliteration: 'Ar-Razzaq', meaning_en: 'The Provider', meaning_ru: 'Кормилец' },
  { num: 18, arabic: 'الْفَتَّاح', transliteration: 'Al-Fattah', meaning_en: 'The Opener', meaning_ru: 'Открывающий' },
  { num: 19, arabic: 'الْعَلِيم', transliteration: 'Al-Alim', meaning_en: 'The All-Knowing', meaning_ru: 'Всезнающий' },
  { num: 20, arabic: 'الْقَابِض', transliteration: 'Al-Qabid', meaning_en: 'The Constrictor', meaning_ru: 'Сжимающий' },
  { num: 21, arabic: 'الْبَاسِط', transliteration: 'Al-Basit', meaning_en: 'The Expander', meaning_ru: 'Расширяющий' },
  { num: 22, arabic: 'الْخَافِض', transliteration: 'Al-Khafid', meaning_en: 'The Abaser', meaning_ru: 'Принижающий' },
  { num: 23, arabic: 'الرَّافِع', transliteration: "Ar-Rafi'", meaning_en: 'The Exalter', meaning_ru: 'Возвышающий' },
  { num: 24, arabic: 'الْمُعِزّ', transliteration: "Al-Mu'izz", meaning_en: 'The Bestower of Honour', meaning_ru: 'Возвеличивающий' },
  { num: 25, arabic: 'الْمُذِلّ', transliteration: 'Al-Mudhill', meaning_en: 'The Dishonourer', meaning_ru: 'Ослабляющий' },
  { num: 26, arabic: 'السَّمِيع', transliteration: "As-Sami'", meaning_en: 'The All-Hearing', meaning_ru: 'Всеслышащий' },
  { num: 27, arabic: 'الْبَصِير', transliteration: 'Al-Basir', meaning_en: 'The All-Seeing', meaning_ru: 'Всевидящий' },
  { num: 28, arabic: 'الْحَكَم', transliteration: 'Al-Hakam', meaning_en: 'The Judge', meaning_ru: 'Судья' },
  { num: 29, arabic: 'الْعَدْل', transliteration: 'Al-Adl', meaning_en: 'The Utterly Just', meaning_ru: 'Справедливый' },
  { num: 30, arabic: 'اللَّطِيف', transliteration: 'Al-Latif', meaning_en: 'The Subtle One', meaning_ru: 'Проницательный' },
  { num: 31, arabic: 'الْخَبِير', transliteration: 'Al-Khabir', meaning_en: 'The All-Aware', meaning_ru: 'Сведущий' },
  { num: 32, arabic: 'الْحَلِيم', transliteration: 'Al-Halim', meaning_en: 'The Most Forbearing', meaning_ru: 'Кроткий' },
  { num: 33, arabic: 'الْعَظِيم', transliteration: 'Al-Azim', meaning_en: 'The Magnificent', meaning_ru: 'Великий' },
  { num: 34, arabic: 'الْغَفُور', transliteration: 'Al-Ghafur', meaning_en: 'The Great Forgiver', meaning_ru: 'Многопрощающий' },
  { num: 35, arabic: 'الشَّكُور', transliteration: 'Ash-Shakur', meaning_en: 'The Most Appreciative', meaning_ru: 'Благодарный' },
  { num: 36, arabic: 'الْعَلِيّ', transliteration: 'Al-Ali', meaning_en: 'The Sublime One', meaning_ru: 'Высочайший' },
  { num: 37, arabic: 'الْكَبِير', transliteration: 'Al-Kabir', meaning_en: 'The Greatest', meaning_ru: 'Большой' },
  { num: 38, arabic: 'الْحَفِيظ', transliteration: 'Al-Hafiz', meaning_en: 'The Preserver', meaning_ru: 'Оберегающий' },
  { num: 39, arabic: 'الْمُقِيت', transliteration: 'Al-Muqit', meaning_en: 'The Sustainer', meaning_ru: 'Поддерживающий' },
  { num: 40, arabic: 'الْحَسِيب', transliteration: 'Al-Hasib', meaning_en: 'The Reckoner', meaning_ru: 'Считающий' },
  { num: 41, arabic: 'الْجَلِيل', transliteration: 'Al-Jalil', meaning_en: 'The Majestic', meaning_ru: 'Величественный' },
  { num: 42, arabic: 'الْكَرِيم', transliteration: 'Al-Karim', meaning_en: 'The Most Generous', meaning_ru: 'Щедрый' },
  { num: 43, arabic: 'الرَّقِيب', transliteration: 'Ar-Raqib', meaning_en: 'The Watchful', meaning_ru: 'Надзирающий' },
  { num: 44, arabic: 'الْمُجِيب', transliteration: 'Al-Mujib', meaning_en: 'The Responsive One', meaning_ru: 'Отвечающий' },
  { num: 45, arabic: 'الْوَاسِع', transliteration: "Al-Wasi'", meaning_en: 'The All-Encompassing', meaning_ru: 'Всеобъемлющий' },
  { num: 46, arabic: 'الْحَكِيم', transliteration: 'Al-Hakim', meaning_en: 'The All-Wise', meaning_ru: 'Мудрый' },
  { num: 47, arabic: 'الْوَدُود', transliteration: 'Al-Wadud', meaning_en: 'The Most Loving', meaning_ru: 'Любящий' },
  { num: 48, arabic: 'الْمَجِيد', transliteration: 'Al-Majid', meaning_en: 'The Glorious', meaning_ru: 'Славный' },
  { num: 49, arabic: 'الْبَاعِث', transliteration: "Al-Ba'ith", meaning_en: 'The Resurrector', meaning_ru: 'Воскрешающий' },
  { num: 50, arabic: 'الشَّهِيد', transliteration: 'Ash-Shahid', meaning_en: 'The Witness', meaning_ru: 'Свидетель' },
  { num: 51, arabic: 'الْحَقّ', transliteration: 'Al-Haqq', meaning_en: 'The Absolute Truth', meaning_ru: 'Истина' },
  { num: 52, arabic: 'الْوَكِيل', transliteration: 'Al-Wakil', meaning_en: 'The Trustee', meaning_ru: 'Попечитель' },
  { num: 53, arabic: 'الْقَوِيّ', transliteration: 'Al-Qawi', meaning_en: 'The All-Strong', meaning_ru: 'Сильный' },
  { num: 54, arabic: 'الْمَتِين', transliteration: 'Al-Matin', meaning_en: 'The Firm', meaning_ru: 'Непоколебимый' },
  { num: 55, arabic: 'الْوَلِيّ', transliteration: 'Al-Wali', meaning_en: 'The Protecting Associate', meaning_ru: 'Покровитель' },
  { num: 56, arabic: 'الْحَمِيد', transliteration: 'Al-Hamid', meaning_en: 'The Praiseworthy', meaning_ru: 'Достохвальный' },
  { num: 57, arabic: 'الْمُحْصِي', transliteration: 'Al-Muhsi', meaning_en: 'The All-Enumerating', meaning_ru: 'Учитывающий' },
  { num: 58, arabic: 'الْمُبْدِئ', transliteration: "Al-Mubdi'", meaning_en: 'The Originator', meaning_ru: 'Основатель' },
  { num: 59, arabic: 'الْمُعِيد', transliteration: "Al-Mu'id", meaning_en: 'The Restorer', meaning_ru: 'Возвращающий' },
  { num: 60, arabic: 'الْمُحْيِي', transliteration: 'Al-Muhyi', meaning_en: 'The Giver of Life', meaning_ru: 'Оживляющий' },
  { num: 61, arabic: 'الْمُمِيت', transliteration: 'Al-Mumit', meaning_en: 'The Bringer of Death', meaning_ru: 'Умерщвляющий' },
  { num: 62, arabic: 'الْحَيّ', transliteration: 'Al-Hayy', meaning_en: 'The Ever-Living', meaning_ru: 'Живой' },
  { num: 63, arabic: 'الْقَيُّوم', transliteration: 'Al-Qayyum', meaning_en: 'The Sustainer of Life', meaning_ru: 'Самосущий' },
  { num: 64, arabic: 'الْوَاجِد', transliteration: 'Al-Wajid', meaning_en: 'The Perceiver', meaning_ru: 'Находящий' },
  { num: 65, arabic: 'الْمَاجِد', transliteration: 'Al-Majid', meaning_en: 'The Illustrious', meaning_ru: 'Благородный' },
  { num: 66, arabic: 'الْوَاحِد', transliteration: 'Al-Wahid', meaning_en: 'The One', meaning_ru: 'Единый' },
  { num: 67, arabic: 'الْأَحَد', transliteration: 'Al-Ahad', meaning_en: 'The Unique', meaning_ru: 'Единственный' },
  { num: 68, arabic: 'الصَّمَد', transliteration: 'As-Samad', meaning_en: 'The Eternal Refuge', meaning_ru: 'Самодостаточный' },
  { num: 69, arabic: 'الْقَادِر', transliteration: 'Al-Qadir', meaning_en: 'The Capable', meaning_ru: 'Всемогущий' },
  { num: 70, arabic: 'الْمُقْتَدِر', transliteration: 'Al-Muqtadir', meaning_en: 'The Omnipotent', meaning_ru: 'Всесильный' },
  { num: 71, arabic: 'الْمُقَدِّم', transliteration: 'Al-Muqaddim', meaning_en: 'The Expediter', meaning_ru: 'Выдвигающий вперед' },
  { num: 72, arabic: 'الْمُؤَخِّر', transliteration: "Al-Mu'akhkhir", meaning_en: 'The Delayer', meaning_ru: 'Отодвигающий' },
  { num: 73, arabic: 'الْأَوَّل', transliteration: 'Al-Awwal', meaning_en: 'The First', meaning_ru: 'Первый' },
  { num: 74, arabic: 'الْآخِر', transliteration: 'Al-Akhir', meaning_en: 'The Last', meaning_ru: 'Последний' },
  { num: 75, arabic: 'الظَّاهِر', transliteration: 'Az-Zahir', meaning_en: 'The Manifest', meaning_ru: 'Явный' },
  { num: 76, arabic: 'الْبَاطِن', transliteration: 'Al-Batin', meaning_en: 'The Hidden One', meaning_ru: 'Скрытый' },
  { num: 77, arabic: 'الْوَالِي', transliteration: 'Al-Wali', meaning_en: 'The Governor', meaning_ru: 'Правящий' },
  { num: 78, arabic: 'الْمُتَعَالِي', transliteration: "Al-Muta'ali", meaning_en: 'The Supremely Exalted', meaning_ru: 'Высочайший' },
  { num: 79, arabic: 'الْبَرّ', transliteration: 'Al-Barr', meaning_en: 'The Source of Goodness', meaning_ru: 'Благочестивый' },
  { num: 80, arabic: 'التَّوَّاب', transliteration: 'At-Tawwab', meaning_en: 'The Ever-Pardoning', meaning_ru: 'Принимающий покаяние' },
  { num: 81, arabic: 'الْمُنْتَقِم', transliteration: 'Al-Muntaqim', meaning_en: 'The Avenger', meaning_ru: 'Воздающий' },
  { num: 82, arabic: 'الْعَفُوّ', transliteration: 'Al-Afuww', meaning_en: 'The Pardoner', meaning_ru: 'Снисходительный' },
  { num: 83, arabic: 'الرَّؤُوف', transliteration: "Ar-Ra'uf", meaning_en: 'The Most Kind', meaning_ru: 'Сострадательный' },
  { num: 84, arabic: 'مَالِكُ الْمُلْك', transliteration: 'Malik-ul-Mulk', meaning_en: 'Master of Dominion', meaning_ru: 'Владыка царства' },
  { num: 85, arabic: 'ذُو الْجَلَالِ وَالْإِكْرَام', transliteration: 'Dhul-Jalali wal-Ikram', meaning_en: 'Lord of Glory and Honour', meaning_ru: 'Обладатель величия и щедрости' },
  { num: 86, arabic: 'الْمُقْسِط', transliteration: 'Al-Muqsit', meaning_en: 'The Just One', meaning_ru: 'Справедливый' },
  { num: 87, arabic: 'الْجَامِع', transliteration: "Al-Jami'", meaning_en: 'The Gatherer', meaning_ru: 'Собирающий' },
  { num: 88, arabic: 'الْغَنِيّ', transliteration: 'Al-Ghani', meaning_en: 'The Self-Sufficient', meaning_ru: 'Богатый' },
  { num: 89, arabic: 'الْمُغْنِي', transliteration: 'Al-Mughni', meaning_en: 'The Enricher', meaning_ru: 'Обогащающий' },
  { num: 90, arabic: 'الْمَانِع', transliteration: "Al-Mani'", meaning_en: 'The Preventer', meaning_ru: 'Удерживающий' },
  { num: 91, arabic: 'الضَّارّ', transliteration: 'Ad-Darr', meaning_en: 'The Distresser', meaning_ru: 'Лишающий' },
  { num: 92, arabic: 'النَّافِع', transliteration: "An-Nafi'", meaning_en: 'The Benefactor', meaning_ru: 'Приносящий пользу' },
  { num: 93, arabic: 'النُّور', transliteration: 'An-Nur', meaning_en: 'The Light', meaning_ru: 'Свет' },
  { num: 94, arabic: 'الْهَادِي', transliteration: 'Al-Hadi', meaning_en: 'The Guide', meaning_ru: 'Ведущий верным путем' },
  { num: 95, arabic: 'الْبَدِيع', transliteration: "Al-Badi'", meaning_en: 'The Incomparable Originator', meaning_ru: 'Несравненный' },
  { num: 96, arabic: 'الْبَاقِي', transliteration: 'Al-Baqi', meaning_en: 'The Everlasting', meaning_ru: 'Вечный' },
  { num: 97, arabic: 'الْوَارِث', transliteration: 'Al-Warith', meaning_en: 'The Inheritor', meaning_ru: 'Наследник' },
  { num: 98, arabic: 'الرَّشِيد', transliteration: 'Ar-Rashid', meaning_en: 'The Infallible Teacher', meaning_ru: 'Правильный' },
  { num: 99, arabic: 'الصَّبُور', transliteration: 'As-Sabur', meaning_en: 'The Most Patient', meaning_ru: 'Терпеливый' }
];

// ── In-Memory Stores (ephemeral container runtime) ────────────────────────────
const users = new Map(); // username -> { id, username, email, salt, passwordHash, date_joined }
const emailIndex = new Map(); // email -> username
const bookmarksByUser = new Map(); // username -> Array<Bookmark>
const notificationsByUser = new Map(); // username -> Array<PrayerNotification>
const blacklistedTokens = new Set(); // jti or raw token string
const apiCache = new Map(); // cacheKey -> { expiresAt, data }
const authRateMap = new Map(); // ip -> { count, resetAt }

let nextUserId = 1;
let nextBookmarkId = 1;
let nextNotificationId = 1;

// ── Password & JWT Helpers ────────────────────────────────────────────────────
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const hash = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHash, 'hex');
  if (hash.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(hash, expectedBuf);
}

function base64UrlEncode(input) {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function signJwt(payload, ttlSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + ttlSeconds,
      jti: crypto.randomUUID()
    })
  );
  const sig = base64UrlEncode(
    crypto.createHmac('sha256', SECRET_KEY).update(`${header}.${body}`).digest()
  );
  return `${header}.${body}.${sig}`;
}

function verifyJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expectedSig = base64UrlEncode(
    crypto.createHmac('sha256', SECRET_KEY).update(`${header}.${body}`).digest()
  );
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(base64UrlDecode(body));
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp <= now) return null;
    if (blacklistedTokens.has(token) || (payload.jti && blacklistedTokens.has(payload.jti))) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function issueTokenPair(user) {
  const access = signJwt(
    { token_type: 'access', user_id: user.id, username: user.username },
    15 * 60
  );
  const refresh = signJwt(
    { token_type: 'refresh', user_id: user.id, username: user.username },
    7 * 24 * 60 * 60
  );
  return { access, refresh };
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ detail: 'Authentication credentials were not provided.' });
  }
  const payload = verifyJwt(match[1]);
  if (!payload || payload.token_type !== 'access') {
    return res.status(401).json({ detail: 'Given token not valid for any token type' });
  }
  const user = users.get(payload.username);
  if (!user) {
    return res.status(401).json({ detail: 'User not found' });
  }
  req.user = user;
  next();
}

function authRateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'local';
  const now = Date.now();
  const entry = authRateMap.get(ip);
  if (!entry || entry.resetAt <= now) {
    authRateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  entry.count += 1;
  if (entry.count > 20) {
    return res.status(429).json({ detail: 'Request was throttled. Please try again later.' });
  }
  next();
}

async function fetchExternalJson(url, cacheKey, ttlMs) {
  const now = Date.now();
  if (cacheKey) {
    const cached = apiCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstream = await fetch(url, { signal: controller.signal });
    if (!upstream.ok) {
      const err = new Error(`Upstream HTTP ${upstream.status}`);
      err.status = 503;
      throw err;
    }
    const data = await upstream.json();
    if (cacheKey) {
      apiCache.set(cacheKey, { expiresAt: now + ttlMs, data });
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('External API timed out. Please try again.');
      timeoutErr.status = 504;
      throw timeoutErr;
    }
    if (!err.status) err.status = 502;
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function paginate(items, req) {
  const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
  const pageSize = 20;
  const start = (page - 1) * pageSize;
  const results = items.slice(start, start + pageSize);
  return {
    count: items.length,
    next: start + pageSize < items.length ? `?page=${page + 1}` : null,
    previous: page > 1 ? `?page=${page - 1}` : null,
    results
  };
}

// ── Express App Setup ─────────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '1mb' }));

// Security headers (iframe-compatible for AI Studio preview)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── Legacy Reciter 301 Redirects ──────────────────────────────────────────────
const RECITER_REDIRECTS = {
  '/pages/reciter-alafasy.html': '/pages/reciter.html?id=mishary_alafasy',
  '/pages/reciter-abdulbasit.html': '/pages/reciter.html?id=abdulbasit',
  '/pages/reciter-ghamdi.html': '/pages/reciter.html?id=ghamdi',
  '/pages/reciter-minshawi.html': '/pages/reciter.html?id=minshawi',
  '/pages/reciter-maher.html': '/pages/reciter.html?id=maher',
  '/pages/reciter-islam-sobhi.html': '/pages/reciter.html?id=islam_sobhi',
  '/pages/reciter-yasser.html': '/pages/reciter.html?id=yasser_dosari',
  '/pages/reciter-sherif-mostafa.html': '/pages/reciter.html?id=sherif_mostafa',
  '/pages/reciter-abdurrahman-mossad.html': '/pages/reciter.html?id=abdurrahman_mossad',
  '/pages/reciter-raad-kurdi.html': '/pages/reciter.html?id=raad_kurdi'
};

for (const [fromPath, toPath] of Object.entries(RECITER_REDIRECTS)) {
  app.get(fromPath, (req, res) => res.redirect(301, toPath));
}

// ── API Routes ────────────────────────────────────────────────────────────────
const api = express.Router();

api.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Noor Al-Quran' });
});

// Auth: Register
api.post('/auth/register', authRateLimit, (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const email = String(req.body?.email || '').trim();

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ error: 'Username must be between 3 and 30 characters.' });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return res.status(400).json({ error: 'Username may only contain letters, digits, underscores, and hyphens.' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address format.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }
  if (users.has(username)) {
    return res.status(400).json({ error: 'Username already exists.', username: ['Username already exists.'] });
  }
  if (email && emailIndex.has(email.toLowerCase())) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const { salt, hash } = hashPassword(password);
  const user = {
    id: nextUserId++,
    username,
    email,
    salt,
    passwordHash: hash,
    date_joined: new Date().toISOString()
  };
  users.set(username, user);
  if (email) emailIndex.set(email.toLowerCase(), username);
  bookmarksByUser.set(username, []);
  notificationsByUser.set(username, []);

  const tokens = issueTokenPair(user);
  res.status(201).json({
    ...tokens,
    username: user.username,
    email: user.email
  });
});

// Auth: Login
function handleLogin(req, res) {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  if (!username || !password) {
    return res.status(400).json({ detail: 'Username and password are required.' });
  }
  const user = users.get(username);
  if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
    return res.status(401).json({ detail: 'No active account found with the given credentials' });
  }
  const tokens = issueTokenPair(user);
  res.json(tokens);
}

api.post('/auth/login', authRateLimit, handleLogin);
api.post('/token/obtain', authRateLimit, handleLogin);

// Auth: Refresh
function handleRefresh(req, res) {
  const refresh = String(req.body?.refresh || '');
  const payload = verifyJwt(refresh);
  if (!payload || payload.token_type !== 'refresh') {
    return res.status(401).json({ detail: 'Token is invalid or expired' });
  }
  const user = users.get(payload.username);
  if (!user) {
    return res.status(401).json({ detail: 'User not found' });
  }
  blacklistedTokens.add(payload.jti || refresh);
  const tokens = issueTokenPair(user);
  res.json(tokens);
}

api.post('/auth/refresh', handleRefresh);
api.post('/token/refresh', handleRefresh);

// Auth: Logout
api.post('/auth/logout', (req, res) => {
  const refresh = String(req.body?.refresh || '');
  if (refresh) {
    const payload = verifyJwt(refresh);
    blacklistedTokens.add(payload?.jti || refresh);
  }
  res.json({ message: 'Logged out successfully.' });
});

// Auth: Me
api.get('/auth/me', requireAuth, (req, res) => {
  const bms = bookmarksByUser.get(req.user.username) || [];
  res.json({
    username: req.user.username,
    email: req.user.email,
    date_joined: req.user.date_joined,
    bookmarks_count: bms.length
  });
});

api.delete('/auth/me', requireAuth, (req, res) => {
  const password = String(req.body?.password || '');
  if (!password) {
    return res.status(400).json({ error: 'Password confirmation is required to delete your account.' });
  }
  if (!verifyPassword(password, req.user.salt, req.user.passwordHash)) {
    return res.status(400).json({ error: 'Incorrect password.' });
  }
  users.delete(req.user.username);
  if (req.user.email) emailIndex.delete(req.user.email.toLowerCase());
  bookmarksByUser.delete(req.user.username);
  notificationsByUser.delete(req.user.username);
  res.status(204).end();
});

// Auth: Change password
api.post('/auth/password/change', requireAuth, (req, res) => {
  const oldPassword = String(req.body?.old_password || '');
  const newPassword = String(req.body?.new_password || '');
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Both old_password and new_password are required.' });
  }
  if (!verifyPassword(oldPassword, req.user.salt, req.user.passwordHash)) {
    return res.status(400).json({ error: 'Current password does not match.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }
  const { salt, hash } = hashPassword(newPassword);
  req.user.salt = salt;
  req.user.passwordHash = hash;
  const tokens = issueTokenPair(req.user);
  res.json({
    message: 'Password changed successfully.',
    ...tokens
  });
});

// Bookmarks CRUD
api.get('/bookmarks', requireAuth, (req, res) => {
  let list = [...(bookmarksByUser.get(req.user.username) || [])];
  if (req.query.surah_number) {
    const sn = parseInt(req.query.surah_number, 10);
    list = list.filter((b) => b.surah_number === sn);
  }
  if (req.query.ayah_number) {
    const an = parseInt(req.query.ayah_number, 10);
    list = list.filter((b) => b.ayah_number === an);
  }
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(paginate(list, req));
});

api.post('/bookmarks', requireAuth, (req, res) => {
  const surahNumber = parseInt(req.body?.surah_number, 10);
  const ayahNumber = parseInt(req.body?.ayah_number, 10);
  const note = String(req.body?.note || '');

  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return res.status(400).json({ surah_number: 'Surah number must be between 1 and 114.' });
  }
  const maxAyahs = SURAH_AYAH_COUNTS[surahNumber - 1];
  if (!Number.isInteger(ayahNumber) || ayahNumber < 1 || ayahNumber > maxAyahs) {
    return res.status(400).json({
      ayah_number: `Surah ${surahNumber} only has ${maxAyahs} ayahs. Received ${ayahNumber}.`
    });
  }

  const list = bookmarksByUser.get(req.user.username) || [];
  if (list.some((b) => b.surah_number === surahNumber && b.ayah_number === ayahNumber)) {
    return res.status(400).json({ non_field_errors: ['You have already bookmarked this ayah.'] });
  }

  const now = new Date().toISOString();
  const bm = {
    id: nextBookmarkId++,
    surah_number: surahNumber,
    ayah_number: ayahNumber,
    note,
    created_at: now,
    updated_at: now
  };
  list.unshift(bm);
  bookmarksByUser.set(req.user.username, list);
  res.status(201).json(bm);
});

api.delete('/bookmarks/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const list = bookmarksByUser.get(req.user.username) || [];
  const idx = list.findIndex((b) => b.id === id);
  if (idx === -1) {
    return res.status(404).json({ detail: 'Not found.' });
  }
  list.splice(idx, 1);
  res.status(204).end();
});

// Prayer Notifications CRUD
api.get('/notifications', requireAuth, (req, res) => {
  let list = [...(notificationsByUser.get(req.user.username) || [])];
  if (req.query.prayer_name) {
    list = list.filter((n) => n.prayer_name === req.query.prayer_name);
  }
  if (req.query.is_enabled !== undefined) {
    const enabled = req.query.is_enabled === 'true';
    list = list.filter((n) => n.is_enabled === enabled);
  }
  list.sort((a, b) => a.prayer_name.localeCompare(b.prayer_name));
  res.json(paginate(list, req));
});

api.post('/notifications', requireAuth, (req, res) => {
  const prayerName = String(req.body?.prayer_name || '').toLowerCase();
  const adhanReciter = String(req.body?.adhan_reciter || 'mishary');
  const isEnabled = req.body?.is_enabled !== undefined ? Boolean(req.body.is_enabled) : true;

  if (!VALID_PRAYERS.includes(prayerName)) {
    return res.status(400).json({ prayer_name: 'Invalid prayer choice.' });
  }
  if (!VALID_RECITERS.includes(adhanReciter)) {
    return res.status(400).json({
      adhan_reciter: `Invalid reciter. Valid choices: ${VALID_RECITERS.join(', ')}`
    });
  }

  const list = notificationsByUser.get(req.user.username) || [];
  const existing = list.find((n) => n.prayer_name === prayerName);
  const now = new Date().toISOString();
  if (existing) {
    existing.adhan_reciter = adhanReciter;
    existing.is_enabled = isEnabled;
    existing.updated_at = now;
    return res.json(existing);
  }

  const item = {
    id: nextNotificationId++,
    prayer_name: prayerName,
    adhan_reciter: adhanReciter,
    is_enabled: isEnabled,
    created_at: now,
    updated_at: now
  };
  list.push(item);
  notificationsByUser.set(req.user.username, list);
  res.status(201).json(item);
});

api.delete('/notifications/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const list = notificationsByUser.get(req.user.username) || [];
  const idx = list.findIndex((n) => n.id === id);
  if (idx === -1) {
    return res.status(404).json({ detail: 'Not found.' });
  }
  list.splice(idx, 1);
  res.status(204).end();
});

// Quran Proxy Routes
api.get('/surahs', async (req, res) => {
  try {
    const data = await fetchExternalJson(`${ALQURAN_BASE}/surah`, 'surahs', 24 * 60 * 60 * 1000);
    res.json(data);
  } catch (err) {
    res.status(err.status || 502).json({ detail: err.message });
  }
});

api.get('/surahs/:surah_number', async (req, res) => {
  const surahNumber = parseInt(req.params.surah_number, 10);
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return res.status(400).json({ error: 'Surah number must be between 1 and 114.' });
  }
  const lang = String(req.query.lang || 'en').trim().toLowerCase();
  const editionMap = { en: 'en.asad', ru: 'ru.kuliev', uz: 'uz.sodik' };
  const edition = editionMap[lang] || 'en.asad';
  const url = `${ALQURAN_BASE}/surah/${surahNumber}/editions/quran-uthmani,${edition}`;
  try {
    const data = await fetchExternalJson(url, `surah_${surahNumber}_${edition}`, 24 * 60 * 60 * 1000);
    res.json(data);
  } catch (err) {
    res.status(err.status || 502).json({ detail: err.message });
  }
});

// Prayer Times & Hijri Date Proxies
api.get('/prayer-times', async (req, res) => {
  const latRaw = req.query.lat ?? '21.3891';
  const lngRaw = req.query.lng ?? '39.8579';
  const methodRaw = req.query.method ?? '3';
  const schoolRaw = req.query.school ?? '0';
  const dateParam = String(req.query.date || '').trim();

  const lat = Math.round(Number(latRaw) * 100) / 100;
  const lng = Math.round(Number(lngRaw) * 100) / 100;
  const method = Number(methodRaw);
  const school = Number(schoolRaw);

  if (Number.isNaN(lat) || Number.isNaN(lng) || !Number.isInteger(method) || !Number.isInteger(school)) {
    return res.status(400).json({ error: 'Invalid parameters. lat, lng, method, and school must be numeric.' });
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ error: 'Latitude must be between -90 and 90, Longitude between -180 and 180.' });
  }
  if (method < 0 || method > 24) {
    return res.status(400).json({ error: 'Invalid calculation method choice.' });
  }
  if (school !== 0 && school !== 1) {
    return res.status(400).json({ error: 'Invalid school choice. 0 for Standard (Shafi/Maliki/Hanbali), 1 for Hanafi.' });
  }
  if (dateParam && !/^\d{2}-\d{2}-\d{4}$/.test(dateParam)) {
    return res.status(400).json({ error: 'Invalid date format. Expected DD-MM-YYYY.' });
  }

  const url = dateParam
    ? `${ALADHAN_BASE}/timings/${dateParam}?latitude=${lat}&longitude=${lng}&method=${method}&school=${school}`
    : `${ALADHAN_BASE}/timings?latitude=${lat}&longitude=${lng}&method=${method}&school=${school}`;

  try {
    const cacheKey = `prayer_${lat}_${lng}_${method}_${school}_${dateParam || 'today'}`;
    const data = await fetchExternalJson(url, cacheKey, 30 * 60 * 1000);
    res.json(data);
  } catch (err) {
    res.status(err.status || 502).json({ detail: err.message });
  }
});

api.get('/hijri-date', async (req, res) => {
  const dateParam = String(req.query.date || '').trim();
  if (dateParam && !/^\d{2}-\d{2}-\d{4}$/.test(dateParam)) {
    return res.status(400).json({ error: 'Invalid date format. Expected DD-MM-YYYY.' });
  }
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const targetDate = dateParam || `${dd}-${mm}-${yyyy}`;
  const url = `${ALADHAN_BASE}/gToH?date=${targetDate}`;
  try {
    const data = await fetchExternalJson(url, `hijri_${targetDate}`, 12 * 60 * 60 * 1000);
    res.json(data);
  } catch (err) {
    res.status(err.status || 502).json({ detail: err.message });
  }
});

// 99 Names of Allah
api.get('/names', (req, res) => {
  res.json({ names: NAMES_OF_ALLAH, count: NAMES_OF_ALLAH.length });
});

app.use('/api', api);

// ── Static Frontend Serving ───────────────────────────────────────────────────
app.use(
  express.static(FRONTEND_DIR, {
    extensions: ['html'],
    index: 'index.html'
  })
);

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ detail: 'Not found.' });
  }
  const notFoundPath = path.join(FRONTEND_DIR, '404.html');
  if (fs.existsSync(notFoundPath)) {
    return res.status(404).sendFile(notFoundPath);
  }
  res.status(404).send('Not Found');
});

app.listen(PORT, HOST, () => {
  console.log(`Noor Al-Quran server listening on http://${HOST}:${PORT}`);
});
