#!/bin/bash

# scripts/verify-c242-ontology.sh
# Vérification du statut de C-24.2 dans l'ontologie TTL en utilisant Apache Jena
# Vérifie si l'erreur "abrogé" vient de l'ontologie source

# Chargement des fonctions communes
source "$(dirname "$0")/load-env.sh"

echo "🔍 Vérification C-24.2 dans l'ontologie TTL"
echo "============================================"

# Vérifier les variables d'environnement
check_ttl_config() {
    echo "📋 Configuration TTL:"
    echo "   EXTERNAL_DATA_SOURCE_PATH: $EXTERNAL_DATA_SOURCE_PATH"
    echo "   TTL_METADATA_FILE: $TTL_METADATA_FILE"
    
    local ttl_full_path="$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE"
    echo "   Chemin complet: $ttl_full_path"
    
    if [[ ! -f "$ttl_full_path" ]]; then
        echo "❌ Fichier TTL non trouvé: $ttl_full_path"
        return 1
    fi
    
    echo "✅ Fichier TTL trouvé"
    echo "📊 Taille: $(du -h "$ttl_full_path" | cut -f1)"
    echo ""
}

# Vérifier si Apache Jena est disponible
check_jena_tools() {
    echo "🔧 Vérification des outils Apache Jena..."
    
    # Chercher riot (outil Jena pour manipuler RDF)
    if command -v riot >/dev/null 2>&1; then
        echo "✅ riot trouvé: $(which riot)"
    else
        echo "❌ riot non trouvé"
        echo "💡 Installation suggérée: sudo apt-get install jena-tools"
        echo "💡 Ou utilisation directe avec Java si Jena est installé"
    fi
    
    # Chercher arq (outil SPARQL de Jena)
    if command -v arq >/dev/null 2>&1; then
        echo "✅ arq trouvé: $(which arq)"
    else
        echo "❌ arq non trouvé"
    fi
    
    echo ""
}

# Requête SPARQL pour trouver C-24.2 et son statut
create_sparql_query() {
    cat > /tmp/query-c242.sparql <<'EOF'
PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT ?loi ?titre ?statut ?abrogePar ?description WHERE {
  {
    # Recherche directe par identifiant C-24.2
    ?loi legis:identifier "C-24.2" .
  } UNION {
    # Recherche dans le titre
    ?loi rdfs:label ?titre .
    FILTER(CONTAINS(LCASE(?titre), "sécurité routière"))
  } UNION {
    # Recherche dans les descriptions
    ?loi dcterms:description ?description .
    FILTER(CONTAINS(LCASE(?description), "c-24.2"))
  }
  
  OPTIONAL { ?loi rdfs:label ?titre }
  OPTIONAL { ?loi legis:status ?statut }
  OPTIONAL { ?loi legis:abrogatedBy ?abrogePar }
  OPTIONAL { ?loi dcterms:description ?description }
}
LIMIT 20
EOF

    echo "📝 Requête SPARQL créée: /tmp/query-c242.sparql"
}

# Recherche simple avec grep dans le TTL
grep_search_ttl() {
    local ttl_file="$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE"
    
    echo "🔍 Recherche simple dans le TTL avec grep..."
    echo ""
    
    echo "📋 Recherche de 'C-24.2':"
    grep -n -i "C-24\.2" "$ttl_file" | head -10
    echo ""
    
    echo "📋 Recherche de 'sécurité routière':"
    grep -n -i "sécurité routière" "$ttl_file" | head -5
    echo ""
    
    echo "📋 Recherche de termes d'abrogation autour de C-24.2:"
    grep -B5 -A5 -i "C-24\.2" "$ttl_file" | grep -i "abrog\|status\|remplacé" | head -10
    echo ""
}

# Utiliser arq si disponible
run_sparql_query() {
    local ttl_file="$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE"
    
    if command -v arq >/dev/null 2>&1; then
        echo "🔍 Exécution de la requête SPARQL avec arq..."
        arq --data="$ttl_file" --query=/tmp/query-c242.sparql
        echo ""
    else
        echo "⚠️  arq non disponible, utilisation de grep uniquement"
    fi
}

# Recherche alternative avec riot pour valider le TTL
validate_ttl() {
    local ttl_file="$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE"
    
    if command -v riot >/dev/null 2>&1; then
        echo "🔍 Validation du fichier TTL avec riot..."
        riot --validate "$ttl_file" 2>&1 | head -5
        echo ""
        
        echo "🔍 Extraction des triplets concernant C-24.2..."
        riot --output=ntriples "$ttl_file" 2>/dev/null | grep -i "C-24\.2" | head -10
        echo ""
    else
        echo "⚠️  riot non disponible pour validation"
    fi
}

# Analyser les résultats
analyze_results() {
    echo "🎯 Analyse des résultats:"
    echo ""
    echo "Si vous voyez:"
    echo "  ✅ C-24.2 avec statut 'en vigueur' → l'erreur vient du processus d'indexation"
    echo "  ❌ C-24.2 avec statut 'abrogé' → l'erreur vient de l'ontologie source"
    echo "  ⚠️  C-24.2 sans statut explicite → statut par défaut mal interprété"
    echo ""
    echo "Actions possibles:"
    echo "  make ttl-analyze           # Analyse complète de l'ontologie"
    echo "  make fix-c242-status       # Corriger dans l'index Azure Search"
    echo "  # Corriger l'ontologie TTL si l'erreur vient de là"
}

# Fonction principale
main() {
    check_ttl_config
    if [[ $? -ne 0 ]]; then
        exit 1
    fi
    
    check_jena_tools
    create_sparql_query
    
    echo "🔍 RECHERCHE DANS L'ONTOLOGIE TTL:"
    echo "================================="
    
    grep_search_ttl
    run_sparql_query
    validate_ttl
    analyze_results
    
    # Nettoyer
    rm -f /tmp/query-c242.sparql
}

main "$@"
