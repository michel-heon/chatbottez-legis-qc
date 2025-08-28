# Guide de Développement - Projet LegisQC

## 🎯 Objectifs Principaux
- Application de recherche juridique fiable et sécurisée
- Priorisation des lois en vigueur sur les lois abrogées
- Performance optimisée pour les requêtes utilisateur

## 🧪 Philosophie de Test et Debug

### ⚠️ **RÈGLE PRINCIPALE : RÉUTILISABILITÉ AVANT CRÉATION**

**Avant de créer tout nouveau script de test/debug/validation :**

1. **🔍 VÉRIFIER** si un script existant dans `tests/` peut répondre au besoin
2. **🔄 ÉTENDRE** un script existant plutôt que créer un nouveau
3. **📝 DOCUMENTER** les modifications dans `tests/README.md`
4. **🗑️ NETTOYER** les anciens scripts devenus obsolètes

### 📁 Scripts de Référence (`tests/`)

| Script | Usage | Quand l'utiliser |
|--------|-------|------------------|
| `simulate-fixed-search.js` | Validation principale A-3.001 vs A-3 | Test correction priorisation légale |
| `debug-status.js` | Diagnostic statuts dans index | Problèmes de données légales |
| `test-sorting-logic.js` | Test tri intelligent | Debug algorithme de tri |
| `test-sdk-thresholds.js` | Validation seuils strictness | Problèmes de scores/filtrage |
| `debug-a3-investigation.js` | Investigation lois A-3* | Debug spécifique accidents travail |

### 🚫 **Anti-Patterns à Éviter**

- ❌ Créer `test-X.js` quand `debug-status.js` peut être modifié
- ❌ Dupliquer la logique de tri au lieu d'étendre `test-sorting-logic.js`  
- ❌ Laisser des scripts temporaires dans le workspace principal
- ❌ Créer des scripts sans documentation

### ✅ **Bonnes Pratiques**

- ✅ Modifier un script existant et commit avec `refactor:`
- ✅ Ajouter des fonctions aux scripts existants
- ✅ Organiser dans `tests/` avec documentation claire
- ✅ Supprimer les scripts obsolètes après validation

## 🔧 Workflow de Debug Recommandé

1. **Identifier le problème** → Quel type ? (scoring, tri, données, etc.)
2. **Choisir le script approprié** → Consulter tableau ci-dessus
3. **Modifier/étendre le script** → Au lieu de créer nouveau
4. **Tester la modification** → Validation rapide
5. **Documenter** → Mettre à jour README si nécessaire
6. **Nettoyer** → Supprimer temporaires/obsolètes

## 📊 Métriques de Succès

- **Nombre de scripts** : Maintenir < 10 scripts dans `tests/`
- **Réutilisation** : Préférer modification vs création (ratio 80/20)
- **Documentation** : Chaque script documenté dans README
- **Workspace** : Aucun script temporaire dans racine du projet

---

**Objectif** : Maintenir un workspace propre, efficace et facilement maintenable en évitant la prolifération de scripts redondants.
