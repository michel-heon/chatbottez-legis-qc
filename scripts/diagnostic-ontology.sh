#!/bin/bash

# 🔍 DIAGNOSTIC ONTOLOGY-DRIVEN SYSTEM
# =====================================
# Script de diagnostic automatique pour l'architecture ontology-driven
# Microsoft 365 Agents Toolkit

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
print_header() {
    echo -e "${BLUE}🔍 $1${NC}"
    echo "===================================="
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="diagnostic-$(date +%Y%m%d-%H%M%S).log"

cd "$PROJECT_ROOT"

exec > >(tee -a "$LOG_FILE")
exec 2>&1

print_header "DIAGNOSTIC ONTOLOGY-DRIVEN SYSTEM"

# 1. Environment Configuration
print_header "1. Environment Configuration"

print_info "Current working directory: $(pwd)"
print_info "ENV_CONFIG: ${ENV_CONFIG:-playground (default)}"
print_info "Log file: $LOG_FILE"

# Check environment files
echo ""
print_info "Environment files:"
if ls env/.env.*.user 2>/dev/null; then
    print_success "Environment files found"
    ls -la env/.env.*.user | head -3
else
    print_error "No environment files found in env/"
fi

# Check current environment variables
echo ""
print_info "Key environment variables:"
ENV_COUNT=$(env | grep -E "(SECRET_|AZURE_)" | wc -l)
if [ "$ENV_COUNT" -gt 0 ]; then
    print_success "$ENV_COUNT Azure/Secret variables loaded"
    env | grep -E "(AZURE_SEARCH_ENDPOINT|AZURE_OPENAI_ENDPOINT)" | sed 's/=.*/=***/'
else
    print_warning "No Azure environment variables found"
fi

# 2. TTL Data Source
print_header "2. TTL Data Source"

if [ -n "$EXTERNAL_DATA_SOURCE_PATH" ] && [ -n "$TTL_METADATA_FILE" ]; then
    TTL_FULL_PATH="$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE"
    print_info "TTL Path: $TTL_FULL_PATH"
    
    if [ -f "$TTL_FULL_PATH" ]; then
        TTL_SIZE=$(wc -l < "$TTL_FULL_PATH" 2>/dev/null || echo "0")
        print_success "TTL file found with $TTL_SIZE lines"
        print_info "First few lines:"
        head -3 "$TTL_FULL_PATH" | sed 's/^/  /'
    else
        print_error "TTL file not found: $TTL_FULL_PATH"
    fi
else
    print_warning "TTL configuration not set (EXTERNAL_DATA_SOURCE_PATH or TTL_METADATA_FILE)"
fi

# 3. Azure Connectivity
print_header "3. Azure Connectivity"

if [ -n "$AZURE_SEARCH_ENDPOINT" ] && [ -n "$SECRET_AZURE_SEARCH_KEY" ]; then
    print_info "Testing Azure Search connectivity..."
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        "$AZURE_SEARCH_ENDPOINT/indexes?api-version=2024-07-01" \
        -H "api-key: $SECRET_AZURE_SEARCH_KEY" 2>/dev/null || echo "000")
    
    if [ "$RESPONSE" = "200" ]; then
        print_success "Azure Search connection successful"
        
        # Get index count
        INDEX_COUNT=$(curl -s "$AZURE_SEARCH_ENDPOINT/indexes?api-version=2024-07-01" \
            -H "api-key: $SECRET_AZURE_SEARCH_KEY" 2>/dev/null | \
            jq '.value | length' 2>/dev/null || echo "unknown")
        print_info "Available indexes: $INDEX_COUNT"
    else
        print_error "Azure Search connection failed (HTTP: $RESPONSE)"
    fi
else
    print_warning "Azure Search configuration incomplete"
fi

if [ -n "$AZURE_OPENAI_ENDPOINT" ] && [ -n "$SECRET_AZURE_OPENAI_API_KEY" ]; then
    print_info "Testing Azure OpenAI connectivity..."
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        "$AZURE_OPENAI_ENDPOINT/openai/deployments?api-version=2024-02-01" \
        -H "api-key: $SECRET_AZURE_OPENAI_API_KEY" 2>/dev/null || echo "000")
    
    if [ "$RESPONSE" = "200" ]; then
        print_success "Azure OpenAI connection successful"
    else
        print_error "Azure OpenAI connection failed (HTTP: $RESPONSE)"
    fi
else
    print_warning "Azure OpenAI configuration incomplete"
fi

# 4. Project Files
print_header "4. Project Files"

# Schema files
print_info "Generated schema files:"
if ls schema-*.json 2>/dev/null; then
    for schema in schema-*.json; do
        FIELD_COUNT=$(jq '.fields | length' "$schema" 2>/dev/null || echo "invalid")
        print_success "$schema - $FIELD_COUNT fields"
    done
