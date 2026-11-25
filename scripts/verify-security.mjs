#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const frontendDir = path.join(rootDir, 'frontend');

console.log('🔒 Starting Security & Hardening Verification...\n');

const errors = [];

function checkFrontendFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relPath = path.relative(rootDir, filePath);

  if (content.includes('http://localhost:8000') || content.includes('demo-session-token')) {
    errors.push(`[SEC-01] Legacy dev host or token found in ${relPath}`);
  }
  if (/\beval\s*\(/.test(content) || /document\.write\s*\(/.test(content)) {
    errors.push(`[SEC-03] Dangerous eval() or document.write() found in ${relPath}`);
  }
  if (
    filePath.endsWith('.js') &&
    /localStorage\.(get|set)Item\(\s*['"](?:access_token|refresh_token|nq_access_token|nq_refresh_token)['"]/.test(
      content
    )
  ) {
    errors.push(`[SEC-TOKEN] JWT token read/write in localStorage found in ${relPath}`);
  }
  if (filePath.endsWith('.html')) {
    if (/<style[\s>]/i.test(content)) {
      errors.push(`[CSP] Inline <style> block found in ${relPath}`);
    }
    if (/<script(?![^>]*\ssrc=)[^>]*>/i.test(content)) {
      errors.push(`[CSP] Inline <script> block found in ${relPath}`);
    }
    if (/\sstyle\s*=/i.test(content)) {
      errors.push(`[CSP] Inline style= attribute found in ${relPath}`);
    }
    if (/\son[a-z]+\s*=/i.test(content)) {
      errors.push(`[CSP] Inline on*= event handler found in ${relPath}`);
    }
    if (/javascript:/i.test(content)) {
      errors.push(`[A11Y/SEO] javascript: URI found in ${relPath}`);
    }
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
      checkFrontendFile(fullPath);
    }
  }
}

walkDir(frontendDir);

const netlifyPath = path.join(rootDir, 'netlify.toml');
if (!fs.existsSync(netlifyPath)) {
  errors.push('[SEC-02] netlify.toml is missing');
} else {
  const netlifyContent = fs.readFileSync(netlifyPath, 'utf-8');
  for (const h of [
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Strict-Transport-Security',
  ]) {
    if (!netlifyContent.includes(h)) {
      errors.push(`[SEC-02] Missing security header in netlify.toml: ${h}`);
    }
  }
  if (netlifyContent.includes("'unsafe-inline'")) {
    errors.push("[SEC-02] netlify.toml Content-Security-Policy must not contain 'unsafe-inline'");
  }
  if (!netlifyContent.includes('for = "/*"')) {
    errors.push('[SEC-02] netlify.toml must define headers for /*');
  }
}

const secMiddlewarePath = path.join(rootDir, 'backend/api/middleware.py');
if (fs.existsSync(secMiddlewarePath)) {
  const secMiddleware = fs.readFileSync(secMiddlewarePath, 'utf-8');
  const frontendCspSection = secMiddleware.split('else:')?.[1] || '';
  if (frontendCspSection.includes("'unsafe-inline'")) {
    errors.push("[SEC-02] backend/api/middleware.py must not allow 'unsafe-inline' on frontend/API routes");
  }
}

if (!fs.existsSync(path.join(rootDir, '.env.example'))) {
  errors.push('[SEC-11] .env.example is missing');
}

try {
  const trackedAudio = execSync('git ls-files frontend/audio', { encoding: 'utf-8' }).trim();
  if (trackedAudio.length > 0) {
    errors.push('[SIZE] Heavy audio MP3 files are still tracked in git index');
  }
} catch (_e) {
  /* not fatal outside git */
}

if (errors.length > 0) {
  console.error('❌ Security verification failed:');
  errors.forEach((err) => console.error('  • ' + err));
  process.exit(1);
} else {
  console.log('✅ All security and hardening verification checks PASSED!');
}
