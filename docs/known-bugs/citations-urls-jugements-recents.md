# Bug Connu: URLs Manquantes pour Jugements Récents

**Statut:** 🟡 Limitation Connue  
**Sévérité:** Mineure (Impact UX acceptable)  
**Date Identification:** 12 décembre 2025  
**Version:** v4.0.0-beta.1-legal-commands+

---

## 📋 Description

Certains jugements récents de tribunaux québécois s'affichent avec un titre lisible mais **sans lien cliquable** dans les citations.

**Exemples:**
- 2025qcca157.pdf
- 2025qcca7.pdf
- 2023qccdchim3.pdf
- 2023qccs4911.pdf

---

## 🔍 Symptômes

**Console (mode DEBUG):**
```
[FORMAT] [URL_TRANSFORM] No code found in title "2025qcca157.pdf", no link will be displayed
[FORMAT] [URL_TRANSFORM] No code found in title "2025qcca7.pdf", no link will be displayed
[FORMAT] [URL_TRANSFORM] No code found in title "2023qccdchim3.pdf", no link will be displayed
[FORMAT] [URL_TRANSFORM] No code found in title "2023qccs4911.pdf", no link will be displayed
```

**Interface Utilisateur:**
```markdown
📚 Sources Consultées

1. **[Titre extrait du document]**
2. **Loi sur les normes du travail** ([Voir le document](https://www.legisquebec.gouv.qc.ca/fr/document/lc/N-1.1))
3. **[Autre jugement sans lien]**
```

---

## 🔬 Analyse Technique

### Pipeline de Traitement Actuel

1. **Extraction Titre** ✅
   - `extractReadableTitle(filename, content)` utilise LLM
   - Titre lisible extrait du contenu avec succès
   - Cache: Évite appels LLM répétés

2. **Génération URL** ✅
   - Pattern regex: `^\d{4}qc[a-z]{2,10}\d+` détecte le format
   - URL générée: `https://www.canlii.org/fr/qc/{tribunal}/{année}/{ref}.html`
   - Exemple: `2025qcca157` → `https://www.canlii.org/fr/qc/qcca/2025/2025qcca157.html`

3. **Validation HTTP** ❌
   - HEAD request vers URL CanLII
   - **Résultat: 404 Not Found**
   - Raison probable: Jugement trop récent, pas encore indexé sur CanLII

