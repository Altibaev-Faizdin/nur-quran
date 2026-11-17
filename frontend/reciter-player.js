/**
 * reciter-player.js — Enhanced Quran Audio Engine
 * Noor Al-Quran — Zero-failure player for all 10 reciters
 */

/* globals RECITER_ID, RECITER_SERVER, SURAHS, MOSSAD_AVAILABLE, SHERIF_AVAILABLE */

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

// ── 10 Reciters Audio Configurations & Fallbacks ──────────────────────────
const RECITER_AUDIO_CONFIG = {
  abdulbasit: {
    mode: 'per_ayah',
    everyayah: 'Abdul_Basit_Murattal_192kbps',
    servers: ['https://server7.mp3quran.net/basit/']
  },
  ghamdi: {
    mode: 'per_ayah',
    everyayah: 'Ghamadi_40kbps',
    servers: ['https://server7.mp3quran.net/s_gmd/']
  },
  minshawi: {
    mode: 'per_ayah',
    everyayah: 'Minshawy_Murattal_128kbps',
    servers: ['https://server10.mp3quran.net/minsh/']
  },
  maher: {
    mode: 'per_ayah',
    everyayah: 'MaherAlMuaiqly128kbps',
    servers: ['https://server12.mp3quran.net/maher/']
  },
  mishary_alafasy: {
    mode: 'per_ayah',
    everyayah: 'Alafasy_128kbps',
    servers: ['https://server8.mp3quran.net/afs/']
  },
  yasser_dosari: {
    mode: 'per_ayah',
    everyayah: 'Yasser_Ad-Dussary_128kbps',
    servers: ['https://server11.mp3quran.net/yasser/']
  },
  islam_sobhi: {
    mode: 'full_surah',
    servers: [
      'https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/',
      'https://download.quranplayermp3.com/quran/mix/Islam-Sobhi/'
    ]
  },
  raad_kurdi: {
    mode: 'full_surah',
    servers: [
      'https://server6.mp3quran.net/kurdi/',
      'https://download.quranplayermp3.com/quran/mix/Raad-Al-Kurdi/'
    ]
  },
  sherif_mostafa: {
    mode: 'full_surah',
    servers: [
      '../audio/sherif_mostafa/',
      'https://server6.mp3quran.net/shrf/',
      'https://download.quranplayermp3.com/quran/mix/Sherif-Mostafa/'
    ]
  },
  abdurrahman_mossad: {
    mode: 'full_surah',
    servers: [
      '../audio/abdurrahman_mossad/',
      'https://server16.mp3quran.net/mossad/',
      'https://download.quranplayermp3.com/quran/mix/Abdul-Rahman-Mosad/'
    ]
  }
};

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

// ── Surah Grid ─────────────────────────────────────────────────────────────
async function buildSurahGrid() {
  const grid = document.getElementById('surahGrid');
  if (!grid || typeof SURAHS === 'undefined') return;
  
  const displaySurahs = _getAvailableSurahsSync();
  grid.innerHTML = '';
  
  if (displaySurahs.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--soft); padding: 40px; font-size: 0.9rem; font-family: Lato, sans-serif;">No surahs found.</div>';
    return;
  }

  displaySurahs.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'surah-btn';
    btn.id = 'sb-' + s.n;
    btn.setAttribute('aria-label', `Surah ${s.n}: ${s.en}`);
    btn.innerHTML = `
      <div class="surah-num">${s.n}</div>
      <div class="surah-name">${safeHTML(s.en)}</div>
      <div class="playing-badge">▶ PLAYING</div>`;
    btn.addEventListener('click', () => loadSurahAyahs(s.n));
    grid.appendChild(btn);
  });
}

function _getAvailableSurahsSync() {
  if (typeof SURAHS === 'undefined') return [];
  if (typeof RECITER_ID === 'undefined') return SURAHS;

  if (RECITER_ID === 'abdurrahman_mossad') {
    const valid = [1, 10, 19, 23, 29, 32, 49, 73, 78, 87, 88, 100, 107];
    return SURAHS.filter(s => valid.includes(s.n));
  } else if (RECITER_ID === 'sherif_mostafa') {
    const valid = [1, 13, 15, 19, 20, 31, 32, 53, 55, 56, 57, 60, 61, 62, 63, 64, 65, 66, 67, 71, 75, 76, 77, 89];
    return SURAHS.filter(s => valid.includes(s.n));
  }
  return SURAHS; // All 114 surahs for all other 8 reciters!
}

