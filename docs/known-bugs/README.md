# Known Bugs / Limitations Connues

Ce répertoire documente les bugs connus et limitations acceptables du projet ChatBot Légis-QC.

---

## 📋 Liste des Bugs Connus

### 🟡 Bugs Mineurs (Impact UX Acceptable)

1. **[Citations: URLs Manquantes pour Jugements Récents](./citations-urls-jugements-recents.md)**
   - **Sévérité:** Mineure
   - **Impact:** Certains jugements récents affichent titre sans lien cliquable
   - **Statut:** Documenté, solutions envisagées (API CanLII)
   - **Version:** v4.0.0-beta.1-legal-commands+

---

## 🎯 Critères de Classification

### 🔴 Critique (Bloquant)
- Application crash ou erreur fatale
- Données corrompues
- Faille de sécurité
- Fonctionnalité principale inutilisable

**Action:** Correctif immédiat requis

### 🟠 Majeur (Prioritaire)
- Fonctionnalité importante dégradée
- Workaround complexe requis
- Impact significatif sur UX

**Action:** Correction dans prochaine release

### 🟡 Mineur (Acceptable)
- Impact UX limité
- Workaround simple existe
- Limitation connue documentée

**Action:** Correction planifiée ou backlog

### 🔵 Amélioration (Nice-to-have)
- Suggestion d'amélioration
- Feature request
- Optimisation non critique

**Action:** Backlog, évaluation future

---

## 📝 Format de Documentation

Chaque bug connu doit inclure:

1. **Description** - Symptômes observés
2. **Analyse Technique** - Cause racine
3. **Impact Utilisateur** - Scénarios affectés
4. **Solutions Envisagées** - Options avec effort estimé
5. **Plan d'Action** - Court/Moyen/Long terme
6. **Références** - Code, docs, ressources

---

## 🔄 Processus de Gestion

### Ajout d'un Bug Connu

1. Créer fichier markdown dans `docs/known-bugs/`
2. Nommer fichier: `composant-description-courte.md`
3. Utiliser template ci-dessus
4. Mettre à jour ce README.md

### Résolution d'un Bug

1. Marquer bug comme **✅ Résolu** dans description
2. Ajouter section **Solution Implémentée**
3. Référencer commit/PR de correction
4. Déplacer vers `docs/known-bugs/resolved/` (optionnel)

### Review Périodique

- Mensuel: Review statuts, réévaluer sévérités
- Trimestriel: Archiver bugs résolus depuis >3 mois

---

## 📊 Statistiques

**Total Bugs Connus:** 1  
**Critiques:** 0 🔴  
**Majeurs:** 0 🟠  
**Mineurs:** 1 🟡  
**Améliorations:** 0 🔵

**Dernière Mise à Jour:** 12 décembre 2025

---

## 🤝 Contribution

Pour signaler un nouveau bug connu:

1. Vérifier qu'il n'existe pas déjà
2. Créer issue GitHub avec label `known-bug`
3. Documenter selon template
4. Soumettre PR pour ajout documentation

**Template:** Voir [citations-urls-jugements-recents.md](./citations-urls-jugements-recents.md)

---

**Mainteneur:** @michel-heon  
**Projet:** ChatBot Légis-QC  
**Version:** v4.0.0-beta.1-legal-commands+
