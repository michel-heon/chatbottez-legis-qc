#!/bin/bash
# TTL Schema Analysis - Extract index structure from TTL metadata
# Usage: ./ttl-schema-analyze.sh [ENV_CONFIG]

set -e

# Load environment
ENV_CONFIG=${1:-${ENV_CONFIG:-local}}
source "$(dirname "$0")/env-check.sh"

echo "🔍 Analyzing TTL Schema for Index Structure..."
echo "📋 Environment: $ENV_CONFIG"

# Create output directory
mkdir -p src/indexers/config

# Run TTL analysis with schema extraction
echo "📊 Extracting schema from TTL metadata..."
TTL_FILE_PATH="$EXTERNAL_DATA_SOURCE_PATH/${TTL_METADATA_FILE:-extract/rdf/legisquebec-metadata.ttl}"
echo "📁 Using TTL file: $TTL_FILE_PATH"

node lib/src/indexers/ttlSchemaAnalyzer.js \
    "$TTL_FILE_PATH" \
    "src/indexers/config/index-schema.json"

if [ $? -eq 0 ]; then
    echo "✅ TTL schema analysis completed successfully"
    echo "📄 Schema saved to: src/indexers/config/index-schema.json"
    
    # Show schema summary
    echo ""
    echo "📋 Index Schema Summary:"
    node -e "
        const schema = require('./src/indexers/config/index-schema.json');
        console.log('Index Name:', schema.name);
        console.log('Fields Count:', schema.fields.length);
        console.log('Key Fields:', schema.fields.filter(f => f.key).map(f => f.name).join(', '));
        console.log('Searchable Fields:', schema.fields.filter(f => f.searchable).map(f => f.name).join(', '));
    "
else
    echo "❌ TTL schema analysis failed"
    exit 1
fi
