# ADR 023: CI/CD avec GitHub Actions pour Légis Québec

## Statut

Proposé

## Date

2025-12-14

## Contexte

### Situation actuelle

Le projet **Légis Québec Custom Engine Agent** utilise actuellement un processus de déploiement **entièrement manuel** :

- **Développement local** : Teams Toolkit dans VS Code avec commandes manuelles
- **Tests** : Exécutés manuellement (10 tests local + 12 tests Azure DEV)
- **Déploiement DEV** : Provision et Deploy manuels via Teams Toolkit
- **Déploiement PROD** : Prévu manuel (Issue #28)
- **Validation qualité** : Revues de code manuelles sans automatisation

### Problèmes identifiés

1. **Risque erreurs humaines** : Oubli de tests, mauvaise configuration, déploiement code non testé
2. **Manque de traçabilité** : Aucun historique automatique des déploiements
3. **Processus lent** : Tests et déploiements manuels prennent 30-45 minutes
4. **Pas de validation pré-merge** : Code peut être mergé sans tests automatiques
5. **Rollback complexe** : Retour arrière nécessite intervention manuelle
6. **Manque visibilité** : Pas de dashboard statut build/deploy

### Besoins

- Automatiser tests sur chaque Pull Request
- Automatiser déploiements vers environnements (dev, staging, prod)
- Garantir qualité code avant merge (linting, tests, coverage)
- Tracer tous les déploiements avec logs
- Faciliter rollback en cas d'échec
- Notifier équipe en cas d'échec build/deploy

## Décision

Nous adoptons **GitHub Actions** comme solution CI/CD pour le projet Légis Québec avec l'architecture suivante :

### Architecture CI/CD

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Repository                              │
│  michel-heon/chatbottez-legis-qc                                 │
└───────────────┬─────────────────────────────────────────────────┘
                │
                │ Triggers (Push, PR, Tag)
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflows                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  ci-tests.yml    │  │ deploy-dev.yml   │  │deploy-prod.yml│ │
│  │                  │  │                  │  │               │ │
│  │ Trigger: PR      │  │ Trigger: Push    │  │ Trigger: Tag  │ │
│  │ Jobs:            │  │         dev      │  │         v*    │ │
│  │  - Lint          │  │ Jobs:            │  │ Jobs:         │ │
│  │  - Build         │  │  - Deploy DEV    │  │  - Approval   │ │
│  │  - Unit tests    │  │  - Smoke tests   │  │  - Deploy     │ │
│  │  - Integration   │  │  - Notify        │  │  - Smoke      │ │
│  │  - Coverage      │  │                  │  │  - Rollback?  │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│                                                                   │
└───────────────┬───────────────────┬───────────────┬─────────────┘
                │                   │               │
                ▼                   ▼               ▼
┌────────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│   GitHub Secrets   │  │  GitHub          │  │   Azure         │
│                    │  │  Environments    │  │   Resources     │
│ - AZURE_CREDS      │  │                  │  │                 │
│ - AZURE_SUB_ID     │  │  - dev (auto)    │  │ - DEV (rg-*-dev)│
│ - OPENAI_KEY       │  │  - prod (manual) │  │ - PROD(rg-*-prd)│
│ - SEARCH_KEY       │  │                  │  │                 │
└────────────────────┘  └──────────────────┘  └─────────────────┘
```

### Workflows définis

#### 1. **ci-tests.yml** - Tests automatiques sur PR

**Trigger** : Pull Request vers `dev` ou `main`

**Jobs** :
1. **lint** : ESLint + Prettier
2. **build** : `npm run build` sans erreurs
3. **unit-tests** : Tests unitaires avec Jest
4. **integration-tests** : Tests d'intégration (RAG, commands, moderation)
5. **coverage** : Rapport coverage (objectif > 70%)
6. **comment-pr** : Commentaire automatique avec résultats

**Critères succès** : Tous les jobs passent ✅

#### 2. **deploy-dev.yml** - Déploiement automatique DEV

**Trigger** : Push sur branche `dev`

**Jobs** :
1. **deploy-azure-dev** : Teams Toolkit provision + deploy → Azure DEV
2. **smoke-tests** : Tests basiques (bot répond, RAG fonctionne)
3. **notify-success** : Notification succès (Slack/Teams)
4. **notify-failure** : Notification échec avec logs

**Environnement** : `rg-bot-legisqc-dev-cae-01` (Canada East)

#### 3. **deploy-prod.yml** - Déploiement production avec approbation

**Trigger** : Tag `v*` (ex: v4.0.0) OU Push sur `main`

**Jobs** :
1. **manual-approval** : Approbation manuelle requise (reviewers GitHub)
2. **deploy-azure-prod** : Teams Toolkit provision + deploy → Azure PROD
3. **smoke-tests-prod** : 9 tests production (Issue #28)
4. **rollback-on-failure** : Rollback automatique si tests échouent
5. **notify-team** : Notification équipe (succès/échec)

**Environnement** : `rg-bot-legisqc-prd-cae-01` (Canada East)

### Configuration GitHub

#### Secrets requis

| Secret | Description | Valeur |
|--------|-------------|--------|
| `AZURE_CREDENTIALS` | Service Principal JSON | `{"clientId":"...","clientSecret":"...","subscriptionId":"...","tenantId":"..."}` |
| `AZURE_SUBSCRIPTION_ID` | ID Subscription Azure | `<guid>` |
| `AZURE_OPENAI_API_KEY` | Clé API Azure OpenAI | `<key>` |
| `AZURE_OPENAI_ENDPOINT` | Endpoint OpenAI | `https://openai-cotechnoe.openai.azure.com/` |
| `AZURE_SEARCH_KEY` | Clé Azure AI Search | `<key>` |
| `AZURE_SEARCH_ENDPOINT` | Endpoint Search | `https://search-cotechnoe-ai.search.windows.net` |
| `SLACK_WEBHOOK_URL` | Webhook notifications Slack | `https://hooks.slack.com/...` (optionnel) |

#### Environments GitHub

| Environment | Protection | Reviewers | Usage |
|-------------|------------|-----------|-------|
| `dev` | Aucune | - | Déploiement automatique sur push dev |
| `prod` | Approbation requise | @michel-heon | Déploiement production sur tag/main |

#### Branch protections

**Branche `main`** :
- ✅ Require pull request avant merge
- ✅ Require 1 approbation minimum
- ✅ Require status checks pass (ci-tests.yml)
- ✅ Require conversation resolution
- ❌ Disable force push
- ❌ Disable branch deletion

**Branche `dev`** :
- ✅ Require status checks pass (ci-tests.yml)
- ❌ No PR required (pour rapidité développement)

### Workflow développeur

```
┌──────────────────────────────────────────────────────────────┐
│  Développeur                                                  │
└──────────┬───────────────────────────────────────────────────┘
           │
           │ 1. Créer branche feature
           │    git checkout -b michel-heon/feature-xyz
           │
           ▼
    ┌─────────────────┐
    │  Développement  │
    │  local          │
    └────────┬────────┘
             │
             │ 2. Commit + Push
             │    git push origin michel-heon/feature-xyz
             │
             ▼
    ┌─────────────────┐
    │  Créer PR       │  ◄── Trigger: ci-tests.yml
    │  vers dev       │      ├── Lint ✅
    └────────┬────────┘      ├── Build ✅
             │                ├── Tests ✅
             │                └── Coverage ✅
             │
             │ 3. Review + Approve (si tests ✅)
             │
             ▼
    ┌─────────────────┐
    │  Merge PR       │
    │  vers dev       │
    └────────┬────────┘
             │
             │ 4. Auto-trigger: deploy-dev.yml
             │
             ▼
    ┌─────────────────┐
    │  Azure DEV      │  ◄── Déploiement automatique
    │  (rg-*-dev)     │      └── Tests smoke ✅
    └────────┬────────┘
             │
             │ 5. Tests manuels DEV OK
             │
             ▼
    ┌─────────────────┐
    │  Merge dev      │
    │  vers main      │  ◄── Require approval + ci-tests ✅
    └────────┬────────┘
             │
             │ 6. Créer tag v4.0.0
             │
             ▼
    ┌─────────────────┐
    │  Tag trigger    │  ◄── Trigger: deploy-prod.yml
    │  deploy-prod    │      ├── Manual approval required ⏸️
    └────────┬────────┘      ├── Deploy PROD ✅
             │                ├── Tests smoke ✅
             │                └── Notify team 📧
             │
             ▼
    ┌─────────────────┐
    │  Azure PROD     │
    │  (rg-*-prd)     │  ◄── Production ready 🚀
    └─────────────────┘
```

## Alternatives considérées

### Alternative 1 : Azure DevOps Pipelines

**Avantages** :
- Intégration native avec Azure (ARM, Bicep)
- Artifacts management robuste
- Azure Boards intégration pour tracking

**Inconvénients** :
- ❌ Nécessite compte Azure DevOps séparé
- ❌ Courbe d'apprentissage plus élevée
- ❌ Moins adapté pour repos GitHub (duplication)
- ❌ Moins de communauté/actions disponibles

**Raison rejet** : Projet déjà sur GitHub, GitHub Actions plus simple et direct

### Alternative 2 : Jenkins auto-hébergé

**Avantages** :
- Contrôle total infrastructure
- Pas de limites minutes CI/CD
- Plugins extensifs disponibles

**Inconvénients** :
- ❌ Nécessite maintenir serveur Jenkins
- ❌ Coûts infrastructure supplémentaires
- ❌ Configuration complexe
- ❌ Pas d'intégration native GitHub

**Raison rejet** : Overhead opérationnel trop élevé pour petite équipe

### Alternative 3 : GitLab CI/CD

**Avantages** :
- Plateforme complète (repo + CI/CD)
- Bonne intégration Kubernetes
- Auto DevOps features

**Inconvénients** :
- ❌ Nécessite migration vers GitLab
- ❌ Perte intégration GitHub ecosystem
- ❌ Coûts supplémentaires (GitLab Premium)

**Raison rejet** : Projet déjà établi sur GitHub, migration non justifiée

### Alternative 4 : Déploiement manuel (statu quo)

**Avantages** :
- Aucune configuration CI/CD nécessaire
- Contrôle total processus
- Pas de dépendance service externe

**Inconvénients** :
- ❌ Erreurs humaines fréquentes
- ❌ Processus lent (30-45 min/déploiement)
- ❌ Pas de traçabilité automatique
- ❌ Scaling difficile avec équipe grandissante

**Raison rejet** : Non viable long terme, risques qualité trop élevés

## Conséquences

### Positives ✅

1. **Qualité code garantie**
   - Tests automatiques sur chaque PR
   - Linting et formatting obligatoires
   - Coverage tracking automatique
   - Empêche merge code cassé

2. **Déploiements fiables**
   - Process standardisé et reproductible
   - Tests smoke post-déploiement automatiques
   - Rollback automatique en cas échec
   - Traçabilité complète (logs GitHub Actions)

3. **Rapidité développement**
   - Déploiements DEV automatiques (< 10 min)
   - Feedback rapide sur PR (tests en parallèle)
   - Moins de temps attente validation manuelle
   - Focus développeurs sur features, pas DevOps

4. **Visibilité équipe**
   - Dashboard GitHub Actions (status builds)
   - Badges README (build status, coverage)
   - Notifications échecs (Slack/email)
   - Historique déploiements consultable

5. **Sécurité améliorée**
   - Secrets centralisés dans GitHub (pas en clair)
   - Service Principal Azure avec permissions minimales
   - Branch protections empêchent bypass
   - Audit trail complet

6. **Coût maîtrisé**
   - GitHub Actions gratuit pour repos publics
   - 2000 minutes/mois pour repos privés
   - Pas d'infrastructure CI/CD à maintenir
   - ROI positif (économie temps développeurs)

### Négatives ❌

1. **Dépendance GitHub**
   - Si GitHub Actions indisponible, pas de CI/CD
   - Vendor lock-in GitHub ecosystem
   - Besoin migration si changement plateforme

2. **Limites minutes CI/CD**
   - 2000 min/mois pour repos privés (suffisant court terme)
   - Coûts additionnels si dépassement
   - Besoin monitoring utilisation

3. **Courbe apprentissage**
   - Équipe doit apprendre syntaxe GitHub Actions
   - Debugging workflows plus complexe que scripts
   - Documentation workflows nécessaire

4. **Configuration initiale**
   - Setup secrets GitHub (30 min)
   - Configuration environments (15 min)
   - Création workflows YAML (2-3 heures)
   - Tests validation (1-2 heures)
   - **Investissement initial : ~0.5 jour**

5. **Maintenance**
   - Workflows YAML à maintenir (updates, fixes)
   - Surveillance échecs intermittents
   - Rotation secrets périodique
   - **Effort continu : ~2 heures/mois**

### Risques et mitigations

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| GitHub Actions indisponible | Haut | Faible | Fallback : déploiement manuel documenté |
| Secrets compromis | Critique | Faible | Rotation régulière, permissions minimales |
| Tests faux positifs | Moyen | Moyen | Revue tests régulière, monitoring qualité |
| Dépassement minutes CI/CD | Faible | Faible | Monitoring usage, optimisation workflows |
| Erreurs config workflows | Moyen | Moyen | Tests staging, revue peer, documentation |

## Implémentation

### Phase 1 : Documentation et setup (0.5 jour)

1. **Créer ADR-023** : Ce document ✅
2. **Créer guide** : `docs/guides/deployment/ci-cd-setup.md`
3. **Service Principal Azure** : Créer SP avec permissions déploiement
4. **GitHub Secrets** : Configurer 7 secrets requis
5. **GitHub Environments** : Créer `dev` et `prod`

### Phase 2 : Workflows CI/CD (1 jour)

1. **ci-tests.yml** : Tests automatiques PR (2 heures)
2. **deploy-dev.yml** : Déploiement auto DEV (2 heures)
3. **deploy-prod.yml** : Déploiement manuel PROD (3 heures)
4. **Branch protections** : Configurer rules (30 min)

### Phase 3 : Tests et validation (0.5 jour)

1. **Test ci-tests** : Créer PR test, vérifier exécution
2. **Test deploy-dev** : Push dev, vérifier déploiement Azure
3. **Test deploy-prod** : Tag release, vérifier approbation + déploiement
4. **Documentation** : README badges, troubleshooting

### Phase 4 : Déploiement et monitoring (continu)

1. **Activer workflows** : Enable pour toute l'équipe
2. **Formation équipe** : Session onboarding workflows
3. **Monitoring** : Dashboard usage, alertes échecs
4. **Optimisation** : Amélioration continue workflows

## Métriques de succès

### Objectifs quantitatifs

| Métrique | Avant | Objectif | Méthode mesure |
|----------|-------|----------|----------------|
| Temps déploiement DEV | 30-45 min | < 10 min | GitHub Actions logs |
| Temps déploiement PROD | 45-60 min | < 15 min | GitHub Actions logs |
| Taux échec déploiement | N/A | < 5% | Historique GitHub Actions |
| Couverture tests | N/A | > 70% | Jest coverage report |
| PRs sans tests | 100% | 0% | Branch protections |
| Temps feedback PR | N/A | < 5 min | GitHub Actions duration |

### Objectifs qualitatifs

- ✅ Tous les PRs passent tests automatiques avant merge
- ✅ Aucun déploiement PROD sans approbation manuelle
- ✅ Équipe confiante dans process CI/CD
- ✅ Documentation workflows complète et à jour
- ✅ Zéro secrets en clair dans repo

## Références

### Documentation officielle

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions - Security hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Azure Login Action](https://github.com/Azure/login)
- [Azure Web App Deploy Action](https://github.com/Azure/webapps-deploy)

### Documentation interne

- [ADR-007: Déploiement Microsoft 365 Agents Toolkit CLI](./007-deploiement-toolkit-cli.md)
- [ADR-012: Pratiques Développement Toolkit](./012-pratiques-developpement-toolkit.md) (section 9: CI/CD)
- [ADR-021: Nomenclature Resource Groups Azure](./021-nomenclature-resource-groups-azure.md)
- [Guide: Production Deployment](../guides/deployment/production-deployment.md)

### Issues GitHub

- [Issue #27: Documentation Phase 6](https://github.com/michel-heon/chatbottez-legis-qc/issues/27)
- [Issue #28: Déploiement Production](https://github.com/michel-heon/chatbottez-legis-qc/issues/28)
- [Issue #29: CI/CD - Automatisation Déploiement](https://github.com/michel-heon/chatbottez-legis-qc/issues/29)

### Exemples workflows GitHub Actions

- [Microsoft 365 Agents Sample Workflows](https://github.com/microsoft/m365-agents-samples)
- [Azure Samples - GitHub Actions](https://github.com/Azure-Samples/github-actions-for-azure)

## Historique des révisions

| Date | Version | Changements | Auteur |
|------|---------|-------------|--------|
| 2025-12-14 | 1.0 | Création initiale | GitHub Copilot |

---

**Auteur** : Michel Héon  
**Dernière révision** : 2025-12-14
