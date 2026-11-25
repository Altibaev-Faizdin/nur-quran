import fs from 'node:fs';
import { defineConfig } from '@playwright/test';

const executablePath = ['/usr/bin/chromium', '/usr/bin/google-chrome', '/usr/bin/chromium-browser']
  .find((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.mjs',
  timeout: 45_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3415',
    headless: true,
    launchOptions: executablePath ? { executablePath } : undefined,
  },
});
