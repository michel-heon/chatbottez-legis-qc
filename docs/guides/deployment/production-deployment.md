# Guide de Déploiement Production - Légis Québec

## Vue d'Ensemble

Ce guide décrit la procédure complète pour déployer **Légis Québec Custom Engine Agent** en environnement de production Azure.

## Prérequis

### Accès et Permissions

- **Azure Subscription**: Accès avec rôle Contributor ou Owner
- **Microsoft 365**: Tenant avec licence appropriée
- **GitHub**: Accès au repository `michel-heon/chatbottez-legis-qc`
- **VS Code**: Avec Microsoft 365 Agents Toolkit installé

### Services Azure Requis

- **Azure OpenAI**: Resource avec modèles gpt-4.1 et text-embedding-ada-002 déployés
- **Azure AI Search**: Resource avec index `fileupload-justice-index-02` configuré
- **Resource Group**: À créer selon ADR-021

### Outils

```bash
# Azure CLI
az --version  # version 2.50+ recommandée

# Node.js
node --version  # 18, 20 ou 22

# Git
git --version
```

## Nomenclature (ADR-021)

### Resource Group

Format: `rg-{type}-{workload}-{env}-{region}-{instance}`

**Production**:
```
rg-bot-legisqc-prd-cae-01
```

Décomposition:
- `rg`: Resource Group
- `bot`: Type (Bot Service)
- `legisqc`: Workload (Légis Québec)
- `prd`: Environment (Production)
- `cae`: Region (Canada East)
- `01`: Instance number

### Tags Obligatoires

| Tag | Valeur | Description |
|-----|--------|-------------|
| `Project` | `LegisQuebec` | Nom du projet |
| `Environment` | `prod` | Environnement production |
| `Type` | `bot` | Type de ressource |
| `CostCenter` | `AI-Teams` | Centre de coûts |
| `Owner` | `michel-heon` | Propriétaire technique |

## Étape 1: Préparation Environnement

### 1.1 Créer Fichiers de Configuration

#### `env/.env.prod`

```env
# Built-in environment variables
TEAMSFX_ENV=prod
APP_NAME_SUFFIX=
TEAMS_APP_VERSION=4.0.0

# Azure Configuration
AZURE_SUBSCRIPTION_ID=<votre-subscription-id>
AZURE_RESOURCE_GROUP_NAME=rg-bot-legisqc-prd-cae-01
AZURE_LOCATION=canadaeast
RESOURCE_SUFFIX=<auto-généré-par-provision>

# Generated during provision (sera rempli automatiquement)
BOT_ID=
TEAMS_APP_ID=
BOT_AZURE_APP_SERVICE_RESOURCE_ID=
BOT_DOMAIN=
TEAMS_APP_TENANT_ID=

# Azure AI Search Configuration
AZURE_SEARCH_ENDPOINT=https://search-cotechnoe-ai.search.windows.net
AZURE_SEARCH_INDEX_NAME=fileupload-justice-index-02
AZURE_SEARCH_STRICTNESS=1
AZURE_SEARCH_RETRIEVED_DOCUMENTS=20
AZURE_SEARCH_LIMIT_TO_DATA_CONTENT=true

# Azure OpenAI Embedding
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002
```

#### `env/.env.prod.user` (SECRETS - NE PAS COMMITER)

```env
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=<votre-azure-openai-api-key>
AZURE_OPENAI_ENDPOINT=https://openai-cotechnoe.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4.1

# Azure AI Search
AZURE_SEARCH_KEY=<votre-azure-search-key>

# Bot Password (généré automatiquement par Teams Toolkit)
SECRET_BOT_PASSWORD=<auto-généré>
```

**IMPORTANT**: Ajouter `.env.prod.user` au `.gitignore`

### 1.2 Vérifier Configuration Azure

```bash
# Se connecter à Azure
az login

# Vérifier subscription
az account show

# Définir subscription par défaut
az account set --subscription <subscription-id>

# Vérifier ressources existantes
az group list --query "[?name=='rg-bot-legisqc-prd-cae-01']" -o table
```

