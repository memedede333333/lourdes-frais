#!/usr/bin/env bash
#
# Déploiement combiné : GitHub Pages + Google Apps Script
#
# Usage :  ./scripts/deploy.sh "Message de commit"
#          ./scripts/deploy.sh "Message" --site-only
#          ./scripts/deploy.sh "Message" --script-only
#
# Prérequis : voir docs/DEPLOIEMENT.md (git, gh, clasp, .clasp.json)

set -euo pipefail

cd "$(dirname "$0")/.."

MSG="${1:-}"
MODE="${2:-all}"

if [ -z "$MSG" ]; then
  echo "❌ Message de commit manquant."
  echo "   Usage : ./scripts/deploy.sh \"Description du changement\""
  exit 1
fi

# ---------------------------------------------------------------- Site
deploy_site() {
  echo "🌐 Déploiement du site (GitHub Pages)…"

  if git diff --quiet && git diff --cached --quiet; then
    echo "   ℹ️  Aucune modification à commiter."
    return 0
  fi

  git add -A
  git commit -m "$MSG"
  git push
  echo "   ✅ Poussé. Le site sera à jour dans 1–2 min :"
  echo "      https://memedede333.github.io/lourdes-frais/"
}

# -------------------------------------------------------- Apps Script
deploy_script() {
  echo "⚙️  Déploiement du backend (Apps Script)…"

  if ! command -v clasp >/dev/null 2>&1; then
    echo "   ❌ clasp introuvable. Installer : npm install -g @google/clasp"
    return 1
  fi

  if [ ! -f .clasp.json ]; then
    echo "   ❌ .clasp.json manquant."
    echo "      cp .clasp.json.example .clasp.json  puis renseigner le Script ID"
    echo "      (voir docs/DEPLOIEMENT.md § A.3)"
    return 1
  fi

  clasp push --force
  echo "   ✅ Code envoyé dans l'éditeur Apps Script."

  # ⚠️ Renseigner DEPLOYMENT_ID pour conserver la MÊME URL /exec.
  # Le récupérer avec : clasp deployments
  DEPLOYMENT_ID="${CLASP_DEPLOYMENT_ID:-}"

  if [ -n "$DEPLOYMENT_ID" ]; then
    clasp deploy -i "$DEPLOYMENT_ID" -d "$MSG"
    echo "   ✅ Déploiement mis à jour — l'URL /exec reste inchangée."
  else
    echo ""
    echo "   ⚠️  ATTENTION : déploiement NON mis à jour."
    echo "      'clasp push' modifie l'éditeur, mais l'application continue"
    echo "      d'utiliser l'ANCIENNE version tant que le déploiement n'est"
    echo "      pas republié."
    echo ""
    echo "      Pour finaliser :"
    echo "        clasp deployments                       # relever l'ID"
    echo "        export CLASP_DEPLOYMENT_ID=<ID>         # puis relancer"
    echo ""
    echo "      Ne PAS utiliser 'clasp deploy' sans -i : cela crée une"
    echo "      nouvelle URL, qu'il faudrait alors reporter dans index.html."
  fi
}

case "$MODE" in
  --site-only)   deploy_site ;;
  --script-only) deploy_script ;;
  *)             deploy_site; echo ""; deploy_script ;;
esac

echo ""
echo "🔍 Ne pas oublier la vérification post-déploiement"
echo "   (docs/DEPLOIEMENT.md § C) : la seule preuve fiable qu'une écriture"
echo "   fonctionne est l'inspection directe du Google Sheet."
