#!/bin/bash

# scripts/diagnostic-c242-status.sh
# Diagnostic spécialisé pour le statut du Code de la sécurité routière (C-24.2)
# Vérifie pourquoi le LLM indique que C-24.2 est abrogé alors qu'il est en vigueur

# Chargement des fonctions communes
source "$(dirname "$0")/load-env.sh"

echo "🔍 Diagnostic - Statut Code de la sécurité routière (C-24.2)"
echo "=========================================================="

# Vérifier les variables d'environnement requises
check_required_vars() {
    local required_vars=("AZURE_SEARCH_ENDPOINT" "SECRET_AZURE_SEARCH_KEY" "AZURE_SEARCH_INDEX_NAME")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            echo "❌ Variable d'environnement manquante: $var"
            echo "💡 Vérifiez votre configuration dans env/.env.playground.user"
            exit 1
        fi
    done
    echo "✅ Variables d'environnement configurées"
    echo "   Endpoint: $AZURE_SEARCH_ENDPOINT"
    echo "   Index: $AZURE_SEARCH_INDEX_NAME"
}

# Rechercher les documents C-24.2 dans l'index
search_c242_documents() {
    echo ""
    echo "🔍 Recherche des documents C-24.2 dans l'index..."
    
    local search_url="${AZURE_SEARCH_ENDPOINT}/indexes/${AZURE_SEARCH_INDEX_NAME}/docs/search?api-version=2023-11-01"
    
    # Recherche spécifique pour C-24.2
    local search_body='{
        "search": "C-24.2",
        "searchFields": "legalIdentifier,title",
        "select": "legalIdentifier,title,legalStatus,sourceUrl,documentType",
        "top": 10,
        "queryType": "simple"
    }'
    
    local response=$(curl -s -X POST "$search_url" \
        -H "Content-Type: application/json" \
        -H "api-key: $SECRET_AZURE_SEARCH_KEY" \
        -d "$search_body")
    
    echo "📊 Réponse Azure Search pour C-24.2:"
    echo "$response" | jq -r '.value[] | "Identifiant: \(.legalIdentifier) | Titre: \(.title) | Statut: \(.legalStatus) | Type: \(.documentType)"' 2>/dev/null || echo "$response"
    
    # Compter les documents trouvés
    local count=$(echo "$response" | jq -r '.value | length' 2>/dev/null || echo "0")
    echo ""
    echo "📈 Nombre de documents C-24.2 trouvés: $count"
    
    # Analyser les statuts trouvés
    if [[ $count -gt 0 ]]; then
        echo ""
        echo "📋 Analyse des statuts trouvés:"
        echo "$response" | jq -r '.value[] | select(.legalIdentifier | contains("C-24.2")) | "- \(.legalIdentifier): \(.legalStatus)"' 2>/dev/null || echo "Erreur lors de l'analyse des statuts"
    fi
}

# Tester la recherche avec la requête problématique
test_problematic_query() {
    echo ""
    echo "🧪 Test avec la requête problématique..."
    
    local search_url="${AZURE_SEARCH_ENDPOINT}/indexes/${AZURE_SEARCH_INDEX_NAME}/docs/search?api-version=2023-11-01"
    
    # Utiliser la même requête que notre amélioration
    local enhanced_query="conduis saoul OR Code de la sécurité routière OR conduite facultés affaiblies OR alcool au volant OR C-24.2 OR permis de conduire suspendu"
    
    local search_body=$(cat <<EOF
{
    "search": "$enhanced_query",
    "searchFields": "title,description,content",
    "select": "legalIdentifier,title,legalStatus,sourceUrl,documentType",
    "top": 10,
    "queryType": "simple",
    "searchMode": "any"
}
EOF
)
    
    local response=$(curl -s -X POST "$search_url" \
        -H "Content-Type: application/json" \
        -H "api-key: $SECRET_AZURE_SEARCH_KEY" \
        -d "$search_body")
    
    echo "📊 Top 10 résultats pour la requête améliorée:"
    echo "$response" | jq -r '.value[] | "Score: \(.["@search.score"]) | \(.legalIdentifier) | \(.legalStatus) | \(.title[0:80])..."' 2>/dev/null || echo "$response"
    
    # Vérifier si C-24.2 apparaît dans les résultats
    local c242_found=$(echo "$response" | jq -r '.value[] | select(.legalIdentifier | contains("C-24.2")) | length' 2>/dev/null || echo "0")
    
    if [[ $c242_found -gt 0 ]]; then
        echo "✅ Documents C-24.2 trouvés dans les résultats de recherche"
    else
        echo "❌ Aucun document C-24.2 dans les top résultats - problème de pertinence"
    fi
}

# Vérifier la cohérence des données sources
check_data_consistency() {
    echo ""
    echo "🔍 Vérification cohérence des données sources..."
    
    # Chercher dans les manifests de fichiers
    if [[ -f "src/indexers/data/manifests/files-manifest.json" ]]; then
        echo "📁 Recherche de C-24.2 dans le manifest des fichiers..."
        local c242_entries=$(grep -c "C-24.2" "src/indexers/data/manifests/files-manifest.json" 2>/dev/null || echo "0")
        echo "📊 Entrées C-24.2 dans le manifest: $c242_entries"
        
        if [[ $c242_entries -gt 0 ]]; then
            echo "🔍 Exemples d'entrées C-24.2 dans le manifest:"
            grep -A 2 -B 2 "C-24.2" "src/indexers/data/manifests/files-manifest.json" | head -10
        fi
    else
        echo "⚠️  Fichier manifest non trouvé"
    fi
}

# Fonction principale
main() {
    check_required_vars
    search_c242_documents
    test_problematic_query
    check_data_consistency
    
    echo ""
    echo "🎯 Recommandations:"
    echo "1. Si aucun document C-24.2 trouvé: vérifier l'indexation"
    echo "2. Si documents trouvés avec statut 'abrogé': corriger les données sources"
    echo "3. Si documents trouvés mais pas dans top résultats: améliorer la pertinence"
    echo ""
    echo "🔧 Actions possibles:"
    echo "   make index-status                    # Vérifier l'état de l'index"
    echo "   make diagnostic-ontology             # Diagnostic complet"
    echo "   make index-reindex                   # Recréer l'index si nécessaire"
}

main "$@"