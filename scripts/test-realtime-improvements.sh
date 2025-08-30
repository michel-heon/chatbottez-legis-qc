#!/bin/bash

# Script de test pour vérifier les améliorations en temps réel
echo "🔍 Test des améliorations de recherche en temps réel"
echo "=================================================="

echo ""
echo "📊 Vérification de l'état de l'application..."

# Vérifier si l'application tourne
if pgrep -f "npm run dev:teamsfx:testtool" > /dev/null; then
    echo "✅ Application détectée en cours d'exécution"
else
    echo "❌ Application non détectée"
    echo "💡 Démarrez l'application avec: npm run dev:teamsfx:testtool"
    exit 1
fi

echo ""
echo "🎯 Tests à effectuer manuellement:"
echo ""
echo "1. 📝 Question: 'Qu'est-ce qui arrive si je conduis saoul?'"
echo "   🔍 Attendu: Documents du Code de la sécurité routière (C-24.2) priorisés"
echo "   ⚠️  Avant: Recevait des documents sur véhicules hors route"
echo ""
echo "2. 📝 Question: 'conduite avec facultés affaiblies'"
echo "   🔍 Attendu: Informations sur véhicules automobiles, pas hors route"
echo ""
echo "3. 📝 Question: 'limite alcoolémie conduire'"
echo "   🔍 Attendu: Code de la sécurité routière du Québec"
echo ""
echo "🔧 Surveillez les logs de l'application pour voir:"
echo "   - 🔍 'Contexte détecté: traffic_impairment'"
echo "   - 📊 'Code de la sécurité routière priorisé'"
echo "   - ⚠️  'ALERTE: Question sur conduite automobile mais seuls des documents véhicules hors route trouvés'"
echo ""
echo "✅ Si vous voyez l'alerte, cela signifie que le système détecte correctement"
echo "   le problème et informe l'utilisateur de la limitation."