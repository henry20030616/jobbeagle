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

// Entitlement lock (migration 011): anon must not EXECUTE increment_profile_credits
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (anon) {
  const rpc = await fetch(`${url}/rest/v1/rpc/increment_profile_credits`, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_job_fit_snapshot: 1,
      p_interview_strategy_guide: 0,
    }),
  });
  // Expect 401/403/404 — never 200 from anon
  if (rpc.ok) {
    console.error('SECURITY FAIL: anon can call increment_profile_credits');
    process.exit(1);
  }
  console.log('credit RPC locked from anon OK — status:', rpc.status);
} else {
  console.warn('skip anon RPC check (no NEXT_PUBLIC_SUPABASE_ANON_KEY)');
}
