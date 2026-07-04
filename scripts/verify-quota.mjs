/**
 * Verifies usage_limits read/upsert and 2/day quota logic against Supabase.
 * Run: node scripts/verify-quota.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local');
  const text = readFileSync(path, 'utf8');
  const env = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

function hashKey(ip) {
  return createHash('sha256').update(ip + 'jb_rl_salt').digest('hex').substring(0, 24);
}

const GUEST_DAILY_LIMIT = 2;
const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('FAIL: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(url, key);
const testKey = hashKey('verify_quota_test_user');
const today = new Date().toISOString().split('T')[0];

async function cleanup() {
  await admin.from('usage_limits').delete().eq('ip_hash', testKey);
}

async function checkUsage(limitKey, dailyLimit) {
  const { data, error } = await admin
    .from('usage_limits')
    .select('count')
    .eq('ip_hash', limitKey)
    .eq('date', today)
    .maybeSingle();
  if (error) throw new Error(`read: ${error.message}`);
  const currentCount = data?.count ?? 0;
  return {
    allowed: currentCount < dailyLimit,
    currentCount,
  };
}

async function incrementUsage(limitKey, currentCount) {
  const { error } = await admin.from('usage_limits').upsert(
    { ip_hash: limitKey, date: today, count: currentCount + 1, updated_at: new Date().toISOString() },
    { onConflict: 'ip_hash,date' },
  );
  if (error) throw new Error(`upsert: ${error.message} | ${error.details ?? ''}`);
}

let failed = false;
function assert(label, cond) {
  if (!cond) {
    console.error(`FAIL: ${label}`);
    failed = true;
  } else {
    console.log(`OK: ${label}`);
  }
}

try {
  await cleanup();

  let r1 = await checkUsage(testKey, GUEST_DAILY_LIMIT);
  assert('attempt 1 allowed', r1.allowed && r1.currentCount === 0);
  await incrementUsage(testKey, r1.currentCount);

  let r2 = await checkUsage(testKey, GUEST_DAILY_LIMIT);
  assert('attempt 2 allowed after 1 use', r2.allowed && r2.currentCount === 1);
  await incrementUsage(testKey, r2.currentCount);

  let r3 = await checkUsage(testKey, GUEST_DAILY_LIMIT);
  assert('attempt 3 blocked after 2 uses', !r3.allowed && r3.currentCount === 2);

  await cleanup();
  if (failed) process.exit(1);
  console.log('\nAll quota DB checks passed.');
} catch (e) {
  console.error('FAIL:', e.message);
  await cleanup();
  process.exit(1);
}
