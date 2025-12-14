# Vue d'Ensemble Système - Légis Québec

## Introduction

Ce document présente l'architecture globale du système **Légis Québec**, un assistant juridique intelligent spécialisé dans les lois et règlements du Québec.

## Diagramme de Contexte (Niveau 1)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     UTILISATEURS ET SYSTÈMES EXTERNES                │
└──────────────┬──────────────────────────────────────┬───────────────┘
               │                                      │
               │                                      │
        ┌──────▼──────┐                       ┌──────▼──────┐
        │             │                       │             │
        │  Employés   │                       │  Citoyens   │
        │  (Teams)    │                       │  (Copilot)  │
        │             │                       │             │
        └──────┬──────┘                       └──────┬──────┘
               │                                      │
               │          Requêtes juridiques         │
               └──────────────┬───────────────────────┘
                              │
                              ▼
               ┌──────────────────────────────────────┐
               │                                      │
               │      LÉGIS QUÉBEC SYSTEM             │
               │   (Custom Engine Agent v4.0.0)      │
               │                                      │
               │  Fonctionnalités:                   │
               │  • Recherche lois/règlements        │
               │  • Analyse juridique contextuelle   │
               │  • 6 commandes spécialisées         │
               │  • Modération contenu               │
               │  • Citations sources officielles    │
               │                                      │
               └──────────────┬───────────────────────┘
                              │
                              │ Intégrations
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │   Azure     │   │   Azure     │   │ Publications│
    │   OpenAI    │   │ AI Search   │   │ Québec      │
    │             │   │             │   │ (source)    │
    │  GPT-4.1    │   │  20+ docs   │   │             │
    │  Embeddings │   │  Vectoriel  │   │  Légis Qc   │
    └─────────────┘   └─────────────┘   └─────────────┘
```

### Acteurs Principaux

#### 1. Utilisateurs Finaux

**Employés (Microsoft Teams)**
- Accès direct via application Teams
- Conversations 1:1 avec le bot
- Utilisation dans canaux/groupes
- Intégration workflow quotidien

**Citoyens (Microsoft 365 Copilot)**
- Accès via M365 Copilot interface
- Requêtes juridiques ponctuelles
- Contexte isolé par utilisateur
- Expérience conversationnelle naturelle

#### 2. Systèmes Externes

**Azure OpenAI Service**
- Modèle: GPT-4.1 (génération)
- Modèle: text-embedding-ada-002 (embeddings)
- API REST avec authentification API Key
- Rate limiting: 60K tokens/min

**Azure AI Search**
- Index: fileupload-justice-index-02
- 20+ documents juridiques indexés
- Recherche hybride (vectorielle + keyword)
- Strictness: 1 (équilibre précision/rappel)

**Publications Québec (source de données)**
- Source officielle lois et règlements
- Format PDF (pré-traitement requis)
- Mise à jour périodique (manuel actuellement)

## Architecture Logique (Niveau 2)

```
┌────────────────────────────────────────────────────────────────────┐
│                          PRÉSENTATION                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────┐         ┌──────────────┐     ┌──────────────┐  │
│  │   Teams      │         │  M365        │     │  Adaptive    │  │
│  │   Interface  │◄────────┤  Copilot     │────►│  Cards       │  │
│  │              │         │  Interface   │     │  (Welcome)   │  │
│  └──────────────┘         └──────────────┘     └──────────────┘  │
│                                                                    │
└────────────────────────────┬───────────────────────────────────────┘
                             │ Bot Framework Protocol
                             │ (Activity messages)
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                       COUCHE APPLICATION                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │          Custom Engine Agent (@microsoft/agents-hosting)     │ │
│  │                                                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │   Agent     │  │   Activity  │  │    Commands         │ │ │
│  │  │   Core      │◄─┤   Handler   │◄─┤    Processor        │ │ │
│  │  │             │  │             │  │  • codes            │ │ │
│  │  │  - Turn     │  │  - onMessage│  │  • lois             │ │ │
│  │  │  - State    │  │  - onCreate │  │  • règlements       │ │ │
│  │  │  - Prompt   │  │  - onUpdate │  │  • jugements        │ │ │
│  │  └─────────────┘  └─────────────┘  │  • ressources       │ │ │
│  │                                     │  • stats            │ │ │
│  │                                     └─────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────┬───────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                       COUCHE MÉTIER                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐│
│  │     RAG      │  │   Content    │  │    Instructions          ││
│  │   Engine     │  │  Moderation  │  │    Management            ││
│  │              │  │              │  │                          ││
│  │ - Embedding  │  │ - Azure      │  │  - System prompt         ││
│  │ - Search     │  │   Content    │  │  - Legal context         ││
│  │ - Ranking    │  │   Safety     │  │  - Output formatting     ││
│  │ - Citation   │  │ - Filtering  │  │                          ││
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────────┘│
│         │                 │                                        │
└─────────┼─────────────────┼────────────────────────────────────────┘
          │                 │
          ▼                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                    COUCHE DONNÉES                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐│