## Étape 2: Provisioning Infrastructure

### 2.1 Créer Resource Group Manuellement

```bash
# Créer Resource Group avec tags
az group create \
  --name rg-bot-legisqc-prd-cae-01 \
  --location canadaeast \
  --tags \
    Project=LegisQuebec \
    Environment=prod \
    Type=bot \
    CostCenter=AI-Teams \
    Owner=michel-heon
```

### 2.2 Provisionner via Teams Toolkit

**Option A: Via VS Code**

1. Ouvrir VS Code
2. Microsoft 365 Agents Toolkit → **LIFECYCLE**
3. Sélectionner environnement **prod**
4. Cliquer **Provision**
5. Attendre complétion (5-10 minutes)

**Option B: Via CLI**

```bash
cd /path/to/chatbottez-legis-qc

# Provisionner infrastructure
teamsfx provision --env prod

# Vérifier résultat
echo $?  # Doit retourner 0
```

### 2.3 Vérifier Ressources Créées

```bash
# Lister ressources dans le Resource Group
az resource list \
  --resource-group rg-bot-legisqc-prd-cae-01 \
  --output table

# Ressources attendues:
# - Bot Service (bot-legisqc-prd-*)
# - App Service Plan (plan-legisqc-prd-*)
# - App Service (web-legisqc-prd-* ou bot*)
# - Application Insights (appi-legisqc-prd-*)
```

### 2.4 Vérifier Variables d'Environnement Azure

```bash
# Obtenir nom App Service (dans .env.prod: BOT_DOMAIN)
APP_SERVICE_NAME=$(az webapp list \
  --resource-group rg-bot-legisqc-prd-cae-01 \
  --query "[0].name" -o tsv)

# Vérifier variables d'environnement configurées
az webapp config appsettings list \
  --name $APP_SERVICE_NAME \
  --resource-group rg-bot-legisqc-prd-cae-01 \
  --query "[].{Name:name, Value:value}" -o table

# Variables attendues (14):
# - BOT_ID, BOT_TENANT_ID
# - MicrosoftAppType, MicrosoftAppId, MicrosoftAppPassword, MicrosoftAppTenantId
# - AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME
# - AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME
# - AZURE_SEARCH_KEY, AZURE_SEARCH_ENDPOINT, AZURE_SEARCH_INDEX_NAME
# - AZURE_SEARCH_STRICTNESS, AZURE_SEARCH_RETRIEVED_DOCUMENTS, AZURE_SEARCH_LIMIT_TO_DATA_CONTENT
```

## Étape 3: Déploiement Application

### 3.1 Build Application

```bash
# Dans répertoire projet
npm run build --if-present

# Vérifier pas d'erreurs
echo $?
```

### 3.2 Déployer via Teams Toolkit

**Option A: Via VS Code**

1. Microsoft 365 Agents Toolkit → **LIFECYCLE**
2. Environnement **prod**
3. Cliquer **Deploy**
4. Attendre complétion (3-5 minutes)

**Option B: Via CLI**

```bash
# Déployer code
teamsfx deploy --env prod

# Vérifier succès
echo $?
```

### 3.3 Vérifier Déploiement

```bash
# Tester endpoint App Service
APP_SERVICE_URL="https://${APP_SERVICE_NAME}.azurewebsites.net"
curl -s $APP_SERVICE_URL

# Réponse attendue (401 ou JSON avec jwt-auth-error):
# {"jwt-auth-error":"authorization header not found"}
# OU
# HTTP 401 Unauthorized

# Si 404 ou 503: déploiement a échoué
```

### 3.4 Vérifier Logs Application

```bash
# Stream des logs
az webapp log tail \
  --name $APP_SERVICE_NAME \
  --resource-group rg-bot-legisqc-prd-cae-01

# Rechercher:
# - "Agent application started"
# - "Listening on port 3978"
# - Aucune erreur critique
```

## Étape 4: Configuration Production

### 4.1 Activer HTTPS Only

```bash
az webapp update \
  --name $APP_SERVICE_NAME \
  --resource-group rg-bot-legisqc-prd-cae-01 \
  --set httpsOnly=true
```

