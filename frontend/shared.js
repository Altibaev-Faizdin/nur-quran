/* ═══════════════════════════════════════════════
   shared.js — Noor Al-Quran Global Logic & Data
   ═══════════════════════════════════════════════ */

'use strict';

// ── API BASE ──
const API_BASE = 'http://127.0.0.1:8000/api';

// ── RECITERS DATA ──
// Alafasy removed; Sherif Mostafa and Sheikh Saud Al-Juma'a added.
const RECITERS = [
  {
    id: 'abdulbasit',
    server: 'https://server7.mp3quran.net/basit/',
    photo: 'https://tvquran.com/uploads/photo/15.jpg',
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
    photo: 'https://tvquran.com/uploads/photo/45.jpg',
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
    photo: 'https://tvquran.com/uploads/photo/68.jpg',
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
    photo: 'https://tvquran.com/uploads/photo/76.jpg',
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
    photo: 'https://tvquran.com/uploads/photo/36.jpg',
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
    photo: 'https://tvquran.com/uploads/photo/253.jpg',
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
    photo: 'https://tvquran.com/uploads/photo/92.jpg',
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
    server: 'https://archive.org/download/Sherif-Mostafa/',
    photo: 'https://tvquran.com/uploads/photo/166.jpg',
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
    server: 'https://archive.org/download/abdulrahman-mosad/',
    photo: 'https://tvquran.com/uploads/photo/230.jpg',
    ar: 'عبدالرحمن مسعد',
    en: 'Abdurrahman Mossad',
    style: 'Murattal',
    country: 'Egypt',
    init: 'ع',
    bio: 'Sheikh Abdurrahman Mossad is a young Egyptian Quran reciter whose heartfelt and powerful voice has gained him millions of followers, known for his deeply emotional recitations that touch the soul.',
    page: 'reciter-abdurrahman-mossad.html',
  },
];