function filterSurahs(q) {
  const lq = (q || '').toLowerCase().trim();
  document.querySelectorAll('.surah-btn').forEach(btn => {
    btn.style.display = !lq || btn.textContent.toLowerCase().includes(lq) ? '' : 'none';
  });
}

// ── Audio Cascading Fallback Player ───────────────────────────────────────
let _currentFallbackUrls = [];
let _currentFallbackIdx = 0;

function _playWithCascade(urls, onFail) {
  if (!urls || !urls.length) {
    if (onFail) onFail();
    return;
  }
  _currentFallbackUrls = urls;
  _currentFallbackIdx = 0;

  function attemptPlay() {
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
          PlayerState.isPlaying = true;
          _updatePlayBtn(true);
        })
        .catch(err => {
          console.debug('Audio stream failed: ' + targetUrl + ', trying mirror...', err);
          attemptPlay();
        });
    }
  }

  attemptPlay();
}

// ── Load Surah Ayahs ───────────────────────────────────────────────────────
async function loadSurahAyahs(n) {
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
  if (typeof window.fetchSurahData === 'function') {
    try {
      data = await window.fetchSurahData(n, 'en');
    } catch (e) {}
  }

  // 2. Direct fallback to alquran.cloud if fetchSurahData didn't return data
  if (!data || !data.data) {
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,en.asad`);
      if (res.ok) data = await res.json();
    } catch (e) {}
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

  const cfg = (typeof RECITER_ID !== 'undefined' && RECITER_AUDIO_CONFIG[RECITER_ID]) 
              ? RECITER_AUDIO_CONFIG[RECITER_ID] 
              : { mode: 'full_surah', servers: [typeof RECITER_SERVER !== 'undefined' ? RECITER_SERVER : ''] };
  const isPerAyah = cfg.mode === 'per_ayah';

  PlayerState.ayahData = arabAyahs.map((a, i) => ({
    num: a.numberInSurah,
    arab: a.text,
    trans: transAyahs[i] ? transAyahs[i].text : '',
    isPerAyah: isPerAyah
  }));

  _renderAyahList();
  if (_playerAyahInfo) _playerAyahInfo.textContent = `${arabAyahs.length} Ayahs`;

  // Start playback from ayah 1
  playAyahAt(1);
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
      <div class="ayah-num">${a.num}</div>
      <div class="ayah-content">
        <div class="ayah-arab">${safeHTML(a.arab)}</div>
        <div class="ayah-trans">${safeHTML(a.trans)}</div>
      </div>
      <button class="ayah-play-btn" onclick="playAyahAt(${a.num})" title="Play this ayah" aria-label="Play ayah ${a.num}">▶</button>`;
    el.addEventListener('click', (e) => {
      if (!e.target.closest('.ayah-play-btn')) playAyahAt(a.num);
    });
    _ayahList.appendChild(el);
  });
}

// ── Per-Ayah & Full-Surah Playback ─────────────────────────────────────────
function playAyahAt(ayahNum) {
  if (!PlayerState.ayahData.length) return;
  const ayah = PlayerState.ayahData.find(a => a.num === ayahNum) || PlayerState.ayahData[0];
  if (!ayah || !_aud) return;

  PlayerState.ayahNum = ayah.num;
  const surahStr = String(PlayerState.surahNum).padStart(3, '0');
  const ayahStr  = String(ayah.num).padStart(3, '0');
  const cfg = (typeof RECITER_ID !== 'undefined' && RECITER_AUDIO_CONFIG[RECITER_ID]) 
              ? RECITER_AUDIO_CONFIG[RECITER_ID] 
              : { mode: 'full_surah', servers: [typeof RECITER_SERVER !== 'undefined' ? RECITER_SERVER : ''] };

  if (cfg.mode === 'per_ayah') {
    const urls = [
      `https://everyayah.com/data/${cfg.everyayah}/${surahStr}${ayahStr}.mp3`
    ];
    if (cfg.servers) {
      cfg.servers.forEach(srv => urls.push(srv + surahStr + '.mp3'));
    }
    _playWithCascade(urls, () => {
      _updatePlayBtn(false);
      if (_playerSurahName) _playerSurahName.textContent = '⚠ Audio unavailable';
    });
  } else {
    // Full surah mode
    const urls = (cfg.servers || []).map(srv => srv + surahStr + '.mp3');
    if (!_aud.src || !_aud.src.includes(surahStr + '.mp3')) {
      _playWithCascade(urls, () => {
        _updatePlayBtn(false);
        if (_playerSurahName) _playerSurahName.textContent = '⚠ Audio unavailable';
      });
      const onMeta = () => {
        _aud.removeEventListener('loadedmetadata', onMeta);
        _ensureTimings();
        if (PlayerState.ayahTimings) {
          const timing = PlayerState.ayahTimings.find(t => t.num === ayah.num);
          if (timing && timing.start) _aud.currentTime = timing.start;
        }
      };
      _aud.addEventListener('loadedmetadata', onMeta);
    } else {
      _ensureTimings();
      if (PlayerState.ayahTimings) {
        const timing = PlayerState.ayahTimings.find(t => t.num === ayah.num);
        if (timing && timing.start) _aud.currentTime = timing.start;
      }
      if (_aud.paused) {
        _aud.play().catch(err => console.debug(err));
        PlayerState.isPlaying = true;
        _updatePlayBtn(true);
      }
    }
  }

  _highlightAyah(ayah.num);
  _updateBotBarLabel();
  _updateNavButtons();
  _updatePlayBtn(true);
  PlayerState.isPlaying = true;
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
  const cfg = (typeof RECITER_ID !== 'undefined' && RECITER_AUDIO_CONFIG[RECITER_ID]) ? RECITER_AUDIO_CONFIG[RECITER_ID] : { mode: 'full_surah' };
  if (cfg.mode === 'per_ayah' && PlayerState.ayahNum > 1) { 
    playAyahAt(PlayerState.ayahNum - 1); 
    return; 
  }
  const avail = _getAvailableSurahsSync();
  const idx = avail.findIndex(s => s.n === PlayerState.surahNum);
  if (idx > 0) { loadSurahAyahs(avail[idx - 1].n); }
}

