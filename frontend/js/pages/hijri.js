'use strict';

const ISLAMIC_MONTHS = [
  'Muharram',
  'Safar',
  'Rabi al-awwal',
  'Rabi al-thani',
  'Jumada al-awwal',
  'Jumada al-thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
];

const MONTH_DESCRIPTIONS = [
  'The sacred month',
  'Month of travel',
  'Spring month (1)',
  'Spring month (2)',
  'Summer month (1)',
  'Summer month (2)',
  'Blessed month',
  'Month of mercy',
  'Fasting month',
  'Eid al-Fitr month',
  'Month of Hajj journey',
  'Hajj month',
];

const ISLAMIC_EVENTS = [
  { name: 'Ramadan', emoji: '🌙', hijriMonth: 9, hijriDay: 1, description: 'Holy month of fasting' },
  {
    name: 'Eid al-Fitr',
    emoji: '🎉',
    hijriMonth: 10,
    hijriDay: 1,
    description: 'Festival of breaking the fast',
  },
  {
    name: 'Arafah Day',
    emoji: '⛰️',
    hijriMonth: 12,
    hijriDay: 9,
    description: 'Day of standing at Mount Arafah',
  },
  { name: 'Eid al-Adha', emoji: '🐑', hijriMonth: 12, hijriDay: 10, description: 'Festival of sacrifice' },
  { name: 'Hajj Season', emoji: '🕋', hijriMonth: 12, hijriDay: 8, description: 'Islamic pilgrimage season' },
  { name: 'Islamic New Year', emoji: '🌟', hijriMonth: 1, hijriDay: 1, description: 'First day of Muharram' },
];

function getHijriAdjustment() {
  try {
    const v = parseInt(localStorage.getItem('nq_hijri_adj') || '0', 10);
    return isNaN(v) ? 0 : Math.max(-2, Math.min(2, v));
  } catch (_e) {
    return 0;
  }
}

function setHijriAdjustment(val) {
  val = Math.max(-2, Math.min(2, val));
  try {
    localStorage.setItem('nq_hijri_adj', String(val));
  } catch (e) {
    console.warn('Could not save hijri adjustment:', e);
  }
  renderAll();
}

function getHijri(date = new Date()) {
  if (typeof window.toHijri === 'function') {
    const h = window.toHijri(date, getHijriAdjustment());
    return { year: h.year, month: h.month + 1, day: h.day };
  }
  return { year: 1447, month: 1, day: 1 };
}

function daysUntilHijriEvent(now, targetM, targetD) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i <= 360; i++) {
    const h = getHijri(d);
    if (h.month === targetM && h.day === targetD) return i;
    d.setDate(d.getDate() + 1);
  }
  return 0;
}

function displayCurrentDate() {
  const now = new Date();
  const hijri = getHijri(now);
  const adj = getHijriAdjustment();
  const adjEl = document.getElementById('adj-val');
  if (adjEl) adjEl.textContent = adj > 0 ? `+${adj}` : String(adj);

  const gEl = document.getElementById('gregorianDate');
  const hEl = document.getElementById('hijriDate');
  const htEl = document.getElementById('hijriText');
  const cmEl = document.getElementById('currentMonth');
  const mdEl = document.getElementById('monthDescription');
  if (gEl)
    gEl.textContent = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  if (hEl) hEl.textContent = `${hijri.day} / ${hijri.month} / ${hijri.year}`;
  if (htEl) htEl.textContent = `${hijri.day} ${ISLAMIC_MONTHS[hijri.month - 1]} ${hijri.year}ھ`;
  if (cmEl) cmEl.textContent = ISLAMIC_MONTHS[hijri.month - 1];
  if (mdEl) mdEl.textContent = MONTH_DESCRIPTIONS[hijri.month - 1];
}

function displayEvents() {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;
  const now = new Date();
  grid.innerHTML = '';

  ISLAMIC_EVENTS.forEach((evt) => {
    const daysUntil = daysUntilHijriEvent(now, evt.hijriMonth, evt.hijriDay);
    const card = document.createElement('div');
    card.className = 'event-card';

    const emoji = document.createElement('div');
    emoji.className = 'event-emoji';
    emoji.textContent = evt.emoji;
    const name = document.createElement('div');
    name.className = 'event-name';
    name.textContent = evt.name;
    const date = document.createElement('div');
    date.className = 'event-date';
    date.textContent = `${evt.hijriDay} ${ISLAMIC_MONTHS[evt.hijriMonth - 1]}`;

    const cd = document.createElement('div');
    cd.className = 'event-countdown';
    const cItem = document.createElement('div');
    cItem.className = 'countdown-item';
    const cNum = document.createElement('span');
    cNum.className = 'countdown-number';
    cNum.textContent = String(daysUntil);
    const cLbl = document.createElement('span');
    cLbl.className = 'countdown-label';
    cLbl.textContent = 'Days';
    cItem.append(cNum, cLbl);
    cd.appendChild(cItem);

    const desc = document.createElement('p');
    desc.className = 'event-desc';
    desc.textContent = evt.description;
    card.append(emoji, name, date, cd, desc);
    grid.appendChild(card);
  });
}

function displayMonths() {
  const list = document.getElementById('monthsList');
  if (!list) return;
  list.innerHTML = '';
  ISLAMIC_MONTHS.forEach((month, idx) => {
    const card = document.createElement('div');
    card.className = 'month-card';
    const num = document.createElement('div');
    num.className = 'month-num';
    num.textContent = String(idx + 1);
    const nm = document.createElement('div');
    nm.className = 'month-name';
    nm.textContent = month;
    const det = document.createElement('div');
    det.className = 'month-details';
    det.textContent = MONTH_DESCRIPTIONS[idx];
    card.append(num, nm, det);
    list.appendChild(card);
  });
}

function renderAll() {
  displayCurrentDate();
  displayEvents();
  displayMonths();
}

document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  const btnMinus = document.getElementById('adj-minus');
  const btnPlus = document.getElementById('adj-plus');
  if (btnMinus) btnMinus.addEventListener('click', () => setHijriAdjustment(getHijriAdjustment() - 1));
  if (btnPlus) btnPlus.addEventListener('click', () => setHijriAdjustment(getHijriAdjustment() + 1));
});
