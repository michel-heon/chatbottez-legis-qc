#!/usr/bin/env bash
# Script: prod-provision.sh
# Description: Provisionner environnement PROD via Teams Toolkit CLI
# Usage: ./prod-provision.sh
# Nomenclature: ADR-017 (object-action.sh)

set -e

echo "=========================================="
echo "Provisionnement PROD - Légis Québec"
echo "=========================================="
echo ""

# Vérifier que teamsapp CLI est installé
if ! command -v teamsapp &> /dev/null; then
    echo "❌ ERREUR: Teams Toolkit CLI n'est pas installé"
    echo "Installez avec: npm install -g @microsoft/teamsfx-cli"
    exit 1
fi

echo "✓ Teams Toolkit CLI: OK"
echo ""

# Naviguer vers la racine du projet
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "m365agents.yml" ]; then
    echo "❌ ERREUR: m365agents.yml non trouvé"
    echo "Impossible de trouver la racine du projet"
    exit 1
fi

echo "Environnement cible: PROD"
echo "Resource Group: rg-bot-legisqc-prd-cae-01"
echo "Location: canadaeast"
echo ""

read -p "Continuer avec le provisionnement PROD? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Provisionnement annulé"
    exit 1
fi

echo ""
echo "Démarrage provisionnement PROD..."
echo "Cela peut prendre 5-10 minutes..."
echo "Répertoire: $PROJECT_ROOT"
echo ""

atk provision --env prod

echo ""
echo "=========================================="
echo "Provisionnement PROD terminé! ✓"
echo "=========================================="
echo ""
echo "Prochaines étapes:"
echo "  1. Vérifier env/.env.prod pour les nouvelles valeurs"
echo "  2. Commiter les changements: git add env/.env.prod"
echo "  3. Tester le déploiement: make deploy-prod"
echo ""
