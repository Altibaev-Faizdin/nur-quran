/* ═══════════════════════════════════════════════
   shared.js — Noor Al-Quran Global Logic & Data
   ═══════════════════════════════════════════════ */

// ── API BASE ──
const API_BASE = 'http://127.0.0.1:8000/api';

// ── RECITERS DATA ──
const RECITERS = [
  {
    id: 'alafasy',
    server: 'https://server8.mp3quran.net/afs/',
    photo: 'https://tvquran.com/uploads/photo/29.jpg',
    ar: 'مشاري راشد العفاسي',
    en: 'Mishary Rashid Alafasy',
    style: 'Murattal',
    country: 'Kuwait',
    init: 'م',
    bio: 'Sheikh Mishary Rashid Alafasy is a Kuwaiti Quran reciter known worldwide for his beautiful, melodious voice. Born in 1976, he has memorized the entire Quran.',
    page: 'reciter-alafasy.html',
  },
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
    id: 'arfaj',
    server: 'https://server6.mp3quran.net/arfaj/',
    photo: 'https://tvquran.com/uploads/photo/87.jpg',
    ar: 'عبد الرزاق العرفج',
    en: 'Abd Ar-Razzaq Al-Arfaj',
    style: 'Murattal',
    country: 'Saudi Arabia',
    init: 'ع',
    bio: 'Sheikh Abd Ar-Razzaq Al-Arfaj is a distinguished Saudi Quran reciter known for his clear and melodious recitation style.',
    page: 'reciter-saud-juma.html',
  },
];

// ── SURAH DATA (114 surahs) ──
const SURAHS = [
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
  const fetchPrayer = (la, lo) => {
    fetch(`https://api.aladhan.com/v1/timings?latitude=${la}&longitude=${lo}&method=2`)
      .then(r => r.json()).then(d => {
        const t = d.data.timings;
        set('ft', t.Fajr); set('srt', t.Sunrise); set('dt', t.Dhuhr);
        set('at', t.Asr); set('mt', t.Maghrib); set('it', t.Isha);
        hlPrayer(t); schedulePrayer(t);
      }).catch(() => {});
  };
  const fb = () => fetch('https://ipapi.co/json/').then(r => r.json()).then(d => fetchPrayer(d.latitude, d.longitude)).catch(() => {});
  if (!navigator.geolocation) return fb();
  navigator.geolocation.getCurrentPosition(pos => fetchPrayer(pos.coords.latitude, pos.coords.longitude), fb);
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
  navigator.geolocation?.getCurrentPosition(pos => {
    const la = pos.coords.latitude * Math.PI / 180, lo = pos.coords.longitude * Math.PI / 180;
    const mla = 21.3891 * Math.PI / 180, mlo = 39.8579 * Math.PI / 180, dl = mlo - lo;
    const xx = Math.sin(dl) * Math.cos(mla), yy = Math.cos(la) * Math.sin(mla) - Math.sin(la) * Math.cos(mla) * Math.cos(dl);
    const b = (Math.atan2(xx, yy) * 180 / Math.PI + 360) % 360;
    const qa = document.getElementById('qa'); if (qa) qa.style.transform = `translateX(-50%) translateY(-100%) rotate(${b}deg)`;
    set('qt', `Qibla: ${Math.round(b)}° from North`);
  });
}
if (window.DeviceOrientationEvent) {
  window.addEventListener('deviceorientation', e => {
    const cn = document.getElementById('cn'); if (cn) cn.style.transform = `translateX(-50%) translateY(-100%) rotate(${e.alpha || 0}deg)`;
  });
}

