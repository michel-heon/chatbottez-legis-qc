#!/bin/bash

# Script pour tester l'amélioration de recherche via l'API locale
echo "🧪 Test de l'amélioration de recherche via API locale"
echo "==================================================="

echo ""
echo "⏳ Attente que l'application soit complètement démarrée..."
sleep 5

echo "🔍 Test 1: Question sur conduite en état d'ébriété"
echo "Question: 'Qu'est-ce qui arrive si je conduis saoul?'"
echo ""

# Note: Cette requête simule ce que ferait Teams en envoyant la question
# à notre bot via l'API locale sur le port 3978

echo "📡 L'application écoute sur le port 3978"
echo "🔧 Pour tester manuellement:"
echo "   1. Ouvrez Microsoft Teams ou utilisez l'émulateur"
echo "   2. Connectez-vous au bot local"
echo "   3. Posez la question: 'Qu'est-ce qui arrive si je conduis saoul?'"
echo ""
echo "🎯 Surveillez les logs de l'application pour voir:"
echo "   ✅ '🔍 Contexte détecté: traffic_impairment'"
echo "   ✅ '📊 Tri appliqué: Code de la sécurité routière priorisé'"
echo "   ⚠️  'ALERTE: Question sur conduite automobile mais seuls des documents véhicules hors route trouvés'"
echo ""

# Vérifier que l'application répond
if curl -s -f "http://localhost:3978/api/health" > /dev/null 2>&1; then
    echo "✅ Application accessible sur http://localhost:3978"
else
    echo "⚠️  Endpoint de santé non disponible (normal pour cette application)"
fi

echo ""
echo "📋 Prochaines étapes pour validation:"
echo "   1. Testez via l'interface de Teams"
echo "   2. Vérifiez que les logs montrent la détection du contexte"
echo "   3. Confirmez que les documents appropriés sont priorisés"