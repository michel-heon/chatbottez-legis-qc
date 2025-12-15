#!/bin/bash
set -euo pipefail

# Load environment variables from .env.prod
set -a
source env/.env.prod
set +a

echo "🔧 Rebuilding manifest with:"
echo "   Version: ${TEAMS_APP_VERSION}"
echo "   RC Version: ${TEAMS_APP_RC_VERSION:-none}"
echo "   Suffix: '${APP_NAME_SUFFIX}'"
echo "   App ID: ${TEAMS_APP_ID}"
echo "   Bot ID: ${BOT_ID}"

# Create build directory
cd appPackage
mkdir -p build

# Build full version string with RC if present
if [ -n "${TEAMS_APP_RC_VERSION:-}" ]; then
    FULL_VERSION="${TEAMS_APP_VERSION} (${TEAMS_APP_RC_VERSION})"
else
    FULL_VERSION="${TEAMS_APP_VERSION}"
fi

# Substitute ${{VAR}} with actual values using sed
sed -e "s/\${{TEAMS_APP_VERSION}}/${FULL_VERSION}/g" \
    -e "s/\${{APP_NAME_SUFFIX}}/${APP_NAME_SUFFIX}/g" \
    -e "s/\${{TEAMS_APP_ID}}/${TEAMS_APP_ID}/g" \
    -e "s/\${{BOT_ID}}/${BOT_ID}/g" \
    manifest.json > build/manifest.prod.json

echo "✅ Manifest rebuilt successfully"
echo "📄 Output: appPackage/build/manifest.prod.json"
