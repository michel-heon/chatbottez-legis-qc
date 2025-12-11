# ADR-006 : Gestion de AZURE_SEARCH_INDEX_NAME dans les environnements

## Statut

✅ Accepté (mis à jour 2025-12-11)

## Date

2025-11-18 (dernière révision: 2025-12-11)

## Contexte

**Décideurs**: Équipe de développement Légis Québec  
**Impact technique**: Critique - Configuration runtime obligatoire

L'application Légis Québec utilise Azure AI Search pour la recherche vectorielle (RAG). Le nom de l'index Azure Search (`AZURE_SEARCH_INDEX_NAME`) est une variable d'environnement **critique** qui doit être configurée pour chaque environnement (local, playground, dev, production).

### Problème identifié

Lors du démarrage de l'application en mode `local`, l'erreur suivante se produit :

```
Error: 'indexName' cannot be null
    at new SearchClient (/node_modules/@azure/search-documents/.../searchClient.js:31:19)
    at new AzureAISearchDataSource (/src/app/azureAISearchDataSource.js:22:29)
```

**Cause racine** : La variable `AZURE_SEARCH_INDEX_NAME` n'est **pas transférée** depuis les fichiers `.env.*.user` vers les fichiers de configuration runtime (`.localConfigs`, `.localConfigs.playground`).

### Architecture de configuration actuelle

Le système Microsoft 365 Agents Toolkit utilise une architecture à **3 niveaux** :

```
┌─────────────────────────────────────────────────────────────────┐
│ NIVEAU 1: Fichiers .env (Source de vérité)                     │
├─────────────────────────────────────────────────────────────────┤
│ env/.env.local.user     ← Variables secrets LOCAL              │
│ env/.env.dev.user       ← Variables secrets DEV (Azure)        │
│ env/.env.playground     ← Variables publiques PLAYGROUND       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ NIVEAU 2: Fichiers YAML (Transformateurs)                      │
├─────────────────────────────────────────────────────────────────┤
│ m365agents.local.yml     ← Pipeline LOCAL                      │
│ m365agents.yml           ← Pipeline DEV (Azure)                │
│ m365agents.playground.yml ← Pipeline PLAYGROUND                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ NIVEAU 3: Fichiers runtime (Consommés par Node.js)             │
├─────────────────────────────────────────────────────────────────┤
│ .localConfigs            ← Utilisé par npm run dev:teamsfx     │
│ .localConfigs.playground ← Utilisé par testtool                │
│ Azure App Service Env    ← Utilisé en production               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ NIVEAU 4: Application Node.js                                   │
├─────────────────────────────────────────────────────────────────┤
│ src/config.js           ← process.env.AZURE_SEARCH_INDEX_NAME  │
│ src/app/azureAISearchDataSource.js ← Utilise config            │
└─────────────────────────────────────────────────────────────────┘
```

### Analyse par environnement

#### 🔴 PROBLÈME: Environnement LOCAL

**Fichier source** : `env/.env.local.user`
```bash
AZURE_SEARCH_INDEX_NAME='legis-index-04'  ✓ DÉFINI
```

**Transformateur** : `m365agents.local.yml` (ligne 91)
```yaml
deploy:
  - uses: file/createOrUpdateEnvironmentFile
    with:
      target: ./.localConfigs
      envs:
        AZURE_SEARCH_INDEX_NAME: ${{AZURE_SEARCH_INDEX_NAME}}  ❌ MANQUANT
```

**Fichier runtime** : `.localConfigs`
```bash
AZURE_SEARCH_INDEX_NAME=legis-index-04  ✓ PRÉSENT (ajouté manuellement)
```

**Problème** : La variable `${{AZURE_SEARCH_INDEX_NAME}}` dans le YAML n'est **pas résolue** car elle n'est pas lue depuis `env/.env.local.user`. Le Teams Toolkit ne charge que les variables des fichiers `.env.local` (sans `.user`).

#### 🔴 PROBLÈME: Environnement PLAYGROUND

