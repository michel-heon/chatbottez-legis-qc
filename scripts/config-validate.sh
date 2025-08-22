#!/bin/bash
# Validate Azure Search configuration

set -e

echo "🔧 Validating Azure Search configuration..."

# Check if required tools are available
command -v curl >/dev/null 2>&1 || {
    echo "❌ curl is required but not installed."
    exit 1
}

command -v jq >/dev/null 2>&1 || {
    echo "⚠️  jq is not installed. JSON output will not be formatted."
    JQ_AVAILABLE=false
}

# Load environment variables
if [[ -f "env/.env.playground.user" ]]; then
    export $(grep -v '^#' env/.env.playground.user | xargs)
elif [[ -f "env/.env.local.user" ]]; then
    export $(grep -v '^#' env/.env.local.user | xargs)
fi

# Check Azure Search endpoint
if [[ -z "$AZURE_SEARCH_ENDPOINT" ]]; then
    echo "❌ AZURE_SEARCH_ENDPOINT is not set"
    exit 1
fi

echo "🌐 Testing Azure Search endpoint connectivity..."
SEARCH_URL="${AZURE_SEARCH_ENDPOINT}/indexes?api-version=2023-11-01"

# Test connectivity (without authentication)
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SEARCH_URL" || echo "000")

case $HTTP_STATUS in
    401)
        echo "✅ Azure Search endpoint is reachable (authentication required)"
        ;;
    200|403)
        echo "✅ Azure Search endpoint is reachable"
        ;;
    000)
        echo "❌ Cannot reach Azure Search endpoint"
        echo "   Check your AZURE_SEARCH_ENDPOINT: $AZURE_SEARCH_ENDPOINT"
        exit 1
        ;;
    *)
        echo "⚠️  Unexpected response from Azure Search endpoint (HTTP $HTTP_STATUS)"
        ;;
esac

# Check Azure OpenAI endpoint
if [[ -z "$AZURE_OPENAI_ENDPOINT" ]]; then
    echo "❌ AZURE_OPENAI_ENDPOINT is not set"
    exit 1
fi

echo "🧠 Testing Azure OpenAI endpoint connectivity..."
OPENAI_URL="${AZURE_OPENAI_ENDPOINT}/openai/deployments?api-version=2023-05-15"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$OPENAI_URL" || echo "000")

case $HTTP_STATUS in
    401)
        echo "✅ Azure OpenAI endpoint is reachable (authentication required)"
        ;;
    200|403)
        echo "✅ Azure OpenAI endpoint is reachable"
        ;;
    000)
        echo "❌ Cannot reach Azure OpenAI endpoint"
        echo "   Check your AZURE_OPENAI_ENDPOINT: $AZURE_OPENAI_ENDPOINT"
        exit 1
        ;;
    *)
        echo "⚠️  Unexpected response from Azure OpenAI endpoint (HTTP $HTTP_STATUS)"
        ;;
esac

# Validate deployment names
if [[ -z "$AZURE_OPENAI_DEPLOYMENT_NAME" ]]; then
    echo "⚠️  AZURE_OPENAI_DEPLOYMENT_NAME is not set"
fi

if [[ -z "$AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME" ]]; then
    echo "⚠️  AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME is not set"
    echo "   This is required for vector search functionality"
fi

# Check data directory
DATA_DIR="src/indexers/data"
if [[ ! -d "$DATA_DIR" ]]; then
    echo "❌ Data directory not found: $DATA_DIR"
    exit 1
fi

DOC_COUNT=$(find "$DATA_DIR" -name "*.md" | wc -l)
echo "📁 Found $DOC_COUNT documents in $DATA_DIR"

if [[ $DOC_COUNT -eq 0 ]]; then
    echo "⚠️  No documents found to index"
else
    echo "📄 Documents to be indexed:"
    find "$DATA_DIR" -name "*.md" -exec basename {} \; | sed 's/^/   /'
fi

echo ""
echo "✅ Configuration validation completed"