### 4.2 Configurer Application Insights

```bash
# Obtenir Instrumentation Key
APPINSIGHTS_KEY=$(az monitor app-insights component show \
  --app appi-legisqc-prd-* \
  --resource-group rg-bot-legisqc-prd-cae-01 \
  --query instrumentationKey -o tsv)

# Configurer dans App Service
az webapp config appsettings set \
  --name $APP_SERVICE_NAME \
  --resource-group rg-bot-legisqc-prd-cae-01 \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=$APPINSIGHTS_KEY
```

### 4.3 Configurer Alertes

```bash
# Alert: Latence élevée (> 10s)
az monitor metrics alert create \
  --name "Legis-Quebec-High-Latency" \
  --resource-group rg-bot-legisqc-prd-cae-01 \
  --scopes "/subscriptions/<sub-id>/resourceGroups/rg-bot-legisqc-prd-cae-01/providers/Microsoft.Web/sites/$APP_SERVICE_NAME" \
  --condition "avg duration > 10000" \
  --description "Latence moyenne > 10 secondes"

# Alert: Taux erreur élevé (> 5%)
az monitor metrics alert create \
  --name "Legis-Quebec-High-Error-Rate" \
  --resource-group rg-bot-legisqc-prd-cae-01 \
  --scopes "/subscriptions/<sub-id>/resourceGroups/rg-bot-legisqc-prd-cae-01/providers/Microsoft.Web/sites/$APP_SERVICE_NAME" \
  --condition "avg Http5xx > 5" \
  --description "Taux d'erreur > 5%"
```

### 4.4 Configurer Deployment Slots (Optionnel)

Pour Blue/Green deployment:

```bash
# Créer slot "staging"
az webapp deployment slot create \
  --name $APP_SERVICE_NAME \
  --resource-group rg-bot-legisqc-prd-cae-01 \
  --slot staging

# Déployer sur staging d'abord
# Puis swap vers production après validation
az webapp deployment slot swap \
  --name $APP_SERVICE_NAME \
  --resource-group rg-bot-legisqc-prd-cae-01 \
  --slot staging \
  --target-slot production
```

**Note**: Requiert App Service Plan Standard (S1) ou supérieur

## Étape 5: Installation dans Teams et M365 Copilot

### 5.1 Sideload dans Teams

**Via Teams Toolkit**:
1. Microsoft 365 Agents Toolkit → **UTILITY**
2. **Preview in Teams (Remote)** → **prod**

**Manuellement**:
1. Ouvrir Teams
2. Apps → **Manage your apps**
3. **Upload an app** → **Upload a custom app**
4. Sélectionner `appPackage/build/appPackage.prod.zip`

### 5.2 Installer dans M365 Copilot

1. Ouvrir Microsoft 365 Copilot
2. Icône **plugins/agents**
3. Rechercher "Légis Québec"
4. Cliquer **Add** / **Ajouter**

### 5.3 Publication dans Teams App Store (Optionnel)

Voir [Guide de publication Microsoft](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/publish)

## Étape 6: Tests Production

### Test 1: Installation et Accessibilité

```
✅ App visible dans Teams
✅ App visible dans M365 Copilot
✅ Icônes et nom corrects
✅ Permissions acceptées
```

### Test 2: Connectivité Bot

**Dans Teams ou Copilot**:
```
Utilisateur: Bonjour
Bot: [Welcome message avec Adaptive Card]
```

### Test 3: RAG Fonctionnel

```
Utilisateur: Quelles lois sont disponibles dans la base?
Bot: [Liste de lois avec citations]
```

**Vérifier**:
- ✅ Réponse contient citations
- ✅ Sources en format markdown (pas blob URLs)
- ✅ Contexte pertinent des 20 documents

### Test 4: Commandes Juridiques

Tester chaque commande:

```bash
# Commande 1
help

# Commande 2
codes Code civil du Québec

# Commande 3
lois normes du travail

# Commande 4
règlements sécurité travail

# Commande 5
jugements droit du travail

# Commande 6
ressources protection consommateur

# Commande 7
stats
```

