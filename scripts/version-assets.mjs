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

const cssHash = getFileHash(path.join(frontendDir, 'shared.css'));
const jsHash = getFileHash(path.join(frontendDir, 'shared.js'));
const idbHash = getFileHash(path.join(frontendDir, 'idb-store.js'));
const i18nHash = getFileHash(path.join(frontendDir, 'i18n.js'));

console.log(`📦 Asset Hashes:`);
console.log(`  shared.css:  ${cssHash}`);
console.log(`  shared.js:   ${jsHash}`);
console.log(`  idb-store.js: ${idbHash}`);
console.log(`  i18n.js:     ${i18nHash}\n`);

function updateHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Replace shared.css?v=... or bare shared.css
  content = content.replace(/(shared\.css)(\?v=[a-zA-Z0-9_-]+)?/g, `$1?v=${cssHash}`);

  // Replace shared.js?v=... or bare shared.js
  content = content.replace(/(shared\.js)(\?v=[a-zA-Z0-9_-]+)?/g, `$1?v=${jsHash}`);

  // Replace idb-store.js
  content = content.replace(/(idb-store\.js)(\?v=[a-zA-Z0-9_-]+)?/g, `$1?v=${idbHash}`);

  // Replace i18n.js
  content = content.replace(/(i18n\.js)(\?v=[a-zA-Z0-9_-]+)?/g, `$1?v=${i18nHash}`);

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
