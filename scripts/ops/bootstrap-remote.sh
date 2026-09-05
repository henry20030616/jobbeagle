#!/usr/bin/env bash
# One-shot remote bootstrap: Supabase migrations + GitHub auth + Vercel sync.
set -euo pipefail
cd "$(dirname "$0")/../.."

ENV_FILE=".env.local"
missing=()

grep -qE '^SUPABASE_ACCESS_TOKEN=.+' "$ENV_FILE" 2>/dev/null || missing+=("SUPABASE_ACCESS_TOKEN")
grep -qE '^PAYPAL_CLIENT_ID=.+' "$ENV_FILE" 2>/dev/null || missing+=("PAYPAL_CLIENT_ID")

if ((${#missing[@]})); then
  echo "Need these in .env.local (one-time): ${missing[*]}"
  echo ""
  echo "Opening browser tabs to copy them…"
  open "https://supabase.com/dashboard/account/tokens" 2>/dev/null || true
  open "https://developer.paypal.com/dashboard/" 2>/dev/null || true
  echo ""
  echo "1. Supabase → Generate token → add: SUPABASE_ACCESS_TOKEN=sbp_..."
  echo "2. PayPal Developer → Live app → add: PAYPAL_CLIENT_ID=..."
  echo ""
  echo "Paste both lines in Cursor chat; Agent will append and re-run this script."
  exit 2
fi

echo "==> Supabase CLI login (token)"
npx supabase login --token "$(grep -E '^SUPABASE_ACCESS_TOKEN=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"

echo ""
echo "==> Supabase link"
npx supabase link --project-ref yvzorfeespljbitxxufo --yes 2>/dev/null || \
  npx supabase link --project-ref yvzorfeespljbitxxufo

echo ""
echo "==> Apply migrations"
node scripts/ops/supabase-apply-migrations.mjs

echo ""
echo "==> Configure GitHub OAuth"
node scripts/ops/supabase-configure-github.mjs

echo ""
echo "==> Vercel sync + verify + deploy"
bash scripts/ops/sync-all.sh
