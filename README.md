# 🤖 Chatbot Legis QC

Agent conversationnel intelligent pour Microsoft 365 Teams avec capacités RAG (Retrieval Augmented Generation) alimenté par Azure AI Search.

## 🎯 Vue d'ensemble

Ce projet démontre la construction d'un chatbot sophistiqué capable de répondre à des questions spécifiques basées sur des documents indexés, directement dans Microsoft Teams. Il utilise des techniques avancées comme :

- **[Retrieval Augmented Generation (RAG)](https://python.langchain.com/docs/use_cases/question_answering/#what-is-rag)** - Génération augmentée par récupération
- **[Azure AI Search](https://learn.microsoft.com/azure/search/search-what-is-azure-search)** - Recherche hybride (textuelle + vectorielle)  
- **[Teams AI Library](https://learn.microsoft.com/microsoftteams/platform/bots/how-to/teams%20conversational%20ai/teams-conversation-ai-overview)** - Framework Microsoft pour agents Teams
- **🔍 SPARQL + Apache Jena** - Extraction ontologique robuste avec support tags `@fr`

### 🚀 Architecture Enhanced avec SPARQL

Le projet intègre **Apache Jena SPARQL** pour une extraction précise des métadonnées légales :

- ✅ **Gestion des tags de langue** : Support natif des valeurs `@fr` dans les fichiers TTL
- ✅ **Extraction ontologique robuste** : Requêtes SPARQL professionnelles vs parsing regex
- ✅ **Intelligent legal sorting** : Priorité automatique A-3.001 (en vigueur) > A-3 (abrogée)
- ✅ **Pipeline bidirectionnel** : SPARQL principal + fallback legacy parsing

## ⚡ Démarrage rapide

### 🚀 Installation simplifiée (3 étapes)
```bash
# 1. Installation des dépendances
make install

# 2. Configuration de l'environnement (clés API)
make setup

# 3. Démarrage du bot
make run
```

### 🧪 Tests et Validation
```bash
# Test principal - validation correction priorisation légale
node tests/simulate-fixed-search.js

# Test SPARQL - extraction métadonnées avec support @fr
node tests/test-sparql-direct.js

# Test pipeline enhanced complet
node tests/test-enhanced-pipeline.js

# Diagnostic des données
node tests/debug-status.js
```

> **⚠️ Note Développeurs** : Avant de créer de nouveaux scripts de test, consultez `docs/DEVELOPMENT_GUIDE.md` pour la philosophie de réutilisabilité.

### 📚 Documentation Complète
make env-setup

# 3. Configuration complète automatique
make setup-complete
```

### 🔍 Vérification
```bash
# Vérifier l'état de l'index
make index-status

# Tester les recherches
make index-test

# Voir toutes les commandes disponibles
make help
```

### 📋 Commandes principales
```bash
# Configuration et gestion
make setup-complete          # ✨ Configuration complète (RECOMMANDÉ)
make setup-index-only        # Créer seulement l'index
make populate-content        # Ajouter du contenu à l'index

# Gestion quotidienne  
make index-status           # Vérifier l'état de l'index
make index-test             # Tester les recherches
make index-delete           # Supprimer l'index
make index-reindex          # Recréer complètement l'index

# Diagnostic
make env-check              # Vérifier la configuration
make diagnostic             # Diagnostic complet du système
```

## 📚 Documentation complète

👉 **[Consulter la documentation détaillée](./docs/README.md)** dans le dossier `./docs/`

### Guides principaux
- 🎮 **[Guide Microsoft 365 Playground](./docs/playground-guide.md)** - Configuration et utilisation du Playground
- � **[Apache Jena Integration](./docs/apache-jena-integration.md)** - SPARQL et extraction ontologique
- �📝 **[Conventions de Nomenclature](./NAMING_CONVENTIONS.md)** - Règles simples et obligatoires
- 📊 **[Bilan du Projet](./PROJECT_SUMMARY.md)** - Vue d'ensemble complète et métriques
- 🛠️ **[Guide d'installation](./docs/setup-guide.md)** - Configuration pas à pas
- 🔍 **[Gestion Azure Search](./docs/azure-search-management.md)** - Guide complet d'indexation
- 🔧 **[Référence des scripts](./docs/scripts-reference.md)** - Documentation technique
- 📝 **[Changelog](./CHANGELOG.md)** - Historique des versions et migrations

## 🔧 Prérequis système

### Dépendances obligatoires

> **⚠️ Important** : Ce projet utilise **Apache Jena** pour l'extraction des métadonnées ontologiques avec support des tags de langue `@fr`.

**Environnement de base :**
- [Node.js](https://nodejs.org/) versions supportées : 18, 20, 22
- [Microsoft 365 Agents Toolkit Visual Studio Code Extension](https://aka.ms/teams-toolkit) version 5.0.0+
- [Microsoft 365 Agents Toolkit CLI](https://aka.ms/teamsfx-toolkit-cli)

**Services Azure :**
- [Azure OpenAI](https://aka.ms/oai/access) resource configurée
- [Azure AI Search](https://azure.microsoft.com/en-us/products/ai-services/ai-search) configuré

**⭐ Apache Jena (Obligatoire pour SPARQL)** :
- [Apache Jena 5.x](https://jena.apache.org/download/) installé dans `/opt/jena`
- Variable d'environnement `JENA_HOME=/opt/jena` 
- `PATH` mis à jour pour inclure `$JENA_HOME/bin`

### 🚀 Installation Apache Jena

```bash
# Installation automatique (recommandée)
sudo wget https://archive.apache.org/dist/jena/binaries/apache-jena-5.5.0.tar.gz
sudo tar -xzf apache-jena-5.5.0.tar.gz -C /opt/
sudo ln -s /opt/apache-jena-5.5.0 /opt/jena

# Configuration environnement
echo 'export JENA_HOME=/opt/jena' >> ~/.bashrc
echo 'export PATH=$JENA_HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Validation installation
sparql --version
```

## Get started with Microsoft 365 Agents Playground

### 🔧 Configuration automatisée
1. **Setup de l'environnement Playground**
   ```bash
   make playground-env-setup
   ```

2. **Configuration des clés Azure** dans `env/.env.playground.user`:
   ```bash
   SECRET_AZURE_OPENAI_API_KEY=<your-openai-api-key>
   AZURE_OPENAI_ENDPOINT=<your-openai-endpoint>
   AZURE_OPENAI_DEPLOYMENT_NAME=<your-deployment-name>
   AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=<your-embedding-deployment>
   SECRET_AZURE_SEARCH_KEY=<your-search-key>
   AZURE_SEARCH_ENDPOINT=<your-search-endpoint>
   AZURE_SEARCH_INDEX_NAME=index-data-sample
   ```

3. **Validation de la configuration**
   ```bash
   make playground-env-validate
   ```

4. **Création et indexation**
   ```bash
   make playground-setup
   ```

5. **Démarrage du Playground**
   - Via commandes : `npm run dev:teamsfx:testtool` puis `npm run dev:teamsfx:launch-testtool`
   - Via VS Code : Utilisez les tâches "Start application (Microsoft 365 Agents Playground)"

**Congratulations**! You are running an application that can now interact with users in Microsoft 365 Agents Playground.

## What's included in the template

| Folder       | Contents                                            |
| - | - |
| `.vscode`    | VSCode files for debugging                          |
| `appPackage` | Templates for the application manifest        |
| `env`        | Environment files                                   |
| `infra`      | Templates for provisioning Azure resources          |
| `src`        | The source code for the application                 |

The following files can be customized and demonstrate an example implementation to get you started.

| File                                 | Contents                                           |
| - | - |
|`src/index.ts`| Sets up the agent app server.|
|`src/adapter.ts`| Sets up the agent adapter.|
|`src/config.ts`| Defines the environment variables.|
|`src/prompts/chat/skprompt.txt`| Defines the prompt.|
|`src/prompts/chat/config.json`| Configures the prompt.|
|`src/app/app.ts`| Handles business logics for the RAG agent.|
|`src/app/azureAISearchDataSource.ts`| Defines the Azure AI search data source.|
|`src/indexers/data/*.md`| Raw text data sources.|
|`src/indexers/utils.ts`| Basic index tools. |
|`src/indexers/setup.ts`| A script to create index and upload documents. |
|`src/indexers/delete.ts`| A script to delete index and documents. |

The following are Microsoft 365 Agents Toolkit specific project files. You can [visit a complete guide on Github](https://github.com/OfficeDev/TeamsFx/wiki/Teams-Toolkit-Visual-Studio-Code-v5-Guide#overview) to understand how Microsoft 365 Agents Toolkit works.

| File                                 | Contents                                           |
| - | - |
|`m365agents.yml`|This is the main Microsoft 365 Agents Toolkit project file. The project file defines two primary things:  Properties and configuration Stage definitions. |
|`m365agents.local.yml`|This overrides `m365agents.yml` with actions that enable local execution and debugging.|
|`m365agents.playground.yml`| This overrides `m365agents.yml` with actions that enable local execution and debugging in Microsoft 365 Agents Playground.|

## 📚 Documentation complète

Pour une documentation complète du projet, consultez le **[dossier docs/](./docs/README.md)** qui contient :
- 📖 Guides utilisateur détaillés
- 🔧 Référence technique des scripts  
- 📊 Architecture et développement
- 🚀 Guides de configuration avancés

## Extend the template

- Follow [Build a Basic AI Chatbot in Teams](https://aka.ms/teamsfx-basic-ai-chatbot) to extend the template with more AI capabilities.
- Follow [Build a RAG Bot in Teams](https://aka.ms/teamsfx-rag-bot) to extend the template with more RAG capabilities.
- Understand more about [Azure AI Search as data source](https://aka.ms/teamsfx-rag-bot#azure-ai-search-as-data-source).

## Additional information and references

- [Microsoft 365 Agents Toolkit Documentations](https://docs.microsoft.com/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)
- [Microsoft 365 Agents Toolkit CLI](https://aka.ms/teamsfx-toolkit-cli)
- [Microsoft 365 Agents Toolkit Samples](https://github.com/OfficeDev/TeamsFx-Samples)