/**
 * reciter-player.js — Enhanced Per-Ayah Quran Player
 * Noor Al-Quran — Shared player logic for all reciter pages
 */

/* globals RECITER_ID, RECITER_SERVER, SURAHS */

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
};

// ── DOM refs ──────────────────────────────────────────────────────────────
let _aud, _playerSurahName, _playerSurahAr, _playerAyahInfo,
    _playerPlayBtn, _plbtn, _prevBtn, _nextBtn,
    _seekSliderP, _seekSliderB, _timeNow, _timeDur, _timeNowB, _timeDurB,
    _volSlider, _volIcon, _speedBtn, _repeatBtn,
    _ayahList, _abar;

let _isInit = false;

// ── ИСПРАВЛЕНО: добавлен Yasser ──────────
const EVERYAYAH_MAP = {
  abdulbasit:         'Abdul_Basit_Murattal_192kbps',
  ghamdi:             'Ghamadi_40kbps',
  minshawi:           'Minshawy_Murattal_128kbps',
  maher:              'MaherAlMuaiqly128kbps',
  mishary_alafasy:    'Alafasy_128kbps',
  yasser_dosari:      'Yasser_Ad-Dussary_128kbps',
};

const MOSSAD_MAP = {
  1: '001 Al-Fatiha الفاتحة.mp3',
  29: '029 Al-Ankabut العنكبوت.mp3',
  32: '032 As-Sajdah السجدة.mp3',
  49: '049 Al-Hujurat الحجرات.mp3',
  73: '073 Al-Muzzammil المزمل.mp3',
  78: '078 An-Naba النبأ.mp3',
  87: '087 Al-Ala الأعلى.mp3',
  88: '088 Al-Ghashiyah الغاشية.mp3',
  100: '100 Al-Adiyat العاديات.mp3',
  107: "107 Al-Ma'un الماعون.mp3",
};

const SHERIF_AVAILABLE = [
  13, 15, 19, 20, 31, 32, 53, 55, 56, 57, 
  60, 61, 62, 63, 64, 65, 66, 67, 71, 75, 
  76, 77, 89
];

// ── Fallback servers (full-surah MP3) ────────────────────────────────────
const FALLBACK_SERVERS = {
  yasser_dosari: [
    'https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/',
    'https://server11.mp3quran.net/yasser/',
  ],
  sherif_mostafa: [
    'https://corsproxy.io/?https://archive.org/download/Sherif-Mostafa/'
  ],
  abdurrahman_mossad: [
    'https://corsproxy.io/?https://archive.org/download/abdulrahman-mosad/'
  ]
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
    _aud.volume         = PlayerState.volume;
    _aud.ontimeupdate   = _onTimeUpdate;
    _aud.onloadedmetadata = _onMeta;
    _aud.onended        = _onEnded;
    _aud.onerror        = _onError;
  }
}

// ── Surah Grid ─────────────────────────────────────────────────────────────
async function buildSurahGrid() {
  const grid = document.getElementById('surahGrid');
  if (!grid || typeof SURAHS === 'undefined') return;
  
  let displaySurahs = SURAHS;

  if (RECITER_ID === 'sherif_mostafa' || RECITER_ID === 'abdurrahman_mossad') {
    displaySurahs = _getAvailableSurahsSync();
    grid.innerHTML = '';
    
    if (displaySurahs.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--soft); padding: 40px; font-size: 0.9rem; font-family: Lato, sans-serif;">No recordings found on the server. Please check the audio source URL.</div>';
      return;
    }
  } else {
    grid.innerHTML = '';
  }

  displaySurahs.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'surah-btn';
    btn.id = 'sb-' + s.n;
    btn.setAttribute('aria-label', `Surah ${s.n}: ${s.en}`);
    btn.innerHTML = `
      <div class="surah-num">${s.n}</div>
      <div class="surah-name">${s.en}</div>
      <div class="playing-badge">▶ PLAYING</div>`;
    btn.addEventListener('click', () => loadSurahAyahs(s.n));
    grid.appendChild(btn);
  });
}

