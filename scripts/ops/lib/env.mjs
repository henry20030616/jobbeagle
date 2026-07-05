import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export function loadEnvLocal() {
  const vars = {};
  const path = resolve(root, '.env.local');
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      const key = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      vars[key] = val;
    }
  } catch {
    throw new Error('Missing .env.local');
  }
  return vars;
}

export function requireEnv(env, keys) {
  const missing = keys.filter((k) => !env[k]?.trim());
  if (missing.length) {
    throw new Error(`Missing in .env.local: ${missing.join(', ')}`);
  }
}

export const PROJECT_REF = 'yvzorfeespljbitxxufo';

export async function supabaseManagement(path, { method = 'GET', body, token }) {
  const res = await fetch(`https://api.supabase.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = typeof data === 'object' ? JSON.stringify(data) : text;
    throw new Error(`Supabase API ${method} ${path} → ${res.status}: ${msg.slice(0, 500)}`);
  }
  return data;
}
