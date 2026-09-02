#!/usr/bin/env node
/**
 * Create PayPal catalog (Standard/Advanced plans) + webhook, write IDs to .env.local.
 * Needs: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET in .env.local
 * Optional: PAYPAL_ENVIRONMENT=sandbox|live (default sandbox)
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvLocal, requireEnv } from './lib/env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = resolve(root, '.env.local');
const WEBHOOK_URL = 'https://www.jobbeagle.com/api/payment/webhook';
const WEBHOOK_EVENTS = [
  'PAYMENT.CAPTURE.COMPLETED',
  'CHECKOUT.ORDER.APPROVED',
  'BILLING.SUBSCRIPTION.ACTIVATED',
  'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.EXPIRED',
  'PAYMENT.SALE.COMPLETED',
];

const env = loadEnvLocal();
requireEnv(env, ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET']);

const environment = env.PAYPAL_ENVIRONMENT === 'live' ? 'live' : 'sandbox';
const apiBase =
  environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

function upsertEnv(key, value) {
  let text = readFileSync(envPath, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  text = re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`;
  writeFileSync(envPath, text);
  env[key] = value;
  console.log(`  set ${key}=${value}`);
}

async function paypalFetch(token, path, { method = 'GET', body } = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  if (!res.ok) {
    throw new Error(`PayPal ${method} ${path} → ${res.status}: ${JSON.stringify(data).slice(0, 500)}`);
  }
  return data;
}

const basic = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64');
const tokenRes = await fetch(`${apiBase}/v1/oauth2/token`, {
  method: 'POST',
  headers: {
    Authorization: `Basic ${basic}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: 'grant_type=client_credentials',
});
const tokenJson = await tokenRes.json();
if (!tokenRes.ok || !tokenJson.access_token) {
  throw new Error(`PayPal OAuth failed (${tokenRes.status})`);
}
const token = tokenJson.access_token;
upsertEnv('PAYPAL_ENVIRONMENT', environment);

const product = await paypalFetch(token, '/v1/catalogs/products', {
  method: 'POST',
  body: {
    name: 'JobBeagle Reports',
    type: 'SERVICE',
    description: 'SaaS digital AI reports: Job Fit Snapshot and Interview Strategy Guide credits.',
  },
});
console.log(`  product ${product.id}`);

async function createPlan(name, value, envKey) {
  if (env[envKey]?.trim()) {
    console.log(`skip ${envKey} (already ${env[envKey]})`);
    return;
  }
  const plan = await paypalFetch(token, '/v1/billing/plans', {
    method: 'POST',
    body: {
      product_id: product.id,
      name,
      billing_cycles: [
        {
          frequency: { interval_unit: 'MONTH', interval_count: 1 },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value, currency_code: 'USD' } },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    },
  });
  upsertEnv(envKey, plan.id);
}

await createPlan('JobBeagle Standard', '19.99', 'PAYPAL_PLAN_STANDARD_SUB');
await createPlan('JobBeagle Advanced', '39.99', 'PAYPAL_PLAN_ADVANCED_SUB');

if (!env.PAYPAL_WEBHOOK_ID?.trim()) {
  const webhook = await paypalFetch(token, '/v1/notifications/webhooks', {
    method: 'POST',
    body: {
      url: WEBHOOK_URL,
      event_types: WEBHOOK_EVENTS.map((name) => ({ name })),
    },
  });
  upsertEnv('PAYPAL_WEBHOOK_ID', webhook.id);
} else {
  console.log(`skip PAYPAL_WEBHOOK_ID (already set)`);
}

console.log('Done. Sync Vercel env, then redeploy.');
