#!/usr/bin/env bash
# =============================================================================
# Deploy WEB de PRODUCCIÓN — Cloudflare Pages pull-511-events (rama main)
#
#   bash scripts/deploy_prod.sh
#
# Guards: rama main + árbol limpio + HEAD pusheado. Build en modo production
# (.env.production commiteado fija el sabor: nada depende del .env local).
# Tag web-prod-YYYYMMDD-HHMM al terminar.
#
# Rollback: Cloudflare Pages guarda cada deployment — dashboard → pull-511-
# events → Deployments → "..." → Rollback. O por código: checkout del tag
# anterior y re-deploy.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT="pull-511-events"
URL="https://pull-511-events.pages.dev"

branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" != "main" ]; then
  echo "ERROR: la web de producción se deploya desde 'main' (estás en '$branch')."
  echo "       Prueba en staging desde dev, y cuando esté verde: merge a main."
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: árbol sucio — commitea antes de deployar:"
  git status -sb
  exit 1
fi

git fetch origin main --quiet
if ! git merge-base --is-ancestor HEAD origin/main; then
  echo "ERROR: HEAD no está en origin/main. Haz 'git push' primero."
  exit 1
fi

echo "== Build (modo production) =="
npm run build

commit=$(git rev-parse --short HEAD)
echo "== Deploy $PROJECT rama main (commit $commit) =="
npx wrangler pages deploy dist --project-name "$PROJECT" --branch main

echo "== Health check =="
sleep 3
if curl -sf --max-time 15 "$URL" >/dev/null; then
  echo "WEB OK ($URL)"
else
  echo "ERROR: $URL no responde. NO se ha creado tag."
  exit 1
fi

tag="web-prod-$(date +%Y%m%d-%H%M)"
git tag -a "$tag" -m "Deploy web $PROJECT commit $commit"
git push origin "$tag" --quiet
echo ""
echo "== DEPLOYADO: $commit → $URL  (tag: $tag) =="
