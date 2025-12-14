# Légis Québec - Assistant Juridique Intelligent

**Légis Québec** est un assistant juridique intelligent spécialisé dans les lois et règlements du Québec, développé comme **Custom Engine Agent** pour Microsoft 365 Copilot et Microsoft Teams. Il utilise Azure AI Search et Azure OpenAI pour fournir des réponses précises basées sur la documentation officielle.

## Caractéristiques

- **RAG (Retrieval-Augmented Generation)**: Réponses basées sur 20+ documents juridiques indexés
- **Multi-plateforme**: Fonctionne dans Microsoft 365 Copilot ET Microsoft Teams
- **6 Commandes juridiques**: Accès rapide aux codes, lois, règlements, jugements, ressources et statistiques
- **Modération contenu**: Détection automatique de contenu inapproprié
- **Streaming responses**: Réponses progressives pour meilleure expérience utilisateur
- **Citations markdown**: Sources incluses dans format lisible (pas de blob URLs)

## Architecture

```
@microsoft/agents-hosting (Custom Engine Agent)
├── Azure OpenAI (gpt-4.1)
├── Azure AI Search (fileupload-justice-index-02)
│   ├── 20 documents récupérés
│   ├── Strictness: 1 (modéré)
│   └── Vector + Semantic Hybrid Search
├── Content Moderation
├── 6 Commandes juridiques
└── Messages & Citations
```

Voir [ADR-022](docs/adr/022-architecture-custom-engine-agent.md) pour détails complets.

## Démarrage Rapide

### Prérequis

