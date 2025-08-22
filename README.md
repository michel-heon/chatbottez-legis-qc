# 🤖 Chatbot Legis QC

Agent conversationnel intelligent pour Microsoft 365 Teams avec capacités RAG (Retrieval Augmented Generation) alimenté par Azure AI Search.

## 🎯 Vue d'ensemble

Ce projet démontre la construction d'un chatbot sophistiqué capable de répondre à des questions spécifiques basées sur des documents indexés, directement dans Microsoft Teams. Il utilise des techniques avancées comme :

- **[Retrieval Augmented Generation (RAG)](https://python.langchain.com/docs/use_cases/question_answering/#what-is-rag)** - Génération augmentée par récupération
- **[Azure AI Search](https://learn.microsoft.com/azure/search/search-what-is-azure-search)** - Recherche hybride (textuelle + vectorielle)  
- **[Teams AI Library](https://learn.microsoft.com/microsoftteams/platform/bots/how-to/teams%20conversational%20ai/teams-conversation-ai-overview)** - Framework Microsoft pour agents Teams

## ⚡ Démarrage rapide

### 🚀 Installation automatisée avec Makefile
```bash
# 1. Installation des dépendances
make install

# 2. Configuration de l'environnement Playground
make playground-env-setup

# 3. Éditer env/.env.playground.user avec vos clés Azure

# 4. Validation de la configuration
make playground-env-validate

# 5. Configuration de l'index Azure Search
make playground-setup

# 6. Démarrage de l'application Playground
npm run dev:teamsfx:testtool
npm run dev:teamsfx:launch-testtool
```

### 📋 Commandes disponibles
```bash
make help                    # Affiche toutes les commandes disponibles
make playground-env-setup    # Configuration environnement Playground
make playground-env-validate # Validation configuration Playground
make index-status           # Vérifie l'état de l'index
make index-reindex          # Reconstruit l'index complet
```

## 📚 Documentation complète

👉 **[Consulter la documentation détaillée](./docs/README.md)** dans le dossier `./docs/`

### Guides principaux
- 🎮 **[Guide Microsoft 365 Playground](./docs/playground-guide.md)** - Configuration et utilisation du Playground
- 🛠️ **[Guide d'installation](./docs/setup-guide.md)** - Configuration pas à pas
- 🔍 **[Gestion Azure Search](./docs/azure-search-management.md)** - Guide complet d'indexation
- 🔧 **[Référence des scripts](./docs/scripts-reference.md)** - Documentation technique
- 📝 **[Changelog](./CHANGELOG.md)** - Historique des versions et migrations

## Get started with Microsoft 365 Agents Playground

> **Prerequisites**
>
> To run the template in your local dev machine, you will need:
>
> - [Node.js](https://nodejs.org/), supported versions: 18, 20, 22
> - [Microsoft 365 Agents Toolkit Visual Studio Code Extension](https://aka.ms/teams-toolkit) version 5.0.0 and higher or [Microsoft 365 Agents Toolkit CLI](https://aka.ms/teamsfx-toolkit-cli)
> - Prepare your own [Azure OpenAI](https://aka.ms/oai/access) resource and [Azure AI Search](https://azure.microsoft.com/en-us/products/ai-services/ai-search).

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

## Extend the template

- Follow [Build a Basic AI Chatbot in Teams](https://aka.ms/teamsfx-basic-ai-chatbot) to extend the template with more AI capabilities.
- Follow [Build a RAG Bot in Teams](https://aka.ms/teamsfx-rag-bot) to extend the template with more RAG capabilities.
- Understand more about [Azure AI Search as data source](https://aka.ms/teamsfx-rag-bot#azure-ai-search-as-data-source).

## Additional information and references

- [Microsoft 365 Agents Toolkit Documentations](https://docs.microsoft.com/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)
- [Microsoft 365 Agents Toolkit CLI](https://aka.ms/teamsfx-toolkit-cli)
- [Microsoft 365 Agents Toolkit Samples](https://github.com/OfficeDev/TeamsFx-Samples)