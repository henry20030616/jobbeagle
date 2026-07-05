#!/usr/bin/env node
/**
 * Create Lemon Squeezy products/webhook and update .env.local variant IDs.
 * Needs: LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID in .env.local
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';
import { loadEnvLocal, requireEnv } from './lib/env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = resolve(root, '.env.local');
const WEBHOOK_URL = 'https://www.jobbeagle.com/api/payment/webhook';

const PRODUCTS = [
  { key: 'LEMONSQUEEZY_VARIANT_SINGLE_FULL', name: 'JobBeagle Single Full', price: 999, sub: false },
  { key: 'LEMONSQUEEZY_VARIANT_STANDARD_SUB', name: 'JobBeagle Standard', price: 1999, sub: true },
  { key: 'LEMONSQUEEZY_VARIANT_ADVANCED_SUB', name: 'JobBeagle Advanced', price: 3999, sub: true },
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

// List existing variants in store
const variantsRes = await ls(
  `/variants?filter[store_id]=${env.LEMONSQUEEZY_STORE_ID}&page[size]=100`,
);
const existing = variantsRes.data || [];

for (const spec of PRODUCTS) {
  if (env[spec.key]?.trim()) {
    console.log(`skip ${spec.key} (already ${env[spec.key]})`);
    continue;
  }

  const match = existing.find((v) => {
    const name = v.attributes?.name || '';
    return name.toLowerCase().includes(spec.name.toLowerCase().replace('jobbeagle ', ''));
  });

  if (match) {
    upsertEnv(spec.key, String(match.id));
    continue;
  }

  console.log(`create product ${spec.name}…`);
  const product = await ls('/products', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'products',
        attributes: {
          name: spec.name,
          price: spec.price,
          status: 'published',
        },
        relationships: {
          store: { data: { type: 'stores', id: String(env.LEMONSQUEEZY_STORE_ID) } },
        },
      },
    }),
  });

  const productId = product.data.id;
  const variant = await ls('/variants', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'variants',
        attributes: {
          name: spec.name,
          price: spec.price,
          status: 'published',
          is_subscription: spec.sub,
          ...(spec.sub ? { interval: 'month', interval_count: 1 } : {}),
        },
        relationships: {
          product: { data: { type: 'products', id: String(productId) } },
        },
      },
    }),
  });

  upsertEnv(spec.key, String(variant.data.id));
}

// Webhook
if (!env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim()) {
  const hooks = await ls(`/webhooks?filter[store_id]=${env.LEMONSQUEEZY_STORE_ID}`);
  const found = (hooks.data || []).find((w) => w.attributes?.url === WEBHOOK_URL);
  if (found?.attributes?.secret) {
    upsertEnv('LEMONSQUEEZY_WEBHOOK_SECRET', found.attributes.secret);
  } else {
    const secret = randomBytes(24).toString('hex');
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
    const whSecret = hook.data?.attributes?.secret || secret;
    upsertEnv('LEMONSQUEEZY_WEBHOOK_SECRET', whSecret);
  }
} else {
  console.log('skip LEMONSQUEEZY_WEBHOOK_SECRET (already set)');
}

console.log('Lemon Squeezy setup done');
