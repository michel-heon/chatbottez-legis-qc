#!/bin/bash

# Script pour vérifier le statut de l'index Azure Search enrichi
echo "🔍 Checking Enhanced Index Status..."
echo "=================================="

# Function to load env file safely
load_env_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "✅ Loading $file..."
        # Use source instead of export with cat to handle quotes properly
        source "$file"
    fi
}

# Load environment files
load_env_file "env/.env.playground"
load_env_file "env/.env.playground.user"

echo "🎯 Target Index: enhanced-legis-qc-parallels"
echo "🔗 Search Endpoint: $AZURE_SEARCH_ENDPOINT"

# Check if we have the required environment variables
if [ -z "$SECRET_AZURE_SEARCH_API_KEY" ]; then
    echo "❌ SECRET_AZURE_SEARCH_API_KEY not found in environment"
    echo "💡 Make sure env/.env.playground.user contains your API keys"
    exit 1
fi

# Build project
echo "🔧 Building project..."
npm run build

# Run index status check
echo "📊 Checking index status and document count..."
node lib/src/indexers/checkIndexStatus.js "$SECRET_AZURE_SEARCH_API_KEY"
