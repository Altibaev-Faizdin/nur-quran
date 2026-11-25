'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initBookmarksPage();
});

async function initBookmarksPage() {
  if (window.NoorAuth && typeof window.NoorAuth.restoreSession === 'function') {
    await window.NoorAuth.restoreSession();
  }
  await loadBookmarks();
  initAccountActions();
}

function getLocalBookmarks() {
  try {
    const raw = JSON.parse(localStorage.getItem('nq_local_bookmarks') || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch (_e) {
    return [];
  }
}

async function loadBookmarks() {
  const container = document.getElementById('bm-list');
  if (!container) return;

  const localBMs = getLocalBookmarks();
  const combined = [...localBMs];
  const isAuthed = window.NoorAuth && window.NoorAuth.isAuthenticated();

  if (isAuthed) {
    try {
      const res = await window.authFetch(`${window.API_BASE}/bookmarks/`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.results)) {
          data.results.forEach((bm) => {
            if (
              !combined.some((c) => c.surah_number === bm.surah_number && c.ayah_number === bm.ayah_number)
            ) {
              combined.push(bm);
            }
          });
        }
      }
    } catch (_e) {
      // Offline / network error falls back cleanly to local bookmarks
    }
  }

  if (combined.length === 0) {
    renderEmptyBookmarks(container, 'No Bookmarks Yet');
    return;
  }

  container.innerHTML = '';
  combined.forEach((bm) => {
    const isLocal = String(bm.id).startsWith('local_');
    const card = document.createElement('div');
    card.className = 'bm-card';
    card.id = `bm-${bm.id}`;

    const info = document.createElement('div');
    info.className = 'bm-info';

    const title = document.createElement('div');
    title.className = 'bm-title';
    title.textContent = `Surah ${bm.surah_number}, Ayah ${bm.ayah_number} `;

    const badge = document.createElement('span');
    badge.className = `bm-badge ${isLocal ? 'bm-badge--local' : 'bm-badge--synced'}`;
    badge.textContent = isLocal ? '📱 Local' : '☁ Synced';
    title.appendChild(badge);

    const meta = document.createElement('div');
    meta.className = 'bm-meta';
    meta.textContent = `Saved on: ${new Date(bm.created_at || Date.now()).toLocaleDateString()}`;
    info.append(title, meta);

    const actions = document.createElement('div');
    actions.className = 'bm-actions';

    const readBtn = document.createElement('button');
    readBtn.className = 'bm-btn';
    readBtn.type = 'button';
    readBtn.setAttribute('aria-label', `Read Surah ${bm.surah_number} Ayah ${bm.ayah_number}`);
    readBtn.textContent = 'Read';
    readBtn.addEventListener('click', () => {
      window.location.href = `quran.html?surah=${Number(bm.surah_number)}#ay${Number(bm.ayah_number)}`;
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'bm-btn del';
    delBtn.type = 'button';
    delBtn.setAttribute('aria-label', `Delete Surah ${bm.surah_number} Ayah ${bm.ayah_number}`);
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      deleteBM(bm.id, Number(bm.surah_number), Number(bm.ayah_number));
    });

    actions.append(readBtn, delBtn);
    card.append(info, actions);
    container.appendChild(card);
  });
}

function renderEmptyBookmarks(container, title) {
  container.innerHTML = window.getEmptyStateHTML({
    icon: '🔖',
    title,
    description: 'Save your favorite verses while reading to revisit them anytime.',
    actionText: 'Explore Quran',
    actionName: 'go-quran',
  });
}

async function deleteBM(id, s, a) {
  try {
    const localBMs = getLocalBookmarks().filter(
      (b) => !(b.id === id || (b.surah_number === s && b.ayah_number === a))
    );
    localStorage.setItem('nq_local_bookmarks', JSON.stringify(localBMs));
  } catch (e) {
    console.warn('Failed to update local bookmarks after deletion:', e);
  }

  if (window.NoorAuth && window.NoorAuth.isAuthenticated() && !String(id).startsWith('local_')) {
    try {
      await window.authFetch(`${window.API_BASE}/bookmarks/${encodeURIComponent(id)}/`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Failed to delete bookmark on server:', e);
    }
  }

  const item = document.getElementById(`bm-${id}`);
  if (item) item.remove();
  if (typeof window.showToast === 'function') window.showToast('Bookmark deleted', 'info');

  if (document.querySelectorAll('.bm-card').length === 0) {
    const container = document.getElementById('bm-list');
    if (container) renderEmptyBookmarks(container, 'No Bookmarks Left');
  }
}

function initAccountActions() {
  const pwForm = document.getElementById('changePasswordForm');
  if (pwForm) {
    pwForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById('oldPassword')?.value || '';
      const newPassword = document.getElementById('newPassword')?.value || '';
      const msgEl = document.getElementById('pwMsg');
      if (!oldPassword || !newPassword) return;

      try {
        const res = await window.authFetch(`${window.API_BASE}/auth/password/change/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.access) {
          if (window.NoorAuth) {
            window.NoorAuth.setSession({
              access: data.access,
              username: window.NoorAuth.getUsername(),
            });
          }
          pwForm.reset();
          if (msgEl) {
            msgEl.textContent = 'Password updated cleanly across sessions.';
            msgEl.className = 'auth-success show mt-10';
          }
          if (typeof window.showToast === 'function') window.showToast('Password updated', 'success');
        } else {
          const err = data.detail || data.error || 'Could not update password.';
          if (msgEl) {
            msgEl.textContent = err;
            msgEl.className = 'auth-error show mt-10';
          }
        }
      } catch (_err) {
        if (msgEl) {
          msgEl.textContent = 'Network error while updating password.';
          msgEl.className = 'auth-error show mt-10';
        }
      }
    });
  }

  const delForm = document.getElementById('deleteAccountForm');
  if (delForm) {
    delForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('deletePassword')?.value || '';
      const errEl = document.getElementById('deleteMsg');
      if (!password) return;

      try {
        const res = await window.authFetch(`${window.API_BASE}/auth/me/`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        if (res.status === 204 || res.ok) {
          if (window.NoorAuth) window.NoorAuth.clearSession();
          if (typeof window.showToast === 'function') window.showToast('Account deleted', 'info');
          window.location.href = '../index.html';
        } else {
          const data = await res.json().catch(() => ({}));
          if (errEl) {
            errEl.textContent = data.detail || data.error || 'Incorrect password or session expired.';
            errEl.className = 'auth-error show mt-10';
          }
        }
      } catch (_err) {
        if (errEl) {
          errEl.textContent = 'Network error while deleting account.';
          errEl.className = 'auth-error show mt-10';
        }
      }
    });
  }
}
