# ADR 019: Microsoft 365 Agents Toolkit - Bonnes Pratiques et Gestion des Variables

## Statut

✅ Accepté

## Date

2025-12-11

## Contexte

**Décideurs** : Équipe de développement Légis Québec  
**Impact technique** : Critique - Architecture fondamentale du projet

Le projet Légis Québec utilise **Microsoft 365 Agents Toolkit** (anciennement Teams Toolkit) pour développer, provisionner, déployer et gérer l'application conversationnelle. Ce framework impose une architecture spécifique pour la gestion des environnements et des variables de configuration.

### Architecture Microsoft 365 Agents Toolkit

Microsoft 365 Agents Toolkit fournit une approche **déclarative** pour gérer les cycles de vie des applications via des fichiers YAML qui orchestrent les opérations de provisionnement, déploiement et configuration.

```
┌─────────────────────────────────────────────────────────────────┐
│ Microsoft 365 Agents Toolkit - Architecture en 4 niveaux       │
└─────────────────────────────────────────────────────────────────┘

NIVEAU 1: Fichiers de configuration source (.env)
├── env/.env.{ENV}           Variables publiques par environnement
├── env/.env.{ENV}.user      Variables secrètes par environnement (gitignored)
└── Chargés par Teams Toolkit lors de l'exécution des pipelines YAML

NIVEAU 2: Fichiers de pipeline (YAML)
├── m365agents.yml           Pipeline de base (utilisé par dev/prod)
├── m365agents.local.yml     Surcharges pour développement local
├── m365agents.playground.yml Surcharges pour test playground
└── Définissent les actions de provision/deploy/configuration

NIVEAU 3: Fichiers de configuration runtime (.localConfigs)
├── .localConfigs            Généré pour env local
├── .localConfigs.playground Généré pour env playground
└── Créés par l'action file/createOrUpdateEnvironmentFile

NIVEAU 4: Application Node.js
├── src/config.js            Charge process.env.VARIABLE_NAME
├── src/agent.js             Utilise les variables via config
└── Environnement injecté par env-cmd lors du démarrage
```

### Problèmes identifiés avec l'approche initiale

#### 1. Confusion avec le préfixe SECRET_

**Problème initial** : Utilisation incohérente du préfixe `SECRET_` :
```javascript
// Fichier env/.env.playground.user
SECRET_AZURE_OPENAI_API_KEY=...

// Fichier YAML
AZURE_OPENAI_API_KEY: ${{SECRET_AZURE_OPENAI_API_KEY}}

// Code
process.env.AZURE_OPENAI_API_KEY  // ❌ Undefined car généré sans SECRET_
```

**Conséquence** : Nécessitait une logique de fallback complexe :
```javascript
azureOpenAIKey: process.env.SECRET_AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY
```

#### 2. Variables manquantes dans les fichiers YAML

**Problème** : Les fichiers YAML ne mappaient pas toutes les variables critiques :
```yaml
# m365agents.playground.yml (version initiale - INCOMPLET)
envs:
  AZURE_OPENAI_API_KEY: ${{SECRET_AZURE_OPENAI_API_KEY}}
  AZURE_OPENAI_ENDPOINT: ${{AZURE_OPENAI_ENDPOINT}}
  # ❌ AZURE_SEARCH_KEY manquant
  # ❌ AZURE_SEARCH_INDEX_NAME manquant
  # ❌ Variables de configuration RAG manquantes
```

**Conséquence** : Erreurs au démarrage `Error: key must be a non-empty string`

#### 3. Désynchronisation entre environnements

**Problème** : Chaque fichier YAML avait un mapping différent, créant des incohérences entre local/playground/dev.

### Bonnes pratiques Microsoft

Selon la [documentation officielle Microsoft 365 Agents Toolkit](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teamsfx-multi-env) :

1. **Variables publiques** → `env/.env.{ENV}` (commitées)
2. **Variables secrètes** → `env/.env.{ENV}.user` (gitignored)
3. **Mapping explicite** → Fichiers YAML avec `${{VARIABLE_NAME}}`
4. **Génération automatique** → `.localConfigs` via `file/createOrUpdateEnvironmentFile`
5. **Noms cohérents** → Même nom de variable du fichier source au code

