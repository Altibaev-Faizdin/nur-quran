/**
 * scripts/verify-audio.mjs
 * Verification of audio endpoints and availability for all 10 reciters.
 */

import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const AVAILABILITY_FILE = path.join(ROOT_DIR, 'frontend', 'data', 'reciter-availability.json');

async function headRequest(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const mod = parsed.protocol === 'https:' ? https : http;
      const req = mod.request(
        parsed,
        {
          method: 'HEAD',
          timeout: 6000,
          headers: { 'User-Agent': 'Noor-Quran-Audio-Verifier/2.0' },
        },
        (res) => {
          res.resume();
          resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
        }
      );
      req.on('error', (err) => resolve({ status: null, ok: false, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: null, ok: false, error: 'timeout' });
      });
      req.end();
    } catch (e) {
      resolve({ status: null, ok: false, error: e.message });
    }
  });
}

async function checkOptionalCdnAndLocalBundle() {
  console.log('--- Checking audio distribution configuration ---');
  const cdnBase = process.env.AUDIO_CDN_BASE ? process.env.AUDIO_CDN_BASE.replace(/\/+$/, '') : '';
  const sherifDir = path.join(ROOT_DIR, 'frontend', 'audio', 'sherif_mostafa');
  const mossadDir = path.join(ROOT_DIR, 'frontend', 'audio', 'abdurrahman_mossad');
  const sherifLocal = fs.existsSync(sherifDir)
    ? fs.readdirSync(sherifDir).filter((f) => f.endsWith('.mp3')).length
    : 0;
  const mossadLocal = fs.existsSync(mossadDir)
    ? fs.readdirSync(mossadDir).filter((f) => f.endsWith('.mp3')).length
    : 0;

  if (cdnBase) {
    const probes = [`${cdnBase}/sherif_mostafa/065.mp3`, `${cdnBase}/abdurrahman_mossad/001.mp3`];
    for (const url of probes) {
      const res = await headRequest(url);
      if (!res.ok) throw new Error(`AUDIO_CDN_BASE probe failed (${res.status || res.error}): ${url}`);
      console.log(`[PASS] AUDIO_CDN_BASE: ${url} -> HTTP ${res.status}`);
    }
  } else {
    console.log('AUDIO_CDN_BASE not set; verifying remote HTTPS reciter mirrors directly.');
  }
  console.log(
    `Optional local MP3 drop count: sherif_mostafa=${sherifLocal}, abdurrahman_mossad=${mossadLocal}\n`
  );
}

async function verifyReciterUrls() {
  console.log('--- Verifying audio URLs across all 10 reciters ---');
  const testCases = [
    {
      reciter: 'Mishary Alafasy',
      type: 'ayah',
      candidates: [
        'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3',
        'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
      ],
    },
    {
      reciter: 'Abdul Basit',
      type: 'ayah',
      candidates: [
        'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/001001.mp3',
        'https://cdn.islamic.network/quran/audio/64/ar.abdulbasitmurattal/1.mp3',
      ],
    },
    {
      reciter: 'Saad Al-Ghamdi',
      type: 'ayah',
      candidates: ['https://everyayah.com/data/Ghamadi_40kbps/001001.mp3'],
    },
    {
      reciter: 'El-Minshawi',
      type: 'ayah',
      candidates: [
        'https://cdn.islamic.network/quran/audio/128/ar.minshawi/1.mp3',
        'https://everyayah.com/data/Minshawy_Murattal_128kbps/001001.mp3',
      ],
    },
    {
      reciter: 'Maher Al-Muaiqly',
      type: 'ayah',
      candidates: [
        'https://cdn.islamic.network/quran/audio/128/ar.mahermuaiqly/1.mp3',
        'https://everyayah.com/data/MaherAlMuaiqly128kbps/001001.mp3',
      ],
    },
    {
      reciter: 'Yasser Ad-Dossari',
      type: 'ayah',
      candidates: ['https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/001001.mp3'],
    },
    { reciter: 'Mishary (Surah)', type: 'surah', candidates: ['https://server8.mp3quran.net/afs/001.mp3'] },
    {
      reciter: 'Abdul Basit (Surah)',
      type: 'surah',
      candidates: ['https://server7.mp3quran.net/basit/001.mp3'],
    },
    { reciter: 'Ghamdi (Surah)', type: 'surah', candidates: ['https://server7.mp3quran.net/s_gmd/001.mp3'] },
    {
      reciter: 'Islam Sobhi (Surah)',
      type: 'surah',
      candidates: ['https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/001.mp3'],
    },
    {
      reciter: 'Raad Kurdi (Surah)',
      type: 'surah',
      candidates: ['https://server6.mp3quran.net/kurdi/001.mp3'],
    },
    {
      reciter: 'Sherif Mostafa (Surah 65)',
      type: 'surah',
      candidates: [
        'https://server6.mp3quran.net/shrf/065.mp3',
        'https://download.quranplayermp3.com/quran/mix/Sherif-Mostafa/065.mp3',
      ],
    },
    {
      reciter: 'Abdurrahman Mossad (Surah 29)',
      type: 'surah',
      candidates: [
        'https://server16.mp3quran.net/mossad/029.mp3',
        'https://download.quranplayermp3.com/quran/mix/Abdul-Rahman-Mosad/029.mp3',
      ],
    },
  ];

  let passed = 0;
  for (const tc of testCases) {
    let ok = false;
    let detail = '';
    for (const url of tc.candidates) {
      let res = await headRequest(url);
      if (!res.ok && !res.status) {
        res = await headRequest(url);
      }
      if (res.ok) {
        console.log(`[PASS] ${tc.reciter} (${tc.type}): HTTP ${res.status} (${url})`);
        ok = true;
        passed++;
        break;
      }
      detail += `${url} -> ${res.status || res.error}; `;
    }
    if (!ok) {
      console.warn(`[WARN] ${tc.reciter} (${tc.type}): all mirrors failed (${detail})`);
    }
  }

  console.log(`\nVerified ${passed}/${testCases.length} endpoint groups successfully.`);
  return { passed, total: testCases.length };
}

async function verifyAvailabilityJson() {
  console.log('\n--- Checking reciter-availability.json ---');
  if (!fs.existsSync(AVAILABILITY_FILE)) {
    throw new Error('reciter-availability.json not found!');
  }
  const data = JSON.parse(fs.readFileSync(AVAILABILITY_FILE, 'utf8'));
  const reciterKeys = Object.keys(data);
  console.log(`Found ${reciterKeys.length} reciters in availability registry.`);

  for (const key of reciterKeys) {
    const list = Array.isArray(data[key]) ? data[key] : data[key].available || [];
    console.log(`- ${key}: ${list.length} available surahs`);
  }

  if (data.abdurrahman_mossad.length !== 2) {
    throw new Error(`Expected mossad to have 2 available surahs, got ${data.abdurrahman_mossad.length}`);
  }
  if (data.sherif_mostafa.length !== 8) {
    throw new Error(`Expected sherif to have 8 available surahs, got ${data.sherif_mostafa.length}`);
  }
  if (data.islam_sobhi.length !== 112) {
    throw new Error(`Expected sobhi to have 112 available surahs, got ${data.islam_sobhi.length}`);
  }
  console.log('✓ Availability registry numbers validated.\n');
}

async function main() {
  console.log('=== Noor Al-Quran Audio Verification Suite ===\n');
  await checkOptionalCdnAndLocalBundle();
  await verifyAvailabilityJson();
  await verifyReciterUrls();
  console.log('=== All Audio Checks Completed ===');
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
