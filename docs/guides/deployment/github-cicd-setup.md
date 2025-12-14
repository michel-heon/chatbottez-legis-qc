# Configuration GitHub CI/CD

Guide de configuration des GitHub Secrets, Environments et Branch Protections pour le CI/CD du projet Légis Québec.

## Prérequis

- Accès administrateur au repository GitHub
- Azure CLI installé et authentifié
- Accès Azure avec permissions de création Service Principal

## Phase 1 : Service Principal Azure

### 1.1 Créer le Service Principal

```bash
# Se connecter à Azure
az login

# Créer Service Principal avec role Contributor
az ad sp create-for-rbac \
  --name "sp-legisqc-github-cicd" \
  --role Contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/rg-bot-legisqc-dev-cae-01 \
           /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/rg-bot-legisqc-prd-cae-01 \
  --sdk-auth
```

**Output attendu** (à copier pour GitHub Secrets):
```json
{
  "clientId": "<guid>",
  "clientSecret": "<secret>",
  "subscriptionId": "<guid>",
  "tenantId": "<guid>",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

⚠️ **IMPORTANT** : Sauvegarder ce JSON dans un endroit sécurisé.

### 1.2 Récupérer les informations Azure existantes

```bash
# Subscription ID
az account show --query id -o tsv

# Azure OpenAI info
az cognitiveservices account show \
  --name openai-cotechnoe \
  --resource-group rg-openai-cotechnoe \
  --query "{endpoint:properties.endpoint}" -o json

az cognitiveservices account keys list \
  --name openai-cotechnoe \
  --resource-group rg-openai-cotechnoe \
  --query "key1" -o tsv

# Azure AI Search info
az search service show \
  --name search-cotechnoe-ai \
  --resource-group rg-search-cotechnoe \
  --query "{endpoint:properties.endpoint}" -o json

az search admin-key show \
  --service-name search-cotechnoe-ai \
  --resource-group rg-search-cotechnoe \
  --query "primaryKey" -o tsv
```

## Phase 2 : GitHub Secrets

### 2.1 Accéder à GitHub Secrets

1. Aller sur GitHub : https://github.com/michel-heon/chatbottez-legis-qc
2. Cliquer **Settings** → **Secrets and variables** → **Actions**
3. Cliquer **New repository secret**

### 2.2 Créer les secrets requis

| Secret Name | Source | Description |
|-------------|--------|-------------|
| `AZURE_CREDENTIALS` | Output Service Principal (JSON complet) | Authentification Azure pour GitHub Actions |
| `AZURE_SUBSCRIPTION_ID` | `az account show --query id` | ID Subscription Azure |
| `AZURE_OPENAI_API_KEY` | `az cognitiveservices account keys list` | Clé API Azure OpenAI |
| `AZURE_OPENAI_ENDPOINT` | Endpoint OpenAI | `https://openai-cotechnoe.openai.azure.com/` |
| `AZURE_SEARCH_KEY` | `az search admin-key show` | Clé Azure AI Search |
| `AZURE_SEARCH_ENDPOINT` | Endpoint Search | `https://search-cotechnoe-ai.search.windows.net` |

**Pour chaque secret** :
1. Cliquer **New repository secret**
2. Name: `AZURE_CREDENTIALS` (par exemple)
3. Value: Coller la valeur (JSON ou string)
4. Cliquer **Add secret**

⚠️ **Sécurité** :
- Ne jamais commiter ces valeurs dans Git
- Rotation régulière des secrets (tous les 90 jours)
- Permissions minimales sur Service Principal

## Phase 3 : GitHub Environments

### 3.1 Créer Environment DEV

1. Aller sur **Settings** → **Environments**
2. Cliquer **New environment**
3. Name: `dev`
4. **Protection rules** : Aucune (déploiement automatique)
5. **Environment secrets** : Aucun (utiliser repository secrets)
6. Cliquer **Configure environment**

### 3.2 Créer Environment PROD

1. Aller sur **Settings** → **Environments**
2. Cliquer **New environment**
3. Name: `prod`
4. **Protection rules** :
   - ✅ **Required reviewers** : Ajouter `@michel-heon`
   - ✅ **Wait timer** : 0 minutes (approbation immédiate possible)
   - ✅ **Deployment branches** : Selected branches → tags matching `v*`
5. **Environment secrets** : Aucun (utiliser repository secrets)
6. Cliquer **Save protection rules**

**Résultat attendu** :
- Environment `dev` : Déploiement automatique sans approbation
- Environment `prod` : Déploiement nécessite approbation manuelle de @michel-heon

## Phase 4 : Branch Protections

### 4.1 Protéger branche `main`