// ── TASBIH ──
const DHIKRS = [{ ar: 'سُبْحَانَ اللَّهِ', max: 33 }, { ar: 'الْحَمْدُ لِلَّهِ', max: 33 }, { ar: 'اللَّهُ أَكْبَرُ', max: 34 }];
let TC = 0, TI = 0;
function tasbihTap() { const mx = DHIKRS[TI].max; if (TC < mx) { TC++; updT(); } }
function tasbihReset() { TC = 0; updT(); }
function setDhikr(i) { TI = i; TC = 0; updT(); document.querySelectorAll('.db').forEach((b, j) => b.classList.toggle('on', j === i)); }
function updT() { set('tsc', TC); set('tsl', DHIKRS[TI].ar); const b = document.getElementById('tsb'); if (b) b.style.width = (TC / DHIKRS[TI].max * 100) + '%'; }

// ── DUA ──
const DUAS = [
  { ar: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا', en: '"O Allah, by You we enter the morning and by You we enter the evening."', ru: '«О Аллах, с Тобой мы вошли в утро и с Тобой мы вошли в вечер.»' },
  { ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً', en: '"Our Lord, give us good in this world and good in the Hereafter."', ru: '«Господь наш, даруй нам добро в этом мире и добро в мире ином.»' },
  { ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ', en: '"O Allah, I ask You for well-being in this world and in the Hereafter."', ru: '«О Аллах, я прошу Тебя о благополучии.»' },
  { ar: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', en: '"My Lord, expand for me my breast and ease for me my task."', ru: '«Господь мой, расширь мне грудь и облегчи мне дело.»' },
  { ar: 'اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي', en: '"O Allah, forgive me and have mercy on me."', ru: '«О Аллах, прости меня и помилуй меня.»' },
];
let DI = 0;
function nextDua() { DI = (DI + 1) % DUAS.length; updD(); }
function updD() { const d = DUAS[DI]; set('dua', d.ar); set('dut', d.en); set('dutr', d.ru || ''); }

// ── SCROLL ANIMATION ──
(function () {
  const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); }), { threshold: 0.08 });
  document.querySelectorAll('.fi').forEach(el => obs.observe(el));
})();

// ── LANGUAGE ──
let LANG = 'en';
function setLang(l, btn) {
  LANG = l;
  document.querySelectorAll('.lb').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  document.dispatchEvent(new CustomEvent('langChange', { detail: l }));
}

