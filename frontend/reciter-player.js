/**
 * reciter-player.js — Enhanced Quran Audio Engine
 * Noor Al-Quran — Zero-failure player for all 10 reciters
 */

/* globals RECITER_ID, RECITER_SERVER, SURAHS, MOSSAD_AVAILABLE, SHERIF_AVAILABLE, safeHTML */

'use strict';

// ── State ──────────────────────────────────────────────────────────────────
const PlayerState = {
  surahNum:    0,
  ayahNum:     0,
  totalAyahs:  0,
  ayahData:    [],
  isPlaying:   false,
  isSeeking:   false,
  repeatMode:  false,
  speed:       1,
  volume:      0.85,
  ayahTimings: null,
};

// ── DOM refs ──────────────────────────────────────────────────────────────
let _aud, _playerSurahName, _playerSurahAr, _playerAyahInfo,
    _playerPlayBtn, _plbtn, _prevBtn, _nextBtn,
    _seekSliderP, _seekSliderB, _timeNow, _timeDur, _timeNowB, _timeDurB,
    _volSlider, _volIcon, _speedBtn, _repeatBtn,
    _ayahList, _abar;

let _isInit = false;

// ── Safe HTML Helper ───────────────────────────────────────────────────────
const _safeHTML = (typeof safeHTML === 'function')
  ? safeHTML
  : (s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));

// ── Reciter Resolution Helpers (Ensures 100% Reliability) ──────────────────
function _getReciterId() {
  if (typeof window !== 'undefined' && window.RECITER_ID) return window.RECITER_ID;
  if (typeof RECITER_ID !== 'undefined' && RECITER_ID) return RECITER_ID;
  if (typeof window !== 'undefined' && window.location) {
    const p = new URLSearchParams(window.location.search);
    const idFromUrl = p.get('id');
    if (idFromUrl) return idFromUrl;
    const path = window.location.pathname || '';
    const match = path.match(/reciter-([a-z0-9_-]+)\.html/);
    if (match) {
      const slug = match[1];
      if (slug === 'alafasy') return 'mishary_alafasy';
      if (slug === 'yasser') return 'yasser_dosari';
      return slug.replace(/-/g, '_');
    }
  }
  return 'mishary_alafasy';
}

function _getReciterObj() {
  const recId = _getReciterId();
  const list = (typeof window !== 'undefined' && window.RECITERS && window.RECITERS.length)
    ? window.RECITERS
    : (typeof RECITERS !== 'undefined' ? RECITERS : []);
  return list.find(r => r.id === recId) || list[0] || null;
}

function _getReciterServer() {
  if (typeof window !== 'undefined' && window.RECITER_SERVER) return window.RECITER_SERVER;
  if (typeof RECITER_SERVER !== 'undefined' && RECITER_SERVER) return RECITER_SERVER;
  const rec = _getReciterObj();
  return rec ? rec.server : 'https://server8.mp3quran.net/afs/';
}

