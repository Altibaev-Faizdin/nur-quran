'use strict';

let currentCollection = 'bukhari';
let currentPage = 1;
let totalPages = 1;
let searchQuery = '';
let searchTimer = null;
const apiCache = {};

const API_MAP = {
  bukhari: 'bukhari',
  muslim: 'muslim',
  'abu-dawud': 'abudawud',
  tirmidhi: 'tirmidhi',
  'ibn-majah': 'ibnmajah',
  nasai: 'nasai',
};

const DAILY_HADITHS = [
  {
    ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا',
    en: '"O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds."',
    src: 'Ibn Majah | Sahih',
  },
  { ar: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ', en: '"Actions are but by intentions."', src: 'Bukhari | Sahih' },
  {
    ar: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    en: '"The best of you are those who learn the Quran and teach it."',
    src: 'Bukhari | Sahih',
  },
  {
    ar: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    en: '"None of you truly believes until he loves for his brother what he loves for himself."',
    src: 'Bukhari & Muslim | Sahih',
  },
  { ar: 'الدِّينُ النَّصِيحَةُ', en: '"The religion is sincere advice."', src: 'Muslim | Sahih' },
  {
    ar: 'الجَنَّةُ تَحتَ أَقدامِ الأُمَّهاتِ',
    en: '"Paradise lies beneath the feet of mothers."',
    src: 'An-Nasai | Sahih',
  },
  {
    ar: 'أَكمَلُ المُؤمِنينَ إيمانًا أَحسَنُهُم خُلُقًا',
    en: '"The most complete of the believers in faith is the one with the best character."',
    src: 'Abu Dawud | Sahih',
  },
];

function showDailyHadith() {
  const d = new Date();
  const idx = (d.getDate() + d.getMonth()) % DAILY_HADITHS.length;
  const h = DAILY_HADITHS[idx];
  const arEl = document.getElementById('dailyAr');
  const enEl = document.getElementById('dailyEn');
  const srcEl = document.getElementById('dailySrc');
  if (arEl) arEl.textContent = h.ar;
  if (enEl) enEl.textContent = '"' + h.en.replace(/^"|"$/g, '') + '"';
  if (srcEl) srcEl.textContent = '— ' + h.src;
}

async function fetchHadithCollection(col) {
  if (apiCache[col]) return apiCache[col];

  if (window.NoorDB && typeof window.NoorDB.getHadiths === 'function') {
    try {
      const cached = await window.NoorDB.getHadiths(col);
      if (cached && cached.ar && cached.enArray) {
        const enMap = new Map();
        for (let i = 0; i < cached.enArray.length; i++) {
          enMap.set(cached.enArray[i].hadithnumber, cached.enArray[i].text);
        }
        const collection = { ar: cached.ar, enMap };
        apiCache[col] = collection;
        return collection;
      }
    } catch (e) {
      console.warn('IndexedDB hadith lookup failed:', e);
    }
  }

  const apiName = API_MAP[col];
  const grid = document.getElementById('hadithGrid');
  if (grid) {
    grid.innerHTML = `<div class="hadith-loading"><div class="spinner"></div><span>Downloading complete ${window.safeHTML(col.replace('-', ' '))} collection...</span></div>`;
  }

  try {
    const [arRes, enRes] = await Promise.all([
      fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${apiName}.min.json`),
      fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${apiName}.min.json`),
    ]);
    if (!arRes.ok || !enRes.ok) throw new Error('API Error: ' + arRes.status + ' / ' + enRes.status);

    const arData = await arRes.json();
    const enData = await enRes.json();

    if (!arData || !Array.isArray(arData.hadiths) || !enData || !Array.isArray(enData.hadiths)) {
      throw new Error('Invalid hadith dataset schema: hadiths array missing');
    }

    const enMap = new Map();
    for (let i = 0; i < enData.hadiths.length; i++) {
      const h = enData.hadiths[i];
      if (h && typeof h.hadithnumber !== 'undefined') {
        enMap.set(h.hadithnumber, h.text || '');
      }
    }

    const collection = { ar: arData.hadiths, enMap };
    if (window.NoorDB && window.NoorDB.saveHadiths) {
      window.NoorDB.saveHadiths(col, { ar: arData.hadiths, enArray: enData.hadiths });
    }

    apiCache[col] = collection;
    return collection;
  } catch (err) {
    console.error('Hadith fetch error:', err);
    if (grid) {
      grid.innerHTML = '';
      const empty = document.createElement('div');
      empty.className = 'hadith-empty';
      const icon = document.createElement('div');
      icon.className = 'icon';
      icon.textContent = '⚠';
      const msg = document.createElement('p');
      msg.textContent = 'Failed to load hadiths. Check your internet connection.';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'btn bo mt-14';
      retry.textContent = 'Retry';
      retry.addEventListener('click', () => loadHadiths(1));
      empty.append(icon, msg, retry);
      grid.appendChild(empty);
    }
    return null;
  }
}

