# INVENTAIRE CODE MÉTIER À PRÉSERVER

## Fichiers spécifiques au projet (à migrer)

### 1. Logic métier personnalisée
- `src/app/azureAISearchDataSource.js` - Intégration Azure AI Search
- `src/app/customSayCommand.js` - Commandes personnalisées
- `src/prompts/chat/skprompt.txt` - Prompts IA spécifiques
- `src/prompts/chat/config.template.json` - Configuration IA RAG

### 2. Configuration personnalisée
- Configuration directe via variables d'environnement
- `src/config.ts` - Configuration centralisée
- `env/` - Fichiers d'environnement par déploiement (+ `env/common.env` / `env/common.env.user` pour les variables communes et secrets)
- `scripts/sync-shared-env.js` - Synchronisation automatique des variables partagées vers les fichiers `.env.{env}` et `.env.{env}.user`
- `scripts/free-port.js` - Libère le port de debug Node (9239) avant chaque lancement local
- `scripts/open-teams-firefox.sh` - Ouvre Teams avec l'URL locale dans Firefox quand la CLI ne supporte pas ce navigateur

### 3. Assets et branding
- `appPackage/color.png` - Logo couleur
- `appPackage/outline.png` - Logo outline
- Descriptions et noms dans manifest.json

### 4. Configuration environnements
- `env/.env.template` - Template sécurisé
- `env/Makefile` - Gestion environnements
- `env/README.md` - Documentation

### 5. Infrastructure
- `infra/azure.bicep` - Template déploiement Azure
- `infra/azure.parameters.json` - Paramètres infra
- `infra/botRegistration/` - Configuration bot

### 6. Data et indexation
- `src/indexers/` - Scripts d'indexation complets
- `src/indexers/data/` - Données juridiques

## Configurations à adapter (non remplacer)

### Scripts package.json personnalisés
```json
"dev:teamsfx:launch-testtool": "env-cmd --silent -f env/common.env -f env/.env.playground teamsapptester start"
```

### Variables environnement spécifiques
- AZURE_SEARCH_* (intégration personnalisée)
- BOT_* (configuration bot spécifique)
- Configuration directe sans Key Vault

## Architecture à préserver
1. **5 Key Vaults** avec leurs rôles spécifiques
2. **Pipeline environnements** dev/playground/prod/cotechnoe
3. **Système de templates** sécurisés
4. **Scripts de validation** et sécurité
5. **Architecture RAG** avec Azure AI Search