## Décision

### Principe architectural

**Adopter pleinement les conventions Microsoft 365 Agents Toolkit** avec une gestion déclarative et explicite des variables d'environnement, sans préfixe `SECRET_`.

### Règle 1 : Convention de nommage unifiée

**PRINCIPE** : Une variable utilise le **même nom** à tous les niveaux.

```
Fichier source (.env.playground.user):
  AZURE_OPENAI_API_KEY=abc123...

Référence YAML (m365agents.playground.yml):
  AZURE_OPENAI_API_KEY: ${{AZURE_OPENAI_API_KEY}}

Fichier généré (.localConfigs.playground):
  AZURE_OPENAI_API_KEY=abc123...

Code source (src/config.js):
  azureOpenAIKey: process.env.AZURE_OPENAI_API_KEY
```

**Justification** :
- ✅ Pas de logique de fallback nécessaire
- ✅ Débogage simplifié (même nom partout)
- ✅ Moins de confusion pour les développeurs
- ✅ Conforme aux exemples Microsoft

**Protection des secrets** : Assurée par `.gitignore`, pas par un préfixe.

### Règle 2 : Mapping YAML exhaustif

**PRINCIPE** : Tous les fichiers YAML **doivent** mapper explicitement toutes les variables critiques.

```yaml
# m365agents.playground.yml (version conforme)
deploy:
  - uses: file/createOrUpdateEnvironmentFile
    with:
      target: ./.localConfigs.playground
      envs:
        # Azure OpenAI - Modèle GPT
        AZURE_OPENAI_API_KEY: ${{AZURE_OPENAI_API_KEY}}
        AZURE_OPENAI_ENDPOINT: ${{AZURE_OPENAI_ENDPOINT}}
        AZURE_OPENAI_DEPLOYMENT_NAME: ${{AZURE_OPENAI_DEPLOYMENT_NAME}}
        AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME: ${{AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME}}
        
        # Azure AI Search - RAG
        AZURE_SEARCH_ENDPOINT: ${{AZURE_SEARCH_ENDPOINT}}
        AZURE_SEARCH_KEY: ${{AZURE_SEARCH_KEY}}
        AZURE_SEARCH_INDEX_NAME: ${{AZURE_SEARCH_INDEX_NAME}}
        AZURE_SEARCH_STRICTNESS: ${{AZURE_SEARCH_STRICTNESS}}
        AZURE_SEARCH_RETRIEVED_DOCUMENTS: ${{AZURE_SEARCH_RETRIEVED_DOCUMENTS}}
        AZURE_SEARCH_LIMIT_TO_DATA_CONTENT: ${{AZURE_SEARCH_LIMIT_TO_DATA_CONTENT}}
        
        # Configuration application
        DEBUG: ${{DEBUG}}
        TEAMSFX_NOTIFICATION_STORE_FILENAME: ${{TEAMSFX_NOTIFICATION_STORE_FILENAME}}
```

**Validation** : L'application **DOIT** valider les variables critiques au démarrage (voir `src/config.js`).

### Règle 3 : Structure des fichiers par environnement

#### Environnement LOCAL

**Fichier source** : `env/.env.local.user`
```bash
# Secrets pour développement local
AZURE_OPENAI_API_KEY=...
AZURE_SEARCH_KEY=...
AZURE_SEARCH_INDEX_NAME='fileupload-justice-index-02'
```

**Fichier YAML** : `m365agents.local.yml`
```yaml
deploy:
  - uses: file/createOrUpdateEnvironmentFile
    with:
      target: ./.localConfigs
      envs:
        AZURE_OPENAI_API_KEY: ${{AZURE_OPENAI_API_KEY}}
        # ... toutes les variables
```

**Script npm** : `package.json`
```json
{
  "scripts": {
    "dev:teamsfx": "env-cmd --silent -f .localConfigs npm run dev"
  }
}
```

