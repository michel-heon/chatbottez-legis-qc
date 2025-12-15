#!/usr/bin/env bash
# Script: workflow-create-tag.sh
# Description: Créer un tag Git pour déclencher workflow deploy-prod.yml
# Usage: ./workflow-create-tag.sh <repo> <type>
# Nomenclature: ADR-017 (workflow-create-tag.sh)
# Type: rc (Release Candidate) ou final (Release stable)

set -e

REPO="${1:-michel-heon/chatbottez-legis-qc}"
TYPE="${2:-rc}"

echo "Repository: $REPO"
echo "Type de release: $TYPE"
echo ""

# Vérifier branche actuelle
CURRENT_BRANCH=$(git branch --show-current)
echo "Branche actuelle: $CURRENT_BRANCH"

# Avertir si pas sur dev ou main
if [[ "$CURRENT_BRANCH" != "dev" && "$CURRENT_BRANCH" != "main" ]]; then
    echo "⚠️  Vous n'êtes pas sur dev ou main"
    read -p "Continuer quand même? (y/N): " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        echo "❌ Opération annulée"
        exit 1
    fi
fi

# Vérifier qu'il n'y a pas de modifications non committées
if [[ -n $(git status --porcelain) ]]; then
    echo "❌ Modifications non committées détectées"
    echo ""
    git status --short
    echo ""
    echo "Committez d'abord vos modifications"
    exit 1
fi

# Pull dernières modifications
echo "Récupération dernières modifications..."
git pull origin "$CURRENT_BRANCH"

# Déterminer version du tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v4.0.0-beta.8")
echo "Dernier tag: $LATEST_TAG"
echo ""

if [[ "$TYPE" == "rc" ]]; then
    # Release Candidate
    echo "Création Release Candidate..."
    read -p "Version RC (ex: v4.0.0-rc1): " TAG_NAME
    if [[ -z "$TAG_NAME" ]]; then
        echo "❌ Version requise"
        exit 1
    fi
    TAG_MESSAGE="Release Candidate $TAG_NAME

Cette RC teste le déploiement automatique vers PROD via GitHub Actions.

Workflow déclenché:
- deploy-prod.yml (avec approbation manuelle requise)

Environnement cible:
- PROD (rg-bot-legisqc-prd-cae-01)

Créé: $(date)
"
else
    # Release finale
    echo "Création Release STABLE..."
    read -p "Version finale (ex: v4.0.0): " TAG_NAME
    if [[ -z "$TAG_NAME" ]]; then
        echo "❌ Version requise"
        exit 1
    fi
    TAG_MESSAGE="Release $TAG_NAME - Légis Québec en PROD

Version stable déployée en production.

✅ Fonctionnalités:
- Custom Engine Agent pour M365 Copilot + Teams
- RAG avec 20 documents juridiques
- 6 commandes juridiques
- Modération de contenu
- Streaming responses
- Citations markdown

✅ Environnements:
- DEV: bot34879c.azurewebsites.net
- PROD: $(grep '^BOT_DOMAIN=' ../env/.env.prod | cut -d'=' -f2 || echo 'TBD')

✅ CI/CD:
- GitHub Actions workflows opérationnels
- Déploiement automatique via tags

Déployé: $(date)
"
fi

echo ""
echo "=========================================="
echo "Tag à créer: $TAG_NAME"
echo "=========================================="
echo ""
echo "$TAG_MESSAGE"
echo ""
read -p "Créer ce tag? (y/N): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "❌ Opération annulée"
    exit 1
fi

# Créer tag annoté
echo ""
echo "Création tag annoté..."
git tag -a "$TAG_NAME" -m "$TAG_MESSAGE"

# Push tag
echo "Push tag vers GitHub..."
git push origin "$TAG_NAME"

echo ""
echo "=========================================="
echo "✓ Tag créé et poussé!"
echo "=========================================="
echo ""
echo "Tag: $TAG_NAME"
echo "Branche: $CURRENT_BRANCH"
echo ""
echo "🚀 Workflow deploy-prod.yml déclenché!"
echo ""

# Attendre un peu pour que le workflow démarre
sleep 2

# Récupérer l'ID du workflow run le plus récent
RUN_ID=$(gh run list --workflow=deploy-prod.yml --limit 1 --json databaseId --jq '.[0].databaseId')

if [[ -n "$RUN_ID" ]]; then
    echo "🔍 Vérifier workflow:"
    echo "   https://github.com/$REPO/actions/runs/$RUN_ID"
else
    echo "🔍 Vérifier workflow:"
    echo "   https://github.com/$REPO/actions"
fi

echo ""
echo "⚠️  IMPORTANT: Approbation manuelle requise"
echo "   1. Aller sur Actions → Deploy PROD"
echo "   2. Cliquer sur le run en cours"
echo "   3. Cliquer 'Review deployments'"
echo "   4. Cocher 'prod' environment"
echo "   5. Cliquer 'Approve and deploy'"
echo ""
echo "🔄 Statut workflows: make workflow-status"
echo ""

if [[ "$TYPE" == "rc" ]]; then
    echo "📝 Si RC réussit, créer tag final:"
    echo "   make workflow-release"
    echo ""
fi