- **Node.js** (versions supportées: 18, 20, 22)
- **VS Code** avec [Microsoft 365 Agents Toolkit](https://aka.ms/teams-toolkit)
- **Azure OpenAI** ([demander accès](https://aka.ms/oai/access))
- **Azure AI Search** (avec index configuré)

### Configuration Locale

1. **Cloner le repository**
   ```bash
   git clone https://github.com/michel-heon/chatbottez-legis-qc.git
   cd chatbottez-legis-qc
   ```

2. **Installer dépendances**
   ```bash
   npm install
   ```

3. **Configurer environnement Playground**
   
   Créer/éditer `env/.env.playground.user`:
   ```env
   # Azure OpenAI
   AZURE_OPENAI_API_KEY=<votre-clé>
   AZURE_OPENAI_ENDPOINT=https://<votre-resource>.openai.azure.com/
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4.1
   AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002
   
   # Azure AI Search
   AZURE_SEARCH_KEY=<votre-clé-search>
   ```

4. **Lancer dans Playground**
   - Ouvrir VS Code
   - Microsoft 365 Agents Toolkit → LIFECYCLE → playground
   - Ou appuyer **F5** et sélectionner "Debug in Microsoft 365 Agents Playground"

### Tests avec Teams (Local + Dev Tunnel)

1. **Configurer environnement local**
   
   Créer/éditer `env/.env.local.user`:
   ```env
   # Mêmes variables que .env.playground.user
   AZURE_OPENAI_API_KEY=<votre-clé>
   # ... etc
   ```

2. **Lancer avec Dev Tunnel**
   - Appuyer **F5** et sélectionner "Launch Remote"
   - Le dev tunnel s'ouvrira automatiquement
   - Teams se lancera avec l'app chargée

3. **Tester commandes**
   ```
   help
   codes
   lois Code civil du Québec
   ```

## Structure du Projet

```
chatbottez-legis-qc/
├── .vscode/              # Configuration VS Code debugging
├── appPackage/           # Manifest Teams + assets
│   ├── manifest.json     # Manifest v1.24 (Teams + Copilot)
│   ├── color.png         # Icône couleur
│   └── outline.png       # Icône contour
├── docs/                 # Documentation
│   ├── adr/             # Architecture Decision Records
│   │   ├── 022-architecture-custom-engine-agent.md
│   │   ├── 019-microsoft-365-agents-toolkit-bonnes-pratiques.md
│   │   └── 021-nomenclature-resource-groups-azure.md
│   └── guides/          # Guides utilisateur
├── env/                  # Fichiers environnement
│   ├── .env.playground   # Config Playground
│   ├── .env.local       # Config Local
│   ├── .env.dev         # Config DEV Azure
│   └── .env.prod        # Config PROD Azure
├── infra/               # Infrastructure as Code
│   ├── azure.bicep      # Définition ressources Azure
│   └── azure.parameters.json
├── src/                 # Code source
│   ├── index.js         # Point d'entrée serveur
│   ├── adapter.js       # Adapter agent
│   ├── config.js        # Configuration centralisée
│   ├── agent.js         # Logique métier agent
│   ├── instructions.txt # System prompt RAG
│   └── app/
│       ├── azureAISearchDataSource.js  # Configuration RAG
│       ├── contentModeration.js        # Modération
│       └── legalCommands.js           # 6 commandes juridiques
├── m365agents.yml           # Workflow principal
├── m365agents.local.yml     # Workflow local
└── m365agents.playground.yml # Workflow playground
```

## 6 Commandes Juridiques

L'agent supporte 6 commandes spécialisées:

| Commande | Description | Exemple |
|----------|-------------|---------|
| `codes` | Accès aux codes juridiques | "codes Code civil" |
| `lois` | Consultation des lois du Québec | "lois normes du travail" |
| `règlements` | Recherche de règlements | "règlements sécurité" |
| `jugements` | Jurisprudence et décisions | "jugements droit du travail" |
| `ressources` | Documentation et guides | "ressources protection consommateur" |
| `stats` | Statistiques légales | "stats" |

Tapez `help` pour voir toutes les commandes disponibles.

## Déploiement Azure

### Environnements

| Environnement | Resource Group | URL | Status |
|---------------|----------------|-----|--------|
| **Playground** | N/A | Local | ✅ |
| **Local** | N/A | Dev Tunnel | ✅ |
| **DEV** | `rg-bot-legisqc-dev-cae-01` | bot34879c.azurewebsites.net | ✅ |
| **PROD** | `rg-bot-legisqc-prd-cae-01` | TBD | ⏳ |

### Déployer sur Azure DEV

1. **Configurer Azure**
   ```bash
   az login
   az account set --subscription <subscription-id>
   ```

2. **Créer fichiers environnement**
   
   `env/.env.dev`:
   ```env
   TEAMSFX_ENV=dev
   APP_NAME_SUFFIX=-dev
   TEAMS_APP_VERSION=4.0.5
   AZURE_SUBSCRIPTION_ID=<votre-subscription>
   AZURE_RESOURCE_GROUP_NAME=rg-bot-legisqc-dev-cae-01
   AZURE_LOCATION=canadaeast
   ```
   
   `env/.env.dev.user` (secrets):
   ```env
   AZURE_OPENAI_API_KEY=<key>
   AZURE_OPENAI_ENDPOINT=<endpoint>
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4.1
   AZURE_SEARCH_KEY=<key>
   ```

3. **Provisionner + Déployer**
   - Teams Toolkit → LIFECYCLE → dev → **Provision**
   - Teams Toolkit → LIFECYCLE → dev → **Deploy**

Voir [Guide de déploiement](docs/guides/deployment/production-deployment.md) pour PROD.

## Tests

Le projet inclut des tests exhaustifs:

- **Tests Local (10/10)**: Issue #23 - Dev Tunnel + Application
- **Tests Azure DEV (12/12)**: Issue #24 - Infrastructure + Fonctionnalités

Voir documentation complète dans `/docs/`.

## Configuration RAG

Le système RAG est configuré via Azure AI Search:

```javascript
azureExtensionOptions: {
  extensions: [{
    type: "azure_search",
    parameters: {
      endpoint: process.env.AZURE_SEARCH_ENDPOINT,
      key: process.env.AZURE_SEARCH_KEY,
      indexName: process.env.AZURE_SEARCH_INDEX_NAME,
      strictness: 1,                    // Modéré (balance pertinence/couverture)
      topNDocuments: 20,                // 20 documents récupérés
      inScope: true,                    // Limité aux données indexées
      roleInformation: instructions     // System prompt
    }
  }]
}
```

## Technologies

| Composant | Technology |
|-----------|-----------|
| **SDK** | `@microsoft/agents-hosting` |
| **Langage** | JavaScript (ES6) |
| **LLM** | Azure OpenAI (gpt-4.1) |
| **Embeddings** | text-embedding-ada-002 |
| **Search** | Azure AI Search |
| **Infrastructure** | Bicep (Infrastructure as Code) |
| **Monitoring** | Application Insights |
| **Deployment** | Microsoft 365 Agents Toolkit |

## Documentation

- **[ADR-022](docs/adr/022-architecture-custom-engine-agent.md)**: Architecture Custom Engine Agent
- **[ADR-019](docs/adr/019-microsoft-365-agents-toolkit-bonnes-pratiques.md)**: Bonnes pratiques Toolkit
- **[ADR-021](docs/adr/021-nomenclature-resource-groups-azure.md)**: Nomenclature Resource Groups
- **[Guide déploiement PROD](docs/guides/deployment/production-deployment.md)**: Déploiement production

## Versioning

- **v3.3.0**: Dernière version Teams AI Library
- **v4.0.0**: Custom Engine Agent (version actuelle)
  - `v4.0.0-beta.1` à `v4.0.0-beta.6`: Versions beta
  - `v4.0.0`: Production (à venir)

Voir [ADR-008](docs/adr/008-nomenclature-versions-tags.md) pour détails versioning.

## Références

- [Microsoft 365 Agents SDK](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/create-deploy-agents-sdk)
- [Custom Engine Agent Guide](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/ux-custom-engine-agent)
- [Microsoft 365 Agents Toolkit](https://aka.ms/teams-toolkit)
- [Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [Azure AI Search](https://learn.microsoft.com/en-us/azure/search/)

## License

Copyright (c) 2025 Cotechnoe. Tous droits réservés.

## Auteurs

- Michel Héon (@michel-heon) - Développeur principal
- Équipe Cotechnoe

---

**Status**: ✅ Production-Ready (DEV), ⏳ PROD à déployer  
**Version**: 4.0.5  
**Dernière mise à jour**: 2025-12-14
