'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  if (window.NoorAuth && typeof window.NoorAuth.restoreSession === 'function') {
    const tok = await window.NoorAuth.restoreSession();
    if (tok) {
      window.location.href = 'bookmarks.html';
      return;
    }
  }

  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('username')?.value.trim() || '';
    const p = document.getElementById('password')?.value || '';
    const errDiv = document.getElementById('login-error');
    const btn = document.getElementById('loginBtn');

    if (!u || !p) {
      if (errDiv) {
        errDiv.textContent = 'Please enter both username and password.';
        errDiv.classList.add('show');
      }
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Signing in...';
    }
    errDiv?.classList.remove('show');

    try {
      const apiBase = window.API_BASE || '/api';
      const res = await fetch(`${apiBase}/auth/login/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.access) {
        if (window.NoorAuth) {
          window.NoorAuth.setSession({ access: data.access, username: data.username || u });
        }
        if (btn) btn.textContent = '✓ Success!';
        setTimeout(() => {
          window.location.href = 'bookmarks.html';
        }, 250);
      } else {
        const errMsg = Array.isArray(data.error) ? data.error[0] : data.detail || data.error;
        if (errDiv) {
          errDiv.textContent = errMsg || 'Invalid username or password.';
          errDiv.classList.add('show');
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Log In';
        }
      }
    } catch (_err) {
      if (errDiv) {
        errDiv.textContent = 'Unable to connect to the server. Please check your connection.';
        errDiv.classList.add('show');
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Log In';
      }
      if (typeof window.showToast === 'function') {
        window.showToast('Unable to reach server. Please check your connection.', 'error', 4500);
      }
    }
  });
});
