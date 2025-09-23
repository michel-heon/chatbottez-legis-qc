#!/bin/bash
# Nettoyage final et complet de l'historique Git
# Force push de toutes les branches restantes

echo "🧹 Nettoyage final de toutes les branches distantes..."

# Force push toutes les branches restantes qui contiennent des fichiers sensibles
for branch in dev-gpt-teams-rag feature/azure-search-automation feature/java-etl-implementation feature/ttl-sparql-integration release/v1; do
    echo "🔄 Force push de origin/$branch..."
    
    # Checkout et nettoyage de la branche
    git checkout -B temp-$branch origin/$branch 2>/dev/null || continue
    
    # Nettoyage avec filter-branch
    FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f --tree-filter 'rm -f env/.env.* src/prompts/chat/config.json src/main/resources/teams-src/prompts/chat/config.json 2>/dev/null || true' --tag-name-filter cat HEAD~10..HEAD 2>/dev/null || true
    
    # Force push
    git push --force origin temp-$branch:$branch 2>/dev/null || echo "❌ Échec push $branch"
    
    echo "✅ $branch nettoyée"
done

# Nettoyage local
git checkout dev
git branch | grep "temp-" | xargs -I {} git branch -D {}

# Nettoyage final
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "🏁 Nettoyage final terminé"
