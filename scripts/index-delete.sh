#!/bin/bash
# Delete Azure Search index

set -e

SECRET_AZURE_SEARCH_KEY="$1"

if [[ -z "$SECRET_AZURE_SEARCH_KEY" ]]; then
    echo "❌ Usage: $0 <secret_azure_search_key>"
    exit 1
fi

echo "🗑️  Deleting Azure Search index..."

# Load environment variables
if [[ -f "env/.env.playground.user" ]]; then
    echo "📋 Loading environment from env/.env.playground.user"
    export $(grep -v '^#' env/.env.playground.user | xargs)
elif [[ -f "env/.env.local.user" ]]; then
    echo "📋 Loading environment from env/.env.local.user"
    export $(grep -v '^#' env/.env.local.user | xargs)
fi

# Load configuration if available
INDEX_NAME="my-documents"  # Default value
if [[ -f "scripts/.index-config" ]]; then
    echo "📋 Loading index configuration..."
    source scripts/.index-config
    echo "   Using configured index name: $INDEX_NAME"
fi

# Allow override via environment variable
if [[ -n "$AZURE_SEARCH_INDEX_NAME" ]]; then
    INDEX_NAME="$AZURE_SEARCH_INDEX_NAME"
    echo "📋 Using index name from environment: $INDEX_NAME"
fi

# Check if TypeScript is compiled
if [[ ! -d "lib" ]]; then
    echo "📦 Building TypeScript project..."
    npm run build || echo "⚠️  Build failed, continuing with existing artifacts..."
fi

echo "⚠️  WARNING: This will delete the entire '$INDEX_NAME' index!"
echo "   All indexed documents will be lost."
echo ""

# Confirmation prompt
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled"
    exit 1
fi

echo "🔄 Running index deletion..."
cd lib/src/indexers || {
    echo "❌ Build directory not found. Please run 'npm run build' first."
    exit 1
}

node delete.js "$SECRET_AZURE_SEARCH_KEY" "$INDEX_NAME"

if [[ $? -eq 0 ]]; then
    echo "✅ Index deleted successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. To recreate the index: make setup-index"
    echo "   2. To recreate with fresh data: make reindex"
else
    echo "❌ Index deletion failed!"
    exit 1
fi
