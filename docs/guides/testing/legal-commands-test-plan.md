# Test des 6 Commandes Juridiques Personnalisées

## 🧪 Guide de Test Manuel

### Pré-requis
1. Lancer l'application : `Start App in Microsoft 365 Agents Playground`
2. Ouvrir Microsoft 365 Agents Playground
3. Avoir accès au log de débogage (DEBUG=true dans .env)

---

## Test 1: Droits au Travail

### Entrée 1.1
```
Mes droits au travail
```

**Attendu:**
- ✅ Message de bienvenue "**Droits au travail - Légis Québec**"
- ✅ Liste des domaines couverts (normes, santé, discrimination, etc.)
- ✅ Log: `[COMMAND] Detected legal command: droits_travail`

### Entrée 1.2
```
Je viens de me faire congédier. Quels sont mes recours?
```

**Attendu:**
- ✅ Réponse détaillée sur :
  - Loi sur les normes du travail
  - Délai de 45 jours pour porter plainte à la CNESST
  - Procédures de plainte
  - Documents requis
- ✅ Citations des lois pertinentes

### Entrée 1.3
```
Combien d'heures supplémentaires puis-je faire?
```

**Attendu:**
- ✅ Articles sur les heures de travail
- ✅ Taux de majoration (1.5x)
- ✅ Limites légales

---

## Test 2: Protection du Consommateur

### Entrée 2.1
```
Protection du consommateur
```

**Attendu:**
- ✅ Message de bienvenue "**Protection du consommateur - Légis Québec**"
- ✅ Log: `[COMMAND] Detected legal command: protection_consommateur`

### Entrée 2.2
```
Puis-je annuler un contrat signé à domicile?
```

**Attendu:**
- ✅ Mention du délai de 10 jours (résiliation)
- ✅ Loi sur la protection du consommateur
- ✅ Procédures d'annulation

### Entrée 2.3
```
Qu'est-ce que la garantie légale?
```

**Attendu:**
- ✅ Définition de la garantie légale
- ✅ Durée (usage normal)
- ✅ Différence avec garantie conventionnelle

---

## Test 3: Données Personnelles

### Entrée 3.1
```
Protéger mes données personnelles
```

**Attendu:**
- ✅ Message de bienvenue "**Protection des données personnelles - Légis Québec**"
- ✅ Log: `[COMMAND] Detected legal command: donnees_personnelles`

### Entrée 3.2
```
Comment retirer mon consentement?
```

**Attendu:**
- ✅ Procédure de retrait du consentement
- ✅ Loi 25
- ✅ Droits de la personne

### Entrée 3.3
```
Une entreprise a perdu mes données. Que faire?
```

**Attendu:**
- ✅ Obligations de l'entreprise (notification)
- ✅ Signalement à la CAI
- ✅ Recours possibles

---

## Test 4: Mise en Demeure

### Entrée 4.1
```
Rédiger une mise en demeure
```

**Attendu:**
- ✅ Message de bienvenue "**Rédiger une mise en demeure - Légis Québec**"
- ✅ Log: `[COMMAND] Detected legal command: mise_en_demeure`

### Entrée 4.2
```
Quels éléments doivent figurer dans une mise en demeure?
```

**Attendu:**
- ✅ Liste des éléments essentiels:
  - En-tête
  - Faits
  - Fondements juridiques
  - Demande
  - Délai
  - Conséquences
  - Signature
- ✅ Structure détaillée

### Entrée 4.3
```
Quel délai accorder dans une mise en demeure?
```

**Attendu:**
- ✅ Mention de 10-15 jours (généralement)
- ✅ Notion de "délai raisonnable"
- ✅ Contexte spécifique

---

## Test 5: Contester une Décision

### Entrée 5.1
```
Contester une décision
```

**Attendu:**
- ✅ Message de bienvenue "**Contester une décision - Légis Québec**"
- ✅ Log: `[COMMAND] Detected legal command: contester_decision`

### Entrée 5.2
```
Comment contester une décision de la CNESST?
```

**Attendu:**
- ✅ Tribunal administratif du travail (TAT)
- ✅ Délai de contestation
- ✅ Formulaires requis
- ✅ Procédures

### Entrée 5.3
```
Quel est le délai pour faire appel au TAQ?
```

**Attendu:**
- ✅ Mention de 30 jours (généralement)
- ✅ Importance du respect des délais
- ✅ Délais de rigueur

---

## Test 6: Déposer une Plainte

### Entrée 6.1
```
Comment déposer une plainte
```

