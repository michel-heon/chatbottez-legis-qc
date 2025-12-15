# Scripts de déploiement

Ce répertoire contient les scripts bash appelés par le Makefile pour orchestrer les opérations CI/CD.

## Principes

- **Makefile-oriented** : Les scripts sont appelés depuis le Makefile
- **Réutilisables** : Peuvent être exécutés manuellement si besoin
- **Portables** : Compatible bash (Linux, macOS, Git Bash Windows)
- **Minimalistes** : Pas de dépendances externes complexes

## Scripts disponibles

### github-configure.sh

Configure automatiquement GitHub CI/CD (secrets, environments, branch protections).

**Nomenclature** : ADR-017 (`{object}-{action}.sh`)

**Usage** :
```bash
# Via Makefile (recommandé)
make github-configure-auto

# Direct
./scripts/github-configure.sh [repo]
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

### prod-provision.sh

Provisionne l'environnement PROD via Teams Toolkit CLI.

**Nomenclature** : ADR-017 (`{object}-{action}.sh`)

**Usage** :
```bash
# Via Makefile (recommandé)
make prod-provision

# Direct
./scripts/prod-provision.sh
```

**Prérequis** :
- Teams Toolkit CLI (`teamsapp`) installé
- Azure CLI authentifié (`az login`)

**Actions** :
1. Vérifie présence de `teamsapp` CLI
2. Demande confirmation utilisateur
3. Exécute `teamsapp provision --env prod`
4. Génère valeurs dans `env/.env.prod`

**Sortie** :
- Affiche progression du provisionnement
- Indique les prochaines étapes (commit, test)

**Note** : Prend 5-10 minutes pour créer les ressources Azure.

## Ajout de nouveaux scripts

Pour ajouter un nouveau script :

1. Créer le script bash dans `deployment/scripts/`
2. Rendre exécutable : `chmod +x scripts/nom-script.sh`
3. Ajouter target dans Makefile : `mon-target: check-deps`
4. Appeler le script : `@bash scripts/nom-script.sh $(ARGS)`
5. Documenter ici

## Structure recommandée d'un script

Respecter ADR-017 : Format `{object}-{action}.sh`

```bash
#!/usr/bin/env bash
# Script: object-action.sh
# Description: Ce que fait le script
# Usage: ./object-action.sh <args>
# Nomenclature: ADR-017 (object-action.sh)

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

## Séquence complète déploiement PROD

Pour une mise en production complète, exécuter depuis `deployment/`:

```bash
# 1. Configuration GitHub CI/CD (une seule fois)
make github-configure-auto    # Configure secrets, environments, branch protections
                             # Durée: ~2 minutes

# 2. Créer Resource Group PROD dans Azure
make prod-create-rg          # Crée rg-bot-legisqc-prd-cae-01
                             # Durée: ~10 secondes

# 3. Provisionner environnement PROD
make prod-provision          # Bot Service, App Service, Teams App
                             # Durée: ~5-10 minutes
                             # Génère: BOT_ID, TEAMS_APP_ID, BOT_DOMAIN, etc.

# 4. Déployer le code vers Azure PROD
make deploy-prod             # Upload zip package vers App Service
                             # Durée: ~2-3 minutes
                             # Inclut: npm install, npm build, azureAppService/zipDeploy

# 5. Installer le bot dans Teams
make prod-install-teams      # Ouvre lien installation Teams
                             # Copier le lien si navigateur ne s'ouvre pas

# 6. Vérifier le déploiement
make validate                # Tests manuels dans Teams
```

### Prérequis avant déploiement

**Outils CLI:**
- Azure CLI: `az login`
- GitHub CLI: `gh auth login`
- Teams Toolkit CLI: `npm install -g @microsoft/teamsfx-cli`

**Fichiers environnement:**

`env/.env.prod`:
```env
TEAMSFX_ENV=prod
APP_NAME_SUFFIX=-prd
TEAMS_APP_VERSION=4.0.5
AZURE_SUBSCRIPTION_ID=<subscription-id>
AZURE_RESOURCE_GROUP_NAME=rg-bot-legisqc-prd-cae-01
AZURE_LOCATION=canadaeast
# Autres valeurs générées automatiquement lors du provisionnement
```

`env/.env.prod.user` (gitignored):
```env
AZURE_OPENAI_API_KEY=<key>
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4.1
AZURE_SEARCH_KEY=<key>
```

### Résultat attendu

Après exécution complète:

- ✅ **Resource Group**: `rg-bot-legisqc-prd-cae-01` (canadaeast)
- ✅ **Bot Service**: `bot<suffix>.azurewebsites.net`
- ✅ **App Service Plan**: Consommation (Y1)
- ✅ **Teams App**: Installable via lien direct
- ✅ **Application Insights**: Monitoring actif
- ✅ **GitHub CI/CD**: Workflows opérationnels

### Tests de validation PROD

Après installation dans Teams:

1. **Test connexion**: Envoyer "Bonjour"
2. **Test commande**: `/loi Code civil du Québec`
3. **Test RAG**: Question juridique complexe
4. **Vérifier citations**: Sources incluses dans réponse
5. **Test modération**: Message inapproprié (devrait être bloqué)

Voir [production-deployment.md](../../docs/guides/deployment/production-deployment.md) pour 9 tests complets.

### Rollback en cas de problème

```bash
# Si déploiement échoue, revenir version précédente:
az webapp deployment slot list --name bot<suffix> --resource-group rg-bot-legisqc-prd-cae-01

# Ou redéployer depuis commit précédent
git checkout <commit-sha>
make deploy-prod
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
