#!/bin/bash
# Check Azure Search index status

set -e

SECRET_AZURE_SEARCH_KEY="$1"

if [[ -z "$SECRET_AZURE_SEARCH_KEY" ]]; then
    echo "❌ Usage: $0 <secret_azure_search_key>"
    exit 1
fi

echo "📊 Checking Azure Search index status..."

# Load environment variables
if [[ -f "env/.env.playground.user" ]]; then
    export $(grep -v '^#' env/.env.playground.user | xargs)
elif [[ -f "env/.env.local.user" ]]; then
    export $(grep -v '^#' env/.env.local.user | xargs)
fi

if [[ -z "$AZURE_SEARCH_ENDPOINT" ]]; then
    echo "❌ AZURE_SEARCH_ENDPOINT is not set"
    exit 1
fi

INDEX_NAME="my-documents"
API_VERSION="2023-11-01"

# Check if index exists
echo "🔍 Checking if index '$INDEX_NAME' exists..."
INDEX_URL="${AZURE_SEARCH_ENDPOINT}/indexes/${INDEX_NAME}?api-version=${API_VERSION}"

response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -H "api-key: $SECRET_AZURE_SEARCH_KEY" \
    -H "Content-Type: application/json" \
    "$INDEX_URL")

http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')

case $http_code in
    200)
        echo "✅ Index '$INDEX_NAME' exists"
        
        # Get document count
        echo "📄 Getting document count..."
        COUNT_URL="${AZURE_SEARCH_ENDPOINT}/indexes/${INDEX_NAME}/docs/\$count?api-version=${API_VERSION}"
        
        doc_count=$(curl -s \
            -H "api-key: $SECRET_AZURE_SEARCH_KEY" \
            "$COUNT_URL")
        
        if [[ "$doc_count" =~ ^[0-9]+$ ]]; then
            echo "   Documents in index: $doc_count"
        else
            echo "   ⚠️  Could not retrieve document count"
        fi
        
        # Get index statistics
        echo "📈 Getting index statistics..."
        STATS_URL="${AZURE_SEARCH_ENDPOINT}/indexes/${INDEX_NAME}/stats?api-version=${API_VERSION}"
        
        stats=$(curl -s \
            -H "api-key: $SECRET_AZURE_SEARCH_KEY" \
            "$STATS_URL")
        
        if command -v jq >/dev/null 2>&1; then
            echo "   Storage size: $(echo "$stats" | jq -r '.storageSize // "unknown"') bytes"
            echo "   Document count: $(echo "$stats" | jq -r '.documentCount // "unknown"')"
        else
            echo "   Raw stats: $stats"
        fi
        ;;
    404)
        echo "❌ Index '$INDEX_NAME' does not exist"
        echo ""
        echo "💡 To create the index, run:"
        echo "   make setup-index SECRET_AZURE_SEARCH_KEY=your_key SECRET_AZURE_OPENAI_API_KEY=your_key"
        exit 1
        ;;
    401)
        echo "❌ Authentication failed - check your Azure Search key"
        exit 1
        ;;
    *)
        echo "❌ Unexpected response (HTTP $http_code)"
        echo "Response: $body"
        exit 1
        ;;
esac

echo ""
echo "✅ Index status check completed"
