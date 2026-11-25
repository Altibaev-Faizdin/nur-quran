'use strict';

// Sacred dhikrs preserved verbatim
const TASBIH_LIST = [
  { ar: 'سُبْحَانَ اللَّهِ', en: "Subhan'Allah (Glory be to Allah)", goal: 33 },
  { ar: 'الْحَمْدُ لِلَّهِ', en: 'Alhamdulillah (All praise to Allah)', goal: 33 },
  { ar: 'اللَّهُ أَكْبَرُ', en: 'Allahu Akbar (Allah is Greatest)', goal: 34 },
  { ar: 'لَا إِلَهَ إِلَّا اللَّهُ', en: 'La ilaha illallah (None worthy of worship but Allah)', goal: 33 },
  { ar: 'أَسْتَغْفِرُ اللَّهَ', en: 'Astaghfirullah (I seek forgiveness from Allah)', goal: 100 },
  { ar: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', en: 'Salawat (Blessings upon Prophet Muhammad)', goal: 10 },
  { ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', en: 'La hawla wa la quwwata illa billah', goal: 33 },
];

const STORAGE_KEY = 'nq_tasbih_state_v2';
let currentDhikrIdx = 0;
let counter = 0;
let currentGoal = 33;
let totalToday = 0;
let sessions = 0;
let bestCount = 0;

let _audioCtx = null;
function _getAudioCtx() {
  if (!_audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) _audioCtx = new AudioCtx();
  }
  return _audioCtx;
}

function _getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function _loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    if (state.date !== _getTodayStr()) {
      totalToday = 0;
      sessions = 0;
      counter = 0;
      currentDhikrIdx = state.currentDhikrIdx || 0;
      bestCount = state.bestCount || 0;
      _saveState();
      return;
    }
    currentDhikrIdx = state.currentDhikrIdx || 0;
    counter = state.counter || 0;
    totalToday = state.totalToday || 0;
    sessions = state.sessions || 0;
    bestCount = state.bestCount || 0;
    currentGoal = state.currentGoal || TASBIH_LIST[currentDhikrIdx].goal;
  } catch (e) {
    console.warn('Could not load tasbih saved state:', e);
  }
}

function _saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        date: _getTodayStr(),
        currentDhikrIdx,
        counter,
        currentGoal: currentGoal === Infinity ? 'inf' : currentGoal,
        totalToday,
        sessions,
        bestCount,
      })
    );
  } catch (e) {
    console.warn('Could not save tasbih state:', e);
  }
}

function renderPresets() {
  const container = document.getElementById('dhikrPresets');
  if (!container) return;
  container.innerHTML = '';

  TASBIH_LIST.forEach((d, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `preset-btn ${i === currentDhikrIdx ? 'active' : ''}`;
    btn.addEventListener('click', () => selectDhikr(i));

    const ar = document.createElement('div');
    ar.className = 'preset-ar';
    ar.textContent = d.ar;

    const goal = document.createElement('small');
    goal.className = 'preset-goal';
    goal.textContent = `×${d.goal}`;

    btn.append(ar, goal);
    container.appendChild(btn);
  });
}

function selectDhikr(idx) {
  currentDhikrIdx = idx;
  counter = 0;
  currentGoal = TASBIH_LIST[idx].goal;
  document.getElementById('completedBadge')?.classList.remove('show');
  updateGoalPills();
  updateDisplay();
  renderPresets();
  _saveState();
}

function prevDhikr() {
  selectDhikr((currentDhikrIdx - 1 + TASBIH_LIST.length) % TASBIH_LIST.length);
}

function nextDhikr() {
  selectDhikr((currentDhikrIdx + 1) % TASBIH_LIST.length);
}

function setGoal(g) {
  currentGoal = g;
  updateGoalPills();
  updateDisplay();
  _saveState();
}

