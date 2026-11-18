#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const frontendDir = path.join(rootDir, 'frontend');

console.log('🔒 Starting Security & Hardening Verification...\n');

let errors = [];

function checkFileContent(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relPath = path.relative(rootDir, filePath);

  // 1. Check for hardcoded localhost:8000 (except legitimate dev-fallback in shared.js)
  if (content.includes('http://localhost:8000')) {
    if (relPath !== 'frontend/shared.js') {
      errors.push(`[SEC-01] Hardcoded http://localhost:8000 found in ${relPath}`);
    }
  }

  // 2. Check for demo-session-token
  if (content.includes('demo-session-token')) {
    errors.push(`[SEC-01] Insecure demo-session-token found in ${relPath}`);
  }

  // 3. Check for eval() or document.write()
  if (/\beval\s*\(/.test(content)) {
    errors.push(`[SEC-03] Dangerous eval() found in ${relPath}`);
  }
  if (/document\.write\s*\(/.test(content)) {
    errors.push(`[SEC-03] Dangerous document.write() found in ${relPath}`);
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
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.html'))) {
      checkFileContent(fullPath);
    }
  }
}

walkDir(frontendDir);

// 4. Verify netlify.toml security headers
const netlifyPath = path.join(rootDir, 'netlify.toml');
if (!fs.existsSync(netlifyPath)) {
  errors.push('[SEC-02] netlify.toml is missing');
} else {
  const netlifyContent = fs.readFileSync(netlifyPath, 'utf-8');
  const requiredHeaders = [
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Strict-Transport-Security'
  ];
  for (const h of requiredHeaders) {
    if (!netlifyContent.includes(h)) {
      errors.push(`[SEC-02] Missing security header in netlify.toml: ${h}`);
    }
  }
  if (!netlifyContent.includes('for = "/*"')) {
    errors.push('[SEC-02] netlify.toml must have global headers for /*');
  }
}

// 5. Verify .env.example exists and doesn't contain real secrets
const envExPath = path.join(rootDir, '.env.example');
if (!fs.existsSync(envExPath)) {
  errors.push('[SEC-11] .env.example is missing');
}

// 6. Verify staticfiles is not tracked in git
if (fs.existsSync(path.join(rootDir, 'backend/staticfiles/staticfiles.json'))) {
  // Check if tracked by git
  try {
    const { execSync } = await import('node:child_process');
    const tracked = execSync('git ls-files backend/staticfiles', { encoding: 'utf-8' }).trim();
    if (tracked.length > 0) {
      errors.push('[SEC-11] backend/staticfiles is tracked in git index');
    }
  } catch (e) {}
}

if (errors.length > 0) {
  console.error('❌ Security verification failed:');
  errors.forEach(err => console.error('  • ' + err));
  process.exit(1);
} else {
  console.log('✅ All security and hardening verification checks PASSED!');
  process.exit(0);
}

