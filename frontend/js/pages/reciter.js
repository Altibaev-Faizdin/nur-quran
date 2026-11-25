'use strict';

(function () {
  const params = new URLSearchParams(window.location.search);
  const recId = params.get('id') || 'mishary_alafasy';
  const list = window.RECITERS && window.RECITERS.length ? window.RECITERS : [];
  const r = list.find((x) => x.id === recId) ||
    list[0] || {
      id: 'mishary_alafasy',
      server: 'https://server8.mp3quran.net/afs/',
      photo: '../assets/images/reciters/mishary_alafasy.webp?v=2',
      ar: 'مشاري العفاسي',
      en: 'Mishary Alafasy',
      style: 'Murattal',
      country: 'Kuwait',
      bio: 'Sheikh Mishary Alafasy is a world-renowned Quran reciter from Kuwait.',
    };

  window.RECITER_ID = r.id;
  window.RECITER_SERVER = r.server;

  const setElText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setElText('pageTitle', `${r.en} — Noor Al-Quran`);
  setElText('reciterName', r.en);
  setElText('reciterAr', r.ar);
  setElText('infoStyle', r.style);
  setElText('infoCountry', r.country);
  setElText('bioEn', r.bio || '');
  setElText('reciterSubName', r.en);

  let surahCount = 114;
  if (typeof window.getReciterAvailableSurahs === 'function') {
    surahCount = window.getReciterAvailableSurahs(r.id).length;
  } else if (r.id === 'abdurrahman_mossad') {
    surahCount = 2;
  } else if (r.id === 'sherif_mostafa') {
    surahCount = 8;
  } else if (r.id === 'islam_sobhi') {
    surahCount = 112;
  }
  setElText('infoSurahs', String(surahCount));

  const photoEl = document.getElementById('reciterPhoto');
  if (photoEl && r.photo) {
    photoEl.src = r.photo;
    photoEl.alt = r.en;
  }
})();
