#!/usr/bin/env bash
# Agent 代跑：GitHub push 已由 git 流程處理；此腳本同步 Vercel env 並驗證三方整合。
set -euo pipefail
cd "$(dirname "$0")/../.."

echo "==> Vercel env sync"
bash scripts/ops/sync-vercel-env.sh

echo ""
echo "==> Integration verify"
node scripts/ops/verify-integrations.mjs

echo ""
echo "==> Redeploy production (env changes need redeploy)"
npx vercel deploy --prod --yes
