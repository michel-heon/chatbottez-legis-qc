# Améliorations de la Recherche Contextuelle - Conduite en État d'Ébriété

## Problème Identifié
La question "Qu'est-ce qui arrive si je conduis saoul?" retournait des documents sur les **véhicules hors route** (motoneiges, VTT) au lieu des documents sur les **véhicules automobiles** (Code de la sécurité routière).

## Solution Implémentée

### 1. Module de Détection Contextuelle (`lib/searchEnhancer.js`)
- **Fonction `enhanceSearchQuery()`** : Détecte automatiquement les questions sur la conduite en état d'ébriété
- **Mots-clés détectés** : "saoult", "saoul", "ivre", "alcool", "ébriété", "facultés affaiblies"
- **Amélioration automatique** : Ajoute des termes comme "Code de la sécurité routière", "C-24.2", "alcool au volant"
- **Fonction `sortResultsByContext()`** : Priorise les documents du Code de la sécurité routière pour ces questions

### 2. Module d'Amélioration du Prompt (`lib/promptEnhancer.js`)
- **Fonction `enhanceSystemPrompt()`** : Détecte les ambiguïtés entre domaines juridiques
- **Clarification automatique** : Distingue véhicules automobiles vs véhicules hors route
- **Génération de questions contextuelles** appropriées au domaine détecté

### 3. Intégration dans Azure AI Search (`src/app/azureAISearchDataSource.ts`)
- **Amélioration de requête** : Utilise `enhanceSearchQuery()` avant la recherche
- **Tri contextuel** : Applique `sortResultsByContext()` aux résultats
- **Alertes contextuelles** : Ajoute des préfixes informatifs au contexte envoyé au LLM

## Fonctionnalités

### Détection Automatique
```javascript
// Exemples de requêtes détectées automatiquement :
"Qu'est-ce qui arrive si je conduis saoul?" → contexte: traffic_impairment
"conduite avec facultés affaiblies" → contexte: traffic_impairment  
"alcool au volant" → contexte: traffic_impairment
```

### Amélioration de Requête
```javascript
// Requête originale
"Qu'est-ce qui arrive si je conduis saoul?"

// Requête améliorée automatiquement
"Qu'est-ce qui arrive si je conduis saoul? OR \"Code de la sécurité routière\" OR \"conduite facultés affaiblies\" OR \"alcool au volant\" OR \"C-24.2\" OR \"permis de conduire suspendu\""
```

### Priorisation Intelligente
1. **Pour questions de conduite ébriété** : Code de la sécurité routière (C-24.2) en priorité
2. **Général** : Lois en vigueur > null > modifiées > abrogées
3. **Ensuite** : Score de pertinence

### Alertes Contextuelles
- Si documents C-24.2 trouvés : "Priorité aux documents du Code de la sécurité routière"
- Si seuls documents hors route : "Les documents concernent les véhicules hors route. Pour les véhicules automobiles, cette information n'est pas disponible"

## Logs de Débogage

### Logs d'Amélioration
```
🔍 Détection: Question sur conduite en état d'ébriété
🎯 Requête améliorée: "..."
📊 Tri appliqué: Code de la sécurité routière priorisé
```

### Logs d'Alerte
```
⚠️  ALERTE: Question sur conduite automobile mais seuls des documents véhicules hors route trouvés
✅ Documents du Code de la sécurité routière trouvés
```

## Tests

### Scripts de Test Créés
1. **`scripts/test-search-enhancement.sh`** : Test de la logique d'amélioration
2. **`scripts/test-realtime-improvements.sh`** : Vérification en temps réel
3. **`scripts/test-api-improvements.sh`** : Test via l'API locale

### Résultats Attendus
- ✅ Détection automatique des questions sur l'alcool au volant
- ✅ Amélioration des requêtes avec termes appropriés  
- ✅ Priorisation des documents C-24.2
- ✅ Alertes quand seuls des documents hors route sont disponibles

## Architecture

```
Question utilisateur
    ↓
searchEnhancer.js (détection contexte + amélioration requête)
    ↓
Azure AI Search (recherche avec requête améliorée)
    ↓
sortResultsByContext() (tri contextuel)
    ↓
promptEnhancer.js (préfixe contextuel)
    ↓
LLM (génération réponse avec contexte amélioré)
```

## Compatibilité
- ✅ Compatible avec toutes les lois du Québec
- ✅ Extensible pour d'autres domaines juridiques
- ✅ Maintient la performance existante
- ✅ Logs détaillés pour diagnostic

## Déploiement
1. Les modules sont automatiquement chargés par `azureAISearchDataSource.ts`
2. Aucune configuration supplémentaire requise
3. Redémarrage de l'application nécessaire pour prise en compte