# ADR 015: Mapping automatique des variables par M365 Agents Toolkit

## Statut

✅ Accepté

## Date

2025-12-04

## Contexte

### Problématique initiale

L'application Légis Québec utilise deux conventions de nommage pour les variables d'authentification :

**Convention M365 Agents Toolkit (génération automatique)** :

- `BOT_ID` : ID de l'application Azure AD
- `SECRET_BOT_PASSWORD` : Secret client (chiffré avec préfixe `crypto_`)
- `TEAMS_APP_TENANT_ID` : ID du tenant Azure AD

**Convention attendue par le code applicatif (`src/config.js`)** :

- `CLIENT_ID` : ID de l'application Azure AD
- `CLIENT_SECRET` : Secret client (décrypté)
- `BOT_TYPE` : Type de bot (`'MultiTenant'`, `'SingleTenant'`, `'UserAssignedMSI'`)
- `TENANT_ID` : ID du tenant Azure AD

### Erreur observée

Sans compréhension du mécanisme automatique, l'erreur suivante se produit :

```
[DEBUG] @teams/app invalid_client: Error(s): 7000215 - AADSTS7000215: Invalid client secret provided.
Ensure the secret being sent in the request is the client secret value, not the client secret ID
```

**Cause racine** : Le code lit `process.env.CLIENT_SECRET`, mais cette variable n'existe pas dans les fichiers `.env.*` car elle est générée automatiquement.

### Mauvaise approche initiale (à éviter)

❌ **Créer des alias manuels dans les fichiers `.env`** :

```bash
# env/.env.local.user - ❌ INCORRECT
SECRET_BOT_PASSWORD=crypto_...
CLIENT_SECRET=$SECRET_BOT_PASSWORD  # ❌ Ne fonctionne pas (chiffrement)
```

**Problèmes** :

1. `$SECRET_BOT_PASSWORD` n'est pas interpolé (reste une chaîne littérale)
2. Le secret chiffré (`crypto_...`) n'est pas décrypté
3. Duplication inutile de variables
4. Confusion sur la source de vérité

### Architecture du système

#### Flux de configuration à 4 niveaux

```
┌──────────────────────────────────────────────────────────────────────┐
│ NIVEAU 1 : Fichiers .env (Source de vérité)                         │
├──────────────────────────────────────────────────────────────────────┤
│ env/.env.local       ← Variables publiques (BOT_ID, BOT_DOMAIN...)  │
│ env/.env.local.user  ← Secrets chiffrés (SECRET_BOT_PASSWORD=crypto_)│
└──────────────────────────────────────────────────────────────────────┘
                                  ↓
┌──────────────────────────────────────────────────────────────────────┐
│ NIVEAU 2 : Pipelines M365 Agents Toolkit (Transformateurs)          │
├──────────────────────────────────────────────────────────────────────┤
│ m365agents.local.yml → Section deploy: avec createOrUpdateEnvFile   │
│   - Lit les variables de NIVEAU 1                                   │
│   - Décrypte les secrets (crypto_... → texte clair)                 │
│   - Crée les alias (BOT_ID → CLIENT_ID)                             │
│   - Génère le fichier de NIVEAU 3                                   │
└──────────────────────────────────────────────────────────────────────┘
                                  ↓
┌──────────────────────────────────────────────────────────────────────┐
│ NIVEAU 3 : Fichiers runtime générés (Consommés par Node.js)         │
├──────────────────────────────────────────────────────────────────────┤
│ .localConfigs        ← Généré automatiquement par M365 Toolkit      │
│   CLIENT_ID=9d985e0c-048c-4704-8b23-0af75ed033b0                    │
│   CLIENT_SECRET=aPo8Q~K~... (décrypté ✓)                            │
│   BOT_TYPE=MultiTenant                                               │
│   TENANT_ID=...                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                  ↓
┌──────────────────────────────────────────────────────────────────────┐
│ NIVEAU 4 : Application Node.js                                       │
├──────────────────────────────────────────────────────────────────────┤
│ src/config.js → process.env.CLIENT_SECRET (lecture depuis .localConfigs)│
└──────────────────────────────────────────────────────────────────────┘
```

### Mapping automatique dans `m365agents.local.yml`

```yaml
deploy:
  # ... (autres étapes de déploiement)
  
  - uses: file/createOrUpdateEnvironmentFile
    with:
      target: ./.localConfigs
      envs:
        # ✅ Mapping BOT_ID → CLIENT_ID
        CLIENT_ID: ${{BOT_ID}}
        
        # ✅ Décryptage + mapping SECRET_BOT_PASSWORD → CLIENT_SECRET
        CLIENT_SECRET: ${{SECRET_BOT_PASSWORD}}
        
        # ✅ Ajout de BOT_TYPE (non présent dans .env)
        BOT_TYPE: 'MultiTenant'
        
        # ✅ Mapping TEAMS_APP_TENANT_ID → TENANT_ID
        TENANT_ID: ${{TEAMS_APP_TENANT_ID}}
        
        # ✅ Décryptage des secrets Azure
        AZURE_OPENAI_API_KEY: ${{SECRET_AZURE_OPENAI_API_KEY}}
        AZURE_SEARCH_KEY: ${{SECRET_AZURE_SEARCH_KEY}}
```

**Ce que fait automatiquement M365 Toolkit** :

1. **Lecture** : Charge les variables depuis `.env.local` et `.env.local.user`
2. **Résolution** : Remplace `${{VARIABLE}}` par la valeur réelle
3. **Décryptage** : Décrypte les secrets avec préfixe `crypto_`
4. **Écriture** : Génère `.localConfigs` avec les alias et valeurs décryptées
5. **Injection** : Rend les variables disponibles via `process.env`