**Fichier source** : `env/.env.playground` (PAS de `.user`)
```bash
# ❌ AZURE_SEARCH_INDEX_NAME n'est PAS défini
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002
AZURE_SEARCH_ENDPOINT=https://legis-qc-search-01.search.windows.net
```

**Transformateur** : `m365agents.playground.yml`
```yaml
deploy:
  - uses: file/createOrUpdateEnvironmentFile
    with:
      target: ./.localConfigs.playground
      envs:
        # ❌ AZURE_SEARCH_INDEX_NAME est ABSENT du mapping
        AZURE_OPENAI_API_KEY: ${{SECRET_AZURE_OPENAI_API_KEY}}
        AZURE_SEARCH_ENDPOINT: ${{AZURE_SEARCH_ENDPOINT}}
```

**Problème** : Double manquement
1. Variable absente du fichier source `.env.playground`
2. Variable absente du mapping YAML

#### 🟢 OK: Environnement DEV (Azure)

**Fichier source** : `env/.env.dev.user`
```bash
AZURE_SEARCH_INDEX_NAME='legis-index-04'  ✓ DÉFINI
```

**Transformateur** : `m365agents.yml` (déploiement Azure)
```yaml
# Les variables sont injectées dans Azure App Service
# via arm/deploy et azureAppService/zipDeploy
```

**Fichier runtime** : Variables d'environnement Azure App Service

**Statut** : ✅ Fonctionne (variables configurées manuellement dans Azure Portal)

### Impact sur le code

#### `src/config.js`
```javascript
const config = {
  // ...
  azureSearchIndexName: process.env.AZURE_SEARCH_INDEX_NAME,  // ❌ undefined si non configuré
};
```

#### `src/app/azureAISearchDataSource.js`
```javascript
constructor(options) {
  this.searchClient = new SearchClient(
    options.azureAISearchEndpoint,
    options.indexName,  // ❌ Si null → Error: 'indexName' cannot be null
    new AzureKeyCredential(options.azureAISearchApiKey),
    {}
  );
}
```

#### `src/indexers/setup.js` et `delete.js`
```javascript
const index = process.env.AZURE_SEARCH_INDEX_NAME || "my-documents";  // ✓ Fallback défini
```

### Fichiers concernés

1. **Fichiers de configuration** :
   - `env/.env.local.user` (secrets LOCAL)
   - `env/.env.dev.user` (secrets DEV)
   - `env/.env.playground` (config PLAYGROUND - à créer)

2. **Fichiers de transformation** :
   - `m365agents.local.yml` (LOCAL)
   - `m365agents.playground.yml` (PLAYGROUND)
   - `m365agents.yml` (DEV/Production)

3. **Fichiers runtime générés** :
   - `.localConfigs` (généré par pipeline LOCAL)
   - `.localConfigs.playground` (généré par pipeline PLAYGROUND)

4. **Code source** :
   - `src/config.js` (charge la variable)
   - `src/app/azureAISearchDataSource.js` (utilise la variable)
   - `src/indexers/setup.js` (avec fallback)
   - `src/indexers/delete.js` (avec fallback)

## Décision

### Principe architectural

**Adopter une gestion déclarative et explicite** de `AZURE_SEARCH_INDEX_NAME` pour tous les environnements avec validation au démarrage.

### Règles de configuration par environnement

#### Environnement LOCAL

1. **Définir la variable** dans `env/.env.local.user` :
   ```bash
   AZURE_SEARCH_INDEX_NAME='legis-index-04'
   ```

2. **Mapper explicitement** dans `m365agents.local.yml` :
   ```yaml
   deploy:
     - uses: file/createOrUpdateEnvironmentFile
       with:
         target: ./.localConfigs
         envs:
           AZURE_SEARCH_INDEX_NAME: ${{AZURE_SEARCH_INDEX_NAME}}
   ```

3. **Workaround temporaire** : Ajouter manuellement dans `.localConfigs` jusqu'à résolution du bug Teams Toolkit

#### Environnement PLAYGROUND

