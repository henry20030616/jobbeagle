#!/usr/bin/env node
/**
 * Apply supabase/migrations/*.sql via Management API (idempotent SQL).
 * Needs: SUPABASE_ACCESS_TOKEN in .env.local
 */
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvLocal, requireEnv, PROJECT_REF, supabaseManagement } from './lib/env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const migrationsDir = resolve(root, 'supabase/migrations');

const env = loadEnvLocal();
requireEnv(env, ['SUPABASE_ACCESS_TOKEN']);
const token = env.SUPABASE_ACCESS_TOKEN;

let applied = [];
try {
  applied = await supabaseManagement(`/projects/${PROJECT_REF}/database/migrations`, { token });
} catch (e) {
  console.warn('Could not list migrations (will apply via query):', e.message);
}

const appliedNames = new Set(
  (Array.isArray(applied) ? applied : []).map((m) => m.name || m.version || String(m)),
);

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

console.log(`Found ${files.length} migration files`);

for (const file of files) {
  const name = file.replace(/\.sql$/, '');
  if (appliedNames.has(name) || appliedNames.has(file)) {
    console.log(`skip ${file} (already applied)`);
    continue;
  }

  const query = readFileSync(resolve(migrationsDir, file), 'utf8');
  console.log(`apply ${file}…`);

  try {
    await supabaseManagement(`/projects/${PROJECT_REF}/database/migrations`, {
      method: 'POST',
      token,
      body: { name, query },
    });
    console.log(`OK  ${file} (migration endpoint)`);
  } catch (e) {
    if (!String(e.message).includes('403') && !String(e.message).includes('404')) {
      console.warn(`migration endpoint failed, trying query: ${e.message.slice(0, 120)}`);
    }
    await supabaseManagement(`/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      token,
      body: { query },
    });
    console.log(`OK  ${file} (query endpoint)`);
  }
}

console.log('Done applying migrations');