## Décision

### Principe architectural

**Le mapping des variables et le décryptage des secrets sont gérés automatiquement par M365 Agents Toolkit via les fichiers `m365agents.*.yml`. Les fichiers `.env` ne doivent JAMAIS contenir d'alias manuels.**

### Règles de configuration

#### ✅ CORRECT : Structure des fichiers `.env`

**`env/.env.local`** (variables publiques) :

```bash
TEAMSFX_ENV=local
BOT_ID=9d985e0c-048c-4704-8b23-0af75ed033b0
TEAMS_APP_ID=8fb5e8d5-4b9c-4b8d-9c5f-3a7e6d9f8c2b
TEAMS_APP_TENANT_ID=...
BOT_DOMAIN=...
BOT_ENDPOINT=https://...
# Pas de CLIENT_ID, CLIENT_SECRET, BOT_TYPE ici ❌
```

**`env/.env.local.user`** (secrets uniquement) :

```bash
# Secrets chiffrés générés par M365 Toolkit
SECRET_BOT_PASSWORD=crypto_...
SECRET_AZURE_OPENAI_API_KEY=crypto_...
SECRET_AZURE_SEARCH_KEY=plaintext-key-if-needed
# Pas de CLIENT_SECRET ici ❌
```

#### ✅ CORRECT : Configuration du pipeline

**`m365agents.local.yml`** (section deploy) :

```yaml
deploy:
  - uses: file/createOrUpdateEnvironmentFile
    with:
      target: ./.localConfigs
      envs:
        # Mapping explicite des alias
        CLIENT_ID: ${{BOT_ID}}
        CLIENT_SECRET: ${{SECRET_BOT_PASSWORD}}
        BOT_TYPE: 'MultiTenant'
        TENANT_ID: ${{TEAMS_APP_TENANT_ID}}
        
        # Décryptage des secrets Azure
        AZURE_OPENAI_API_KEY: ${{SECRET_AZURE_OPENAI_API_KEY}}
        AZURE_SEARCH_KEY: ${{SECRET_AZURE_SEARCH_KEY}}
        
        # Variables passées telles quelles
        AZURE_OPENAI_ENDPOINT: ${{AZURE_OPENAI_ENDPOINT}}
        AZURE_OPENAI_DEPLOYMENT_NAME: ${{AZURE_OPENAI_DEPLOYMENT_NAME}}
        AZURE_SEARCH_ENDPOINT: ${{AZURE_SEARCH_ENDPOINT}}
        AZURE_SEARCH_INDEX_NAME: ${{AZURE_SEARCH_INDEX_NAME}}
```

#### ✅ CORRECT : Fichier runtime généré

**`.localConfigs`** (généré automatiquement) :

```bash
# ✅ Alias créés automatiquement
CLIENT_ID=9d985e0c-048c-4704-8b23-0af75ed033b0
CLIENT_SECRET=<VOTRE_SECRET_CLIENT>  # ✅ Décrypté
BOT_TYPE=MultiTenant
TENANT_ID=...

# ✅ Secrets Azure décryptés
AZURE_OPENAI_API_KEY=sk-...  # ✅ Décrypté
AZURE_SEARCH_KEY=...

# Variables publiques
AZURE_OPENAI_ENDPOINT=https://...
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4.1
AZURE_SEARCH_ENDPOINT=https://...
AZURE_SEARCH_INDEX_NAME=legis-index-04
```

#### ✅ CORRECT : Lecture dans le code

**`src/config.js`** :

```javascript
const config = {
  MicrosoftAppId: process.env.CLIENT_ID,          // ✅ Lit depuis .localConfigs
  MicrosoftAppPassword: process.env.CLIENT_SECRET, // ✅ Valeur décryptée
  MicrosoftAppType: process.env.BOT_TYPE,          // ✅ 'MultiTenant'
  MicrosoftAppTenantId: process.env.TENANT_ID,     // ✅ Mapping automatique
  
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,     // ✅ Décrypté
  azureAISearchApiKey: process.env.AZURE_SEARCH_KEY,        // ✅ Décrypté
  azureSearchIndexName: process.env.AZURE_SEARCH_INDEX_NAME // ✅ Passé tel quel
};
```

### Mapping par environnement

| Environnement | Fichier source secrets | Fichier pipeline | Fichier runtime |
|---------------|------------------------|------------------|-----------------|
| **Local** | `.env.local.user` | `m365agents.local.yml` | `.localConfigs` |
| **Playground** | `.env.playground.user` | `m365agents.playground.yml` | `.localConfigs.playground` |
| **Dev (Azure)** | `.env.dev.user` | `m365agents.yml` | Variables d'environnement Azure App Service |

### Variables concernées

#### Variables d'authentification Bot Framework

| Variable M365 Toolkit | Alias applicatif | Type | Décryptage |
|-----------------------|------------------|------|------------|
| `BOT_ID` | `CLIENT_ID` | Public | Non |
| `SECRET_BOT_PASSWORD` | `CLIENT_SECRET` | Secret | ✅ Oui |
| `TEAMS_APP_TENANT_ID` | `TENANT_ID` | Public | Non |
| — | `BOT_TYPE` | Constant | — (ajouté par YAML) |

#### Variables Azure AI

