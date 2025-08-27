#!/bin/bash

# Test OpenAI Connection
echo "🔍 Testing OpenAI Azure Connection..."

# Load environment
set -a
source env/.env.local.user
set +a

echo "📋 Configuration:"
echo "  Endpoint: $AZURE_OPENAI_ENDPOINT"
echo "  Embedding Deployment: $AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME"
echo "  API Key: ${SECRET_AZURE_OPENAI_API_KEY:0:20}..."

echo ""
echo "🧪 Testing simple embedding..."

# Test with simple text
curl -X POST "${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME}/embeddings?api-version=2023-05-15" \
  -H "Content-Type: application/json" \
  -H "api-key: $SECRET_AZURE_OPENAI_API_KEY" \
  -d '{
    "input": "Test simple"
  }' \
  -w "HTTP Status: %{http_code}\n" \
  -s | head -n 3

echo ""
echo "🔍 Testing TTL file usage..."
echo "  TTL File: $EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE"
echo "  File exists: $([ -f "$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE" ] && echo "YES" || echo "NO")"

if [ -f "$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE" ]; then
    echo "  File size: $(stat -c%s "$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE") bytes"
    echo "  Document count estimate: $(grep -c "dcterms:identifier" "$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE" || echo "unknown")"
fi
