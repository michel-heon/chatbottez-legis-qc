# Configuration d'environnement simplifiée

## Architecture sans Key Vault

Le projet a été simplifié pour utiliser des fichiers d'environnement directs au lieu d'Azure Key Vault.

## Fichiers de configuration

### Fichiers d'environnement principaux :
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
4. Démarrez l'application avec le script approprié

## Sécurité

- Tous les fichiers `.env*` sont ignorés par git
- Ne commitez jamais de vraies clés API
- Utilisez des variables d'environnement en production
