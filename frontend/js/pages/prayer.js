'use strict';

(function () {
  const D = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function upd() {
    const n = new Date();
    const h = String(n.getHours()).padStart(2, '0');
    const m = String(n.getMinutes()).padStart(2, '0');
    const s = String(n.getSeconds()).padStart(2, '0');
    const clkEl = document.getElementById('bigClock');
    const dtEl = document.getElementById('bigDate');
    const hjEl = document.getElementById('bigHijri');
    if (clkEl) clkEl.textContent = `${h}:${m}:${s}`;
    if (dtEl) dtEl.textContent = `${D[n.getDay()]}, ${M[n.getMonth()]} ${n.getDate()}, ${n.getFullYear()}`;
    if (hjEl && typeof window.toHijri === 'function' && window.HM) {
      const hj = window.toHijri(n);
      hjEl.textContent = `${hj.day} ${window.HM[hj.month]} ${hj.year} AH`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    upd();
    setInterval(upd, 1000);

    const methodSelect = document.getElementById('prayerMethodSelect');
    const schoolSelect = document.getElementById('prayerSchoolSelect');
    const currentSettings =
      typeof window.getPrayerSettings === 'function' ? window.getPrayerSettings() : { method: 3, school: 0 };

    const clearPrayerCacheAndReload = () => {
      try {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith('prayer_cache')) localStorage.removeItem(k);
        });
      } catch (e) {
        console.warn('Failed to clear prayer cache:', e);
      }
      if (typeof window.loadPrayerBig === 'function') window.loadPrayerBig(false);
      if (typeof window.loadPrayer === 'function') window.loadPrayer(false);
    };

    if (methodSelect) {
      methodSelect.value = String(currentSettings.method);
      methodSelect.addEventListener('change', function () {
        try {
          localStorage.setItem('nq_prayer_method', this.value);
        } catch (_e) {
          /* ignore */
        }
        clearPrayerCacheAndReload();
      });
    }

    if (schoolSelect) {
      schoolSelect.value = String(currentSettings.school);
      schoolSelect.addEventListener('change', function () {
        try {
          localStorage.setItem('nq_prayer_school', this.value);
        } catch (_e) {
          /* ignore */
        }
        clearPrayerCacheAndReload();
      });
    }

    const getBtn = document.getElementById('getPrayerBtn');
    if (getBtn) {
      getBtn.addEventListener('click', () => {
        if (typeof window.loadPrayerBig === 'function') window.loadPrayerBig(true);
      });
    }
  });
})();
