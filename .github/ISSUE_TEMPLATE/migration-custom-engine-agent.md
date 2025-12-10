---
name: Migration vers Custom Engine Agent
about: Migrer Légis Québec de Teams App vers Custom Engine Agent (Template-first approach)
title: '[MIGRATION] Custom Engine Agent v4.0.0'
labels: enhancement, migration, custom-engine-agent
assignees: michel-heon
---

## 🎯 Objectif

Migrer **Légis Québec** de Teams App (Teams AI Library) vers **Custom Engine Agent** pour Microsoft 365 Copilot en utilisant une approche **template-first** basée sur le template officiel Microsoft.

## 📊 Contexte

- **Version actuelle** : v3.3.0 (Teams App avec Teams AI Library)
- **Version cible** : v4.0.0 (Custom Engine Agent avec Agents SDK)
- **Approche** : Partir du template `engine-agent-template` et porter les fonctionnalités existantes
- **Timeline estimée** : 10-15 jours (2-3 semaines)

## 🏗️ Architecture

### Avant (Teams App)
```
@microsoft/teams.ai
├── App instance (Teams-centric)
├── OpenAIChatModel (RAG avec Azure AI Search)
├── LocalStorage (historique)
└── 365 lignes TypeScript
```

### Après (Custom Engine Agent)
```
@microsoft/agents-hosting
├── AgentApplication (Copilot + Teams)
├── OpenAI SDK direct (full control)
├── MemoryStorage (state management)
└── ~230 lignes JavaScript (optimisé)
```

## 📋 Plan de migration (5 phases)

### Phase 1: Setup ✅
- [x] Créer branche `michel-heon/custom-engine-agent`
- [x] Tag `v4.0.0-alpha.1-custom-engine-agent`
- [x] Setup ADR structure
- [x] Analyser template `engine-agent-template`

### Phase 2: Configuration & Manifest (1 jour)
- [ ] Copier configuration Azure (OpenAI, Search)
- [ ] Adapter manifest v1.23 → v1.24
- [ ] Ajouter `copilotAgents.customEngineAgents` node
- [ ] Mettre à jour scopes bot (`copilot`, `personal`, `team`)
- [ ] Porter icons et informations Légis Québec
- [ ] **Tag**: `v4.0.0-alpha.2-configuration`

**Fichiers impactés**:
- `appPackage/manifest.json`
- `src/config.js` (nouveau)
- `env/.env.*.user`

### Phase 3: RAG Implementation (3-4 jours)
- [ ] Créer `src/ragHandler.js` avec Azure OpenAI Extensions
- [ ] Porter logique `AzureAISearchDataSource.ts` → JavaScript
- [ ] Implémenter RAG avec `azureExtensionOptions`
- [ ] Copier `instructions.txt` (système prompt)
- [ ] Tests unitaires RAG accuracy (benchmark vs. v3.3.0)
- [ ] **Tag**: `v4.0.0-alpha.3-rag-implementation`

**Fichiers impactés**:
- `src/ragHandler.js` (nouveau)
- `src/instructions.txt` (copie)
- `src/agent.js` (adapter)

**Configuration RAG**:
```javascript
azureExtensionOptions: {
  extensions: [{
    type: "azure_search",
    parameters: {
      queryType: "vector_semantic_hybrid",
      inScope: true,
      topNDocuments: 20,
      strictness: 2
    }
  }]
}
```

### Phase 4: Features Avancées (2-3 jours)
- [ ] Content moderation (welcome/help messages)
- [ ] Streaming responses (buffering pattern)
- [ ] Citations Copilot-native (Adaptive Cards)
- [ ] Observability SDK (`@microsoft/agents-a365-observability`)
- [ ] Commandes personnalisées (6 commandes juridiques)
- [ ] **Tag**: `v4.0.0-beta.1-custom-engine-agent`

**Fichiers impactés**:
- `src/messages.js` (nouveau)
- `src/agent.js` (enrichir)
- `src/observability.js` (nouveau)

### Phase 5: Testing & Validation (2-3 jours)
- [ ] Tests Copilot sandbox
- [ ] Tests Teams (backward compatibility)
- [ ] Benchmarks performance (latence, coûts)
- [ ] Tests RAG accuracy (precision/recall vs. baseline)
- [ ] Tests observability (télémétrie)
- [ ] Tests multi-plateforme (Desktop, Mobile, Web)
- [ ] **Tag**: `v4.0.0-rc1`

