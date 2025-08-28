# Tests et Validation - Correction Priorisation Légale

Ce dossier contient les scripts essentiels pour valider la correction critique du problème de priorisation légale (A-3.001 vs A-3).

## 🎯 Scripts Principaux

### ⭐ **simulate-fixed-search.js** - SCRIPT PRINCIPAL
**Usage**: `node tests/simulate-fixed-search.js`

**Description**: Simulation complète de la recherche corrigée
- Teste la requête "Je me suis blessé au travail"
- Valide le tri intelligent par statut légal
- Vérifie que A-3.001 (en vigueur) est priorisé avant A-3 (abrogé)
- Simule l'envoi au LLM avec limitation de tokens

**Résultat attendu**: ✅ A-3.001 avant A-3, lois en vigueur prioritaires

---

### 🔍 **debug-status.js** - Diagnostic Statuts
**Usage**: `node tests/debug-status.js`

**Description**: Analyse les statuts légaux dans l'index Azure
- Recherche A-3.001 et A-3 spécifiquement
- Liste les documents avec statut null
- Identifie les problèmes de qualité des données

**Utilité**: Diagnostic des problèmes de statuts légaux

---

### 🧪 **test-sorting-logic.js** - Test Tri Intelligent
**Usage**: `node tests/test-sorting-logic.js`

**Description**: Test spécifique de la logique de tri
- Simule la recherche "accident travail"
- Applique le tri intelligent par priorité de statut
- Valide que A-3.001 passe avant A-3

**Utilité**: Validation isolée du tri par statut légal

---

### ⚖️ **test-sdk-thresholds.js** - Validation Seuils
**Usage**: `node tests/test-sdk-thresholds.js`

**Description**: Test des seuils strictness Azure SDK
- Valide les seuils calibrés (0.005-0.040)
- Compare avec les scores normalisés Azure SDK
- Vérifie la cohérence du filtrage

**Utilité**: Debug des problèmes de scores et filtrage

---

### 🔬 **debug-a3-investigation.js** - Investigation A-3*
**Usage**: `node tests/debug-a3-investigation.js`

**Description**: Investigation détaillée des lois A-3*
- Recherche tous les documents A-3*
- Analyse les scores pour différentes requêtes
- Diagnostic approfondi A-3 vs A-3.001

**Utilité**: Debug avancé des problèmes spécifiques A-3

---

## 🚀 Test Rapide

```bash
# Test principal - validation complète
node tests/simulate-fixed-search.js

# En cas de problème, diagnostic
node tests/debug-status.js
```

## 📊 Métriques de Succès

- ✅ A-3.001 (loi en vigueur) priorisé avant A-3 (loi abrogé)
- ✅ Lois "en vigueur" en tête des résultats
- ✅ Aucune loi abrogée envoyée au LLM dans les 3 premiers documents
- ✅ Limitation tokens respectée (~1500 tokens max)

---

## 🔄 Règles de Développement

### ⚠️ **PRIORITÉ RÉUTILISABILITÉ**
**Avant de créer un nouveau script de test/debug :**

1. **VÉRIFIER** si un script existant peut être modifié/étendu
2. **RÉUTILISER** les scripts dans `tests/` en priorité  
3. **ÉVITER** la création de nouveaux scripts sauf nécessité absolue
4. **DOCUMENTER** toute modification dans ce README

### 📋 **Guide de Réutilisation**
- **Diagnostic général** → `debug-status.js` 
- **Test correction A-3** → `simulate-fixed-search.js`
- **Debug tri/priorité** → `test-sorting-logic.js`
- **Problèmes scores** → `test-sdk-thresholds.js`  
- **Investigation A-3** → `debug-a3-investigation.js`

**Objectif** : Maintenir un workspace propre et éviter la prolifération de scripts redondants.

---

*Ces scripts valident que la correction critique du problème de priorisation légale fonctionne correctement.*
