# Scripts de déploiement

Ce répertoire contient les scripts bash appelés par le Makefile pour orchestrer les opérations CI/CD.

## Principes

- **Makefile-oriented** : Les scripts sont appelés depuis le Makefile
- **Réutilisables** : Peuvent être exécutés manuellement si besoin
- **Portables** : Compatible bash (Linux, macOS, Git Bash Windows)
- **Minimalistes** : Pas de dépendances externes complexes

## Scripts disponibles

### configure-github.sh

Configure automatiquement GitHub CI/CD (secrets, environments, branch protections).

**Usage** :
```bash
# Via Makefile (recommandé)
make github-configure-auto

# Direct
./scripts/configure-github.sh [repo]
```

**Prérequis** :
- Azure CLI (`az`) installé et authentifié
- GitHub CLI (`gh`) installé et authentifié

**Actions** :
1. Récupère Subscription ID et Tenant ID via `az`
2. Configure 2 secrets GitHub (AZURE_SUBSCRIPTION_ID, AZURE_TENANT_ID)
3. Crée environments `dev` (no protection) et `prod` (with reviewers)
4. Configure branch protections pour `main` et `dev`
5. Vérifie la configuration finale

**Sortie** :
- Affiche progression avec ✓ ou ✗ pour chaque étape
- Liste finale des secrets et environments configurés

## Ajout de nouveaux scripts

Pour ajouter un nouveau script :

1. Créer le script bash dans `deployment/scripts/`
2. Rendre exécutable : `chmod +x scripts/nom-script.sh`
3. Ajouter target dans Makefile : `mon-target: check-deps`
4. Appeler le script : `@bash scripts/nom-script.sh $(ARGS)`
5. Documenter ici

## Structure recommandée d'un script

```bash
#!/usr/bin/env bash
# Script: mon-script.sh
# Description: Ce que fait le script
# Usage: ./mon-script.sh <args>

set -e  # Arrêter sur erreur

# Validation arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <arg>"
    exit 1
fi

# Logique du script
echo "Debut traitement..."
# ...
echo "Termine!"
```

## Bonnes pratiques

- ✅ Toujours utiliser `set -e` en début de script
- ✅ Valider les arguments requis
- ✅ Afficher messages clairs (début, étapes, fin)
- ✅ Gérer les erreurs avec `|| echo "Erreur"`
- ✅ Quitter avec code approprié (`exit 0` ou `exit 1`)
- ✅ Rediriger output verbeux vers `/dev/null` si nécessaire
- ❌ Éviter les dépendances complexes (jq ok, python non)
- ❌ Ne pas hardcoder de valeurs (passer en arguments)
