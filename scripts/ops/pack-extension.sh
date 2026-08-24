#!/usr/bin/env bash
# Zip browser-extension/ for Chrome Web Store upload (no markdown / git files).
set -euo pipefail
cd "$(dirname "$0")/../.."
ver="$(node -p "require('./browser-extension/manifest.json').version")"
out="jobbeagle-extension-${ver}.zip"
public_out="public/downloads/jobbeagle-extension.zip"
rm -f "$out" "$public_out"
mkdir -p public/downloads
(
  cd browser-extension
  zip -r "../$out" . -x "*.md" -x ".gitignore" -x "*.DS_Store"
)
cp "$out" "$public_out"
echo "Wrote $out"
echo "Wrote $public_out"
ls -lh "$out" "$public_out"
