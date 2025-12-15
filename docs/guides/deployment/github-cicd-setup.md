# Configuration GitHub CI/CD

Guide de configuration des GitHub Secrets, Environments et Branch Protections pour le CI/CD du projet Légis Québec.

**Objectif** : Automatiser le déploiement du CODE uniquement depuis GitHub Actions. Les ressources Azure sont déjà provisionnées via M365 Agents Toolkit.

**Workflow cible** :
- Push vers `dev` → GitHub Actions → `teamsapp deploy --env dev`
- Tag `v*` → GitHub Actions → Approbation manuelle → `teamsapp deploy --env prod`

## Prérequis

- Accès administrateur au repository GitHub
- Environnements Azure DEV et PROD déjà provisionnés via M365 Agents Toolkit
- Subscription ID et Tenant ID Azure

## Phase 1 : Récupérer informations Azure

### 1.1 Subscription ID et Tenant ID

```bash
# Se connecter à Azure
az login

# Récupérer Subscription ID
az account show --query id -o tsv

# Récupérer Tenant ID
az account show --query tenantId -o tsv
```

⚠️ **Note** : Ces 2 valeurs suffisent pour `teamsapp deploy`. Les ressources Azure sont déjà provisionnées via M365 Agents Toolkit.

## Phase 2 : GitHub Secrets

### 2.1 Accéder à GitHub Secrets

1. Aller sur GitHub : https://github.com/michel-heon/chatbottez-legis-qc
2. Cliquer **Settings** → **Secrets and variables** → **Actions**
3. Cliquer **New repository secret**

### 2.2 Créer les secrets requis

| Secret Name | Source | Description |
|-------------|--------|-------------|
| `AZURE_SUBSCRIPTION_ID` | `az account show --query id` | ID Subscription Azure |
| `AZURE_TENANT_ID` | `az account show --query tenantId` | ID Tenant Azure |

**Pour chaque secret** :
1. Cliquer **New repository secret**
2. Name: `AZURE_SUBSCRIPTION_ID`
3. Value: Coller le GUID
4. Cliquer **Add secret**
5. Répéter pour `AZURE_TENANT_ID`

⚠️ **Simplifié** : Seulement 2 secrets requis car `teamsapp deploy` utilise les fichiers `.env` déjà configurés localement via M365 Agents Toolkit.

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

### 5.1 Vérifier configuration locale

```bash
# Vérifier que teamsapp deploy fonctionne localement
cd /path/to/chatbottez-legis-qc
make -C deployment deploy-dev
```

✅ Si succès → Configuration locale OK, GitHub Actions devrait fonctionner

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

### Erreur: "teamsapp deploy failed"

**Symptôme** : Workflow échoue à l'étape deploy

**Solutions** :
1. Vérifier que `AZURE_SUBSCRIPTION_ID` et `AZURE_TENANT_ID` sont corrects
2. Vérifier que fichiers `.env.dev` ou `.env.prod` sont commitées dans le repo
3. Tester `make deploy-dev` localement pour identifier le problème
4. Vérifier logs GitHub Actions pour message d'erreur exact

### Erreur: "Environment secrets not found"

**Symptôme** : Workflow ne trouve pas variables d'environnement

**Solution** :
1. Vérifier que secrets sont créés au niveau **repository** (pas environment)
2. Vérifier noms exacts: `AZURE_SUBSCRIPTION_ID` et `AZURE_TENANT_ID` (case-sensitive)
3. Vérifier syntaxe dans workflow: `${{ secrets.AZURE_SUBSCRIPTION_ID }}`

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

- [ ] Subscription ID et Tenant ID récupérés
- [ ] 2 GitHub Secrets configurés (`AZURE_SUBSCRIPTION_ID`, `AZURE_TENANT_ID`)
- [ ] Fichiers `.env.dev` et `.env.prod` présents dans le repo
- [ ] Environment `dev` créé (sans protection)
- [ ] Environment `prod` créé (avec approbation manuelle)
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