function playNext() {
  const cfg = (typeof RECITER_ID !== 'undefined' && RECITER_AUDIO_CONFIG[RECITER_ID]) ? RECITER_AUDIO_CONFIG[RECITER_ID] : { mode: 'full_surah' };
  if (cfg.mode === 'per_ayah' && PlayerState.ayahNum < PlayerState.totalAyahs) { 
    playAyahAt(PlayerState.ayahNum + 1); 
    return; 
  }
  const nextSurah = _getNextSurah(PlayerState.surahNum);
  if (nextSurah) { loadSurahAyahs(nextSurah); }
}

function togPlayReciter() {
  if (!_aud) return;
  if (!_aud.src || _aud.src === window.location.href) {
    const avail = _getAvailableSurahsSync();
    if (avail && avail.length > 0) {
      loadSurahAyahs(avail[0].n);
    }
    return;
  }
  if (_aud.paused) { 
    _aud.play().catch(err => console.debug(err)); 
    PlayerState.isPlaying = true; 
  } else { 
    _aud.pause(); 
    PlayerState.isPlaying = false; 
  }
  _updatePlayBtn(!_aud.paused);
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
  const cfg = (typeof RECITER_ID !== 'undefined' && RECITER_AUDIO_CONFIG[RECITER_ID]) ? RECITER_AUDIO_CONFIG[RECITER_ID] : { mode: 'full_surah' };
  if (cfg.mode === 'full_surah' && dur > 0) {
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
  const cfg = (typeof RECITER_ID !== 'undefined' && RECITER_AUDIO_CONFIG[RECITER_ID]) ? RECITER_AUDIO_CONFIG[RECITER_ID] : { mode: 'full_surah' };
  if (cfg.mode === 'per_ayah') {
    if (PlayerState.ayahNum < PlayerState.totalAyahs) {
      setTimeout(() => playAyahAt(PlayerState.ayahNum + 1), 600);
    } else {
      const nextSurah = _getNextSurah(PlayerState.surahNum);
      if (nextSurah) {
        setTimeout(() => loadSurahAyahs(nextSurah), 1000);
      } else {
        _updatePlayBtn(false); 
        PlayerState.isPlaying = false;
      }
    }
  } else {
    // Full surah mode ended -> play next surah!
    const nextSurah = _getNextSurah(PlayerState.surahNum);
    if (nextSurah) {
      setTimeout(() => loadSurahAyahs(nextSurah), 1000);
    } else {
      _updatePlayBtn(false); 
      PlayerState.isPlaying = false;
    }
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

// ── Global Init ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (_isInit) return;
  _isInit = true;

  _initRefs();
  buildSurahGrid();

  // Auto-load Surah Al-Fatiha on open!
  setTimeout(() => {
    const avail = _getAvailableSurahsSync();
    if (avail && avail.length > 0) {
      loadSurahAyahs(avail[0].n);
    }
  }, 300);
});
