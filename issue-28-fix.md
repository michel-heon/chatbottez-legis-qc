## Objectif

Déployer **Légis Québec Custom Engine Agent** en environnement de production Azure (Phase 6 - Partie 2).

## Tâches

### Préparation Environnement PROD

- [ ] Créer fichiers `env/.env.prod` et `env/.env.prod.user`
- [ ] Définir variables production:
  - `TEAMSFX_ENV=prod`
  - `APP_NAME_SUFFIX="` (vide pour production)
  - `TEAMS_APP_VERSION=4.0.0`
  - `AZURE_RESOURCE_GROUP_NAME=rg-bot-legisqc-prd-cae-01`
  - `AZURE_LOCATION=canadaeast`

### Infrastructure Azure Production

- [ ] Créer Resource Group: `rg-bot-legisqc-prd-cae-01`
  - Tags: `Project=LegisQuebec`, `Environment=prod`, `Type=bot`, `CostCenter=AI-Teams`
- [ ] Provisionner ressources via `infra/azure.bicep`:
  - Bot Service
  - App Service Plan (taille production)
  - App Service
  - Application Insights
- [ ] Configurer secrets Azure:
  - `AZURE_OPENAI_API_KEY`
  - `AZURE_SEARCH_KEY`
  - Bot credentials (auto-générés)

### Configuration Production

- [ ] Activer HTTPS only
- [ ] Configurer Custom Domain (optionnel)
- [ ] Activer Application Insights monitoring
- [ ] Configurer alertes:
  - Latence > 10s
  - Taux erreur > 5%
  - Disponibilité < 99%
- [ ] Configurer Deployment Slots (Blue/Green - optionnel)
- [ ] Backup et disaster recovery

### Déploiement Application

- [ ] **Teams Toolkit**: LIFECYCLE → prod → Provision
- [ ] **Teams Toolkit**: LIFECYCLE → prod → Deploy
- [ ] Vérifier déploiement:
  - App Service accessible
  - Bot répond via Bot Framework
  - Variables d'environnement configurées
  - Logs Application Insights actifs

### Tests Production

- [ ] **Test 1**: Installation app dans Teams
- [ ] **Test 2**: Installation dans M365 Copilot
- [ ] **Test 3**: Query RAG simple
- [ ] **Test 4**: Vérifier citations et sources
- [ ] **Test 5**: Tester 6 commandes juridiques
- [ ] **Test 6**: Modération contenu
- [ ] **Test 7**: Performance (latence < 8s p95)
- [ ] **Test 8**: Monitoring actif
- [ ] **Test 9**: Rollback procedure (test slots si configuré)

### Finalisation

- [ ] Créer Pull Request: `michel-heon/template-engine-agent-base` → `main`
- [ ] Review et merge PR
- [ ] Créer tag final: `v4.0.0`
- [ ] Push tag vers GitHub
- [ ] Fermer Issue #17 (Phase 6 complète)
- [ ] Communication équipe: Bot en production ✅

## ✅ Critères de succès

- ✅ Bot accessible en production
- ✅ Fonctionne Teams + M365 Copilot
- ✅ RAG opérationnel avec 20 documents
- ✅ Citations et commandes OK
- ✅ Monitoring et alertes actifs
- ✅ Latence < 8s (p95)
- ✅ PR mergé dans `main`
- ✅ Tag `v4.0.0` créé

## Contexte

- **Issue parent**: #17 (Phase 6)
- **Prérequis**: 
  - Issue #27 (Documentation) complète
  - Phases 0-5 validées ✅
- **Timeline**: 1-2 jours
- **Environnement DEV**: `bot34879c.azurewebsites.net` (référence)

## Environnements

| Env | Resource Group | URL | Status |
|-----|---------------|-----|--------|
| Playground | N/A | Local | ✅ Validé |
| Local | N/A | Dev Tunnel | ✅ Validé |
| DEV | rg-bot-legisqc-dev-cae-01 | bot34879c.azurewebsites.net | ✅ Opérationnel |
| PROD | rg-bot-legisqc-prd-cae-01 | TBD | ⏳ À déployer |

## Références

- ADR-021: Nomenclature Resource Groups Azure
- Issue #24: Tests Environnement DEV (référence)
- `infra/azure.bicep`: Template infrastructure
- Guide déploiement: `docs/guides/deployment/production-deployment.md` (Issue #27)