async function selectCollection(col, btn) {
  currentCollection = col;
  currentPage = 1;
  document.querySelectorAll('.col-tab').forEach((b) => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  searchQuery = '';
  const searchEl = document.getElementById('hadithSearch');
  if (searchEl) searchEl.value = '';
  await loadHadiths(1);
}

async function loadHadiths(page) {
  currentPage = page;
  const grid = document.getElementById('hadithGrid');
  if (!grid) return;

  const data = await fetchHadithCollection(currentCollection);
  if (!data) return;

  const pageSizeEl = document.getElementById('pageSize');
  const pageSize = (pageSizeEl && parseInt(pageSizeEl.value, 10)) || 20;

  let filtered = data.ar;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = data.ar.filter((h) => {
      const textEn = data.enMap.get(h.hadithnumber) || '';
      return textEn.toLowerCase().includes(q) || (h.text && h.text.includes(searchQuery));
    });
  }

  totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const pageData = filtered.slice(start, start + pageSize);

  if (pageData.length === 0) {
    grid.innerHTML =
      '<div class="hadith-empty"><div class="icon">🔍</div><p>No hadiths found. Try a different search.</p></div>';
    buildPagination(0);
    return;
  }

  grid.innerHTML = '';
  const colLabel = currentCollection.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  pageData.forEach((h) => {
    const gradeObj = h.grades && h.grades.length ? h.grades[0] : null;
    const gradeRaw = gradeObj && gradeObj.grade ? gradeObj.grade : 'sahih';
    let colorClass = 'sahih';
    if (gradeRaw.toLowerCase().includes('hasan')) colorClass = 'hasan';
    else if (gradeRaw.toLowerCase().includes('daif') || gradeRaw.toLowerCase().includes('weak'))
      colorClass = 'daif';

    let textEn = data.enMap.get(h.hadithnumber) || 'Translation not available.';
    if (textEn.length > 800) textEn = textEn.substring(0, 800) + '...';
    let textAr = h.text || '';
    if (textAr.length > 800) textAr = textAr.substring(0, 800) + '...';

    const card = document.createElement('div');
    card.className = 'hadith-card';

    const meta = document.createElement('div');
    meta.className = 'hadith-meta';
    const bSpan = document.createElement('span');
    bSpan.className = 'hadith-book';
    bSpan.textContent = colLabel;
    const nSpan = document.createElement('span');
    nSpan.className = 'hadith-num';
    nSpan.textContent = `No. ${h.hadithnumber}`;
    const gSpan = document.createElement('span');
    gSpan.className = `hadith-grade ${colorClass}`;
    gSpan.textContent = gradeRaw.charAt(0).toUpperCase() + gradeRaw.slice(1);
    meta.append(bSpan, nSpan, gSpan);

    const arEl = document.createElement('div');
    arEl.className = 'hadith-arabic';
    arEl.textContent = textAr;
    const enEl = document.createElement('div');
    enEl.className = 'hadith-english';
    enEl.textContent = textEn;

    const actions = document.createElement('div');
    actions.className = 'hadith-actions';
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn-copy-h';
    copyBtn.setAttribute('aria-label', 'Copy hadith');
    copyBtn.textContent = '📋 Copy';
    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'btn-share-h';
    shareBtn.setAttribute('aria-label', 'Share hadith');
    shareBtn.textContent = '📤 Share';
    actions.append(copyBtn, shareBtn);

    card.append(meta, arEl, enEl, actions);
    grid.appendChild(card);
  });

  buildPagination(totalPages);
  window.scrollTo({ top: Math.max(0, grid.offsetTop - 80), behavior: 'smooth' });
}

