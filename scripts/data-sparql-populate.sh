#!/bin/bash

# SPARQL Data Population Script - nomenclature: data-sparql-populate.sh
echo "🚀 SPARQL-based Azure Search Data Population"
echo "============================================="

# Function to load env file safely
load_env_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "✅ Loading $file..."
        source "$file"
    fi
}

# Load environment files
load_env_file "env/.env.playground"
load_env_file "env/.env.playground.user"

# Export all required variables including the new ones
export AZURE_SEARCH_ENDPOINT
export SECRET_AZURE_SEARCH_KEY
export EXTERNAL_DATA_SOURCE_PATH
export AZURE_OPENAI_ENDPOINT
export SECRET_AZURE_OPENAI_API_KEY
export AZURE_OPENAI_DEPLOYMENT_NAME
export AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME
export AZURE_SEARCH_INDEX_NAME
export TTL_METADATA_FILE

echo "🎯 SPARQL Data Population Configuration:"
echo "   Search Endpoint: $AZURE_SEARCH_ENDPOINT"
echo "   Target Index: $AZURE_SEARCH_INDEX_NAME"
echo "   Data Source: $EXTERNAL_DATA_SOURCE_PATH"
echo "   TTL Metadata: $TTL_METADATA_FILE"
echo "   OpenAI Endpoint: $AZURE_OPENAI_ENDPOINT"
echo "   Sample Size: 5 documents (TTL-driven)"
echo ""

# Validate Azure Search configuration
if [ -z "$AZURE_SEARCH_ENDPOINT" ]; then
    echo "❌ AZURE_SEARCH_ENDPOINT not found in environment"
    exit 1
fi

# Validate Azure OpenAI configuration
if [ -z "$AZURE_OPENAI_ENDPOINT" ]; then
    echo "❌ AZURE_OPENAI_ENDPOINT not found in environment"
    exit 1
fi

if [ -z "$SECRET_AZURE_OPENAI_API_KEY" ]; then
    echo "❌ SECRET_AZURE_OPENAI_API_KEY not found in environment"
    exit 1
fi

# Check required environment variables
if [ -z "$SECRET_AZURE_SEARCH_KEY" ]; then
    echo "❌ SECRET_AZURE_SEARCH_KEY not found in environment"
    exit 1
fi

if [ -z "$EXTERNAL_DATA_SOURCE_PATH" ]; then
    echo "❌ EXTERNAL_DATA_SOURCE_PATH not found in environment"
    exit 1
fi

# Verify TTL file exists
TTL_FILE="$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE"
if [ ! -f "$TTL_FILE" ]; then
    echo "❌ TTL metadata file not found: $TTL_FILE"
    exit 1
fi

echo "✅ TTL metadata file found: $(ls -lh "$TTL_FILE" | awk '{print $5}')"

# Verify PDF directory exists
PDF_DIR="$EXTERNAL_DATA_SOURCE_PATH/extract/pdf"
if [ ! -d "$PDF_DIR" ]; then
    echo "❌ PDF directory not found: $PDF_DIR"
    exit 1
fi

echo "✅ PDF directory found: $(find "$PDF_DIR" -name "*.pdf" | wc -l) PDF files available"
echo ""

# Build project
echo "🔧 Building project..."
npm run build

# Check if enhanced index exists
echo ""
echo "🔍 Checking enhanced index status..."
node lib/src/indexers/checkIndexStatus.js "$SECRET_AZURE_SEARCH_KEY" | grep -E "($AZURE_SEARCH_INDEX_NAME|Documents:|Type:)"

echo ""
echo "🚀 Starting SPARQL-based data population..."
echo "📋 Processing sample documents using SPARQL queries from TTL..."

# Run TTL-driven data population with correct index name
echo "🎯 Using TTL-driven indexing: ONLY files defined in $TTL_METADATA_FILE"
PROCESSED_DIR="${EXTERNAL_DATA_SOURCE_PATH}/transform/processed"
EMBEDDINGS_DIR="${EXTERNAL_DATA_SOURCE_PATH}/transform/embeddings"
node lib/src/indexers/indexPopulatorFromTTL.js "$SECRET_AZURE_SEARCH_KEY" "$SECRET_AZURE_OPENAI_API_KEY" "$AZURE_SEARCH_INDEX_NAME" "$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE" "full" "$PROCESSED_DIR" "$EMBEDDINGS_DIR"

echo ""
echo "🎉 SPARQL Data Population completed!"
echo ""
echo "🔍 Final verification..."
node lib/src/indexers/checkIndexStatus.js "$SECRET_AZURE_SEARCH_KEY" | grep -E "($AZURE_SEARCH_INDEX_NAME|Documents:|Type:)"
