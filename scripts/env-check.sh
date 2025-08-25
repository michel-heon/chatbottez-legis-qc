#!/bin/bash
# Check environment variables for Azure Search setup

set -e

echo "🔍 Checking environment variables..."

# Function to safely load environment variables from file
load_env_file() {
    local env_file="$1"
    if [[ -f "$env_file" ]]; then
        echo "📋 Loading environment from $env_file"
        # Export variables from file (ignore comments and empty lines)
        set -a  # Automatically export all variables
        source <(grep -v '^#' "$env_file" | grep -v '^$' | sed 's/^/export /')
        set +a  # Stop auto-export
        return 0
    fi
    return 1
}

# Load environment variables based on ENV_CONFIG or available files
if [ -n "$ENV_CONFIG" ]; then
    # If ENV_CONFIG is specified, load that specific environment
    case "$ENV_CONFIG" in
        "playground")
            if load_env_file "env/.env.playground.user"; then
                echo "   ✅ Loaded playground environment (specified by ENV_CONFIG)"
            else
                echo "❌ ENV_CONFIG=playground specified but env/.env.playground.user not found"
                exit 1
            fi
            ;;
        "local")
            if load_env_file "env/.env.local.user"; then
                echo "   ✅ Loaded local environment (specified by ENV_CONFIG)"
            else
                echo "❌ ENV_CONFIG=local specified but env/.env.local.user not found"
                exit 1
            fi
            ;;
        "dev")
            if load_env_file "env/.env.dev.user"; then
                echo "   ✅ Loaded dev environment (specified by ENV_CONFIG)"
            else
                echo "❌ ENV_CONFIG=dev specified but env/.env.dev.user not found"
                exit 1
            fi
            ;;
        *)
            echo "❌ Invalid ENV_CONFIG value: $ENV_CONFIG. Valid values: playground, local, dev"
            exit 1
            ;;
    esac
else
    # Auto-detect environment (prioritize local)
    if load_env_file "env/.env.local.user"; then
        echo "   ✅ Loaded local environment"
    elif load_env_file "env/.env.playground.user"; then
        echo "   ✅ Loaded playground environment"
    elif load_env_file "env/.env.dev.user"; then
        echo "   ✅ Loaded dev environment"
    else
        echo "⚠️  No environment files found, using system environment"
    fi
fi

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
    value="${!var:-}"
    if [[ -z "$value" ]]; then
        missing_vars+=("$var")
    elif [[ "$value" == "" ]]; then
        empty_vars+=("$var")
    fi
done

# Check optional variables
for var in "${OPTIONAL_VARS[@]}"; do
    value="${!var:-}"
    if [[ -z "$value" ]]; then
        echo "⚠️  Warning: Optional variable $var is not set"
    elif [[ "$value" == "" ]]; then
        echo "⚠️  Warning: Optional variable $var is empty"
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
