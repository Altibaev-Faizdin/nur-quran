'use strict';

document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.loadReciters === 'function') window.loadReciters();

  document.getElementById('quickPlayBtn')?.addEventListener('click', () => {
    if (typeof window.quickPlay === 'function') window.quickPlay();
  });
  document.getElementById('plbtn')?.addEventListener('click', () => {
    if (window.NoorAudioManager) window.NoorAudioManager.togglePlay();
  });
  document.getElementById('stopSurahBtn')?.addEventListener('click', () => {
    if (typeof window.stopSurah === 'function') window.stopSurah();
  });
  document.getElementById('closeAudioBtn')?.addEventListener('click', () => {
    if (typeof window.closeAudio === 'function') window.closeAudio();
  });
  document.getElementById('seekSlider')?.addEventListener('input', () => {
    if (typeof window.seekAudio === 'function') window.seekAudio();
  });

  const aud = document.getElementById('aud');
  aud?.addEventListener('timeupdate', () => {
    if (typeof window.updP === 'function') window.updP();
  });
  aud?.addEventListener('ended', () => {
    if (typeof window.onEnd === 'function') window.onEnd();
  });
});