// ── AUTH ──
function openAuth() { const a = document.getElementById('authModal'); if (a) a.classList.add('show'); }
function closeAuth() { const a = document.getElementById('authModal'); if (a) a.classList.remove('show'); }
function mockGoogleSignIn() {
  const user = { name: 'User', avatar: 'https://ui-avatars.com/api/?name=User&background=d4a017&color=fff' };
  localStorage.setItem('noor_user', JSON.stringify(user));
  closeAuth(); updateNavAuth();
}
function signOut() { localStorage.removeItem('noor_user'); updateNavAuth(); }
function updateNavAuth() {
  const userStr = localStorage.getItem('noor_user');
  const authLink = document.querySelector('nav .nav-links li:last-child');
  if (!authLink) return;
  if (userStr) {
    const user = JSON.parse(userStr);
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
document.addEventListener('DOMContentLoaded', () => {
  // Dropdown handler
  document.addEventListener('click', e => {
    const dropLink = e.target.closest('.dropdown > a');
    if (dropLink) {
      e.preventDefault(); e.stopPropagation();
      const parent = dropLink.parentElement;
      const wasActive = parent.classList.contains('active');
      document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
      if (!wasActive) parent.classList.add('active');
    } else if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
    }
    if (e.target.closest('.scl-btn')) {
      const text = e.target.closest('.scl-btn').textContent.toLowerCase();
      if (text.includes('google')) mockGoogleSignIn();
    }
  });
  updateNavAuth();
});

// ── QURAN PAGE ──
function loadSurahs() {
  fetch('https://api.alquran.cloud/v1/surah')
    .then(r => r.json()).then(d => {
      const grid = document.getElementById('grid'); if (!grid) return;
      grid.innerHTML = '';
      d.data.forEach(s => {
        const div = document.createElement('div'); div.className = 'si card';
        div.innerHTML = `<div class="snum">${s.number}</div><div class="sinf"><div class="sar">${s.name}</div><div class="sen">${s.englishName}</div><div class="sv">${s.numberOfAyahs} verses</div></div><div class="bm mec" onclick="addBM(${s.number},1);event.stopPropagation()">📌</div>`;
        div.onclick = () => openSurah(s.number, s.name, s.englishName);
        grid.appendChild(div);
      });
    }).catch(e => console.warn('Surah list error:', e));
}

function openSurah(n, ar, en) {
  const r = document.getElementById('reader'); if (!r) return;
  set('rn', `SURAH ${n}`); set('rar', ar); set('ren', en);
  const listEl = document.getElementById('alist'); if (listEl) listEl.innerHTML = '<div class="rload">Loading...</div>';
  r.classList.add('open');
  fetch(`https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,en.asad`)
    .then(r => r.json()).then(d => {
      if (!listEl) return;
      listEl.innerHTML = '';
      d.data[0].ayahs.forEach(a => {
        const c = document.createElement('div'); c.className = 'ac card';
        c.id = `ayah-${n}-${a.numberInSurah}`;
        c.innerHTML = `<div class="at"><span class="anum">${a.numberInSurah}</span><div class="aact"><button class="abtn" onclick="playAyah(${n},${a.numberInSurah})" title="Play">🔊</button><button class="abtn" onclick="addBM(${n},${a.numberInSurah})" title="Bookmark">📌</button></div></div><div class="aarb">${a.text}</div><div class="aen">${d.data[1]?.ayahs[a.numberInSurah - 1]?.text || ''}</div>`;
        listEl.appendChild(c);
      });
    }).catch(e => { if (listEl) listEl.innerHTML = '<div class="rload">Failed to load. Please try again.</div>'; });
}
function closeR() { const r = document.getElementById('reader'); if (r) r.classList.remove('open'); }

// Play individual ayah audio (uses Alafasy by default on Quran page)
function playAyah(s, a) {
  const url = `https://server8.mp3quran.net/afs/${String(s).padStart(3, '0')}.mp3`;
  const aud = document.getElementById('aud'); if (!aud) return;
  aud.src = url; aud.play().catch(() => {});
  set('asn', `Surah ${s}:${a}`);
  const abar = document.getElementById('abar'); if (abar) abar.classList.add('show');
}

// Legacy alias used in some older HTML buttons
function playA(s, a) { playAyah(s, a); }

function filterS(q) {
  document.querySelectorAll('.si').forEach(i => {
    i.style.display = i.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}

function addBM(s, a) {
  fetch(`${API_BASE}/bookmarks/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ surah_number: s, ayah_number: a }),
  }).then(r => {
    if (r.ok) { showToast('Bookmark saved! 📌'); }
    else { r.json().then(e => console.warn('Bookmark error:', e)); }
  }).catch(() => { showToast('Bookmark saved locally! 📌'); });
}

function showToast(msg) {
  let t = document.getElementById('noor-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'noor-toast';
    t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(212,160,23,.95);color:#000;padding:10px 22px;border-radius:30px;font-size:.82rem;font-weight:700;z-index:9999;opacity:0;transition:opacity .3s;pointer-events:none;backdrop-filter:blur(10px)';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity = '1';
  setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

// ── RECITERS PAGE ──
function loadReciters() {
  const rg = document.getElementById('rg'); if (!rg) return;
  rg.innerHTML = '';
  RECITERS.forEach(r => {
    const div = document.createElement('div'); div.className = 'rc card'; div.style.cursor = 'pointer';
    div.innerHTML = `
      <div class="rav" style="background:url('${r.photo}');background-size:cover;background-position:center">${r.init}</div>
      <div class="rna">${r.ar}</div>
      <div class="rne">${r.en}</div>
      <div class="rb">${r.style}</div>
      <p style="font-size:.7rem;color:var(--soft);margin:8px 0">${r.country}</p>
      <div style="margin-top:12px;font-size:.75rem;color:var(--gold);text-transform:uppercase;letter-spacing:1px">View Full Page →</div>`;
    div.onclick = () => window.location.href = r.page;
    rg.appendChild(div);
  });

  // Quick-play selects
  const recSel = document.getElementById('reciterSel');
  if (recSel) {
    recSel.innerHTML = '';
    RECITERS.forEach(r => recSel.innerHTML += `<option value="${r.id}">${r.en}</option>`);
  }
  const surahSel = document.getElementById('surahSel');
  if (surahSel) {
    surahSel.innerHTML = '';
    SURAHS.forEach(s => surahSel.innerHTML += `<option value="${s.n}">${s.n}. ${s.en} — ${s.ar}</option>`);
  }
}

let _qpPlaying = false;
function quickPlay() {
  const recSel = document.getElementById('reciterSel');
  const surahSel = document.getElementById('surahSel');
  if (!recSel?.value || !surahSel?.value) return;
  const r = RECITERS.find(x => x.id === recSel.value); if (!r) return;
  const sn = parseInt(surahSel.value);
  const s = SURAHS.find(x => x.n === sn);
  const url = r.server + String(sn).padStart(3, '0') + '.mp3';
  const aud = document.getElementById('aud'); if (!aud) return;
  aud.src = url; aud.volume = 0.85;
  aud.play().catch(() => {});
  _qpPlaying = true;
  set('asn', `Surah ${sn} — ${s?.en || ''}`);
  set('arcn', r.en);
  set('nowPlaying', `▶ ${r.en} — ${s?.en || 'Surah ' + sn}`);
  const abar = document.getElementById('abar'); if (abar) abar.classList.add('show');
  const btn = document.getElementById('plbtn'); if (btn) btn.textContent = '⏸';
}

// togPlay used by reciters.html audio bar button
function togPlay() {
  const aud = document.getElementById('aud'); if (!aud) return;
  if (aud.paused) { aud.play().catch(() => {}); _qpPlaying = true; }
  else { aud.pause(); _qpPlaying = false; }
  const btn = document.getElementById('plbtn');
  if (btn) btn.textContent = aud.paused ? '▶' : '⏸';
}
function stopSurah() {
  const aud = document.getElementById('aud');
  if (aud) { aud.pause(); aud.currentTime = 0; }
  _qpPlaying = false;
  const btn = document.getElementById('plbtn'); if (btn) btn.textContent = '▶';
  closeAudio();
}
function closeAudio() {
  const abar = document.getElementById('abar'); if (abar) abar.classList.remove('show');
}

// updP — alias for progress update (used in some HTML oninput attributes)
function updP() {
  const aud = document.getElementById('aud'); if (!aud) return;
  const p = aud.duration ? aud.currentTime / aud.duration * 100 : 0;
  const sl = document.getElementById('seekSlider'); if (sl) sl.value = p;
}
function seekAudio() {
  const aud = document.getElementById('aud');
  const sl = document.getElementById('seekSlider');
  if (!aud || !sl || !aud.duration) return;
  aud.currentTime = sl.value / 100 * aud.duration;
}
function onEnd() { stopSurah(); }

// ── PRAYER PAGE ──
function loadPrayerBig() {
  const fetchPrayer = (la, lo) => {
    fetch(`https://api.aladhan.com/v1/timings?latitude=${la}&longitude=${lo}&method=2`)
      .then(r => r.json()).then(d => {
        const t = d.data.timings;
        set('bft', t.Fajr); set('bst', t.Sunrise); set('bdt', t.Dhuhr);
        set('bat', t.Asr); set('bmt', t.Maghrib); set('bit', t.Isha);
        updatePrayerCards(t, d.data.date);
        hlPrayer(t); schedulePrayer(t);
      }).catch(() => {});
  };
  const fb = () => fetch('https://ipapi.co/json/').then(r => r.json()).then(d => fetchPrayer(d.latitude, d.longitude)).catch(() => {});
  if (!navigator.geolocation) return fb();
  navigator.geolocation.getCurrentPosition(pos => fetchPrayer(pos.coords.latitude, pos.coords.longitude), fb);
}

function updatePrayerCards(t) {
  const now = new Date();
  const timeMap = { Fajr: t.Fajr, Sunrise: t.Sunrise, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha };
  const prayers = [
    { id: 'pb-fajr', name: 'Fajr', tip: 'bfl' }, { id: 'pb-sunrise', name: 'Sunrise', tip: 'bsl' },
    { id: 'pb-dhuhr', name: 'Dhuhr', tip: 'bdl' }, { id: 'pb-asr', name: 'Asr', tip: 'bal' },
    { id: 'pb-maghrib', name: 'Maghrib', tip: 'bml' }, { id: 'pb-isha', name: 'Isha', tip: 'bil' },
  ];
  prayers.forEach(p => {
    const e = document.getElementById(p.id); if (!e) return;
    const tm = timeMap[p.name]; if (!tm) return;
    const [h, m] = tm.split(':').map(Number);
    const next = new Date(); next.setHours(h, m, 0, 0);
    const diff = next - now;
    if (diff > 0 && diff < 86400000) { set(p.tip, Math.round(diff / 60000) + 'm left'); e.classList.add('now'); }
    else e.classList.remove('now');
  });
}

// ── NAMES PAGE ──
function loadNames() {
  const ng = document.getElementById('ng'); if (!ng) return;
  fetch(`${API_BASE}/names/`)
    .then(r => r.json()).then(d => {
      ng.innerHTML = '';
      d.names.forEach(n => {
        const div = document.createElement('div'); div.className = 'nc card';
        div.innerHTML = `<div class="nn2">${n.num}</div><div class="na">${n.arabic}</div><div class="nt">${n.transliteration}</div><div class="nm">${n.meaning_en}</div>`;
        ng.appendChild(div);
      });
    }).catch(e => console.warn('Names error:', e));
}

// ── AUDIO PLAYER FUNCTIONS (Global) ──
function playAyah(surah, ayah) {
  const num = ALL.slice(0, surah - 1).reduce((acc, x) => acc + x.v, 0) + ayah;
  const aud = document.getElementById('aud');
  if (aud) {
    aud.src = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${num}.mp3`;
    aud.play().catch(e => console.warn('Playback blocked:', e));
    const elem = document.getElementById('ay' + ayah);
    if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function togPlay() {
  const aud = document.getElementById('aud');
  const plBtn = document.getElementById('plbtn');
  if (aud) {
    if (aud.paused) {
      aud.play().catch(e => console.warn(e));
      if (plBtn) plBtn.textContent = '⏸';
    } else {
      aud.pause();
      if (plBtn) plBtn.textContent = '▶';
    }
  }
}

function nextA() {
  if (CUR && CAY < CUR.v) playAyah(CUR.n, CAY + 1);
}

function prevA() {
  if (CUR && CAY > 1) playAyah(CUR.n, CAY - 1);
}

function updProg() {
  const aud = document.getElementById('aud');
  const pf = document.getElementById('pf');
  if (aud && aud.duration && pf) {
    pf.style.width = (aud.currentTime / aud.duration * 100) + '%';
  }
}

function seekAudio(slider) {
  const aud = document.getElementById('aud');
  if (aud && aud.duration) {
    aud.currentTime = (slider.value / 100) * aud.duration;
  }
}

function closeAudio() {
  const abar = document.getElementById('abar');
  const aud = document.getElementById('aud');
  if (abar) abar.classList.remove('show');
  if (aud) aud.pause();
}

// ── PAGE INIT ──
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('grid'))   loadSurahs();
  if (document.getElementById('rg'))     loadReciters();
  if (document.getElementById('pbgrid')) loadPrayerBig();
  if (document.getElementById('ng'))     loadNames();
});

// ── PRAYER BAR (background) ──
loadPrayer();