// ── SURAH DATA (114 surahs) ──
var SURAHS = [
  {n:1,ar:'الفاتحة',en:'Al-Fatihah'},{n:2,ar:'البقرة',en:'Al-Baqarah'},{n:3,ar:'آل عمران',en:"Ali 'Imran"},
  {n:4,ar:'النساء',en:"An-Nisa'"},{n:5,ar:'المائدة',en:"Al-Ma'idah"},{n:6,ar:'الأنعام',en:"Al-An'am"},
  {n:7,ar:'الأعراف',en:"Al-A'raf"},{n:8,ar:'الأنفال',en:'Al-Anfal'},{n:9,ar:'التوبة',en:'At-Tawbah'},
  {n:10,ar:'يونس',en:'Yunus'},{n:11,ar:'هود',en:'Hud'},{n:12,ar:'يوسف',en:'Yusuf'},
  {n:13,ar:'الرعد',en:"Ar-Ra'd"},{n:14,ar:'إبراهيم',en:'Ibrahim'},{n:15,ar:'الحجر',en:'Al-Hijr'},
  {n:16,ar:'النحل',en:'An-Nahl'},{n:17,ar:'الإسراء',en:"Al-Isra'"},{n:18,ar:'الكهف',en:'Al-Kahf'},
  {n:19,ar:'مريم',en:'Maryam'},{n:20,ar:'طه',en:'Ta-Ha'},{n:21,ar:'الأنبياء',en:"Al-Anbiya'"},
  {n:22,ar:'الحج',en:'Al-Hajj'},{n:23,ar:'المؤمنون',en:"Al-Mu'minun"},{n:24,ar:'النور',en:'An-Nur'},
  {n:25,ar:'الفرقان',en:'Al-Furqan'},{n:26,ar:'الشعراء',en:"Ash-Shu'ara'"},{n:27,ar:'النمل',en:'An-Naml'},
  {n:28,ar:'القصص',en:'Al-Qasas'},{n:29,ar:'العنكبوت',en:'Al-Ankabut'},{n:30,ar:'الروم',en:'Ar-Rum'},
  {n:31,ar:'لقمان',en:'Luqman'},{n:32,ar:'السجدة',en:'As-Sajdah'},{n:33,ar:'الأحزاب',en:'Al-Ahzab'},
  {n:34,ar:'سبأ',en:"Saba'"},{n:35,ar:'فاطر',en:'Fatir'},{n:36,ar:'يس',en:'Ya-Sin'},
  {n:37,ar:'الصافات',en:'As-Saffat'},{n:38,ar:'ص',en:'Sad'},{n:39,ar:'الزمر',en:'Az-Zumar'},
  {n:40,ar:'غافر',en:'Ghafir'},{n:41,ar:'فصلت',en:'Fussilat'},{n:42,ar:'الشورى',en:'Ash-Shura'},
  {n:43,ar:'الزخرف',en:'Az-Zukhruf'},{n:44,ar:'الدخان',en:'Ad-Dukhan'},{n:45,ar:'الجاثية',en:'Al-Jathiyah'},
  {n:46,ar:'الأحقاف',en:'Al-Ahqaf'},{n:47,ar:'محمد',en:'Muhammad'},{n:48,ar:'الفتح',en:'Al-Fath'},
  {n:49,ar:'الحجرات',en:'Al-Hujurat'},{n:50,ar:'ق',en:'Qaf'},{n:51,ar:'الذاريات',en:'Adh-Dhariyat'},
  {n:52,ar:'الطور',en:'At-Tur'},{n:53,ar:'النجم',en:'An-Najm'},{n:54,ar:'القمر',en:'Al-Qamar'},
  {n:55,ar:'الرحمن',en:'Ar-Rahman'},{n:56,ar:'الواقعة',en:"Al-Waqi'ah"},{n:57,ar:'الحديد',en:'Al-Hadid'},
  {n:58,ar:'المجادلة',en:'Al-Mujadila'},{n:59,ar:'الحشر',en:'Al-Hashr'},{n:60,ar:'الممتحنة',en:'Al-Mumtahanah'},
  {n:61,ar:'الصف',en:'As-Saf'},{n:62,ar:'الجمعة',en:"Al-Jumu'ah"},{n:63,ar:'المنافقون',en:'Al-Munafiqun'},
  {n:64,ar:'التغابن',en:'At-Taghabun'},{n:65,ar:'الطلاق',en:'At-Talaq'},{n:66,ar:'التحريم',en:'At-Tahrim'},
  {n:67,ar:'الملك',en:'Al-Mulk'},{n:68,ar:'القلم',en:'Al-Qalam'},{n:69,ar:'الحاقة',en:'Al-Haqqah'},
  {n:70,ar:'المعارج',en:"Al-Ma'arij"},{n:71,ar:'نوح',en:'Nuh'},{n:72,ar:'الجن',en:'Al-Jinn'},
  {n:73,ar:'المزمل',en:'Al-Muzzammil'},{n:74,ar:'المدثر',en:'Al-Muddaththir'},{n:75,ar:'القيامة',en:'Al-Qiyamah'},
  {n:76,ar:'الإنسان',en:'Al-Insan'},{n:77,ar:'المرسلات',en:'Al-Mursalat'},{n:78,ar:'النبأ',en:"An-Naba'"},
  {n:79,ar:'النازعات',en:"An-Nazi'at"},{n:80,ar:'عبس',en:'Abasa'},{n:81,ar:'التكوير',en:'At-Takwir'},
  {n:82,ar:'الانفطار',en:'Al-Infitar'},{n:83,ar:'المطففين',en:'Al-Mutaffifin'},{n:84,ar:'الانشقاق',en:'Al-Inshiqaq'},
  {n:85,ar:'البروج',en:'Al-Buruj'},{n:86,ar:'الطارق',en:'At-Tariq'},{n:87,ar:'الأعلى',en:"Al-A'la"},
  {n:88,ar:'الغاشية',en:'Al-Ghashiyah'},{n:89,ar:'الفجر',en:'Al-Fajr'},{n:90,ar:'البلد',en:'Al-Balad'},
  {n:91,ar:'الشمس',en:'Ash-Shams'},{n:92,ar:'الليل',en:'Al-Layl'},{n:93,ar:'الضحى',en:'Ad-Duha'},
  {n:94,ar:'الشرح',en:'Ash-Sharh'},{n:95,ar:'التين',en:'At-Tin'},{n:96,ar:'العلق',en:"Al-'Alaq"},
  {n:97,ar:'القدر',en:'Al-Qadr'},{n:98,ar:'البينة',en:'Al-Bayyinah'},{n:99,ar:'الزلزلة',en:'Az-Zalzalah'},
  {n:100,ar:'العاديات',en:"Al-'Adiyat"},{n:101,ar:'القارعة',en:"Al-Qari'ah"},{n:102,ar:'التكاثر',en:'At-Takathur'},
  {n:103,ar:'العصر',en:"Al-'Asr"},{n:104,ar:'الهمزة',en:'Al-Humazah'},{n:105,ar:'الفيل',en:'Al-Fil'},
  {n:106,ar:'قريش',en:'Quraysh'},{n:107,ar:'الماعون',en:"Al-Ma'un"},{n:108,ar:'الكوثر',en:'Al-Kawthar'},
  {n:109,ar:'الكافرون',en:'Al-Kafirun'},{n:110,ar:'النصر',en:'An-Nasr'},{n:111,ar:'المسد',en:'Al-Masad'},
  {n:112,ar:'الإخلاص',en:'Al-Ikhlas'},{n:113,ar:'الفلق',en:'Al-Falaq'},{n:114,ar:'الناس',en:'An-Nas'},
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
  const d = document.getElementById('cur'), t = document.getElementById('cur-t');
  if (!d || !t) return;
  let mx = 0, my = 0, tx = 0, ty = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    d.style.left = mx - 5 + 'px'; d.style.top = my - 5 + 'px';
  });
  setInterval(() => {
    tx += (mx - tx) * 0.12; ty += (my - ty) * 0.12;
    t.style.left = tx - 14 + 'px'; t.style.top = ty - 14 + 'px';
  }, 16);
})();

// ── HIJRI DATE ──
function toHijri(date) {
  const jd = Math.floor(date.getTime() / 86400000) + 2440587.5;
  let l = Math.floor(jd) - 1948440 + 10632, n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  return { day: l - Math.floor((709 * Math.floor((24 * l) / 709)) / 24), month: Math.floor((24 * l) / 709) - 1, year: 30 * n + j - 30 };
}
const HM  = ['Muharram','Safar','Rabi I','Rabi II','Jumada I','Jumada II','Rajab',"Sha'ban",'Ramadan','Shawwal',"Dhul Qa'dah",'Dhul Hijjah'];
const HMA = ['مُحَرَّم','صَفَر','رَبِيع الأَوَّل','رَبِيع الآخِر','جُمَادَى الأُولَى','جُمَادَى الآخِرَة','رَجَب','شَعْبَان','رَمَضَان','شَوَّال','ذُو القَعْدَة','ذُو الحِجَّة'];

