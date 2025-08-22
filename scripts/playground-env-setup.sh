#!/bin/bash
# Microsoft 365 Agents Playground Environment Setup Script
# This script creates the necessary environment files for Preview Playground

set -e

echo "🚀 Setting up Preview Playground environment..."
echo "=============================================="

# Create .env.playground.user template if not exists
if [ ! -f "env/.env.playground.user" ]; then
    echo "Creating env/.env.playground.user template..."
    mkdir -p env
    cat > env/.env.playground.user << 'EOF'
# Microsoft 365 Agents Playground Environment Configuration
# This file contains sensitive keys and is gitignored for security

# Azure OpenAI Configuration
SECRET_AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002

# Azure AI Search Configuration
SECRET_AZURE_SEARCH_KEY=your_azure_search_key_here
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_SEARCH_INDEX_NAME=index-data-sample

# Preview Playground Configuration
TEAMSFX_NOTIFICATION_STORE_FILENAME=.notification.playgroundstore.json
TEAMSAPPTESTER_PORT=56150

# Environment Identifier
TEAMSFX_ENV=playground
EOF
    echo "✅ Created env/.env.playground.user template"
else
    echo "ℹ️  env/.env.playground.user already exists"
fi

# Create .localConfigs.playground file
echo "Creating .localConfigs.playground runtime configuration..."
if [ -f "env/.env.playground.user" ]; then
    # Source the environment file to get the actual values
    set -a  # Automatically export all variables
    source env/.env.playground.user
    set +a  # Stop auto-exporting
    
    cat > .localConfigs.playground << EOF
# Generated runtime configuration for Microsoft 365 Agents Playground
# This file is created automatically by 'make playground-env-setup'
# Do not edit manually - edit env/.env.playground.user instead

SECRET_AZURE_OPENAI_API_KEY=${SECRET_AZURE_OPENAI_API_KEY}
AZURE_OPENAI_ENDPOINT=${AZURE_OPENAI_ENDPOINT}
AZURE_OPENAI_DEPLOYMENT_NAME=${AZURE_OPENAI_DEPLOYMENT_NAME}
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=${AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME}
SECRET_AZURE_SEARCH_KEY=${SECRET_AZURE_SEARCH_KEY}
AZURE_SEARCH_ENDPOINT=${AZURE_SEARCH_ENDPOINT}
AZURE_SEARCH_INDEX_NAME=${AZURE_SEARCH_INDEX_NAME}
TEAMSFX_NOTIFICATION_STORE_FILENAME=${TEAMSFX_NOTIFICATION_STORE_FILENAME}
TEAMSAPPTESTER_PORT=${TEAMSAPPTESTER_PORT}
TEAMSFX_ENV=${TEAMSFX_ENV}
EOF
    echo "✅ Created .localConfigs.playground runtime configuration"
fi

# Instructions for user
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Edit env/.env.playground.user and replace placeholder values:"
echo "   - SECRET_AZURE_OPENAI_API_KEY=your_actual_api_key"
echo "   - AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/"
echo "   - SECRET_AZURE_SEARCH_KEY=your_actual_search_key"
echo "   - AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net"
echo ""
echo "2. Validate configuration:"
echo "   make playground-env-validate"
echo ""
echo "3. Start Preview Playground with:"
echo "   npm run dev:teamsfx:testtool"
echo "   npm run dev:teamsfx:launch-testtool"
echo ""
echo "4. Or use the VS Code tasks:"
echo "   - 'Start application (Microsoft 365 Agents Playground)'"
echo "   - 'Start Microsoft 365 Agents Playground'"
echo ""
echo "🔒 Security Note: env/.env.playground.user is gitignored for security"
