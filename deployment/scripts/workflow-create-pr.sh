#!/usr/bin/env bash
# Script: workflow-create-pr.sh
# Description: Créer une PR de test vers dev pour déclencher workflow ci-tests.yml
# Usage: ./workflow-create-pr.sh <repo>
# Nomenclature: ADR-017 (workflow-create-pr.sh)

set -e

REPO="${1:-michel-heon/chatbottez-legis-qc}"
CURRENT_BRANCH=$(git branch --show-current)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TEST_BRANCH="test/workflow-cicd-${TIMESTAMP}"

echo "Repository: $REPO"
echo "Branche actuelle: $CURRENT_BRANCH"
echo "Branche de test: $TEST_BRANCH"
echo ""

# Vérifier qu'on n'est pas déjà sur une branche de test
if [[ "$CURRENT_BRANCH" == test/* ]]; then
    echo "⚠️  Vous êtes déjà sur une branche de test: $CURRENT_BRANCH"
    echo "   Utilisez cette branche ou checkout une autre branche principale"
    exit 1
fi

# Vérifier qu'il n'y a pas de modifications non committées
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  Modifications non committées détectées"
    echo ""
    git status --short
    echo ""
    read -p "Committer les modifications maintenant? (y/N): " COMMIT_NOW
    if [[ "$COMMIT_NOW" =~ ^[Yy]$ ]]; then
        git add .
        read -p "Message de commit: " COMMIT_MSG
        git commit -m "${COMMIT_MSG:-test: Validation workflow CI/CD}"
    else
        echo "❌ Opération annulée. Committez d'abord vos modifications."
        exit 1
    fi
fi

# Créer branche de test
echo "Création branche de test: $TEST_BRANCH"
git checkout -b "$TEST_BRANCH"

# Créer fichier de test (si pas déjà de modifications)
if [[ -z $(git diff --name-only "$CURRENT_BRANCH") ]]; then
    echo "Ajout fichier de test..."
    echo "# Test Workflow CI/CD - $TIMESTAMP" > "deployment/workflow-test-${TIMESTAMP}.txt"
    echo "" >> "deployment/workflow-test-${TIMESTAMP}.txt"
    echo "Ce fichier valide que les workflows GitHub Actions fonctionnent:" >> "deployment/workflow-test-${TIMESTAMP}.txt"
    echo "- ci-tests.yml: Déclenché lors création PR" >> "deployment/workflow-test-${TIMESTAMP}.txt"
    echo "- deploy-dev.yml: Déclenché lors merge PR vers dev" >> "deployment/workflow-test-${TIMESTAMP}.txt"
    echo "" >> "deployment/workflow-test-${TIMESTAMP}.txt"
    echo "Créé: $(date)" >> "deployment/workflow-test-${TIMESTAMP}.txt"
    
    git add "deployment/workflow-test-${TIMESTAMP}.txt"
    git commit -m "test: Valider workflows CI/CD GitHub Actions"
fi

# Push branche
echo ""
echo "Push branche vers GitHub..."
git push origin "$TEST_BRANCH"

# Créer PR
echo ""
echo "Création Pull Request vers dev..."
PR_BODY="## Validation Workflows CI/CD

Cette PR teste l'automatisation complète:

### Workflows déclenchés:
- ✅ **ci-tests.yml** : À la création de cette PR
  - Tests npm
  - Build vérification
  
### Workflows à déclencher au merge:
- ⏳ **deploy-dev.yml** : Après merge vers dev
  - Déploiement automatique vers Azure DEV

### Vérifications:
- [ ] Workflow ci-tests.yml exécuté avec succès
- [ ] Tests passent (npm test)
- [ ] Build réussit (make build)

---

**Créé par:** \`make workflow-test-pr\`  
**Timestamp:** $TIMESTAMP  
**Branche:** $TEST_BRANCH
"

gh pr create \
    --repo "$REPO" \
    --base dev \
    --head "$TEST_BRANCH" \
    --title "Test: Validation workflows CI/CD - $TIMESTAMP" \
    --body "$PR_BODY"

PR_NUMBER=$(gh pr list --repo "$REPO" --head "$TEST_BRANCH" --json number --jq '.[0].number')

echo ""
echo "=========================================="
echo "✓ Pull Request créée!"
echo "=========================================="
echo ""
echo "PR #$PR_NUMBER: $TEST_BRANCH → dev"
echo ""
echo "🔍 Vérifier workflow ci-tests.yml:"
echo "   https://github.com/$REPO/actions"
echo ""
echo "📋 Voir la PR:"
echo "   https://github.com/$REPO/pull/$PR_NUMBER"
echo ""
echo "⏭️  Prochaines étapes:"
echo "   1. Attendre que ci-tests.yml passe (1-2 min)"
echo "   2. Merger PR: make workflow-merge-pr"
echo "   3. Vérifier deploy-dev.yml déclenché"
echo ""
echo "🔄 Statut workflows: make workflow-status"
echo ""