else
    print_warning "No schema files found"
fi

# TypeScript compilation
print_info "TypeScript compilation:"
if npx tsc --noEmit 2>/dev/null; then
    print_success "TypeScript compilation successful"
else
    print_warning "TypeScript compilation issues detected"
fi

# Node modules
print_info "Dependencies:"
if [ -d "node_modules" ]; then
    print_success "node_modules directory exists"
    
    # Check key packages
    if [ -d "node_modules/@azure/search-documents" ]; then
        SEARCH_VERSION=$(cat node_modules/@azure/search-documents/package.json | jq -r '.version' 2>/dev/null || echo "unknown")
        print_info "Azure Search SDK: v$SEARCH_VERSION"
    fi
    
    if [ -d "node_modules/@microsoft/teams-ai" ]; then
        AI_VERSION=$(cat node_modules/@microsoft/teams-ai/package.json | jq -r '.version' 2>/dev/null || echo "unknown")
        print_info "Teams AI SDK: v$AI_VERSION"
    fi
else
    print_error "node_modules not found - run 'npm install'"
fi

# 5. Makefile Rules
print_header "5. Makefile Rules"

print_info "Testing Makefile rules:"

# Test EFFECTIVE_ENV pattern
if make -n index-name-set 2>/dev/null | grep -q "EFFECTIVE_ENV"; then
    print_success "EFFECTIVE_ENV pattern working"
else
    print_warning "EFFECTIVE_ENV pattern may have issues"
fi

# Test key rules existence
KEY_RULES=("index-create" "index-status" "index-delete" "env-check" "config-validate")
for rule in "${KEY_RULES[@]}"; do
    if make -n "$rule" >/dev/null 2>&1; then
        print_success "Rule '$rule' exists"
    else
        print_error "Rule '$rule' missing or invalid"
    fi
done

# 6. Quick Tests
print_header "6. Quick Tests"

print_info "Running quick validation tests..."

# Test environment loading
if make env-check >/dev/null 2>&1; then
    print_success "Environment validation passed"
else
    print_warning "Environment validation failed"
fi

# Test TTL parsing (if possible)
if [ -f "lib/src/indexers/ttlSchemaAnalyzer.js" ] && [ -n "$TTL_FULL_PATH" ] && [ -f "$TTL_FULL_PATH" ]; then
    print_info "Testing TTL parsing..."
    if timeout 30s node lib/src/indexers/ttlSchemaAnalyzer.js "$TTL_FULL_PATH" "test-schema.json" 2>/dev/null; then
        if [ -f "test-schema.json" ]; then
            FIELDS=$(jq '.fields | length' test-schema.json 2>/dev/null || echo "0")
            print_success "TTL parsing successful - generated $FIELDS fields"
            rm -f "test-schema.json"
        else
            print_warning "TTL parsing completed but no output file"
        fi
    else
        print_warning "TTL parsing test failed or timeout"
    fi
fi

# 7. Summary and Recommendations
print_header "7. Summary and Recommendations"

ISSUES=0

# Count issues
if [ ! -f "env/.env.playground.user" ]; then
    print_error "Missing playground environment file"
    ((ISSUES++))
fi

if [ -z "$SECRET_AZURE_SEARCH_KEY" ]; then
    print_error "Azure Search key not configured"
    ((ISSUES++))
fi

if [ -z "$SECRET_AZURE_OPENAI_API_KEY" ]; then
    print_error "Azure OpenAI key not configured"
    ((ISSUES++))
fi

if [ ! -d "node_modules" ]; then
    print_error "Dependencies not installed"
    ((ISSUES++))
fi

# Final assessment
echo ""
if [ $ISSUES -eq 0 ]; then
    print_success "🎉 System appears healthy! Ready for ontology-driven operations."
    echo ""
    print_info "Suggested next steps:"
    echo "  1. make index-create    # Create the ontology-driven index"
    echo "  2. make index-status    # Verify index creation"
    echo "  3. make index-populate  # Populate index with TTL metadata"
    echo "  4. make documents-add   # Add additional documents (optional)"
else
    print_warning "⚠️  Found $ISSUES potential issues that may need attention."
    echo ""
    print_info "Recommended actions:"
    echo "  1. Review the errors above"
    echo "  2. Check docs/troubleshooting-ontology-driven.md"
    echo "  3. Fix configuration issues"
    echo "  4. Re-run this diagnostic"
fi

echo ""
print_info "Diagnostic complete. Log saved to: $LOG_FILE"
print_info "For detailed troubleshooting, see: docs/troubleshooting-ontology-driven.md"