// ── CLOCK ──
(function () {
  const D = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function upd() {
    const n = new Date();
    const h = String(n.getHours()).padStart(2,'0'), m = String(n.getMinutes()).padStart(2,'0'), s = String(n.getSeconds()).padStart(2,'0');
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

// ── PRAYER TIMES ──
function loadPrayer() {
  var fetchPrayer = function(la, lo) {
    fetch(`https://api.aladhan.com/v1/timings?latitude=${la}&longitude=${lo}&method=2`)
      .then(r => r.json()).then(d => {
        const t = d.data.timings;
        set('ft', t.Fajr); set('srt', t.Sunrise); set('dt', t.Dhuhr);
        set('at', t.Asr); set('mt', t.Maghrib); set('it', t.Isha);
        hlPrayer(t); schedulePrayer(t);
      }).catch(() => {});
  };
  var fb = function() {
    fetch('https://ipapi.co/json/').then(r => r.json()).then(d => fetchPrayer(d.latitude, d.longitude)).catch(() => {});
  };
  if (!navigator.geolocation) return fb();
  navigator.geolocation.getCurrentPosition(function(pos) { fetchPrayer(pos.coords.latitude, pos.coords.longitude); }, fb);
}

function hlPrayer(t) {
  const cur = new Date().getHours() * 60 + new Date().getMinutes();
  const tm = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const ps = [{ id: 'fi', m: tm(t.Fajr) }, { id: 'si', m: tm(t.Sunrise) }, { id: 'di', m: tm(t.Dhuhr) }, { id: 'ai', m: tm(t.Asr) }, { id: 'mi', m: tm(t.Maghrib) }, { id: 'ii', m: tm(t.Isha) }];
  ps.forEach(p => { const e = document.getElementById(p.id); if (e) e.classList.remove('on'); });
  for (let i = ps.length - 1; i >= 0; i--) { if (cur >= ps[i].m) { const e = document.getElementById(ps[i].id); if (e) { e.classList.add('on'); break; } } }
}

function schedulePrayer(t) {
  ['Fajr','Dhuhr','Asr','Maghrib','Isha'].forEach(nm => {
    const [h, m] = t[nm].split(':').map(Number);
    const now = new Date(), tgt = new Date(); tgt.setHours(h, m, 0, 0);
    const diff = tgt - now;
    if (diff > 0 && diff < 86400000) setTimeout(() => showAdhan(nm, t[nm]), diff);
  });
}

function showAdhan(nm, time) {
  const b = document.getElementById('adhan'); if (!b) return;
  set('adn', `Time for ${nm} Prayer`); set('ads', `${time} — ${nm} prayer time`);
  b.classList.add('show');
}
function closeAdhan() { const b = document.getElementById('adhan'); if (b) b.classList.remove('show'); }

// ── QIBLA ──
function getQibla() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(function(pos) {
    const la = pos.coords.latitude * Math.PI / 180, lo = pos.coords.longitude * Math.PI / 180;
    const mla = 21.3891 * Math.PI / 180, mlo = 39.8579 * Math.PI / 180, dl = mlo - lo;
    const xx = Math.sin(dl) * Math.cos(mla), yy = Math.cos(la) * Math.sin(mla) - Math.sin(la) * Math.cos(mla) * Math.cos(dl);
    const b = (Math.atan2(xx, yy) * 180 / Math.PI + 360) % 360;
    const qa = document.getElementById('qa'); if (qa) qa.style.transform = `translateX(-50%) translateY(-100%) rotate(${b}deg)`;
    set('qt', `Qibla: ${Math.round(b)}° from North`);
  });
}
if (window.DeviceOrientationEvent) {
  window.addEventListener('deviceorientation', function(e) {
    const cn = document.getElementById('cn'); if (cn) cn.style.transform = `translateX(-50%) translateY(-100%) rotate(${e.alpha || 0}deg)`;
  });
}

// ── TASBIH (renamed to avoid conflict with tasbih.html) ──
const TASBIH_DHIKRS = [{ ar: 'سُبْحَانَ اللَّهِ', max: 33 }, { ar: 'الْحَمْدُ لِلَّهِ', max: 33 }, { ar: 'اللَّهُ أَكْبَرُ', max: 34 }];
var TC = 0, TI = 0;
function tasbihTap() { var mx = TASBIH_DHIKRS[TI].max; if (TC < mx) { TC++; updT(); } }
function tasbihReset() { TC = 0; updT(); }
function setDhikr(i) { TI = i; TC = 0; updT(); document.querySelectorAll('.db').forEach(function(b, j) { b.classList.toggle('on', j === i); }); }
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
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('vis'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fi').forEach(function(el) { obs.observe(el); });
})();

// ── LANGUAGE ──
var LANG = 'en';
function setLang(l, btn) {
  LANG = l;
  document.querySelectorAll('.lb').forEach(function(b) { b.classList.remove('on'); });
  if (btn) btn.classList.add('on');
  document.dispatchEvent(new CustomEvent('langChange', { detail: l }));
}

// ── AUTH ──
function openAuth() { var a = document.getElementById('authModal'); if (a) a.classList.add('show'); }
function closeAuth() { var a = document.getElementById('authModal'); if (a) a.classList.remove('show'); }
function mockGoogleSignIn() {
  var user = { name: 'User', avatar: 'https://ui-avatars.com/api/?name=User&background=d4a017&color=fff' };
  localStorage.setItem('noor_user', JSON.stringify(user));
  closeAuth(); updateNavAuth();
}
function signOut() { localStorage.removeItem('noor_user'); updateNavAuth(); }
function updateNavAuth() {
  var userStr = localStorage.getItem('noor_user');
  var authLink = document.querySelector('nav .nav-links li:last-child');
  if (!authLink) return;
  if (userStr) {
    var user = JSON.parse(userStr);
    authLink.innerHTML = `<div class="dropdown" style="display:flex;align-items:center;gap:8px;cursor:pointer" onclick="this.classList.toggle('active')">
      <img src="${user.avatar}" alt="User" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--gold)">
      <span style="color:var(--goldL);font-weight:700">${user.name}</span>
      <div class="dropdown-content" style="right:0;left:auto;min-width:120px">
        <a href="javascript:void(0)" onclick="signOut()" style="color:#e05050">Sign Out</a>
      </div></div>`;
  } else {
    authLink.innerHTML = `<a href="javascript:void(0)" onclick="openAuth()" style="color:var(--goldL);font-weight:700">Sign In</a>`;
  }
}

// ── GLOBAL INIT ──
document.addEventListener('DOMContentLoaded', function() {
  // Dropdown handler
  document.addEventListener('click', function(e) {
    var dropLink = e.target.closest('.dropdown > a');
    if (dropLink) {
      e.preventDefault(); e.stopPropagation();
      var parent = dropLink.parentElement;
      var wasActive = parent.classList.contains('active');
      document.querySelectorAll('.dropdown.active').forEach(function(d) { d.classList.remove('active'); });
      if (!wasActive) parent.classList.add('active');
    } else if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown.active').forEach(function(d) { d.classList.remove('active'); });
    }
    if (e.target.closest('.scl-btn')) {
      var text = e.target.closest('.scl-btn').textContent.toLowerCase();
      if (text.includes('google')) mockGoogleSignIn();
    }
  });
  updateNavAuth();

  // Page-specific init
  if (document.getElementById('grid'))   loadSurahs();
  if (document.getElementById('rg'))     loadReciters();
  if (document.getElementById('pbgrid')) loadPrayerBig();
  if (document.getElementById('ng'))     loadNames();
});

