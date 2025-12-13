# Validation HTTP des URLs désactivée

**Statut:** 🟡 Mineur / Limitation technique  
**Date:** 2024-12-12  
**Commit:** À documenter

## Description

La validation HTTP des URLs générées (liens vers legisquebec.gouv.qc.ca et canlii.org) est **désactivée** dans le code de production.

**Comportement actuel:**
- Les URLs sont générées par pattern matching (regex)
- **Aucune validation HTTP** n'est effectuée
- Les liens sont affichés directement à l'utilisateur
- Quelques liens 404 possibles (rares)

## Contexte technique

### Code désactivé

Dans [src/agent.js](../../src/agent.js):

```javascript
// Configuration: Disable URL validation to avoid server overload
const ENABLE_URL_VALIDATION = false;

async function transformToLegisQuebecUrl(blobUrl, title) {
  // ... génération URL par regex ...
  
  if (candidateUrl) {
    // Retour direct SANS validation HTTP
    return candidateUrl;
  }
}
```

### Raisons de la désactivation

#### 1. Risque de surcharge serveur

**Problème:**
- Chaque réponse utilisateur génère **5-20 requêtes HTTP HEAD**
- Volume élevé peut être interprété comme **attaque DDoS**
- Risque de **blocage IP** par legisquebec.gouv.qc.ca ou canlii.org

**Impact:**
- 🚨 Service bloqué pour tous les utilisateurs
- ⚠️ Violation potentielle des conditions d'utilisation
- ❌ Pas de respect de `robots.txt`

#### 2. Performance médiocre

**Observations:**
```
[URL_VALIDATE] https://www.legisquebec.gouv.qc.ca/fr/document/lc/C-47.1 -> TIMEOUT (3s)
[URL_VALIDATE] https://www.legisquebec.gouv.qc.ca/fr/document/lc/C-61.1 -> TIMEOUT (3s)
```

- legisquebec.gouv.qc.ca **timeout systématique** (>3s)
- Serveur lent ou bloque les requêtes HEAD
- Impact UX: **latence +15-60s** par réponse utilisateur

#### 3. Cache non persistant

**Problème actuel:**
- Cache en mémoire uniquement (`Map()`)
- Perdu au redémarrage de l'application
- Pas de mutualisation entre utilisateurs

**Conséquence:**
- Mêmes URLs validées encore et encore
- Multiplication des requêtes HTTP

## Impact utilisateur

### ✅ Positif

- **Performance optimale** (pas d'attente validation)
- **Fiabilité** des patterns regex (bien testés)
- **Disponibilité** garantie (pas de blocage IP)

### 🟡 Neutre/Acceptable

- **Quelques liens 404** possibles (~1-2% des cas)
  - Principalement jugements très récents (<1 mois)
  - Documents retirés/déplacés
- **Titre affiché** même si lien invalide
- **Utilisateur peut copier-coller** le titre dans Google

### ❌ Négatif

- Pas de détection proactive des URLs invalides
- Expérience légèrement dégradée pour cas rares

## Solutions envisagées

### Option 1 - Cache persistant (Redis/DB) ⭐ Recommandé

**Description:**
- Stocker résultats validation dans Redis ou base de données
- TTL de 30 jours (URLs rarement modifiées)
- Rate limiting: max 5 validations/minute

**Avantages:**
- ✅ Mutualisation entre utilisateurs
- ✅ Réduit drastiquement le volume de requêtes
- ✅ Performance optimale après warm-up

**Effort:** Medium (2-3 jours)

**Implementation:**
```javascript
const redis = require('redis');
const client = redis.createClient();

async function validateUrlWithCache(url) {
  const cached = await client.get(`url:${url}`);
  if (cached !== null) return cached === 'true';
  
  // Throttle: max 5 validations/minute
  const count = await client.incr('validation:count');
  await client.expire('validation:count', 60);
  if (count > 5) return null; // Skip validation
  
  const isValid = await validateUrl(url);
  await client.setex(`url:${url}`, 2592000, isValid.toString()); // 30 days
  return isValid;
}
```

### Option 2 - Validation asynchrone (background job)

**Description:**
- Afficher lien immédiatement (sans validation)
- Valider en arrière-plan après réponse
- Logger les URLs invalides
- Correction manuelle périodique

**Avantages:**
- ✅ Zéro impact UX
- ✅ Détection des problèmes
- ✅ Amélioration continue

**Effort:** Low (1 jour)

### Option 3 - API CanLII officielle 🌟 Idéal long terme

**Description:**
- Utiliser API officielle CanLII pour vérifier existence
- Requête unique avec métadonnées complètes
- Moins de risque de blocage (usage légitime)

**Avantages:**
- ✅ Solution officielle et fiable
- ✅ Métadonnées enrichies (date, tribunal, etc.)
- ✅ Pas de parsing/regex

**Inconvénient:**
- ❌ API payante ou accès limité
- ❌ Nécessite inscription/clé API

**Effort:** Medium-High (3-5 jours)

### Option 4 - Pattern matching amélioré (Actuel) ✅

**Description:**
- Se fier uniquement aux patterns regex
- Améliorer patterns basés sur retours utilisateurs
- Accepter 1-2% de liens 404

**Avantages:**
- ✅ Simple et fiable
- ✅ Aucun risque de blocage
- ✅ Performance optimale

**Inconvénient:**
- 🟡 Quelques erreurs acceptables

**Effort:** Minimal (maintenance continue)

## Action recommandée

### Court terme (actuel)
✅ **Garder validation désactivée**
- Pattern matching fiable
- Performance optimale
- Pas de risque de blocage

### Moyen terme (3-6 mois)
🎯 **Implémenter Option 1 (Cache Redis)**
- Mutualisation entre utilisateurs
- Rate limiting respectueux
- Amélioration progressive

### Long terme (6-12 mois)
🌟 **Évaluer Option 3 (API CanLII)**
- Solution robuste et officielle
- Métadonnées enrichies
- Évolutivité

## Notes techniques

### Fichiers concernés

- [src/agent.js](../../src/agent.js) - Ligne ~6: `ENABLE_URL_VALIDATION = false`
- [src/agent.js](../../src/agent.js) - Ligne ~48-88: Fonction `validateUrl()` (non utilisée)
- [src/agent.js](../../src/agent.js) - Ligne ~269-330: Fonction `transformToLegisQuebecUrl()`

### Pour réactiver la validation

```javascript
const ENABLE_URL_VALIDATION = true; // Ligne ~6
```

⚠️ **Attention:** Risque de blocage IP si trafic élevé!

## Références

- ADR-003: Optimisation recherche vectorielle et RAG
- Issue #21: Tests manuels Phase 5
- Commit 1265f0d: Bug #2 corrections (blob URLs + titres lisibles)

## Historique

- **2024-12-12**: Désactivation validation HTTP pour éviter surcharge serveur
- **2024-12-11**: Implémentation validation HTTP avec timeout 3s
- **2024-12-11**: Identification problème timeout legisquebec.gouv.qc.ca
