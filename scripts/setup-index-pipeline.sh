#!/bin/bash
# Setup Index Pipeline - Complete TTL-driven workflow
# Usage: ./setup-index-pipeline.sh [ENV_CONFIG] [MODE]

set -e

# Load environment
ENV_CONFIG=${1:-${ENV_CONFIG:-playground}}
MODE=${2:-full}  # full, incremental, schema-only
source "$(dirname "$0")/env-check.sh"

echo "🚀 Setup Index Pipeline - TTL-Driven Architecture"
echo "=================================================="
echo "📋 Environment: $ENV_CONFIG"
echo "🔄 Mode: $MODE"
echo ""

# Function to run a phase with error handling
run_phase() {
    local phase_name="$1"
    local script_name="$2"
    local required="$3"
    
    echo "📍 Phase: $phase_name"
    echo "🔧 Running: $script_name"
    
    if [ "$required" = "true" ] || [ "$MODE" = "full" ]; then
        if FORCE="${FORCE:-false}" ./scripts/$script_name $ENV_CONFIG; then
            echo "✅ $phase_name completed successfully"
        else
            echo "❌ $phase_name failed"
            if [ "$required" = "true" ]; then
                echo "💥 Critical phase failed, aborting workflow"
                exit 1
            else
                echo "⚠️  Non-critical phase failed, continuing..."
            fi
        fi
    else
        echo "⏭️  Skipping $phase_name (mode: $MODE)"
    fi
    echo ""
}

# Phase 1: TTL Schema Analysis (always required)
run_phase "TTL Schema Analysis" "ttl-schema-analyze.sh" "true"

# Phase 2: Index Creation (required for full mode)
if [ "$MODE" = "full" ] || [ "$MODE" = "schema-only" ]; then
    run_phase "Index Creation" "index-create-from-ttl.sh" "true"
fi

# Exit early for schema-only mode
if [ "$MODE" = "schema-only" ]; then
    echo "🎯 Schema-only mode completed"
    exit 0
fi

# Phase 3: Files Discovery (required for content processing)
run_phase "Files Discovery" "ttl-files-discover.sh" "true"

# Phase 4: Content Processing (can be skipped for incremental if already done)
PROCESSED_DIR="${EXTERNAL_DATA_SOURCE_PATH}/transform/processed"
if [ "$MODE" = "full" ] || [ ! -d "$PROCESSED_DIR" ]; then
    run_phase "Content Processing" "content-process-batch.sh" "false"
else
    echo "📍 Phase: Content Processing"
    echo "⏭️  Skipping content processing (incremental mode, content exists)"
    echo ""
fi

# Phase 5: Index Population (always run)
run_phase "Index Population" "index-populate-from-ttl.sh" "true"

echo "🎉 Setup Index Pipeline completed successfully!"
echo ""
echo "📊 Summary:"
echo "  Mode: $MODE"
echo "  Environment: $ENV_CONFIG"
echo "  Index: $(node -e 'console.log(require("./src/indexers/config/index-schema.json").name)' 2>/dev/null || echo 'unknown')"
echo ""
echo "🔗 Next steps:"
echo "  • Test search: make index-test ENV_CONFIG=$ENV_CONFIG"
echo "  • Check status: make index-status ENV_CONFIG=$ENV_CONFIG"
echo "  • View docs: make ttl-analyze ENV_CONFIG=$ENV_CONFIG"
