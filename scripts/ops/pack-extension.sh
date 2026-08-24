#!/usr/bin/env bash
# Zip browser-extension/ for Chrome Web Store upload (no markdown / git files).
set -euo pipefail
cd "$(dirname "$0")/../.."
ver="$(node -p "require('./browser-extension/manifest.json').version")"
out="jobbeagle-extension-${ver}.zip"
rm -f "$out"
(
  cd browser-extension
  zip -r "../$out" . -x "*.md" -x ".gitignore" -x "*.DS_Store"
)
echo "Wrote $out"
ls -lh "$out"
