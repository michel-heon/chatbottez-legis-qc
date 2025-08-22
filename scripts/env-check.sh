#!/bin/bash
# Check environment variables for Azure Search setup

set -e

echo "🔍 Checking environment variables..."

# Required environment variables
REQUIRED_VARS=(
    "AZURE_SEARCH_ENDPOINT"
    "AZURE_OPENAI_ENDPOINT" 
    "AZURE_OPENAI_DEPLOYMENT_NAME"
)

# Optional but recommended variables
OPTIONAL_VARS=(
    "AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME"
)

missing_vars=()
empty_vars=()

# Check required variables
for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        if ! grep -q "^${var}=" env/.env.* 2>/dev/null; then
            missing_vars+=("$var")
        else
            # Variable exists but is empty
            if grep "^${var}=$" env/.env.* >/dev/null 2>&1; then
                empty_vars+=("$var")
            fi
        fi
    fi
done

# Check optional variables
for var in "${OPTIONAL_VARS[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        if ! grep -q "^${var}=" env/.env.* 2>/dev/null; then
            echo "⚠️  Warning: Optional variable $var is not set"
        else
            if grep "^${var}=$" env/.env.* >/dev/null 2>&1; then
                echo "⚠️  Warning: Optional variable $var is empty"
            fi
        fi
    fi
done

# Report missing variables
if [[ ${#missing_vars[@]} -gt 0 ]]; then
    echo "❌ Missing required environment variables:"
    printf '   %s\n' "${missing_vars[@]}"
    echo ""
    echo "Please set these variables in your environment files:"
    echo "   env/.env.local.user"
    echo "   env/.env.playground.user"
    exit 1
fi

# Report empty variables
if [[ ${#empty_vars[@]} -gt 0 ]]; then
    echo "⚠️  Empty required environment variables:"
    printf '   %s\n' "${empty_vars[@]}"
    echo ""
    echo "Please provide values for these variables in your environment files."
    exit 1
fi

echo "✅ All required environment variables are set"

# Show current configuration (masked secrets)
echo ""
echo "📋 Current configuration:"
echo "   AZURE_SEARCH_ENDPOINT: ${AZURE_SEARCH_ENDPOINT:-'(not set)'}"
echo "   AZURE_OPENAI_ENDPOINT: ${AZURE_OPENAI_ENDPOINT:-'(not set)'}"
echo "   AZURE_OPENAI_DEPLOYMENT_NAME: ${AZURE_OPENAI_DEPLOYMENT_NAME:-'(not set)'}"
echo "   AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME: ${AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME:-'(not set)'}"
