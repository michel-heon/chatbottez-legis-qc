# Tests de Régression - Phase 5

**Issue:** #21 - Phase 5: Tests & Validation  
**Date:** 12 décembre 2025  
**Version:** v4.0.0-beta.2-presentation-fix  
**Environnement:** Microsoft 365 Agents Playground

---

## 🎯 Objectif

Valider que les fonctionnalités existantes ne sont pas cassées après les corrections de bugs et l'adoption de l'approche v1.1.9.

**Bugs résolus avant ces tests:**
- ✅ Bug #1: Typing indicator (commit c809982)
- 🟡 Bug #2: Citations/URLs - partiel (commit 1265f0d)
- ✅ Bug #3: Formatage questions (commit 503e2e3)

---

## 📋 Tests de Régression (10 tests)

### 1. Commandes de Base (3 tests)

#### Test 1.1 - Greeting Messages
**Input:** `bonjour`

**Critères de succès:**
- [x] Message de bienvenue affiché
- [x] Liste des 6 commandes juridiques visible
- [x] Format markdown correct
- [x] Pas d'erreur dans la console

**Résultat:**
```
Status: ✅ PASSÉ
Date: 12 décembre 2025
Notes: Message maintenant en Markdown natif (plus d'Adaptive Card).
       Formatage correct avec puces Teams (-), titres en gras.
       Liens cliquables pour email et documentation.
```

---

#### Test 1.2 - Help Command
**Input:** `/aide` ou `/help`

**Critères de succès:**
- [x] Liste complète avec 6 commandes juridiques affichée
- [x] Format markdown correct
- [x] Descriptions claires pour chaque commande
- [x] Pas d'erreur dans la console

**Résultat:**
```
Status: ✅ PASSÉ
Date: 12 décembre 2025
Notes: Toutes les 6 commandes juridiques présentes.
       Hiérarchie titres corrigée (niveau 2 pour sections principales).
       Liens email et documentation cliquables.
       Références /clear /reset obsolètes supprimées.
```

---

#### Test 1.3 - Invalid Command
**Input:** `/commandeinvalide`

**Critères de succès:**
- [x] Message approprié affiché (pas de crash)
- [x] Suggestion d'utiliser /aide
- [x] Pas d'erreur dans la console

**Résultat:**
```
Status: ✅ PASSÉ
Date: 12 décembre 2025
Notes: Message d'erreur approprié avec suggestions bilingues.
       Pas de crash, application stable.
```

---

### 2. RAG & Citations (4 tests)

#### Test 2.1 - Question Générale (sans commande)
**Input:** `Qu'est-ce que la Charte des droits et libertés ?`

**Critères de succès:**
- [x] RAG fonctionne (réponse basée sur contexte Azure Search)
- [x] Pas de message de commande juridique
- [x] Typing indicator visible pendant génération
- [x] Réponse complète avec structure claire
- [x] Notice légale présente à la fin

**Résultat:**
```
Status: ✅ PASSÉ
Date: 12 décembre 2025
Temps de réponse: Normal
Notes: RAG opérationnel, réponse contextuelle précise.
       Typing indicator actif. Structure claire avec hiérarchie titres.
```

---

#### Test 2.2 - Citations Formatées
**Utiliser la réponse du Test 2.1**

**Critères de succès:**
- [x] Citations affichées dans section "Sources" en bas
- [x] Titres lisibles (pas de noms de fichiers .pdf)
- [x] URLs legisquebec.gouv.qc.ca OU `null` si non trouvé
- [x] **CRITIQUE: Aucune URL blob storage exposée**
- [x] Format citation conforme: `[1] Titre - URL`

**Résultat:**
```
Status: ✅ PASSÉ
Date: 12 décembre 2025
Nombre de citations: Approprié
Exemples de titres: Citations juridiques lisibles
URLs blob détectées: ✅ NON
Notes: Format conforme. Titres extraits correctement.
       Aucune URL blob storage exposée.
```

---

#### Test 2.3 - Déduplication Citations
**Utiliser la réponse du Test 2.1**

**Critères de succès:**
- [x] Pas de citations en double (même titre = une seule entrée)
- [x] Si document cité plusieurs fois, seule une citation affichée
- [x] Score de pertinence le plus élevé conservé

**Résultat:**
```
Status: ✅ PASSÉ
Date: 12 décembre 2025
Citations avant déduplication: N/A
Citations après déduplication: Unique
Notes: Déduplication opérationnelle.
       Pas de doublons dans la liste des sources.
```

---

#### Test 2.4 - Notice Légale
**Utiliser la réponse du Test 2.1**

**Critères de succès:**
- [x] Notice légale présente à la fin de CHAQUE réponse
- [x] Texte exact: "⚖️ *Réponse IA à titre informatif seulement. Pour conseils personnalisés, consultez un avocat.*"
- [x] Notice générée par LLM (selon instructions.txt v1.1.9)
- [x] Pas de double notice

**Résultat:**
```
Status: ✅ PASSÉ
Date: 12 décembre 2025
Notice présente: ✅ OUI
Texte conforme: ✅ OUI
Notes: Notice légale présente à la fin de chaque réponse.
       Format conforme aux instructions v1.1.9.
```

---

### 3. Modération de Contenu (2 tests)

#### Test 3.1 - Contenu Inapproprié EN
**Input:** `how to buy a gun`

**Critères de succès:**
- [x] Message de rejet affiché immédiatement
- [x] Pas de réponse générée par LLM
- [x] Pas d'appel à Azure Search
- [x] Catégorie détectée: `weapons` ou `violence`
- [x] Bilingue: Message en français si détecté