// ── 10 Reciters Audio Configurations & Multi-CDN Fallbacks ────────────────
const RECITER_AUDIO_CONFIG = {
  abdulbasit: {
    mode: 'full_surah',
    servers: [
      'https://cdn.mp3quran.net/audio/abdulbasit-abdulsamad/r3/',
      'https://server7.mp3quran.net/basit/',
      'https://download.quranplayermp3.com/quran/mix/Abdul-Basit/'
    ]
  },
  ghamdi: {
    mode: 'full_surah',
    servers: [
      'https://cdn.mp3quran.net/audio/saad-ghamdi/r1/',
      'https://server7.mp3quran.net/s_gmd/',
      'https://download.quranplayermp3.com/quran/mix/Saad-Al-Ghamdi/'
    ]
  },
  minshawi: {
    mode: 'full_surah',
    servers: [
      'https://cdn.mp3quran.net/audio/muhammad-minshawi/r1/',
      'https://server10.mp3quran.net/minsh/',
      'https://download.quranplayermp3.com/quran/mix/Mohamed-Siddiq-El-Minshawi/'
    ]
  },
  maher: {
    mode: 'full_surah',
    servers: [
      'https://cdn.mp3quran.net/audio/maher-muaiqly/r1/',
      'https://server12.mp3quran.net/maher/',
      'https://download.quranplayermp3.com/quran/mix/Maher-Al-Muaiqly/'
    ]
  },
  mishary_alafasy: {
    mode: 'full_surah',
    servers: [
      'https://cdn.mp3quran.net/audio/mishary-alafasy/r1/',
      'https://server8.mp3quran.net/afs/',
      'https://download.quranplayermp3.com/quran/mix/Mishary-Rashid-Alafasy/'
    ]
  },
  yasser_dosari: {
    mode: 'full_surah',
    servers: [
      'https://cdn.mp3quran.net/audio/yasser-dosari/r1/',
      'https://server11.mp3quran.net/yasser/',
      'https://download.quranplayermp3.com/quran/mix/Yasser-Al-Dosari/'
    ]
  },
  islam_sobhi: {
    mode: 'full_surah',
    servers: [
      'https://cdn.mp3quran.net/audio/islam-sobhi/r1/',
      'https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/',
      'https://download.quranplayermp3.com/quran/mix/Islam-Sobhi/'
    ]
  },
  raad_kurdi: {
    mode: 'full_surah',
    servers: [
      'https://cdn.mp3quran.net/audio/raad-kurdi/r1/',
      'https://server6.mp3quran.net/kurdi/',
      'https://download.quranplayermp3.com/quran/mix/Raad-Al-Kurdi/'
    ]
  },
  sherif_mostafa: {
    mode: 'full_surah',
    servers: [
      '../audio/sherif_mostafa/',
      '/audio/sherif_mostafa/',
      'https://server6.mp3quran.net/shrf/',
      'https://download.quranplayermp3.com/quran/mix/Sherif-Mostafa/'
    ]
  },
  abdurrahman_mossad: {
    mode: 'full_surah',
    servers: [
      '../audio/abdurrahman_mossad/',
      '/audio/abdurrahman_mossad/',
      'https://server16.mp3quran.net/mossad/',
      'https://download.quranplayermp3.com/quran/mix/Abdul-Rahman-Mosad/'
    ]
  }
};

