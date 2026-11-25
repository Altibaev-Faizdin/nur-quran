'use strict';

document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.loadNames === 'function') window.loadNames();

  const searchInput = document.getElementById('namesSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const q = this.value.toLowerCase().trim();
      const cards = document.querySelectorAll('.nc');
      let found = 0;
      cards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        const visible = !q || text.includes(q);
        card.classList.toggle('hidden', !visible);
        if (visible) found++;
      });
      let noRes = document.getElementById('noResults');
      if (!noRes) {
        noRes = document.createElement('div');
        noRes.id = 'noResults';
        noRes.className = 'no-results';
        noRes.textContent = 'No names found. Try a different search.';
        document.getElementById('ng')?.appendChild(noRes);
      }
      noRes.classList.toggle('hidden', found > 0);
    });
  }
});