1. Aller sur **Settings** → **Branches**
2. Cliquer **Add branch protection rule**
3. Branch name pattern: `main`
4. **Protection rules** :
   - ✅ **Require a pull request before merging**
     - ✅ **Require approvals** : 1
     - ✅ **Dismiss stale pull request approvals when new commits are pushed**
   - ✅ **Require status checks to pass before merging**
     - ✅ **Require branches to be up to date before merging**
     - Status checks: `test` (du workflow ci-tests.yml)
   - ✅ **Require conversation resolution before merging**
   - ❌ **Do not allow bypassing the above settings**
5. Cliquer **Create**

### 4.2 Protéger branche `dev`

1. Cliquer **Add branch protection rule**
2. Branch name pattern: `dev`
3. **Protection rules** :
   - ✅ **Require status checks to pass before merging**
     - Status checks: `test` (du workflow ci-tests.yml)
   - ❌ **Require a pull request before merging** (pour rapidité développement)
4. Cliquer **Create**

**Résultat attendu** :
- Branche `main` : PR requis avec 1 approbation + tests passés
- Branche `dev` : Tests requis, mais pas de PR (push direct autorisé)

## Phase 5 : Validation

### 5.1 Vérifier configuration GitHub Secrets

```bash
# Tester localement avec Azure Login
az login

# Vérifier que Service Principal fonctionne
az login --service-principal \
  -u <clientId> \
  -p <clientSecret> \
  --tenant <tenantId>

az account show
```

✅ Si succès → Service Principal correctement configuré

### 5.2 Tester workflow ci-tests.yml

```bash
# Créer branche test
git checkout -b test/ci-validation

# Modifier un fichier quelconque
echo "# Test CI" >> README.md

# Commit et push
git add README.md
git commit -m "test: Validation workflow ci-tests"
git push origin test/ci-validation

# Créer PR sur GitHub
# → Vérifier que workflow ci-tests.yml s'exécute
# → Vérifier que tests passent ✅
```

### 5.3 Tester workflow deploy-dev.yml

```bash
# Merger PR test vers dev (ou push direct)
git checkout dev
git merge test/ci-validation
git push origin dev

# Aller sur GitHub Actions
# → Vérifier que workflow deploy-dev.yml s'exécute
# → Vérifier déploiement vers Azure DEV ✅
```

### 5.4 Tester workflow deploy-prod.yml

```bash
# Créer tag test
git tag -a v4.0.0-test-cicd -m "Test CI/CD PROD"
git push origin v4.0.0-test-cicd

# Aller sur GitHub Actions
# → Vérifier que workflow deploy-prod.yml attend approbation ⏸️
# → Approuver manuellement
# → Vérifier déploiement vers Azure PROD ✅
```

## Troubleshooting

### Erreur: "Azure login failed"

**Symptôme** : Workflow échoue à l'étape Azure Login

**Solution** :
1. Vérifier que `AZURE_CREDENTIALS` contient JSON complet Service Principal
2. Vérifier que Service Principal a permissions sur resource groups
3. Tester login local avec Service Principal (voir Phase 5.1)

### Erreur: "Environment secrets not found"

**Symptôme** : Workflow ne trouve pas variables d'environnement

**Solution** :
1. Vérifier que secrets sont créés au niveau **repository** (pas environment)
2. Vérifier noms exacts des secrets (case-sensitive)
3. Vérifier syntaxe dans workflow: `${{ secrets.AZURE_CREDENTIALS }}`

### Erreur: "Required reviewers not set"

**Symptôme** : Workflow deploy-prod se lance sans approbation

**Solution** :
1. Vérifier environment `prod` a "Required reviewers" configuré
2. Vérifier workflow utilise `environment: prod`
3. Vérifier deployment branches sur `v*` tags

### Erreur: "Status check not found"

**Symptôme** : Branch protection ne trouve pas status check

**Solution** :
1. Créer au moins 1 PR pour que status check apparaisse
2. Attendre que workflow ci-tests.yml s'exécute une fois
3. Rafraîchir page Branch protection rules
4. Status check `test` devrait maintenant apparaître dans liste

## Checklist finale

Avant de considérer configuration complète, vérifier :

- [ ] Service Principal Azure créé et testé
- [ ] 6 GitHub Secrets configurés
- [ ] Environment `dev` créé (sans protection)
- [ ] Environment `prod` créé (avec approbation)
- [ ] Branch protection `main` configurée
- [ ] Branch protection `dev` configurée
- [ ] Workflow ci-tests.yml testé avec PR ✅
- [ ] Workflow deploy-dev.yml testé avec push dev ✅
- [ ] Workflow deploy-prod.yml testé avec tag + approbation ✅

## Références

- [ADR-023: CI/CD GitHub Actions](../../adr/023-cicd-github-actions.md)
- [deployment/README.md](../../../deployment/README.md)
- [Azure Service Principal Documentation](https://learn.microsoft.com/azure/developer/github/connect-from-azure)
- [GitHub Actions Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

## Historique

| Date | Version | Changements |
|------|---------|-------------|
| 2025-01-20 | 1.0 | Création guide configuration GitHub CI/CD |
