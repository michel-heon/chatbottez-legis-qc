# ADR 021: Nomenclature des Resource Groups Azure

## Statut

✅ Accepté

## Date

2025-12-14

## Contexte

Le projet Légis Québec nécessite la création de ressources Azure pour différents environnements (développement, staging, production). Sans convention de nommage standardisée pour les Resource Groups, nous risquons :

- **Confusion** : Difficulté à identifier rapidement le contenu et l'usage d'un RG
- **Incohérence** : Chaque développeur pourrait adopter son propre format
- **Manque de traçabilité** : Impossible de déterminer le type d'application, l'environnement ou la région
- **Conflits** : Risque de créer des RG avec des noms similaires mais différents
- **Difficulté de maintenance** : Gestion complexe avec des noms non structurés

L'analyse des Resource Groups existants dans notre tenant Azure révèle plusieurs patterns :
- `rg-chatbottez-gpt-4.1-dev-01` (projet-version-env-numéro)
- `rg-kb-builder-01-dev` (workload-numéro-env)
- `rg-legis-qc-poc-5-2-1-b` (projet-type-version)
- `rg-chabottez-legis-qc-01` (projet-numéro)

Cette hétérogénéité complique la gouvernance et l'automatisation. Les conventions Microsoft Azure recommandent d'inclure le type de ressource, le workload, l'environnement et la région pour une identification optimale.

## Décision

Adopter une convention de nommage standardisée pour tous les Resource Groups Azure du projet, alignée avec les **best practices Microsoft** et adaptée à nos besoins.

### Format Standard

```
rg-{type}-{workload}-{env}-{region}-{instance}
```

#### Composants Obligatoires

| Composant | Description | Valeurs | Exemple |
|-----------|-------------|---------|---------|
| **rg** | Préfixe fixe Resource Group | `rg` | `rg` |
| **type** | Type d'application principale | `bot`, `webapp`, `func`, `storage`, `data` | `bot` |
| **workload** | Nom du projet/workload | `legisqc`, `chatbottez`, etc. | `legisqc` |
| **env** | Environnement de déploiement | `dev`, `stg`, `prd`, `poc` | `dev` |
| **region** | Code région Azure (3-4 lettres) | `cae`, `cac`, `eus`, `eus2` | `cae` |
| **instance** | Numéro d'instance (2 chiffres) | `01`, `02`, `03`, etc. | `01` |

#### Codes Région Standards

| Région Azure | Code Court | Exemple Complet |
|--------------|------------|-----------------|
| Canada East | `cae` | `rg-bot-legisqc-dev-cae-01` |
| Canada Central | `cac` | `rg-bot-legisqc-dev-cac-01` |
| East US | `eus` | `rg-bot-legisqc-dev-eus-01` |
| East US 2 | `eus2` | `rg-bot-legisqc-dev-eus2-01` |

#### Types d'Application

| Type | Usage | Exemple RG |
|------|-------|------------|
| `bot` | Bot Framework, Teams Bot, Agents | `rg-bot-legisqc-dev-cae-01` |
| `webapp` | App Service Web Apps | `rg-webapp-portal-dev-cae-01` |
| `func` | Azure Functions | `rg-func-processor-dev-cae-01` |
| `storage` | Storage Accounts, Blob | `rg-storage-assets-dev-cae-01` |
| `data` | Databases, Cosmos DB, Search | `rg-data-legisqc-dev-cae-01` |
| `ai` | Azure OpenAI, Cognitive Services | `rg-ai-services-dev-cae-01` |

#### Environnements

| Code | Environnement | Usage |
|------|---------------|-------|
| `dev` | Development | Développement actif, tests internes |
| `stg` | Staging | Tests d'intégration, validation pré-production |
| `prd` | Production | Environnement de production stable |
| `poc` | Proof of Concept | Expérimentations, prototypes |
| `qa` | Quality Assurance | Tests automatisés, validation qualité |

