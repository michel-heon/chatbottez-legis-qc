# 🛠️ Guide d'installation et configuration

Guide détaillé pour configurer l'environnement de développement du **Chatbot Legis QC**.

## 📋 Prérequis système

### Logiciels requis
- **Node.js** 16.x ou supérieur
- **npm** 8.x ou **yarn** 1.22.x
- **Git** 2.x
- **Make** (généralement préinstallé sur Linux/macOS)
- **curl** (pour les tests de connectivité)
- **jq** (optionnel, pour le formatage JSON)

### Services Azure requis
- **Azure AI Search** (Standard ou supérieur recommandé)
- **Azure OpenAI** avec modèles déployés :
  - GPT-4 mini (ou similaire) pour la génération
  - text-embedding-ada-002 (ou text-embedding-3-small) pour les embeddings

## 🔧 Installation pas à pas

### 1. Cloner le projet
```bash
git clone git@github.com:michel-heon/chatbottez-legis-qc.git
cd chatbottez-legis-qc
git checkout dev/gpt-teams-rag
```

### 2. Installer les dépendances
```bash
make install
# ou directement : npm install
```

### 3. Configuration des services Azure

#### Azure AI Search
1. Créer un service Azure AI Search dans le portail Azure
2. Noter l'endpoint : `https://your-service.search.windows.net/`
3. Récupérer la clé d'administration dans "Clés"

#### Azure OpenAI
1. Créer un service Azure OpenAI
2. Déployer les modèles requis :
   - **GPT-4 mini** (ou équivalent) - nom du déploiement : `gpt-4-mini`
   - **text-embedding-ada-002** - nom du déploiement : `text-embedding-ada-002`
3. Noter l'endpoint : `https://your-openai.openai.azure.com/`
4. Récupérer la clé API

### 4. Configuration des variables d'environnement

Créer le fichier `env/.env.playground.user` :
```bash
# Azure AI Search
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net/
SECRET_AZURE_SEARCH_KEY=your_search_admin_key

# Azure OpenAI  
AZURE_OPENAI_ENDPOINT=https://your-openai-service.openai.azure.com/
SECRET_AZURE_OPENAI_API_KEY=your_openai_api_key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4-mini
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002
```

> **Note** : Remplacer `playground` par `local` selon l'environnement souhaité.

### 5. Validation de la configuration
```bash
# Vérifier les variables d'environnement
make check-env

# Tester la connectivité Azure
make validate-config
```

### 6. Build et setup initial
```bash
# Compiler le projet TypeScript
make build

# Créer l'index et indexer les documents
make setup-index AZURE_SEARCH_KEY=your_key AZURE_OPENAI_KEY=your_key
```

## 🎯 Configuration avancée

### Environnements multiples

Le projet supporte plusieurs environnements :

#### Playground (développement)
```bash
# Variables dans env/.env.playground.user
make setup-playground
```

#### Local (test)
```bash
# Variables dans env/.env.local.user  
make setup-local
```

#### Production
```bash
# Variables dans env/.env.user (non inclus dans git)
make setup-index AZURE_SEARCH_KEY=prod_key AZURE_OPENAI_KEY=prod_key
```

### Configuration des modèles

#### GPT-4 Mini
```bash
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4-mini
```

#### Embeddings
```bash
# Modèle recommandé
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002

# Alternative plus récente
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-small
```

### Optimisation des performances

#### Configuration Azure AI Search
- **Niveau de service** : Standard S1 minimum pour la production
- **Répliques** : 2+ pour la haute disponibilité  
- **Partitions** : Selon le volume de données

#### Configuration Azure OpenAI
- **Quotas TPM** : Ajuster selon l'usage prévu
- **Région** : Choisir une région proche des utilisateurs
- **Modèles** : Déployer les versions les plus récentes

## 🔐 Sécurité et bonnes pratiques

### Gestion des secrets
```bash
# Clés préfixées SECRET_ sont masquées dans les logs
SECRET_AZURE_SEARCH_KEY=your_key
SECRET_AZURE_OPENAI_API_KEY=your_key

# Support des clés chiffrées
SECRET_AZURE_SEARCH_KEY=crypto_encrypted_value
```

### Fichiers d'environnement
```bash
# À inclure dans .gitignore
env/.env.*.user
env/.env.local
env/.env.production

# Fichiers de template (versionnés)
env/.env.example
env/.env.template
```

### Permissions Azure
- **Azure AI Search** : Contributor ou Search Service Contributor
- **Azure OpenAI** : Cognitive Services OpenAI User
- **Resource Group** : Reader (minimum)

## 🧪 Tests et validation

### Tests de connectivité
```bash
# Test complet de la configuration
make validate-config

# Test spécifique Azure Search
curl -H "api-key: $AZURE_SEARCH_KEY" \
     "$AZURE_SEARCH_ENDPOINT/indexes?api-version=2023-11-01"

# Test spécifique Azure OpenAI
curl -H "api-key: $AZURE_OPENAI_KEY" \
     "$AZURE_OPENAI_ENDPOINT/openai/deployments?api-version=2023-05-15"
```

### Tests fonctionnels
```bash
# Créer un index de test
make setup-index AZURE_SEARCH_KEY=key AZURE_OPENAI_KEY=key

# Vérifier le contenu
make index-status AZURE_SEARCH_KEY=key

# Démarrer l'application
make dev
```

## 🚨 Dépannage

### Erreurs communes

#### Variables d'environnement manquantes
```bash
Error: Missing required environment variables
```
**Solution** : Exécuter `make check-env` et configurer les variables manquantes.

#### Connectivité Azure
```bash
Cannot reach Azure Search endpoint
```
**Solutions** :
1. Vérifier l'endpoint dans la configuration
2. Contrôler les règles de pare-feu Azure
3. Tester la connectivité réseau

#### Authentification
```bash
Authentication failed - check your Azure Search key
```
**Solutions** :
1. Régénérer les clés dans le portail Azure
2. Vérifier les permissions RBAC
3. Contrôler la validité des clés

#### Modèles non déployés
```bash
The API deployment for this resource does not exist
```
**Solutions** :
1. Déployer les modèles requis dans Azure OpenAI
2. Vérifier les noms de déploiement
3. Contrôler les quotas de déploiement

### Diagnostic avancé

#### Logs détaillés
```bash
# Activer le debug
export DEBUG=azure-search:*
make setup-index AZURE_SEARCH_KEY=key AZURE_OPENAI_KEY=key
```

#### Monitoring des ressources
```bash
# Statut des services Azure
az search service show --name your-search-service --resource-group your-rg
az cognitiveservices account show --name your-openai --resource-group your-rg
```

## 📚 Ressources supplémentaires

### Documentation Microsoft
- [Azure AI Search REST API](https://docs.microsoft.com/en-us/rest/api/searchservice/)
- [Azure OpenAI Service](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/)
- [Microsoft Teams Toolkit](https://docs.microsoft.com/en-us/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)

### Exemples de code
- [Azure Search Vector Samples](https://github.com/Azure/azure-search-vector-samples)
- [Teams AI Library](https://github.com/microsoft/teams-ai)

### Outils utiles
- **Azure CLI** : Gestion des ressources Azure
- **Postman** : Tests API REST
- **Azure Portal** : Interface graphique Azure
- **VS Code** : Développement avec extensions Teams Toolkit
