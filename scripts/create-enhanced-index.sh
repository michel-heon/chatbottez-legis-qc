#!/bin/bash

# Enhanced Index Creation Script
# Creates a new Azure Search index with enhanced schema for TTL metadata

echo "🏗️  Enhanced Index Creation - TTL Metadata Schema"
echo "================================================="
echo ""

# Load playground environment variables
if [ -f "env/.env.playground.user" ]; then
    set -a  # automatically export all variables
    source env/.env.playground.user
    set +a  # disable automatic export
    echo "✅ Playground environment loaded"
else
    echo "❌ Playground environment file not found: env/.env.playground.user"
    exit 1
fi

# Check required variables
if [ -z "$SECRET_AZURE_SEARCH_KEY" ]; then
    echo "❌ SECRET_AZURE_SEARCH_KEY not found in environment"
    exit 1
fi

if [ -z "$SECRET_AZURE_OPENAI_API_KEY" ]; then
    echo "❌ SECRET_AZURE_OPENAI_API_KEY not found in environment"
    exit 1
fi

# Set enhanced index name
ENHANCED_INDEX_NAME="enhanced-legis-qc-${USER:-demo}"
echo "🎯 Target Enhanced Index: $ENHANCED_INDEX_NAME"
echo "🔗 Search Endpoint: $AZURE_SEARCH_ENDPOINT"
echo ""

# Build the project
echo "🔧 Building project..."
npm run build

# Run enhanced setup with new index name
echo ""
echo "🚀 Creating Enhanced Index with TTL Schema..."
echo "=============================================="

node lib/src/indexers/enhancedSetup.js "$SECRET_AZURE_SEARCH_KEY" "$SECRET_AZURE_OPENAI_API_KEY" "$ENHANCED_INDEX_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Enhanced Index Creation completed successfully!"
    echo ""
    echo "📊 Enhanced Index Details:"
    echo "   Name: $ENHANCED_INDEX_NAME"
    echo "   Fields: 20+ fields with TTL metadata integration"
    echo "   Documents: Enhanced legal documents with embeddings"
    echo "   Features: SPARQL-derived metadata, PDF content, vector search"
    echo ""
    echo "🔍 Verification Commands:"
    echo "   make index-status ENV_CONFIG=playground"
    echo "   make index-test ENV_CONFIG=playground"
    echo ""
    echo "📋 Available Fields in Enhanced Index:"
    echo "   Core: docId, docTitle, description, descriptionVector"
    echo "   TTL: legalIdentifier, documentType, legalStatus, sourceUrl"
    echo "   Meta: keywords[], enrichedAt, searchableText, contentHash"
    echo "   Lang: titleLang, descriptionLang, legalStatusLang"
    echo "   Files: pdfPath, pdfSource, downloadStatus"
    echo ""
else
    echo ""
    echo "❌ Enhanced Index Creation failed"
    echo "Check logs above for specific error details"
    exit 1
fi