### Exemples Concrets

#### ✅ Formats Conformes

```bash
# Bot Légis Québec - Développement
rg-bot-legisqc-dev-cae-01

# Bot Légis Québec - Staging
rg-bot-legisqc-stg-cae-01

# Bot Légis Québec - Production
rg-bot-legisqc-prd-cae-01

# Data/Storage pour Légis Québec
rg-data-legisqc-dev-cae-01

# Azure Functions pour traitement
rg-func-legisqc-dev-cae-01

# Instance 02 (scaling ou DR)
rg-bot-legisqc-prd-cae-02
rg-bot-legisqc-prd-eus2-01  # Disaster Recovery dans East US 2
```

#### ❌ Formats Non Conformes

```bash
# ÉVITER (manque type)
rg-legisqc-dev-01

# ÉVITER (manque région)
rg-bot-legisqc-dev-01

# ÉVITER (manque instance)
rg-bot-legisqc-dev-cae

# ÉVITER (ordre incorrect)
rg-dev-legisqc-bot-cae-01

# ÉVITER (nom non standardisé)
rg-chatbot-quebec-development-canadaeast-1
```

### Commandes Azure CLI

#### Création d'un Resource Group Conforme

```bash
# Template
az group create \
  --name rg-{type}-{workload}-{env}-{region}-{instance} \
  --location {azure-region}

# Exemple: Légis Québec DEV
az group create \
  --name rg-bot-legisqc-dev-cae-01 \
  --location canadaeast \
  --tags \
    Project=LegisQuebec \
    Environment=dev \
    CostCenter=AI-Teams \
    Owner=michel-heon \
    Type=bot

# Exemple: Production avec tags complets
az group create \
  --name rg-bot-legisqc-prd-cae-01 \
  --location canadaeast \
  --tags \
    Project=LegisQuebec \
    Environment=production \
    CostCenter=AI-Teams \
    Owner=michel-heon \
    Type=bot \
    Criticality=High \
    DataClassification=Internal
```

#### Lister les RG par Environnement

```bash
# Tous les RG de développement
az group list --query "[?tags.Environment=='dev'].name" -o table

# Tous les RG Légis Québec
az group list --query "[?contains(name, 'legisqc')].{Name:name, Location:location, Env:tags.Environment}" -o table
```

### Intégration avec Teams Toolkit

Dans `env/.env.dev`, `env/.env.stg`, `env/.env.prd` :

```bash
# env/.env.dev
AZURE_RESOURCE_GROUP_NAME=rg-bot-legisqc-dev-cae-01
AZURE_LOCATION=canadaeast

# env/.env.stg
AZURE_RESOURCE_GROUP_NAME=rg-bot-legisqc-stg-cae-01
AZURE_LOCATION=canadaeast

# env/.env.prd
AZURE_RESOURCE_GROUP_NAME=rg-bot-legisqc-prd-cae-01
AZURE_LOCATION=canadaeast
```

### Tags Azure Obligatoires

Pour tous les Resource Groups, appliquer les tags suivants :

| Tag | Description | Exemple |
|-----|-------------|---------|
| `Project` | Nom du projet | `LegisQuebec` |
| `Environment` | Environnement | `dev`, `stg`, `prd` |
| `CostCenter` | Centre de coûts | `AI-Teams` |
| `Owner` | Responsable | `michel-heon` |
| `Type` | Type d'application | `bot`, `webapp`, etc. |

Tags optionnels mais recommandés pour production :

| Tag | Description | Exemple |
|-----|-------------|---------|
| `Criticality` | Niveau de criticité | `Low`, `Medium`, `High` |
| `DataClassification` | Classification données | `Public`, `Internal`, `Confidential` |
| `BackupPolicy` | Politique de backup | `Daily`, `Weekly`, `None` |
| `MaintenanceWindow` | Fenêtre de maintenance | `Sunday-02:00-06:00` |

## Conséquences

### Positives ✅

