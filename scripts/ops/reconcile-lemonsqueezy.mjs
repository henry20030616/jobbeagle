#!/usr/bin/env node
/**
 * CLI wrapper for Lemon↔DB billing reconcile.
 *
 *   node scripts/ops/reconcile-lemonsqueezy.mjs
 *   node scripts/ops/reconcile-lemonsqueezy.mjs --alert
 *
 * Loads .env.local then runs the same checks as /api/cron/reconcile-billing
 * via a small inline fetch against production when --remote is set; otherwise
 * uses local service-role + Lemon API directly (duplicated minimal logic so
 * the script stays runnable without a TS build).
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal, requireEnv } from './lib/env.mjs';

const env = { ...process.env, ...loadEnvLocal() };
requireEnv(env, [
  'LEMONSQUEEZY_API_KEY',
  'LEMONSQUEEZY_STORE_ID',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]);

const wantAlert = process.argv.includes('--alert');
const apiKey = env.LEMONSQUEEZY_API_KEY;
const storeId = env.LEMONSQUEEZY_STORE_ID;

async function lsGet(path) {
  const res = await fetch(`https://api.lemonsqueezy.com/v1${path}`, {
    headers: {
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.detail || `LS ${res.status} ${path}`);
  }
  return json;
}

async function sendAlert(subject, bodyText) {
  const to = env.ALERT_EMAIL || env.BILLING_ALERT_EMAIL;
  const key = env.RESEND_API_KEY;
  if (!to || !key) {
    console.warn('Alert skipped — set RESEND_API_KEY and ALERT_EMAIL');
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.ALERT_FROM || 'JobBeagle Billing <onboarding@resend.dev>',
      to: [to],
      subject,
      text: bodyText,
    }),
  });
  if (!res.ok) {
    console.warn('Resend failed:', await res.text());
    return false;
  }
  console.log('OK  alert emailed to', to);
  return true;
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

console.log('=== Lemon Squeezy ↔ Supabase reconcile ===');

const ordersJson = await lsGet(
  `/orders?filter[store_id]=${encodeURIComponent(storeId)}&page[size]=50`,
);
const lsOrders = Array.isArray(ordersJson.data) ? ordersJson.data : [];
const paidLs = lsOrders.filter((o) => o.attributes?.status === 'paid');

const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
const { data: dbOrders, error: dbErr } = await admin
  .from('orders')
  .select('id, status, external_checkout_id, plan_type, created_at')
  .gte('created_at', since)
  .order('created_at', { ascending: false })
  .limit(200);

if (dbErr) throw new Error(dbErr.message);

const byExternal = new Map(
  (dbOrders || [])
    .filter((o) => o.external_checkout_id)
    .map((o) => [String(o.external_checkout_id), o]),
);

const pendingStuck = (dbOrders || []).filter(
  (o) => o.status === 'pending' && Date.now() - new Date(o.created_at).getTime() > 60 * 60 * 1000,
);

const paidMissingLocal = [];
for (const row of paidLs) {
  const id = String(row.id);
  const local = byExternal.get(id);
  if (!local) {
    paidMissingLocal.push({
      lemon_order_id: id,
      email: row.attributes?.user_email,
      total: row.attributes?.total,
      created_at: row.attributes?.created_at,
    });
  } else if (local.status !== 'succeeded') {
    paidMissingLocal.push({
      lemon_order_id: id,
      local_order_id: local.id,
      local_status: local.status,
      email: row.attributes?.user_email,
    });
  }
}

console.log(`LS paid orders (page): ${paidLs.length}`);
console.log(`DB orders (14d): ${(dbOrders || []).length}`);
console.log(`Pending >1h: ${pendingStuck.length}`);
console.log(`Paid LS without local succeeded: ${paidMissingLocal.length}`);

const issues = paidMissingLocal.length + pendingStuck.length;
const summary = [
  `JobBeagle billing reconcile ${new Date().toISOString()}`,
  `Paid LS without local succeeded: ${paidMissingLocal.length}`,
  `Stuck pending (>1h): ${pendingStuck.length}`,
  '',
  paidMissingLocal.length
    ? `Sample:\n${paidMissingLocal.slice(0, 10).map((r) => JSON.stringify(r)).join('\n')}`
    : 'No paid↔local mismatches on this page.',
].join('\n');

console.log('\n' + summary);

if (wantAlert && issues > 0) {
  await sendAlert(`[JobBeagle] Billing reconcile: ${issues} issue(s)`, summary);
}

process.exit(issues > 0 ? 1 : 0);
