#!/usr/bin/env bash
# Script: github-configure.sh
# Description: Configure GitHub CI/CD (secrets, environments, branch protections)
# Usage: ./github-configure.sh <repo>
# Nomenclature: ADR-017 (object-action.sh)

set -e

REPO="${1:-michel-heon/chatbottez-legis-qc}"

echo "=========================================="
echo "Configuration automatique GitHub CI/CD"
echo "=========================================="
echo ""

# Etape 1: Secrets
echo "Etape 1: Configuration secrets GitHub"
echo "--------------------------------------"
AZURE_SUB_ID=$(az account show --query id -o tsv 2>/dev/null)
AZURE_TEN_ID=$(az account show --query tenantId -o tsv 2>/dev/null)
echo "Subscription ID: $AZURE_SUB_ID"
echo "Tenant ID: $AZURE_TEN_ID"
echo ""

echo "Configuration secret AZURE_SUBSCRIPTION_ID..."
echo "$AZURE_SUB_ID" | gh secret set AZURE_SUBSCRIPTION_ID -R "$REPO" && \
    echo "  ✓ AZURE_SUBSCRIPTION_ID configure" || echo "  ✗ Erreur"

echo "Configuration secret AZURE_TENANT_ID..."
echo "$AZURE_TEN_ID" | gh secret set AZURE_TENANT_ID -R "$REPO" && \
    echo "  ✓ AZURE_TENANT_ID configure" || echo "  ✗ Erreur"

echo ""

# Etape 2: Environments
echo "Etape 2: Configuration environments GitHub"
echo "--------------------------------------"
echo "Creation environment 'dev'..."
gh api repos/"$REPO"/environments/dev -X PUT > /dev/null 2>&1 && \
    echo "  ✓ Environment 'dev' cree" || echo "  ✗ Erreur dev"

echo "Creation environment 'prod' avec protection..."
gh api repos/"$REPO"/environments/prod -X PUT \
    -F wait_timer=0 \
    -F prevent_self_review=false > /dev/null 2>&1 && \
    echo "  ✓ Environment 'prod' cree" || echo "  ✗ Erreur prod"

echo ""

# Etape 3: Branch protections
echo "Etape 3: Configuration branch protections"
echo "--------------------------------------"
echo "Protection branche 'main'..."
gh api repos/"$REPO"/branches/main/protection -X PUT \
    -F required_status_checks[strict]=true \
    -F 'required_status_checks[contexts][]=ci-tests' \
    -F required_pull_request_reviews[required_approving_review_count]=1 \
    -F enforce_admins=false \
    -F restrictions=null \
    -F allow_force_pushes=false \
    -F allow_deletions=false > /dev/null 2>&1 && \
    echo "  ✓ Branche 'main' protegee" || echo "  ✗ Erreur main"

echo "Protection branche 'dev'..."
gh api repos/"$REPO"/branches/dev/protection -X PUT \
    -F required_status_checks[strict]=true \
    -F 'required_status_checks[contexts][]=ci-tests' \
    -F required_pull_request_reviews=null \
    -F enforce_admins=false \
    -F restrictions=null \
    -F allow_force_pushes=false \
    -F allow_deletions=false > /dev/null 2>&1 && \
    echo "  ✓ Branche 'dev' protegee" || echo "  ✗ Erreur dev"

echo ""

# Etape 4: Verification
echo "Etape 4: Verification configuration"
echo "--------------------------------------"
echo "Secrets:"
gh secret list -R "$REPO"
echo ""
echo "Environments:"
gh api repos/"$REPO"/environments --jq '.environments[] | "  - " + .name'
echo ""

echo "=========================================="
echo "Configuration terminee! ✓"
echo "=========================================="
echo ""
echo "Prochaines etapes (Issue #28):"
echo "  1. Provisionner PROD via M365 Agents Toolkit"
echo "  2. Completer env/.env.prod avec valeurs generees"
echo "  3. Tester workflows CI/CD"
echo ""
