# Configuration Azure AI Search - Guide des bonnes pratiques

Ce document explique la configuration des paramètres Azure AI Search selon les recommandations Microsoft Azure OpenAI On Your Data.

## 📊 Paramètres configurés selon votre Azure AI Foundry

### 1. **Strictness (Niveau de strictness) : 1**
```typescript
strictness: 1  // Filtrage minimal
```

**Description** : Contrôle l'agressivité du filtrage des documents basé sur les scores de similarité.

**Échelle** :
- **1** (Minimal) : Inclut plus de documents, même ceux avec des scores de similarité plus faibles
- **3** (Équilibré) : Recommandation Microsoft par défaut  
- **5** (Agressif) : Inclut seulement les documents très pertinents

**Impact** :
- ✅ **Avantage** : Plus de contexte disponible, moins de réponses "Je ne sais pas"
- ⚠️ **Inconvénient** : Risque d'inclure des documents moins pertinents

### 2. **Retrieved Documents (Documents récupérés) : 20**
```typescript
retrievedDocuments: 20  // Maximum de documents
```

**Description** : Contrôle le nombre de documents récupérés de l'index de recherche.

**Plage** : 3-20 documents

**Impact** :
- ✅ **Avantage** : Contexte maximum, informations complètes
- ⚠️ **Inconvénient** : Plus de tokens utilisés, coût plus élevé

**Calcul des tokens** : `chunk_size × retrieved_documents = total_tokens`

### 3. **Limit to Data Content : Activé ✓**
```typescript
limitToDataContent: true  // RAG strict
```

**Description** : Force le modèle à utiliser uniquement les informations de votre index.

**Avantages** :
- 🎯 Réponses basées exclusivement sur vos documents
- 🛡️ Évite les hallucinations du modèle
- 📚 Pattern RAG (Retrieval Augmented Generation) optimal

## 🔧 Implémentation technique

### Variables d'environnement
```bash
AZURE_SEARCH_STRICTNESS=1
AZURE_SEARCH_RETRIEVED_DOCUMENTS=20
AZURE_SEARCH_LIMIT_TO_DATA_CONTENT=true
```

### Code TypeScript
```typescript
const dataSource = new AzureAISearchDataSource({
    // ... autres paramètres
    strictness: parseInt(process.env.AZURE_SEARCH_STRICTNESS || '1'),
    retrievedDocuments: parseInt(process.env.AZURE_SEARCH_RETRIEVED_DOCUMENTS || '20'),
    limitToDataContent: (process.env.AZURE_SEARCH_LIMIT_TO_DATA_CONTENT !== 'false')
});
```

## 📈 Optimisation des performances

### Algorithme de filtrage implémenté

```typescript
// Calcul du seuil basé sur le niveau de strictness
const keepPercentages = [0.95, 0.85, 0.70, 0.55, 0.40]; // Pour strictness 1-5
const keepPercentage = keepPercentages[strictness - 1];
```

**Avec strictness = 1** :
- 📊 Garde **95%** des résultats de recherche
- 🎯 Seuil de score très permissif
- 📄 Maximum d'informations contextuelles

### Optimisation vectorielle

```typescript
// Calcul dynamique des k-nearest neighbors
const kNearestNeighbors = Math.min(
    retrievedDocuments, 
    Math.ceil(retrievedDocuments * (6 - strictness) / 5)
);
```

**Avec vos paramètres** :
- kNearestNeighbors = `min(20, ceil(20 * 5/5))` = **20**
- Recherche vectorielle optimale

## 🎯 Recommandations d'usage

### Pour votre cas d'usage juridique :

1. **Strictness = 1** ✅
   - Idéal pour les questions juridiques où il faut maximum de contexte
   - Évite les réponses "Je ne trouve pas d'information"

2. **Retrieved Documents = 20** ✅
   - Couverture complète pour les sujets juridiques complexes
   - Permet les références croisées entre articles de loi

3. **Limit to Data Content = true** ✅
   - Essentiel pour la conformité juridique
   - Évite les interprétations non-autorisées du modèle

## 🔍 Monitoring et Debug

Le système fournit des logs détaillés :

```
[CONFIG] 🔧 AzureAISearchDataSource configuration:
[CONFIG]    📊 Strictness: 1 (1=minimal, 5=aggressive)
[CONFIG]    📄 Retrieved documents: 20
[CONFIG]    🔒 Limit to data content: true

[STRICTNESS] 📊 Applying strictness level 1 to 20 results
[STRICTNESS] 🎯 Calculated threshold: 0.1234 (keeping 95% of results)
[STRICTNESS] ✅ Strictness filtering completed: 19/20 results kept
```

## ⚡ Ajustements possibles

Si vous constatez :

- **Trop de bruit** → Augmenter `strictness` à 2-3
- **Réponses "Je ne sais pas"** → Déjà optimal avec strictness=1  
- **Coût trop élevé** → Réduire `retrievedDocuments` à 15
- **Réponses incomplètes** → Déjà optimal avec 20 documents

---

*Configuration optimisée selon vos paramètres Azure AI Foundry - v1.1.1*