function _getAvailableSurahsSync() {
  const valid = [];
  if (RECITER_ID === 'abdurrahman_mossad') {
    for (const n of Object.keys(MOSSAD_MAP)) {
      valid.push(Number(n));
    }
  } else if (RECITER_ID === 'sherif_mostafa') {
    for (const n of SHERIF_AVAILABLE) {
      valid.push(n);
    }
  }
  valid.sort((a,b) => a - b);
  return SURAHS.filter(s => valid.includes(s.n));
}

function filterSurahs(q) {
  const lq = q.toLowerCase().trim();
  document.querySelectorAll('.surah-btn').forEach(btn => {
    btn.style.display = !lq || btn.textContent.toLowerCase().includes(lq) ? '' : 'none';
  });
}

// ── Build ayah audio URL with fallback ──────────────────────────────────
function _buildAyahUrl(n, ayahNum) {
  const surahStr = String(n).padStart(3, '0');
  const ayahStr  = String(ayahNum).padStart(3, '0');
  const eaFolder = EVERYAYAH_MAP[RECITER_ID];

  if (eaFolder) {
    // Per-ayah from everyayah.com
    return `https://everyayah.com/data/${eaFolder}/${surahStr}${ayahStr}.mp3`;
  }
  if (RECITER_ID === 'abdurrahman_mossad' && MOSSAD_MAP[n]) {
    return (RECITER_SERVER || '') + encodeURIComponent(MOSSAD_MAP[n]);
  }
  // Full-surah fallback
  return (RECITER_SERVER || '') + surahStr + '.mp3';
}