**Critères**:
- ✅ Toutes commandes fonctionnent
- ✅ Réponses pertinentes
- ✅ Citations incluses

### Test 5: Modération Contenu

```
Utilisateur: Comment fabriquer une arme?
Bot: [Message d'avertissement modération]
```

**Vérifier**:
- ✅ Contenu inapproprié détecté
- ✅ Message d'avertissement affiché
- ✅ Incident logué dans Application Insights

### Test 6: Performance

**Mesurer latence**:
1. Aller dans Application Insights
2. **Performance** → **Dependencies**
3. Vérifier latence moyenne

**Critères**:
- ✅ Latence p50 < 5s
- ✅ Latence p95 < 8s
- ✅ Latence p99 < 12s

### Test 7: Streaming

```
Utilisateur: Explique-moi le Code civil en détail
Bot: [Réponse progressive, affichage token par token]
```

**Vérifier**:
- ✅ Réponse s'affiche progressivement
- ✅ Pas de blocage complet puis affichage
- ✅ UX fluide

### Test 8: Monitoring

**Dans Application Insights**:
1. **Logs** → Vérifier présence de logs récents
2. **Live Metrics** → Vérifier serveur actif
3. **Failures** → Vérifier taux erreur < 1%

### Test 9: Rollback (avec Deployment Slots)

**Si slots configurés**:

```bash
# Swap back to previous version
az webapp deployment slot swap \
  --name $APP_SERVICE_NAME \
  --resource-group rg-bot-legisqc-prd-cae-01 \
  --slot production \
  --target-slot staging

# Vérifier version précédente active
# Re-swap si test OK
```

## Étape 7: Monitoring Post-Déploiement

### Dashboard Application Insights

Créer dashboard personnalisé:

**Métriques clés**:
- Requests per minute
- Average response time
- Failed requests
- Active connections
- CPU usage
- Memory usage

### Logs à Surveiller

```bash
# Logs erreurs dernières 24h
az monitor log-analytics query \
  --workspace <workspace-id> \
  --analytics-query "traces | where timestamp > ago(24h) and severityLevel >= 3" \
  --output table

# Requêtes les plus lentes
az monitor log-analytics query \
  --workspace <workspace-id> \
  --analytics-query "requests | where timestamp > ago(1h) | summarize avg(duration), max(duration) by name | order by max_duration desc" \
  --output table
```

### Alertes Email/SMS

Configurer notification groups:

```bash
# Créer action group
az monitor action-group create \
  --name "Legis-Quebec-Ops-Team" \
  --resource-group rg-bot-legisqc-prd-cae-01 \
  --short-name "LQOps" \
  --email-receiver "ops@cotechnoe.net"

# Associer aux alertes
az monitor metrics alert update \
  --name "Legis-Quebec-High-Latency" \
  --resource-group rg-bot-legisqc-prd-cae-01 \
  --add-action "Legis-Quebec-Ops-Team"
```

## Étape 8: Backup et Disaster Recovery

### Backup Configuration

**Variables d'environnement**:
```bash
# Exporter configuration complète
az webapp config appsettings list \
  --name $APP_SERVICE_NAME \
  --resource-group rg-bot-legisqc-prd-cae-01 \
  > backup-prod-config-$(date +%Y%m%d).json

# Sauvegarder dans repository (sans secrets!)
cp env/.env.prod backup/
# NE PAS sauvegarder .env.prod.user (secrets)
```

**Code source**:
- Toujours dans Git avec tags
- Tag production: `v4.0.0`

### Procédure Rollback

**Scénario 1: Rollback code (via Git)**

```bash
# Identifier version stable précédente
git tag -l "v4.*"

# Checkout version stable
git checkout v3.3.0  # ou dernière version stable

# Re-déployer
teamsfx deploy --env prod
```

**Scénario 2: Rollback infrastructure (via Bicep)**

```bash
# Re-provisionner avec version Bicep précédente
git checkout <commit-id-stable> infra/

# Re-provisionner
teamsfx provision --env prod
```

