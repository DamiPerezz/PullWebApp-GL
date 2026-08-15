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
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  if git merge-base --is-ancestor HEAD origin/main; then
    behind=$(git rev-list --count HEAD..origin/main)
    echo "ERROR: HEAD está $behind commit(s) POR DETRÁS de origin/main — deployarías"
    echo "       código viejo y el tag mentiría. Haz 'git pull' primero."
    if [ "${ALLOW_OLD_DEPLOY:-}" = "1" ]; then
      echo "(ALLOW_OLD_DEPLOY=1 — rollback deliberado, continuando)"
    else
      echo "       Rollback deliberado: ALLOW_OLD_DEPLOY=1 bash scripts/deploy_prod.sh"
      exit 1
    fi
  else
    echo "ERROR: HEAD no está pusheado a origin/main. Haz 'git push' primero."
    exit 1
  fi
fi

# Vite deja que un .env local (gitignored) o una VITE_* exportada en la shell
# PISEN los .env.production/.env.staging commiteados — el build dejaría de ser
# reproducible desde git. Bloquear ambas vías.
if [ -f .env.local ] || [ -f .env.production.local ]; then
  echo "ERROR: existe .env.local o .env.production.local — pisarían el build de"
  echo "       producción con valores que git no ve. Bórralos o renómbralos."
  exit 1
fi
if env | grep -q '^VITE_'; then
  echo "ERROR: hay variables VITE_* exportadas en la shell — pisarían los .env"
  echo "       commiteados:"; env | grep '^VITE_' | cut -d= -f1
  exit 1
fi

echo "== Build (modo production) =="
npm run build

commit=$(git rev-parse --short HEAD)
echo "== Deploy $PROJECT rama main (commit $commit) =="
npx wrangler pages deploy dist --project-name "$PROJECT" --branch main

echo "== Health check =="
sleep 3
# La raíz estática puede responder 200 aunque la Function esté rota: el check
# real es una llamada API a través del proxy (ejercita Function+UPSTREAM+backend).
if curl -sf --max-time 20 "$URL/api/v1/venues/events/get-venue-info/511-events" >/dev/null; then
  echo "WEB+PROXY+API OK"
else
  echo "ERROR: el API vía proxy no responde ($URL/api/v1/...). NO se ha creado tag."
  echo "       Mira las env vars del proyecto Pages y flyctl logs del backend."
  exit 1
fi

# ── VERSIONADO x.x.xx ────────────────────────────────────────────────────────
# El fichero VERSION (raíz del repo) manda. Formato MAYOR.MENOR.PARCHE, con el
# parche a 2 dígitos: 1.0.00, 1.0.01, … 1.1.00, 2.0.00.
#
#   PARCHE  lo sube SOLO este script, en cada deploy verificado.
#   MENOR   súbelo a mano cuando añadas algo nuevo visible para el usuario.
#   MAYOR   súbelo a mano en un cambio grande o incompatible.
#
# Se etiqueta DESPUÉS del health check a propósito: una versión solo existe si
# de verdad está viva. Si el deploy no verifica, no se gasta número.
bump_version() {
  local f="$ROOT/VERSION"
  [ -f "$f" ] || echo "1.0.00" > "$f"
  local cur M rest m p
  cur=$(tr -d ' \r\n' < "$f")
  M=${cur%%.*}; rest=${cur#*.}; m=${rest%%.*}; p=${rest##*.}
  p=$((10#$p + 1))
  # El parche son 2 dígitos: al llegar a 100 arrastra a MENOR y vuelve a 00.
  # Sin esto la versión 100 saldría como "1.0.100" y rompería el formato.
  if [ "$p" -gt 99 ]; then
    m=$((10#$m + 1))
    p=0
  fi
  printf "%s.%s.%02d" "$M" "$m" "$p"
}

version="$(bump_version)"
tag="v${version}"
echo "$version" > "$ROOT/VERSION"
git add "$ROOT/VERSION" >/dev/null 2>&1 || true
git commit -q -m "chore: version ${version}" >/dev/null 2>&1 || true
git push -q origin HEAD >/dev/null 2>&1 || true
if git tag -a "$tag" -m "Deploy web $PROJECT commit $commit (version $version)" && git push origin "$tag" --quiet; then
  echo ""
  echo "== DEPLOYADO: $commit → $URL  (tag: $tag) =="
else
  echo ""
  echo "== DEPLOYADO: $commit → $URL — PERO el tag falló; créalo a mano: =="
  echo "  git tag -a $tag -m 'Deploy web $PROJECT commit $commit' && git push origin $tag"
fi
