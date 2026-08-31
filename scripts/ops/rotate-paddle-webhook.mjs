/**
 * Rotate the live Paddle notification destination secret without printing it.
 * Usage: node scripts/ops/rotate-paddle-webhook.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const ENV_PATH = resolve(ROOT, '.env.local');

function loadEnvLocal() {
  const raw = readFileSync(ENV_PATH, 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return { raw, env };
}

function setEnvLine(raw, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(raw)) return raw.replace(re, line);
  return `${raw.trimEnd()}\n${line}\n`;
}

const { raw, env } = loadEnvLocal();
const apiKey = env.PADDLE_API_KEY;
if (!apiKey) {
  console.error('PADDLE_API_KEY missing in .env.local');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
};

const destination = 'https://www.jobbeagle.com/api/payment/webhook';

const listRes = await fetch('https://api.paddle.com/notification-settings', { headers });
const listJson = await listRes.json();
const rows = Array.isArray(listJson?.data) ? listJson.data : [];
for (const row of rows) {
  if (row.destination !== destination) continue;
  const del = await fetch(`https://api.paddle.com/notification-settings/${row.id}`, {
    method: 'DELETE',
    headers,
  });
  if (!del.ok) {
    console.error(`Failed to remove previous destination ${row.id}: ${del.status}`);
    process.exit(1);
  }
  console.log(`Removed previous destination ${row.id}`);
}

const createdRes = await fetch('https://api.paddle.com/notification-settings', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    description: 'JobBeagle Production Webhook',
    type: 'url',
    destination,
    active: true,
    subscribed_events: [
      'transaction.completed',
      'subscription.canceled',
      'subscription.updated',
    ],
  }),
});
const created = await createdRes.json();
if (!createdRes.ok || !created?.data?.id || !created?.data?.endpoint_secret_key) {
  console.error('Failed to create Paddle notification setting', createdRes.status);
  process.exit(1);
}

const newId = created.data.id;
const newSecret = created.data.endpoint_secret_key;
const updated = setEnvLine(raw, 'PADDLE_WEBHOOK_SECRET', newSecret);
writeFileSync(ENV_PATH, updated, 'utf8');
console.log(`Created notification setting ${newId} and updated .env.local (secret not printed).`);