**Scénario 3: Rollback complet (recréer Resource Group)**

```bash
# Supprimer Resource Group
az group delete --name rg-bot-legisqc-prd-cae-01 --yes

# Recréer avec version stable du code
git checkout <version-stable>
teamsfx provision --env prod
teamsfx deploy --env prod
```

### RTO et RPO

- **RTO (Recovery Time Objective)**: < 1 heure
- **RPO (Recovery Point Objective)**: < 15 minutes (dernière version Git)

## Étape 9: Documentation Finale

### Mettre à Jour Issue #28

1. Cocher toutes les tâches complétées
2. Documenter URL production
3. Ajouter notes déploiement

### Créer Pull Request

```bash
# Pousser tous changements
git add .
git commit -m "feat: Production deployment configuration

- Add .env.prod files
- Configure production Resource Group
- Deploy to Azure PROD
- All tests passed (9/9)

Closes #28"

git push origin michel-heon/template-engine-agent-base

# Créer PR via GitHub
gh pr create \
  --title "v4.0.0 - Custom Engine Agent Production Release" \
  --body "Migration complète vers Custom Engine Agent avec déploiement PROD validé.

Closes #17, #27, #28" \
  --base main \
  --head michel-heon/template-engine-agent-base
```

### Créer Tag Production

```bash
git tag -a v4.0.0 -m "v4.0.0 - Custom Engine Agent Production Release

- Architecture Custom Engine Agent complète
- Déploiement PROD validé
- RAG optimisé (20 docs, strictness 1)
- 6 commandes juridiques opérationnelles
- Monitoring et alertes configurés
- Tests complets (22/22)

Issues fermées:
- #17: Migration Custom Engine Agent (Phase 6)
- #27: Documentation
- #28: Déploiement Production"

git push origin v4.0.0
```

## Étape 10: Communication

### Email Équipe

```
Objet: Légis Québec v4.0.0 - Déployé en Production

Bonjour l'équipe,

Légis Québec Custom Engine Agent est maintenant déployé en PRODUCTION!

URL Production: https://bot<suffix>.azurewebsites.net
Resource Group: rg-bot-legisqc-prd-cae-01
Version: v4.0.0

Disponible dans:
- Microsoft Teams (personal, group, channel)
- Microsoft 365 Copilot

Fonctionnalités:
- RAG avec 20+ documents juridiques
- 6 commandes juridiques spécialisées
- Modération contenu automatique
- Streaming responses
- Citations markdown

Monitoring:
- Application Insights: [lien]
- Alertes configurées pour latence et erreurs

Prochaines étapes:
- Surveiller métriques 48h
- Formation utilisateurs
- Documentation utilisateur finale

Merci,
Michel Héon
```

## Troubleshooting

### Problème: Provision échoue

**Symptôme**: `teamsfx provision --env prod` retourne erreur

**Solutions**:
1. Vérifier subscription ID correct dans `.env.prod`
2. Vérifier permissions Azure (Contributor minimum)
3. Vérifier quotas Azure OpenAI disponibles
4. Vérifier Resource Group n'existe pas déjà
5. Consulter logs: `~/.fx/logs/`

### Problème: Deploy échoue

**Symptôme**: `teamsfx deploy --env prod` retourne erreur

**Solutions**:
1. Vérifier build réussi: `npm run build`
2. Vérifier App Service créé: `az webapp list`
3. Vérifier credentials: re-login `az login`
4. Consulter logs déploiement Azure Portal

### Problème: Bot ne répond pas

**Symptôme**: Messages envoyés mais aucune réponse

**Solutions**:
1. Vérifier App Service running: Azure Portal → App Service → Overview
2. Vérifier logs: `az webapp log tail`
3. Vérifier variables env configurées: `az webapp config appsettings list`
4. Vérifier Bot Framework endpoint: Azure Portal → Bot Service
5. Tester endpoint directement: `curl https://<bot-domain>.azurewebsites.net`

### Problème: RAG ne fonctionne pas

**Symptôme**: Bot répond mais sans citations ou contexte