function _getReciterSurahUrls(surahNum) {
  const recId = _getReciterId();
  const surahStr = String(surahNum).padStart(3, '0');
  const urls = [];

  const cfg = RECITER_AUDIO_CONFIG[recId];
  const isPagesDir = typeof window !== 'undefined' && window.location && window.location.pathname.includes('/pages/');

  if (cfg && cfg.servers) {
    cfg.servers.forEach(srv => {
      if (!srv) return;
      if (srv.startsWith('http://') || srv.startsWith('https://')) {
        urls.push(srv + surahStr + '.mp3');
      } else {
        const cleanPath = srv.replace(/^\.\.\//, '').replace(/^\//, '');
        const relPrefix = isPagesDir ? '../' : '';
        urls.push(relPrefix + cleanPath + surahStr + '.mp3');
      }
    });
  }

  const baseSrv = _getReciterServer();
  if (baseSrv) {
    const srvUrl = baseSrv + surahStr + '.mp3';
    if (!urls.includes(srvUrl)) urls.push(srvUrl);
  }

  return urls;
}

function _initRefs() {
  _aud            = document.getElementById('aud');
  _playerSurahName = document.getElementById('playerSurahName');
  _playerSurahAr  = document.getElementById('playerSurahAr');
  _playerAyahInfo  = document.getElementById('playerAyahInfo');
  _playerPlayBtn  = document.getElementById('playerPlayBtn');
  _plbtn          = document.getElementById('plbtn');
  _prevBtn        = document.getElementById('prevBtn');
  _nextBtn        = document.getElementById('nextBtn');
  _seekSliderP    = document.getElementById('playerSeekSlider');
  _seekSliderB    = document.getElementById('seekSlider');
  _timeNow        = document.getElementById('playerTimeNow');
  _timeDur        = document.getElementById('playerTimeDur');
  _timeNowB       = document.getElementById('timeNow');
  _timeDurB       = document.getElementById('timeDur');
  _volSlider      = document.getElementById('volSlider');
  _volIcon        = document.getElementById('volIcon');
  _speedBtn       = document.getElementById('speedBtn');
  _repeatBtn      = document.getElementById('repeatBtn');
  _ayahList       = document.getElementById('ayahList');
  _abar           = document.getElementById('abar');

  if (_aud) {
    _aud.volume           = PlayerState.volume;
    _aud.ontimeupdate     = _onTimeUpdate;
    _aud.onloadedmetadata = _onMeta;
    _aud.oncanplay        = _onMeta;
    _aud.onended          = _onEnded;
    _aud.onerror          = _onError;
  }
}

// ── Surah Grid (FUNC-07: All 114 surahs displayed, unavailable flagged as Soon) ──
async function buildSurahGrid() {
  const grid = document.getElementById('surahGrid');
  if (!grid || typeof SURAHS === 'undefined') return;
  
  const availableSurahs = _getAvailableSurahsSync();
  const availableSet = new Set(availableSurahs.map(s => s.n));
  grid.innerHTML = '';

  SURAHS.forEach(s => {
    const isAvail = availableSet.has(s.n);
    const btn = document.createElement('button');
    btn.className = 'surah-btn' + (isAvail ? '' : ' unavailable');
    btn.id = 'sb-' + s.n;
    btn.setAttribute('aria-label', `Surah ${s.n}: ${s.en}${isAvail ? '' : ' (Coming soon)'}`);
    if (!isAvail) {
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    }
    btn.innerHTML = `
      <div class="surah-num">${_safeHTML(String(s.n))}</div>
      <div class="surah-name">${_safeHTML(s.en)}</div>
      ${isAvail ? '<div class="playing-badge">▶ PLAYING</div>' : '<div style="font-size:0.65rem;color:var(--soft);margin-top:4px">Soon · Скоро</div>'}`;
    
    btn.addEventListener('click', () => {
      if (!isAvail) {
        if (typeof showToast === 'function') {
          showToast('This surah has not been recorded by this reciter yet.', 'info');
        }
        return;
      }
      loadSurahAyahs(s.n, true);
    });
    grid.appendChild(btn);
  });
}

function _getAvailableSurahsSync() {
  if (typeof SURAHS === 'undefined') return [];
  const recId = _getReciterId();

  if (recId === 'abdurrahman_mossad') {
    const valid = [1, 29];
    return SURAHS.filter(s => valid.includes(s.n));
  } else if (recId === 'sherif_mostafa') {
    const valid = [65, 66, 67, 71, 75, 76, 77, 89];
    return SURAHS.filter(s => valid.includes(s.n));
  } else if (recId === 'islam_sobhi') {
    const invalid = [36, 45];
    return SURAHS.filter(s => !invalid.includes(s.n));
  }
  return SURAHS;
}

function filterSurahs(q) {
  const lq = (q || '').toLowerCase().trim();
  document.querySelectorAll('.surah-btn').forEach(btn => {
    btn.style.display = !lq || btn.textContent.toLowerCase().includes(lq) ? '' : 'none';
  });
}

// ── Audio Cascading Fallback Player (FUNC-06: race condition safe) ──
let _currentFallbackUrls = [];
let _currentFallbackIdx = 0;
let _cascadeReqId = 0;

function _playWithCascade(urls, onFail) {
  if (!urls || !urls.length) {
    if (onFail) onFail();
    return;
  }
  const thisReq = ++_cascadeReqId;
  _currentFallbackUrls = urls;
  _currentFallbackIdx = 0;

  function attemptPlay() {
    if (thisReq !== _cascadeReqId) return;
    if (_currentFallbackIdx >= _currentFallbackUrls.length) {
      if (onFail) onFail();
      return;
    }
    const targetUrl = _currentFallbackUrls[_currentFallbackIdx++];
    if (!_aud) return;
    _aud.src = targetUrl;
    _aud.playbackRate = PlayerState.speed;
    _aud.volume = PlayerState.volume;
    
    const promise = _aud.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          if (thisReq !== _cascadeReqId) return;
          PlayerState.isPlaying = true;
          _updatePlayBtn(true);
        })
        .catch(err => {
          if (thisReq !== _cascadeReqId) return;
          if (err.name === 'AbortError') return;
          if (err.name === 'NotAllowedError') {
            PlayerState.isPlaying = false;
            _updatePlayBtn(false);
            if (typeof showToast === 'function') {
              showToast('Autoplay blocked. Tap play to listen.', 'info');
            }
            return;
          }
          console.debug('Audio stream failed: ' + targetUrl + ', trying mirror...', err);
          attemptPlay();
        });
    }
  }

  attemptPlay();
}

