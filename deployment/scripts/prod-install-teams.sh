#!/usr/bin/env bash
# Script: prod-install-teams.sh
# Description: Rebuild, package et upload manifest Teams vers PROD
# Usage: ./prod-install-teams.sh
# Nomenclature: ADR-017 (prod-install-teams.sh)

set -euo pipefail

echo "=========================================="
echo "Installation Bot Teams PROD"
echo "=========================================="
echo ""

# Etape 1: Rebuild manifest
echo "🔄 Etape 1: Rebuild manifest avec valeurs PROD..."

# Déterminer répertoire racine du projet
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

bash scripts/rebuild-manifest.sh
echo ""

# Etape 2: Creation package Teams
echo "📦 Etape 2: Creation package Teams..."
powershell.exe -Command "\
    Remove-Item -Path 'appPackage/build/appPackage.prod.zip' -ErrorAction SilentlyContinue; \
    Copy-Item 'appPackage/build/manifest.prod.json' 'appPackage/manifest.json' -Force; \
    Compress-Archive -Path 'appPackage/manifest.json','appPackage/color.png','appPackage/outline.png' \
        -DestinationPath 'appPackage/build/appPackage.prod.zip' -Force; \
    Write-Host '✅ Package créé: appPackage/build/appPackage.prod.zip'"
echo ""

# Etape 3: Upload vers Teams
echo "📤 Etape 3: Upload vers Teams (avec teamsapp CLI)..."
if command -v teamsapp >/dev/null 2>&1 || command -v atk >/dev/null 2>&1; then
    echo "   Installation/mise à jour de l'app Teams..."
    teamsapp install --file-path appPackage/build/appPackage.prod.zip || atk install --file-path appPackage/build/appPackage.prod.zip
else
    echo "   ⚠️  Teams Toolkit CLI (teamsapp/atk) non installé"
    echo "   📋 Installez: npm install -g @microsoft/m365agentstoolkit-cli"
    echo "   OU uploadez manuellement appPackage.prod.zip vers Teams"
    exit 1
fi
echo ""

# Affichage informations
TEAMS_APP_ID=$(grep '^TEAMS_APP_ID=' env/.env.prod | cut -d'=' -f2)
BOT_DOMAIN=$(grep '^BOT_DOMAIN=' env/.env.prod | cut -d'=' -f2)

echo "=========================================="
echo "✅ Installation terminée"
echo "=========================================="
echo ""
echo "Teams App ID: $TEAMS_APP_ID"
echo "Bot Domain: $BOT_DOMAIN"
echo ""
echo "🔗 Lien d'installation:"
INSTALL_LINK="https://teams.microsoft.com/l/app/${TEAMS_APP_ID}?installAppPackage=true"
echo "$INSTALL_LINK"
echo ""
echo "Ouverture du navigateur..."
powershell.exe -Command "Start-Process '$INSTALL_LINK'" 2>/dev/null || true
echo ""
echo "Si le navigateur ne s'ouvre pas, copiez le lien ci-dessus"