function buildPagination(total) {
  const pg = document.getElementById('pagination');
  if (!pg || total <= 1) {
    if (pg) pg.innerHTML = '';
    return;
  }
  pg.innerHTML = '';

  const makePageBtn = (label, pageNum, opts = {}) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'page-btn' + (opts.active ? ' active' : '');
    b.textContent = label;
    if (opts.disabled) b.disabled = true;
    else b.addEventListener('click', () => loadHadiths(pageNum));
    return b;
  };

  pg.appendChild(makePageBtn('◀ Prev', currentPage - 1, { disabled: currentPage === 1 }));

  const startP = Math.max(1, currentPage - 2);
  const endP = Math.min(total, currentPage + 2);

  if (startP > 1) {
    pg.appendChild(makePageBtn('1', 1));
    if (startP > 2) {
      const ell = document.createElement('span');
      ell.className = 'pg-ellipsis';
      ell.textContent = '…';
      pg.appendChild(ell);
    }
  }

  for (let i = startP; i <= endP; i++) {
    pg.appendChild(makePageBtn(String(i), i, { active: i === currentPage }));
  }

  if (endP < total) {
    if (endP < total - 1) {
      const ell = document.createElement('span');
      ell.className = 'pg-ellipsis';
      ell.textContent = '…';
      pg.appendChild(ell);
    }
    pg.appendChild(makePageBtn(String(total), total));
  }

  pg.appendChild(makePageBtn('Next ▶', currentPage + 1, { disabled: currentPage === total }));
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.col-tab[data-col]').forEach((btn) => {
    btn.addEventListener('click', () => selectCollection(btn.getAttribute('data-col'), btn));
  });

  const searchEl = document.getElementById('hadithSearch');
  if (searchEl) {
    searchEl.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchQuery = e.target.value.trim();
        loadHadiths(1);
      }, 350);
    });
  }

  const pageSizeEl = document.getElementById('pageSize');
  if (pageSizeEl) pageSizeEl.addEventListener('change', () => loadHadiths(1));

  const loadBtn = document.getElementById('loadHadithsBtn');
  if (loadBtn) loadBtn.addEventListener('click', () => loadHadiths(1));

  document.getElementById('hadithGrid')?.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.btn-copy-h');
    if (copyBtn) {
      const card = copyBtn.closest('.hadith-card');
      const ar = card?.querySelector('.hadith-arabic')?.textContent || '';
      const en = card?.querySelector('.hadith-english')?.textContent || '';
      navigator.clipboard?.writeText(ar + '\n\n' + en).then(() => {
        window.showToast?.('Hadith copied! 📋', 'success');
      });
      return;
    }
    const shareBtn = e.target.closest('.btn-share-h');
    if (shareBtn) {
      const card = shareBtn.closest('.hadith-card');
      const ar = card?.querySelector('.hadith-arabic')?.textContent || '';
      const en = card?.querySelector('.hadith-english')?.textContent || '';
      const text = ar + '\n\n' + en;
      if (navigator.share) {
        navigator.share({ title: 'Hadith — Noor Al-Quran', text }).catch(() => {});
      } else {
        navigator.clipboard?.writeText(text).then(() => {
          window.showToast?.('Hadith copied for sharing! 📋', 'info');
        });
      }
    }
  });

  showDailyHadith();
  loadHadiths(1);
});
