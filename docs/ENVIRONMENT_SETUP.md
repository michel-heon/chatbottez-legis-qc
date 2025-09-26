# Configuration d'environnement simplifiée

## Architecture sans Key Vault

Le projet a été simplifié pour utiliser des fichiers d'environnement directs au lieu d'Azure Key Vault.

## Fichiers de configuration

- `env/common.env` - Variables communes (ex.: `TEAMS_APP_VERSION`)
- `env/common.env.user` - Secrets communs (local uniquement, ignoré par git)
- `env/.env.dev` - Environnement de développement
- `env/.env.prod` - Environnement de production  
- `env/.env.cotechnoe` - Environnement Cotechnoe
- `env/.env.playground.user` - Environnement de test local

### Variables nécessaires :

#### Bot Configuration
- `BOT_ID` - ID de votre bot Teams
- `BOT_TYPE` - Type de bot (généralement MultiTenant)
- `BOT_TENANT_ID` - ID du tenant Azure
- `BOT_PASSWORD` - Mot de passe du bot

#### Azure OpenAI
- `AZURE_OPENAI_API_KEY` - Clé API Azure OpenAI
- `AZURE_OPENAI_ENDPOINT` - Point de terminaison Azure OpenAI
- `AZURE_OPENAI_DEPLOYMENT_NAME` - Nom du déploiement (ex: gpt-4)
- `AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME` - Nom du déploiement d'embedding

#### Azure AI Search  
- `AZURE_SEARCH_KEY` - Clé API Azure Search
- `AZURE_SEARCH_ENDPOINT` - Point de terminaison Azure Search
- `AZURE_SEARCH_INDEX_NAME` - Nom de l'index de recherche

#### Navigateur de preview
- `CHROMIUM_BIN` - Binaire Chromium utilisé par les commandes `make preview` et VS Code (défaut: `/snap/bin/chromium`)

## Scripts disponibles

- `npm run dev:teamsfx:testtool` - Démarrage en mode test avec playground
- `npm run dev:teamsfx` - Démarrage en mode développement
- `npm run start` - Production avec env dev
- `npm run start:prod` - Production avec env prod
- `npm run start:cotechnoe` - Production avec env cotechnoe

## Configuration initiale

1. Copiez un fichier d'environnement template
2. Remplacez les placeholders par vos vraies valeurs
3. Assurez-vous que le fichier est dans .gitignore pour la sécurité
4. Chargez toujours `env/common.env` puis `env/common.env.user` (s'il existe) **avant** un fichier `.env.{env}` quand vous lancez une commande TeamsFx/ATK manuellement (`set -a; source env/common.env; [ -f env/common.env.user ] && source env/common.env.user; source env/.env.dev; set +a`)
5. Lors d'un démarrage via VS Code (F5), la tâche `Sync shared env secrets` exécute automatiquement `scripts/sync-shared-env.js` afin de répliquer les clés communes vers les fichiers `.env.{env}` et `.env.{env}.user` exigés par Teams Toolkit.
6. Le profil de débogage Firefox lit désormais directement `env/.env.local`; l'URL Teams utilise `TEAMS_APP_ID` sans laisser de placeholders (plus de `${{local:...}}`).
7. Démarrez l'application avec le script approprié

## Débogage VS Code

- Avant chaque `npm run dev`, `scripts/free-port.js` se charge de libérer le port d'inspection Node `9239` pour éviter les collisions lors des redémarrages.

## Sécurité

- Tous les fichiers `.env*` sont ignorés par git
- Ne commitez jamais de vraies clés API
- Utilisez des variables d'environnement en production
