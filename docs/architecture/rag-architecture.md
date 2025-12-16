# Architecture RAG - Légis Québec

## Vue d'Ensemble

L'architecture **RAG (Retrieval-Augmented Generation)** de Légis Québec implémente une recherche hybride combinant **similarité vectorielle** et **recherche par mots-clés** pour récupérer le contexte juridique pertinent avant génération LLM.

## Pattern RAG

### Principe

```
Question utilisateur
    ↓
1. RETRIEVAL (Récupération)
   • Vectorisation query
   • Recherche hybride documents
   • Filtrage strictness
   • Top 20 documents max
    ↓
2. AUGMENTATION (Enrichissement)
   • Formatage contexte XML
   • Construction citations
   • Injection dans prompt
    ↓
3. GENERATION (Génération)
   • LLM avec contexte
   • Réponse basée sur sources
   • Anti-hallucination
```

## Flux RAG Détaillé

```
┌──────────────────────────────────────────────────────────────┐
│                    1. VECTORISATION                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  User Query: "Quels sont mes droits au travail?"            │
│       ↓                                                      │
│  Azure OpenAI Embeddings (text-embedding-ada-002)           │
│       ↓                                                      │
│  Vector[1536]: [0.023, -0.045, 0.012, ...]                  │
│                                                              │
└──────────────────────┬───────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                  2. RECHERCHE HYBRIDE                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Azure AI Search                                             │
│  ├─ Vector Search (similarité cosinus)                      │
│  │   k-nearest-neighbors = f(strictness)                    │
│  │                                                           │
│  └─ Keyword Search (BM25)                                    │
│      "droits" "travail" → Ranking                            │
│                                                              │
│  Fusion Scores → Top 20 documents                            │
│                                                              │
└──────────────────────┬───────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────────┐
│              3. STRICTNESS FILTERING                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Level 1 (DEV):    95% results → 19/20 kept                 │
│  Level 2-3:        70% results → 14/20 kept                 │
│  Level 5 (strict): 40% results → 8/20 kept                  │
│                                                              │
│  Threshold = f(maxScore, strictness)                        │
│                                                              │
└──────────────────────┬───────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                  4. CONTEXT FORMATTING                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  <context source="Loi normes travail">                       │
│    Article 52: Le salaire minimum est...                    │
│  </context>                                                  │
│                                                              │
│  <context source="Règlement CNESST">                         │
│    Section 3: Les accidents de travail...                   │
│  </context>                                                  │
│                                                              │
│  + Citations metadata (title, filepath, content)            │
│                                                              │
└──────────────────────┬───────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                    5. LLM GENERATION                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Prompt = instructions.txt + context + history              │
│           ↓                                                  │
│  Azure OpenAI GPT-4.1 (temperature=0.1)                     │
│           ↓                                                  │
│  Response with inline citations                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Composants RAG

### 1. Embeddings Service

**Modèle**: text-embedding-ada-002  
**Dimensions**: 1536  
**Usage**: Vectorisation queries + documents indexés

**Caractéristiques:**
- Multilingue (FR, EN)
- Sémantique contextuelle
- Cache côté Azure AI Search

### 2. Azure AI Search Index

**Structure Conceptuelle:**

```javascript
{
  "name": "fileupload-justice-index-02",
  "fields": [
    { "name": "chunk_id", "type": "string", "key": true },
    { "name": "title", "type": "string", "searchable": true },
    { "name": "content", "type": "string", "searchable": true },
    { "name": "contentVector", "type": "vector", "dimensions": 1536 },
    { "name": "url", "type": "string" },        // Blob storage
    { "name": "filepath", "type": "string" }    // Source reference
  ]
}
```

**Documents**: 20+ lois/règlements québécois  
**Chunking**: ~500-1000 tokens par chunk  
**Total chunks**: ~200-300

### 3. Recherche Hybride

**Vector Search:**
- Algorithme: HNSW (Hierarchical Navigable Small World)
- Métrique: Similarité cosinus
- k-nearest-neighbors: Dynamique selon strictness

**Keyword Search:**
- Algorithme: BM25 (Best Match 25)
- Fields: title, content
- Boost: title = 2x, content = 1x

**Fusion:**
- RRF (Reciprocal Rank Fusion)
- Équilibre vector/keyword: 50/50

### 4. Strictness Levels

**Configuration:**

| Level | Description | Threshold | k-NN | Use Case |
|-------|-------------|-----------|------|----------|
| 1 | Très permissif | 5% | 95% docs | DEV testing |
| 2 | Permissif | 15% | 85% docs | Broad search |
| 3 | Équilibré | 30% | 70% docs | **Recommended** |
| 4 | Strict | 45% | 55% docs | Precision focus |
| 5 | Très strict | 60% | 40% docs | High confidence |

**Formule Threshold:**
```javascript
threshold = maxScore * (1 - (strictness - 1) / 20)
```

**Impact k-NN:**
```javascript
kNearestNeighbors = retrievedDocuments * (6 - strictness) / 5
```

### 5. Citations Management

**Structure Citation:**
```javascript
{
  title: "Loi sur les normes du travail",
  filepath: "laws/lnt.pdf",           // Internal reference
  content: "Article 52: Le salaire...", // For title extraction
  url: null,                           // Generated by agent.js
  score: 0.87                          // Relevance score
}
```

**Transformation Pipeline:**
1. Azure AI Search returns blob storage URLs
2. Agent extracts legal title with LLM
3. Agent transforms URL: blob → legisquebec.gouv.qc.ca
4. Microsoft Teams displays formatted citations

## Best Practices Implémentées

### Microsoft Recommendations

✅ **Max 20 documents** per search  
✅ **Strictness configurable**  
✅ **Hybrid search** (vector + keyword)  
✅ **Structured citations**  
✅ **Context XML tagging**  
✅ **Relevance filtering**

### Anti-Hallucination Rules

✅ **Context required**: LLM must cite sources  
✅ **No inference**: Only answer from retrieved docs  
✅ **Empty results handling**: Explicit "no info found"  
✅ **Strictness enforcement**: Filter low-confidence results

## Performance

### Latence

| Étape | Temps | Notes |
|-------|-------|-------|
| Embeddings | ~500ms | Azure OpenAI |
| Search | ~1-2s | Hybrid search |
| Filtering | ~100ms | Client-side |
| Total RAG | **~2-3s** | Median |

### Optimisations

- Embeddings cached (Azure AI Search)
- Parallel vector + keyword search
- Early filtering (reduce data transfer)
- Strictness level 1 en DEV (faster)

## Limitations

**Documents:**
- Max 20 per query (best practice)
- Chunks ~500-1000 tokens
- Total context: ~15K-20K tokens

**Index:**
- Static (no real-time updates)
- Shared resource (not deployed by project)
- Update frequency: Manual (monthly)

**Search:**
- French-optimized (may miss English terms)
- Exact match sometimes better than semantic
- Quality depends on chunking strategy

## Évolutions Futures

### v4.1.0
- Monitoring RAG metrics (hit rate, relevance)
- A/B testing strictness levels
- Query reformulation avec LLM

### v4.2.0
- Auto-update index (50+ documents)
- Chunking optimization (overlap strategy)
- Metadata enrichment (dates, categories)

### v5.0.0
- Multi-index search (federal + provincial)
- Query expansion (synonyms)
- Re-ranking avec LLM

## Références

- [ADR-003: Optimisation Recherche Vectorielle](../adr/003-optimisation-recherche-vectorielle-rag.md)
- [Application Architecture](./application-architecture.md)
- [System Overview](./system-overview.md)
- [Azure AI Search Documentation](https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search)
- [Azure OpenAI On Your Data](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/use-your-data)

---

**Auteur**: Michel Héon  
**Dernière mise à jour**: 2025-12-14  
**Version**: v4.0.0