function updateGoalPills() {
  document.querySelectorAll('.goal-pill').forEach((pill) => {
    const val = pill.getAttribute('data-goal') || pill.textContent.trim();
    const numVal = val === 'inf' || val === '∞' ? Infinity : parseInt(val, 10);
    pill.classList.toggle('active', numVal === currentGoal);
  });
}

function incrementCounter() {
  counter++;
  if (counter > bestCount) bestCount = counter;
  if (navigator.vibrate) navigator.vibrate(14);
  playBeep();

  const disp = document.getElementById('counterDisplay');
  if (disp) {
    disp.classList.add('bump');
    setTimeout(() => disp.classList.remove('bump'), 120);
  }

  if (currentGoal !== Infinity && counter === currentGoal) {
    const badge = document.getElementById('completedBadge');
    badge?.classList.add('show');
    if (navigator.vibrate) navigator.vibrate([30, 60, 40]);
    setTimeout(() => badge?.classList.remove('show'), 3500);
  }

  updateDisplay();
  _saveState();
}

function decrementCounter() {
  if (counter > 0) {
    counter--;
    updateDisplay();
    _saveState();
  }
}

function resetCounter() {
  counter = 0;
  document.getElementById('completedBadge')?.classList.remove('show');
  updateDisplay();
  _saveState();
}

function saveDhikrSession() {
  if (counter === 0) {
    window.showToast?.('Count at least 1 dhikr to save session', 'info');
    return;
  }
  totalToday += counter;
  sessions++;
  window.showToast?.(`Saved session: ${counter} dhikrs! Total today: ${totalToday}`, 'success');
  counter = 0;
  document.getElementById('completedBadge')?.classList.remove('show');
  updateDisplay();
  _saveState();
}

function updateDisplay() {
  const d = TASBIH_LIST[currentDhikrIdx] || TASBIH_LIST[0];
  const disp = document.getElementById('counterDisplay');
  const ar = document.getElementById('dhikrAr');
  const en = document.getElementById('dhikrEn');
  if (disp) disp.textContent = String(counter);
  if (ar) ar.textContent = d.ar;
  if (en) en.textContent = d.en;

  const fill = document.getElementById('progressFill');
  if (fill) {
    if (currentGoal === Infinity) {
      fill.style.width = '100%';
    } else {
      const pct = Math.min(100, Math.round((counter / currentGoal) * 100));
      fill.style.width = pct + '%';
    }
  }

  const sToday = document.getElementById('statsToday');
  const sSess = document.getElementById('statsSessions');
  const sBest = document.getElementById('statsBest');
  if (sToday) sToday.textContent = String(totalToday + counter);
  if (sSess) sSess.textContent = String(sessions);
  if (sBest) sBest.textContent = String(bestCount);
}

function playBeep() {
  try {
    const ctx = _getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 750;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.warn('Audio click synth failed:', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  _loadState();
  if (currentGoal === 'inf') currentGoal = Infinity;
  renderPresets();
  updateGoalPills();
  updateDisplay();

  document.getElementById('beadBtn')?.addEventListener('click', incrementCounter);
  document.querySelectorAll('.goal-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const val = pill.getAttribute('data-goal');
      setGoal(val === 'inf' ? Infinity : parseInt(val || '33', 10));
    });
  });

  document.getElementById('prevDhikrBtn')?.addEventListener('click', prevDhikr);
  document.getElementById('decCounterBtn')?.addEventListener('click', decrementCounter);
  document.getElementById('resetCounterBtn')?.addEventListener('click', resetCounter);
  document.getElementById('nextDhikrBtn')?.addEventListener('click', nextDhikr);
  document.getElementById('saveSessionBtn')?.addEventListener('click', saveDhikrSession);

  document.addEventListener('keydown', (e) => {
    if (
      e.target &&
      (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON')
    )
      return;
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      incrementCounter();
    } else if (e.code === 'ArrowLeft') {
      prevDhikr();
    } else if (e.code === 'ArrowRight') {
      nextDhikr();
    } else if (e.code === 'KeyR') {
      resetCounter();
    }
  });
});
