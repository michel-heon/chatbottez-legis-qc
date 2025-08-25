#!/bin/bash
# Index Creation from TTL Schema
# Usage: ./index-create-from-ttl.sh [ENV_CONFIG]

set -e

# Load environment
ENV_CONFIG=${1:-${ENV_CONFIG:-local}}
source "$(dirname "$0")/env-check.sh"

echo "🏗️  Creating Azure Search Index from TTL Schema..."
echo "📋 Environment: $ENV_CONFIG"

# Check if schema exists
SCHEMA_FILE="src/indexers/config/index-schema.json"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Schema file not found: $SCHEMA_FILE"
    echo "💡 Run 'make ttl-analyze' first to generate the schema"
    exit 1
fi

# Extract index name from schema
INDEX_NAME=$(node -e "console.log(require('./$SCHEMA_FILE').name)")
echo "📄 Creating index: $INDEX_NAME"

# Create index using schema
echo "🔧 Creating index with schema-driven configuration..."
node lib/src/indexers/indexCreatorFromTTL.js \
    "$SECRET_AZURE_SEARCH_KEY" \
    "$SCHEMA_FILE" \
    "$INDEX_NAME"

if [ $? -eq 0 ]; then
    echo "✅ Index created successfully: $INDEX_NAME"
    
    # Update environment file with new index name
    case "$ENV_CONFIG" in
        "playground")
            ENV_FILE="env/.env.playground.user"
            ;;
        "local")
            ENV_FILE="env/.env.local.user"
            ;;
        "dev")
            ENV_FILE="env/.env.dev.user"
            ;;
        *)
            echo "⚠️  Unknown environment: $ENV_CONFIG"
            ENV_FILE=""
            ;;
    esac
    
    if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
        # Update or add AZURE_SEARCH_INDEX_NAME
        if grep -q "AZURE_SEARCH_INDEX_NAME=" "$ENV_FILE"; then
            sed -i "s/AZURE_SEARCH_INDEX_NAME=.*/AZURE_SEARCH_INDEX_NAME=$INDEX_NAME/" "$ENV_FILE"
        else
            echo "AZURE_SEARCH_INDEX_NAME=$INDEX_NAME" >> "$ENV_FILE"
        fi
        echo "📝 Updated $ENV_FILE with index name: $INDEX_NAME"
    fi
else
    echo "❌ Index creation failed"
    exit 1
fi
