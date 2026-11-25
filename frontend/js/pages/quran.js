'use strict';

let CUR = null;
let CLANG = 'en';
let _isDownloading = false;

function setTxt(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

let _renderToken = 0;

function createSurahNode(s) {
  const item = document.createElement('div');
  item.className = 'si';
  item.setAttribute('data-surah', String(s.n));
  item.setAttribute('role', 'button');
  item.setAttribute('tabindex', '0');

  const num = document.createElement('div');
  num.className = 'snum';
  num.textContent = String(s.n);
  const info = document.createElement('div');
  info.className = 'sinf';
  const ar = document.createElement('div');
  ar.className = 'sar';
  ar.textContent = s.ar;
  const en = document.createElement('div');
  en.className = 'sen';
  en.textContent = s.en;
  info.append(ar, en);
  if (s.v) {
    const sv = document.createElement('div');
    sv.className = 'sv';
    sv.textContent = `${s.v} verses`;
    info.appendChild(sv);
  }
  item.append(num, info);
  return item;
}

function renderS(list) {
  const grid = document.getElementById('grid');
  if (!grid) return;
  const token = ++_renderToken;

  if (!list || list.length === 0) {
    grid.innerHTML = window.getEmptyStateHTML({
      icon: '🔍',
      title: 'No Surahs Found',
      description: 'Try searching by surah name in Arabic, English, or by chapter number.',
      actionText: 'Show All Surahs',
      actionName: 'filter-reset',
    });
    return;
  }

  grid.innerHTML = '';
  const initialCount = list.length > 40 ? 24 : list.length;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < initialCount; i++) {
    frag.appendChild(createSurahNode(list[i]));
  }
  grid.appendChild(frag);

  if (initialCount < list.length) {
    let offset = initialCount;
    const scheduleNext =
      typeof requestIdleCallback === 'function'
        ? (cb) => requestIdleCallback(cb, { timeout: 200 })
        : (cb) => setTimeout(cb, 32);
    const appendChunk = () => {
      if (token !== _renderToken) return;
      const chunk = document.createDocumentFragment();
      const end = Math.min(offset + 24, list.length);
      for (let i = offset; i < end; i++) {
        chunk.appendChild(createSurahNode(list[i]));
      }
      grid.appendChild(chunk);
      offset = end;
      if (offset < list.length) scheduleNext(appendChunk);
    };
    scheduleNext(appendChunk);
  }
}

function filterS(q) {
  const srch = document.getElementById('srch');
  if (srch && q === '' && srch.value !== '') srch.value = '';
  const query = (q || '').trim().toLowerCase();
  const src = window.SURAHS || [];
  if (!query) {
    renderS(src);
    return;
  }
  renderS(
    src.filter(
      (s) => s.en.toLowerCase().includes(query) || s.ar.includes(query) || String(s.n).includes(query)
    )
  );
}
window.filterS = filterS;

async function initOfflineControls() {
  if (!window.NoorDB) return;
  const badge = document.getElementById('offlineBadge');
  const btn = document.getElementById('offlineQuranBtn');
  const count = await window.NoorDB.getCachedSurahCount(CLANG || 'en');
  if (badge) {
    badge.classList.remove('ready');
    if (count >= 114) {
      badge.textContent = '✓ 114/114 Ready';
      badge.classList.add('ready');
    } else if (count > 0) {
      badge.textContent = `${count}/114 Cached`;
    } else {
      badge.textContent = 'Not Downloaded';
    }
  }
  if (btn) btn.addEventListener('click', downloadFullQuranOffline);
}

async function downloadFullQuranOffline() {
  if (_isDownloading || !window.NoorDB) return;
  const count = await window.NoorDB.getCachedSurahCount(CLANG || 'en');
  if (count >= 114) {
    window.showToast?.('All 114 Surahs are already saved for offline reading! ✨', 'info');
    return;
  }

  _isDownloading = true;
  const wrap = document.getElementById('offlineProgressWrap');
  const bar = document.getElementById('offlineProgressBar');
  const lbl = document.getElementById('offlineProgressLabel');
  const badge = document.getElementById('offlineBadge');
  wrap?.classList.remove('hidden');

  let done = 0;
  const lang = CLANG || 'en';
  window.showToast?.('Starting offline Quran download... 📥', 'info');

  for (let n = 1; n <= 114; n++) {
    try {
      await window.fetchSurahData(n, lang);
    } catch (e) {
      console.warn(`Failed to cache surah ${n}:`, e);
    }
    done++;
    const pct = Math.round((done / 114) * 100);
    if (bar) bar.style.width = pct + '%';
    if (lbl) lbl.textContent = `Downloading Quran: ${done}/114 surahs (${pct}%)`;
    if (badge) badge.textContent = `${done}/114`;
  }

  _isDownloading = false;
  if (lbl) lbl.textContent = '✓ Full Quran downloaded successfully!';
  if (badge) {
    badge.textContent = '✓ 114/114 Ready';
    badge.classList.add('ready');
  }
  window.showToast?.('Full Quran is ready for offline reading! 🌙', 'success', 5000);
  setTimeout(() => {
    wrap?.classList.add('hidden');
  }, 4000);
}

