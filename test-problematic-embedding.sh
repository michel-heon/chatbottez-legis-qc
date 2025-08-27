#!/bin/bash

echo "🧪 Test Embedding avec Texte Problématique"

# Load environment
set -a
source env/.env.local.user
set +a

# Test du texte qui pose problème
PROBLEMATIC_TEXT="56; 1987, c. 102, a. 3; 1996, c. 2, a. 39; 1996, c. 25, a. 4. 29. (Abrogé). 1979, c. 51, a. 29; 1987, c. 23, a. 81; 1996, c. 2, a. 40; 1996, c. 25, a. 4. AMÉNAGEMENT ET URBANISME À jour au 0 1 1 er 0"

echo "📝 Texte à tester (${#PROBLEMATIC_TEXT} caractères):"
echo "${PROBLEMATIC_TEXT:0:100}..."

echo ""
echo "🔍 Test avec API Azure OpenAI..."

curl -X POST "${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME}/embeddings?api-version=2023-05-15" \
  -H "Content-Type: application/json" \
  -H "api-key: $SECRET_AZURE_OPENAI_API_KEY" \
  -d "{\"input\": \"$PROBLEMATIC_TEXT\"}" \
  -w "\nHTTP Status: %{http_code}\n" \
  -v 2>&1 | grep -E "(HTTP|error|Error|\{|\})"
