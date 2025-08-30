#!/bin/bash

# Test de l'amélioration des recherches pour la conduite en état d'ébriété
# Ce script teste si les améliorations apportées permettent de mieux traiter
# les questions sur la conduite automobile vs véhicules hors route

echo "🧪 Test d'amélioration de la recherche - Conduite en état d'ébriété"
echo "=================================================================="

# Charger les variables d'environnement
source scripts/load-env.sh

echo ""
echo "📋 Questions de test:"
echo "1. Qu'est-ce qui arrive si je conduis saoul?"
echo "2. Quelles sont les sanctions pour conduite avec facultés affaiblies?"
echo "3. Limite d'alcoolémie pour conduire au Québec?"

echo ""
echo "🔍 Test 1: Recherche avec le terme 'saoult'..."

# Test avec Node.js pour vérifier la logique d'amélioration
node -e "
const { enhanceSearchQuery, sortResultsByContext } = require('./lib/searchEnhancer');

console.log('📊 Test de enhanceSearchQuery:');
const testQueries = [
    'Qu\'est-ce qui arrive si je conduis saoul?',
    'conduite en état d\'ébriété sanctions',
    'alcool au volant Quebec',
    'permis suspendu alcool'
];

testQueries.forEach(query => {
    const result = enhanceSearchQuery(query);
    console.log('\\n📝 Requête:', query);
    console.log('🎯 Contexte:', result.context);
    console.log('🔍 Améliorée:', result.enhanced !== result.original ? 'OUI' : 'NON');
    if (result.enhanced !== result.original) {
        console.log('   ', result.enhanced);
    }
});
"

echo ""
echo "✅ Test terminé. Vérifiez que:"
echo "   - Les requêtes sur l'alcool sont détectées (contexte: traffic_impairment)"
echo "   - Les requêtes sont améliorées avec des termes du Code de la sécurité routière"
echo "   - Les identifiants prioritaires incluent C-24.2"

echo ""
echo "🚀 Pour tester en condition réelle:"
echo "   1. Démarrez l'application: npm run dev:teamsfx:testtool"
echo "   2. Posez une question sur la conduite en état d'ébriété"
echo "   3. Vérifiez que les documents du Code de la sécurité routière sont priorisés"