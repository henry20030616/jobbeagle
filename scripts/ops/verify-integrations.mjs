#!/usr/bin/env node
/**
 * Verify GitHub remote, Supabase tables, production site.
 * Usage: node scripts/ops/verify-integrations.mjs
 */
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = resolve(root, '.env.local');

function loadEnv() {
  const vars = {};
  try {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      vars[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, '');
    }
  } catch {
    console.error('Missing .env.local');
    process.exit(1);
  }
  return vars;
}

function countTable(url, key, table) {
  return fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' },
  }).then(async (res) => {
    if (!res.ok) return { table, ok: false, status: res.status };
    const count = res.headers.get('content-range')?.split('/')[1] ?? '?';
    return { table, ok: true, count };
  });
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
let failed = false;

console.log('=== GitHub ===');
try {
  const remote = execSync('git remote get-url origin', { cwd: root, encoding: 'utf8' }).trim();
  const ok = remote.includes('github.com');
  console.log(ok ? `OK  origin → ${remote}` : `FAIL origin → ${remote}`);
  if (!ok) failed = true;
  execSync('git fetch origin --quiet', { cwd: root, stdio: 'pipe' });
  const branch = execSync('git status -sb', { cwd: root, encoding: 'utf8' }).trim().split('\n')[0];
  console.log(`OK  ${branch}`);
} catch (e) {
  console.error('FAIL git:', e.message);
  failed = true;
}

console.log('\n=== Supabase ===');
if (!url || !key) {
  console.error('FAIL missing SUPABASE env in .env.local');
  failed = true;
} else {
  console.log(`OK  project ${url.replace('https://', '').split('.')[0]}`);
  for (const table of ['profiles', 'referrals', 'analysis_reports']) {
    const r = await countTable(url, key, table);
    if (r.ok) console.log(`OK  ${table} (${r.count} rows)`);
    else {
      console.error(`FAIL ${table} HTTP ${r.status}`);
      failed = true;
    }
  }
}

console.log('\n=== Vercel / Production ===');
try {
  const who = execSync('npx vercel whoami 2>/dev/null', { cwd: root, encoding: 'utf8' }).trim();
  console.log(`OK  vercel logged in as ${who}`);
} catch {
  console.error('FAIL vercel not logged in (run: npx vercel login)');
  failed = true;
}

const site = 'https://www.jobbeagle.com';
try {
  const res = await fetch(site, { method: 'HEAD' });
  console.log(res.ok ? `OK  ${site} HTTP ${res.status}` : `FAIL ${site} HTTP ${res.status}`);
  if (!res.ok) failed = true;
} catch (e) {
  console.error('FAIL production site:', e.message);
  failed = true;
}

try {
  const cap = await fetch(`${site}/api/extension-capture`, { method: 'OPTIONS' });
  console.log(
    cap.status === 204 || cap.ok
      ? `OK  /api/extension-capture OPTIONS ${cap.status}`
      : `FAIL /api/extension-capture OPTIONS ${cap.status}`,
  );
  if (cap.status !== 204 && !cap.ok) failed = true;
} catch (e) {
  console.error('FAIL extension-capture:', e.message);
  failed = true;
}

try {
  const health = await fetch(`${site}/api/health`);
  const body = await health.json().catch(() => ({}));
  const ok = health.ok && body.ok === true;
  console.log(ok ? `OK  /api/health HTTP ${health.status}` : `FAIL /api/health HTTP ${health.status}`);
  if (!ok) failed = true;
} catch (e) {
  console.error('FAIL /api/health:', e.message);
  failed = true;
}

console.log(failed ? '\nRESULT: SOME CHECKS FAILED' : '\nRESULT: ALL CHECKS PASSED');
process.exit(failed ? 1 : 0);
