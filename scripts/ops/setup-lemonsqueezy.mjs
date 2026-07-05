#!/usr/bin/env node
/**
 * Map existing Lemon Squeezy products to env + create webhook.
 * Products must exist in LS dashboard (API cannot create products).
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';
import { loadEnvLocal, requireEnv } from './lib/env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = resolve(root, '.env.local');
const WEBHOOK_URL = 'https://www.jobbeagle.com/api/payment/webhook';

/** Map env key → product price in cents */
const PRICE_MAP = [
  { key: 'LEMONSQUEEZY_VARIANT_SINGLE_FULL', price: 999 },
  { key: 'LEMONSQUEEZY_VARIANT_STANDARD_SUB', price: 1999 },
  { key: 'LEMONSQUEEZY_VARIANT_ADVANCED_SUB', price: 3999 },
];

const env = loadEnvLocal();
requireEnv(env, ['LEMONSQUEEZY_API_KEY', 'LEMONSQUEEZY_STORE_ID']);

async function ls(path, opts = {}) {
  const res = await fetch(`https://api.lemonsqueezy.com/v1${path}`, {
    ...opts,
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY}`,
      ...opts.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`LS ${path} → ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  }
  return data;
}

function upsertEnv(key, value) {
  let text = readFileSync(envPath, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  text = re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`;
  writeFileSync(envPath, text);
  env[key] = value;
  console.log(`  set ${key}=${value}`);
}

const productsRes = await ls(
  `/products?filter[store_id]=${env.LEMONSQUEEZY_STORE_ID}&include=variants&page[size]=100`,
);

for (const { key, price } of PRICE_MAP) {
  if (env[key]?.trim()) {
    console.log(`skip ${key} (already ${env[key]})`);
    continue;
  }
  const product = (productsRes.data || []).find((p) => p.attributes?.price === price);
  const variantId = product?.relationships?.variants?.data?.[0]?.id;
  if (!variantId) {
    console.warn(`WARN no product at $${(price / 100).toFixed(2)} for ${key}`);
    continue;
  }
  upsertEnv(key, String(variantId));
  console.log(`  matched ${product.attributes.name}`);
}

// Store is in test mode if any mapped product is test_mode
const anyTest = (productsRes.data || []).some((p) => p.attributes?.test_mode);
if (anyTest && env.LEMONSQUEEZY_TEST_MODE !== 'true') {
  upsertEnv('LEMONSQUEEZY_TEST_MODE', 'true');
  console.log('  (products are test_mode — set LEMONSQUEEZY_TEST_MODE=true)');
}

if (!env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim()) {
  const hooks = await ls(`/webhooks?filter[store_id]=${env.LEMONSQUEEZY_STORE_ID}`);
  const found = (hooks.data || []).find((w) => w.attributes?.url === WEBHOOK_URL);
  if (found?.attributes?.secret) {
    upsertEnv('LEMONSQUEEZY_WEBHOOK_SECRET', found.attributes.secret);
  } else {
    const secret = randomBytes(20).toString('hex');
    console.log('create webhook…');
    const hook = await ls('/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'webhooks',
          attributes: {
            url: WEBHOOK_URL,
            events: ['order_created', 'subscription_created', 'subscription_payment_success'],
            secret,
          },
          relationships: {
            store: { data: { type: 'stores', id: String(env.LEMONSQUEEZY_STORE_ID) } },
          },
        },
      }),
    });
    upsertEnv('LEMONSQUEEZY_WEBHOOK_SECRET', hook.data?.attributes?.secret || secret);
  }
} else {
  console.log('skip LEMONSQUEEZY_WEBHOOK_SECRET (already set)');
}

console.log('Lemon Squeezy setup done');