#### Environnement PLAYGROUND

**Fichier public** : `env/.env.playground`
```bash
# Variables non sensibles
TEAMSFX_ENV=playground
AZURE_OPENAI_ENDPOINT='https://openai-cotechnoe.openai.azure.com/'
AZURE_SEARCH_ENDPOINT='https://search-cotechnoe-ai.search.windows.net'
AZURE_SEARCH_STRICTNESS=2
DEBUG=true
```

**Fichier secrets** : `env/.env.playground.user` (gitignored)
```bash
# Secrets pour playground
AZURE_OPENAI_API_KEY=...
AZURE_SEARCH_KEY=...
AZURE_SEARCH_INDEX_NAME='fileupload-justice-index-02'
```

**Fichier YAML** : `m365agents.playground.yml`
```yaml
deploy:
  - uses: devTool/install
    with:
      testTool:
        version: ~0.2.7
        symlinkDir: ./devTools/playground

  - uses: cli/runNpmCommand
    with:
      args: install --no-audit

  - uses: file/createOrUpdateEnvironmentFile
    with:
      target: ./.localConfigs.playground
      envs:
        AZURE_OPENAI_API_KEY: ${{AZURE_OPENAI_API_KEY}}
        AZURE_OPENAI_ENDPOINT: ${{AZURE_OPENAI_ENDPOINT}}
        # ... toutes les variables
```

**Script npm** : `package.json`
```json
{
  "scripts": {
    "dev:teamsfx:playground": "env-cmd --silent -f .localConfigs.playground npm run dev"
  }
}
```

#### Environnement DEV/PROD (Azure)

**Fichier secrets** : `env/.env.dev.user`
```bash
AZURE_OPENAI_API_KEY=...
AZURE_SEARCH_KEY=...
AZURE_SEARCH_INDEX_NAME='fileupload-justice-index-02'
```

**Configuration Azure** : App Service → Configuration → Application Settings
- Variables définies manuellement dans le portail Azure
- Synchronisation avec `env/.env.dev.user` pour référence

### Règle 4 : Validation au démarrage

**PRINCIPE** : L'application refuse de démarrer si la configuration est incomplète.

```javascript
// src/config.js
const config = {
  azureOpenAIKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureSearchKey: process.env.AZURE_SEARCH_KEY,
  azureSearchIndexName: process.env.AZURE_SEARCH_INDEX_NAME,
  // ... autres variables
};

// Validation des variables critiques
const requiredVars = [
  { key: 'azureOpenAIKey', env: 'AZURE_OPENAI_API_KEY' },
  { key: 'azureOpenAIEndpoint', env: 'AZURE_OPENAI_ENDPOINT' },
  { key: 'azureSearchKey', env: 'AZURE_SEARCH_KEY' },
  { key: 'azureSearchIndexName', env: 'AZURE_SEARCH_INDEX_NAME' },
];

const missingVars = requiredVars.filter(v => !config[v.key]);
if (missingVars.length > 0) {
  console.error('Configuration Error: Missing required environment variables:');
  missingVars.forEach(v => console.error(`   - ${v.env}`));
  console.error('\nCheck: env/.env.{ENV}.user and m365agents.{ENV}.yml');
  console.error('See: docs/adr/019-microsoft-365-agents-toolkit-bonnes-pratiques.md');
  process.exit(1);
}

module.exports = config;
```

### Règle 5 : Flux de travail Teams Toolkit

**Provision** (première fois par environnement) :
```bash
# Via VS Code: Teams Toolkit → Provision
# Via CLI:
teamsfx provision --env playground
```

**Deploy** (à chaque changement de code ou config) :
```bash
# Via VS Code: Teams Toolkit → Deploy
# Via CLI:
teamsfx deploy --env playground
```

Le déploiement exécute automatiquement :
1. Charge `env/.env.playground` + `env/.env.playground.user`
2. Résout les variables `${{VARIABLE_NAME}}` dans le YAML
3. Exécute les actions `file/createOrUpdateEnvironmentFile`
4. Génère `.localConfigs.playground` avec toutes les variables

