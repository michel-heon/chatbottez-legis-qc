#!/bin/bash
# Setup Azure Search index and upload documents

set -e

SECRET_AZURE_SEARCH_KEY="$1"
SECRET_AZURE_OPENAI_API_KEY="$2"

if [[ -z "$SECRET_AZURE_SEARCH_KEY" ]] || [[ -z "$SECRET_AZURE_OPENAI_API_KEY" ]]; then
    echo "❌ Usage: $0 <secret_azure_search_key> <secret_azure_openai_api_key>"
    exit 1
fi

echo "🚀 Setting up Azure Search index..."

# Load environment variables
if [[ -f "env/.env.playground.user" ]]; then
    echo "📋 Loading environment from env/.env.playground.user"
    export $(grep -v '^#' env/.env.playground.user | xargs)
elif [[ -f "env/.env.local.user" ]]; then
    echo "📋 Loading environment from env/.env.local.user"
    export $(grep -v '^#' env/.env.local.user | xargs)
else
    echo "⚠️  No environment file found, using system environment"
fi

# Decrypt keys if they are encrypted (crypto_ prefix)
if [[ "$SECRET_AZURE_SEARCH_KEY" == crypto_* ]]; then
    echo "🔓 Decrypting Azure Search key..."
    # Note: In a real scenario, you'd implement proper decryption
    echo "⚠️  Encrypted keys detected - manual decryption required"
fi

if [[ "$SECRET_AZURE_OPENAI_API_KEY" == crypto_* ]]; then
    echo "🔓 Decrypting Azure OpenAI key..."
    # Note: In a real scenario, you'd implement proper decryption
    echo "⚠️  Encrypted keys detected - manual decryption required"
fi

# Check if TypeScript is compiled
if [[ ! -d "dist" ]]; then
    echo "📦 Building TypeScript project..."
    npm run build
fi

# Determine index name
INDEX_NAME="my-documents"  # Default value

# Allow override via environment variable
if [[ -n "$AZURE_SEARCH_INDEX_NAME" ]]; then
    INDEX_NAME="$AZURE_SEARCH_INDEX_NAME"
    echo "📋 Using index name from environment: $INDEX_NAME"
fi

echo "📊 Starting index setup process..."
echo "   Index name: $INDEX_NAME"
echo "   Data source: src/indexers/data/"

# Count documents to be indexed
DOC_COUNT=$(find src/indexers/data -name "*.md" | wc -l)
echo "   Documents to index: $DOC_COUNT"

# Run the setup script
echo "🔄 Running index setup..."
cd dist/indexers || {
    echo "❌ Build directory not found. Please run 'npm run build' first."
    exit 1
}

node setup.js "$SECRET_AZURE_SEARCH_KEY" "$SECRET_AZURE_OPENAI_API_KEY" "$INDEX_NAME"

if [[ $? -eq 0 ]]; then
    echo "✅ Index setup completed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Test the search functionality"
    echo "   2. Check index status: make index-status"
    echo "   3. Start the application: make dev"
else
    echo "❌ Index setup failed!"
    exit 1
fi
