#!/bin/bash
# Assign or update index name configuration

set -e

INDEX_NAME="$1"
ENVIRONMENT="${2:-local}"

if [[ -z "$INDEX_NAME" ]]; then
    echo "❌ Usage: $0 <index_name> [environment]"
    echo "Examples:"
    echo "  $0 legis-qc-documents local"
    echo "  $0 legis-qc-prod playground"
    echo "  $0 my-custom-index"
    exit 1
fi

echo "🏷️  Assigning index name: $INDEX_NAME"
echo "🌍 Environment: $ENVIRONMENT"

# Validate index name format
if [[ ! "$INDEX_NAME" =~ ^[a-z0-9][a-z0-9-]*[a-z0-9]$ ]]; then
    echo "❌ Invalid index name format!"
    echo "Index name must:"
    echo "  - Start and end with alphanumeric characters"
    echo "  - Contain only lowercase letters, numbers, and hyphens"
    echo "  - Be between 2-128 characters"
    exit 1
fi

# Create environment file if it doesn't exist
ENV_FILE="env/.env.${ENVIRONMENT}.user"
mkdir -p env

# Function to update or add environment variable
update_env_var() {
    local var_name="$1"
    local var_value="$2"
    local env_file="$3"
    
    if [[ -f "$env_file" ]]; then
        # Update existing variable or add if not present
        if grep -q "^${var_name}=" "$env_file"; then
            # Update existing variable (using sed for cross-platform compatibility)
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS sed syntax
                sed -i '' "s/^${var_name}=.*/${var_name}=${var_value}/" "$env_file"
            else
                # Linux sed syntax
                sed -i "s/^${var_name}=.*/${var_name}=${var_value}/" "$env_file"
            fi
            echo "✅ Updated ${var_name} in $env_file"
        else
            # Add new variable
            echo "${var_name}=${var_value}" >> "$env_file"
            echo "✅ Added ${var_name} to $env_file"
        fi
    else
        # Create new file with the variable
        echo "# Azure AI Search Index Configuration" > "$env_file"
        echo "# Generated on $(date)" >> "$env_file"
        echo "${var_name}=${var_value}" >> "$env_file"
        echo "✅ Created $env_file with ${var_name}"
    fi
}

# Update the index name in environment file
update_env_var "AZURE_SEARCH_INDEX_NAME" "$INDEX_NAME" "$ENV_FILE"

# Update package.json if it exists (for npm scripts)
if [[ -f "package.json" ]]; then
    echo "📦 Updating package.json config..."
    
    # Check if jq is available for JSON manipulation
    if command -v jq &> /dev/null; then
        # Use jq to safely update JSON
        tmp_file=$(mktemp)
        jq --arg index_name "$INDEX_NAME" '.config.azure_search_index_name = $index_name' package.json > "$tmp_file" && mv "$tmp_file" package.json
        echo "✅ Updated package.json with index name"
    else
        echo "⚠️  jq not found - skipping package.json update"
        echo "   Install jq for automatic package.json updates: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    fi
fi

# Create a local configuration file for scripts
CONFIG_FILE="scripts/.index-config"
echo "INDEX_NAME=$INDEX_NAME" > "$CONFIG_FILE"
echo "ENVIRONMENT=$ENVIRONMENT" >> "$CONFIG_FILE"
echo "UPDATED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$CONFIG_FILE"
echo "✅ Created script configuration: $CONFIG_FILE"

# Display current configuration
echo ""
echo "📊 Current Index Configuration:"
echo "  Index Name: $INDEX_NAME"
echo "  Environment: $ENVIRONMENT"
echo "  Config File: $ENV_FILE"
echo "  Script Config: $CONFIG_FILE"
echo ""

# Show next steps
echo "🚀 Next Steps:"
echo "  1. Verify your environment file: cat $ENV_FILE"
echo "  2. Setup index with new name: make index-setup SECRET_AZURE_SEARCH_KEY=your_key SECRET_AZURE_OPENAI_API_KEY=your_key"
echo "  3. Or use environment setup: make ${ENVIRONMENT}-setup"
echo ""

# Optional: Show current environment variables
if [[ -f "$ENV_FILE" ]]; then
    echo "📋 Current environment variables in $ENV_FILE:"
    grep -E "^[A-Z_]+" "$ENV_FILE" | head -10
    if [[ $(wc -l < "$ENV_FILE") -gt 10 ]]; then
        echo "   ... (showing first 10 variables)"
    fi
fi

echo "✨ Index name assignment completed successfully!"
