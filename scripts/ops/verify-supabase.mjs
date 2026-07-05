#!/usr/bin/env node
/**
 * Verify Supabase profiles table + sample rows (uses .env.local).
 * Usage: node scripts/ops/verify-supabase.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = resolve(root, '.env.local');

function loadEnv() {
  const vars = {};
  try {
    const text = readFileSync(envPath, 'utf8');
    for (const line of text.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      vars[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
  } catch {
    console.error('Missing .env.local');
    process.exit(1);
  }
  return vars;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const res = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: 'count=exact',
  },
});

if (!res.ok) {
  const body = await res.text();
  console.error('profiles check FAILED:', res.status, body.slice(0, 300));
  process.exit(1);
}

const count = res.headers.get('content-range')?.split('/')[1] ?? '?';
console.log('profiles table OK — row count:', count);
