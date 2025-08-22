#!/bin/bash
# Microsoft 365 Agents Playground Environment Validation Script
# This script validates the playground environment configuration

set -e

echo "🔍 Validating Preview Playground Environment"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

validation_failed=false

# Check if env/.env.playground.user exists
if [ ! -f "env/.env.playground.user" ]; then
    echo -e "${RED}❌ env/.env.playground.user not found${NC}"
    echo "   Run: make playground-env-setup"
    validation_failed=true
else
    echo -e "${GREEN}✅ env/.env.playground.user found${NC}"
fi

# Check if .localConfigs.playground exists
if [ ! -f ".localConfigs.playground" ]; then
    echo -e "${RED}❌ .localConfigs.playground not found${NC}"
    echo "   Run: make playground-env-setup"
    validation_failed=true
else
    echo -e "${GREEN}✅ .localConfigs.playground found${NC}"
fi

# Load environment variables if file exists
if [ -f "env/.env.playground.user" ]; then
    # Source the environment file
    set -a  # Automatically export all variables
    source env/.env.playground.user
    set +a  # Stop auto-exporting

    echo ""
    echo "🔧 Environment Variables Check:"
    echo "==============================="

    # Check required Azure OpenAI variables
    required_vars=(
        "SECRET_AZURE_OPENAI_API_KEY"
        "AZURE_OPENAI_ENDPOINT"
        "AZURE_OPENAI_DEPLOYMENT_NAME"
        "AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME"
        "SECRET_AZURE_SEARCH_KEY"
        "AZURE_SEARCH_ENDPOINT"
        "AZURE_SEARCH_INDEX_NAME"
        "TEAMSFX_NOTIFICATION_STORE_FILENAME"
        "TEAMSAPPTESTER_PORT"
        "TEAMSFX_ENV"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ] || [ "${!var}" = "your_azure_openai_api_key_here" ] || [ "${!var}" = "your_azure_search_key_here" ] || [[ "${!var}" == *"your-resource"* ]] || [[ "${!var}" == *"your-search-service"* ]]; then
            echo -e "${RED}❌ $var: Not configured or contains placeholder${NC}"
            validation_failed=true
        else
            # Mask sensitive keys for display
            if [[ "$var" == *"KEY"* ]] || [[ "$var" == *"SECRET"* ]]; then
                masked_value="${!var:0:8}..."
                echo -e "${GREEN}✅ $var: $masked_value${NC}"
            else
                echo -e "${GREEN}✅ $var: ${!var}${NC}"
            fi
        fi
    done

    # Additional validation checks
    echo ""
    echo "🌐 Endpoint Validation:"
    echo "======================"

    # Validate Azure OpenAI endpoint format
    if [[ "$AZURE_OPENAI_ENDPOINT" =~ ^https://.*\.openai\.azure\.com/?$ ]]; then
        echo -e "${GREEN}✅ Azure OpenAI endpoint format is valid${NC}"
    else
        echo -e "${RED}❌ Azure OpenAI endpoint format is invalid${NC}"
        echo "   Expected format: https://your-resource.openai.azure.com/"
        validation_failed=true
    fi

    # Validate Azure Search endpoint format
    if [[ "$AZURE_SEARCH_ENDPOINT" =~ ^https://.*\.search\.windows\.net/?$ ]]; then
        echo -e "${GREEN}✅ Azure Search endpoint format is valid${NC}"
    else
        echo -e "${RED}❌ Azure Search endpoint format is invalid${NC}"
        echo "   Expected format: https://your-search-service.search.windows.net"
        validation_failed=true
    fi

    # Validate port number
    if [[ "$TEAMSAPPTESTER_PORT" =~ ^[0-9]+$ ]] && [ "$TEAMSAPPTESTER_PORT" -ge 1024 ] && [ "$TEAMSAPPTESTER_PORT" -le 65535 ]; then
        echo -e "${GREEN}✅ Teams App Tester port is valid: $TEAMSAPPTESTER_PORT${NC}"
    else
        echo -e "${RED}❌ Teams App Tester port is invalid: $TEAMSAPPTESTER_PORT${NC}"
        echo "   Expected: Number between 1024-65535"
        validation_failed=true
    fi

    # Check if port is available
    if command -v netstat >/dev/null 2>&1; then
        if netstat -ln 2>/dev/null | grep -q ":$TEAMSAPPTESTER_PORT "; then
            echo -e "${YELLOW}⚠️  Port $TEAMSAPPTESTER_PORT appears to be in use${NC}"
        else
            echo -e "${GREEN}✅ Port $TEAMSAPPTESTER_PORT is available${NC}"
        fi
    fi
fi

echo ""
echo "📊 Validation Summary:"
echo "====================="

if [ "$validation_failed" = true ]; then
    echo -e "${RED}❌ Environment validation FAILED${NC}"
    echo ""
    echo "🔧 To fix issues:"
    echo "1. Run: make playground-env-setup"
    echo "2. Edit env/.env.playground.user with your actual Azure credentials"
    echo "3. Run: make playground-env-validate"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Environment validation PASSED${NC}"
    echo ""
    echo "🚀 Ready to start Preview Playground:"
    echo "1. npm run dev:teamsfx:testtool"
    echo "2. npm run dev:teamsfx:launch-testtool"
    echo ""
    echo "📋 Available VS Code tasks:"
    echo "- Start application (Microsoft 365 Agents Playground)"
    echo "- Start Microsoft 365 Agents Playground"
fi