│  │  Azure AI    │  │   Azure      │  │   Configuration          ││
│  │   Search     │  │   OpenAI     │  │   (env vars)             ││
│  │              │  │              │  │                          ││
│  │ - Index      │  │ - GPT-4.1    │  │ - .env.{ENV}             ││
│  │ - Vectors    │  │ - Embeddings │  │ - .env.{ENV}.user        ││
│  │ - Metadata   │  │ - Completion │  │ - Secrets management     ││
│  └──────────────┘  └──────────────┘  └──────────────────────────┘│
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Architecture Physique (Niveau 2)

```
┌─────────────────────────────────────────────────────────────────┐
│                         AZURE CLOUD                             │
│                      (Canada East Region)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Resource Group: rg-bot-legisqc-{ENV}-cae-01             │ │
│  │  ENV = dev | prd                                          │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  COMPUTE                                            │ │ │
│  │  │                                                     │ │ │
│  │  │  ┌──────────────────┐      ┌──────────────────┐   │ │ │
│  │  │  │  App Service     │      │  App Service     │   │ │ │
│  │  │  │  Plan            │      │  (Web App)       │   │ │ │
│  │  │  │                  │      │                  │   │ │ │
│  │  │  │  Tier: B1        │──────│  Node.js 18      │   │ │ │
│  │  │  │  Linux           │      │  Port: 3978      │   │ │ │
│  │  │  │  Auto-scale: No  │      │  HTTPS only      │   │ │ │
│  │  │  └──────────────────┘      └────────┬─────────┘   │ │ │
│  │  │                                     │             │ │ │
│  │  └─────────────────────────────────────┼─────────────┘ │ │
│  │                                        │               │ │
│  │  ┌─────────────────────────────────────┼─────────────┐ │ │
│  │  │  MESSAGING                          │             │ │ │
│  │  │                                     │             │ │ │
│  │  │  ┌──────────────────┐               │             │ │ │
│  │  │  │  Bot Service     │◄──────────────┘             │ │ │
│  │  │  │                  │                             │ │ │
│  │  │  │  Endpoint:       │                             │ │ │
│  │  │  │  https://{app}.  │                             │ │ │
│  │  │  │  azurewebsites.  │                             │ │ │
│  │  │  │  net/api/        │                             │ │ │
│  │  │  │  messages        │                             │ │ │
│  │  │  └──────────────────┘                             │ │ │
│  │  │                                                   │ │ │
│  │  └───────────────────────────────────────────────────┘ │ │
│  │                                                         │ │
│  │  ┌───────────────────────────────────────────────────┐ │ │
│  │  │  MONITORING                                       │ │ │
│  │  │                                                   │ │ │
│  │  │  ┌──────────────────┐                            │ │ │
│  │  │  │  Application     │                            │ │ │
│  │  │  │  Insights        │                            │ │ │
│  │  │  │                  │                            │ │ │
│  │  │  │  - Logs          │                            │ │ │
│  │  │  │  - Metrics       │                            │ │ │
│  │  │  │  - Traces        │                            │ │ │
│  │  │  │  - Failures      │                            │ │ │
│  │  │  └──────────────────┘                            │ │ │
│  │  │                                                   │ │ │
│  │  └───────────────────────────────────────────────────┘ │ │
│  │                                                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  SERVICES PARTAGÉS (Subscription-level)               │ │
│  │                                                       │ │
│  │  ┌──────────────────┐      ┌──────────────────┐     │ │
│  │  │  Azure OpenAI    │      │  Azure AI Search │     │ │
│  │  │                  │      │                  │     │ │
│  │  │  Endpoint:       │      │  Endpoint:       │     │ │
│  │  │  openai-         │      │  search-         │     │ │
│  │  │  cotechnoe       │      │  cotechnoe-ai    │     │ │
│  │  │                  │      │                  │     │ │
│  │  │  - gpt-4.1       │      │  - Index:        │     │ │
│  │  │  - embeddings    │      │    fileupload-   │     │ │
│  │  │                  │      │    justice-      │     │ │
│  │  │                  │      │    index-02      │     │ │
│  │  └──────────────────┘      └──────────────────┘     │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Environnements

| Environnement | Resource Group | App Service | Utilisation |
|---------------|----------------|-------------|-------------|
| **Playground** | - (local) | - | Développement local avec Agents Playground |
| **Local** | - (local) | - | Développement local avec Dev Tunnel Teams |
| **DEV** | `rg-bot-legisqc-dev-cae-01` | `bot34879c` | Tests intégration et validation |
| **PROD** | `rg-bot-legisqc-prd-cae-01` | TBD | Production (à déployer) |

## Flux de Données End-to-End

### Flux 1 : Requête Simple (sans RAG)

```
┌──────┐     1. Message          ┌──────────┐
│      │────"Bonjour"────────────►│          │
│ User │                          │  Teams / │
│      │◄────5. Response──────────│  Copilot │
└──────┘     "Bienvenue..."       └────┬─────┘
                                       │
                                  2. Activity
                                       │
                                       ▼
                              ┌────────────────┐
                              │   Bot Service  │
                              │   (Messaging)  │
                              └────────┬───────┘
                                       │
                                  3. Forward
                                       │
                                       ▼
                              ┌────────────────┐
                              │  Custom Engine │
                              │  Agent App     │
                              │                │
                              │  onMessage()   │
                              │  handlers      │
                              └────────┬───────┘
                                       │
                                  4. Generate
                                       │
                                       ▼
                              ┌────────────────┐
                              │  Azure OpenAI  │
                              │  GPT-4.1       │
                              └────────────────┘
