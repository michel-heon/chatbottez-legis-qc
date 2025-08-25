#!/bin/bash

# Index Status Check - nomenclature: index-status.sh
echo "🔍 Azure Search Index Status Check"
echo "=================================="

# Function to load env file safely
load_env_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "✅ Loading $file..."
        source "$file"
    fi
}

# Load environment files
load_env_file "env/.env.playground"
load_env_file "env/.env.playground.user"

# Check required variables
if [ -z "$SECRET_AZURE_SEARCH_KEY" ]; then
    echo "❌ SECRET_AZURE_SEARCH_KEY not found"
    exit 1
fi

if [ -z "$AZURE_SEARCH_ENDPOINT" ]; then
    echo "❌ AZURE_SEARCH_ENDPOINT not found"
    exit 1
fi

# API configuration
API_VERSION="2024-07-01"
ENHANCED_INDEX="enhanced-legis-qc-parallels"
BASIC_INDEX="legis-qc-lois-dev-02"

echo "🔗 Search Endpoint: $AZURE_SEARCH_ENDPOINT"
echo ""

# Function to check index status
check_index() {
    local index_name="$1"
    local index_type="$2"
    
    echo "📊 Checking Index: $index_name ($index_type)"
    echo "----------------------------------------"
    
    # Check if index exists
    local index_url="${AZURE_SEARCH_ENDPOINT}/indexes/${index_name}?api-version=${API_VERSION}"
    
    local response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -H "api-key: $SECRET_AZURE_SEARCH_KEY" \
        -H "Content-Type: application/json" \
        "$index_url")
    
    local http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    local body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')
    
    case $http_code in
        200)
            echo "   ✅ Index exists"
            
            # Get document count
            local count_url="${AZURE_SEARCH_ENDPOINT}/indexes/${index_name}/docs/\$count?api-version=${API_VERSION}"
            local doc_count=$(curl -s \
                -H "api-key: $SECRET_AZURE_SEARCH_KEY" \
                "$count_url")
            
            if [[ "$doc_count" =~ ^[0-9]+$ ]]; then
                echo "   📄 Documents: $doc_count"
            else
                echo "   ⚠️  Document count: unknown"
            fi
            
            # Parse field information from index definition
            if command -v jq >/dev/null 2>&1; then
                local field_count=$(echo "$body" | jq '.fields | length')
                echo "   📋 Fields: $field_count"
                
                # Check for TTL-specific fields
                local has_legal_id=$(echo "$body" | jq '.fields[] | select(.name=="legalIdentifier") | .name' 2>/dev/null)
                local has_doc_type=$(echo "$body" | jq '.fields[] | select(.name=="documentType") | .name' 2>/dev/null)
                local has_legal_status=$(echo "$body" | jq '.fields[] | select(.name=="legalStatus") | .name' 2>/dev/null)
                
                if [ -n "$has_legal_id" ] && [ -n "$has_doc_type" ] && [ -n "$has_legal_status" ]; then
                    echo "   🚀 Type: ENHANCED (TTL metadata fields present)"
                else
                    echo "   📝 Type: BASIC (standard fields only)"
                fi
            fi
            ;;
        404)
            echo "   ❌ Index does not exist"
            ;;
        401)
            echo "   ❌ Authentication failed"
            ;;
        *)
            echo "   ❌ Error: HTTP $http_code"
            ;;
    esac
    
    echo ""
}

# Check both indexes
check_index "$ENHANCED_INDEX" "Enhanced"
check_index "$BASIC_INDEX" "Basic"

echo "🎉 Index status check completed!"
