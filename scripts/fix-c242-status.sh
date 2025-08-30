#!/bin/bash

# scripts/fix-c242-status.sh
# Script pour corriger le statut incorrect du Code de la sécurité routière (C-24.2)
# Le C-24.2 est actuellement en vigueur, pas abrogé

# Chargement des fonctions communes
source "$(dirname "$0")/load-env.sh"

echo "🔧 Correction - Statut Code de la sécurité routière (C-24.2)"
echo "========================================================"

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
}

# Rechercher le document C-24.2 principal pour obtenir sa clé
get_c242_document_key() {
    echo ""
    echo "🔍 Recherche du document C-24.2 principal..."
    
    local search_url="${AZURE_SEARCH_ENDPOINT}/indexes/${AZURE_SEARCH_INDEX_NAME}/docs/search?api-version=2023-11-01"
    
    local search_body='{
        "search": "legalIdentifier:C-24.2",
        "filter": "legalIdentifier eq '\''C-24.2'\''",
        "select": "id,legalIdentifier,title,legalStatus,sourceUrl",
        "top": 1,
        "queryType": "simple"
    }'
    
    local response=$(curl -s -X POST "$search_url" \
        -H "Content-Type: application/json" \
        -H "api-key: $SECRET_AZURE_SEARCH_KEY" \
        -d "$search_body")
    
    echo "📊 Document C-24.2 trouvé:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    # Extraire l'ID du document
    local doc_id=$(echo "$response" | jq -r '.value[0].id' 2>/dev/null)
    if [[ "$doc_id" != "null" && -n "$doc_id" ]]; then
        echo "✅ ID du document: $doc_id"
        echo "$doc_id"
    else
        echo "❌ Impossible de trouver l'ID du document C-24.2"
        return 1
    fi
}

# Corriger le statut du document C-24.2
fix_c242_status() {
    local doc_id="$1"
    
    if [[ -z "$doc_id" ]]; then
        echo "❌ ID du document requis"
        return 1
    fi
    
    echo ""
    echo "🔧 Correction du statut C-24.2..."
    
    local update_url="${AZURE_SEARCH_ENDPOINT}/indexes/${AZURE_SEARCH_INDEX_NAME}/docs/index?api-version=2023-11-01"
    
    # Mettre à jour le statut pour indiquer que C-24.2 est en vigueur
    local update_body=$(cat <<EOF
{
    "value": [
        {
            "@search.action": "merge",
            "id": "$doc_id",
            "legalStatus": "en vigueur"
        }
    ]
}
EOF
)
    
    echo "📝 Mise à jour du document avec le statut 'en vigueur'..."
    
    local response=$(curl -s -X POST "$update_url" \
        -H "Content-Type: application/json" \
        -H "api-key: $SECRET_AZURE_SEARCH_KEY" \
        -d "$update_body")
    
    echo "📊 Réponse de la mise à jour:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    # Vérifier si la mise à jour a réussi
    local success=$(echo "$response" | jq -r '.value[0].status' 2>/dev/null)
    if [[ "$success" == "true" ]]; then
        echo "✅ Mise à jour réussie - C-24.2 maintenant marqué comme 'en vigueur'"
    else
        echo "❌ Échec de la mise à jour"
        return 1
    fi
}

# Vérifier la correction
verify_fix() {
    echo ""
    echo "🔍 Vérification de la correction..."
    
    local search_url="${AZURE_SEARCH_ENDPOINT}/indexes/${AZURE_SEARCH_INDEX_NAME}/docs/search?api-version=2023-11-01"
    
    local search_body='{
        "search": "legalIdentifier:C-24.2",
        "filter": "legalIdentifier eq '\''C-24.2'\''",
        "select": "legalIdentifier,title,legalStatus",
        "top": 1,
        "queryType": "simple"
    }'
    
    local response=$(curl -s -X POST "$search_url" \
        -H "Content-Type: application/json" \
        -H "api-key: $SECRET_AZURE_SEARCH_KEY" \
        -d "$search_body")
    
    local status=$(echo "$response" | jq -r '.value[0].legalStatus' 2>/dev/null)
    
    echo "📊 Statut actuel de C-24.2: $status"
    
    if [[ "$status" == "en vigueur" ]]; then
        echo "✅ Correction confirmée - C-24.2 est maintenant correctement marqué comme 'en vigueur'"
    else
        echo "❌ La correction n'a pas fonctionné - statut actuel: $status"
    fi
}

# Fonction principale
main() {
    check_required_vars
    
    echo ""
    echo "⚠️  ATTENTION: Ce script va corriger le statut de C-24.2 dans l'index Azure Search"
    echo "   Statut actuel: abrogée (INCORRECT)"
    echo "   Nouveau statut: en vigueur (CORRECT)"
    echo ""
    read -p "Continuer? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Opération annulée"
        exit 0
    fi
    
    local doc_id=$(get_c242_document_key)
    if [[ $? -eq 0 && -n "$doc_id" ]]; then
        fix_c242_status "$doc_id"
        if [[ $? -eq 0 ]]; then
            verify_fix
        fi
    fi
    
    echo ""
    echo "🎯 Prochaines étapes recommandées:"
    echo "1. Tester une requête sur la conduite en état d'ébriété"
    echo "2. Vérifier que C-24.2 apparaît maintenant comme 'en vigueur'"
    echo "3. Corriger les données sources pour éviter que le problème se reproduise"
}

main "$@"
