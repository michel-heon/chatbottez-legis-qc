# Légis Québec - Assistant Juridique Intelligent

**Légis Québec** est un assistant juridique intelligent spécialisé dans les lois et règlements du Québec, développé comme **Custom Engine Agent** pour Microsoft 365 Copilot et Microsoft Teams. Il utilise Azure AI Search et Azure OpenAI pour fournir des réponses précises basées sur la documentation officielle.

> ⚠️ **Migration v3.3.0 → v4.0.0**: Ce projet a migré de Teams AI Library vers Custom Engine Agent (Microsoft 365 Agents SDK). Voir [issue #17](https://github.com/michel-heon/chatbottez-legis-qc/issues/17) pour détails de la migration.

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

### Déployer en PROD - Séquence Complète

Pour une mise en production complète, exécuter les commandes suivantes depuis le répertoire `deployment/`:

```bash
# 1. Configuration GitHub CI/CD (une seule fois)
make github-configure-auto    # Configure secrets, environments, branch protections

# 2. Créer Resource Group PROD dans Azure
make prod-create-rg          # Crée rg-bot-legisqc-prd-cae-01

# 3. Provisionner environnement PROD (Bot Service, App Service, Teams App)
make prod-provision          # ~5-10 minutes

# 4. Déployer le code vers Azure PROD
make deploy-prod             # Upload zip package

# 5. Installer le bot dans Teams
make prod-install-teams      # Ouvre le lien d'installation

# 6. Vérifier le déploiement
make validate                # Tests manuels recommandés
```

**Prérequis avant déploiement PROD:**
- Azure CLI connecté: `az login`
- GitHub CLI connecté: `gh auth login`
- Teams Toolkit CLI installé: `npm install -g @microsoft/teamsfx-cli`
- Fichiers `.env.prod` et `.env.prod.user` configurés

**Résultat:**
- Resource Group: `rg-bot-legisqc-prd-cae-01`
- Bot Service: bot[suffix].azurewebsites.net
- Teams App installable via lien direct

Voir [ADR-023](docs/adr/023-cicd-github-actions.md) pour détails complets CI/CD.

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

## Versioning et Migration

### Timeline Versions

| Version | Description | Status |
|---------|-------------|--------|
| **v3.3.0** | Dernière version Teams AI Library | ⚠️ Deprecated |
| **v4.0.0-alpha.1** | Template officiel Custom Engine Agent | ✅ Initial |
| **v4.0.0-beta.1 à beta.4** | Commandes juridiques + citations + streaming | ✅ Features |
| **v4.0.0-beta.5** | Tests Local (10/10) | ✅ Local Tests |
| **v4.0.0-beta.6** | Tests Azure DEV (12/12) | ✅ Azure Tests |
| **v4.0.8-alpha.1** | Template engine + FULL_VERSION | ✅ Build System |
| **v4.0.0** | **Production finale** | ⏳ À déployer |

### Migration v3.3.0 → v4.0.0

La migration vers Custom Engine Agent (Issue #17) a été réalisée en 6 phases:

**✅ Phase 0**: Template officiel Microsoft importé  
**✅ Phase 1**: Configuration Azure intégrée  
**✅ Phase 2**: RAG Implementation (Azure AI Search)  
**✅ Phase 3**: Content Moderation + Welcome/Help messages  
**✅ Phase 4**: Features avancées (streaming, citations, commandes)  
**✅ Phase 5**: Tests multi-environnements (Local 10/10, Azure DEV 12/12)  
**⏳ Phase 6**: Documentation + déploiement PROD (EN COURS)

#### Breaking Changes v3.3.0 → v4.0.0

| Aspect | v3.3.0 (Avant) | v4.0.0 (Après) |
|--------|----------------|----------------|
| **SDK** | `@microsoft/teams.ai` | `@microsoft/agents-hosting` |
| **Langage** | TypeScript | JavaScript |
| **Compatibilité** | Teams uniquement | Teams + M365 Copilot |
| **Code** | ~365 lignes | ~230 lignes (-37%) |
| **RAG** | `OpenAIChatModel` | OpenAI SDK direct |
| **État** | `LocalStorage` | `MemoryStorage` |
| **Manifest** | v1.16 | v1.24 (copilotAgents) |

**Impact**: Application complètement réécrite. Pas de chemin de migration automatique.

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

## 🎉 Migration Custom Engine Agent Complète

Le projet a complété avec succès la migration de Teams AI Library vers Custom Engine Agent (issue #17):

- ✅ 6 phases de migration complètes
- ✅ Tests Local (10/10) et Azure DEV (12/12) validés
- ✅ Architecture optimisée (-37% code)
- ✅ Compatibilité Microsoft 365 Copilot
- ✅ Documentation complète (ADR-003, ADR-022, ADR-019, ADR-021)
- ⏳ Déploiement PROD en préparation

---

**Status**: ✅ Production-Ready (DEV), ⏳ PROD à déployer  
**Version**: 4.0.0 (Custom Engine Agent)  
**Dernière mise à jour**: 2025-12-16
