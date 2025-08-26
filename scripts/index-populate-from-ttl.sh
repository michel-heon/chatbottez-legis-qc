#!/bin/bash
# Index Population from TTL - Populate Azure Search with processed content
# Usage: ./index-populate-from-ttl.sh [ENV_CONFIG] [MODE]

set -e

# Load environment
ENV_CONFIG=${1:-${ENV_CONFIG:-local}}
MODE=${2:-incremental}  # incremental or full
source "$(dirname "$0")/env-check.sh"

echo "📤 Populating Index from TTL-driven Content..."
echo "📋 Environment: $ENV_CONFIG"
echo "🔄 Mode: $MODE"

# Check required files
MANIFEST_FILE="src/indexers/data/manifests/files-manifest.json"
SCHEMA_FILE="src/indexers/config/index-schema.json"

if [ ! -f "$MANIFEST_FILE" ]; then
    echo "❌ Files manifest not found: $MANIFEST_FILE"
    exit 1
fi

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Schema file not found: $SCHEMA_FILE"
    exit 1
fi

# Get index name from environment variable (prioritized) or schema file (fallback)
if [ -n "$AZURE_SEARCH_INDEX_NAME" ]; then
    INDEX_NAME="$AZURE_SEARCH_INDEX_NAME"
    echo "📄 Target Index: $INDEX_NAME (from environment)"
else
    INDEX_NAME=$(node -e "console.log(require('./$SCHEMA_FILE').name)")
    echo "📄 Target Index: $INDEX_NAME (from schema file)"
fi

# Run population
echo "🚀 Starting index population..."
node lib/src/indexers/indexPopulatorFromTTL.js \
    "$SECRET_AZURE_SEARCH_KEY" \
    "$SECRET_AZURE_OPENAI_API_KEY" \
    "$INDEX_NAME" \
    "$MANIFEST_FILE" \
    "$MODE" \
    "src/indexers/data/processed" \
    "src/indexers/data/embeddings"

if [ $? -eq 0 ]; then
    echo "✅ Index population completed successfully"
    
    # Show population summary
    echo ""
    echo "📋 Population Summary:"
    
    # Get index statistics
    curl -s -X GET \
        "https://${AZURE_SEARCH_ENDPOINT#https://}/indexes/$INDEX_NAME/stats?api-version=2023-11-01" \
        -H "api-key: $SECRET_AZURE_SEARCH_KEY" \
        -H "Content-Type: application/json" | \
    node -e "
        let input = '';
        process.stdin.on('data', chunk => input += chunk);
        process.stdin.on('end', () => {
            try {
                const stats = JSON.parse(input);
                console.log('📊 Index Statistics:');
                console.log('  Documents:', stats.documentCount);
                console.log('  Storage Size:', Math.round(stats.storageSize / 1024 / 1024 * 100) / 100, 'MB');
            } catch (e) {
                console.log('❌ Could not retrieve index statistics');
            }
        });
    "
else
    echo "❌ Index population failed"
    exit 1
fi