async function openS(n) {
  const s = (window.SURAHS || []).find((x) => x.n === n);
  if (!s) return;
  CUR = s;
  setTxt('rn', 'SURAH ' + n);
  setTxt('rar', s.ar);
  setTxt('ren', s.en);
  document.getElementById('rbis')?.classList.toggle('hidden', n === 1 || n === 9);
  document.getElementById('reader')?.classList.add('open');
  document.getElementById('abar')?.classList.add('show');
  setTxt('asn', `${s.ar} — ${s.en}`);

  const alist = document.getElementById('alist');
  if (alist) alist.innerHTML = window.getAyahSkeletons(6);
  window.applyReadingSettings?.();

  const lang = CLANG || 'en';
  try {
    const d = await window.fetchSurahData(n, lang);
    if (!d || !(d.code === 200 || d.data)) throw new Error((d && d.message) || 'Error');
    const ar = d.data[0].ayahs;
    const tr = (d.data[1] && d.data[1].ayahs) || [];
    const translit = (d.data[2] && d.data[2].ayahs) || [];
    const bismillahRegex =
      /^بِسْمِ\s*[ٱا]للَّ?[-ـ\u0640]*[ٰ\u0670]?هِ\s*[ٱا]لرَّحْمَ?[-ـ\u0640]*[ٰ\u0670]?نِ\s*[ٱا]لرَّحِيمِ\s*/u;

    if (!alist) return;
    alist.innerHTML = '';

    ar.forEach((a, i) => {
      const trText = (tr[i] && tr[i].text) || '';
      const translitText = (translit[i] && translit[i].text) || '';
      let arText = a.text || '';
      if (n !== 1 && a.numberInSurah === 1) {
        arText = arText.replace(bismillahRegex, '');
      }

      const card = document.createElement('div');
      card.className = 'ac';
      card.id = `ay${a.numberInSurah}`;

      const top = document.createElement('div');
      top.className = 'at';
      const anum = document.createElement('span');
      anum.className = 'anum';
      anum.textContent = String(a.numberInSurah);
      const act = document.createElement('div');
      act.className = 'aact';

      const bPlay = document.createElement('button');
      bPlay.type = 'button';
      bPlay.className = 'abtn';
      bPlay.setAttribute('data-ayah-action', 'play');
      bPlay.setAttribute('data-surah', String(n));
      bPlay.setAttribute('data-ayah', String(a.numberInSurah));
      bPlay.title = 'Play';
      bPlay.setAttribute('aria-label', `Play ayah ${a.numberInSurah}`);
      bPlay.textContent = '🔊';

      const bBm = document.createElement('button');
      bBm.type = 'button';
      bBm.className = 'abtn';
      bBm.setAttribute('data-ayah-action', 'bookmark');
      bBm.setAttribute('data-surah', String(n));
      bBm.setAttribute('data-ayah', String(a.numberInSurah));
      bBm.title = 'Bookmark';
      bBm.setAttribute('aria-label', `Bookmark ayah ${a.numberInSurah}`);
      bBm.textContent = '🔖';

      const bShare = document.createElement('button');
      bShare.type = 'button';
      bShare.className = 'abtn';
      bShare.setAttribute('data-ayah-action', 'share');
      bShare.setAttribute('data-surah', String(n));
      bShare.setAttribute('data-ayah', String(a.numberInSurah));
      bShare.title = 'Share';
      bShare.setAttribute('aria-label', `Share ayah ${a.numberInSurah}`);
      bShare.textContent = '📤';

      act.append(bPlay, bBm, bShare);
      top.append(anum, act);

      const dAr = document.createElement('div');
      dAr.className = 'aarb';
      dAr.textContent = arText;
      card.append(top, dAr);
      if (trText) {
        const dEn = document.createElement('div');
        dEn.className = 'aen';
        dEn.textContent = trText;
        card.appendChild(dEn);
      }
      if (translitText) {
        const dTr = document.createElement('div');
        dTr.className = 'atrn';
        dTr.textContent = translitText;
        card.appendChild(dTr);
      }
      alist.appendChild(card);
    });

    window.applyReadingSettings?.();
  } catch (_e) {
    if (alist) {
      alist.innerHTML = window.getErrorStateHTML({
        title: 'Failed to load verses',
        description: 'Unable to reach the Quran server. Please check your network connection.',
        actionName: 'open-surah',
        surahNum: n,
      });
    }
  }
}
window.openS = openS;

