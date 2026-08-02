#!/usr/bin/env bash
# Local buyer smoke: install + Expo config + JS export (no remote API / no CI).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "ERROR: Node >= 20 required (Expo 54 / Metro). Current: $(node -v)"
  echo "Install Node 20 LTS, then re-run: npm run smoke"
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

echo "==> npm ci"
npm ci

echo "==> expo config"
npx expo config --type public >/dev/null

OUT_ANDROID="${TMPDIR:-/tmp}/good-food-restaurant-export-android"
OUT_IOS="${TMPDIR:-/tmp}/good-food-restaurant-export-ios"
rm -rf "$OUT_ANDROID" "$OUT_IOS"

echo "==> expo export android"
npx expo export --platform android --output-dir "$OUT_ANDROID"

echo "==> expo export ios"
npx expo export --platform ios --output-dir "$OUT_IOS"

echo "OK — local smoke passed (install + config + JS bundles)."
