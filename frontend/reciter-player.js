/**
 * reciter-player.js — Enhanced Per-Ayah Quran Player
 * Noor Al-Quran — Shared player logic for all reciter pages
 *
 * Features:
 *  - Per-ayah audio playback via alquran.cloud API
 *  - Automatic verse highlighting with smooth scroll
 *  - Playback speed control (0.75×, 1×, 1.25×, 1.5×)
 *  - Repeat toggle
 *  - Volume & seek controls
 *  - Auto-advance to next ayah / next surah
 */

/* globals RECITER_ID, RECITER_SERVER, SURAHS */

'use strict';

// ── State ──────────────────────────────────────────────────────────────────
const PlayerState = {
  surahNum:    0,
  ayahNum:     0,
  totalAyahs:  0,
  ayahData:    [],      // [{numberInSurah, text, audio}]
  isPlaying:   false,
  isSeeking:   false,
  repeatMode:  false,
  speed:       1,
  volume:      0.85,
};

// ── DOM refs (resolved after DOMContentLoaded) ──────────────────────────────
let _aud, _playerSurahName, _playerSurahAr, _playerAyahInfo,
    _playerPlayBtn, _plbtn, _prevBtn, _nextBtn,
    _seekSliderP, _seekSliderB, _timeNow, _timeDur, _timeNowB, _timeDurB,
    _volSlider, _volIcon, _speedBtn, _repeatBtn,
    _ayahList, _abar;

let _isInit = false;

// Map for reciters that support per-ayah playback via everyayah.com
const EVERYAYAH_MAP = {
  abdulbasit: 'Abdul_Basit_Murattal_192kbps',
  ghamdi: 'Ghamadi_40kbps',
  minshawi: 'Minshawy_Murattal_128kbps',
  maher: 'MaherAlMuaiqly128kbps',
  yasser_dosari: 'Yasser_Ad-Dussary_128kbps'
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
    _aud.volume  = PlayerState.volume;
    _aud.ontimeupdate  = _onTimeUpdate;
    _aud.onloadedmetadata = _onMeta;
    _aud.onended   = _onEnded;
    _aud.onerror   = _onError;
  }
}

