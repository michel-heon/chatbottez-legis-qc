#!/usr/bin/env bash
# Script: validate-prod-package.sh
# Description: Valider que le package Teams contient les bonnes versions
# Usage: ./validate-prod-package.sh [local|workflow]
# Nomenclature: ADR-017 (validate-prod-package.sh)

set -euo pipefail

MODE="${1:-local}"
REPO="michel-heon/chatbottez-legis-qc"

echo "=========================================="
echo "Validation Package Teams PROD"
echo "=========================================="
echo ""

# Charger les versions attendues depuis .env.prod
cd ..
EXPECTED_VERSION=$(grep '^TEAMS_APP_VERSION=' env/.env.prod | cut -d'=' -f2)
EXPECTED_RC=$(grep '^TEAMS_APP_RC_VERSION=' env/.env.prod | cut -d'=' -f2)
EXPECTED_FULL_VERSION="${EXPECTED_VERSION} (${EXPECTED_RC})"

echo "📋 Versions attendues:"
echo "   Version: ${EXPECTED_VERSION}"
echo "   RC: ${EXPECTED_RC}"
echo "   Full: ${EXPECTED_FULL_VERSION}"
echo ""

# Déterminer le fichier ZIP à valider
if [[ "$MODE" == "local" ]]; then
    ZIP_FILE="appPackage/build/appPackage.prod.zip"
    echo "🔍 Mode: Validation package LOCAL"
    echo "   Fichier: $ZIP_FILE"
    
    if [[ ! -f "$ZIP_FILE" ]]; then
        echo "❌ Erreur: Fichier $ZIP_FILE introuvable"
        echo "   Exécutez d'abord: make prod-install-teams"
        exit 1
    fi
    
elif [[ "$MODE" == "workflow" ]]; then
    echo "🔍 Mode: Validation package WORKFLOW GitHub"
    
    # Récupérer le dernier workflow run ID pour deploy-prod
    echo "   Récupération dernier workflow deploy-prod..."
    RUN_ID=$(gh run list --repo "$REPO" --workflow=deploy-prod.yml --limit 1 --json databaseId --jq '.[0].databaseId')
    
    if [[ -z "$RUN_ID" ]]; then
        echo "❌ Erreur: Aucun workflow deploy-prod trouvé"
        exit 1
    fi
    
    echo "   Run ID: $RUN_ID"
    
    # Créer répertoire temporaire
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf $TEMP_DIR" EXIT
    
    # Télécharger les artifacts du workflow
    echo "   Téléchargement artifacts..."
    cd "$TEMP_DIR"
    if ! gh run download "$RUN_ID" --repo "$REPO" --name "teams-package-prod" 2>/dev/null; then
        echo "❌ Erreur: Impossible de télécharger l'artifact 'teams-package-prod'"
        echo "   Le workflow a-t-il réussi? Vérifiez: gh run view $RUN_ID --repo $REPO"
        exit 1
    fi
    
    ZIP_FILE="$TEMP_DIR/appPackage.prod.zip"
    
    if [[ ! -f "$ZIP_FILE" ]]; then
        echo "❌ Erreur: Fichier appPackage.prod.zip introuvable dans l'artifact"
        exit 1
    fi
    
    echo "   ✅ Artifact téléchargé"
else
    echo "❌ Erreur: Mode invalide '$MODE'"
    echo "   Usage: $0 [local|workflow]"
    exit 1
fi

echo ""
echo "📦 Extraction et validation du manifest..."

# Créer répertoire temporaire pour extraction si pas déjà fait
if [[ "$MODE" == "local" ]]; then
    EXTRACT_DIR=$(mktemp -d)
    trap "rm -rf $EXTRACT_DIR" EXIT
else
    EXTRACT_DIR="$TEMP_DIR/extract"
    mkdir -p "$EXTRACT_DIR"
fi

# Extraire manifest.json du ZIP
unzip -q -j "$ZIP_FILE" "manifest.json" -d "$EXTRACT_DIR"

if [[ ! -f "$EXTRACT_DIR/manifest.json" ]]; then
    echo "❌ Erreur: manifest.json introuvable dans le ZIP"
    exit 1
fi

# Extraire les valeurs du manifest
MANIFEST_VERSION=$(jq -r '.version' "$EXTRACT_DIR/manifest.json")
MANIFEST_DESCRIPTION=$(jq -r '.description.full' "$EXTRACT_DIR/manifest.json")

# Vérifier si la version complète est présente dans la description
if echo "$MANIFEST_DESCRIPTION" | grep -q "Version: ${EXPECTED_FULL_VERSION}"; then
    VERSION_MATCH="✅"
else
    VERSION_MATCH="❌"
fi

echo ""
echo "📊 Résultats de validation:"
echo "=========================================="
echo ""
echo "Manifest version: $MANIFEST_VERSION"
echo "   Attendu: $EXPECTED_VERSION"
if [[ "$MANIFEST_VERSION" == "$EXPECTED_VERSION" ]]; then
    echo "   ✅ Version correcte"
    VERSION_OK=true
else
    echo "   ❌ Version incorrecte"
    VERSION_OK=false
fi
echo ""

echo "Description complète:"
echo "   $(echo "$MANIFEST_DESCRIPTION" | grep -o 'Version: [^"]*' || echo 'Version non trouvée')"
echo "   Attendu: Version: $EXPECTED_FULL_VERSION"
echo "   $VERSION_MATCH Version dans description"

if echo "$MANIFEST_DESCRIPTION" | grep -q "Version: ${EXPECTED_FULL_VERSION}"; then
    DESC_OK=true
else
    DESC_OK=false
fi

echo ""
echo "=========================================="

# Résultat final
if [[ "$VERSION_OK" == true ]] && [[ "$DESC_OK" == true ]]; then
    echo "✅ VALIDATION RÉUSSIE"
    echo ""
    echo "Le package contient les bonnes versions:"
    echo "   - Manifest version: $EXPECTED_VERSION ✅"
    echo "   - Description: Version: $EXPECTED_FULL_VERSION ✅"
    exit 0
else
    echo "❌ VALIDATION ÉCHOUÉE"
    echo ""
    if [[ "$VERSION_OK" == false ]]; then
        echo "   - Manifest version incorrecte"
    fi
    if [[ "$DESC_OK" == false ]]; then
        echo "   - Version RC absente ou incorrecte dans description"
    fi
    echo ""
    echo "Actions recommandées:"
    echo "   1. Vérifier env/.env.prod"
    echo "   2. Rebuilder le manifest: bash scripts/rebuild-manifest.sh"
    echo "   3. Recréer le package: make prod-install-teams"
    exit 1
fi