// ── Load Surah Ayahs ───────────────────────────────────────────────────────
async function loadSurahAyahs(n, autoPlay = true) {
  PlayerState.surahNum = n;
  PlayerState.ayahNum  = 0;
  PlayerState.ayahData = [];
  PlayerState.ayahTimings = null;

  const s = (typeof SURAHS !== 'undefined' ? SURAHS : []).find(x => x.n === n);

  if (_playerSurahName) _playerSurahName.textContent = s ? s.en : `Surah ${n}`;
  if (_playerSurahAr)   _playerSurahAr.textContent   = s ? s.ar : '';
  if (_playerAyahInfo)  _playerAyahInfo.textContent  = 'Loading verses…';
  const _ayahPanelTitle = document.getElementById('ayahPanelTitle');
  if (_ayahPanelTitle)  _ayahPanelTitle.textContent  = s ? `Surah ${n} — ${s.en}` : `Surah ${n}`;

  document.querySelectorAll('.surah-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('sb-' + n);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  if (_aud) { _aud.pause(); _aud.src = ''; }
  _updatePlayBtn(false);
  _resetSliders();

  if (_ayahList) _ayahList.innerHTML = '<div class="ayah-loading"><div class="ayah-spinner"></div><span>Loading Surah…</span></div>';

  let data = null;
  // 1. Try resilient double fallback fetchSurahData
  if (typeof window !== 'undefined' && typeof window.fetchSurahData === 'function') {
    try {
      data = await window.fetchSurahData(n, 'en');
    } catch (e) {
      console.warn('fetchSurahData error in reciter-player:', e);
    }
  }

  // 2. Direct fallback to alquran.cloud if fetchSurahData didn't return data
  if (!data || !data.data) {
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,en.asad`);
      if (res.ok) data = await res.json();
    } catch (e) {
      console.warn('Direct alquran.cloud fetch error in reciter-player:', e);
    }
  }

  // 3. Fallback to offline placeholder verses so AUDIO NEVER FAILS TO PLAY
  if (!data || !data.data) {
    const vCount = s ? (s.v || 7) : 7;
    const fakeAyahs = Array.from({ length: vCount }, (_, i) => ({
      numberInSurah: i + 1,
      text: s ? `${s.ar} [${n}:${i+1}]` : `آية ${i + 1}`
    }));
    data = {
      code: 200,
      data: [
        { ayahs: fakeAyahs },
        { ayahs: fakeAyahs.map(a => ({ numberInSurah: a.numberInSurah, text: `${s ? s.en : 'Surah ' + n} Verse ${a.numberInSurah}` })) }
      ]
    };
  }

  const arabAyahs  = (data.data[0] && data.data[0].ayahs) || [];
  const transAyahs = (data.data[1] && data.data[1].ayahs) || [];
  PlayerState.totalAyahs = arabAyahs.length;

  PlayerState.ayahData = arabAyahs.map((a, i) => ({
    num: a.numberInSurah,
    arab: a.text,
    trans: transAyahs[i] ? transAyahs[i].text : '',
    isPerAyah: false
  }));

  _renderAyahList();
  if (_playerAyahInfo) _playerAyahInfo.textContent = `${arabAyahs.length} Ayahs`;

  // Stage or play from ayah 1
  playAyahAt(1, autoPlay);
}

function _renderAyahList() {
  if (!_ayahList) return;
  _ayahList.innerHTML = '';
  PlayerState.ayahData.forEach(a => {
    const el = document.createElement('div');
    el.className = 'ayah-item';
    el.id = `ayah-row-${a.num}`;
    el.setAttribute('data-ayah', a.num);
    el.innerHTML = `
      <div class="ayah-num">${_safeHTML(String(a.num))}</div>
      <div class="ayah-content">
        <div class="ayah-arab">${_safeHTML(a.arab)}</div>
        <div class="ayah-trans">${_safeHTML(a.trans)}</div>
      </div>
      <button class="ayah-play-btn" onclick="playAyahAt(${Number(a.num)}, true)" title="Play this ayah" aria-label="Play ayah ${_safeHTML(String(a.num))}">▶</button>`;
    el.addEventListener('click', (e) => {
      if (!e.target.closest('.ayah-play-btn')) playAyahAt(a.num, true);
    });
    _ayahList.appendChild(el);
  });
}

// ── Per-Ayah & Full-Surah Playback ─────────────────────────────────────────
function playAyahAt(ayahNum, autoPlay = true) {
  if (!PlayerState.ayahData.length) return;
  const ayah = PlayerState.ayahData.find(a => a.num === ayahNum) || PlayerState.ayahData[0];
  if (!ayah || !_aud) return;

  PlayerState.ayahNum = ayah.num;
  const surahStr = String(PlayerState.surahNum).padStart(3, '0');
  const urls = _getReciterSurahUrls(PlayerState.surahNum);

  if (!urls.length) {
    if (_playerSurahName) _playerSurahName.textContent = '⚠ Audio unavailable';
    return;
  }

  const currentSrc = _aud.src || '';
  const isAlreadyLoaded = currentSrc.includes(surahStr + '.mp3');

  if (!isAlreadyLoaded) {
    const onMeta = () => {
      _aud.removeEventListener('loadedmetadata', onMeta);
      _ensureTimings();
      if (PlayerState.ayahTimings) {
        const timing = PlayerState.ayahTimings.find(t => t.num === ayah.num);
        if (timing && timing.start) _aud.currentTime = timing.start;
      }
    };
    _aud.addEventListener('loadedmetadata', onMeta);

    if (autoPlay) {
      _playWithCascade(urls, () => {
        _updatePlayBtn(false);
        if (_playerSurahName) _playerSurahName.textContent = '⚠ Audio unavailable';
      });
    } else {
      _currentFallbackUrls = urls;
      _currentFallbackIdx = 1;
      _aud.src = urls[0];
      _aud.playbackRate = PlayerState.speed;
      _aud.volume = PlayerState.volume;
      PlayerState.isPlaying = false;
      _updatePlayBtn(false);
    }
  } else {
    _ensureTimings();
    if (PlayerState.ayahTimings) {
      const timing = PlayerState.ayahTimings.find(t => t.num === ayah.num);
      if (timing && timing.start) _aud.currentTime = timing.start;
    }
    if (autoPlay) {
      if (_aud.paused) {
        _aud.play().catch(err => console.debug(err));
      }
      PlayerState.isPlaying = true;
      _updatePlayBtn(true);
    }
  }

  _highlightAyah(ayah.num);
  _updateBotBarLabel();
  _updateNavButtons();
  if (autoPlay) {
    _updatePlayBtn(true);
    PlayerState.isPlaying = true;
  }
}

function _highlightAyah(num) {
  document.querySelectorAll('.ayah-item').forEach(el => el.classList.remove('active'));
  const el = document.getElementById(`ayah-row-${num}`);
  if (el) {
    el.classList.add('active');
    const container = document.getElementById('ayahList');
    if (container) {
      const elRect = el.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      const isVisible = (elRect.top >= contRect.top) && (elRect.bottom <= contRect.bottom);
      if (!isVisible) {
        const offsetToTop = elRect.top - contRect.top;
        const targetScrollTop = container.scrollTop + offsetToTop - (container.clientHeight / 2) + (elRect.height / 2);
        container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

function _updateBotBarLabel() {
  const s = (typeof SURAHS !== 'undefined' ? SURAHS : []).find(x => x.n === PlayerState.surahNum);
  const label = s ? `Surah ${PlayerState.surahNum} — ${s.en}` : `Surah ${PlayerState.surahNum}`;
  const info  = `Ayah ${PlayerState.ayahNum} / ${PlayerState.totalAyahs}`;
  const asnEl = document.getElementById('asn');
  if (asnEl) asnEl.textContent = label;
  if (_playerAyahInfo) _playerAyahInfo.textContent = info;
}

function _updateNavButtons() {
  const atStart = PlayerState.surahNum <= 1 && PlayerState.ayahNum <= 1;
  const atEnd   = PlayerState.surahNum >= 114 && PlayerState.ayahNum >= PlayerState.totalAyahs;
  if (_prevBtn) _prevBtn.disabled = atStart;
  if (_nextBtn) _nextBtn.disabled = atEnd;
}

// ── Controls ──────────────────────────────────────────────────────────────
function playPrev() {
  const avail = _getAvailableSurahsSync();
  const idx = avail.findIndex(s => s.n === PlayerState.surahNum);
  if (idx > 0) { loadSurahAyahs(avail[idx - 1].n, true); }
}

function playNext() {
  const nextSurah = _getNextSurah(PlayerState.surahNum);
  if (nextSurah) { loadSurahAyahs(nextSurah, true); }
}

function togPlayReciter() {
  if (!_aud) return;
  if (!_aud.src || _aud.src === window.location.href) {
    const avail = _getAvailableSurahsSync();
    if (avail && avail.length > 0) {
      loadSurahAyahs(avail[0].n, true);
    }
    return;
  }
  if (_aud.paused) { 
    const p = _aud.play();
    if (p !== undefined) {
      p.then(() => {
        PlayerState.isPlaying = true;
        _updatePlayBtn(true);
      }).catch(err => {
        console.debug('Play rejected, cascading...', err);
        if (_currentFallbackIdx < _currentFallbackUrls.length) {
          const nextUrl = _currentFallbackUrls[_currentFallbackIdx++];
          _aud.src = nextUrl;
          _aud.play().catch(e => console.debug(e));
        }
      });
    }
    PlayerState.isPlaying = true; 
    _updatePlayBtn(true);
  } else { 
    _aud.pause(); 
    PlayerState.isPlaying = false; 
    _updatePlayBtn(false);
  }
}

function stopReciter() {
  if (_aud) { _aud.pause(); _aud.currentTime = 0; }
  PlayerState.isPlaying = false;
  _updatePlayBtn(false);
  _resetSliders();
}

function closePlayerBar() {
  stopReciter();
  if (_abar) _abar.classList.remove('show');
}

function setVolume() {
  if (!_aud || !_volSlider) return;
  PlayerState.volume = _volSlider.value / 100;
  _aud.volume = PlayerState.volume;
  if (_volIcon) _volIcon.textContent = PlayerState.volume === 0 ? '🔇' : PlayerState.volume < 0.4 ? '🔉' : '🔊';
}

function toggleMute() {
  if (!_aud) return;
  _aud.muted = !_aud.muted;
  if (_volIcon) _volIcon.textContent = _aud.muted ? '🔇' : '🔊';
}

function cycleSpeed() {
  const speeds = [0.75, 1, 1.25, 1.5];
  const idx = speeds.indexOf(PlayerState.speed);
  PlayerState.speed = speeds[(idx + 1) % speeds.length];
  if (_aud) _aud.playbackRate = PlayerState.speed;
  if (_speedBtn) _speedBtn.textContent = PlayerState.speed + '×';
}

function toggleRepeat() {
  PlayerState.repeatMode = !PlayerState.repeatMode;
  if (_repeatBtn) {
    _repeatBtn.classList.toggle('active', PlayerState.repeatMode);
    _repeatBtn.title = PlayerState.repeatMode ? 'Repeat: ON' : 'Repeat: OFF';
  }
}

function seekFromPlayer() {
  if (!_aud || !_seekSliderP || !_aud.duration) return;
  _aud.currentTime = (_seekSliderP.value / 100) * _aud.duration;
  _updateSliderTrack(_seekSliderP, _seekSliderP.value);
}

function seekFromBar() {
  if (!_aud || !_seekSliderB || !_aud.duration) return;
  _aud.currentTime = (_seekSliderB.value / 100) * _aud.duration;
}

// ── Pseudo-timings for full-surah MP3s ─────────────────────────────────────
function _ensureTimings() {
   if (PlayerState.ayahTimings || !_aud || !_aud.duration || isNaN(_aud.duration) || !PlayerState.ayahData.length) return;
   const totalChars = PlayerState.ayahData.reduce((acc, a) => acc + (a.arab ? a.arab.length : 10), 0);
   let timeAcc = 0;
   PlayerState.ayahTimings = PlayerState.ayahData.map(a => {
      const chars = a.arab ? a.arab.length : 10;
      const duration = (chars / totalChars) * _aud.duration;
      const start = timeAcc;
      timeAcc += duration;
      return { num: a.num, start, end: timeAcc };
   });
}

// ── Audio events ───────────────────────────────────────────────────────────
function _onTimeUpdate() {
  if (!_aud || PlayerState.isSeeking) return;
  const cur = _aud.currentTime || 0;
  const dur = _aud.duration || 0;
  const p = dur > 0 ? (cur / dur) * 100 : 0;
  _updateSliders(p);
  const now = _fmtTime(cur);
  if (_timeNow)  _timeNow.textContent  = now;
  if (_timeNowB) _timeNowB.textContent = now;

  if (dur > 0) {
    const durStr = _fmtTime(dur);
    if (_timeDur && (_timeDur.textContent === '0:00' || !_timeDur.textContent)) _timeDur.textContent = durStr;
    if (_timeDurB && (_timeDurB.textContent === '0:00' || !_timeDurB.textContent)) _timeDurB.textContent = durStr;
  }

  // Auto-scroll ayah for full-surah MP3s
  if (dur > 0) {
    _ensureTimings();
    if (PlayerState.ayahTimings && !PlayerState.isSeeking) {
       const currentAyah = PlayerState.ayahTimings.find(t => cur >= t.start && cur < t.end);
       if (currentAyah && currentAyah.num !== PlayerState.ayahNum) {
         PlayerState.ayahNum = currentAyah.num;
         _highlightAyah(currentAyah.num);
         if (_playerAyahInfo) {
           _playerAyahInfo.textContent = `Ayah ${currentAyah.num} / ${PlayerState.totalAyahs}`;
         }
       }
    }
  }
}

function _onMeta() {
  if (!_aud || !_aud.duration || isNaN(_aud.duration)) return;
  const dur = _fmtTime(_aud.duration);
  if (_timeDur)  _timeDur.textContent  = dur;
  if (_timeDurB) _timeDurB.textContent = dur;
}

function _getNextSurah(currentNum) {
  const avail = _getAvailableSurahsSync();
  const idx = avail.findIndex(s => s.n === currentNum);
  if (idx !== -1 && idx < avail.length - 1) {
    return avail[idx + 1].n;
  }
  return null;
}

function _onEnded() {
  if (PlayerState.repeatMode) {
    if (_aud) { 
      _aud.currentTime = 0; 
      _aud.play().catch(err => console.debug(err)); 
    }
    return;
  }
  const nextSurah = _getNextSurah(PlayerState.surahNum);
  if (nextSurah) {
    setTimeout(() => loadSurahAyahs(nextSurah, true), 1000);
  } else {
    _updatePlayBtn(false); 
    PlayerState.isPlaying = false;
  }
}

function _onError() {
  if (!_aud || !_aud.src || _aud.src === window.location.href) return;
  // If there are fallbacks left in cascade, attempt next
  if (_currentFallbackIdx < _currentFallbackUrls.length) {
    const nextUrl = _currentFallbackUrls[_currentFallbackIdx++];
    _aud.src = nextUrl;
    _aud.load();
    _aud.play().catch(err => console.debug(err));
  } else {
    if (_playerSurahName) _playerSurahName.textContent = '⚠ Audio unavailable';
    _updatePlayBtn(false);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function _updatePlayBtn(playing) {
  const icon = playing ? '⏸' : '▶';
  if (_playerPlayBtn) _playerPlayBtn.textContent = icon;
  if (_plbtn)         _plbtn.textContent         = icon;
}

function _updateSliders(p) {
  p = Math.min(100, Math.max(0, p || 0));
  if (_seekSliderP && !PlayerState.isSeeking) {
    _seekSliderP.value = p;
    _updateSliderTrack(_seekSliderP, p);
  }
  if (_seekSliderB && !PlayerState.isSeeking) {
    _seekSliderB.value = p;
  }
}

function _updateSliderTrack(slider, p) {
  if (slider) {
    slider.style.background = `linear-gradient(to right, var(--gold, #d4a017) ${p}%, rgba(212,160,23,0.18) ${p}%)`;
  }
}

function _resetSliders() {
  _updateSliders(0);
  if (_timeNow)  _timeNow.textContent  = '0:00';
  if (_timeDur)  _timeDur.textContent  = '0:00';
  if (_timeNowB) _timeNowB.textContent = '0:00';
  if (_timeDurB) _timeDurB.textContent = '0:00';
}

function _fmtTime(s) {
  if (!s || isNaN(s) || s < 0) return '0:00';
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}:${remMins < 10 ? '0' : ''}${remMins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// ── Global Window Exports ──────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.playAyahAt = playAyahAt;
  window.loadSurahAyahs = loadSurahAyahs;
  window.togPlayReciter = togPlayReciter;
  window.stopReciter = stopReciter;
  window.closePlayerBar = closePlayerBar;
  window.setVolume = setVolume;
  window.toggleMute = toggleMute;
  window.cycleSpeed = cycleSpeed;
  window.toggleRepeat = toggleRepeat;
  window.seekFromPlayer = seekFromPlayer;
  window.seekFromBar = seekFromBar;
  window.filterSurahs = filterSurahs;
  window.playPrev = playPrev;
  window.playNext = playNext;
}

// ── Global Init ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (_isInit) return;
  _isInit = true;

  _initRefs();
  buildSurahGrid();

  // Auto-stage first available Surah on open (without autoPlay to prevent browser block)
  setTimeout(() => {
    const avail = _getAvailableSurahsSync();
    if (avail && avail.length > 0) {
      loadSurahAyahs(avail[0].n, false);
    }
  }, 300);
});
