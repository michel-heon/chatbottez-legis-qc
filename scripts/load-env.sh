#!/bin/bash

# Load environment variables from appropriate .env file
# This script determines which environment to load based on context

# Function to load environment from a specific file
load_env_file() {
    local env_file="$1"
    local env_name="$2"
    
    if [ -f "$env_file" ]; then
        echo "📋 Loading environment from $env_file"
        
        # Use source/export approach instead of manual parsing
        set -a  # automatically export all variables
        source "$env_file"
        set +a  # stop auto-exporting
        
        echo "   ✅ Loaded $env_name environment"
        return 0
    else
        echo "   ❌ Environment file not found: $env_file"
        return 1
    fi
}

# Determine which environment to load
# Priority: ENVIRONMENT variable > playground > local

SCRIPT_DIR="$(dirname "$(realpath "$0")")"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔍 Checking environment variables..."

# Check if ENVIRONMENT is set
if [ -n "$ENVIRONMENT" ]; then
    echo "📋 Using explicit environment: $ENVIRONMENT"
    ENV_FILE="$PROJECT_ROOT/env/.env.$ENVIRONMENT.user"
    load_env_file "$ENV_FILE" "$ENVIRONMENT"
elif [ -f "$PROJECT_ROOT/env/.env.playground.user" ]; then
    echo "📋 Using playground environment (default)"
    ENV_FILE="$PROJECT_ROOT/env/.env.playground.user"
    load_env_file "$ENV_FILE" "playground"
elif [ -f "$PROJECT_ROOT/env/.env.local.user" ]; then
    echo "📋 Using local environment (fallback)"
    ENV_FILE="$PROJECT_ROOT/env/.env.local.user"
    load_env_file "$ENV_FILE" "local"
else
    echo "❌ No environment files found!"
    echo "   Expected: $PROJECT_ROOT/env/.env.playground.user or $PROJECT_ROOT/env/.env.local.user"
    exit 1
fi

echo "   ✅ All required environment variables are set"
echo ""
