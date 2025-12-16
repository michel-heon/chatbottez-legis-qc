# Architecture Applicative - Légis Québec

## Vue d'Ensemble

L'application **Légis Québec** implémente un agent conversationnel juridique basé sur l'architecture **Custom Engine Agent** de Microsoft. Elle combine recherche sémantique (RAG), génération LLM et commandes spécialisées pour fournir des conseils juridiques sur la législation québécoise.

## Stack Technologique

| Couche | Technologie | Rôle |
|--------|-------------|------|
| **Runtime** | Node.js 18+ | Environnement d'exécution |
| **Langage** | JavaScript ES6 | Code application |
| **Framework** | @microsoft/agents-hosting | SDK Custom Engine Agent |
| **LLM** | Azure OpenAI GPT-4.1 | Génération réponses |
| **Embeddings** | text-embedding-ada-002 | Vectorisation contenu |
| **Search** | Azure AI Search | Recherche hybride documents |
| **Web** | Express.js | Serveur HTTP Bot Framework |

## Structure du Projet

```
src/
├── index.js                           # Entry point (Express server)
├── config.js                          # Configuration centralisée
├── agent.js                           # Orchestration agent principal
└── app/
    ├── azureAISearchDataSource.js     # RAG implementation
    ├── contentModeration.js           # Content safety
    ├── legalCommands.js               # 6 commandes juridiques
    └── instructions.txt               # System prompt
```

## Architecture en Couches

### Couche Présentation

**Responsabilités:**
- Réception messages Microsoft Teams / M365 Copilot
- Envoi réponses avec citations formatées
- Gestion Adaptive Cards (bienvenue)

**Technologies:**
- Bot Framework Protocol (Activities)
- Microsoft Teams SDK
- Adaptive Cards v1.6

### Couche Application (agent.js)

**Responsabilités:**
- Orchestration flux conversationnel
- Coordination RAG + LLM + modération
- Transformation citations (blob → URLs publiques)
- Extraction titres juridiques avec LLM
- Gestion contexte conversation

**Patterns:**
- **Orchestration centralisée**: Point d'entrée unique
- **Pipeline processing**: Modération → Commandes → RAG → LLM
- **Caching**: URLs validées, résolutions LLM
- **Streaming**: Réponses progressives

**Configuration LLM:**
```javascript
{
  max_tokens: 24000,
  temperature: 0.1,         // Précision maximale
  top_p: 0.9,
  past_messages: 15         // Contexte conversationnel
}
```

### Couche Métier

#### 1. Legal Commands (legalCommands.js)

**6 Commandes Spécialisées:**

1. **Droits au travail**: Normes du travail, salaire, CNESST
2. **Protection consommateur**: OPC, garantie légale, recours
3. **Données personnelles**: Loi 25, vie privée, CAI
4. **Mise en demeure**: Rédaction, format, procédure
5. **Contester décision**: Révision administrative, recours judiciaires
6. **Déposer plainte**: Formulaires, délais, procédures

**Mécanisme:**
- Détection via regex pattern matching
- Injection instructions additionnelles (contexte spécialisé)
- Message bienvenue contextuel

**Pattern: Context Enhancement**
- Instructions spécialisées **complètent** (ne remplacent pas) le system prompt
- Affinage du domaine juridique sans perdre les règles générales

#### 2. RAG Engine (azureAISearchDataSource.js)

**Architecture:**
```
Query → Embeddings → Hybrid Search → Filtering → Context + Citations
```

**Étapes:**
1. **Vectorisation**: Query → embeddings (1536 dimensions)
2. **Recherche hybride**: Vector similarity + keyword matching (BM25)
3. **Strictness filtering**: Ajustement k-nearest-neighbors selon niveau (1-5)
4. **Formatage**: Context XML + citations structurées
5. **Limitation**: Max 20 documents (best practice Microsoft)

**Pattern: Retrieval-Augmented Generation**
- Recherche d'abord, génération ensuite
- Citations toujours liées au contenu généré
- Pas d'hallucination (contexte requis)

#### 3. Content Moderation (contentModeration.js)

**Stratégie:**
- **Permissive** pour contexte juridique légitime
- **Blocage minimal** (intentions nuisibles claires uniquement)
- 8 catégories surveillées (armes, violence, discours haineux, etc.)

**Exemples:**
- ✅ PERMIS: "J'ai été victime d'agression" (question légale)
- ✅ PERMIS: "Accusé de trafic de drogue" (défense juridique)
- ❌ BLOQUÉ: "Comment acheter une arme illégalement"

#### 4. System Instructions (instructions.txt)

**Structure:**
1. Identité agent
2. Règles anti-hallucination (contexte obligatoire)
3. Format Markdown Teams (hiérarchie, citations)
4. Gestion statut juridique (EN VIGUEUR, ABROGÉE, REMPLACÉE)
5. Réponses détaillées (300-500 mots minimum)
6. Notice légale obligatoire

### Couche Données

**Data Access:**
- **Azure OpenAI Client**: SDK `openai`
- **Azure Search Client**: SDK `@azure/search-documents`
- **Configuration**: Environment variables (`config.js`)

## Flux de Traitement

### Flux Principal: Question Juridique avec RAG

