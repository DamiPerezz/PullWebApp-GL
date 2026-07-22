#!/usr/bin/env bash
# =============================================================================
# Deploy WEB de STAGING — mismo proyecto Pages, rama "staging" (entorno Preview)
#
#   bash scripts/deploy_staging.sh
#
# Publica en https://staging.pull-511-events.pages.dev con build --mode staging
# (.env.staging: Turnstile en claves test, mismo slug de venue).
# El entorno Preview del proyecto Pages debe tener SUS variables:
#   UPSTREAM=https://pull-api-v2-staging.fly.dev
#   PROXY_SHARED_SECRET=<el de staging>
# Sin UPSTREAM, el proxy responde 503 a propósito (jamás cae a producción).
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT="pull-511-events"
URL="https://staging.pull-511-events.pages.dev"

if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: árbol sucio — commitea antes de deployar (aunque sea a staging):"
  echo "       si no está commiteado, no sabremos qué versión estaba corriendo."
  git status -sb
  exit 1
fi

echo "== Build (modo staging) =="
npm run build:staging

commit=$(git rev-parse --short HEAD)
branch=$(git rev-parse --abbrev-ref HEAD)
echo "== Deploy $PROJECT rama staging (commit $commit, rama git $branch) =="
npx wrangler pages deploy dist --project-name "$PROJECT" --branch staging

echo ""
echo "== DEPLOYADO: $commit → $URL =="
echo "(si el proxy da 503 proxy_upstream_not_configured: falta UPSTREAM en el"
echo " entorno Preview del proyecto Pages — es el fail-safe, no un bug)"