```

### Flux 2 : Requête Juridique avec RAG

```
┌──────┐  1. Question juridique     ┌──────────┐
│      │───"Quelles lois sur        │          │
│ User │    le travail?"────────────►│  Teams / │
│      │◄──10. Réponse──────────────│  Copilot │
└──────┘    avec citations          └────┬─────┘
                                         │
                                    2. Activity
                                         │
                                         ▼
                                ┌────────────────┐
                                │   Bot Service  │
                                └────────┬───────┘
                                         │
                                    3. Forward
                                         │
                                         ▼
                                ┌────────────────┐
                                │  Custom Engine │
                                │  Agent         │
                                └────┬───────────┘
                                     │
                         ┌───────────┼───────────┐
                         │           │           │
                    4. Check    5. Embed    6. Search
                   Moderation   query       (hybrid)
                         │           │           │
                         ▼           ▼           ▼
                  ┌──────────┐ ┌──────────┐ ┌──────────┐
                  │ Content  │ │  Azure   │ │  Azure   │
                  │ Safety   │ │  OpenAI  │ │AI Search │
                  └──────────┘ └──────────┘ └────┬─────┘
                                                  │
                                      7. Top 20 chunks
                                            with metadata
                                                  │
                                                  ▼
                                         ┌────────────────┐
                                         │  Agent         │
                                         │  + Context     │
                                         └────────┬───────┘
                                                  │
                                         8. Generate with
                                            context
                                                  │
                                                  ▼
                                         ┌────────────────┐
                                         │  Azure OpenAI  │
                                         │  GPT-4.1       │
                                         │                │
                                         │  Streaming     │
                                         └────────┬───────┘
                                                  │
                                         9. Transform URLs
                                            Citations
                                                  │
                                                  ▼
                                         ┌────────────────┐
                                         │  Response      │
                                         │  Formatting    │
                                         └────────────────┘
```

### Flux 3 : Commande Spécialisée

```
┌──────┐  1. Commande        ┌──────────┐
│      │───"codes ccq"───────►│  Teams / │
│ User │◄──6. Liste──────────│  Copilot │
└──────┘   codes civils      └────┬─────┘
                                   │
                              2. Activity
                                   │
                                   ▼
                          ┌────────────────┐
                          │  Custom Engine │
                          │  Agent         │
                          └────────┬───────┘
                                   │
                          3. Detect command
                                   │
                                   ▼
                          ┌────────────────┐
                          │  Legal         │
                          │  Commands      │
                          │  Processor     │
                          └────────┬───────┘
                                   │
                  ┌────────────────┼────────────────┐
                  │                │                │
             4. RAG          4. RAG           4. RAG
              "codes"        "civil"         "Québec"
                  │                │                │
                  └────────────────┼────────────────┘
                                   │
                          5. Aggregate & Format
                                   │
                                   ▼
                          ┌────────────────┐
                          │  Azure OpenAI  │
                          │  (synthesis)   │
                          └────────────────┘
