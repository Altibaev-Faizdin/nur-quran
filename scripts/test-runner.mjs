/**
 * scripts/test-runner.mjs
 * Comprehensive automated frontend test runner for Noor Al-Quran.
 * Tests:
 * 1. Quran Data Integrity (114 Surahs, 6236 Ayahs)
 * 2. Astronomical Prayer Calculation Tolerances & High Latitude handling
 * 3. i18n Translation Parity across RU, EN, and UZ
 * 4. Internal Link Integrity across all HTML files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(message);
  } else {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  }
}

// ── 1. Quran Data Integrity ─────────────────────────────────────────
function testQuranDataIntegrity() {
  console.log('\n--- 1. Testing Quran Data Integrity ---');
  const sharedJsPath = path.join(FRONTEND_DIR, 'shared.js');
  const sharedContent = fs.readFileSync(sharedJsPath, 'utf8');

  // Extract SURAHS array from shared.js
  const surahsMatch = sharedContent.match(/var\s+SURAHS\s*=\s*(\[[\s\S]*?\]);/);
  assert(surahsMatch !== null, 'SURAHS array found in shared.js');

  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`var SURAHS = ${surahsMatch[1]};`, sandbox);
  const surahs = sandbox.SURAHS;

  assert(Array.isArray(surahs), 'SURAHS is an array');
  assert(surahs.length === 114, `Exactly 114 surahs found (got ${surahs.length})`);

  let totalAyahs = 0;
  for (let i = 0; i < surahs.length; i++) {
    const s = surahs[i];
    assert(s.n === i + 1, `Surah ${i + 1} has sequential number ${s.n}`);
    assert(typeof s.ar === 'string' && s.ar.length > 0, `Surah ${s.n} has Arabic name`);
    assert(typeof s.en === 'string' && s.en.length > 0, `Surah ${s.n} has English name`);
    assert(typeof s.v === 'number' && s.v > 0, `Surah ${s.n} has positive verse count (${s.v})`);
    totalAyahs += s.v;
  }

  assert(totalAyahs === 6236, `Total ayah count across all 114 surahs equals exactly 6236 (got ${totalAyahs})`);
}

// ── 2. Astronomical Prayer Calculation & High Latitudes ─────────────
function testPrayerCalculations() {
  console.log('\n--- 2. Testing Astronomical Prayer Calculations ---');
  const sharedJsPath = path.join(FRONTEND_DIR, 'shared.js');
  const sharedContent = fs.readFileSync(sharedJsPath, 'utf8');

  const sandbox = {
    window: {
      location: { hostname: 'localhost', port: '8000', search: '', hash: '' },
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
      matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
      requestAnimationFrame: (cb) => setTimeout(cb, 16)
    },
    document: {
      addEventListener: () => {},
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      body: { appendChild: () => {} }
    },
    navigator: { userAgent: 'NodeTestRunner' },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    setInterval: (cb) => { return 1; },
    clearInterval: () => {},
    setTimeout: (cb) => { return 1; },
    clearTimeout: () => {},
    IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
    console: console,
    Date: Date,
    Math: Math
  };
  sandbox.window.window = sandbox.window;
  sandbox.window.document = sandbox.document;
  vm.createContext(sandbox);

  // Extract and run calculateOfflinePrayerTimes and dependencies
  vm.runInContext(sharedContent, sandbox);
  const calc = sandbox.calculateOfflinePrayerTimes;
  assert(typeof calc === 'function', 'calculateOfflinePrayerTimes function exists in shared.js');

  // Test Case A: Mecca (Equatorial / Standard latitude)
  const meccaTimes = calc(21.3891, 39.8579, new Date(2026, 5, 21)); // June 21
  assert(meccaTimes !== null, 'Mecca prayer times generated');
  assert(typeof meccaTimes.Fajr === 'string' && !meccaTimes.Fajr.includes('--'), `Mecca Fajr valid: ${meccaTimes.Fajr}`);
  assert(typeof meccaTimes.Sunrise === 'string' && !meccaTimes.Sunrise.includes('--'), `Mecca Sunrise valid: ${meccaTimes.Sunrise}`);
  assert(typeof meccaTimes.Dhuhr === 'string' && !meccaTimes.Dhuhr.includes('--'), `Mecca Dhuhr valid: ${meccaTimes.Dhuhr}`);
  assert(typeof meccaTimes.Asr === 'string' && !meccaTimes.Asr.includes('--'), `Mecca Asr valid: ${meccaTimes.Asr}`);
  assert(typeof meccaTimes.Maghrib === 'string' && !meccaTimes.Maghrib.includes('--'), `Mecca Maghrib valid: ${meccaTimes.Maghrib}`);
  assert(typeof meccaTimes.Isha === 'string' && !meccaTimes.Isha.includes('--'), `Mecca Isha valid: ${meccaTimes.Isha}`);

  // Test Case B: Moscow (55.75°N - High Latitude on Summer Solstice)
  const moscowTimes = calc(55.7558, 37.6173, new Date(2026, 5, 21));
  assert(moscowTimes !== null, 'Moscow prayer times generated');
  assert(!moscowTimes.Fajr.includes('--'), `Moscow Fajr high-latitude resolved: ${moscowTimes.Fajr}`);
  assert(!moscowTimes.Isha.includes('--'), `Moscow Isha high-latitude resolved: ${moscowTimes.Isha}`);

  // Test Case C: London (51.5°N - High Latitude on Summer Solstice)
  const londonTimes = calc(51.5074, -0.1278, new Date(2026, 5, 21));
  assert(londonTimes !== null, 'London prayer times generated');
  assert(!londonTimes.Fajr.includes('--'), `London Fajr high-latitude resolved: ${londonTimes.Fajr}`);
  assert(!londonTimes.Isha.includes('--'), `London Isha high-latitude resolved: ${londonTimes.Isha}`);
}

// ── 3. i18n Translation Parity ──────────────────────────────────────
function testI18nParity() {
  console.log('\n--- 3. Testing i18n Translation Parity (RU, EN, UZ) ---');
  const i18nPath = path.join(FRONTEND_DIR, 'i18n.js');
  const content = fs.readFileSync(i18nPath, 'utf8');

  const sandbox = {
    window: {
      location: { hostname: 'localhost', port: '8000', search: '', hash: '' },
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
      matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
      requestAnimationFrame: (cb) => setTimeout(cb, 16)
    },
    document: {
      addEventListener: () => {},
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      body: { appendChild: () => {} }
    },
    navigator: { userAgent: 'NodeTestRunner' },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    setInterval: (cb) => { return 1; },
    clearInterval: () => {},
    setTimeout: (cb) => { return 1; },
    clearTimeout: () => {},
    IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
    console: console,
    Date: Date,
    Math: Math
  };
  sandbox.window.window = sandbox.window;
  sandbox.window.document = sandbox.document;
  vm.createContext(sandbox);
  vm.runInContext(content, sandbox);

  const i18n = sandbox.i18n || sandbox.window.i18n;
  assert(i18n !== undefined, 'i18n object loaded');
  assert(i18n.ru !== undefined, 'Russian (ru) dictionary present');
  assert(i18n.en !== undefined, 'English (en) dictionary present');
  assert(i18n.uz !== undefined, 'Uzbek (uz) dictionary present');

  const enKeys = Object.keys(i18n.en).sort();
  const ruKeys = Object.keys(i18n.ru).sort();
  const uzKeys = Object.keys(i18n.uz).sort();

  console.log(`  Keys in EN: ${enKeys.length}, RU: ${ruKeys.length}, UZ: ${uzKeys.length}`);
  assert(enKeys.length >= 30, `Comprehensive key count (found ${enKeys.length} keys)`);

  // Verify full parity
  const missingInRu = enKeys.filter(k => !(k in i18n.ru));
  const missingInUz = enKeys.filter(k => !(k in i18n.uz));
  const extraInRu   = ruKeys.filter(k => !(k in i18n.en));
  const extraInUz   = uzKeys.filter(k => !(k in i18n.en));

  assert(missingInRu.length === 0, `All EN keys present in RU (missing: ${missingInRu.join(', ') || 'none'})`);
  assert(missingInUz.length === 0, `All EN keys present in UZ (missing: ${missingInUz.join(', ') || 'none'})`);
  assert(extraInRu.length === 0, `No extraneous keys in RU (extra: ${extraInRu.join(', ') || 'none'})`);
  assert(extraInUz.length === 0, `No extraneous keys in UZ (extra: ${extraInUz.join(', ') || 'none'})`);

  // Verify non-empty strings
  for (const k of enKeys) {
    assert(typeof i18n.en[k] === 'string' && i18n.en[k].length > 0, `EN[${k}] is non-empty`);
    assert(typeof i18n.ru[k] === 'string' && i18n.ru[k].length > 0, `RU[${k}] is non-empty`);
    assert(typeof i18n.uz[k] === 'string' && i18n.uz[k].length > 0, `UZ[${k}] is non-empty`);
  }
}

// ── 4. Internal Link Integrity Checker ───────────────
function testLinkIntegrity() {
  console.log('\n--- 4. Testing Internal Link Integrity ---');
  const htmlFiles = [];

  function findHtml(dir) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        findHtml(full);
      } else if (item.endsWith('.html')) {
        htmlFiles.push(full);
      }
    }
  }
  findHtml(FRONTEND_DIR);

  assert(htmlFiles.length >= 20, `Found ${htmlFiles.length} HTML files to inspect`);

  let checkedLinks = 0;
  for (const file of htmlFiles) {
    const text = fs.readFileSync(file, 'utf8');
    const relFile = path.relative(FRONTEND_DIR, file);
    const fileDir = path.dirname(file);

    // Match href="..." and src="..."
    const linkMatches = [...text.matchAll(/(?:href|src)=["']([^"']+)["']/g)];
    for (const m of linkMatches) {
      const link = m[1];
      if (
        link.startsWith('http://') ||
        link.startsWith('https://') ||
        link.startsWith('data:') ||
        link.startsWith('javascript:') ||
        link.startsWith('#') ||
        link.startsWith('mailto:')
      ) {
        continue;
      }

      // Strip query string and hash
      const cleanPath = link.split('?')[0].split('#')[0];
      if (!cleanPath) continue;

      let targetPath;
      if (cleanPath.startsWith('/')) {
        targetPath = path.join(FRONTEND_DIR, cleanPath.slice(1));
      } else {
        targetPath = path.resolve(fileDir, cleanPath);
      }

      const exists = fs.existsSync(targetPath);
      assert(exists, `Link "${link}" in ${relFile} resolves to existing target (${path.relative(ROOT_DIR, targetPath)})`);
      checkedLinks++;
    }
  }

  console.log(`  Verified ${checkedLinks} internal links and assets across all pages.`);
}

// ── Main Suite ──────────────────────────────────────────────────────
function main() {
  console.log('====================================================');
  console.log('       NOOR AL-QURAN AUTOMATED TEST SUITE           ');
  console.log('====================================================');

  try {
    testQuranDataIntegrity();
    testPrayerCalculations();
    testI18nParity();
    testLinkIntegrity();

    console.log('\n====================================================');
    console.log(`  ALL SUITES PASSED! (${passedTests}/${totalTests} assertions passed)`);
    console.log('====================================================\n');
  } catch (err) {
    console.error(err);
    console.error('\n====================================================');
    console.error(`  TEST RUN FAILED! (${failedTests} failures)`);
    console.error('====================================================\n');
    process.exit(1);
  }
}

main();
