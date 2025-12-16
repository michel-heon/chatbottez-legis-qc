# ADR 022: Architecture Custom Engine Agent pour Microsoft 365 Copilot

## Statut

✅ Accepté

## Date

2025-12-14

## Contexte

Le projet **Légis Québec** était initialement développé comme une **Teams App** utilisant la bibliothèque `@microsoft/teams.ai` (Teams AI Library). Cette approche présentait plusieurs limitations:

- **Centré sur Teams uniquement**: Intégration limitée avec Microsoft 365 Copilot
- **Abstraction élevée**: Moins de contrôle sur les interactions avec Azure OpenAI
- **Architecture TypeScript**: Code plus verbeux (~365 lignes)
- **Performance**: Latence variable (8-12s p95)
- **Évolution limitée**: Difficulté à implémenter des fonctionnalités avancées

### Objectifs de la Migration

1. **Compatibilité Microsoft 365 Copilot**: Permettre l'utilisation dans M365 Copilot en plus de Teams
2. **Contrôle accru**: Gestion fine des requêtes OpenAI et RAG
3. **Performance**: Réduire la latence et optimiser les coûts
4. **Maintenabilité**: Code plus simple et mieux structuré
5. **Conformité Microsoft**: Utiliser les templates et SDKs officiels

### Options Considérées

**Option 1: Rester avec Teams AI Library**
- ❌ Pas de support natif M365 Copilot
- ❌ Abstraction trop élevée pour nos besoins RAG
- ✅ Déjà en place, pas de migration

**Option 2: Custom Engine Agent (Microsoft 365 Agents SDK)**
- ✅ Support natif M365 Copilot + Teams
- ✅ Contrôle total sur OpenAI et RAG
- ✅ Template officiel Microsoft
- ✅ Architecture moderne et optimisée
- ⚠️ Nécessite migration complète

**Option 3: Développement from scratch**
- ❌ Temps de développement élevé
- ❌ Risque de non-conformité
- ❌ Maintenance complexe

## Décision

Nous avons décidé de **migrer vers Custom Engine Agent** en utilisant le SDK `@microsoft/agents-hosting` et le template officiel Microsoft 365 Agents Toolkit.

### Architecture Adoptée

```
@microsoft/agents-hosting
├── AgentApplication (point d'entrée)
│   ├── Support Teams (personal, group, channel)
│   ├── Support M365 Copilot
│   └── Gestion état (MemoryStorage)
│
├── Azure OpenAI Integration
│   ├── Chat Completions API (gpt-4.1)
│   ├── Embeddings API (text-embedding-ada-002)
│   └── azureExtensionOptions (RAG)
│       ├── Azure AI Search endpoint
│       ├── Index: fileupload-justice-index-02
│       ├── Retrieval: 20 documents
│       ├── Strictness: 1 (modéré)
│       └── Limit to data content: true
│
├── Content Moderation
│   ├── Détection armes/violence
│   ├── Messages d'avertissement
│   └── Logging incidents
│
├── Commandes Juridiques (6)
│   ├── codes - Accès codes juridiques
│   ├── lois - Consultation lois Québec
│   ├── règlements - Recherche règlements
│   ├── jugements - Jurisprudence
│   ├── ressources - Documentation
│   └── stats - Statistiques légales
│
└── Messages & Citations
    ├── Welcome message (Adaptive Card)
    ├── Help message (commandes)
    ├── Citations markdown (pas blob URLs)
    └── Streaming responses (buffering)
```

### Technologies Utilisées

| Composant | Avant (v3.3.0) | Après (v4.0.0) |
|-----------|----------------|----------------|
| **SDK Principal** | `@microsoft/teams.ai` | `@microsoft/agents-hosting` |
| **Langage** | TypeScript | JavaScript |
| **Lignes de code** | ~365 | ~230 (-37%) |
| **OpenAI** | `OpenAIChatModel` (abstrait) | SDK OpenAI direct |
| **RAG** | `AzureContentSafetyModerator` | `azureExtensionOptions` |
| **État** | `LocalStorage` | `MemoryStorage` |
| **Streaming** | Non | Oui (buffering pattern) |

### Intégration RAG Détaillée

Le système RAG (Retrieval-Augmented Generation) est configuré via `azureExtensionOptions`:

```javascript
azureExtensionOptions: {
  extensions: [{
    type: "azure_search",
    parameters: {
      endpoint: process.env.AZURE_SEARCH_ENDPOINT,
      key: process.env.AZURE_SEARCH_KEY,
      indexName: process.env.AZURE_SEARCH_INDEX_NAME,
      authentication: { type: "api_key" },
      strictness: parseInt(process.env.AZURE_SEARCH_STRICTNESS) || 1,
      topNDocuments: parseInt(process.env.AZURE_SEARCH_RETRIEVED_DOCUMENTS) || 20,
      inScope: process.env.AZURE_SEARCH_LIMIT_TO_DATA_CONTENT === 'true',
      roleInformation: instructions
    }
  }]
}
```

**Paramètres Optimisés:**
- **20 documents récupérés**: Meilleur équilibre contexte/précision
- **Strictness 1**: Modéré (balance pertinence/couverture)
- **InScope true**: Limité aux données indexées (pas d'hallucination)
- **Query type**: Vector + Semantic Hybrid Search

### Stratégie de Migration

Approche **template-first git-based** (conforme ADR-001):

1. **Phase 0**: Création branche `michel-heon/template-engine-agent-base`
2. **Phase 1**: Import template officiel + configuration Azure
3. **Phase 2**: Migration logique RAG
4. **Phase 3**: Migration content moderation et messages
5. **Phase 4**: Implémentation features avancées
6. **Phase 5**: Tests multi-environnements (Local, DEV, PROD)
7. **Phase 6**: Documentation et déploiement PROD

### Environnements Déployés

| Environnement | Resource Group | URL | Status |
|---------------|----------------|-----|--------|
| **Playground** | N/A | Local | ✅ Validé |
| **Local** | N/A | Dev Tunnel | ✅ Validé |
| **DEV** | `rg-bot-legisqc-dev-cae-01` | bot34879c.azurewebsites.net | ✅ Opérationnel |
| **PROD** | `rg-bot-legisqc-prd-cae-01` | TBD | ⏳ À déployer |

## Conséquences

### Positives ✅

**Performance et Efficacité**
- **Réduction code**: -37% (365 → 230 lignes JavaScript)
- **Latence améliorée**: 8-12s → 5-8s (p95)
- **Streaming actif**: Réponses progressives pour meilleure UX
- **Coûts optimisés**: Contrôle fin des tokens et requêtes

**Fonctionnalités**
- **Support M365 Copilot**: Agent accessible dans Copilot + Teams
- **RAG optimisé**: 20 documents, strictness configurée, hybrid search
- **Citations améliorées**: Format markdown, pas de blob URLs exposées
- **6 commandes juridiques**: Accès structuré aux ressources légales
- **Modération contenu**: Détection automatique contenu inapproprié

**Architecture et Maintenabilité**
- **Conformité Microsoft**: Template officiel, bonnes pratiques
- **Code plus simple**: JavaScript ES6, moins d'abstraction
- **Infrastructure as Code**: Bicep automatisé (ADR-021)
- **Observability**: SDK intégré pour télémétrie
- **Tests complets**: 22/22 tests essentiels passés

**Déploiement**
- **Multi-environnements**: Playground, Local, DEV, PROD
- **Automatisation**: Teams Toolkit pour provision/deploy
- **Monitoring**: Application Insights natif
- **Rollback facile**: Deployment slots (optionnel)

### Négatives ⚠️

**Migration et Transition**
- **Effort migration**: 6-7 jours de développement
- **Courbe apprentissage**: Nouveau SDK à maîtriser
- **Tests exhaustifs**: 22 tests multi-environnements requis
- **Documentation**: Mise à jour complète nécessaire

**Limitations Techniques**
- **Breaking changes**: Incompatible avec v3.3.0
- **SDK en évolution**: Agents SDK encore récent (possibles changements)
- **Dépendance Microsoft**: Évolution liée au roadmap Microsoft

**Opérationnel**
- **Déploiement initial**: Configuration Azure manuelle première fois
- **Monitoring**: Surveillance Application Insights à configurer
- **Coûts Azure**: Infrastructure cloud (mitigé par optimisation)

### Risques Mitigés ✅

| Risque | Mitigation Appliquée |
|--------|---------------------|
| **Régression fonctionnelle** | Tests exhaustifs (22 tests), benchmarks RAG |
| **Latence accrue** | Optimisation RAG, streaming, tests performance |
| **Complexité déploiement** | Infrastructure as Code (Bicep), automatisation Toolkit |
| **Perte de données** | Backup Azure, procedures rollback documentées |
| **Adoption utilisateurs** | Interface identique, guide migration interne |

## Alternatives Non Retenues

### Copilot Studio
- **Raison rejet**: Moins de contrôle sur RAG et code
- **Limitation**: Difficile d'implémenter logique complexe
- **Avantage perdu**: Pas de gestion version code (Git)

### Azure Bot Service Direct
- **Raison rejet**: Trop bas niveau, réinventer la roue
- **Limitation**: Pas de support M365 Copilot natif
- **Effort**: Développement from scratch trop long

### Continuer avec Teams AI Library
- **Raison rejet**: Pas de roadmap M365 Copilot
- **Limitation**: Abstraction trop élevée pour nos besoins
- **Risque**: Dépendance à une lib potentiellement dépréciée

## Références

### Documentation Microsoft
- [Custom Engine Agent Guide](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/ux-custom-engine-agent)
- [Microsoft 365 Agents SDK](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/create-deploy-agents-sdk)
- [Azure AI Search Integration](https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search)

### ADR Connexes
- ADR-001: Git Workflow et Stratégie de Versioning
- ADR-002: Microsoft 365 Agents Toolkit (remplacement ADR-002 Service Principal)
- ADR-003: Optimisation Recherche Vectorielle RAG
- ADR-019: Microsoft 365 Agents Toolkit - Bonnes Pratiques
- ADR-021: Nomenclature Resource Groups Azure

### Issues GitHub
- Issue #17: Migration Custom Engine Agent (Phase 0-6)
- Issue #23: Tests Local avec Dev Tunnel (10/10) ✅
- Issue #24: Tests Environnement DEV Azure (12/12) ✅
- Issue #27: Documentation Phase 6
- Issue #28: Déploiement Production

### Tags Git
- `v3.3.0`: Dernière version Teams AI Library
- `v4.0.0-alpha.1-custom-engine-agent`: Début migration
- `v4.0.0-beta.1` à `v4.0.0-beta.4`: Développement features
- `v4.0.0-beta.5-local-dev-tests`: Tests local complets
- `v4.0.0-beta.6-azure-dev-tests`: Tests Azure DEV complets
- `v4.0.0` (à venir): Production finale

## Implémentation

### Fichiers Clés

```
src/
├── agent.js              # Point d'entrée AgentApplication
├── config.js             # Configuration centralisée
├── instructions.txt      # System prompt pour RAG
├── app/
│   ├── azureAISearchDataSource.js  # Configuration RAG
│   ├── contentModeration.js        # Modération contenu
│   └── legalCommands.js           # 6 commandes juridiques

infra/
├── azure.bicep           # Infrastructure as Code
└── azure.parameters.json # Mapping variables env

env/
├── .env.playground       # Config Playground
├── .env.local           # Config Local
├── .env.dev             # Config DEV
└── .env.prod            # Config PROD (à créer)

appPackage/
└── manifest.json        # Manifest Teams + Copilot (v1.24)
```

### Métriques de Succès

**Avant Migration (v3.3.0)**
- Latence p95: 8-12s
- Code: 365 lignes TypeScript
- Environnements: Local uniquement
- Support: Teams seulement
- Tests: Manuels

**Après Migration (v4.0.0)**
- ✅ Latence p95: 5-8s (-37% amélioration)
- ✅ Code: 230 lignes JavaScript (-37%)
- ✅ Environnements: 4 (Playground, Local, DEV, PROD)
- ✅ Support: Teams + M365 Copilot
- ✅ Tests: 22 automatisés (10 local + 12 DEV)

## Notes d'Implémentation

### Leçons Apprises

1. **Template officiel essentiel**: Partir du template Microsoft a sauvé 40% du temps
2. **Tests incrémentaux**: Tester à chaque phase a évité régressions majeures
3. **Infrastructure as Code**: Bicep a simplifié déploiements multi-environnements
4. **Documentation continue**: ADR créés au fur et à mesure ont facilité transitions

### Recommandations Futures

1. **Monitoring proactif**: Configurer alertes Application Insights dès DEV
2. **Backup réguliers**: Automatiser backups configurations Azure
3. **Tests E2E**: Ajouter tests end-to-end automatisés (Playwright)
4. **Performance**: Continuer optimisation RAG (caching, index tuning)

---

**Auteur**: Michel Héon (@michel-heon)  
**Reviewers**: Équipe Cotechnoe  
**Approbation**: 2025-12-14  
**Dernière mise à jour**: 2025-12-14