// ── QURAN PAGE ──
function loadSurahs() {
  fetch('https://api.alquran.cloud/v1/surah')
    .then(function(r) { return r.json(); }).then(function(d) {
      var grid = document.getElementById('grid'); if (!grid) return;
      grid.innerHTML = '';
      d.data.forEach(function(s) {
        var div = document.createElement('div'); div.className = 'si card';
        div.innerHTML = `<div class="snum">${s.number}</div><div class="sinf"><div class="sar">${s.name}</div><div class="sen">${s.englishName}</div><div class="sv">${s.numberOfAyahs} verses</div></div><div class="bm mec" onclick="addBM(${s.number},1);event.stopPropagation()">📌</div>`;
        div.onclick = function() { openSurah(s.number, s.name, s.englishName); };
        grid.appendChild(div);
      });
    }).catch(function(e) { console.warn('Surah list error:', e); });
}

function openSurah(n, ar, en) {
  var r = document.getElementById('reader'); if (!r) return;
  set('rn', `SURAH ${n}`); set('rar', ar); set('ren', en);
  var listEl = document.getElementById('alist'); if (listEl) listEl.innerHTML = '<div class="rload">Loading...</div>';
  r.classList.add('open');
  fetch(`https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,en.asad`)
    .then(function(r) { return r.json(); }).then(function(d) {
      if (!listEl) return;
      listEl.innerHTML = '';
      d.data[0].ayahs.forEach(function(a) {
        var c = document.createElement('div'); c.className = 'ac card';
        c.id = `ayah-${n}-${a.numberInSurah}`;
        c.innerHTML = `<div class="at"><span class="anum">${a.numberInSurah}</span><div class="aact"><button class="abtn" onclick="playAyahQuran(${n},${a.numberInSurah})" title="Play">🔊</button><button class="abtn" onclick="addBM(${n},${a.numberInSurah})" title="Bookmark">📌</button></div></div><div class="aarb">${a.text}</div><div class="aen">${d.data[1]?.ayahs[a.numberInSurah - 1]?.text || ''}</div>`;
        listEl.appendChild(c);
      });
    }).catch(function() { if (listEl) listEl.innerHTML = '<div class="rload">Failed to load. Please try again.</div>'; });
}
function closeR() { var r = document.getElementById('reader'); if (r) r.classList.remove('open'); }

// Play ayah on Quran page (uses abdulbasit as default)
function playAyahQuran(surahNum, ayahNum) {
  // Calculate global ayah number for islamic.network CDN
  var AYAHS_PER_SURAH = [
    7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
    112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,
    59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,
    52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,
    21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6
  ];
  var globalNum = 0;
  for (var i = 0; i < surahNum - 1; i++) globalNum += AYAHS_PER_SURAH[i];
  globalNum += ayahNum;

  var url = `https://cdn.islamic.network/quran/audio/128/ar.abdulbasitmurattal/${globalNum}.mp3`;
  var aud = document.getElementById('aud'); if (!aud) return;
  aud.src = url;
  aud.play().catch(function() {
    // Fallback to full surah MP3
    aud.src = `https://server7.mp3quran.net/basit/${String(surahNum).padStart(3,'0')}.mp3`;
    aud.play().catch(function(e) { console.warn('Audio play blocked:', e); });
  });
  set('asn', `Surah ${surahNum} : ${ayahNum}`);
  var abar = document.getElementById('abar'); if (abar) abar.classList.add('show');
}

// Legacy alias for older HTML onclick attributes
function playAyah(s, a) { playAyahQuran(s, a); }
function playA(s, a)    { playAyahQuran(s, a); }

