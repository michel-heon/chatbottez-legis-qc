#!/bin/bash
# List current index configurations

set -e

echo "📋 Current Index Configurations"
echo "================================"
echo ""

# Check script configuration
if [[ -f "scripts/.index-config" ]]; then
    echo "🔧 Script Configuration (scripts/.index-config):"
    cat scripts/.index-config | sed 's/^/   /'
    echo ""
else
    echo "⚠️  No script configuration found"
    echo ""
fi

# Check environment files
echo "🌍 Environment Configurations:"
for env_file in env/.env.*.user; do
    if [[ -f "$env_file" ]]; then
        env_name=$(basename "$env_file" | sed 's/.env.//;s/.user//')
        echo "   📁 $env_name environment ($env_file):"
        
        # Show index name if set
        if grep -q "AZURE_SEARCH_INDEX_NAME=" "$env_file"; then
            index_name=$(grep "AZURE_SEARCH_INDEX_NAME=" "$env_file" | cut -d'=' -f2)
            echo "      Index Name: $index_name"
        else
            echo "      Index Name: (not set - will use default 'my-documents')"
        fi
        
        # Show search endpoint if set
        if grep -q "AZURE_SEARCH_ENDPOINT=" "$env_file"; then
            endpoint=$(grep "AZURE_SEARCH_ENDPOINT=" "$env_file" | cut -d'=' -f2)
            echo "      Search Endpoint: $endpoint"
        else
            echo "      Search Endpoint: (not configured)"
        fi
        
        echo ""
    fi
done

# Check if no environment files exist
if ! ls env/.env.*.user 1> /dev/null 2>&1; then
    echo "   ⚠️  No environment files found"
    echo "   Create one with: make index-name-set INDEX_NAME=your-index ENVIRONMENT=local"
    echo ""
fi

# Show package.json config if available
if [[ -f "package.json" ]] && command -v jq &> /dev/null; then
    echo "📦 Package.json Configuration:"
    if jq -e '.config.azure_search_index_name' package.json &> /dev/null; then
        index_name=$(jq -r '.config.azure_search_index_name' package.json)
        echo "   Index Name: $index_name"
    else
        echo "   Index Name: (not configured in package.json)"
    fi
    echo ""
fi

# Show current effective configuration
echo "⚡ Effective Configuration (priority order):"
echo "   1. Environment variable AZURE_SEARCH_INDEX_NAME"
echo "   2. Script configuration file (scripts/.index-config)"
echo "   3. Default value (my-documents)"
echo ""

# Determine current effective index name
effective_index="my-documents"
source_description="default value"

if [[ -f "scripts/.index-config" ]]; then
    source scripts/.index-config
    if [[ -n "$INDEX_NAME" ]]; then
        effective_index="$INDEX_NAME"
        source_description="script configuration"
    fi
fi

if [[ -n "$AZURE_SEARCH_INDEX_NAME" ]]; then
    effective_index="$AZURE_SEARCH_INDEX_NAME"
    source_description="environment variable"
fi

echo "🎯 Current Effective Index Name: $effective_index"
echo "   Source: $source_description"
echo ""

# Show next steps
echo "🚀 Quick Actions:"
echo "   Set index name: make index-name-set INDEX_NAME=new-name ENVIRONMENT=local"
echo "   Check index status: make index-status AZURE_SEARCH_KEY=your_key"
echo "   Create index: make index-setup AZURE_SEARCH_KEY=key AZURE_OPENAI_KEY=key"
