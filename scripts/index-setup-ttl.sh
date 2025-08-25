#!/bin/bash

# TTL-driven Index Setup Script
echo "🚀 TTL-driven Azure Search Index Setup"
echo "======================================"

# Load environment files
load_env_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "✅ Loading $file..."
        source "$file"
    fi
}

load_env_file "env/.env.playground"
load_env_file "env/.env.playground.user"

# Export required variables
export AZURE_SEARCH_ENDPOINT
export SECRET_AZURE_SEARCH_KEY
export EXTERNAL_DATA_SOURCE_PATH
export AZURE_OPENAI_ENDPOINT
export SECRET_AZURE_OPENAI_API_KEY
export AZURE_OPENAI_DEPLOYMENT_NAME
export AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME
export AZURE_SEARCH_INDEX_NAME
export TTL_METADATA_FILE

echo "🎯 TTL-driven Index Setup Configuration:"
echo "   Search Endpoint: $AZURE_SEARCH_ENDPOINT"
echo "   Target Index: $AZURE_SEARCH_INDEX_NAME"
echo "   TTL Metadata: $TTL_METADATA_FILE"
echo "   Sample Size: 5 documents (TTL-driven ONLY)"
echo ""

# Validate environment
if [ -z "$SECRET_AZURE_SEARCH_KEY" ] || [ -z "$SECRET_AZURE_OPENAI_API_KEY" ]; then
    echo "❌ Missing API keys"
    exit 1
fi

# Build project
echo "🔧 Building project..."
npm run build

# Step 1: Generate schema from TTL
echo ""
echo "📊 Step 1: Analyzing TTL and generating index schema..."
node lib/src/indexers/ttlSchemaAnalyzer.js "$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE" schema-ttl.json

if [ $? -ne 0 ]; then
    echo "❌ TTL schema analysis failed"
    exit 1
fi

echo "✅ TTL schema generated successfully"

# Step 2: Create index with TTL schema
echo ""
echo "🏗️  Step 2: Creating Azure Search index with TTL schema..."
node lib/src/indexers/createIndexFromSchema.js "$SECRET_AZURE_SEARCH_KEY" schema-ttl.json

if [ $? -ne 0 ]; then
    echo "❌ Index creation failed"
    exit 1
fi

echo "✅ Index created successfully with TTL-driven schema"
echo ""
echo "🎉 TTL-driven Index Setup completed!"
echo "📋 Index now ready for TTL-driven population with 5 documents"