### Phase 6: Documentation & Deployment (1 jour)
- [ ] ADR-002: Migration Custom Engine Agent
- [ ] README update (nouveau SDK)
- [ ] Guide déploiement Copilot
- [ ] CI/CD adaptation
- [ ] Merge vers `main`
- [ ] **Tag**: `v4.0.0-custom-engine-agent`

## 🎯 Fichiers à porter (liste complète)

### Configuration
- ✅ `src/config.ts` → `src/config.js`
- ✅ `env/.env.*.user` (secrets Azure)

### Logique métier
- ✅ `src/app/instructions.txt` → `src/instructions.txt`
- ⚙️ `src/app/azureAISearchDataSource.ts` → `src/ragHandler.js`
- ⚙️ `src/app/contentModeration.ts` → `src/messages.js`

### Manifest
- ✅ `appPackage/manifest.json` (upgrade v1.24)
- ✅ `appPackage/color.png`, `outline.png` (icons)

### Infrastructure
- ✅ `m365agents.*.yml` (déjà présents)
- ✅ `package.json` (mettre à jour dépendances)

## 📦 Dépendances à ajouter

```bash
npm install @microsoft/agents-hosting @microsoft/agents-activity openai
npm install @microsoft/agents-a365-observability @microsoft/agents-a365-runtime
npm uninstall @microsoft/teams.ai @microsoft/teams.openai
```

## ✅ Critères d'acceptation

### Fonctionnel
- [ ] RAG fonctionne avec même accuracy que v3.3.0 (± 5%)
- [ ] Streaming responses actif dans Copilot
- [ ] Citations clickables dans réponses
- [ ] 6 commandes juridiques opérationnelles
- [ ] Welcome/Help messages affichés

### Performance
- [ ] Latence ≤ 3s (p95)
- [ ] Coûts OpenAI ≤ baseline v3.3.0
- [ ] Observability telemetry fonctionnelle

### Compatibilité
- [ ] Fonctionne dans Microsoft 365 Copilot
- [ ] Fonctionne dans Teams (personal, group, channel)
- [ ] Support Desktop + Mobile + Web

### Qualité
- [ ] Tests unitaires > 80% coverage
- [ ] ADR-002 documenté
- [ ] README à jour

## 🚨 Risques & Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| RAG accuracy dégradée | 🔴 High | Benchmarks avant/après, A/B testing |
| Breaking changes SDK | 🔴 High | Tests exhaustifs, rollback plan |
| Timeline dépassé | 🟡 Medium | Phases incrémentales, tags alpha/beta |
| Coûts Azure augmentés | 🟡 Medium | Monitoring strict, alertes budget |

## 📚 Références

- [Convert declarative agent to custom engine agent](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/convert-declarative-agent)
- [Microsoft 365 Agents SDK](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/create-deploy-agents-sdk)
- [Custom engine agent UX features](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/ux-custom-engine-agent)
- [Azure Bot Framework to Agents SDK migration](https://learn.microsoft.com/en-us/microsoft-365/agents-sdk/bf-migration-guidance)

## 📅 Timeline

| Phase | Durée | Dates estimées |
|-------|-------|----------------|
| Phase 1 (Setup) | ✅ Fait | Dec 10 |
| Phase 2 (Config) | 1j | Dec 11 |
| Phase 3 (RAG) | 3-4j | Dec 12-16 |
| Phase 4 (Features) | 2-3j | Dec 17-19 |
| Phase 5 (Testing) | 2-3j | Dec 20-23 |
| Phase 6 (Deploy) | 1j | Dec 24 |
| **Total** | **10-15j** | **Dec 10-24** |

## 🏷️ Tags Git

- `v4.0.0-alpha.1-custom-engine-agent` ✅ (Setup)
- `v4.0.0-alpha.2-configuration` (Config)
- `v4.0.0-alpha.3-rag-implementation` (RAG)
- `v4.0.0-beta.1-custom-engine-agent` (Features)
- `v4.0.0-rc1` (Testing)
- `v4.0.0-custom-engine-agent` (Production)

## 📝 Notes

- Approche **template-first** pour maximiser conformité Microsoft
- Gain de temps ~50% vs. migration code legacy
- Architecture finale plus simple (~230 lignes vs. 365 actuelles)
- Full control orchestration + models
- Support Microsoft 365 Copilot natif

---

**Branch**: `michel-heon/custom-engine-agent`  
**Assigné à**: @michel-heon  
**Priorité**: High  
**Milestone**: v4.0.0
