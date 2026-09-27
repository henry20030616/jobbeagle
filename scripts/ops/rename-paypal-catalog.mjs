#!/usr/bin/env node
/**
 * Update PayPal catalog copy to Fit Snapshot / Interview Guide.
 * Patches existing subscription plans (and matching products) — does not create new ones.
 */
import { loadEnvLocal, requireEnv } from './lib/env.mjs';

const env = loadEnvLocal();
requireEnv(env, ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET']);

const environment = env.PAYPAL_ENVIRONMENT === 'live' ? 'live' : 'sandbox';
const apiBase =
  environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

const PLAN_COPY = {
  PAYPAL_PLAN_STANDARD_SUB: {
    name: 'JobBeagle Standard',
    description: 'Standard plan: 100 Fit Snapshots + 5 Interview Guides per month',
  },
  PAYPAL_PLAN_ADVANCED_SUB: {
    name: 'JobBeagle Advanced',
    description: 'Advanced plan: 300 Fit Snapshots + 15 Interview Guides per month',
  },
};

async function paypalFetch(token, path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...headers,
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
console.log(`PayPal catalog rename (${environment})`);

for (const [envKey, copy] of Object.entries(PLAN_COPY)) {
  const planId = env[envKey]?.trim();
  if (!planId) {
    console.log(`skip ${envKey} (not set)`);
    continue;
  }
  try {
    await paypalFetch(token, `/v1/billing/plans/${planId}`, {
      method: 'PATCH',
      body: [
        { op: 'replace', path: '/name', value: copy.name },
        { op: 'replace', path: '/description', value: copy.description },
      ],
    });
    console.log(`updated plan ${envKey}`);
  } catch (err) {
    console.warn(`name+description failed for ${envKey}, trying description only`);
    await paypalFetch(token, `/v1/billing/plans/${planId}`, {
      method: 'PATCH',
      body: [{ op: 'replace', path: '/description', value: copy.description }],
    });
    console.log(`updated plan description ${envKey}`);
  }
}

const products = await paypalFetch(token, '/v1/catalogs/products?page_size=20');
for (const product of products.products ?? []) {
  const name = String(product.name || '');
  const desc = String(product.description || '');
  if (!/jobbeagle/i.test(`${name} ${desc}`)) continue;
  const nextDesc = 'SaaS digital AI reports: Fit Snapshot and Interview Guide credits.';
  if (desc.includes('Fit Snapshot')) {
    console.log(`skip product ${product.id} (already renamed)`);
    continue;
  }
  await paypalFetch(token, `/v1/catalogs/products/${product.id}`, {
    method: 'PATCH',
    body: [{ op: 'replace', path: '/description', value: nextDesc }],
  });
  console.log(`updated product ${product.id}`);
}

console.log('Done. One-time checkout names come from CHECKOUT_PLANS on the next payment.');
