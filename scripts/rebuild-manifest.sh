#!/bin/bash
set -euo pipefail

# Load environment variables from .env.prod
set -a
source env/.env.prod
set +a

echo "🔧 Rebuilding manifest with:"
echo "   Version: ${TEAMS_APP_VERSION}"
echo "   Suffix: '${APP_NAME_SUFFIX}'"
echo "   App ID: ${TEAMS_APP_ID}"
echo "   Bot ID: ${BOT_ID}"

# Create build directory
cd appPackage
mkdir -p build

# Substitute ${{VAR}} with actual values using sed
sed -e "s/\${{TEAMS_APP_VERSION}}/${TEAMS_APP_VERSION}/g" \
    -e "s/\${{APP_NAME_SUFFIX}}/${APP_NAME_SUFFIX}/g" \
    -e "s/\${{TEAMS_APP_ID}}/${TEAMS_APP_ID}/g" \
    -e "s/\${{BOT_ID}}/${BOT_ID}/g" \
    manifest.json > build/manifest.prod.json

echo "✅ Manifest rebuilt successfully"
echo "📄 Output: appPackage/build/manifest.prod.json"
