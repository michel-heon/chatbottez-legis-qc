#!/bin/bash
# Test avec échantillon de 5 documents
# Usage: ./test-sample-5docs.sh [ENV_CONFIG]

set -e

# Load environment
ENV_CONFIG=${1:-${ENV_CONFIG:-playground}}
source "$(dirname "$0")/env-check.sh"

echo "🧪 Test avec échantillon de 5 documents"
echo "📋 Environment: $ENV_CONFIG"
echo "📁 TTL File: ${TTL_METADATA_FILE:-legisquebec-metadata.ttl}"
echo ""

# Étape 1: Analyse du schéma TTL
echo "=== ÉTAPE 1: Analyse du schéma TTL ==="
./scripts/ttl-schema-analyze.sh $ENV_CONFIG
echo ""

# Étape 2: Découverte des fichiers (limité à 5)
echo "=== ÉTAPE 2: Découverte des fichiers (échantillon de 5) ==="
TTL_FILE_PATH="$EXTERNAL_DATA_SOURCE_PATH/extract/rdf/${TTL_METADATA_FILE:-legisquebec-metadata.ttl}"
echo "📁 Using TTL file: $TTL_FILE_PATH"

# Créer un fichier TTL temporaire avec seulement 5 documents
TEMP_TTL="/tmp/test-sample-5docs.ttl"
echo "📊 Création d'un échantillon de 5 documents..."

# Extraire les 5 premiers sujets uniques du fichier TTL
head -200 "$TTL_FILE_PATH" | grep -E "^<[^>]+>" | head -5 > /tmp/subjects_sample.txt

# Créer le fichier TTL temporaire avec seulement ces sujets
echo "# TTL Test Sample - 5 documents" > "$TEMP_TTL"
echo "" >> "$TEMP_TTL"

# Copier les namespaces/prefixes du fichier original
head -50 "$TTL_FILE_PATH" | grep -E "^@(prefix|base)" >> "$TEMP_TTL"
echo "" >> "$TEMP_TTL"

# Pour chaque sujet échantillon, extraire toutes ses propriétés
while read -r subject; do
    if [ ! -z "$subject" ]; then
        echo "📄 Ajout du document: $subject"
        grep -A 20 "^$subject " "$TTL_FILE_PATH" | head -20 >> "$TEMP_TTL"
        echo "" >> "$TEMP_TTL"
    fi
done < /tmp/subjects_sample.txt

echo "✅ Échantillon créé: $TEMP_TTL"
echo "📊 Documents dans l'échantillon:"
grep -c "^<[^>]*>" "$TEMP_TTL" || echo "0"

# Découverte des fichiers avec l'échantillon
mkdir -p src/indexers/data/manifests
node lib/src/indexers/ttlFilesDiscovery.js \
    "$TEMP_TTL" \
    "src/indexers/data/manifests/files-manifest-sample.json" \
    "$EXTERNAL_DATA_SOURCE_PATH"

echo ""

# Étape 3: Création de l'index
echo "=== ÉTAPE 3: Création de l'index Azure Search ==="
./scripts/index-create-from-ttl.sh $ENV_CONFIG
echo ""

# Étape 4: Traitement du contenu (5 documents max)
echo "=== ÉTAPE 4: Traitement du contenu (échantillon) ==="
echo "📊 Traitement des fichiers découverts..."
node lib/src/indexers/contentProcessor.js \
    "src/indexers/data/manifests/files-manifest-sample.json" \
    "src/indexers/data/processed" \
    "src/indexers/data/embeddings" \
    5  # Limite à 5 documents max

echo ""

# Étape 5: Population de l'index
echo "=== ÉTAPE 5: Population de l'index ==="
# Modifier temporairement le manifest pour le test
cp "src/indexers/data/manifests/files-manifest-sample.json" "src/indexers/data/manifests/files-manifest.json"

./scripts/index-populate-from-ttl.sh $ENV_CONFIG full
echo ""

# Nettoyage
echo "🧹 Nettoyage des fichiers temporaires..."
rm -f "$TEMP_TTL" /tmp/subjects_sample.txt

echo ""
echo "🎉 Test de l'échantillon de 5 documents terminé!"
echo "📊 Vérifiez l'index '$AZURE_SEARCH_INDEX_NAME' dans Azure Search"
