/* global document, window */
import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let serverProc;
let tmpDir;
const PORT = 3415;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function waitForHealth() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`${BASE_URL}/api/health/`);
      if (r.ok) return;
    } catch {
      /* wait */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Server failed to start within timeout');
}

test.beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nq-e2e-'));
  const dbFile = path.join(tmpDir, 'e2e.sqlite3');
  const venvPy = '/tmp/nq-venv/bin/python';
  const pyBin = fs.existsSync(venvPy) ? venvPy : 'python3';
  const childEnv = {
    ...process.env,
    PYTHONPATH: path.resolve(process.cwd(), 'backend'),
    DEBUG: 'False',
    DJANGO_DEBUG: 'False',
    SECRET_KEY: 'e2e_test_secret_key_over_50_characters_for_django_jwt_signing_xx',
    ALLOWED_HOSTS: '127.0.0.1,localhost',
    COOKIE_SECURE: 'false',
    CORS_ALLOWED_ORIGINS: BASE_URL,
    DATABASE_URL: `sqlite:///${dbFile}`,
  };

  const { execFileSync } = await import('node:child_process');
  execFileSync(pyBin, ['backend/manage.py', 'migrate', '--noinput'], {
    env: childEnv,
    stdio: 'ignore',
  });

  serverProc = spawn(pyBin, ['backend/manage.py', 'runserver', `127.0.0.1:${PORT}`, '--noreload'], {
    env: childEnv,
    stdio: 'ignore',
  });
  await waitForHealth();
});

test.afterAll(() => {
  if (serverProc) serverProc.kill('SIGTERM');
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('home page renders cleanly without CSP/console errors or mobile overflow', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  await expect(page.locator('h1.ht')).toBeVisible();
  await expect(page.locator('#ft')).not.toHaveText('—:—');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});

test('i18n switching RU/EN/UZ updates visible copy across DOM', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => /** @type {any} */ (window).setLanguage('ru'));
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('.nav-links a[href="pages/quran.html"]')).toHaveText('Коран');

  await page.evaluate(() => /** @type {any} */ (window).setLanguage('uz'));
  await expect(page.locator('html')).toHaveAttribute('lang', 'uz');
  await expect(page.locator('.nav-links a[href="pages/quran.html"]')).toHaveText("Qur'on");
});

test('full auth, RAM token hygiene, bookmark sync persistence, password change & delete', async ({
  page,
}) => {
  const uname = `e2e_user_${Date.now()}`;
  const pass1 = 'NoorPass123!';
  const pass2 = 'NoorNewPass456!';

  await page.goto(`${BASE_URL}/pages/register.html`, { waitUntil: 'networkidle' });
  await page.fill('#username', uname);
  await page.fill('#password', pass1);
  await page.click('#registerBtn');
  await page.waitForURL('**/pages/bookmarks.html', { timeout: 10000 });

  // Verify NO JWT tokens persisted in localStorage
  const storedKeys = await page.evaluate(() => ({
    access: localStorage.getItem('access_token'),
    refresh: localStorage.getItem('refresh_token'),
    hint: localStorage.getItem('nq_session_hint'),
  }));
  expect(storedKeys.access).toBeNull();
  expect(storedKeys.refresh).toBeNull();
  expect(storedKeys.hint).toBe('1');

  // Open Quran reader and save bookmark 1:1
  await page.goto(`${BASE_URL}/pages/quran.html`, { waitUntil: 'networkidle' });
  await page.fill('#srch', 'Fatihah');
  await expect(page.locator('.si')).toHaveCount(1);
  await page.click('.si[data-surah="1"]');
  const firstBookmarkBtn = page.locator('#alist button[data-ayah-action="bookmark"]').first();
  await expect(firstBookmarkBtn).toBeVisible({ timeout: 15000 });
  await firstBookmarkBtn.click();
  await expect(page.locator('.noor-toast')).toBeVisible();

  // Reload bookmarks page -> cookie refresh seamlessly restores session & cloud bookmark appears
  await page.goto(`${BASE_URL}/pages/bookmarks.html`, { waitUntil: 'networkidle' });
  await expect(page.locator('.bm-card').first()).toContainText('Surah 1, Ayah 1');

  // Update password & verify new session persists
  await page.fill('#oldPassword', pass1);
  await page.fill('#newPassword', pass2);
  await page.click('#changePasswordForm button[type="submit"]');
  await expect(page.locator('#pwMsg')).toContainText('Password updated');

  // Delete account cleanly
  await page.fill('#deletePassword', pass2);
  await page.click('#deleteAccountForm button[type="submit"]');
  await page.waitForURL('**/index.html', { timeout: 10000 });
});

test('reciter page stages surahs, enforces availability badges, and offline Quran reading works', async ({
  page,
  context,
}) => {
  await page.goto(`${BASE_URL}/pages/reciter.html?id=sherif_mostafa`, { waitUntil: 'networkidle' });
  await expect(page.locator('#reciterName')).toHaveText('Sherif Mostafa');
  await expect(page.locator('#infoSurahs')).toHaveText('8');
  await expect(page.locator('#sb-65')).not.toHaveClass(/unavailable/);
  await expect(page.locator('#sb-2')).toHaveClass(/unavailable/);

  // Load Surah 1 on quran.html online (cached to IndexedDB), then switch offline & verify readable
  await page.goto(`${BASE_URL}/pages/quran.html`, { waitUntil: 'networkidle' });
  await page.click('.si[data-surah="1"]');
  await expect(page.locator('#alist .aarb').first()).toContainText('بِسْمِ', { timeout: 15000 });

  await context.setOffline(true);
  await page.click('#closeReaderBtn');
  await page.click('.si[data-surah="1"]');
  await expect(page.locator('#alist .aarb').first()).toContainText('بِسْمِ', { timeout: 10000 });
  await context.setOffline(false);
});