// ── Surah Grid ─────────────────────────────────────────────────────────────
function buildSurahGrid() {
  const grid = document.getElementById('surahGrid');
  if (!grid || typeof SURAHS === 'undefined') return;
  grid.innerHTML = '';
  SURAHS.forEach(s => {
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

function filterSurahs(q) {
  const lq = q.toLowerCase().trim();
  document.querySelectorAll('.surah-btn').forEach(btn => {
    btn.style.display = !lq || btn.textContent.toLowerCase().includes(lq) ? '' : 'none';
  });
}

// ── Load Surah Ayahs ────────────────────────────────────────────────────────
async function loadSurahAyahs(n) {
  PlayerState.surahNum = n;
  PlayerState.ayahNum  = 0;
  PlayerState.ayahData = [];

  const s = SURAHS.find(x => x.n === n);

  // Update player header
  if (_playerSurahName) _playerSurahName.textContent = s ? s.en : `Surah ${n}`;
  if (_playerSurahAr)   _playerSurahAr.textContent   = s ? s.ar : '';
  if (_playerAyahInfo)  _playerAyahInfo.textContent   = 'Loading verses…';
  const _ayahPanelTitle = document.getElementById('ayahPanelTitle');
  if (_ayahPanelTitle)  _ayahPanelTitle.textContent   = s ? `Surah ${n} — ${s.en}` : `Surah ${n}`;

  // Highlight active surah button
  document.querySelectorAll('.surah-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('sb-' + n);
  if (activeBtn) { activeBtn.classList.add('active'); activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }

  // Show bottom bar
  if (_abar) _abar.classList.add('show');

  // Reset audio
  if (_aud) { _aud.pause(); _aud.src = ''; }
  _updatePlayBtn(false);
  _resetSliders();

  // Build ayah list UI (skeleton)
  _buildAyahListSkeleton(n);

  // Fetch ayah data
  try {
    const res   = await fetch(`https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,en.asad`);
    const data  = await res.json();
    if (data.code !== 200) throw new Error('API error');

    const arabAyahs   = data.data[0].ayahs;
    const transAyahs  = data.data[1].ayahs;
    PlayerState.totalAyahs = arabAyahs.length;

    const eaFolder = EVERYAYAH_MAP[RECITER_ID];
    const surahStr = String(n).padStart(3, '0');

    PlayerState.ayahData = arabAyahs.map((a, i) => {
      const ayahStr = String(a.numberInSurah).padStart(3, '0');
      const isPerAyah = !!eaFolder;
      const audioUrl = isPerAyah 
        ? `https://everyayah.com/data/${eaFolder}/${surahStr}${ayahStr}.mp3`
        : `${RECITER_SERVER}${surahStr}.mp3`;

      return {
        num:    a.numberInSurah,
        arab:   a.text,
        trans:  transAyahs[i]?.text || '',
        audio:  audioUrl,
        isPerAyah: isPerAyah
      };
    });

    _renderAyahList();
    if (_playerAyahInfo) _playerAyahInfo.textContent = `${arabAyahs.length} Ayahs`;

    // Auto-play first ayah
    playAyahAt(1);

  } catch (err) {
    console.error('Failed to load surah:', err);
    if (_ayahList) _ayahList.innerHTML = '<div class="ayah-error">⚠ Failed to load. Check your connection.</div>';
    if (_playerSurahName) _playerSurahName.textContent = '⚠ Load failed — try again';
  }
}

function _buildAyahListSkeleton(n) {
  if (!_ayahList) return;
  _ayahList.innerHTML = '<div class="ayah-loading"><div class="ayah-spinner"></div><span>Loading Surah…</span></div>';
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

  if (ayah.isPerAyah) {
    _aud.src = ayah.audio;
    _aud.playbackRate = PlayerState.speed;
    _aud.volume = PlayerState.volume;
    _aud.play().catch(e => console.warn('Audio play error:', e));
  } else {
    const isNewSurah = (_aud.getAttribute('data-surah') !== String(PlayerState.surahNum));
    _aud.setAttribute('data-surah', String(PlayerState.surahNum));
    
    if (isNewSurah || _aud.src === '' || _aud.readyState === 0) {
      _aud.src = ayah.audio;
      _aud.playbackRate = PlayerState.speed;
      _aud.volume = PlayerState.volume;
      _aud.load();
      _aud.play().catch(e => console.warn('Audio play error:', e));
    } else {
      _aud.play().catch(e => console.warn('Audio play error:', e));
    }
  }

  _highlightAyah(ayahNum);
  _updateBotBarLabel();
  _updateNavButtons();
  _updatePlayBtn(true);
  PlayerState.isPlaying = true;
}

function _globalAyahNumber(surahNum, ayahInSurah) {
  // Compute the global ayah number for islamic.network CDN
  const AYAHS_PER_SURAH = [
    7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
    112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,
    59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,
    52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,
    21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6
  ];
  let global = 0;
  for (let i = 0; i < surahNum - 1; i++) global += AYAHS_PER_SURAH[i];
  return global + ayahInSurah;
}

function _getEditionCode() {
  // Map RECITER_ID to islamic.network CDN edition identifiers.
  const map = {
    abdulbasit: 'ar.abdulbasitmurattal',
    ghamdi:     'ar.saoodshuraym',   // same server, murattal
    minshawi:   'ar.minshawimujawwad',
    maher:      'ar.maheralmuaiqly',
    sudais:     'ar.abdurrahmaansudais',
    shuraym:    'ar.saoodshuraym',
  };
  return map[RECITER_ID] || null;
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
  if (document.getElementById('asn')) document.getElementById('asn').textContent = label;
  if (_playerAyahInfo) _playerAyahInfo.textContent = info;
}

function _updateNavButtons() {
  const atStart = PlayerState.surahNum <= 1 && PlayerState.ayahNum <= 1;
  const atEnd   = PlayerState.surahNum >= 114 && PlayerState.ayahNum >= PlayerState.totalAyahs;
  if (_prevBtn) _prevBtn.disabled = atStart;
  if (_nextBtn) _nextBtn.disabled = atEnd;
}

// ── Controls ────────────────────────────────────────────────────────────────
function playPrev() {
  if (PlayerState.ayahNum > 1) { playAyahAt(PlayerState.ayahNum - 1); return; }
  if (PlayerState.surahNum > 1) { loadSurahAyahs(PlayerState.surahNum - 1); }
}

function playNext() {
  if (PlayerState.ayahNum < PlayerState.totalAyahs) { playAyahAt(PlayerState.ayahNum + 1); return; }
  if (PlayerState.surahNum < 114) { loadSurahAyahs(PlayerState.surahNum + 1); }
}

function togPlayReciter() {
  if (!_aud || !_aud.src) return;
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

// ── Audio events ─────────────────────────────────────────────────────────────
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
  if (PlayerState.repeatMode) { if (_aud) { _aud.currentTime = 0; _aud.play().catch(() => {}); } return; }
  
  const ayah = PlayerState.ayahData[PlayerState.ayahNum - 1];
  
  if (ayah && ayah.isPerAyah) {
    if (PlayerState.ayahNum < PlayerState.totalAyahs) {
      setTimeout(() => playAyahAt(PlayerState.ayahNum + 1), 600);
    } else if (PlayerState.surahNum < 114) {
      setTimeout(() => loadSurahAyahs(PlayerState.surahNum + 1), 1000);
    } else {
      _updatePlayBtn(false);
      PlayerState.isPlaying = false;
    }
  } else {
    if (PlayerState.surahNum < 114) {
      setTimeout(() => loadSurahAyahs(PlayerState.surahNum + 1), 1000);
    } else {
      _updatePlayBtn(false);
      PlayerState.isPlaying = false;
    }
  }
}

function _onError() {
  if (_playerSurahName) _playerSurahName.textContent = '⚠ Audio unavailable — try another verse';
  _updatePlayBtn(false);
}

// ── UI helpers ───────────────────────────────────────────────────────────────
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

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  _initRefs();
  buildSurahGrid();
  if (_volSlider) _volSlider.value = PlayerState.volume * 100;
});