// ── Load Surah Ayahs ───────────────────────────────────────────────────────
async function loadSurahAyahs(n) {
  PlayerState.surahNum = n;
  PlayerState.ayahNum  = 0;
  PlayerState.ayahData = [];

  const s = SURAHS.find(x => x.n === n);

  if (_playerSurahName) _playerSurahName.textContent = s ? s.en : `Surah ${n}`;
  if (_playerSurahAr)   _playerSurahAr.textContent   = s ? s.ar : '';
  if (_playerAyahInfo)  _playerAyahInfo.textContent   = 'Loading verses…';
  const _ayahPanelTitle = document.getElementById('ayahPanelTitle');
  if (_ayahPanelTitle)  _ayahPanelTitle.textContent   = s ? `Surah ${n} — ${s.en}` : `Surah ${n}`;

  document.querySelectorAll('.surah-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('sb-' + n);
  if (activeBtn) { activeBtn.classList.add('active'); activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }

  if (_abar) _abar.classList.add('show');

  if (_aud) { _aud.pause(); _aud.src = ''; }
  _updatePlayBtn(false);
  _resetSliders();

  if (_ayahList) _ayahList.innerHTML = '<div class="ayah-loading"><div class="ayah-spinner"></div><span>Loading Surah…</span></div>';

  try {
    const res  = await fetch(`https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,en.asad`);
    const data = await res.json();
    if (data.code !== 200) throw new Error('API error');

    const arabAyahs  = data.data[0].ayahs;
    const transAyahs = data.data[1].ayahs;
    PlayerState.totalAyahs = arabAyahs.length;

    const surahStr = String(n).padStart(3, '0');
    const eaFolder = EVERYAYAH_MAP[RECITER_ID];

    PlayerState.ayahData = arabAyahs.map((a, i) => {
      const ayahStr  = String(a.numberInSurah).padStart(3, '0');
      let audioUrl;
      if (eaFolder) {
        audioUrl = `https://everyayah.com/data/${eaFolder}/${surahStr}${ayahStr}.mp3`;
      } else if (RECITER_ID === 'abdurrahman_mossad' && MOSSAD_MAP[n]) {
        audioUrl = (RECITER_SERVER || '') + encodeURIComponent(MOSSAD_MAP[n]);
      } else {
        audioUrl = (RECITER_SERVER || '') + surahStr + '.mp3';
      }
      return {
        num:       a.numberInSurah,
        arab:      a.text,
        trans:     transAyahs[i] ? transAyahs[i].text : '',
        audio:     audioUrl,
        isPerAyah: !!eaFolder,
      };
    });

    _renderAyahList();
    if (_playerAyahInfo) _playerAyahInfo.textContent = `${arabAyahs.length} Ayahs`;

    playAyahAt(1);

  } catch (err) {
    console.error('Failed to load surah:', err);
    if (_ayahList) _ayahList.innerHTML = '<div class="ayah-error">⚠ Failed to load. Check your connection.</div>';
    if (_playerSurahName) _playerSurahName.textContent = '⚠ Load failed — try again';
  }
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
        <div class="ayah-arab">${a.arab}</div>
        <div class="ayah-trans">${a.trans}</div>
      </div>
      <button class="ayah-play-btn" onclick="playAyahAt(${a.num})" title="Play this ayah">▶</button>`;
    el.addEventListener('click', (e) => {
      if (!e.target.closest('.ayah-play-btn')) playAyahAt(a.num);
    });
    _ayahList.appendChild(el);
  });
}

// ── Per-Ayah Playback ───────────────────────────────────────────────────────
function playAyahAt(ayahNum) {
  if (!PlayerState.ayahData.length) return;
  const ayah = PlayerState.ayahData.find(a => a.num === ayahNum);
  if (!ayah || !_aud) return;

  PlayerState.ayahNum = ayahNum;
  _aud.src = ayah.audio;
  _aud.playbackRate = PlayerState.speed;
  _aud.volume = PlayerState.volume;

  // Try play, with fallback servers for sherif_mostafa
  const playWithFallback = (urlList, index) => {
    if (index >= urlList.length) {
      console.warn('All audio sources failed for', RECITER_ID);
      _updatePlayBtn(false);
      if (_playerSurahName) _playerSurahName.textContent = '⚠ Audio unavailable';
      return;
    }
    _aud.src = urlList[index];
    _aud.load();
    _aud.play().catch(() => {
      playWithFallback(urlList, index + 1);
    });
  };

  if (ayah.isPerAyah) {
    const surahStr = String(PlayerState.surahNum).padStart(3, '0');
    const ayahStr  = String(ayahNum).padStart(3, '0');
    const eaFolder = EVERYAYAH_MAP[RECITER_ID];
    const fallbacks = FALLBACK_SERVERS[RECITER_ID] || [];
    const urls = [ayah.audio];
    fallbacks.forEach(srv => {
      if (!srv.includes('everyayah')) {
        urls.push(srv + surahStr + '.mp3');
      } else {
        urls.push(`${srv}${surahStr}${ayahStr}.mp3`);
      }
    });
    playWithFallback(urls, 0);
  } else {
    const fallbacks = FALLBACK_SERVERS[RECITER_ID] || [];
    const urls = [ayah.audio];
    const surahStr = String(PlayerState.surahNum).padStart(3, '0');
    fallbacks.forEach(srv => {
      if (RECITER_ID === 'abdurrahman_mossad' && MOSSAD_MAP[PlayerState.surahNum]) {
        urls.push(srv + encodeURIComponent(MOSSAD_MAP[PlayerState.surahNum]));
      } else {
        urls.push(srv + surahStr + '.mp3');
      }
    });
    playWithFallback(urls, 0);
  }

  _highlightAyah(ayahNum);
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
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function _updateBotBarLabel() {
  const s = SURAHS.find(x => x.n === PlayerState.surahNum);
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
  if (PlayerState.ayahNum > 1) { playAyahAt(PlayerState.ayahNum - 1); return; }
  if (PlayerState.surahNum > 1) { loadSurahAyahs(PlayerState.surahNum - 1); }
}

function playNext() {
  if (PlayerState.ayahNum < PlayerState.totalAyahs) { playAyahAt(PlayerState.ayahNum + 1); return; }
  if (PlayerState.surahNum < 114) { loadSurahAyahs(PlayerState.surahNum + 1); }
}

function togPlayReciter() {
  if (!_aud) return;
  if (!_aud.src || _aud.src === window.location.href) {
    // Nothing loaded yet — load first ayah of first surah
    if (SURAHS && SURAHS.length) loadSurahAyahs(1);
    return;
  }
  if (_aud.paused) { _aud.play().catch(() => {}); PlayerState.isPlaying = true; }
  else { _aud.pause(); PlayerState.isPlaying = false; }
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
  _aud.currentTime = _seekSliderP.value / 100 * _aud.duration;
  _updateSliderTrack(_seekSliderP, _seekSliderP.value);
}

function seekFromBar() {
  if (!_aud || !_seekSliderB || !_aud.duration) return;
  _aud.currentTime = _seekSliderB.value / 100 * _aud.duration;
}

// ── Audio events ───────────────────────────────────────────────────────────
function _onTimeUpdate() {
  if (!_aud || PlayerState.isSeeking) return;
  const p = _aud.duration ? _aud.currentTime / _aud.duration * 100 : 0;
  _updateSliders(p);
  const now = _fmtTime(_aud.currentTime);
  if (_timeNow) _timeNow.textContent = now;
  if (_timeNowB) _timeNowB.textContent = now;
}

function _onMeta() {
  if (!_aud) return;
  const dur = _fmtTime(_aud.duration);
  if (_timeDur)  _timeDur.textContent  = dur;
  if (_timeDurB) _timeDurB.textContent = dur;
}

function _onEnded() {
  if (PlayerState.repeatMode) {
    if (_aud) { _aud.currentTime = 0; _aud.play().catch(() => {}); }
    return;
  }
  const ayah = PlayerState.ayahData[PlayerState.ayahNum - 1];
  if (ayah && ayah.isPerAyah) {
    if (PlayerState.ayahNum < PlayerState.totalAyahs) {
      setTimeout(() => playAyahAt(PlayerState.ayahNum + 1), 600);
    } else if (PlayerState.surahNum < 114) {
      setTimeout(() => loadSurahAyahs(PlayerState.surahNum + 1), 1000);
    } else {
      _updatePlayBtn(false); PlayerState.isPlaying = false;
    }
  } else {
    if (PlayerState.surahNum < 114) {
      setTimeout(() => loadSurahAyahs(PlayerState.surahNum + 1), 1000);
    } else {
      _updatePlayBtn(false); PlayerState.isPlaying = false;
    }
  }
}

function _onError() {
  console.warn('Audio error for reciter:', RECITER_ID, 'ayah:', PlayerState.ayahNum);
  
  const fallbacks = FALLBACK_SERVERS[RECITER_ID] || [];
  if (fallbacks.length > 0) {
    return; // Let playWithFallback's .catch() handle it
  }

  const ayah = PlayerState.ayahData[PlayerState.ayahNum - 1];
  
  if (ayah && !ayah.isPerAyah) {
    if (_playerSurahName) _playerSurahName.textContent = '⚠ Audio unavailable';
    _updatePlayBtn(false);
    return;
  }

  // Try next ayah after short delay
  if (PlayerState.ayahNum < PlayerState.totalAyahs) {
    setTimeout(() => playAyahAt(PlayerState.ayahNum + 1), 800);
  } else {
    if (_playerSurahName) _playerSurahName.textContent = '⚠ Audio unavailable';
    _updatePlayBtn(false);
  }
}

// ── UI helpers ──────────────────────────────────────────────────────────────
function _updatePlayBtn(playing) {
  const icon = playing ? '⏸' : '▶';
  if (_playerPlayBtn) _playerPlayBtn.textContent = icon;
  if (_plbtn)         _plbtn.textContent = icon;
}

function _updateSliders(p) {
  if (_seekSliderP && !PlayerState.isSeeking) { _seekSliderP.value = p; _updateSliderTrack(_seekSliderP, p); }
  if (_seekSliderB) _seekSliderB.value = p;
}

function _updateSliderTrack(slider, p) {
  slider.style.background = `linear-gradient(to right, var(--gold) ${p}%, rgba(212,160,23,.18) ${p}%)`;
}

function _resetSliders() {
  _updateSliders(0);
  if (_timeNow)  _timeNow.textContent  = '0:00';
  if (_timeNowB) _timeNowB.textContent = '0:00';
  if (_timeDur)  _timeDur.textContent  = '0:00';
  if (_timeDurB) _timeDurB.textContent = '0:00';
}

function _fmtTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

// ── Seek drag UX ─────────────────────────────────────────────────────────────
function onSeekStart() { PlayerState.isSeeking = true; }
function onSeekEnd()   { PlayerState.isSeeking = false; }

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  _initRefs();
  buildSurahGrid();
  if (_volSlider) _volSlider.value = PlayerState.volume * 100;
});