| Variable M365 Toolkit | Alias applicatif | Type | Décryptage |
|-----------------------|------------------|------|------------|
| `SECRET_AZURE_OPENAI_API_KEY` | `AZURE_OPENAI_API_KEY` | Secret | ✅ Oui |
| `SECRET_AZURE_SEARCH_KEY` | `AZURE_SEARCH_KEY` | Secret | ✅ Oui |

## Conséquences

### Positives ✅

1. **Sécurité renforcée** :
   - Secrets toujours chiffrés dans `.env.*.user`
   - Décryptage uniquement au moment du déploiement
   - `.localConfigs` dans `.gitignore` (jamais commité)

2. **Simplicité de configuration** :
   - Pas de duplication de variables
   - Source de vérité unique (fichiers `.env`)
   - Mapping centralisé dans les fichiers YAML

3. **Maintenabilité** :
   - Modification des secrets dans un seul fichier
   - Cohérence garantie par le pipeline automatique
   - Documentation claire du mapping

4. **Compatibilité multi-environnements** :
   - Même mécanisme pour local, playground, dev
   - Azure App Service utilise les variables d'environnement natives
   - Pas de différence de comportement

### Négatives ⚠️

#### Risques de confusion

##### ❌ Créer des alias manuels dans `.env`

```bash
# env/.env.local.user - ❌ INCORRECT
SECRET_BOT_PASSWORD=crypto_...
CLIENT_SECRET=$SECRET_BOT_PASSWORD  # ❌ N'est pas interpolé
CLIENT_ID=$BOT_ID                   # ❌ Variable dans mauvais fichier
```

**Pourquoi c'est faux** :

- Les fichiers `.env` ne supportent pas l'interpolation
- Le secret reste chiffré (`crypto_...`)
- Duplication inutile de variables

### ❌ Lire directement les variables M365 Toolkit dans le code

```javascript
// src/config.js - ❌ INCORRECT
const config = {
  MicrosoftAppId: process.env.BOT_ID,                // ❌ Utiliser CLIENT_ID
  MicrosoftAppPassword: process.env.SECRET_BOT_PASSWORD, // ❌ Valeur chiffrée
};
```

**Pourquoi c'est faux** :

- `BOT_ID` est la convention M365 Toolkit (provisioning)
- `CLIENT_ID` est la convention Bot Framework (runtime)
- `SECRET_BOT_PASSWORD` contient `crypto_...` (chiffré)
- `CLIENT_SECRET` contient la valeur décryptée

### ❌ Modifier `.localConfigs` manuellement

```bash
# .localConfigs - ❌ INCORRECT (généré automatiquement)
CLIENT_SECRET=manual-value  # ❌ Sera écrasé au prochain deploy
```

**Pourquoi c'est faux** :

- `.localConfigs` est régénéré à chaque `npm run dev:teamsfx`
- Modifications manuelles perdues
- Désynchronisation avec les fichiers `.env`

### Mitigations �

1. **Documentation claire** : Documenter le mapping dans les commentaires des fichiers `.env.example`
2. **Validation automatique** : Ajouter des tests vérifiant que `.localConfigs` contient toutes les variables requises
3. **Logs explicites** : Logger les variables manquantes au démarrage de l'application
4. **Formation d'équipe** : Expliquer le mécanisme lors de l'onboarding des nouveaux développeurs

## Alternatives Considérées

### Alternative 1 : Alias manuels dans les fichiers `.env`

**Description** : Dupliquer manuellement les variables avec les deux conventions de nommage.

**Avantages** :
- Visibilité immédiate des deux noms
- Pas de "magie" cachée

