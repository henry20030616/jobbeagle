#!/usr/bin/env node
/**
 * Map Lemon Squeezy variant IDs + webhook into .env.local.
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
const WEBHOOK_EVENTS = [
  'order_created',
  'subscription_created',
  'subscription_payment_success',
  'subscription_cancelled',
  'subscription_expired',
];

const VARIANT_MAP = [
  { key: 'LEMONSQUEEZY_VARIANT_SINGLE_FULL', match: /single.?full/i, price: 999 },
  { key: 'LEMONSQUEEZY_VARIANT_STANDARD_SUB', match: /standard/i, price: 1999 },
  { key: 'LEMONSQUEEZY_VARIANT_ADVANCED_SUB', match: /advanced/i, price: 3999 },
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

function variantForProduct(product, variants) {
  const relId = product.relationships?.variants?.data?.[0]?.id;
  return (
    variants.find((v) => v.id === relId)
    || variants.find((v) => v.attributes?.product_id === Number(product.id))
  );
}

const catalog = await ls(
  `/products?filter[store_id]=${env.LEMONSQUEEZY_STORE_ID}&include=variants&page[size]=100`,
);
const existingProducts = catalog.data || [];
const existingVariants = (catalog.included || []).filter((x) => x.type === 'variants');

for (const spec of VARIANT_MAP) {
  if (env[spec.key]?.trim()) {
    console.log(`skip ${spec.key} (already ${env[spec.key]})`);
    continue;
  }

  const product = existingProducts.find((p) => {
    const name = p.attributes?.name || '';
    return spec.match.test(name) || p.attributes?.price === spec.price;
  });

  const variant =
    (product && variantForProduct(product, existingVariants))
    || existingVariants.find((v) => v.attributes?.price === spec.price);

  if (!variant) {
    console.warn(`WARN missing variant for ${spec.key} — create in LS dashboard`);
    continue;
  }
  upsertEnv(spec.key, String(variant.id));
}

if (!env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim()) {
  let found = null;
  try {
    const hooks = await ls(`/webhooks?filter[store_id]=${env.LEMONSQUEEZY_STORE_ID}&page[size]=50`);
    found = (hooks.data || []).find((w) => w.attributes?.url === WEBHOOK_URL);
  } catch (e) {
    console.warn('Could not list webhooks:', e.message.slice(0, 120));
  }

  if (found?.attributes?.secret) {
    upsertEnv('LEMONSQUEEZY_WEBHOOK_SECRET', found.attributes.secret);
  } else {
    const secret = randomBytes(16).toString('hex'); // 32 chars, LS max 40
    console.log('create webhook…');
    try {
      const hook = await ls('/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            type: 'webhooks',
            attributes: {
              url: WEBHOOK_URL,
              events: WEBHOOK_EVENTS,
              secret,
            },
            relationships: {
              store: { data: { type: 'stores', id: String(env.LEMONSQUEEZY_STORE_ID) } },
            },
          },
        }),
      });
      upsertEnv('LEMONSQUEEZY_WEBHOOK_SECRET', hook.data?.attributes?.secret || secret);
    } catch (e) {
      console.warn('WARN webhook create failed (API key may be read-only):', e.message.slice(0, 200));
      console.warn('Add webhook manually in LS dashboard and set LEMONSQUEEZY_WEBHOOK_SECRET');
    }
  }
} else {
  console.log('skip LEMONSQUEEZY_WEBHOOK_SECRET (already set)');
}

try {
  const hooks = await ls(`/webhooks?filter[store_id]=${env.LEMONSQUEEZY_STORE_ID}&page[size]=50`);
  const existing = (hooks.data || []).find((w) => w.attributes?.url === WEBHOOK_URL);
  if (existing?.id) {
    const current = existing.attributes?.events || [];
    const missing = WEBHOOK_EVENTS.filter((e) => !current.includes(e));
    if (missing.length > 0) {
      console.log('update webhook events…', missing.join(', '));
      await ls(`/webhooks/${existing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          data: {
            type: 'webhooks',
            id: String(existing.id),
            attributes: { events: WEBHOOK_EVENTS },
          },
        }),
      });
    }
  }
} catch (e) {
  console.warn('WARN webhook event update failed:', e.message.slice(0, 200));
  console.warn('In LS dashboard, add events: subscription_cancelled, subscription_expired');
}

console.log('Lemon Squeezy setup done');
