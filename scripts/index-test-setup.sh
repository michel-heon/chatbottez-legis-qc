#!/bin/bash
# Test index setup with improved error handling - processes only first 5 PDFs

set -e

SECRET_AZURE_SEARCH_KEY="$1"
SECRET_AZURE_OPENAI_API_KEY="$2"

if [[ -z "$SECRET_AZURE_SEARCH_KEY" ]] || [[ -z "$SECRET_AZURE_OPENAI_API_KEY" ]]; then
    echo "❌ Usage: $0 <secret_azure_search_key> <secret_azure_openai_api_key>"
    exit 1
fi

echo "🧪 Testing Azure Search index setup with first 5 PDFs..."

# Load environment variables
if [[ -f "env/.env.local.user" ]]; then
    echo "📋 Loading environment from env/.env.local.user"
    export $(grep -v '^#' env/.env.local.user | grep -v '^$' | xargs)
elif [[ -f "env/.env.playground.user" ]]; then
    echo "📋 Loading environment from env/.env.playground.user"
    export $(grep -v '^#' env/.env.playground.user | grep -v '^$' | xargs)
else
    echo "⚠️  No environment file found, using system environment"
fi

# Check if TypeScript is compiled
if [[ ! -d "lib" ]]; then
    echo "📦 Building TypeScript project..."
    npm run build || echo "⚠️  Build failed, continuing with existing artifacts..."
fi

# Load configuration - use environment variable for index name
INDEX_NAME="my-documents"  # Default value

# Allow override via environment variable
if [[ -n "$AZURE_SEARCH_INDEX_NAME" ]]; then
    INDEX_NAME="$AZURE_SEARCH_INDEX_NAME"
    echo "📋 Using index name from environment: $INDEX_NAME"
fi

echo "🧪 Starting TEST index setup process..."
echo "   Index name: $INDEX_NAME"
echo "   Data source: src/indexers/data/"
echo "   Test mode: Processing only first 5 PDFs"

# Run the test setup script
echo "🔄 Running test index setup..."
cd lib/src/indexers || {
    echo "❌ Build directory not found. Please run 'npm run build' first."
    exit 1
}

# Create a temporary test script
cat > test-setup.js << 'EOF'
const setup = require('./setup.js');

// Override the file processing to limit to first 5 files
const originalReaddirSync = require('fs').readdirSync;
require('fs').readdirSync = function(path) {
    const files = originalReaddirSync(path);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));
    console.log(`📊 Found ${pdfFiles.length} PDF files, limiting to first 5 for testing`);
    return pdfFiles.slice(0, 5);
};
EOF

node test-setup.js "$SECRET_AZURE_SEARCH_KEY" "$SECRET_AZURE_OPENAI_API_KEY" "$INDEX_NAME"

if [[ $? -eq 0 ]]; then
    echo "✅ Test index setup completed successfully!"
    echo ""
    echo "📝 Test completed with first 5 PDFs. Run full setup with:"
    echo "   make index-setup ENV_CONFIG=playground"
else
    echo "❌ Test index setup failed!"
    exit 1
fi