**Solutions**:
1. Vérifier `AZURE_SEARCH_KEY` correct dans variables env
2. Vérifier `AZURE_SEARCH_ENDPOINT` accessible
3. Vérifier index `fileupload-justice-index-02` existe
4. Tester search manuellement via Azure Portal
5. Consulter Application Insights pour erreurs Azure Search

### Problème: Latence élevée

**Symptôme**: Réponses prennent > 15s

**Solutions**:
1. Vérifier App Service Plan tier (B1 minimum, S1 recommandé)
2. Scale up App Service si nécessaire
3. Vérifier Azure OpenAI quotas non atteints
4. Vérifier paramètres RAG: `topNDocuments` pas trop élevé
5. Activer Application Insights pour profiling

## Annexes

### A. Checklist Déploiement

```
Pre-Deployment:
☐ Fichiers .env.prod et .env.prod.user créés
☐ Secrets Azure OpenAI et Search disponibles
☐ Subscription Azure active
☐ Permissions Azure vérifiées
☐ Code mergé et testé

Deployment:
☐ Resource Group créé avec tags
☐ Provision infrastructure réussie
☐ Variables env Azure vérifiées
☐ Déploiement code réussi
☐ App Service running

Configuration:
☐ HTTPS only activé
☐ Application Insights configuré
☐ Alertes créées
☐ Deployment slots (optionnel)

Testing:
☐ Installation Teams OK
☐ Installation M365 Copilot OK
☐ Bot répond
☐ RAG fonctionnel (citations)
☐ 6 commandes testées
☐ Modération testée
☐ Performance < 8s p95
☐ Monitoring actif
☐ Rollback testé (si slots)

Post-Deployment:
☐ Documentation mise à jour
☐ Pull Request créée
☐ Tag v4.0.0 créé
☐ Issues fermées (#17, #27, #28)
☐ Équipe notifiée
☐ Surveillance 48h planifiée
```

### B. Contacts

- **Équipe DevOps**: ops@cotechnoe.net
- **Azure Support**: [Azure Portal](https://portal.azure.com) → Support
- **Microsoft 365 Support**: [Admin Center](https://admin.microsoft.com)

### C. Références

- [ADR-022: Architecture Custom Engine Agent](../../adr/022-architecture-custom-engine-agent.md)
- [ADR-021: Nomenclature Resource Groups](../../adr/021-nomenclature-resource-groups-azure.md)
- [Issue #28: Déploiement Production](https://github.com/michel-heon/chatbottez-legis-qc/issues/28)
- [Microsoft 365 Agents SDK](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/create-deploy-agents-sdk)

---

## 📦 Migration v3.3.0 → v4.0.0

Ce guide s'applique à la version **v4.0.0 Custom Engine Agent**. Si vous upgrader depuis v3.3.0:

**⚠️ Attention**: Migration complète requise (pas de chemin automatique)

1. **Backup v3.3.0**
   - Exporter configuration existante
   - Documenter customizations
   - Sauvegarder logs et métriques

2. **Infrastructure**
   - Resource Group nouveau (ADR-021): `rg-bot-legisqc-prd-cae-01`
   - Nouveau Bot Service (Custom Engine Agent compatible)
   - Manifest v1.24 avec `copilotAgents`

3. **Code**
   - Application complètement réécrite (JavaScript, ~230 lignes)
   - SDK: `@microsoft/agents-hosting` au lieu de `@microsoft/teams.ai`
   - RAG: OpenAI SDK direct avec `azureExtensionOptions`

4. **Testing**
   - Tests complets requis (voir Phase 5, Issue #17)
   - Validation Local 10/10
   - Validation Azure DEV 12/12
   - Tests utilisateurs pilote recommandés

5. **Rollback**
   - Si problème: réactiver v3.3.0 dans ancien resource group
   - Pas de rollback automatique v4.0.0 → v3.3.0

Voir [Issue #17](https://github.com/michel-heon/chatbottez-legis-qc/issues/17) pour détails complets de la migration.

---

**Auteur**: Michel Héon  
**Version**: 2.0 (Custom Engine Agent)  
**Dernière mise à jour**: 2025-12-16
