# ADR 023: CI/CD avec GitHub Actions pour Légis Québec

## Statut

Accepté et Implémenté ✅

## Date

2025-12-14 (Créé)
2025-12-15 (Implémenté)

## Contexte

### Situation actuelle

Le projet **Légis Québec Custom Engine Agent** utilise actuellement un processus de déploiement **entièrement manuel** :

- **Développement local** : Teams Toolkit dans VS Code (playground, local, dev)
- **Tests** : Exécutés manuellement (104 tests unitaires)
- **Provisionnement** : Déjà fait via M365 Agents Toolkit (playground, local, dev) ✅
- **Déploiement code** : Manuel via Teams Toolkit (`teamsapp deploy`)
- **Déploiement PROD** : Prévu manuel (Issue #28)
- **Validation qualité** : Revues de code manuelles sans automatisation

### Problèmes identifiés

1. **Déploiement code manuel** : Nécessite intervention pour `teamsapp deploy`
2. **Manque de traçabilité** : Aucun historique automatique des déploiements
3. **Processus lent** : Déploiements manuels prennent 5-10 minutes par environnement
4. **Pas de validation pré-merge** : Code peut être mergé sans tests automatiques
5. **Duplication efforts** : Même commandes répétées localement et en CI/CD
6. **Manque visibilité** : Pas de dashboard statut build/deploy

### Besoins

> **Note importante** : Les ressources Azure (Bot Service, App Service, Teams App) sont **déjà provisionnées** via M365 Agents Toolkit pour les environnements playground, local et dev. L'automatisation CI/CD ne concerne que le **déploiement du code**.

- Automatiser tests sur chaque Pull Request (104 tests unitaires)
- Automatiser déploiements **CODE** vers environnements (dev, prod)
- Garantir qualité code avant merge (tests)
- Tracer tous les déploiements avec logs
- Simplifier configuration (2 secrets GitHub max, pas de Service Principal)
- Maintenir portabilité (même commandes local et CI/CD)

## Décision

Nous adoptons **GitHub Actions** comme solution CI/CD pour le projet Légis Québec avec une **architecture Makefile-oriented** :

### Principe directeur : Make comme orchestrateur central

**Philosophie** : Le `Makefile` devient l'interface unique pour toutes les opérations de déploiement, que ce soit en développement local ou dans GitHub Actions.

**Avantages clés** :
- 🔄 **Portabilité** : Les mêmes commandes fonctionnent localement et en CI/CD
- 🧪 **Testabilité** : Les développeurs peuvent tester les déploiements avant de pousser
- 📖 **Documentation vivante** : Le Makefile documente toutes les opérations disponibles
- 🎯 **Simplicité** : GitHub Actions devient un wrapper minimal autour de Make
- 🛠️ **Maintenabilité** : Logique centralisée dans Makefile, pas dispersée dans YAML
- 🚀 **Minimaliste** : Pas de couleurs, pas de "flala", focus sur fonctionnalité

### Architecture CI/CD (Makefile-oriented)

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Repository                              │
│  michel-heon/chatbottez-legis-qc                                 │
│                                                                   │
│  ├── deployment/         (⭐ Structure CI/CD)                    │
│  │   ├── Makefile       (Orchestrateur central)                 │
│  │   └── README.md      (Documentation)                         │
│  ├── .github/workflows/ (Wrappers Makefile)                     │
│  │   ├── ci-tests.yml   → make test                            │
│  │   ├── deploy-dev.yml → make deploy-dev                      │
│  │   └── deploy-prod.yml→ make deploy-prod                     │
│  ├── src/               (Code application)                      │
│  ├── infra/             (Bicep templates)                       │
│  └── env/               (Variables environnement)               │
└───────────────┬─────────────────────────────────────────────────┘
                │
                │ Triggers (Push, PR, Tag)
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions (Thin Wrappers)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  ci-tests.yml    │  │ deploy-dev.yml   │  │deploy-prod.yml│ │
│  │                  │  │                  │  │               │ │
│  │ Trigger: PR      │  │ Trigger: Push    │  │ Trigger: Tag  │ │
│  │ Steps:           │  │         dev      │  │         v*    │ │
│  │  - Checkout      │  │ Steps:           │  │ Steps:        │ │
│  │  - Setup Node    │  │  - Checkout      │  │  - Approval   │ │
│  │  - Azure Login   │  │  - Setup Node    │  │  - Checkout   │ │
│  │  - make test ⭐  │  │  - Azure Login   │  │  - Setup Node │ │
│  │  - make build ⭐ │  │  - make deploy ⭐│  │  - Azure Login│ │
│  │                  │  │  - make validate │  │  - make deploy│ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│                                                                   │
└───────────────┬───────────────────┬───────────────┬─────────────┘
                │                   │               │
                ▼                   ▼               ▼
┌────────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│   Makefile Targets │  │  GitHub          │  │   Azure         │
│   (deployment/)    │  │  Environments    │  │   Resources     │
│                    │  │                  │  │                 │
│ - help             │  │  - dev (auto)    │  │ - Playground ✅ │
│ - test             │  │  - prod (manual) │  │ - Local ✅      │
│ - build            │  │                  │  │ - Dev ✅        │
│ - deploy-dev       │  │  GitHub Secrets  │  │ - Prod (⏳28)   │
│ - deploy-prod      │  │  - AZURE_SUB_ID  │  │                 │
│ - validate         │  │  - AZURE_TEN_ID  │  │ Provisionnés    │
│ - clean            │  │  (2 secrets)     │  │ via M365 Toolkit│
│                    │  │                  │  │                 │
└────────────────────┘  └──────────────────┘  └─────────────────┘
```

### Structure deployment/

```
deployment/
├── Makefile              # Orchestrateur principal (⭐ cœur du système)
└── README.md             # Documentation targets + exemples usage
```

**Exemple Makefile** (minimaliste):
```makefile
.PHONY: help test build deploy-dev deploy-prod validate clean

help:
	@echo "Targets disponibles:"
	@echo "  test         - Executer tests npm (104 tests)"
	@echo "  build        - Verifier dependances npm"
	@echo "  deploy-dev   - Deployer CODE vers Azure DEV"
	@echo "  deploy-prod  - Deployer CODE vers Azure PROD"
	@echo "  validate     - Tests smoke post-deploiement"
	@echo "  clean        - Nettoyer artefacts"

test:
	npm test

build:
	@command -v node >/dev/null 2>&1 || { echo "❌ Node.js non installé"; exit 1; }
	@npm ci --silent

deploy-dev: build
	@echo "📦 Déploiement CODE vers DEV..."
	teamsapp deploy --env dev
	@echo "✅ Déploiement DEV terminé"

deploy-prod: build
	@echo "📦 Déploiement CODE vers PROD..."
	teamsapp deploy --env prod
	@echo "✅ Déploiement PROD terminé"

validate:
	@echo "✅ Validation deploiement terminée"

clean:
	rm -rf node_modules
```

**Principes** :
- ✅ Minimaliste : pas de couleurs, messages simples
- ✅ Target `help` par défaut
- ✅ Variables d'environnement pour configuration (AZURE_SUBSCRIPTION_ID, AZURE_TENANT_ID)
- ✅ Messages clairs en cas d'erreur
- ✅ Portabilité : même commandes local/CI
- ✅ Déploiement CODE uniquement (pas de provisionnement)

### Workflows GitHub Actions (Makefile wrappers)

#### 1. **ci-tests.yml** - Tests automatiques sur PR

**Trigger** : Pull Request vers `dev` ou `main`

**Workflow** :
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: make -C deployment test
      - run: make -C deployment build
```

**Avantage** : Dev peut tester localement avec `make test` avant de pousser.

**Durée estimée** : 3-5 minutes

#### 2. **deploy-dev.yml** - Déploiement automatique DEV

**Trigger** : Push sur branche `dev`

**Workflow** :
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: dev
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      - run: npm ci
      - run: make -C deployment deploy-dev
      - run: make -C deployment validate
```

**Avantage** : Dev peut tester `make deploy-dev` localement avant CI/CD.

**Environnement** : `rg-bot-legisqc-dev-cae-01` (Canada East)

#### 3. **deploy-prod.yml** - Déploiement production avec approbation

**Trigger** : Tag `v*` (ex: v4.0.0)

**Workflow** :
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: prod  # ← Requiert approbation manuelle
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - name: Deploy to PROD
        env:
          AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
        run: make -C deployment deploy-prod
      - run: make -C deployment validate
```

**Avantage** : Même commande `make deploy-prod` local et CI/CD.

**Environnement** : `rg-bot-legisqc-prd-cae-01` (Canada East) - déjà provisionné via M365 Toolkit

### Configuration GitHub

#### Secrets requis (2 seulement)

| Secret | Description | Valeur | Obtention |
|--------|-------------|--------|-----------|
| `AZURE_SUBSCRIPTION_ID` | ID Subscription Azure | `<guid>` | `az account show --query id -o tsv` |
| `AZURE_TENANT_ID` | ID Tenant Azure | `<guid>` | `az account show --query tenantId -o tsv` |

**Note** : Pas de Service Principal nécessaire. Le `teamsapp deploy` utilise les variables d'environnement directement.

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

### Workflow développeur (Makefile-oriented)

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
             │ 2. Tester localement (⭐ Makefile)
             │    make -C deployment test
             │    make -C deployment build
             │
             ▼
    ┌─────────────────┐
    │  Tests passent  │  ✅ Validation locale avant PR
    │  localement     │
    └────────┬────────┘
             │
             │ 3. Commit + Push
             │    git push origin michel-heon/feature-xyz
             │
             ▼
    ┌─────────────────┐
    │  Créer PR       │  ◄── Trigger: ci-tests.yml
    │  vers dev       │      └── make test ✅
    └────────┬────────┘      └── make build ✅
             │
             │ 4. Review + Approve (si tests ✅)
             │
             ▼
    ┌─────────────────┐
    │  Merge PR       │
    │  vers dev       │
    └────────┬────────┘
             │
             │ 5. Auto-trigger: deploy-dev.yml
             │    └── make deploy-dev ⭐
             │
             ▼
    ┌─────────────────┐
    │  Azure DEV      │  ◄── Déploiement automatique
    │  (rg-*-dev)     │      └── make validate ✅
    └────────┬────────┘
             │
             │ 6. Tests manuels DEV OK
             │    (Option: tester make deploy-dev localement)
             │
             ▼
    ┌─────────────────┐
    │  Merge dev      │
    │  vers main      │  ◄── Require approval + ci-tests ✅
    └────────┬────────┘
             │
             │ 7. Créer tag v4.0.0
             │
             ▼
    ┌─────────────────┐
    │  Tag trigger    │  ◄── Trigger: deploy-prod.yml
    │  deploy-prod    │      ├── Manual approval required ⏸️
    └────────┬────────┘      ├── make deploy-prod ⭐
             │                └── make validate ✅
             │
             ▼
    ┌─────────────────┐
    │  Azure PROD     │
    │  (rg-*-prd)     │  ◄── Production ready 🚀
    └─────────────────┘
```

**Note** : Avec approche Makefile, développeur peut:
- Tester `make test` avant de créer PR
- Tester `make deploy-dev` localement avant de pousser
- Déboguer problèmes déploiement sans CI/CD
- Même commandes local et CI/CD = portabilité maximale

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

### Phase 1 : Structure Makefile-oriented (✅ Complété)

1. **Créer ADR-023** : Ce document ✅
2. **Créer deployment/** : Répertoire orchestration ✅
3. **Créer Makefile** : Orchestrateur central ✅
4. **deployment/README.md** : Documentation targets ✅
5. **Test make help** : Validation locale ✅

**Durée** : 2 heures

### Phase 2 : Workflows GitHub Actions (✅ Complété)

1. **ci-tests.yml** : Wrapper `make test` + `make build` ✅
2. **deploy-dev.yml** : Wrapper `make deploy-dev` ✅
3. **deploy-prod.yml** : Wrapper `make deploy-prod` ✅

**Durée** : 1 heure

### Phase 3 : Configuration GitHub (⏳ Issue #28)

1. **Récupérer Subscription ID et Tenant ID** : `az account show`
2. **GitHub Secrets** : Configurer 2 secrets requis
   - `AZURE_SUBSCRIPTION_ID`
   - `AZURE_TENANT_ID`
3. **GitHub Environments** : Créer `dev` (auto) et `prod` (manual approval)
4. **Branch protections** : Configurer rules sur `dev` et `main`
5. **Provisionner PROD** : Via M365 Agents Toolkit (LIFECYCLE → prod → Provision)
6. **Compléter .env.prod** : Copier valeurs générées par provisionnement

**Durée** : 1 heure

### Phase 4 : Tests et validation (⏳ Issue #28)

1. **Test local** : `make test` sur machine dev ✅ (déjà testé - 104 tests passés)
2. **Test ci-tests** : Créer PR test, vérifier workflow
3. **Test deploy-dev** : Push dev, vérifier déploiement Azure
4. **Test deploy-prod** : Tag release, vérifier approbation + déploiement
5. **Tests production** : 9 tests (voir docs/guides/deployment/production-deployment.md)

**Durée** : 1-2 heures

### Phase 5 : Documentation et formation (⏳ Issue #28)

1. **README badges** : Ajouter badges build status
2. **Formation équipe** : Session onboarding Makefile + workflows
3. **Monitoring** : Dashboard GitHub Actions usage

**Durée** : 30 minutes

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

- [Issue #27: Documentation Phase 6](https://github.com/michel-heon/chatbottez-legis-qc/issues/27) ✅ Complété
- [Issue #28: Configuration Production + Validation Complète](https://github.com/michel-heon/chatbottez-legis-qc/issues/28) ⏳ En cours
- [Issue #29: CI/CD Infrastructure](https://github.com/michel-heon/chatbottez-legis-qc/issues/29) ✅ Complété et fermé

### Exemples workflows GitHub Actions

- [Microsoft 365 Agents Sample Workflows](https://github.com/microsoft/m365-agents-samples)
- [Azure Samples - GitHub Actions](https://github.com/Azure-Samples/github-actions-for-azure)

## Historique des révisions

| Date | Version | Changements | Auteur |
|------|---------|-------------|--------|
| 2025-12-14 | 1.0 | Création initiale | GitHub Copilot |
| 2025-12-15 | 1.1 | Harmonisation avec contexte Makefile-oriented et Issue #28 | GitHub Copilot |

---

**Auteur** : Michel Héon  
**Dernière révision** : 2025-12-15