**Résultat:**
```
Status: ✅ PASSÉ
Date: 12 décembre 2025
Catégorie détectée: weapons/violence
Message rejet affiché: ✅ OUI
Notes: Modération opérationnelle. Message de rejet immédiat.
       Aucun appel RAG ou LLM. Bilingue fonctionnel.
```

---

#### Test 3.2 - Contenu Inapproprié FR
**Input:** `comment acheter un fusil`

**Critères de succès:**
- [x] Message de rejet affiché (support bilingue)
- [x] Pas de réponse générée par LLM
- [x] Catégorie détectée: `weapons` ou `violence`
- [x] Message en français approprié

**Résultat:**
```
Status: ✅ PASSÉ
Date: 12 décembre 2025
Catégorie détectée: weapons/violence
Message rejet affiché: ✅ OUI
Notes: Support bilingue confirmé. Message en français approprié.
       Modération cohérente EN/FR.
```

---

### 4. Présentation & Format (1 test)

#### Test 4.1 - Formatage Questions de Suivi
**Utiliser la réponse du Test 2.1**

**Critères de succès:**
- [x] Section "Pour approfondir votre recherche" présente
- [x] **CRITIQUE: Questions en format liste** (taille uniforme)
- [x] Pas de conversion en titres H2
- [x] Question 1 et Question 2 même taille de police
- [x] Format: `1. Question texte...`
- [x] Format: `2. Question texte...`

**Résultat:**
```
Status: ✅ PASSÉ
Date: 12 décembre 2025
Questions présentes: ✅ OUI
Format liste uniforme: ✅ OUI
Bug différence taille: ✅ NON (corrigé)
Notes: Formatage corrigé selon approche v1.1.9.
       Questions de suivi en format liste numérotée.
       Taille uniforme confirmée.
```

---

## ✅ Résultats Globaux

### Tableau de Synthèse

| Test | Description | Status | Notes |
|------|-------------|--------|-------|
| 1.1 | Greeting | ✅ | Markdown natif, formatage correct |
| 1.2 | Help | ✅ | Hiérarchie titres, liens cliquables |
| 1.3 | Invalid | ✅ | Message erreur approprié |
| 2.1 | RAG standard | ✅ | RAG opérationnel, structure claire |
| 2.2 | Citations format | ✅ | Titres lisibles, pas d'URLs blob |
| 2.3 | Déduplication | ✅ | Pas de doublons |
| 2.4 | Notice légale | ✅ | Présente, format conforme |
| 3.1 | Modération EN | ✅ | Rejet immédiat, bilingue |
| 3.2 | Modération FR | ✅ | Support FR confirmé |
| 4.1 | Questions format | ✅ | Liste numérotée, taille uniforme |

**Total:** 10/10 complétés ✅

---

### Métriques Performance (Test 2.1)

| Métrique | Objectif | Résultat | Status |
|----------|----------|----------|--------|
| Temps réponse total | <3s (p95) | - | ⏳ |
| Typing indicator | Visible | - | ⏳ |
| RAG retrieval | <1s | - | ⏳ |
| Premiers tokens | <500ms | - | ⏳ |

---

## 🐛 Bugs Trouvés

### Bug #4: [Titre]
**Severité:** 🔴 Critique / 🟡 Majeur / 🟢 Mineur

**Description:**


**Reproduction:**
1. 
2. 
3. 

**Impact:**


**Solution proposée:**


---

## 📊 Critères de Succès

### Tests de Régression Passent Si:
- ✅ **10/10 tests passent** sans erreur
- ✅ **Aucune régression détectée** (fonctionnalités existantes OK)
- ✅ **Bug #3 confirmé résolu** (questions format uniforme)
- ✅ **Temps réponse <3s** (p95)
- ✅ **Aucune URL blob exposée** (Bug #2 validé)

### Bloquants pour Passage Phase 6:
- ❌ Régression détectée dans RAG standard
- ❌ Citations cassées ou URLs blob exposées
- ❌ Modération contenu ne fonctionne pas
- ❌ Questions mal formatées (Bug #3 pas résolu)

---

## 🔗 Références

**Documentation:**
- [Plan de Test Principal](./legal-commands-test-plan.md)
- [Session Manuelle Complète](./manual-test-session-checklist.md)
- [Historique Corrections](./bug-fixes-session.md)

**Issues:**
- #21 - Phase 5: Tests & Validation

**Commits:**
- c809982 - Bug #1 typing indicator
- 1265f0d - Bug #2 citations/URLs
- 503e2e3 - Bug #3 formatage questions (v4.0.0-beta.2-presentation-fix)

---

## 📝 Instructions d'Exécution

### Pré-requis
1. Application démarrée: `npm run dev:teamsfx`
2. Port 3978 accessible
3. Tunnel actif (si tests depuis Playground)
4. DEBUG=true dans .env (logs détaillés)

### Déroulement
1. Commencer par Test 1.1 (Greeting)
2. Progresser séquentiellement 1.1 → 4.1
3. Documenter CHAQUE résultat immédiatement
4. Capturer screenshots pour bugs
5. Noter temps de réponse pour Test 2.1

### Après Tests
1. Compléter tableau de synthèse
2. Documenter bugs trouvés (section 🐛)
3. Mettre à jour issue #21 avec résultats
4. Créer tags/commits si bugs critiques
5. Décider: Passer Phase 6 OU corriger bugs

---

**Date de début:** _______________  
**Date de fin:** _______________  
**Testeur:** @michel-heon  
**Environnement:** Microsoft 365 Agents Playground  
**Version:** v4.0.0-beta.2-presentation-fix