1. **Créer le fichier** `env/.env.playground.user` (ignoré par git) :
   ```bash
   # Secrets pour playground (SANS préfixe SECRET_)
   AZURE_OPENAI_API_KEY=...
   AZURE_SEARCH_KEY=...
   AZURE_SEARCH_INDEX_NAME='legis-index-04'
   ```

2. **Ajouter le mapping** dans `m365agents.playground.yml` :
   ```yaml
   deploy:
     - uses: file/createOrUpdateEnvironmentFile
       with:
         target: ./.localConfigs.playground
         envs:
           AZURE_OPENAI_API_KEY: ${{AZURE_OPENAI_API_KEY}}
           AZURE_SEARCH_KEY: ${{AZURE_SEARCH_KEY}}
           AZURE_SEARCH_INDEX_NAME: ${{AZURE_SEARCH_INDEX_NAME}}
   ```

**Note importante** (Révision 2025-12-11): Le préfixe `SECRET_` a été **supprimé** pour simplifier la configuration. Les fichiers YAML référencent maintenant directement les variables sans préfixe. Les variables dans `env/.env.playground.user` utilisent les mêmes noms que dans le code (`AZURE_OPENAI_API_KEY`, `AZURE_SEARCH_KEY`). Le fichier YAML génère `.localConfigs.playground` avec ces mêmes noms, permettant au code de les lire directement via `process.env.AZURE_OPENAI_API_KEY`.

#### Environnement DEV (Azure)

1. **Garder la définition** dans `env/.env.dev.user` :
   ```bash
   AZURE_SEARCH_INDEX_NAME='legis-index-04'
   ```

2. **Configurer dans Azure Portal** :
   - App Service → Configuration → Application Settings
   - Ajouter `AZURE_SEARCH_INDEX_NAME` = `legis-index-04`

### Validation au démarrage

Ajouter une validation dans `src/config.js` :

```javascript
const config = {
  MicrosoftAppId: process.env.CLIENT_ID,
  // ... autres variables ...
  azureSearchIndexName: process.env.AZURE_SEARCH_INDEX_NAME,
};

// Validation des variables critiques
const requiredVars = [
  'MicrosoftAppId',
  'azureOpenAIKey',
  'azureOpenAIEndpoint',
  'azureOpenAIDeploymentName',
  'azureSearchKey',
  'azureSearchEndpoint',
  'azureSearchIndexName',
];

const missingVars = requiredVars.filter(varName => !config[varName]);
if (missingVars.length > 0) {
  console.error('❌ Configuration Error: Missing required environment variables:');
  missingVars.forEach(varName => {
    const envVarName = varName.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
    console.error(`   - ${envVarName}`);
  });
  console.error('\n📋 Check the following files:');
  console.error('   - Local: env/.env.local.user');
  console.error('   - Playground: env/.env.playground.user');
  console.error('   - Dev: Azure Portal App Service → Configuration');
  console.error('\n📖 See docs/adr/006-gestion-azure-search-index-name.md\n');
  process.exit(1);
}

module.exports = config;
```

### Documentation utilisateur

Créer `docs/guides/CONFIGURATION.md` :

```markdown
# Configuration des variables d'environnement

## Variables critiques

| Variable | Description | Obligatoire | Environnements |
|----------|-------------|-------------|----------------|
| `AZURE_SEARCH_INDEX_NAME` | Nom de l'index Azure AI Search | ✅ Oui | Tous |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Modèle GPT (ex: gpt-4.1) | ✅ Oui | Tous |
| `AZURE_SEARCH_ENDPOINT` | URL du service Azure Search | ✅ Oui | Tous |

## Configuration par environnement

### Local Development
Fichier: `env/.env.local.user`

### Playground (Test Tool)
Fichier: `env/.env.playground.user` (à créer)

### Dev/Production (Azure)
Azure Portal → App Service → Configuration → Application Settings
```

## Conséquences

### Avantages

✅ **Visibilité explicite** : Toutes les variables critiques sont documentées et validées  
✅ **Fail-fast** : L'application refuse de démarrer si la configuration est incomplète  
✅ **Traçabilité** : Chaque environnement a sa source de vérité documentée  
✅ **Débogage simplifié** : Messages d'erreur clairs avec références ADR  
✅ **Prévention des erreurs** : Impossible de déployer avec une configuration manquante