```
1. User Message
   ↓
2. Bot Framework → agent.js (onMessage)
   ↓
3. Content Moderation
   └─ Blocking? → Rejection message
   └─ OK → Continue
   ↓
4. Legal Commands Detection
   └─ Match? → Enhanced instructions
   └─ No match → Default instructions
   ↓
5. RAG: azureAISearchDataSource.renderContext()
   ├─ Generate embeddings
   ├─ Hybrid search (Azure AI Search)
   ├─ Strictness filtering
   └─ Format context + citations
   ↓
6. LLM Generation (Azure OpenAI)
   • Prompt = instructions + context + history
   • Streaming response
   ↓
7. Citations Transformation
   ├─ Extract legal titles (LLM)
   ├─ Transform blob URLs → public URLs
   └─ Format Microsoft Teams citations
   ↓
8. Response → User (Markdown + Citations)
```

### Flux Simplifié: Greeting

```
User: "Bonjour"
   ↓
Greeting detection
   ↓
Welcome message (contentModeration.getWelcomeMessage)
   ↓
Response (Text OU Adaptive Card)
```

## Patterns Architecturaux

### 1. Layered Architecture
- Séparation claire: Présentation → Application → Métier → Données
- Chaque couche dépend uniquement de la couche inférieure

### 2. Pipeline Processing
- Traitement séquentiel: Modération → Commandes → RAG → LLM → Formatage
- Chaque étape transforme/enrichit les données

### 3. Strategy Pattern
- Legal commands: Handlers interchangeables
- Chaque commande = stratégie d'enrichissement contexte

### 4. Template Method
- System prompt = template
- Enhanced instructions = variations

### 5. Caching
- URL validation results (in-memory)
- LLM resolutions (in-memory)

## Configuration & Environnements

### Configuration Centralisée (config.js)

**Variables d'environnement:**
```javascript
{
  azureOpenAIKey,
  azureOpenAIEndpoint,
  azureOpenAIDeploymentName,
  azureSearchEndpoint,
  azureSearchKey,
  azureSearchStrictness,
  debug
}
```

**Environnements:**
- `local`: Développement local (.env.local)
- `sandbox`: Tests Teams sandbox (.env.sandbox)
- `dev`: Azure DEV (App Service variables)
- `prod`: Azure PROD (App Service variables)

### Déploiement

**Build & Start:**
```json
{
  "start": "node ./src/index.js",
  "dev": "nodemon --inspect=9239 ./src/index.js"
}
```

**Runtime:**
- Port: 3978
- Endpoint: `/api/messages` (Bot Framework)
- Health check: HTTP 200 si OK

## Best Practices Microsoft Implémentées

✅ **Custom Engine Agent SDK officiel**  
✅ **Strictness configurable** (ADR recommendation)  
✅ **Max 20 documents** per search  
✅ **Streaming responses**  
✅ **Structured citations** (Teams native format)  
✅ **Error handling** avec logging  
✅ **Anti-hallucination rules** (context required)

⚠️ **À Implémenter:**
- Managed Identity (actuellement API Keys)
- Application Insights telemetry
- Rate limiting applicatif
- Unit tests (coverage > 70%)

## Métriques & Performance

### Latence Typique

| Opération | Latence | Notes |
|-----------|---------|-------|
| RAG search | ~2-3s | Embeddings + search |
| LLM generation | ~3-5s | Streaming |
| **Total p50** | ~5s | Médiane |
| **Total p95** | ~8s | 95e percentile |

### Optimisations

- Embeddings cached (Azure AI Search)
- URL validation cached (in-memory)
- Streaming pour perception réduite
- Pas de state persistence (overhead réduit)

### Observabilité

**Debug Logging:**
```javascript
DEBUG=true → Logs détaillés
• [CONFIG]: Configuration init
• [SEARCH]: RAG operations
• [STRICTNESS]: Filtering operations
• [CITATION]: Citations processing
```

## Limitations Connues

1. **URL Validation désactivée** (voir `docs/known-bugs/url-validation-disabled.md`)
2. **State volatile** (MemoryStorage, redémarrage = reset)
3. **Concurrency limitée** (B1 plan = 1 instance)
4. **Rate limiting externe** (délégué à Azure, 60K tokens/min)

## Évolutions Futures

### v4.1.0 (Q1 2026)
- Tests automatisés (Jest, coverage > 70%)
- CI/CD GitHub Actions complet
- Application Insights integration

### v4.2.0 (Q2 2026)
- Mise à jour automatique index (50+ documents)
- Optimisation latence (< 5s p95)
- Managed Identity

### v5.0.0 (Q3 2026)
- Support multi-langue (EN, FR)
- Analytics utilisateurs
- Personnalisation réponses

## Références

- [ADR-022: Architecture Custom Engine Agent](../adr/022-architecture-custom-engine-agent.md)
- [System Overview](./system-overview.md)
- [RAG Architecture](./rag-architecture.md)
- [Infrastructure Azure](./infrastructure-azure.md)
- [Microsoft Agents SDK](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-custom-engine-agent)

---

**Auteur**: Michel Héon  
**Dernière mise à jour**: 2025-12-14  
**Version**: v4.0.0 (Custom Engine Agent)
