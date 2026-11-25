#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const rootDir = process.cwd();
const frontendDir = path.join(rootDir, 'frontend');

function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return Date.now().toString(36);
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(buf).digest('hex').slice(0, 8);
}

const hashes = {
  'shared.css': getFileHash(path.join(frontendDir, 'shared.css')),
  'css/pages.css': getFileHash(path.join(frontendDir, 'css/pages.css')),
  'shared.js': getFileHash(path.join(frontendDir, 'shared.js')),
  'idb-store.js': getFileHash(path.join(frontendDir, 'idb-store.js')),
  'i18n.js': getFileHash(path.join(frontendDir, 'i18n.js')),
  'reciter-player.js': getFileHash(path.join(frontendDir, 'reciter-player.js')),
  'data/names-data.js': getFileHash(path.join(frontendDir, 'data/names-data.js')),
};

const pageJsDir = path.join(frontendDir, 'js/pages');
if (fs.existsSync(pageJsDir)) {
  for (const name of fs.readdirSync(pageJsDir)) {
    if (name.endsWith('.js')) {
      hashes[`js/pages/${name}`] = getFileHash(path.join(pageJsDir, name));
    }
  }
}

console.log('📦 Asset Hashes:');
for (const [k, v] of Object.entries(hashes)) {
  console.log(`  ${k}: ${v}`);
}

function updateHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  for (const [assetPath, hash] of Object.entries(hashes)) {
    const escaped = assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(["'/])(${escaped})(\\?v=[a-zA-Z0-9_-]+)?`, 'g');
    content = content.replace(regex, `$1$2?v=${hash}`);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✓ Updated assets in ${path.relative(rootDir, filePath)}`);
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'audio') {
        walkDir(fullPath);
      }
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      updateHtmlFile(fullPath);
    }
  }
}

walkDir(frontendDir);
console.log('\n✅ Asset versioning completed successfully!');
