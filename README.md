# 🤖 Chatbot Legis QC - Index Configurator

Agent conversationnel intelligent pour Microsoft 365 Teams avec génération automatique de configuration TypeScript à partir d'Azure AI Search.

## 🎯 Vue d'ensemble

Ce projet démontre la construction d'un chatbot sophistiqué avec un **utilitaire Java intégré de nouvelle génération** qui génère automatiquement les fichiers TypeScript à partir de la structure réelle d'un index Azure AI Search. Les fonctionnalités principales incluent :

- **[Azure Search Index Configurator](./docs/azure-search-config-generator.md)** - Utilitaire Java avec SDK Azure Search officiel
- **[Retrieval Augmented Generation (RAG)](https://python.langchain.com/docs/use_cases/question_answering/#what-is-rag)** - Génération augmentée par récupération
- **[Azure AI Search](https://learn.microsoft.com/azure/search/search-what-is-azure-search)** - Recherche hybride (textuelle + vectorielle)  
- **[Teams AI Library](https://learn.microsoft.com/microsoftteams/platform/bots/how-to/teams%20conversational%20ai/teams-conversation-ai-overview)** - Framework Microsoft pour agents Teams

### 🆕 Nouvelles fonctionnalités v2.1.0
- **SDK Azure Search Java officiel** - Migration du REST API vers SearchIndexClient
- **Filtrage intelligent des champs** - Compatibilité API maximale avec détection automatique
- **Gestion ultra-conservative** - Sélection optimisée des champs essentiels uniquement
- **Tests d'intégration renforcés** - Validation avec index Azure Search réel

## ⚡ Démarrage rapide

### 🚀 Installation automatisée avec Makefile
```bash
# 1. Installation des dépendances
make install

# 2. Compilation des composants Java
make java-build

# 3. Configuration de l'index Azure Search
make setup-index SECRET_AZURE_SEARCH_KEY=your_key SECRET_AZURE_OPENAI_KEY=your_key

# 4. Génération automatique de la configuration TypeScript
make azure-config-generate

# 5. Démarrage de l'application
make dev
```

### 🔧 Génération TypeScript avancée
```bash
# Génération TypeScript avec préservation de la logique métier
make azure-config-generate-enhanced

# Workflow complet de génération et validation
make azure-config-workflow

# Tests TDD pour les générateurs
make java-test-tdd
```

### 📋 Commandes disponibles
```bash
make help                     # Affiche toutes les commandes disponibles
make azure-config-info        # Informations sur le générateur
make azure-config-validate    # Valide la configuration générée
make java-test                # Tests unitaires Java
make typescript-generate-complete  # Génération TypeScript complète
```

## 🏗️ Architecture Java - Index Configurator v2.1.0

Le projet inclut un utilitaire Java sophistiqué (`com.cotechnoe.teamsrag.indexconfigurator`) qui utilise le **SDK Azure Search Java officiel** pour :

- **Lit dynamiquement** la structure d'un index Azure Search avec SearchIndexClient
- **Génère automatiquement** les fichiers TypeScript synchronisés avec filtrage intelligent
- **Préserve la logique métier** existante lors des mises à jour
- **Supporte deux modes** : simple (placeholders) et avancé (START/END markers)
- **Compatibilité API optimisée** : Sélection ultra-conservative des champs essentiels

### Classes principales v2.1.0
- `AzureSearchConfigGenerator` - CLI principal avec validation renforcée
- `AzureSearchIndexReader` - Lecture d'index avec SDK Azure Search officiel
- `TypeScriptGenerator` - Génération TypeScript avec filtrage intelligent des champs
- `IndexSchema` & `FieldDefinition` - Modèles enrichis pour compatibilité API maximale

### Nouvelles fonctionnalités techniques
- **SearchIndexClient** - Remplacement des appels REST API manuels
- **AzureKeyCredential** - Authentification robuste et sécurisée
- **Filtrage intelligent** - `isEssentialContentField()` et `isContentField()` pour éviter les erreurs API
- **Détection automatique** - Champs vectoriels, clés et propriétés searchables

## 📚 Documentation complète

👉 **[Consulter la documentation détaillée](./docs/README.md)** dans le dossier `./docs/`

### Guides principaux
- 🛠️ **[Guide d'installation](./docs/setup-guide.md)** - Configuration pas à pas
- ⚙️ **[Azure Search Config Generator](./docs/azure-search-config-generator.md)** - Utilitaire Java de génération
- 🔍 **[Gestion Azure Search](./docs/azure-search-management.md)** - Guide complet d'indexation
- 🔧 **[Référence des scripts](./docs/scripts-reference.md)** - Documentation technique

## 🧪 Développement TDD v2.1.0

Le projet suit strictement les principes **Test-Driven Development** avec **67 tests** complets :
- **Tests JUnit 5** complets avec SDK Azure Search Java officiel
- **Tests d'intégration** avec validation Azure Search réelle  
- **Couverture des cas limites** et gestion d'erreurs robuste
- **Architecture SOLID** et injection de dépendances
- **Compatibilité Eclipse et Maven** avec validation continue

### Suite de tests étendue
- **Tests unitaires (59)** : Logique métier pure avec mocks
- **Tests d'intégration (8)** : Validation avec Azure Search réel
- **Tests de compatibilité API** : Filtrage champs et erreurs Azure Search
- **Tests de performance** : Optimisations SDK et génération

```bash
# Cycle TDD complet v2.1.0
make java-test-tdd           # Suite complète 67 tests
make azure-config-generate   # Génération avec SDK officiel  
make azure-config-validate   # Validation avec filtrage intelligent
make azure-config-workflow   # Workflow complet avec tests d'intégration
```

## Get started with the template

> **Prerequisites**
>
> To run the template in your local dev machine, you will need:
>
> - [Node.js](https://nodejs.org/), supported versions: 18, 20, 22
> - [Microsoft 365 Agents Toolkit Visual Studio Code Extension](https://aka.ms/teams-toolkit) version 5.0.0 and higher or [Microsoft 365 Agents Toolkit CLI](https://aka.ms/teamsfx-toolkit-cli)
> - Prepare your own [Azure OpenAI](https://aka.ms/oai/access) resource and [Azure AI Search](https://azure.microsoft.com/en-us/products/ai-services/ai-search).

> For local debugging using Microsoft 365 Agents Toolkit CLI, you need to do some extra steps described in [Set up your Microsoft 365 Agents Toolkit CLI for local debugging](https://aka.ms/teamsfx-cli-debugging).

1. First, select the Microsoft 365 Agents Toolkit icon on the left in the VS Code toolbar.
1. In file *env/.env.playground.user*, fill in your Azure OpenAI key `SECRET_AZURE_OPENAI_API_KEY=<your-key>`, endpoint `AZURE_OPENAI_ENDPOINT=<your-endpoint>`, deployment name `AZURE_OPENAI_DEPLOYMENT_NAME=<your-deployment>`, and embedding deployment name `AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=<your-embedding-deployment>`. And fill in your Azure AI search key `SECRET_AZURE_SEARCH_KEY=<your-ai-search-key>` and endpoint `AZURE_SEARCH_ENDPOINT=<your-ai-search-endpoint>`.
1. Do `npm install` and `npm run indexer:create -- <your-ai-search-key> <your-azure-openai-api-key>` to create the my documents index. Once you're done using the sample it's good practice to delete the index. You can do so with the `npm run indexer:delete -- <your-ai-search-key>` command.
1. Press F5 to start debugging which launches your app in Microsoft 365 Agents Playground using a web browser. Select `Debug in Microsoft 365 Agents Playground`.
1. You can send any message to get a response from the agent.

**Congratulations**! You are running an application that can now interact with users in Microsoft 365 Agents Playground:

![AI Search Bot](https://github.com/user-attachments/assets/464fe1b0-d8c6-4ecf-a410-8dde7d9ca9b3)

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