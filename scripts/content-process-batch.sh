#!/bin/bash
# Content Processing - Extract and process PDF content in batches
# Usage: ./content-process-batch.sh [ENV_CONFIG] [BATCH_SIZE]

set -e

# Load environment
ENV_CONFIG=${1:-${ENV_CONFIG:-local}}
BATCH_SIZE=${2:-10}
source "$(dirname "$0")/env-check.sh"

echo "⚙️  Processing Content in Batches..."
echo "📋 Environment: $ENV_CONFIG"
echo "📦 Batch Size: $BATCH_SIZE"

# Check if files manifest exists
MANIFEST_FILE="src/indexers/data/manifests/files-manifest.json"
if [ ! -f "$MANIFEST_FILE" ]; then
    echo "❌ Files manifest not found: $MANIFEST_FILE"
    echo "💡 Run 'make files-discover' first to generate the manifest"
    exit 1
fi

# Create output directories
mkdir -p src/indexers/data/processed
mkdir -p src/indexers/data/embeddings

# Run content processing
echo "🔧 Processing PDF content and generating embeddings..."
node lib/src/indexers/contentProcessor.js \
    "$MANIFEST_FILE" \
    "$SECRET_AZURE_OPENAI_API_KEY" \
    "$BATCH_SIZE" \
    "src/indexers/data/processed" \
    "src/indexers/data/embeddings"

if [ $? -eq 0 ]; then
    echo "✅ Content processing completed successfully"
    
    # Show processing summary
    echo ""
    echo "📋 Content Processing Summary:"
    ls -la src/indexers/data/processed/ | wc -l | xargs echo "Processed Files:"
    ls -la src/indexers/data/embeddings/ | wc -l | xargs echo "Embedding Files:"
    
    # Check for any errors
    if [ -f "src/indexers/data/processed/errors.log" ]; then
        echo "⚠️  Some files had processing errors:"
        cat src/indexers/data/processed/errors.log
    fi
else
    echo "❌ Content processing failed"
    exit 1
fi
