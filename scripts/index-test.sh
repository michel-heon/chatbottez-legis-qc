#!/bin/bash

# Test script for Azure Search index functionality
# Tests search functionality, document count, and content validation

set -e

# Source configuration
source "$(dirname "$0")/load-env.sh"
source "$(dirname "$0")/.index-config"

# Debug: Check if key variables are loaded
if [ -z "$SECRET_AZURE_SEARCH_KEY" ]; then
    echo "❌ SECRET_AZURE_SEARCH_KEY is not set!"
    echo "Available environment variables starting with AZURE_ or SECRET_:"
    env | grep -E '^(AZURE_|SECRET_)' || echo "   No AZURE_ or SECRET_ variables found"
    exit 1
fi

echo "🧪 Testing Azure Search Index: $INDEX_NAME"
echo "🔗 Endpoint: $AZURE_SEARCH_ENDPOINT"
echo "🔑 Search Key: ${SECRET_AZURE_SEARCH_KEY:0:10}..."
echo ""

# Function to test search functionality
test_search() {
    local query="$1"
    local min_results="$2"
    
    echo "🔍 Testing search query: '$query'"
    
    # Escape quotes in the query for JSON
    local escaped_query=$(echo "$query" | sed 's/"/\\"/g')
    
    local response=$(curl -s \
        -H "Content-Type: application/json" \
        -H "api-key: $SECRET_AZURE_SEARCH_KEY" \
        "$AZURE_SEARCH_ENDPOINT/indexes/$INDEX_NAME/docs/search?api-version=2023-11-01" \
        -d "{\"search\": \"$escaped_query\", \"top\": 10, \"select\": \"docId,docTitle,description\"}")
    
    # Check if the response contains results
    local count=$(echo "$response" | jq -r '.value | length' 2>/dev/null || echo "0")
    
    if [ "$count" -ge "$min_results" ]; then
        echo "   ✅ Found $count results (expected: >=$min_results)"
        
        # Show first result title
        local first_title=$(echo "$response" | jq -r '.value[0].docTitle // .value[0].docId // "No title"' 2>/dev/null)
        echo "   📄 First result: $first_title"
    else
        echo "   ❌ Found only $count results (expected: >=$min_results)"
        echo "   📝 Response: $response"
        return 1
    fi
    
    echo ""
}

# Function to get index statistics
get_index_stats() {
    echo "📊 Index Statistics:"
    
    local stats=$(curl -s \
        -H "api-key: $SECRET_AZURE_SEARCH_KEY" \
        "$AZURE_SEARCH_ENDPOINT/indexes/$INDEX_NAME/stats?api-version=2023-11-01")
    
    local doc_count=$(echo "$stats" | jq -r '.documentCount // "unknown"' 2>/dev/null)
    local storage_size=$(echo "$stats" | jq -r '.storageSize // "unknown"' 2>/dev/null)
    
    echo "   📚 Document Count: $doc_count"
    echo "   💾 Storage Size: $storage_size bytes"
    echo ""
}

# Function to test index health
test_index_health() {
    echo "🏥 Testing Index Health:"
    
    local response=$(curl -s -w "%{http_code}" \
        -H "api-key: $SECRET_AZURE_SEARCH_KEY" \
        "$AZURE_SEARCH_ENDPOINT/indexes/$INDEX_NAME?api-version=2023-11-01")
    
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo "   ✅ Index is accessible"
    else
        echo "   ❌ Index health check failed (HTTP: $http_code)"
        return 1
    fi
    echo ""
}

# Function to sample document content
sample_documents() {
    echo "📋 Document Sample:"
    
    local response=$(curl -s \
        -H "Content-Type: application/json" \
        -H "api-key: $SECRET_AZURE_SEARCH_KEY" \
        "$AZURE_SEARCH_ENDPOINT/indexes/$INDEX_NAME/docs/search?api-version=2023-11-01" \
        -d '{"search": "*", "top": 3, "select": "docId,docTitle"}')
    
    local titles=$(echo "$response" | jq -r '.value[]? | "   • " + (.docTitle // .docId // "Untitled")' 2>/dev/null)
    
    if [ -n "$titles" ]; then
        echo "$titles"
    else
        echo "   ❌ No documents found or unable to parse response"
        echo "   📝 Response: $response"
    fi
    echo ""
}

# Main test execution
main() {
    echo "🧪 Starting Azure Search Index Tests"
    echo "============================================"
    echo ""
    
    # Basic health check
    test_index_health
    
    # Get statistics
    get_index_stats
    
    # Sample documents
    sample_documents
    
    # Test searches based on Quebec legal content
    echo "🔍 Testing Search Functionality:"
    echo "--------------------------------"
    
    # Test general legal terms
    test_search "loi" 1
    test_search "article" 1
    test_search "code" 1
    
    # Test specific Quebec legal terms
    test_search "actions pénales" 1
    test_search "Québec" 1
    
    # Test phrase search (escape quotes properly)
    test_search "\"loi sur les\"" 1
    
    echo "✅ All tests completed successfully!"
}

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is required for JSON parsing but is not installed."
    echo "   Please install jq: sudo apt-get install jq"
    exit 1
fi

# Run main function
main "$@"