1. **Clarté instantanée** : Le nom révèle type, workload, environnement, région et instance
2. **Conformité Microsoft** : Alignement avec les best practices Azure officielles
3. **Scalabilité** : Support multi-région et multi-instance natif
4. **Filtrage facile** : Requêtes Azure CLI simplifiées par pattern
5. **Automatisation** : Scripts et IaC peuvent générer les noms automatiquement
6. **Gouvernance** : Tags obligatoires facilitent la gestion des coûts et accès
7. **Disaster Recovery** : Identification claire des RG primaires et DR
8. **Documentation auto-portée** : Le nom documente lui-même le contenu

### Négatives ⚠️

1. **Noms plus longs** : `rg-bot-legisqc-dev-cae-01` (29 caractères) vs `rg-legisqc-dev` (15 caractères)
2. **Rigidité** : Nécessite discipline pour respecter le format strict
3. **Migration** : Renommage impossible dans Azure (nécessite recréation pour les RG existants)
4. **Apprentissage** : Courbe d'apprentissage pour mémoriser les codes région et types

### Mitigations 🔧

1. **Templates de scripts** : Fournir des scripts bash/PowerShell pour générer les noms
2. **Validation CI/CD** : Vérifier la conformité des noms dans les pipelines
3. **Documentation** : Maintenir la liste des codes et exemples dans cet ADR
4. **Aliases** : Créer des aliases bash pour les commandes fréquentes
5. **Variables d'environnement** : Utiliser `.env.*` pour centraliser les noms

```bash
# Exemple d'alias ~/.bashrc
alias az-rg-create-dev='f() { az group create --name "rg-bot-legisqc-dev-cae-$1" --location canadaeast; }; f'
# Usage: az-rg-create-dev 01
```

## Alternatives Considérées

### Alternative 1 : Format Court sans Région

**Format** : `rg-{type}-{workload}-{env}-{instance}`

**Exemple** : `rg-bot-legisqc-dev-01`

**Rejeté car** :
- ❌ Impossible de distinguer les RG multi-régions
- ❌ Complexifie le Disaster Recovery
- ❌ Non conforme aux recommandations Microsoft pour entreprises

### Alternative 2 : Format Long avec Séparateurs Multiples

**Format** : `rg_{type}_{workload}_{env}_{region}_{instance}`

**Exemple** : `rg_bot_legisqc_dev_cae_01`

**Rejeté car** :
- ❌ Underscores moins lisibles que tirets
- ❌ Non conforme au standard Microsoft (préfère tirets)
- ❌ Moins courant dans l'écosystème Azure

### Alternative 3 : Préfixe Projet Avant Type

**Format** : `rg-{workload}-{type}-{env}-{region}-{instance}`

**Exemple** : `rg-legisqc-bot-dev-cae-01`

**Rejeté car** :
- ❌ Difficulté de filtrage par type d'application
- ❌ Tri alphabétique moins intuitif (groupe par projet plutôt que par type)
- ❌ Microsoft recommande type en premier pour regroupement logique

### Alternative 4 : Utiliser Resource Group Existant

**Option** : Réutiliser `rg-chabottez-legis-qc-01`

**Rejeté car** :
- ❌ Typo "chabottez" vs "chatbottez" (incohérence)
- ❌ Manque environnement, région, type dans le nom
- ❌ Non extensible pour staging/production

## Références

- [Microsoft Azure Naming Conventions](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-naming)
- [Azure Resource Abbreviations](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-abbreviations)
- [Azure Tagging Strategy](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-tagging)
- ADR-001: Git Workflow et Stratégie de Versioning (pour cohérence nomenclature)

## Historique des Révisions

| Date | Version | Changements | Auteur |
|------|---------|-------------|--------|
| 2025-12-14 | 1.0 | Création initiale | Michel Héon |

---

**Note** : Cet ADR est vivant et sera mis à jour si de nouveaux besoins ou patterns émergent.