4. **LLM Fallback** ❌
   - LLM interrogé pour trouver URL alternative
   - **Résultat: INCONNU** (LLM ne trouve pas l'URL)

5. **Fallback Final** ✅
   - Retourne `null` (au lieu de URL blob)
   - Citation affichée **sans lien** (comportement voulu)

### Cause Racine

**Jugements récents non disponibles sur CanLII:**
- CanLII indexe les décisions avec délai variable
- Jugements 2025/2023 peuvent ne pas être encore publiés
- Certains tribunaux ont délais plus longs (ex: comités déontologie)

**Pattern regex fonctionne correctement:**
- Détecte tous tribunaux QC: qcca, qccs, qccq, qccrt, qccdchim, qctdp, etc.
- Génère URL selon format CanLII standard
- Mais URL n'existe pas encore (404)

---

## ✅ Comportement Actuel (Post-Correction)

| Élément | Avant Bug Fix | Après Bug Fix | Statut |
|---------|---------------|---------------|--------|
| **URL blob** | ❌ Affichée | ✅ Jamais affichée | ✅ OK |
| **Titre** | ❌ Nom fichier .pdf | ✅ Titre lisible (LLM) | ✅ OK |
| **Lien jugement** | ❌ URL blob ou aucun | 🟡 Aucun si 404 | 🟡 Acceptable |

**Avantages:**
- ✅ Sécurité: URLs internes blob storage jamais exposées
- ✅ UX: Titres lisibles pour tous documents
- ✅ Intégrité: Aucun lien mort (404) affiché

**Inconvénient:**
- 🟡 Utilisateur ne peut pas cliquer pour accéder au jugement récent
- 💡 Titre lisible fournit quand même référence utile

---

## 🎯 Impact Utilisateur

**Sévérité:** Mineure

**Scénarios Affectés:**
- Utilisateur pose question sur droits travail → réponse cite jugements récents
- Citations affichent titre lisible SANS lien cliquable
- Utilisateur doit chercher manuellement sur CanLII ou SOQUIJ

**Scénarios Non-Affectés:**
- ✅ Lois et règlements: Tous liens fonctionnels (legisquebec.gouv.qc.ca)
- ✅ Jugements anciens (>1 an): Plupart indexés sur CanLII
- ✅ Aucune URL blob exposée (sécurité OK)

**Feedback Utilisateur Typique:**
> "J'aimerais consulter ce jugement mais il n'y a pas de lien"

**Workaround Utilisateur:**
1. Copier titre du jugement (fourni par LLM)
2. Rechercher sur CanLII: https://www.canlii.org/fr/qc/
3. Ou rechercher sur SOQUIJ (abonnement requis)

---

## 🔧 Solutions Envisagées

### Option 1: API CanLII Officielle ⭐ (Recommandé)

**Avantages:**
- Recherche exacte par référence
- Découverte automatique si jugement existe
- Pas de hard-coding URLs

**Inconvénients:**
- Nécessite clé API (gratuite mais inscription requise)
- Latence supplémentaire (~200-500ms par recherche)

**Effort:** Moyen (1-2 heures)

**Ressources:**
- API CanLII: https://www.canlii.org/en/info/api.html

### Option 2: Recherche Azure Search sur Filepath ⚠️

**Principe:**
- Chercher dans index Azure Search: `filepath CONTAINS "2025qcca157"`
- Extraire URL réelle du document si trouvé

**Avantages:**
- Utilise infrastructure existante
- Pas de dépendance externe

**Inconvénients:**
- Requête Azure Search supplémentaire par jugement
- Coût tokens/requêtes
- URL trouvée = blob storage (on revient au problème initial)

**Effort:** Faible (30 min)  
**Recommandation:** ❌ Non recommandé (retour URLs blob)

### Option 3: Base de Données Mapping Jugements → URLs 📋

**Principe:**
- Table SQL/JSON: `{ "2025qcca157": "https://..." }`
- Mise à jour manuelle ou scraping périodique CanLII

**Avantages:**
- Résolution instantanée (pas d'API call)
- Contrôle total URLs

**Inconvénients:**
- Maintenance manuelle ou automatisation complexe
- Scalabilité limitée

**Effort:** Moyen à Élevé (selon automatisation)  
**Recommandation:** 🟡 Possible mais maintenance lourde

### Option 4: Extraction Références dans Contenu 🔍

**Principe:**
- Parser contenu: chercher pattern "2025 QCCA 157" dans texte
- Générer URL à partir de référence formatée

**Avantages:**
- Pas de dépendance externe
- Fonctionne si référence bien formatée dans contenu

**Inconvénients:**
- Regex complexe (variations format)
- Pas garanti dans tous documents

**Effort:** Moyen (2-3 heures)  
**Recommandation:** 🟡 Peut compléter Option 1

### Option 5: Fallback SOQUIJ ou Autres Sources 🌐

**Principe:**
- Si CanLII 404, essayer autre source (SOQUIJ, Azimut, etc.)

**Avantages:**
- Plus de couverture

**Inconvénients:**
- SOQUIJ payant (pas accessible sans login)
- Multiplication sources = complexité

**Effort:** Élevé  
**Recommandation:** ❌ Non prioritaire

---

## 📅 Plan d'Action

### Court Terme (Phase 5 - Actuel)
- [x] ✅ Éliminer URLs blob (fait)
- [x] ✅ Extraire titres lisibles (fait)
- [x] ✅ Documenter limitation (ce document)
- [ ] Valider comportement acceptable avec utilisateurs

### Moyen Terme (Post-Phase 5)
- [ ] 🔧 Intégrer API CanLII (Option 1)
- [ ] 📊 Mesurer fréquence jugements récents vs anciens
- [ ] 🧪 Tester extraction références contenu (Option 4)

### Long Terme (Backlog)
- [ ] 💡 Évaluer sources additionnelles (SOQUIJ, etc.)
- [ ] 📈 Monitoring: % citations avec/sans liens

---

## 📚 Références

**Code Concerné:**
- `src/agent.js`:
  - Lignes 89-145: `extractReadableTitle()` - Extraction titre LLM
  - Lignes 75-88: `validateUrl()` - Validation HTTP
  - Lignes 95-162: `findUrlWithLLM()` - Fallback LLM
  - Lignes 269-325: `transformToLegisQuebecUrl()` - Pipeline complet
  - Lignes 392-400: `formatBotResponse()` - Affichage citations

- `src/app/azureAISearchDataSource.js`:
  - Lignes 135-148: Construction citations avec `content`

**Documentation:**
- [docs/guides/testing/bug-fixes-session.md](../guides/testing/bug-fixes-session.md) - Historique corrections
- [docs/guides/testing/manual-test-session-checklist.md](../guides/testing/manual-test-session-checklist.md) - Tests manuels

**Ressources Externes:**
- CanLII API: https://www.canlii.org/en/info/api.html
- CanLII Québec: https://www.canlii.org/fr/qc/
- SOQUIJ: https://soquij.qc.ca/

---

## 🏷️ Métadonnées

**Tags:** citations, urls, jugements, canlii, limitation, known-issue  
**Composants:** RAG, Citations, URL Transformation  
**Version Détectée:** v4.0.0-beta.1-legal-commands  
**Dernière Mise à Jour:** 12 décembre 2025  
**Auteur:** @michel-heon