function filterS(q) {
  document.querySelectorAll('.si').forEach(function(i) {
    i.style.display = i.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}

function addBM(s, a) {
  fetch(`${API_BASE}/bookmarks/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ surah_number: s, ayah_number: a }),
  }).then(function(r) {
    if (r.ok) { showToast('Bookmark saved! 📌'); }
    else { r.json().then(function(e) { console.warn('Bookmark error:', e); }); }
  }).catch(function() { showToast('Bookmark saved locally! 📌'); });
}

function showToast(msg) {
  var t = document.getElementById('noor-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'noor-toast';
    t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(212,160,23,.95);color:#000;padding:10px 22px;border-radius:30px;font-size:.82rem;font-weight:700;z-index:9999;opacity:0;transition:opacity .3s;pointer-events:none;backdrop-filter:blur(10px)';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity = '1';
  setTimeout(function() { t.style.opacity = '0'; }, 2500);
}

// ── RECITERS PAGE ──
function loadReciters() {
  var rg = document.getElementById('rg'); if (!rg) return;
  rg.innerHTML = '';
  RECITERS.forEach(function(r) {
    var div = document.createElement('div'); div.className = 'rc card'; div.style.cursor = 'pointer';
    div.innerHTML = `
      <div class="rav" style="background:url('${r.photo}');background-size:cover;background-position:center">${r.init}</div>
      <div class="rna">${r.ar}</div>
      <div class="rne">${r.en}</div>
      <div class="rb">${r.style}</div>
      <p style="font-size:.7rem;color:var(--soft);margin:8px 0">${r.country}</p>
      <div style="margin-top:12px;font-size:.75rem;color:var(--gold);text-transform:uppercase;letter-spacing:1px">View Full Page →</div>`;
    div.onclick = function() { window.location.href = r.page; };
    rg.appendChild(div);
  });

  // Quick-play selects
  var recSel = document.getElementById('reciterSel');
  if (recSel) {
    recSel.innerHTML = '';
    RECITERS.forEach(function(r) { recSel.innerHTML += `<option value="${r.id}">${r.en}</option>`; });
  }
  var surahSel = document.getElementById('surahSel');
  if (surahSel) {
    surahSel.innerHTML = '';
    SURAHS.forEach(function(s) { surahSel.innerHTML += `<option value="${s.n}">${s.n}. ${s.en} — ${s.ar}</option>`; });
  }
}

var _qpPlaying = false;
function quickPlay() {
  var recSel = document.getElementById('reciterSel');
  var surahSel = document.getElementById('surahSel');
  if (!recSel || !recSel.value || !surahSel || !surahSel.value) return;
  var r = RECITERS.find(function(x) { return x.id === recSel.value; }); if (!r) return;
  var sn = parseInt(surahSel.value, 10);
  var s = SURAHS.find(function(x) { return x.n === sn; });
  var url = r.server + String(sn).padStart(3, '0') + '.mp3';
  var aud = document.getElementById('aud'); if (!aud) return;
  aud.src = url; aud.volume = 0.85;
  aud.play().catch(function() {});
  _qpPlaying = true;
  set('asn', `Surah ${sn} — ${s ? s.en : ''}`);
  set('arcn', r.en);
  set('nowPlaying', `▶ ${r.en} — ${s ? s.en : 'Surah ' + sn}`);
  var abar = document.getElementById('abar'); if (abar) abar.classList.add('show');
  var btn = document.getElementById('plbtn'); if (btn) btn.textContent = '⏸';
}

// togPlay — used by reciters.html audio bar toggle button
function togPlay() {
  var aud = document.getElementById('aud'); if (!aud) return;
  if (aud.paused) { aud.play().catch(function() {}); _qpPlaying = true; }
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
  var fetchPrayer = function(la, lo) {
    fetch(`https://api.aladhan.com/v1/timings?latitude=${la}&longitude=${lo}&method=2`)
      .then(function(r) { return r.json(); }).then(function(d) {
        var t = d.data.timings;
        set('bft', t.Fajr); set('bst', t.Sunrise); set('bdt', t.Dhuhr);
        set('bat', t.Asr); set('bmt', t.Maghrib); set('bit', t.Isha);
        updatePrayerCards(t, d.data.date);
        hlPrayer(t); schedulePrayer(t);
      }).catch(function() {});
  };
  var fb = function() {
    fetch('https://ipapi.co/json/').then(function(r) { return r.json(); }).then(function(d) { fetchPrayer(d.latitude, d.longitude); }).catch(function() {});
  };
  if (!navigator.geolocation) return fb();
  navigator.geolocation.getCurrentPosition(function(pos) { fetchPrayer(pos.coords.latitude, pos.coords.longitude); }, fb);
}

function updatePrayerCards(t) {
  var now = new Date();
  var timeMap = { Fajr: t.Fajr, Sunrise: t.Sunrise, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha };
  var prayers = [
    { id: 'pb-fajr', name: 'Fajr', tip: 'bfl' }, { id: 'pb-sunrise', name: 'Sunrise', tip: 'bsl' },
    { id: 'pb-dhuhr', name: 'Dhuhr', tip: 'bdl' }, { id: 'pb-asr', name: 'Asr', tip: 'bal' },
    { id: 'pb-maghrib', name: 'Maghrib', tip: 'bml' }, { id: 'pb-isha', name: 'Isha', tip: 'bil' },
  ];
  prayers.forEach(function(p) {
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

// ── NAMES PAGE — встроенные данные (не зависит от backend) ──
const NAMES_OF_ALLAH_FRONTEND = [
  {num:1,arabic:'الرَّحْمَن',transliteration:'Ar-Rahman',meaning_en:'The Most Gracious',meaning_ru:'Милостивый'},
  {num:2,arabic:'الرَّحِيم',transliteration:'Ar-Rahim',meaning_en:'The Most Merciful',meaning_ru:'Милосердный'},
  {num:3,arabic:'الْمَلِك',transliteration:'Al-Malik',meaning_en:'The King',meaning_ru:'Царь'},
  {num:4,arabic:'الْقُدُّوس',transliteration:'Al-Quddus',meaning_en:'The Most Holy',meaning_ru:'Пресвятой'},
  {num:5,arabic:'السَّلَام',transliteration:'As-Salam',meaning_en:'The Source of Peace',meaning_ru:'Мир'},
  {num:6,arabic:'الْمُؤْمِن',transliteration:"Al-Mu'min",meaning_en:'The Guardian of Faith',meaning_ru:'Дарующий безопасность'},
  {num:7,arabic:'الْمُهَيْمِن',transliteration:'Al-Muhaymin',meaning_en:'The Protector',meaning_ru:'Хранитель'},
  {num:8,arabic:'الْعَزِيز',transliteration:'Al-Aziz',meaning_en:'The Mighty',meaning_ru:'Могущественный'},
  {num:9,arabic:'الْجَبَّار',transliteration:'Al-Jabbar',meaning_en:'The Compeller',meaning_ru:'Принуждающий'},
  {num:10,arabic:'الْمُتَكَبِّر',transliteration:'Al-Mutakabbir',meaning_en:'The Majestic',meaning_ru:'Величественный'},
  {num:11,arabic:'الْخَالِق',transliteration:'Al-Khaliq',meaning_en:'The Creator',meaning_ru:'Творец'},
  {num:12,arabic:'الْبَارِئ',transliteration:"Al-Bari'",meaning_en:'The Evolver',meaning_ru:'Создатель'},
  {num:13,arabic:'الْمُصَوِّر',transliteration:'Al-Musawwir',meaning_en:'The Fashioner',meaning_ru:'Придающий форму'},
  {num:14,arabic:'الْغَفَّار',transliteration:'Al-Ghaffar',meaning_en:'The Forgiver',meaning_ru:'Всепрощающий'},
  {num:15,arabic:'الْقَهَّار',transliteration:'Al-Qahhar',meaning_en:'The Subduer',meaning_ru:'Всепобеждающий'},
  {num:16,arabic:'الْوَهَّاب',transliteration:'Al-Wahhab',meaning_en:'The Bestower',meaning_ru:'Дарующий'},
  {num:17,arabic:'الرَّزَّاق',transliteration:'Ar-Razzaq',meaning_en:'The Provider',meaning_ru:'Кормилец'},
  {num:18,arabic:'الْفَتَّاح',transliteration:'Al-Fattah',meaning_en:'The Opener',meaning_ru:'Открывающий'},
  {num:19,arabic:'الْعَلِيم',transliteration:'Al-Alim',meaning_en:'The All-Knowing',meaning_ru:'Всезнающий'},
  {num:20,arabic:'الْقَابِض',transliteration:'Al-Qabid',meaning_en:'The Constrictor',meaning_ru:'Сжимающий'},
  {num:21,arabic:'الْبَاسِط',transliteration:'Al-Basit',meaning_en:'The Expander',meaning_ru:'Расширяющий'},
  {num:22,arabic:'الْخَافِض',transliteration:'Al-Khafid',meaning_en:'The Abaser',meaning_ru:'Унижающий'},
  {num:23,arabic:'الرَّافِع',transliteration:"Ar-Rafi'",meaning_en:'The Exalter',meaning_ru:'Возвышающий'},
  {num:24,arabic:'الْمُعِز',transliteration:"Al-Mu'izz",meaning_en:'The Bestower of Honor',meaning_ru:'Чествующий'},
  {num:25,arabic:'الْمُذِل',transliteration:'Al-Mudhill',meaning_en:'The Humiliator',meaning_ru:'Унижающий'},
  {num:26,arabic:'السَّمِيع',transliteration:"As-Sami'",meaning_en:'The All-Hearing',meaning_ru:'Всеслышащий'},
  {num:27,arabic:'الْبَصِير',transliteration:'Al-Basir',meaning_en:'The All-Seeing',meaning_ru:'Всевидящий'},
  {num:28,arabic:'الْحَكَم',transliteration:'Al-Hakam',meaning_en:'The Judge',meaning_ru:'Судья'},
  {num:29,arabic:'الْعَدْل',transliteration:'Al-Adl',meaning_en:'The Just',meaning_ru:'Справедливый'},
  {num:30,arabic:'اللَّطِيف',transliteration:'Al-Latif',meaning_en:'The Subtle One',meaning_ru:'Тонкий'},
  {num:31,arabic:'الْخَبِير',transliteration:'Al-Khabir',meaning_en:'The All-Aware',meaning_ru:'Осведомлённый'},
  {num:32,arabic:'الْحَلِيم',transliteration:'Al-Halim',meaning_en:'The Forbearing',meaning_ru:'Терпеливый'},
  {num:33,arabic:'الْعَظِيم',transliteration:'Al-Azim',meaning_en:'The Magnificent',meaning_ru:'Величайший'},
  {num:34,arabic:'الْغَفُور',transliteration:'Al-Ghafur',meaning_en:'The Forgiving',meaning_ru:'Прощающий'},
  {num:35,arabic:'الشَّكُور',transliteration:'Ash-Shakur',meaning_en:'The Appreciative',meaning_ru:'Благодарный'},
  {num:36,arabic:'الْعَلِيّ',transliteration:"Al-Ali'",meaning_en:'The Most High',meaning_ru:'Высочайший'},
  {num:37,arabic:'الْكَبِير',transliteration:'Al-Kabir',meaning_en:'The Most Great',meaning_ru:'Великий'},
  {num:38,arabic:'الْحَفِيظ',transliteration:'Al-Hafiz',meaning_en:'The Preserver',meaning_ru:'Хранящий'},
  {num:39,arabic:'الْمُقِيت',transliteration:'Al-Muqit',meaning_en:'The Nourisher',meaning_ru:'Питающий'},
  {num:40,arabic:'الْحَسِيب',transliteration:'Al-Hasib',meaning_en:'The Reckoner',meaning_ru:'Считающий'},
  {num:41,arabic:'الْجَلِيل',transliteration:'Al-Jalil',meaning_en:'The Majestic',meaning_ru:'Величественный'},
  {num:42,arabic:'الْكَرِيم',transliteration:'Al-Karim',meaning_en:'The Generous',meaning_ru:'Щедрый'},
  {num:43,arabic:'الرَّقِيب',transliteration:'Ar-Raqib',meaning_en:'The Watchful',meaning_ru:'Наблюдающий'},
  {num:44,arabic:'الْمُجِيب',transliteration:'Al-Mujib',meaning_en:'The Responsive',meaning_ru:'Отвечающий'},
  {num:45,arabic:'الْوَاسِع',transliteration:"Al-Wasi'",meaning_en:'The All-Encompassing',meaning_ru:'Необъятный'},
  {num:46,arabic:'الْحَكِيم',transliteration:'Al-Hakim',meaning_en:'The Wise',meaning_ru:'Мудрый'},
  {num:47,arabic:'الْوَدُود',transliteration:'Al-Wadud',meaning_en:'The Loving',meaning_ru:'Любящий'},
  {num:48,arabic:'الْمَجِيد',transliteration:'Al-Majid',meaning_en:'The Most Glorious',meaning_ru:'Славный'},
  {num:49,arabic:'الْبَاعِث',transliteration:"Al-Ba'ith",meaning_en:'The Resurrector',meaning_ru:'Воскрешающий'},
  {num:50,arabic:'الشَّهِيد',transliteration:'Ash-Shahid',meaning_en:'The Witness',meaning_ru:'Свидетель'},
  {num:51,arabic:'الْحَقّ',transliteration:'Al-Haqq',meaning_en:'The Truth',meaning_ru:'Истина'},
  {num:52,arabic:'الْوَكِيل',transliteration:'Al-Wakil',meaning_en:'The Trustee',meaning_ru:'Попечитель'},
  {num:53,arabic:'الْقَوِيّ',transliteration:'Al-Qawi',meaning_en:'The Most Strong',meaning_ru:'Сильный'},
  {num:54,arabic:'الْمَتِين',transliteration:'Al-Matin',meaning_en:'The Firm',meaning_ru:'Твёрдый'},
  {num:55,arabic:'الْوَلِيّ',transliteration:'Al-Wali',meaning_en:'The Protecting Friend',meaning_ru:'Покровитель'},
  {num:56,arabic:'الْحَمِيد',transliteration:'Al-Hamid',meaning_en:'The Praiseworthy',meaning_ru:'Достохвальный'},
  {num:57,arabic:'الْمُحْصِي',transliteration:'Al-Muhsi',meaning_en:'The Counter',meaning_ru:'Исчисляющий'},
  {num:58,arabic:'الْمُبْدِئ',transliteration:"Al-Mubdi'",meaning_en:'The Originator',meaning_ru:'Начинающий'},
  {num:59,arabic:'الْمُعِيد',transliteration:"Al-Mu'id",meaning_en:'The Restorer',meaning_ru:'Возобновляющий'},
  {num:60,arabic:'الْمُحْيِي',transliteration:'Al-Muhyi',meaning_en:'The Giver of Life',meaning_ru:'Дающий жизнь'},
  {num:61,arabic:'الْمُمِيت',transliteration:'Al-Mumit',meaning_en:'The Taker of Life',meaning_ru:'Умерщвляющий'},
  {num:62,arabic:'الْحَيّ',transliteration:'Al-Hayy',meaning_en:'The Ever-Living',meaning_ru:'Вечно живой'},
  {num:63,arabic:'الْقَيُّوم',transliteration:'Al-Qayyum',meaning_en:'The Self-Subsisting',meaning_ru:'Самодостаточный'},
  {num:64,arabic:'الْوَاجِد',transliteration:'Al-Wajid',meaning_en:'The Finder',meaning_ru:'Находящий'},
  {num:65,arabic:'الْمَاجِد',transliteration:'Al-Majid',meaning_en:'The Noble',meaning_ru:'Благородный'},
  {num:66,arabic:'الْوَاحِد',transliteration:'Al-Wahid',meaning_en:'The One',meaning_ru:'Единый'},
  {num:67,arabic:'الأَحَد',transliteration:'Al-Ahad',meaning_en:'The Unique',meaning_ru:'Единственный'},
  {num:68,arabic:'الصَّمَد',transliteration:'As-Samad',meaning_en:'The Eternal',meaning_ru:'Вечный'},
  {num:69,arabic:'الْقَادِر',transliteration:'Al-Qadir',meaning_en:'The Capable',meaning_ru:'Могущий'},
  {num:70,arabic:'الْمُقْتَدِر',transliteration:'Al-Muqtadir',meaning_en:'The Powerful',meaning_ru:'Всесильный'},
  {num:71,arabic:'الْمُقَدِّم',transliteration:'Al-Muqaddim',meaning_en:'The Expediter',meaning_ru:'Выдвигающий вперёд'},
  {num:72,arabic:'الْمُؤَخِّر',transliteration:"Al-Mu'akhkhir",meaning_en:'The Delayer',meaning_ru:'Откладывающий'},
  {num:73,arabic:'الأَوَّل',transliteration:'Al-Awwal',meaning_en:'The First',meaning_ru:'Первый'},
  {num:74,arabic:'الآخِر',transliteration:'Al-Akhir',meaning_en:'The Last',meaning_ru:'Последний'},
  {num:75,arabic:'الظَّاهِر',transliteration:'Az-Zahir',meaning_en:'The Manifest',meaning_ru:'Явный'},
  {num:76,arabic:'الْبَاطِن',transliteration:'Al-Batin',meaning_en:'The Hidden',meaning_ru:'Скрытый'},
  {num:77,arabic:'الْوَالِي',transliteration:'Al-Wali',meaning_en:'The Governor',meaning_ru:'Правитель'},
  {num:78,arabic:'الْمُتَعَالِي',transliteration:"Al-Muta'ali",meaning_en:'The Most Exalted',meaning_ru:'Превознесённый'},
  {num:79,arabic:'الْبَرّ',transliteration:'Al-Barr',meaning_en:'The Source of Goodness',meaning_ru:'Благой'},
  {num:80,arabic:'التَّوَّاب',transliteration:'At-Tawwab',meaning_en:'The Ever-Returning',meaning_ru:'Принимающий покаяние'},
  {num:81,arabic:'الْمُنْتَقِم',transliteration:'Al-Muntaqim',meaning_en:'The Avenger',meaning_ru:'Мститель'},
  {num:82,arabic:'الْعَفُوّ',transliteration:'Al-Afuww',meaning_en:'The Pardoner',meaning_ru:'Прощающий'},
  {num:83,arabic:'الرَّؤُوف',transliteration:"Ar-Ra'uf",meaning_en:'The Compassionate',meaning_ru:'Сострадательный'},
  {num:84,arabic:'مَالِكُ الْمُلْك',transliteration:'Malik-ul-Mulk',meaning_en:'Owner of All Sovereignty',meaning_ru:'Владыка царства'},
  {num:85,arabic:'ذُو الْجَلَالِ وَالإِكْرَام',transliteration:'Dhul-Jalali-wal-Ikram',meaning_en:'Lord of Majesty and Generosity',meaning_ru:'Обладатель величия и щедрости'},
  {num:86,arabic:'الْمُقْسِط',transliteration:'Al-Muqsit',meaning_en:'The Equitable',meaning_ru:'Справедливый'},
  {num:87,arabic:'الْجَامِع',transliteration:"Al-Jami'",meaning_en:'The Gatherer',meaning_ru:'Собирающий'},
  {num:88,arabic:'الْغَنِيّ',transliteration:'Al-Ghani',meaning_en:'The Self-Sufficient',meaning_ru:'Богатый'},
  {num:89,arabic:'الْمُغْنِي',transliteration:'Al-Mughni',meaning_en:'The Enricher',meaning_ru:'Обогащающий'},
  {num:90,arabic:'الْمَانِع',transliteration:"Al-Mani'",meaning_en:'The Preventer',meaning_ru:'Удерживающий'},
  {num:91,arabic:'الضَّارّ',transliteration:'Ad-Darr',meaning_en:'The Distresser',meaning_ru:'Причиняющий вред'},
  {num:92,arabic:'النَّافِع',transliteration:"An-Nafi'",meaning_en:'The Benefiter',meaning_ru:'Приносящий пользу'},
  {num:93,arabic:'النُّور',transliteration:'An-Nur',meaning_en:'The Light',meaning_ru:'Свет'},
  {num:94,arabic:'الْهَادِي',transliteration:'Al-Hadi',meaning_en:'The Guide',meaning_ru:'Ведущий правым путём'},
  {num:95,arabic:'الْبَدِيع',transliteration:"Al-Badi'",meaning_en:'The Incomparable',meaning_ru:'Несравненный'},
  {num:96,arabic:'الْبَاقِي',transliteration:'Al-Baqi',meaning_en:'The Everlasting',meaning_ru:'Вечный'},
  {num:97,arabic:'الْوَارِث',transliteration:'Al-Warith',meaning_en:'The Inheritor',meaning_ru:'Наследующий'},
  {num:98,arabic:'الرَّشِيد',transliteration:'Ar-Rashid',meaning_en:'The Rightly Guided',meaning_ru:'Ведущий истинным путём'},
  {num:99,arabic:'الصَّبُور',transliteration:'As-Sabur',meaning_en:'The Patient',meaning_ru:'Терпеливый'},
];

function loadNames() {
  var ng = document.getElementById('ng'); if (!ng) return;
  // Render instantly from built-in data
  renderNames(NAMES_OF_ALLAH_FRONTEND);
  // Also try backend for updates
  fetch(API_BASE + '/names/')
    .then(function(r) { return r.json(); })
    .then(function(d) { if (d.names && d.names.length) renderNames(d.names); })
    .catch(function() { /* already rendered from built-in data */ });
}

function renderNames(names) {
  var ng = document.getElementById('ng'); if (!ng) return;
  ng.innerHTML = '';
  names.forEach(function(n) {
    var div = document.createElement('div'); div.className = 'nc card';
    div.innerHTML = '<div class="nn2">' + n.num + '</div><div class="na">' + n.arabic + '</div><div class="nt">' + n.transliteration + '</div><div class="nm">' + n.meaning_en + '</div>';
    ng.appendChild(div);
  });
}

// ── PRAYER BAR (background, runs on all pages) ──
loadPrayer();
