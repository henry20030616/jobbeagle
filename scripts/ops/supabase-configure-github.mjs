#!/usr/bin/env node
/**
 * Enable GitHub OAuth on Supabase via Management API.
 * Needs: SUPABASE_ACCESS_TOKEN, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET in .env.local
 */
import { loadEnvLocal, requireEnv, PROJECT_REF, supabaseManagement } from './lib/env.mjs';

const env = loadEnvLocal();
requireEnv(env, ['SUPABASE_ACCESS_TOKEN', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET']);

const token = env.SUPABASE_ACCESS_TOKEN;

console.log('Configuring GitHub auth provider…');
await supabaseManagement(`/projects/${PROJECT_REF}/config/auth`, {
  method: 'PATCH',
  token,
  body: {
    external_github_enabled: true,
    external_github_client_id: env.GITHUB_CLIENT_ID,
    external_github_secret: env.GITHUB_CLIENT_SECRET,
  },
});
console.log('OK  GitHub provider enabled');