### Inconvénients

⚠️ **Duplication temporaire** : Workaround manuel dans `.localConfigs` nécessaire  
⚠️ **Maintenance** : Synchronisation manuelle entre `.env.*.user` et Azure Portal pour DEV  
⚠️ **Complexité** : 3 niveaux de configuration à maintenir  

### Risques

🔴 **Bug Teams Toolkit** : `${{AZURE_SEARCH_INDEX_NAME}}` n'est pas résolu depuis `.env.local.user`  
   - **Mitigation** : Workaround manuel documenté + ticket Microsoft  

🟡 **Désynchronisation** : Variables différentes entre environnements  
   - **Mitigation** : Validation au démarrage + documentation centralisée  

## Alternatives considérées

### Alternative 1 : Hardcoder le nom de l'index

```javascript
const config = {
  azureSearchIndexName: "legis-index-04",  // ❌ Hardcodé
};
```

**Rejeté** : 
- ❌ Impossible de changer d'index sans modifier le code
- ❌ Incompatible avec plusieurs environnements (dev, staging, prod)
- ❌ Violation du principe 12-factor app (config externe)

### Alternative 2 : Utiliser un fichier JSON de configuration

```json
{
  "local": { "indexName": "legis-index-04" },
  "dev": { "indexName": "legis-index-prod" }
}
```

**Rejeté** :
- ❌ Duplication avec les fichiers `.env`
- ❌ Risque de commit de secrets dans le JSON
- ❌ Non compatible avec l'architecture Teams Toolkit

### Alternative 3 : Variable d'environnement système

```bash
export AZURE_SEARCH_INDEX_NAME='legis-index-04'
```

**Rejeté** :
- ❌ Non persistant entre les sessions
- ❌ Difficulté de gestion multi-développeurs
- ❌ Incompatible avec CI/CD

## Références

