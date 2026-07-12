#!/usr/bin/env bash
# Sync selected keys from .env.local to Vercel Production.
# Requires: npx vercel, vercel login, project linked (vercel link).
set -euo pipefail
cd "$(dirname "$0")/../.."

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local"
  exit 1
fi

KEYS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  GEMINI_API_KEY
  GOOGLE_GEMINI_API_KEY
  LEMONSQUEEZY_API_KEY
  LEMONSQUEEZY_STORE_ID
  LEMONSQUEEZY_WEBHOOK_SECRET
  LEMONSQUEEZY_TEST_MODE
  LEMONSQUEEZY_VARIANT_SINGLE_LITE
  LEMONSQUEEZY_VARIANT_BASIC_OVERAGE
  LEMONSQUEEZY_VARIANT_SINGLE_FULL
  LEMONSQUEEZY_VARIANT_STANDARD_SUB
  LEMONSQUEEZY_VARIANT_ADVANCED_SUB
  RESEND_API_KEY
  CRON_SECRET
  EXTENSION_HANDOFF_SECRET
  NEXT_PUBLIC_GA_MEASUREMENT_ID
  NEXT_PUBLIC_SHORTS_ENABLED
)

get_val() {
  local key="$1"
  grep -E "^${key}=" .env.local 2>/dev/null | tail -1 | cut -d= -f2- || true
}

echo "Syncing to Vercel Production (empty values skipped)..."
for key in "${KEYS[@]}"; do
  val="$(get_val "$key")"
  if [[ -z "$val" ]]; then
    echo "  skip $key (empty)"
    continue
  fi
  echo "  set $key"
  printf '%s' "$val" | npx vercel env add "$key" production --force 2>/dev/null || \
    printf '%s' "$val" | npx vercel env add "$key" production
done

echo "Done. Run: npx vercel deploy --prod"
