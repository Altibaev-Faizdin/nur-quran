/**
 * scripts/test-runner.mjs
 * Automated frontend static, data, prayer/Qibla math, i18n, CSP, and link integrity suite.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

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

function loadSharedSandbox() {
  const sharedContent = fs.readFileSync(path.join(FRONTEND_DIR, 'shared.js'), 'utf8');
  const namesContent = fs.readFileSync(path.join(FRONTEND_DIR, 'data/names-data.js'), 'utf8');
  const sandbox = {
    window: {
      location: { hostname: 'localhost', port: '3000', pathname: '/', search: '', hash: '' },
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
      matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
      requestAnimationFrame: () => 1,
    },
    document: {
      readyState: 'complete',
      addEventListener: () => {},
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      body: { classList: { add: () => {}, remove: () => {} }, appendChild: () => {}, prepend: () => {} },
      documentElement: { style: { setProperty: () => {} } },
    },
    navigator: { userAgent: 'NodeTestRunner', onLine: true },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: () => 1,
    clearTimeout: () => {},
    console,
    Date,
    Math,
    Intl,
  };
  sandbox.window.window = sandbox.window;
  sandbox.window.document = sandbox.document;
  vm.createContext(sandbox);
  vm.runInContext(namesContent, sandbox);
  vm.runInContext(sharedContent, sandbox);
  return sandbox;
}

// ── 1. Quran Data & Availability Integrity ──────────────────────────
function testQuranDataIntegrity() {
  console.log('\n--- 1. Testing Quran & Reciter Data Integrity ---');
  const sandbox = loadSharedSandbox();
  const surahs = sandbox.SURAHS || sandbox.window.SURAHS;

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
  assert(totalAyahs === 6236, `Total ayah count equals 6236 (got ${totalAyahs})`);

  const availJson = JSON.parse(
    fs.readFileSync(path.join(FRONTEND_DIR, 'data/reciter-availability.json'), 'utf8')
  );
  const mossadAvail = sandbox.getReciterAvailableSurahs('abdurrahman_mossad').map((s) => s.n);
  const sherifAvail = sandbox.getReciterAvailableSurahs('sherif_mostafa').map((s) => s.n);
  const sobhiAvail = sandbox.getReciterAvailableSurahs('islam_sobhi').map((s) => s.n);
  assert(
    JSON.stringify(mossadAvail) === JSON.stringify(availJson.abdurrahman_mossad),
    'Mossad availability synced with JSON'
  );
  assert(
    JSON.stringify(sherifAvail) === JSON.stringify(availJson.sherif_mostafa),
    'Sherif availability synced with JSON'
  );
  assert(
    JSON.stringify(sobhiAvail) === JSON.stringify(availJson.islam_sobhi),
    'Islam Sobhi availability synced with JSON'
  );

  const names = sandbox.NAMES_OF_ALLAH_DATA || sandbox.window.NAMES_OF_ALLAH_DATA;
  assert(
    Array.isArray(names) && names.length === 99,
    `99 Names extracted cleanly (got ${names && names.length})`
  );
}

// ── 2. Astronomical Prayer & Qibla Calculation ──────────────────────
function testPrayerAndQiblaCalculations() {
  console.log('\n--- 2. Testing Astronomical Prayer & Qibla Calculations ---');
  const sandbox = loadSharedSandbox();
  const calc = sandbox.calculateOfflinePrayerTimes;
  const bearingFn = sandbox.calculateQiblaBearing;
  assert(typeof calc === 'function', 'calculateOfflinePrayerTimes function exported');
  assert(typeof bearingFn === 'function', 'calculateQiblaBearing function exported');

  const toMin = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const closeTo = (got, target, tolMin = 3) => {
    let diff = Math.abs(toMin(got) - toMin(target));
    if (diff > 720) diff = 1440 - diff;
    return diff <= tolMin;
  };

  const cases = [
    [
      'Makkah Jun 21',
      21.3891,
      39.8579,
      new Date(Date.UTC(2026, 5, 21, 12)),
      3,
      { Fajr: '04:14', Dhuhr: '12:22', Asr: '15:42', Maghrib: '19:06', Isha: '20:26' },
    ],
    [
      'Moscow Jun 21',
      55.7558,
      37.6173,
      new Date(Date.UTC(2026, 5, 21, 12)),
      3,
      { Fajr: '01:49', Dhuhr: '12:31', Asr: '17:03', Maghrib: '21:18', Isha: '23:08' },
    ],
    [
      'Moscow Dec 21',
      55.7558,
      37.6173,
      new Date(Date.UTC(2026, 11, 21, 12)),
      3,
      { Fajr: '06:36', Dhuhr: '12:28', Asr: '13:45', Maghrib: '15:58', Isha: '18:11' },
    ],
    [
      'Bishkek Jun 21',
      42.8746,
      74.5698,
      new Date(Date.UTC(2026, 5, 21, 12)),
      6,
      { Fajr: '03:05', Dhuhr: '13:04', Asr: '17:08', Maghrib: '20:44', Isha: '22:51' },
    ],
    [
      'Astana Jun 21',
      51.1694,
      71.4491,
      new Date(Date.UTC(2026, 5, 21, 12)),
      5,
      { Fajr: '01:45', Dhuhr: '12:16', Asr: '16:38', Maghrib: '20:33', Isha: '22:39' },
    ],
    [
      'London Jun 21',
      51.5074,
      -0.1278,
      new Date(Date.UTC(2026, 5, 21, 12)),
      1,
      { Fajr: '02:31', Dhuhr: '13:02', Asr: '17:25', Maghrib: '21:22', Isha: '23:27' },
    ],
  ];

  for (const [label, lat, lng, dt, tz, exp] of cases) {
    const res = calc(lat, lng, dt, { method: 3, hanafi: false, timezone: tz });
    for (const [k, v] of Object.entries(exp)) {
      assert(closeTo(res[k], v, 3), `${label} ${k}: ${res[k]} ≈ ${v}`);
    }
  }

  const moscowQibla = bearingFn(55.7558, 37.6173);
  assert(
    moscowQibla > 175 && moscowQibla < 178,
    `Moscow Qibla bearing ~176.4° (got ${moscowQibla.toFixed(1)}°)`
  );
}

// ── 3. i18n Translation Parity ──────────────────────────────────────
function testI18nParity() {
  console.log('\n--- 3. Testing i18n Translation Parity (RU, EN, UZ) ---');
  const content = fs.readFileSync(path.join(FRONTEND_DIR, 'i18n.js'), 'utf8');
  const sandbox = {
    window: {},
    document: { addEventListener: () => {}, querySelectorAll: () => [], documentElement: {} },
    localStorage: { getItem: () => null, setItem: () => {} },
    CustomEvent: class {},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(content, sandbox);

  const i18n = sandbox.i18n;
  assert(i18n && i18n.ru && i18n.en && i18n.uz, 'i18n dictionaries ru, en, uz loaded');

  const enKeys = Object.keys(i18n.en).sort();
  const ruKeys = Object.keys(i18n.ru).sort();
  const uzKeys = Object.keys(i18n.uz).sort();
  assert(enKeys.length >= 30, `Comprehensive key count (${enKeys.length} keys)`);
  assert(JSON.stringify(enKeys) === JSON.stringify(ruKeys), 'EN and RU keys match identically');
  assert(JSON.stringify(enKeys) === JSON.stringify(uzKeys), 'EN and UZ keys match identically');
}

// ── 4. Link Integrity, CSP, and Inline Scope Check ──────────────────
function testLinksAndCsp() {
  console.log('\n--- 4. Testing Link Integrity, CSP Compliance, and Scope Safety ---');
  const htmlFiles = [];

  function findFiles(dir, ext) {
    const out = [];
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        if (item !== 'audio') out.push(...findFiles(full, ext));
      } else if (item.endsWith(ext)) {
        out.push(full);
      }
    }
    return out;
  }

  htmlFiles.push(...findFiles(FRONTEND_DIR, '.html'));
  assert(htmlFiles.length >= 18, `Found ${htmlFiles.length} HTML files to inspect`);

  let checkedLinks = 0;
  for (const file of htmlFiles) {
    const text = fs.readFileSync(file, 'utf8');
    const relFile = path.relative(FRONTEND_DIR, file);
    const fileDir = path.dirname(file);

    assert(!/<style[\s>]/i.test(text), `${relFile}: zero inline <style> blocks`);
    assert(!/<script(?![^>]*\ssrc=)[^>]*>/i.test(text), `${relFile}: zero inline <script> blocks`);
    assert(!/\sstyle\s*=/i.test(text), `${relFile}: zero inline style= attributes`);
    assert(!/\son[a-z]+\s*=/i.test(text), `${relFile}: zero inline on*= event attributes`);
    assert(!/href=["']javascript:/i.test(text), `${relFile}: zero javascript: links`);
    assert(/<main[\s>]/.test(text), `${relFile}: has <main> landmark`);
    assert(/<footer[\s>]/.test(text), `${relFile}: has <footer> landmark`);
    assert(/<h1[\s>]/.test(text), `${relFile}: has <h1> heading`);

    const linkMatches = [...text.matchAll(/(?:href|src)=["']([^"']+)["']/g)];
    for (const m of linkMatches) {
      const link = m[1];
      if (/^(https?:|data:|#|mailto:)/.test(link)) continue;
      const cleanPath = link.split('?')[0].split('#')[0];
      if (!cleanPath) continue;
      const targetPath = cleanPath.startsWith('/')
        ? path.join(FRONTEND_DIR, cleanPath.slice(1))
        : path.resolve(fileDir, cleanPath);
      assert(
        fs.existsSync(targetPath),
        `Link "${link}" in ${relFile} resolves to ${path.relative(ROOT_DIR, targetPath)}`
      );
      checkedLinks++;
    }
  }
  console.log(`  Verified ${checkedLinks} internal links and assets cleanly.`);
}

function main() {
  console.log('====================================================');
  console.log('       NOOR AL-QURAN AUTOMATED TEST SUITE           ');
  console.log('====================================================');

  try {
    testQuranDataIntegrity();
    testPrayerAndQiblaCalculations();
    testI18nParity();
    testLinksAndCsp();
    console.log(`\nALL SUITES PASSED! (${passedTests}/${totalTests} assertions passed)`);
  } catch (err) {
    console.error(err);
    console.error(`\nTEST RUN FAILED! (${failedTests} failures)`);
    process.exit(1);
  }
}

main();
