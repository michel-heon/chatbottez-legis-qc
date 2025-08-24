#!/bin/bash
# Add new documents to existing Azure Search index

set -e

SECRET_AZURE_SEARCH_KEY="$1"
SECRET_AZURE_OPENAI_API_KEY="$2"

if [[ -z "$SECRET_AZURE_SEARCH_KEY" ]] || [[ -z "$SECRET_AZURE_OPENAI_API_KEY" ]]; then
    echo "❌ Usage: $0 <secret_azure_search_key> <secret_azure_openai_api_key>"
    exit 1
fi

echo "📝 Adding new documents to Azure Search index..."

# Load environment variables
if [[ -f "env/.env.playground.user" ]]; then
    export $(grep -v '^#' env/.env.playground.user | xargs)
elif [[ -f "env/.env.local.user" ]]; then
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

# Check if there are new documents
DATA_DIR="src/indexers/data"
NEW_DOCS_DIR="src/indexers/new-data"

if [[ ! -d "$NEW_DOCS_DIR" ]]; then
    echo "📁 Creating new documents directory: $NEW_DOCS_DIR"
    mkdir -p "$NEW_DOCS_DIR"
    echo ""
    echo "💡 Place new documents (.md files) in: $NEW_DOCS_DIR"
    echo "   Then run this command again to index them."
    exit 0
fi

NEW_DOC_COUNT=$(find "$NEW_DOCS_DIR" -name "*.md" | wc -l)

if [[ $NEW_DOC_COUNT -eq 0 ]]; then
    echo "ℹ️  No new documents found in $NEW_DOCS_DIR"
    echo "   Add .md files to this directory and run again."
    exit 0
fi

echo "📄 Found $NEW_DOC_COUNT new documents to index:"
find "$NEW_DOCS_DIR" -name "*.md" -exec basename {} \; | sed 's/^/   /'

echo ""
echo "🔄 Processing new documents..."

# Move new documents to data directory temporarily
TEMP_BACKUP_DIR="/tmp/legis-qc-backup-$(date +%s)"
mkdir -p "$TEMP_BACKUP_DIR"

# Backup existing data
cp -r "$DATA_DIR"/* "$TEMP_BACKUP_DIR/" 2>/dev/null || true

# Copy new documents
cp "$NEW_DOCS_DIR"/*.md "$DATA_DIR/"

# Run the setup script (which will add all documents, including new ones)
echo "🔄 Updating index..."
cd lib/src/indexers || {
    echo "❌ Build directory not found. Please run 'npm run build' first."
    exit 1
}

if node setup.js "$SECRET_AZURE_SEARCH_KEY" "$SECRET_AZURE_OPENAI_API_KEY" "$INDEX_NAME"; then
    echo "✅ Documents added successfully!"
    
    # Move processed documents to archive
    ARCHIVE_DIR="src/indexers/processed/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$ARCHIVE_DIR"
    mv "$NEW_DOCS_DIR"/*.md "$ARCHIVE_DIR/"
    
    echo "📁 Processed documents moved to: $ARCHIVE_DIR"
    
    echo ""
    echo "📝 Next steps:"
    echo "   1. Test the search with new content"
    echo "   2. Check index status: make index-status"
else
    echo "❌ Failed to add documents!"
    
    # Restore backup
    echo "🔄 Restoring original data..."
    rm -f "$DATA_DIR"/*.md
    cp "$TEMP_BACKUP_DIR"/* "$DATA_DIR/" 2>/dev/null || true
    
    exit 1
fi

# Cleanup
rm -rf "$TEMP_BACKUP_DIR"