**Attendu:**
- ✅ Message de bienvenue "**Déposer une plainte - Légis Québec**"
- ✅ Log: `[COMMAND] Detected legal command: deposer_plainte`

### Entrée 6.2
```
Où déposer une plainte pour discrimination au travail?
```

**Attendu:**
- ✅ Commission des droits de la personne
- ✅ CNESST (selon contexte)
- ✅ Délai de 2 ans
- ✅ Procédures

### Entrée 6.3
```
Comment suivre ma plainte à la CNESST?
```

**Attendu:**
- ✅ Numéro de référence
- ✅ Portail en ligne
- ✅ Délais de traitement

---

## Test 7: Variations et Edge Cases

### Entrée 7.1 - Variation de formulation
```
Je veux savoir mes droits de travailleur
```

**Attendu:**
- ✅ Détection de "droits_travail"
- ✅ Même réponse que "Mes droits au travail"

### Entrée 7.2 - Commande dans une phrase
```
J'ai besoin d'aide pour rédiger une mise en demeure à mon propriétaire
```

**Attendu:**
- ✅ Détection de "mise_en_demeure"
- ✅ Réponse adaptée au contexte logement

### Entrée 7.3 - Pas de commande (recherche générale)
```
Qu'est-ce que le Code civil du Québec?
```

**Attendu:**
- ❌ Aucune commande juridique détectée
- ✅ Traitement RAG normal
- ✅ Réponse sur le Code civil

### Entrée 7.4 - Commande Help
```
Aide
```

**Attendu:**
- ✅ Message d'aide complet avec les 6 commandes
- ✅ Descriptions et exemples

---

## 📊 Checklist de Validation

### Fonctionnel
- [ ] Les 6 commandes sont détectées correctement
- [ ] Messages de bienvenue s'affichent pour chaque commande
- [ ] Instructions enrichies sont appliquées
- [ ] Réponses sont pertinentes et détaillées
- [ ] Citations des lois appropriées

### Performance
- [ ] Temps de réponse < 3s (p95)
- [ ] Pas d'erreurs dans les logs
- [ ] RAG retourne des résultats pertinents

### UX
- [ ] Messages sans émojis (conformité ADR-016)
- [ ] Formatting Markdown correct
- [ ] Questions de suivi suggérées
- [ ] Notice légale présente

### Logs de débogage attendus
```
[COMMAND] Detected legal command: [nom_commande]
[RESPONSE] Sent legal command welcome message for: [nom_commande]
[APP] Applying specialized legal command instructions: [nom_commande]
```

---

## 🐛 Problèmes Courants

### Problème: Commande non détectée
- **Cause:** Pattern regex trop restrictif
- **Solution:** Ajouter variations dans `detectLegalCommand()`

### Problème: Instructions non appliquées
- **Cause:** `context.activity.legalCommandContext` non défini
- **Solution:** Vérifier le flow dans `agent.js`

### Problème: Réponses génériques
- **Cause:** RAG ne trouve pas de documents pertinents
- **Solution:** Vérifier l'index Azure Search et les instructions enrichies

---

## 📝 Résultats des Tests

| Commande | Test | Résultat | Notes |
|----------|------|----------|-------|
| Droits au travail | 1.1 | ⏳ | |
| Droits au travail | 1.2 | ⏳ | |
| Droits au travail | 1.3 | ⏳ | |
| Protection consommateur | 2.1 | ⏳ | |
| Protection consommateur | 2.2 | ⏳ | |
| Protection consommateur | 2.3 | ⏳ | |
| Données personnelles | 3.1 | ⏳ | |
| Données personnelles | 3.2 | ⏳ | |
| Données personnelles | 3.3 | ⏳ | |
| Mise en demeure | 4.1 | ⏳ | |
| Mise en demeure | 4.2 | ⏳ | |
| Mise en demeure | 4.3 | ⏳ | |
| Contester décision | 5.1 | ⏳ | |
| Contester décision | 5.2 | ⏳ | |
| Contester décision | 5.3 | ⏳ | |
| Déposer plainte | 6.1 | ⏳ | |
| Déposer plainte | 6.2 | ⏳ | |
| Déposer plainte | 6.3 | ⏳ | |
| Variations | 7.1-7.4 | ⏳ | |

**Légende:** ⏳ À tester | ✅ Succès | ❌ Échec

---

**Date:** 12 décembre 2025  
**Testeur:** _________  
**Version:** 4.0.0-beta.1  
**Branch:** michel-heon/template-engine-agent-base
