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

# Create output directories with letter subdirectories
PROCESSED_DIR="${EXTERNAL_DATA_SOURCE_PATH}/transform/processed"
EMBEDDINGS_DIR="${EXTERNAL_DATA_SOURCE_PATH}/transform/embeddings"
mkdir -p "$PROCESSED_DIR"
mkdir -p "$EMBEDDINGS_DIR"

# Create subdirectories for each letter (A-Z)
echo "📁 Creating subdirectories for organized file storage..."
for letter in {A..Z}; do
    mkdir -p "$PROCESSED_DIR/$letter"
    mkdir -p "$EMBEDDINGS_DIR/$letter"
done

# Run content processing
echo "🔧 Processing PDF content and generating embeddings..."
FORCE_PARAM=${FORCE:-false}
node lib/src/indexers/contentProcessor.js \
    "$MANIFEST_FILE" \
    "$SECRET_AZURE_OPENAI_API_KEY" \
    "$BATCH_SIZE" \
    "$PROCESSED_DIR" \
    "$EMBEDDINGS_DIR" \
    "$FORCE_PARAM"

if [ $? -eq 0 ]; then
    echo "✅ Content processing completed successfully"
    
    # Show processing summary
    echo ""
    echo "📋 Content Processing Summary:"
    find "$PROCESSED_DIR" -name "*.json" -not -name "errors.log" | wc -l | xargs echo "Processed Files:"
    find "$EMBEDDINGS_DIR" -name "*.json" | wc -l | xargs echo "Embedding Files:"
    
    # Check for any errors
    if [ -f "$PROCESSED_DIR/errors.log" ]; then
        echo "⚠️  Some files had processing errors:"
        cat "$PROCESSED_DIR/errors.log"
    fi
else
    echo "❌ Content processing failed"
    exit 1
fi
