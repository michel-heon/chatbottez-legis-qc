#!/bin/bash
# TTL Files Discovery - Find all files to process based on TTL metadata
# Usage: ./ttl-files-discover.sh [ENV_CONFIG]

set -e

# Load environment
ENV_CONFIG=${1:-${ENV_CONFIG:-local}}
source "$(dirname "$0")/env-check.sh"

echo "🔍 Discovering Files from TTL Metadata..."
echo "📋 Environment: $ENV_CONFIG"

# Create output directory
mkdir -p src/indexers/data/manifests

# Run file discovery
echo "📊 Scanning TTL for file references..."
# Check if TTL_METADATA_FILE already contains the path
if [[ "$TTL_METADATA_FILE" == extract/rdf/* ]]; then
    TTL_FILE_PATH="$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE"
else
    TTL_FILE_PATH="$EXTERNAL_DATA_SOURCE_PATH/extract/rdf/${TTL_METADATA_FILE:-legisquebec-metadata.ttl}"
fi
echo "📁 Using TTL file: $TTL_FILE_PATH"

node lib/src/indexers/ttlFilesDiscovery.js \
    "$TTL_FILE_PATH" \
    "src/indexers/data/manifests/files-manifest.json" \
    "$EXTERNAL_DATA_SOURCE_PATH"

if [ $? -eq 0 ]; then
    echo "✅ File discovery completed successfully"
    
    # Show discovery summary
    echo ""
    echo "📋 Files Discovery Summary:"
    node -e "
        const manifest = require('./src/indexers/data/manifests/files-manifest.json');
        console.log('Total Documents:', manifest.documents.length);
        console.log('PDF Files Found:', manifest.documents.filter(d => d.pdfExists).length);
        console.log('Missing PDFs:', manifest.documents.filter(d => !d.pdfExists).length);
        
        const types = {};
        manifest.documents.forEach(d => {
            types[d.documentType] = (types[d.documentType] || 0) + 1;
        });
        console.log('Document Types:', Object.entries(types).map(([k,v]) => k + ':' + v).join(', '));
    "
else
    echo "❌ File discovery failed"
    exit 1
fi