**Start** (démarrer l'application) :
```bash
# Via VS Code: F5 → "Start Agent in Microsoft 365 Agents Playground"
# Via CLI:
npm run dev:teamsfx:playground
```

### Règle 6 : Séparation des responsabilités

| Fichier | Rôle | Committé ? |
|---------|------|------------|
| `env/.env.{ENV}` | Variables publiques (endpoints, config) | ✅ Oui |
| `env/.env.{ENV}.user` | Secrets (API keys, tokens) | ❌ Non (.gitignore) |
| `m365agents.{ENV}.yml` | Pipeline de déploiement | ✅ Oui |
| `.localConfigs{.ENV}` | Fichier runtime généré | ❌ Non (.gitignore) |
| `src/config.js` | Lecture de process.env | ✅ Oui |

## Conséquences

### Positives ✅

1. **Conformité Microsoft** : Respect total des conventions officielles
2. **Simplicité** : Pas de logique de fallback, noms cohérents
3. **Traçabilité** : Historique des variables via les YAML committés
4. **Fail-fast** : Validation au démarrage, pas d'erreurs en runtime
5. **Multi-environnement** : Isolation claire local/playground/dev/prod
6. **Débogage simplifié** : Même nom de variable du fichier source au code
7. **Sécurité** : Secrets protégés par .gitignore, pas besoin de préfixe
8. **Documentation** : Fichiers YAML servent de documentation des variables

### Négatives ⚠️

1. **Duplication** : Variables définies dans .env.user + mappées dans YAML
2. **Synchronisation manuelle** : Azure App Service doit être mis à jour manuellement
3. **Courbe d'apprentissage** : Équipe doit comprendre l'architecture en 4 niveaux
4. **Régénération requise** : Changement de variable → redéployer via Teams Toolkit

### Mitigations 🔧

**Pour la duplication** :
- Considérer les fichiers YAML comme la "source de vérité" des variables requises
- Utiliser l'ADR-009 comme référence pour la liste complète des variables

**Pour la synchronisation Azure** :
- Documenter la procédure dans `docs/PRODUCTION-DEPLOYMENT-PROCEDURE.md`
- Créer un script de validation Azure CLI pour vérifier la cohérence

**Pour l'apprentissage** :
- Ce présent ADR comme documentation de référence
- Guide pratique : `docs/ENVIRONMENT_SETUP.md`
- Diagrammes de flux dans cet ADR

**Pour la régénération** :
- Workflow clair documenté (Provision → Deploy → Start)
- Messages d'erreur explicites pointant vers cet ADR

## Alternatives Considérées

### Alternative 1 : dotenv sans Teams Toolkit

**Approche** : Charger directement les fichiers `.env` avec `dotenv` au démarrage.

```javascript
require('dotenv').config({ path: '.env.playground' });
```

**Rejeté** :
- ❌ Incompatible avec l'écosystème Microsoft 365 Agents
- ❌ Perd les fonctionnalités de provisionnement automatique
- ❌ Pas de gestion des environnements Teams/Azure intégrée
- ❌ Pas de validation par Teams Toolkit

### Alternative 2 : Fichier JSON de configuration

**Approche** : Utiliser un fichier `config.json` pour toutes les variables.

```json
{
  "playground": {
    "azureOpenAIKey": "...",
    "azureSearchKey": "..."
  }
}
```

**Rejeté** :
- ❌ Risque de commit accidentel des secrets
- ❌ Non conforme aux pratiques Microsoft 365 Agents Toolkit
- ❌ Duplication avec les fichiers .env
- ❌ Pas de support natif dans Teams Toolkit

### Alternative 3 : Variables d'environnement système

**Approche** : Définir les variables au niveau du système d'exploitation.

```bash
export AZURE_OPENAI_API_KEY="..."
```

**Rejeté** :
- ❌ Non persistant entre les sessions
- ❌ Difficile à gérer pour plusieurs développeurs
- ❌ Incompatible avec le workflow Teams Toolkit
- ❌ Pas de séparation par environnement

### Alternative 4 : Garder le préfixe SECRET_

**Approche** : Continuer à utiliser `SECRET_AZURE_OPENAI_API_KEY` partout.

**Rejeté** :
- ❌ Non conforme aux exemples Microsoft officiels
- ❌ Crée une logique de fallback inutile
- ❌ Confusion pour les développeurs (deux noms pour une variable)
- ❌ Protection déjà assurée par .gitignore

## Références

- [Microsoft 365 Agents Toolkit - Multi-environment](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teamsfx-multi-env)
- [Microsoft 365 Agents Toolkit - Environment variables](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/toolkit-v4/teams-toolkit-fundamentals#environment-variables)
- [12-Factor App: Config](https://12factor.net/config)
- [Teams Toolkit Project File Schema](https://aka.ms/m365-agents-toolkits/v1.9/yaml.schema.json)
- ADR-009 : Gestion de AZURE_SEARCH_INDEX_NAME dans les environnements
- ADR-011 : Configuration centralisée

## Notes de mise en œuvre

### Checklist pour chaque environnement

#### Configuration initiale

- [ ] Créer `env/.env.{ENV}.user` depuis `.env.{ENV}.user.example`
- [ ] Remplir toutes les variables secrètes (API keys)
- [ ] Vérifier que le fichier est dans `.gitignore`
- [ ] Mapper toutes les variables dans `m365agents.{ENV}.yml`
- [ ] Exécuter `teamsfx deploy --env {ENV}`
- [ ] Vérifier que `.localConfigs{.ENV}` contient toutes les variables
- [ ] Tester l'application : `npm run dev:teamsfx:{ENV}`

#### Ajout d'une nouvelle variable

- [ ] Ajouter dans `env/.env.{ENV}` (si publique) ou `env/.env.{ENV}.user` (si secrète)
- [ ] Mapper dans `m365agents.{ENV}.yml` → section `envs:`
- [ ] Ajouter la lecture dans `src/config.js`
- [ ] Ajouter à la validation (si critique)
- [ ] Relancer `teamsfx deploy --env {ENV}`
- [ ] Vérifier la génération dans `.localConfigs{.ENV}`
- [ ] Tester l'application

### Commandes de diagnostic

```bash
# Vérifier les variables définies
cat env/.env.playground.user

# Vérifier le mapping YAML
grep -A50 "envs:" m365agents.playground.yml

# Vérifier le fichier généré
cat .localConfigs.playground

# Tester le chargement
env-cmd -f .localConfigs.playground node -e "console.log('AZURE_SEARCH_KEY:', process.env.AZURE_SEARCH_KEY ? '✓ OK' : '✗ Manquant')"

# Valider toutes les variables critiques
node -e "require('./src/config.js'); console.log('✓ Configuration valide')"
```

### Troubleshooting

#### Erreur : "key must be a non-empty string"

**Cause** : Variable manquante ou mal mappée

**Solution** :
1. Vérifier `env/.env.{ENV}.user` contient la variable
2. Vérifier `m365agents.{ENV}.yml` mappe la variable
3. Supprimer `.localConfigs{.ENV}`
4. Relancer `teamsfx deploy --env {ENV}`
5. Vérifier `.localConfigs{.ENV}` contient la variable

#### Erreur : "Variable ${{VARIABLE_NAME}} not resolved"

**Cause** : Variable non définie dans les fichiers .env

**Solution** :
1. Ajouter la variable dans `env/.env.{ENV}` ou `env/.env.{ENV}.user`
2. Relancer le déploiement

#### Fichier .localConfigs pas regénéré

**Cause** : Cache Teams Toolkit ou fichier verrouillé

**Solution** :
```bash
# Supprimer les fichiers générés
rm .localConfigs*
# Relancer le déploiement
teamsfx deploy --env playground
```

---

**Révision** : v1.0  
**Prochaine révision** : À chaque mise à jour majeure de Microsoft 365 Agents Toolkit