- [Teams Toolkit Environment Variables](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teamsfx-multi-env)
- [12-Factor App: Config](https://12factor.net/config)
- [Azure App Service Configuration](https://learn.microsoft.com/en-us/azure/app-service/configure-common)
- ADR-001 : Git workflow et stratégie de versioning (pour gestion des fichiers `.user`)

## Notes de mise en œuvre

### Checklist de configuration

#### Pour chaque nouveau développeur

- [ ] Copier `env/.env.local.user.example` vers `env/.env.local.user`
- [ ] Remplir `AZURE_SEARCH_INDEX_NAME='legis-index-04'`
- [ ] Créer `env/.env.playground.user` avec les mêmes variables
- [ ] Exécuter `npm run provision` (local)
- [ ] Vérifier `.localConfigs` contient `AZURE_SEARCH_INDEX_NAME`
- [ ] Tester avec `npm run dev:teamsfx`

#### Pour déploiement Azure (DEV)

- [ ] Définir `AZURE_SEARCH_INDEX_NAME` dans `env/.env.dev.user`
- [ ] Ajouter dans Azure Portal : App Service → Configuration
- [ ] Redémarrer l'App Service
- [ ] Vérifier les logs Application Insights

### Commandes de vérification

```bash
# Vérifier la présence dans les fichiers .env
grep AZURE_SEARCH_INDEX_NAME env/.env.*.user

# Vérifier la génération dans .localConfigs
cat .localConfigs | grep AZURE_SEARCH_INDEX_NAME

# Tester le chargement en Node.js
node -e "require('dotenv').config({path: '.localConfigs'}); console.log(process.env.AZURE_SEARCH_INDEX_NAME)"

# Vérifier dans Azure (nécessite Azure CLI)
az webapp config appsettings list --name <app-name> --resource-group <rg-name> --query "[?name=='AZURE_SEARCH_INDEX_NAME']"
```

### Troubleshooting

#### Erreur: `'indexName' cannot be null`

1. Vérifier `env/.env.local.user` contient la variable
2. Vérifier `.localConfigs` contient la variable (workaround manuel)
3. Vérifier `src/config.js` charge correctement
4. Redémarrer l'application

#### Variable non résolue dans YAML (`${{AZURE_SEARCH_INDEX_NAME}}` reste littéral)

**Cause** : Bug connu Teams Toolkit - ne lit pas les fichiers `.user`  
**Solution temporaire** : Ajouter manuellement dans `.localConfigs`  
**Solution permanente** : Ticket Microsoft ouvert

---

**Révision** : v1.1 (2025-12-11 - Suppression préfixe SECRET_)  
**Prochaine révision** : Quand le bug Teams Toolkit sera résolu

## Annexe A : Fonctionnement de la génération via YAML (Révision 2025-12-11)

### Principe de fonctionnement

Les fichiers YAML (`m365agents.*.yml`) utilisent l'action `file/createOrUpdateEnvironmentFile` pour **générer automatiquement** les fichiers de configuration runtime (`.localConfigs`, `.localConfigs.playground`).

### Flux de génération

```
┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 1: Teams Toolkit charge les fichiers .env                │
├─────────────────────────────────────────────────────────────────┤
│ - Lit env/.env.playground (variables publiques)                │
│ - Lit env/.env.playground.user (secrets, si présent)           │
│ - Fusionne les deux sources                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 2: Résolution des variables dans le YAML                 │
├─────────────────────────────────────────────────────────────────┤
│ m365agents.playground.yml:                                      │
│                                                                 │
│   envs:                                                         │
│     AZURE_OPENAI_API_KEY: ${{AZURE_OPENAI_API_KEY}}           │
│                            ^^^^^^^^^^^^^^^^^^^^^               │
│                            Résolu depuis env/.env.playground.user │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 3: Génération du fichier .localConfigs.playground        │
├─────────────────────────────────────────────────────────────────┤
│ AZURE_OPENAI_API_KEY=2ad1VT9CKCOg...                           │
│ AZURE_OPENAI_ENDPOINT=https://openai-cotechnoe.openai.azure... │
│ AZURE_SEARCH_KEY=YDcIo6Do1dEXTw...                             │
│ AZURE_SEARCH_ENDPOINT=https://search-cotechnoe-ai.search...    │
│ AZURE_SEARCH_STRICTNESS=2                                      │
│ DEBUG=true                                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 4: npm run dev:teamsfx:playground                        │
├─────────────────────────────────────────────────────────────────┤
│ Package.json script:                                            │
│   "dev:teamsfx:playground":                                     │
│   "env-cmd --silent -f .localConfigs.playground npm run dev"   │
│                                                                 │
│ → env-cmd charge .localConfigs.playground                      │
│ → Injecte les variables dans process.env                       │
│ → Lance nodemon avec src/index.js                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 5: Code Node.js lit process.env                          │
├─────────────────────────────────────────────────────────────────┤
│ src/config.js:                                                  │
│   azureOpenAIKey: process.env.AZURE_OPENAI_API_KEY            │
│   azureSearchKey: process.env.AZURE_SEARCH_KEY                │
└─────────────────────────────────────────────────────────────────┘
```

### Suppression du préfixe SECRET_ (2025-12-11)

**Problème identifié** : La convention Microsoft d'utiliser `SECRET_` pour masquer les logs créait une **désynchronisation** :
- Fichier `.env.playground.user` : `SECRET_AZURE_OPENAI_API_KEY=...`
- Fichier YAML : `${{SECRET_AZURE_OPENAI_API_KEY}}` → génère → `AZURE_OPENAI_API_KEY=...`
- Code : `process.env.AZURE_OPENAI_API_KEY` ✓

**Problème** : Confusion entre les noms, nécessitait de la logique de fallback dans `config.js` :
```javascript
// Ancien code avec fallback
azureOpenAIKey: process.env.SECRET_AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY
```

**Solution** : **Unification des noms** - même nom partout, pas de préfixe :
- Fichier `.env.playground.user` : `AZURE_OPENAI_API_KEY=...`
- Fichier YAML : `${{AZURE_OPENAI_API_KEY}}` → génère → `AZURE_OPENAI_API_KEY=...`
- Code : `process.env.AZURE_OPENAI_API_KEY` ✓

**Avantages** :
- ✅ Pas de logique de fallback nécessaire
- ✅ Noms cohérents dans toute la chaîne
- ✅ Plus simple à déboguer
- ✅ Moins de confusion pour les développeurs

**Protection des secrets** : Les secrets restent protégés par :
- `.gitignore` : Exclut `env/.env.*.user`
- `.gitignore` : Exclut `.localConfigs*`
- Pas besoin de préfixe pour la sécurité

### Commandes de diagnostic

```bash
# Vérifier quelles variables sont définies dans .env.playground.user
cat env/.env.playground.user

# Simuler la génération du fichier .localConfigs.playground
# (en exécutant la tâche Deploy via Teams Toolkit)

# Vérifier le contenu généré
cat .localConfigs.playground

# Tester le chargement des variables
env-cmd -f .localConfigs.playground node -e "console.log('AZURE_SEARCH_KEY:', process.env.AZURE_SEARCH_KEY ? '✓ Présent' : '❌ Absent')"
```

### Règles de mapping YAML

Pour chaque environnement, le fichier YAML **DOIT** mapper explicitement toutes les variables critiques :

```yaml
# ✅ BON: Mapping explicite de toutes les variables
deploy:
  - uses: file/createOrUpdateEnvironmentFile
    with:
      target: ./.localConfigs.playground
      envs:
        AZURE_OPENAI_API_KEY: ${{AZURE_OPENAI_API_KEY}}
        AZURE_OPENAI_ENDPOINT: ${{AZURE_OPENAI_ENDPOINT}}
        AZURE_OPENAI_DEPLOYMENT_NAME: ${{AZURE_OPENAI_DEPLOYMENT_NAME}}
        AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME: ${{AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME}}
        AZURE_SEARCH_ENDPOINT: ${{AZURE_SEARCH_ENDPOINT}}
        AZURE_SEARCH_KEY: ${{AZURE_SEARCH_KEY}}
        AZURE_SEARCH_INDEX_NAME: ${{AZURE_SEARCH_INDEX_NAME}}
        AZURE_SEARCH_STRICTNESS: ${{AZURE_SEARCH_STRICTNESS}}
        AZURE_SEARCH_RETRIEVED_DOCUMENTS: ${{AZURE_SEARCH_RETRIEVED_DOCUMENTS}}
        AZURE_SEARCH_LIMIT_TO_DATA_CONTENT: ${{AZURE_SEARCH_LIMIT_TO_DATA_CONTENT}}
        DEBUG: ${{DEBUG}}

# ❌ MAUVAIS: Variables manquantes
deploy:
  - uses: file/createOrUpdateEnvironmentFile
    with:
      target: ./.localConfigs.playground
      envs:
        AZURE_OPENAI_API_KEY: ${{AZURE_OPENAI_API_KEY}}
        # ❌ AZURE_SEARCH_KEY manquant → Crash au démarrage
```

### Troubleshooting : Variable non générée

**Symptôme** : `Error: key must be a non-empty string`

**Diagnostic** :
1. Vérifier que la variable est définie dans `env/.env.playground.user`
   ```bash
   grep AZURE_SEARCH_KEY env/.env.playground.user
   ```

2. Vérifier que la variable est mappée dans le YAML
   ```bash
   grep AZURE_SEARCH_KEY m365agents.playground.yml
   ```

3. Vérifier que le fichier `.localConfigs.playground` a été régénéré
   ```bash
   grep AZURE_SEARCH_KEY .localConfigs.playground
   ```

4. Si manquant, **relancer le déploiement** pour régénérer :
   - Via UI : Cliquer sur "Deploy" dans Teams Toolkit
   - Via CLI : `teamsfx deploy --env playground`

**Solution permanente** : Toujours mettre à jour le YAML quand une nouvelle variable est ajoutée.
