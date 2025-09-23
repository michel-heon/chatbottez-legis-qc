#!/bin/bash
# Script de vérification de sécurité Git
# Vérifie qu'aucun fichier sensible n'existe dans l'historique

echo "🔍 Vérification de sécurité de l'historique Git..."

# Vérifier les fichiers sensibles dans l'historique (exclure les templates et exemples)
SENSITIVE_FILES=$(git log --all --oneline --name-only | grep -E "(\.env|config\.json)" | grep -v "tsconfig.json" | grep -v ".template" | grep -v ".example" | grep -v ".user" | sort | uniq)

if [ -z "$SENSITIVE_FILES" ]; then
    echo "✅ Aucun fichier sensible trouvé dans l'historique Git"
else
    echo "⚠️ Fichiers sensibles trouvés dans l'historique :"
    echo "$SENSITIVE_FILES"
    exit 1
fi

# Vérifier les clés API dans l'historique
echo "🔍 Recherche de clés API dans l'historique..."
API_KEYS=$(git log --all -p | grep -E "(api_key|API_KEY|search.*key|YDcIo6Do1dEXTwLXEcuXLCdEQMELiXn3Q7HDhwrxE)" | head -5)

if [ -z "$API_KEYS" ]; then
    echo "✅ Aucune clé API trouvée dans l'historique Git"
else
    echo "⚠️ Traces de clés API trouvées dans l'historique :"
    echo "$API_KEYS"
    exit 1
fi

echo "🔒 Vérification .gitignore..."
if grep -q "config.json" .gitignore && grep -q "\.env" .gitignore; then
    echo "✅ .gitignore correctement configuré pour la sécurité"
else
    echo "⚠️ .gitignore manque des exclusions de sécurité"
    exit 1
fi

echo "✅ Vérification de sécurité terminée avec succès"