function playAyahQuran(s, a) {
  if (!CUR || CUR.n !== s) {
    CUR = (window.SURAHS || []).find((x) => x.n === s) || { n: s, ar: 'سورة', en: 'Surah ' + s };
  }
  const sel = document.getElementById('quranReciterSel');
  const reciter = (sel && sel.value) || localStorage.getItem('nq_quran_reciter') || 'mishary_alafasy';
  window.NoorAudioManager.playAyah(s, a, reciter);
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    CLANG = localStorage.getItem('lang') || 'en';
  } catch (_e) {
    CLANG = 'en';
  }

  renderS(window.SURAHS || []);
  initOfflineControls();

  const savedReciter = localStorage.getItem('nq_quran_reciter') || 'mishary_alafasy';
  const recSel = document.getElementById('quranReciterSel');
  if (recSel) {
    recSel.value = savedReciter;
    recSel.addEventListener('change', function () {
      localStorage.setItem('nq_quran_reciter', this.value);
      if (window.NoorAudioManager?.state.isPlaying) {
        window.NoorAudioManager.playAyah(
          window.NoorAudioManager.state.surahNum,
          window.NoorAudioManager.state.ayahNum,
          this.value
        );
      }
    });
  }

  document.getElementById('srch')?.addEventListener('input', (e) => filterS(e.target.value));

  const grid = document.getElementById('grid');
  grid?.addEventListener('click', (e) => {
    const item = e.target.closest('.si[data-surah]');
    if (item) openS(parseInt(item.getAttribute('data-surah'), 10));
  });
  grid?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const item = e.target.closest('.si[data-surah]');
      if (item) {
        e.preventDefault();
        openS(parseInt(item.getAttribute('data-surah'), 10));
      }
    }
  });

  document.getElementById('alist')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-ayah-action]');
    if (!btn) return;
    const act = btn.getAttribute('data-ayah-action');
    const s = parseInt(btn.getAttribute('data-surah'), 10);
    const a = parseInt(btn.getAttribute('data-ayah'), 10);
    if (act === 'play') playAyahQuran(s, a);
    else if (act === 'bookmark' && typeof window.addBM === 'function') window.addBM(s, a);
    else if (act === 'share' && typeof window.shareAyah === 'function') window.shareAyah(s, a);
  });

  document.getElementById('closeReaderBtn')?.addEventListener('click', () => {
    document.getElementById('reader')?.classList.remove('open');
  });
  document.getElementById('fontDecBtn')?.addEventListener('click', () => window.changeAyahFontSize?.(-0.15));
  document.getElementById('fontIncBtn')?.addEventListener('click', () => window.changeAyahFontSize?.(0.15));

  document.querySelectorAll('.rc-btn[data-view-mode]').forEach((btn) => {
    btn.addEventListener('click', () => window.setQuranViewMode?.(btn.getAttribute('data-view-mode')));
  });

  document.getElementById('prevAyahBtn')?.addEventListener('click', () => window.NoorAudioManager.prev());
  document.getElementById('plbtn')?.addEventListener('click', () => window.NoorAudioManager.togglePlay());
  document.getElementById('nextAyahBtn')?.addEventListener('click', () => window.NoorAudioManager.next());
  document.getElementById('speedBtn')?.addEventListener('click', () => window.cycleAudioSpeed?.());
  document.getElementById('loopBtn')?.addEventListener('click', () => window.cycleAudioLoop?.());
  document.getElementById('closeAudioBtn')?.addEventListener('click', () => {
    document.getElementById('abar')?.classList.remove('show');
    window.NoorAudioManager.pause();
    document.querySelectorAll('.ac.playing').forEach((el) => el.classList.remove('playing'));
  });

  const aud = document.getElementById('aud');
  aud?.addEventListener('ended', () => window.NoorAudioManager.next());

  const params = new URLSearchParams(window.location.search);
  const surahParam = params.get('surah');
  if (surahParam) {
    openS(parseInt(surahParam, 10)).then(() => {
      setTimeout(() => {
        if (window.location.hash) {
          document
            .querySelector(window.location.hash)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    });
  }

  document.addEventListener('langChange', (e) => {
    CLANG = e.detail;
    if (CUR) openS(CUR.n);
  });
});
