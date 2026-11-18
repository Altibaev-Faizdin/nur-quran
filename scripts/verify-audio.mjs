/**
 * scripts/verify-audio.mjs
 * Verification of audio endpoints and availability for all 10 reciters.
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const AVAILABILITY_FILE = path.join(ROOT_DIR, 'frontend', 'data', 'reciter-availability.json');

async function headRequest(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const mod = parsed.protocol === 'https:' ? https : http;
      const req = mod.request(parsed, {
        method: 'HEAD',
        timeout: 5000,
        headers: { 'User-Agent': 'Noor-Quran-Audio-Verifier/1.0' }
      }, (res) => {
        resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
      });
      req.on('error', (err) => resolve({ status: null, ok: false, error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ status: null, ok: false, error: 'timeout' }); });
      req.end();
    } catch (e) {
      resolve({ status: null, ok: false, error: e.message });
    }
  });
}

async function verifyLocalAudioFiles() {
  console.log('--- Checking local audio bundle ---');
  const sherifDir = path.join(ROOT_DIR, 'frontend', 'audio', 'sherif_mostafa');
  const mossadDir = path.join(ROOT_DIR, 'frontend', 'audio', 'abdurrahman_mossad');

  const sherifFiles = fs.existsSync(sherifDir) ? fs.readdirSync(sherifDir).filter(f => f.endsWith('.mp3')) : [];
  const mossadFiles = fs.existsSync(mossadDir) ? fs.readdirSync(mossadDir).filter(f => f.endsWith('.mp3')) : [];

  console.log(`Sherif Mostafa local files: ${sherifFiles.length} (${sherifFiles.join(', ')})`);
  console.log(`Abdurrahman Mossad local files: ${mossadFiles.length} (${mossadFiles.join(', ')})`);

  if (sherifFiles.length < 8) {
    throw new Error(`Sherif Mostafa expected 8 local mp3 files, found ${sherifFiles.length}`);
  }
  if (mossadFiles.length < 2) {
    throw new Error(`Abdurrahman Mossad expected 2 local mp3 files, found ${mossadFiles.length}`);
  }
  console.log('✓ Local audio bundle verified\n');
}

async function verifyReciterUrls() {
  console.log('--- Verifying audio URLs across reciters ---');
  const testCases = [
    { reciter: 'Mishary Alafasy', type: 'ayah', url: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3' },
    { reciter: 'Abdul Basit', type: 'ayah', url: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/001001.mp3' },
    { reciter: 'Saad Al-Ghamdi', type: 'ayah', url: 'https://everyayah.com/data/Ghamadi_40kbps/001001.mp3' },
    { reciter: 'El-Minshawi', type: 'ayah', url: 'https://everyayah.com/data/Minshawy_Murattal_128kbps/001001.mp3' },
    { reciter: 'Maher Al-Muaiqly', type: 'ayah', url: 'https://everyayah.com/data/MaherAlMuaiqly128kbps/001001.mp3' },
    { reciter: 'Yasser Ad-Dossari', type: 'ayah', url: 'https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/001001.mp3' },
    { reciter: 'Mishary (Surah)', type: 'surah', url: 'https://server8.mp3quran.net/afs/001.mp3' },
    { reciter: 'Abdul Basit (Surah)', type: 'surah', url: 'https://server7.mp3quran.net/basit/001.mp3' },
    { reciter: 'Ghamdi (Surah)', type: 'surah', url: 'https://server7.mp3quran.net/s_gmd/001.mp3' },
    { reciter: 'Islam Sobhi (Surah)', type: 'surah', url: 'https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/001.mp3' },
    { reciter: 'Raad Kurdi (Surah)', type: 'surah', url: 'https://server6.mp3quran.net/kurdi/001.mp3' }
  ];

  let passed = 0;
  for (const tc of testCases) {
    const res = await headRequest(tc.url);
    if (res.ok) {
      console.log(`[PASS] ${tc.reciter} (${tc.type}): HTTP ${res.status}`);
      passed++;
    } else {
      console.warn(`[WARN] ${tc.reciter} (${tc.type}): HTTP ${res.status || res.error} - ${tc.url}`);
    }
  }

  console.log(`\nVerified ${passed}/${testCases.length} online endpoints successfully.`);
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
    const list = Array.isArray(data[key]) ? data[key] : (data[key].available || []);
    const count = list.length;
    console.log(`- ${key}: ${count} available surahs`);
  }

  const mossadCount = data.abdurrahman_mossad.length;
  const sherifCount = data.sherif_mostafa.length;
  const sobhiCount = data.islam_sobhi.length;

  if (mossadCount !== 2) {
    throw new Error(`Expected mossad to have 2 available surahs, got ${mossadCount}`);
  }
  if (sherifCount !== 8) {
    throw new Error(`Expected sherif to have 8 available surahs, got ${sherifCount}`);
  }
  if (sobhiCount !== 112) {
    throw new Error(`Expected sobhi to have 112 available surahs, got ${sobhiCount}`);
  }
  console.log('✓ Availability registry numbers validated.\n');
}

async function main() {
  console.log('=== Noor Al-Quran Audio Verification Suite ===\n');
  await verifyLocalAudioFiles();
  await verifyAvailabilityJson();
  await verifyReciterUrls();
  console.log('=== All Audio Checks Completed ===');
}

main().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