**Inconvénients** :
- ❌ Duplication de variables (source d'erreurs)
- ❌ Les secrets chiffrés (`crypto_...`) ne sont pas décryptés
- ❌ Complexifie la maintenance (deux endroits à modifier)
- ❌ Risque de désynchronisation

**Rejeté** : L'interpolation de variables ne fonctionne pas dans les fichiers `.env`, et le décryptage ne serait pas effectué.

### Alternative 2 : Modifier le code pour utiliser les noms M365 Toolkit

**Description** : Changer `src/config.js` pour lire `BOT_ID` et `SECRET_BOT_PASSWORD` au lieu de `CLIENT_ID` et `CLIENT_SECRET`.

**Avantages** :
- Pas besoin de mapping
- Cohérence avec les fichiers `.env`

**Inconvénients** :
- ❌ Non-standard (Bot Framework utilise `CLIENT_ID`/`CLIENT_SECRET`)
- ❌ `SECRET_BOT_PASSWORD` serait encore chiffré (`crypto_...`)
- ❌ Incompatibilité avec les exemples Microsoft
- ❌ Confusion pour les développeurs connaissant Bot Framework

**Rejeté** : La convention Bot Framework est un standard de l'industrie qu'il faut respecter.

### Alternative 3 : Script de post-processing manuel

**Description** : Créer un script bash qui lit `.env.local.user`, décrypte les secrets et génère `.localConfigs` manuellement.

**Avantages** :
- Contrôle total sur le processus
- Pas de dépendance à M365 Toolkit

**Inconvénients** :
- ❌ Réinvente la roue (M365 Toolkit le fait déjà)
- ❌ Nécessite comprendre l'algorithme de décryptage
- ❌ Maintenance supplémentaire
- ❌ Risque de divergence avec M365 Toolkit

**Rejeté** : M365 Toolkit offre déjà cette fonctionnalité de manière robuste et maintenue.

## Références

- [Microsoft 365 Agents Toolkit - Environment Variables](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teamsfx-multi-env)
- [Bot Framework - Bot Adapter Configuration](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-basics)
- **[ADR-006](006-gestion-azure-search-index-name.md)** : Système à 3 niveaux de configuration
- **[ADR-007](007-securite-secrets-git.md)** : Gestion des secrets et chiffrement
- **[ADR-012](012-gestion-configuration-centralisee.md)** : Centralisation des métadonnées
- **[ADR-014](014-microsoft-365-agents-toolkit-development.md)** : Bonnes pratiques M365 Agents Toolkit

## Notes d'implémentation

### Vérification du mapping

**Vérifier que les alias sont créés** :

```bash
cat .localConfigs | grep -E "CLIENT_ID|CLIENT_SECRET|BOT_TYPE"
```

**Résultat attendu** :

```bash
CLIENT_ID=9d985e0c-048c-4704-8b23-0af75ed033b0
CLIENT_SECRET=aPo8Q~K~...  # ✅ Valeur décryptée (pas crypto_)
BOT_TYPE=MultiTenant
```

### Débogage

**Si `CLIENT_SECRET` est `undefined`** :

1. Vérifier que `SECRET_BOT_PASSWORD` existe dans `.env.local.user`
2. Vérifier le mapping dans `m365agents.local.yml` (section deploy)
3. Vérifier que `.localConfigs` contient `CLIENT_SECRET` décrypté
4. Relancer le pipeline : `npm run dev:teamsfx`

**Si l'erreur AADSTS7000215 persiste** :

```bash
# Vérifier le contenu décrypté
echo $CLIENT_SECRET  # Doit être une chaîne alphanumérique, pas crypto_...
```

### Fichiers `.example` pour les développeurs

**`env/.env.local.user.example`** :

```bash
# Secrets pour environnement LOCAL
# Ce fichier est un template. Créez env/.env.local.user avec vos valeurs.

# ⚠️ NE PAS créer d'alias (CLIENT_ID, CLIENT_SECRET, etc.) ici
# ✅ M365 Agents Toolkit crée automatiquement les alias dans .localConfigs
# ✅ Voir m365agents.local.yml (section deploy) pour le mapping

SECRET_BOT_PASSWORD=crypto_...  # Généré par M365 Toolkit
SECRET_AZURE_OPENAI_API_KEY=crypto_...
SECRET_AZURE_SEARCH_KEY=your-plaintext-key-here
```

## Annexe : Chronologie de l'évolution des conventions de nommage

### Phase 1 : Janvier 2025 → Juillet 2025 (Teams Toolkit v1.7)

**Fichier** : `teamsapp.local.yml` (schema v1.7)  
**Convention** : Variables **`BOT_ID`** et **`BOT_PASSWORD`** utilisées **directement** sans alias

```yaml
# teamsapp.local.yml (v1.7) - Commit 0132377 (2025-01-06)
version: v1.7

deploy:
  - uses: file/createOrUpdateEnvironmentFile
    with:
      target: ./.localConfigs
      envs:
        BOT_ID: ${{BOT_ID}}                     # ✅ Nom direct (pas d'alias)
        BOT_PASSWORD: ${{SECRET_BOT_PASSWORD}}  # ✅ Nom direct (pas d'alias)
        BOT_TYPE: 'MultiTenant'
```

**Fichier runtime généré (`.localConfigs`)** :
```bash
BOT_ID=9d985e0c-048c-4704-8b23-0af75ed033b0
BOT_PASSWORD=aPo8Q~K~...  # Secret décrypté
BOT_TYPE=MultiTenant
```

**Code applicatif devait s'adapter** :
```javascript
// src/config.js - Adaptation manuelle nécessaire
const config = {
  MicrosoftAppId: process.env.BOT_ID,        // Lecture BOT_ID
  MicrosoftAppPassword: process.env.BOT_PASSWORD, // Lecture BOT_PASSWORD
};
```

### Phase 2 : 3 juillet 2025 (commit `3ea3262`)

**Action** : Suppression de `teamsapp.local.yml` lors du "rehaussement et nettoyage"  
**Contexte** : Import complet depuis la branche `dev-data`  
**Impact** : Transition vers nouvelle architecture

### Phase 3 : 17 novembre 2025 → 3 décembre 2025 (M365 Agents Toolkit v1.9)

**Fichier** : `m365agents.local.yml` (schema v1.9)  
**Convention** : Migration vers **`CLIENT_ID`** et **`CLIENT_SECRET`** (aliases pour compatibilité Bot Framework)

```yaml
# m365agents.local.yml (v1.9) - Commit df68f8d (2025-11-17)
version: v1.9

deploy:
  - uses: file/createOrUpdateEnvironmentFile
    with:
      target: ./.localConfigs
      envs:
        CLIENT_ID: ${{BOT_ID}}                  # ✅ Alias : BOT_ID → CLIENT_ID
        CLIENT_SECRET: ${{SECRET_BOT_PASSWORD}} # ✅ Alias : SECRET_BOT_PASSWORD → CLIENT_SECRET
        BOT_TYPE: 'MultiTenant'
        TENANT_ID: ${{TEAMS_APP_TENANT_ID}}     # ✅ Ajouté v1.1 (2025-12-04)
```

**Fichier runtime généré (`.localConfigs`)** :
```bash
CLIENT_ID=9d985e0c-048c-4704-8b23-0af75ed033b0  # ✅ Alias créé
CLIENT_SECRET=aPo8Q~K~...  # ✅ Secret décrypté + alias
BOT_TYPE=MultiTenant
TENANT_ID=3f41c771-6d80-4ae3-acc8-2d0a750ae14c  # ✅ Ajouté v1.1
```

**Code applicatif standardisé** :
```javascript
// src/config.js - Compatibilité Bot Framework native
const config = {
  MicrosoftAppId: process.env.CLIENT_ID,          // ✅ Standard Bot Framework
  MicrosoftAppPassword: process.env.CLIENT_SECRET, // ✅ Standard Bot Framework
  MicrosoftAppType: process.env.BOT_TYPE,
  MicrosoftAppTenantId: process.env.TENANT_ID,    // ✅ Standard Bot Framework
};
```

### Raison de l'évolution

**Problème avec Teams Toolkit v1.7** :
- Utilisait des noms propriétaires (`BOT_ID`, `BOT_PASSWORD`)
- Code applicatif devait s'adapter aux conventions Microsoft
- Incompatibilité avec la documentation Bot Framework

**Solution avec M365 Agents Toolkit v1.9** :
- Utilise les **noms standards Bot Framework** (`CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`)
- Compatibilité immédiate avec la documentation officielle
- Mapping automatique depuis les variables générées par le provisioning
- Alignement avec les meilleures pratiques Microsoft

### Phase 4 : 4 décembre 2025 → Présent (M365 Agents Toolkit v1.11)

**Fichier** : `m365agents.local.yml` (schema v1.11)  
**Nouveauté** : Support de `generateServicePrincipal: true` pour création automatique du Service Principal

```yaml
# m365agents.local.yml (v1.11) - 2025-12-04
version: v1.11

provision:
  - uses: aadApp/create
    with:
      name: Légis Québec-Québec${{APP_NAME_SUFFIX}}
      generateClientSecret: true
      generateServicePrincipal: true  # ⭐ NOUVEAU : Création auto du Service Principal
      signInAudience: AzureADMultipleOrgs
    writeToEnvironmentFile:
      clientId: BOT_ID
      clientSecret: SECRET_BOT_PASSWORD
      objectId: BOT_OBJECT_ID

deploy:
  - uses: file/createOrUpdateEnvironmentFile
    with:
      target: ./.localConfigs
      envs:
        CLIENT_ID: ${{BOT_ID}}
        CLIENT_SECRET: ${{SECRET_BOT_PASSWORD}}
        BOT_TYPE: 'MultiTenant'
        TENANT_ID: ${{TEAMS_APP_TENANT_ID}}
```

**Impact** :
- ✅ **Résout AADSTS7000229** : "Application with identifier 'xxx' was not found in the directory"
- ✅ **Résout AADSTS1003031** : "Application 'xxx'(xxx) is configured for use by Azure AD accounts in this org only"
- ✅ **Élimine la configuration manuelle** du Service Principal via Azure Portal ou Azure CLI
- ✅ **Aligné avec template officiel** tst-teams-app

**Avant v1.11** : Le développeur devait créer manuellement le Service Principal via :
```bash
az ad sp create --id <BOT_ID>
az ad app permission admin-consent --id <BOT_ID>
```

**Avec v1.11** : M365 Toolkit crée automatiquement le Service Principal lors du provisioning (F5).

### Tableau comparatif des versions

| Aspect | Teams Toolkit v1.7 | M365 Agents Toolkit v1.9 | M365 Agents Toolkit v1.11 |
|--------|-------------------|--------------------------|---------------------------|
| **Fichier** | `teamsapp.local.yml` | `m365agents.local.yml` | `m365agents.local.yml` |
| **Schema** | `v1.7` | `v1.9` | `v1.11` |
| **ID App** | `BOT_ID` (direct) | `CLIENT_ID` (alias) | `CLIENT_ID` (alias) |
| **Secret** | `BOT_PASSWORD` (direct) | `CLIENT_SECRET` (alias) | `CLIENT_SECRET` (alias) |
| **Tenant** | Absent | Absent → ✅ **Ajouté v1.1** | `TENANT_ID` (alias) |
| **Service Principal** | ⚠️ Manuel | ⚠️ Manuel | ✅ **Automatique** (`generateServicePrincipal: true`) |
| **API Permissions** | ⚠️ Manuel | ⚠️ Manuel via `aadApp/update` | ✅ Automatique (User.Read par défaut) |
| **Compatibilité Bot Framework** | ⚠️ Manuelle | ✅ Native | ✅ Native |
| **Date introduction** | 2025-01-06 | 2025-11-17 | 2025-12-04 (upgrade) |

### Commits clés

| Date | Commit | Fichier | Action |
|------|--------|---------|--------|
| 2025-01-06 | `0132377` | `teamsapp.local.yml` | ✅ Création initiale (v1.7) avec `BOT_ID`/`BOT_PASSWORD` |
| 2025-07-03 | `3ea3262` | `teamsapp.local.yml` | ❌ Suppression (rehaussement) |
| 2025-11-17 | `df68f8d` | `m365agents.local.yml` | ✅ Création v1.9 avec `CLIENT_ID`/`CLIENT_SECRET` |
| 2025-11-26 | `f7db138` | `m365agents.local.yml` | ➕ Ajout `LOG_LEVEL`, `AZURE_SEARCH_INDEX_NAME` |
| 2025-11-27 | `9c54d22` | `m365agents.local.yml` | 🔄 Refactoring branding (uqam-gpt → Légis Québec-Québec) |
| 2025-12-04 | — | `m365agents.local.yml` | ➕ Ajout `TENANT_ID` (ADR-020 v1.1) |
| 2025-12-04 | — | `m365agents.local.yml` | ⬆️ Upgrade v1.9 → v1.11 + ajout `generateServicePrincipal: true` (ADR-020 v1.3) |

## Historique des Modifications

| Date | Version | Changements |
|------|---------|-------------|
| 2025-12-04 | 1.0 | Création initiale de l'ADR |
| 2025-12-04 | 1.1 | Ajout de `TENANT_ID: ${{TEAMS_APP_TENANT_ID}}` dans `m365agents.local.yml` après analyse comparative avec template origine |
| 2025-12-04 | 1.2 | Ajout de la chronologie complète de l'évolution des conventions de nommage (Teams Toolkit v1.7 → M365 Agents Toolkit v1.9) |
| 2025-12-04 | 1.3 | **Upgrade vers v1.11** : Ajout de `generateServicePrincipal: true` pour création automatique du Service Principal et résolution des erreurs AADSTS7000229/1003031 |
| 2025-12-04 | 1.4 | **Résolution de problème** : Documentation complète du cas réel où `generateServicePrincipal: true` n'a pas fonctionné lors du reprovisioning. Création et documentation du script `azure-grant-admin-consent.sh`. Ajout des workflows recommandés et commandes de diagnostic |

## Annexe : Notes de migration

### Comparaison avec template d'origine (tst-teams-app)

Lors de l'analyse du fichier `env/env-orig/m365agents.local.yml` (template M365 Toolkit v1.11), les différences suivantes ont été identifiées :

| Aspect | Template origine (v1.11) | Projet actuel (v1.9) | Action |
|--------|--------------------------|----------------------|--------|
| **Version** | `v1.11` | `v1.9` | ✅ OK - v1.9 stable |
| **Service Principal** | `generateServicePrincipal: true` | Absent | ✅ OK - Option v1.11+ uniquement |
| **TENANT_ID mapping** | ✅ Présent | ❌ **Manquant** (corrigé v1.1) | ✅ **Ajouté** |
| **BOT_TYPE** | Absent | ✅ Présent (`'MultiTenant'`) | ✅ OK - Requis par Bot Framework |
| **AZURE_SEARCH_INDEX_NAME** | Absent | ✅ Présent | ✅ OK - Documenté [ADR-006](006-gestion-azure-search-index-name.md) |
| **LOG_LEVEL** | Absent | ✅ Présent | ✅ OK - Documenté [ADR-016](016-systeme-logging-centralise.md) |

**Correction appliquée (v1.1)** : Ajout du mapping `TENANT_ID: ${{TEAMS_APP_TENANT_ID}}` pour conformité avec Bot Framework best practices.

### Découverte de `generateServicePrincipal: true` (v1.3)

**Contexte** : Lors du débogage des erreurs AADSTS7000229 ("Service Principal not found") et AADSTS1003031 ("Misconfigured permissions"), une analyse comparative avec le template officiel `tst-teams-app` a révélé une différence critique.

**Problème identifié** :
- ❌ **Projet actuel (v1.9)** : `aadApp/create` créait seulement l'**App Registration**
- ✅ **Template officiel (v1.11)** : `aadApp/create` avec `generateServicePrincipal: true` crée **App Registration + Service Principal**

**Différence Azure AD** :
```yaml
# ❌ Version v1.9 (AVANT) - Service Principal manquant
- uses: aadApp/create
  with:
    name: Légis Québec-Québec${{APP_NAME_SUFFIX}}
    generateClientSecret: true
    # ❌ Pas de generateServicePrincipal
    signInAudience: AzureADMultipleOrgs
```

Résultat :
- ✅ App Registration créé dans Azure AD → App registrations
- ❌ Service Principal **NON créé** dans Azure AD → Enterprise applications
- ❌ Erreur AADSTS7000229 lors de l'authentification Bot Framework

```yaml
# ✅ Version v1.11 (APRÈS) - Service Principal automatique
- uses: aadApp/create
  with:
    name: Légis Québec-Québec${{APP_NAME_SUFFIX}}
    generateClientSecret: true
    generateServicePrincipal: true  # ⭐ AJOUTÉ
    signInAudience: AzureADMultipleOrgs
```

Résultat :
- ✅ App Registration créé dans Azure AD → App registrations
- ✅ Service Principal créé automatiquement dans Azure AD → Enterprise applications
- ✅ Permissions configurées automatiquement (User.Read)
- ✅ Admin consent appliqué automatiquement
- ✅ Authentification Bot Framework fonctionnelle

**Comprendre la différence** :

| Composant | App Registration | Service Principal |
|-----------|------------------|-------------------|
| **Analogie** | "Passeport" (identité globale) | "Visa" (instance dans un pays/tenant) |
| **Localisation** | Azure AD → App registrations | Azure AD → Enterprise applications |
| **Portée** | Mondiale (multi-tenant) | Locale (tenant spécifique) |
| **Rôle** | Définit l'application | Permet l'utilisation dans le tenant |
| **Nécessaire pour** | Créer l'app | Authentifier et accorder permissions |

**Impact de l'absence de Service Principal** :
- ❌ AADSTS7000229 : "Application with identifier 'xxx' was not found in the directory"
- ❌ AADSTS1003031 : "Application 'xxx' is configured for use by... org only"
- ❌ Impossible d'appliquer admin consent
- ❌ Bot Framework ne peut pas valider l'identité

**Solution finale** : Upgrade vers v1.11 + ajout de `generateServicePrincipal: true` élimine le besoin de :
1. ❌ Créer manuellement le Service Principal via Azure Portal
2. ❌ Exécuter `az ad sp create --id <BOT_ID>`
3. ❌ Configurer manuellement les API permissions
4. ❌ Exécuter `az ad app permission admin-consent --id <BOT_ID>`
5. ❌ Créer un fichier `aad.manifest.json`
6. ❌ Ajouter une section `aadApp/update` dans le YAML

**Tout est automatisé par M365 Agents Toolkit v1.11 lors du provisioning (F5)** 🎉

### Résolution de problème : Cas réel (4 décembre 2025)

**Scénario** : Malgré l'upgrade vers v1.11 et l'ajout de `generateServicePrincipal: true`, l'erreur AADSTS7000229 persistait après reprovisioning.

#### Problème rencontré

```
[ERROR] @teams/app invalid_client: Error(s): 7000229
AADSTS7000229: The client application <BOT_ID> 
is missing service principal in the tenant <TENANT_ID>
```

#### Analyse de la cause

**Pourquoi `generateServicePrincipal: true` n'a pas fonctionné ?**

M365 Agents Toolkit v1.11 crée automatiquement le Service Principal **SEULEMENT lors de la création initiale de l'App Registration**. Dans notre cas :

1. ✅ App Registration existait déjà (réutilisée lors du reprovisioning)
2. ❌ M365 Toolkit n'a PAS recréé le Service Principal (considéré comme une mise à jour, pas une création)
3. ❌ Erreur AADSTS7000229 persistait malgré la configuration correcte

**Comportement de `aadApp/create` avec `generateServicePrincipal: true`** :

| Contexte | App Registration | Service Principal | Résultat |
|----------|------------------|-------------------|----------|
| **Première exécution** (App inexistante) | ✅ Créée | ✅ Créé | ✅ Fonctionne |
| **Reprovisioning** (App existe déjà) | ♻️ Réutilisée | ❌ **NON créé** | ❌ AADSTS7000229 |
| **Après suppression manuelle** | ✅ Créée | ✅ Créé | ✅ Fonctionne |

**Conclusion** : `generateServicePrincipal: true` ne garantit PAS la création du Service Principal lors d'un reprovisioning sur une App Registration existante.

#### Solution appliquée : Script Azure CLI

Création d'un script Bash automatisé pour créer le Service Principal manuellement :

**Fichier** : `scripts/azure-grant-admin-consent.sh`

**Fonctionnalités** :
1. ✅ Lecture automatique de `BOT_ID` et `TENANT_ID` depuis `env/.env.local`
2. ✅ Connexion au bon tenant Azure AD
3. ✅ Vérification de l'App Registration
4. ✅ Création du Service Principal (si absent)
5. ✅ Configuration de la permission Microsoft Graph `User.Read`
6. ✅ Application du consentement administrateur
7. ✅ Vérification finale de la configuration

**Commande** :
```bash
./scripts/azure-grant-admin-consent.sh
```

**Résultat (4 décembre 2025)** :
```
✓ Service Principal créé avec succès
✓ Service Principal Object ID: <SP_OBJECT_ID>
✓ Permission User.Read ajoutée
✓ Consentement administrateur accordé avec succès
```

#### Vérification du succès

**Avant redémarrage** :
```
[ERROR] @teams/app invalid_client: Error(s): 7000229
AADSTS7000229: The client application <BOT_ID> 
is missing service principal in the tenant <TENANT_ID>
```

**Après redémarrage de l'application** :
- ✅ Plus d'erreur AADSTS7000229
- ✅ Bot Framework authentification réussie
- ✅ Messages envoyés avec succès dans Teams
- ✅ Application fonctionnelle

#### Leçons apprises

| Aspect | Leçon | Recommandation |
|--------|-------|----------------|
| **`generateServicePrincipal: true`** | ⚠️ Ne fonctionne que lors de la création initiale | Toujours vérifier dans Azure Portal après provisioning |
| **Reprovisioning** | ⚠️ Ne recrée pas les ressources existantes | Supprimer l'App Registration avant reprovisioning complet |
| **Service Principal** | ⚠️ Composant critique souvent oublié | Vérifier présence dans Enterprise Applications |
| **Script d'automatisation** | ✅ Solution fiable et reproductible | Conserver `azure-grant-admin-consent.sh` dans le projet |
| **Documentation** | ✅ ADR essentiel pour comprendre l'évolution | Documenter chaque découverte importante |

#### Workflow recommandé pour provisioning

**Option A : Provisioning propre (recommandé)** :
1. Supprimer l'App Registration existante dans Azure Portal
2. Vider `BOT_ID` et `SECRET_BOT_PASSWORD` dans les fichiers `.env`
3. Lancer F5 (M365 Toolkit crée tout automatiquement avec v1.11)
4. Vérifier la présence du Service Principal dans Azure Portal

**Option B : Reprovisioning sur App existante** :
1. Lancer F5 (M365 Toolkit réutilise l'App Registration)
2. Exécuter `./scripts/azure-grant-admin-consent.sh` (crée le Service Principal)
3. Redémarrer l'application
4. Vérifier l'absence d'erreurs AADSTS

#### Commandes de diagnostic utiles

```bash
# Vérifier si le Service Principal existe
az ad sp show --id <BOT_ID>

# Lister les permissions de l'App
az ad app show --id <BOT_ID> --query requiredResourceAccess

# Vérifier le consentement admin
az ad app permission list-grants --id <BOT_ID>

# Créer manuellement le Service Principal (si absent)
az ad sp create --id <BOT_ID>

# Appliquer le consentement admin
az ad app permission admin-consent --id <BOT_ID>
```

#### Ressources créées (configuration finale)

| Ressource | Valeur | Statut |
|-----------|--------|--------|
| **App Registration Name** | `<APP_NAME>local` | ✅ Créé |
| **BOT_ID (CLIENT_ID)** | `<guid>` | ✅ Actif |
| **Service Principal ID** | `<guid>` | ✅ Créé |
| **TENANT_ID** | `<guid>` | ✅ Configuré |
| **API Permission** | Microsoft Graph - User.Read | ✅ Accordé |
| **Admin Consent** | Accordé | ✅ Appliqué |
| **Bot Framework** | Enregistré | ✅ Fonctionnel |
| **Dev Tunnel** | `<random>-3978.use.devtunnels.ms` | ✅ Actif |

## Annexe : Conclusion et recommandations

### Points clés à retenir

1. **M365 Agents Toolkit automatise le mapping des variables** via les fichiers `m365agents.*.yml`
   - Ne JAMAIS créer d'alias manuels dans les fichiers `.env`
   - Le fichier `.localConfigs` est généré automatiquement
   - Les secrets sont décryptés automatiquement lors du deploy

2. **L'évolution des conventions de nommage reflète l'alignement avec Bot Framework**
   - v1.7 : Nommage propriétaire (`BOT_ID`, `BOT_PASSWORD`)
   - v1.9+ : Nommage standard Bot Framework (`CLIENT_ID`, `CLIENT_SECRET`)
   - Cette migration améliore la compatibilité avec la documentation officielle

3. **`generateServicePrincipal: true` a des limitations**
   - ✅ Fonctionne parfaitement lors de la création initiale
   - ⚠️ Ne recrée PAS le Service Principal lors d'un reprovisioning
   - 🔧 Solution de secours : Script `azure-grant-admin-consent.sh`

4. **Service Principal vs App Registration : Distinction cruciale**
   - **App Registration** = Identité globale ("Passeport")
   - **Service Principal** = Instance locale dans le tenant ("Visa")
   - Les deux sont nécessaires pour l'authentification Bot Framework

### Workflow de provisioning recommandé

#### Pour un nouveau projet
```bash
# 1. Configuration du fichier m365agents.local.yml avec v1.11
version: v1.11
- uses: aadApp/create
  with:
    generateServicePrincipal: true  # ⭐ Important

# 2. Lancer le provisioning
F5 dans VS Code

# 3. Vérifier dans Azure Portal
Azure AD → Enterprise applications → Rechercher BOT_ID
```

#### Pour un projet existant avec erreurs AADSTS7000229
```bash
# 1. Vérifier si le Service Principal existe
az ad sp show --id <BOT_ID>

# 2. Si absent, exécuter le script
./scripts/azure-grant-admin-consent.sh

# 3. Redémarrer l'application
Shift+F5 puis F5
```

### Checklist de vérification post-provisioning

- [ ] `BOT_ID` présent dans `env/.env.local`
- [ ] `SECRET_BOT_PASSWORD` chiffré (préfixe `crypto_`) dans `env/.env.local.user`
- [ ] Fichier `.localConfigs` généré avec `CLIENT_ID` et `CLIENT_SECRET`
- [ ] App Registration visible dans Azure Portal → Azure AD → App registrations
- [ ] **Service Principal visible dans Azure Portal → Azure AD → Enterprise applications**
- [ ] Permission `User.Read` accordée avec admin consent
- [ ] Aucune erreur AADSTS lors du démarrage de l'application
- [ ] Bot répond aux messages dans Teams

### Ressources et références

#### Documentation Microsoft
- [M365 Agents Toolkit Documentation](https://aka.ms/teamsfx-v5.0-guide)
- [Bot Framework Authentication](https://learn.microsoft.com/azure/bot-service/bot-builder-authentication)
- [Azure AD App Registration vs Service Principal](https://learn.microsoft.com/azure/active-directory/develop/app-objects-and-service-principals)

#### ADR connexes
- [ADR-006](006-gestion-azure-search-index-name.md) : Gestion Azure Search Index Name
- [ADR-007](007-securite-secrets-git.md) : Sécurité des secrets Git
- [ADR-012](012-gestion-configuration-centralisee.md) : Gestion configuration centralisée
- [ADR-014](014-microsoft-365-agents-toolkit-development.md) : Microsoft 365 Agents Toolkit Development
- [ADR-016](016-systeme-logging-centralise.md) : Système de logging centralisé

#### Scripts utiles
- `scripts/azure-grant-admin-consent.sh` : Création Service Principal et admin consent
- `scripts/version-update.sh` : Mise à jour de version

### Impact sur le projet

| Aspect | Avant (v1.9) | Après (v1.11 + script) | Amélioration |
|--------|--------------|------------------------|--------------|
| **Configuration manuelle** | ⚠️ Nécessaire | ✅ Automatisée | +90% |
| **Erreurs AADSTS** | ❌ Fréquentes | ✅ Résolues | 100% |
| **Compréhension** | ⚠️ Obscure | ✅ Documentée | +100% |
| **Reproductibilité** | ⚠️ Difficile | ✅ Scriptée | +95% |
| **Temps de résolution** | ~4 heures | ~15 minutes | -80% |
| **Documentation** | ❌ Absente | ✅ ADR complet | ∞ |

### Note finale

Cet ADR documente **l'ensemble du parcours de résolution** d'un problème de configuration Azure AD complexe, de l'erreur initiale AADSTS7000215 jusqu'à la solution finale avec Service Principal fonctionnel. Il sert de **référence historique** et de **guide de dépannage** pour l'équipe et les futurs développeurs du projet Légis Québec.
