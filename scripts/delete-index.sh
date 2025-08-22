#!/bin/bash
# Delete Azure Search index

set -e

AZURE_SEARCH_KEY="$1"

if [[ -z "$AZURE_SEARCH_KEY" ]]; then
    echo "❌ Usage: $0 <azure_search_key>"
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

# Check if TypeScript is compiled
if [[ ! -d "dist" ]]; then
    echo "📦 Building TypeScript project..."
    npm run build
fi

echo "⚠️  WARNING: This will delete the entire 'my-documents' index!"
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
cd dist/indexers || {
    echo "❌ Build directory not found. Please run 'npm run build' first."
    exit 1
}

node delete.js "$AZURE_SEARCH_KEY"

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