```

## Caractéristiques Système

### Performance

| Métrique | Valeur Actuelle | Objectif | Notes |
|----------|-----------------|----------|-------|
| Latence p50 | ~5s | < 5s | Temps réponse médian |
| Latence p95 | ~8s | < 8s | 95e percentile |
| Latence p99 | ~12s | < 12s | 99e percentile |
| Throughput | ~10 req/min | 50 req/min | Capacité actuelle |
| Disponibilité | 99.5% | 99.9% | SLA Azure App Service |

### Scalabilité

**Verticale (Scale Up)**
- App Service Plan: B1 → S1 → P1V2
- Capacité par tier:
  - B1: 1.75 GB RAM, 1 core → ~10 utilisateurs concurrents
  - S1: 1.75 GB RAM, 1 core → ~20 utilisateurs concurrents
  - P1V2: 3.5 GB RAM, 1 core → ~50 utilisateurs concurrents

**Horizontale (Scale Out)**
- Instances: 1 → max 10 (App Service Plan S1+)
- Load balancing automatique Azure
- Session state: Stateless (supporté)

### Fiabilité

**Haute Disponibilité**
- Azure App Service: 99.95% SLA
- Azure OpenAI: 99.9% SLA
- Azure AI Search: 99.9% SLA
- **SLA global estimé**: 99.75%

**Disaster Recovery**
- Backup code: Git (tags versions)
- Backup config: Bicep IaC + secrets documentation
- RTO (Recovery Time Objective): < 1 heure
- RPO (Recovery Point Objective): < 15 minutes

### Sécurité

**Authentification**
- Microsoft 365: OAuth 2.0 + SSO
- Azure services: Managed Identity OU API Keys
- Aucun mot de passe utilisateur stocké

**Chiffrement**
- Transport: TLS 1.2+ (HTTPS only)
- Repos: Azure Storage encryption (AES-256)
- Secrets: Azure Key Vault OU GitHub Secrets

**Modération**
- Azure Content Safety API
- Filtrage contenu inapproprié
- Logging incidents

## Évolution Architecture

### Version Actuelle: v4.0.0

**Architecture**: Custom Engine Agent  
**SDK**: @microsoft/agents-hosting  
**Statut**: ✅ Stable, Production-ready

### Historique

| Version | Date | Architecture | Notes |
|---------|------|--------------|-------|
| v3.3.0 | 2025-11 | Teams AI Library | Version initiale TypeScript |
| v4.0.0-beta.1 | 2025-12 | Custom Engine Agent | Migration JavaScript |
| v4.0.0-beta.6 | 2025-12-13 | Custom Engine Agent | Tests Azure DEV complets |
| **v4.0.0** | 2025-12-14 | Custom Engine Agent | Production (en cours) |

### Roadmap Future

**v4.1.0 (Q1 2026)**
- CI/CD GitHub Actions complet
- Tests automatisés (coverage > 70%)
- Monitoring avancé (alertes proactives)

**v4.2.0 (Q2 2026)**
- Mise à jour automatique index AI Search
- Nouveaux documents juridiques (50+)
- Optimisation latence (< 5s p95)

**v5.0.0 (Q3 2026)**
- Multi-language support (EN, FR)
- Analytics utilisateurs avancé
- Personnalisation réponses par utilisateur

## Références

### Documentation Interne

- [ADR-022: Architecture Custom Engine Agent](../adr/022-architecture-custom-engine-agent.md)
- [Architecture Applicative](./application-architecture.md)
- [Infrastructure Azure](./infrastructure-azure.md)
- [Architecture RAG](./rag-architecture.md)

### Documentation Microsoft

- [Custom Engine Agents](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-custom-engine-agent)
- [Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/)
- [Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/)

---

**Auteur**: Michel Héon  
**Dernière mise à jour**: 2025-12-14  
**Version système**: v4.0.0
