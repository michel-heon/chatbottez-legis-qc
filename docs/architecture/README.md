# Architecture Légis Québec

Documentation architecturale complète du système **Légis Québec - Assistant Juridique Intelligent**.

## Vue d'Ensemble

Légis Québec est un agent conversationnel spécialisé dans les lois et règlements du Québec, basé sur l'architecture **Custom Engine Agent** pour Microsoft 365 Copilot et Microsoft Teams.

### Technologies Principales

- **SDK**: @microsoft/agents-hosting (Custom Engine Agent)
- **Runtime**: Node.js 18+ avec JavaScript (ES6)
- **LLM**: Azure OpenAI GPT-4.1
- **RAG**: Azure AI Search (recherche vectorielle + hybride)
- **Infrastructure**: Azure (App Service, Bot Service, Application Insights)

## Documents d'Architecture

### 1. [Vue d'Ensemble Système](./system-overview.md)

Architecture globale du système avec diagrammes de contexte, composants principaux et flux de données.

**Contenu**:
- Diagramme de contexte (utilisateurs, systèmes externes)
- Architecture logique (couches, composants)
- Architecture physique (infrastructure Azure)
- Flux de données end-to-end

### 2. [Architecture Applicative](./application-architecture.md)

Structure interne de l'application Custom Engine Agent avec composants métier, patterns et dépendances.

**Contenu**:
- Structure de code (src/, modules)
- Composants métier (agent, commands, RAG, moderation)
- Patterns architecturaux (Custom Engine, RAG, Commands)
- Interactions entre composants

### 3. [Infrastructure Azure](./infrastructure-azure.md)

Détails de l'infrastructure cloud Azure avec ressources, configurations et déploiements.

**Contenu**:
- Resource Groups (DEV, PROD)
- Services Azure utilisés (App Service, Bot Service, OpenAI, AI Search)
- Configuration réseau et sécurité
- Stratégie de déploiement multi-environnements

### 4. [Architecture RAG](./rag-architecture.md)

Architecture détaillée du système RAG (Retrieval-Augmented Generation) avec Azure AI Search et embeddings.

**Contenu**:
- Pipeline RAG complet (query → embedding → search → generation)
- Configuration Azure AI Search (index, strictness, topN)
- Stratégie de chunking documents
- Optimisations performance

### 5. [Sécurité](./security-architecture.md)

Architecture de sécurité avec authentification, autorisation, secrets management et conformité.

**Contenu**:
- Modèle de sécurité defense-in-depth (5 couches)
- Content moderation (permissive legal context, 8 catégories)
- Authentication & Authorization (OAuth 2.0, Azure AD)
- Secrets management (App Service Config, future Key Vault)
- Data protection & compliance (GDPR, Loi 25)

## Diagrammes

Les diagrammes sont inclus directement dans les documents en format Markdown (ASCII art) pour faciliter la maintenance et versioning.

## Conventions

### Notation Diagrammes

- `┌─┐ └─┘` : Boîtes/composants
- `→ ←` : Flux de données
- `...` : Relation/dépendance
- `[ ]` : Composant optionnel
- `{ }` : Groupe logique

### Niveaux de Détail

1. **Niveau 1 - Contexte** : Vue macro, acteurs externes, systèmes
2. **Niveau 2 - Conteneurs** : Applications, services, data stores
3. **Niveau 3 - Composants** : Modules internes, classes, fonctions
4. **Niveau 4 - Code** : Détails implémentation (voir code source)

## Références

### ADRs Liés

- [ADR-022: Architecture Custom Engine Agent](../adr/022-architecture-custom-engine-agent.md)
- [ADR-003: Optimisation Recherche Vectorielle RAG](../adr/003-optimisation-recherche-vectorielle-rag.md)
- [ADR-021: Nomenclature Resource Groups Azure](../adr/021-nomenclature-resource-groups-azure.md)
- [ADR-019: Microsoft 365 Agents Toolkit Bonnes Pratiques](../adr/019-microsoft-365-agents-toolkit-bonnes-pratiques.md)

### Documentation Microsoft

- [Custom Engine Agents Overview](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-custom-engine-agent)
- [Azure OpenAI Service](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [Azure AI Search](https://learn.microsoft.com/en-us/azure/search/)

### Code Source

- [src/agent.js](../../src/agent.js) - Custom Engine Agent principal
- [src/app/azureAISearchDataSource.js](../../src/app/azureAISearchDataSource.js) - Configuration RAG
- [src/app/legalCommands.js](../../src/app/legalCommands.js) - Commandes juridiques

## Maintenance

Cette documentation architecture doit être mise à jour lors de:

- Changements architecturaux majeurs (nouveaux composants, patterns)
- Migration technologies (frameworks, services Azure)
- Évolution infrastructure (nouveaux environnements, régions)
- Optimisations significatives (performance, scalabilité)

**Dernière mise à jour** : 2025-12-14  
**Version système** : v4.0.0 (Custom Engine Agent)
