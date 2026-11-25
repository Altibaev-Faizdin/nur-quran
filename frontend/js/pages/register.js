'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  if (window.NoorAuth && typeof window.NoorAuth.restoreSession === 'function') {
    const tok = await window.NoorAuth.restoreSession();
    if (tok) {
      window.location.href = 'bookmarks.html';
      return;
    }
  }

  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('username')?.value.trim() || '';
    const p = document.getElementById('password')?.value || '';
    const errDiv = document.getElementById('register-error');
    const sucDiv = document.getElementById('register-success');
    const btn = document.getElementById('registerBtn');

    if (!u || !p) {
      if (errDiv) {
        errDiv.textContent = 'Please fill in all required fields.';
        errDiv.classList.add('show');
      }
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Creating account...';
    }
    errDiv?.classList.remove('show');
    sucDiv?.classList.remove('show');

    try {
      const apiBase = window.API_BASE || '/api';
      const res = await fetch(`${apiBase}/auth/register/`, {
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
        sucDiv?.classList.add('show');
        if (btn) btn.textContent = '✓ Account Created!';
        setTimeout(() => {
          window.location.href = 'bookmarks.html';
        }, 400);
      } else {
        let errorMsg = 'Registration failed. Please check username and password.';
        if (Array.isArray(data.username)) errorMsg = `Username: ${data.username[0]}`;
        else if (Array.isArray(data.password)) errorMsg = `Password: ${data.password[0]}`;
        else if (Array.isArray(data.error) && data.error.length) errorMsg = data.error[0];
        else if (typeof data.error === 'string' && data.error) errorMsg = data.error;
        else if (data.detail) errorMsg = data.detail;

        if (errDiv) {
          errDiv.textContent = errorMsg;
          errDiv.classList.add('show');
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Create Account';
        }
      }
    } catch (_err) {
      if (errDiv) {
        errDiv.textContent = 'Unable to connect to the server. Please check your connection.';
        errDiv.classList.add('show');
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
      if (typeof window.showToast === 'function') {
        window.showToast('Unable to reach server. Please check your connection.', 'error', 4500);
      }
    }
  });
});
