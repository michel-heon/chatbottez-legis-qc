# Guide de Test - Streaming des Réponses

## 🎯 Objectif
Valider que le bot affiche les réponses de manière progressive (streaming) au lieu d'afficher tout le texte d'un coup après un délai de blocage.

## ✅ Comportement Attendu

### Avant (Bloquant)
1. ❌ L'utilisateur envoie un message
2. ❌ Rien ne se passe pendant quelques secondes
3. ❌ La réponse complète apparaît soudainement d'un coup

### Après (Streaming) ✨
1. ✅ L'utilisateur envoie un message
2. ✅ **Indicateur de frappe** apparaît immédiatement (`typing...`)
3. ✅ Le texte commence à apparaître progressivement
4. ✅ Les mots/phrases s'ajoutent en continu comme dans ChatGPT
5. ✅ Expérience fluide et réactive

## 🧪 Scénarios de Test

### Test 1: Question Simple
**Message:** `Qu'est-ce qu'une loi?`

**Attendu:**
- Indicateur de frappe visible immédiatement
- Texte apparaît mot par mot ou phrase par phrase
- Pas de blocage visible

### Test 2: Question Complexe (Longue Réponse)
**Message:** `Explique-moi en détail le processus législatif au Québec`

**Attendu:**
- Indicateur de frappe pendant la génération
- Réponse longue qui s'affiche progressivement
- Possibilité de voir le début avant la fin de la génération
- Streaming fluide sans saccades

### Test 3: Question avec Citations
**Message:** `Quelles sont les lois sur le logement au Québec?`

**Attendu:**
- Streaming fonctionne même avec citations
- Les citations s'ajoutent à la fin
- Format préservé

### Test 4: Commande d'Aide
**Message:** `Aide`

**Attendu:**
- Réponse prédéfinie affichée normalement
- Pas de streaming nécessaire (message court)

## 🔍 Points à Vérifier

### Performance
- [ ] Pas de blocage visible de l'interface
- [ ] Indicateur de frappe apparaît immédiatement
- [ ] Texte commence à apparaître en < 2 secondes
- [ ] Flux continu sans interruption
- [ ] Pas de saccades ou ralentissements

### UX (Expérience Utilisateur)
- [ ] L'utilisateur peut voir le début de la réponse rapidement
- [ ] Sensation de réactivité du bot
- [ ] Pas de frustration d'attente
- [ ] Impression de "conversation naturelle"

### Technique
- [ ] `UPDATE_INTERVAL = 500ms` fonctionne correctement
- [ ] Pas d'erreurs dans la console
- [ ] Logging montre les chunks reçus
- [ ] Historique de conversation préservé
- [ ] Citations fonctionnent correctement

## 📊 Métriques à Observer

### Logs Debug (si DEBUG=true)
```
[APP] 🤖 Sending request to OpenAI model with streaming: gpt-4o
[OPENAI] 📤 Sending X messages to streaming API
[OPENAI] 🌊 Starting to receive streaming chunks...
[OPENAI] 📝 Accumulated Y characters...
[OPENAI] 📝 Accumulated Z characters...
[OPENAI] ✅ Streaming complete. Total content: N characters
```

### Timing
- **Time to First Byte (TTFB):** < 2 secondes
- **Update Frequency:** ~500ms entre les mises à jour
- **Total Time:** Comparable au mode bloquant mais avec feedback visuel

## 🐛 Problèmes Potentiels

### Symptôme: Pas de streaming visible
**Causes possibles:**
- Teams cache les mises à jour trop fréquentes
- `UPDATE_INTERVAL` trop court ou trop long
- Problème avec `await send({ type: 'typing' })`

**Solution:** Ajuster `UPDATE_INTERVAL` ou implémenter update de message

### Symptôme: Erreur "Rate Limit"
**Cause:** Trop d'appels à l'API
**Solution:** Le code gère déjà avec message d'erreur approprié

### Symptôme: Texte dupliqué
**Cause:** Problème dans l'accumulation des chunks
**Solution:** Vérifier la logique `fullContent += delta`

## 🚀 Commandes de Test

### Lancer le bot en mode debug
```bash
DEBUG=true npm run dev:teamsfx
```

### Tester localement (Playground)
```bash
npm run dev:teamsfx:testtool
```

### Tester dans Teams Desktop
1. Ouvrir le task "Start Agent Locally"
2. Installer l'app dans Teams
3. Envoyer des messages de test

## 📝 Rapport de Test

### Template
```markdown
## Test du Streaming - [Date]

**Environnement:** Local / Dev / Sandbox
**Version:** v1.1.9+

### Résultats
- [ ] Test 1: Question Simple - ✅/❌
- [ ] Test 2: Question Complexe - ✅/❌
- [ ] Test 3: Citations - ✅/❌
- [ ] Test 4: Commandes - ✅/❌

### Observations
- Temps jusqu'au premier texte: _____ secondes
- Fluidité du streaming: Excellent / Bon / Moyen / Faible
- Problèmes rencontrés: _____

### Conclusion
- [ ] Streaming fonctionne correctement
- [ ] Prêt pour production
- [ ] Nécessite ajustements: _____
```

## 🎯 Critères de Succès

Pour considérer le streaming comme réussi:

1. ✅ **Indicateur visible:** Typing indicator apparaît immédiatement
2. ✅ **Pas de blocage:** Pas de période sans feedback > 2 secondes
3. ✅ **Texte progressif:** Texte apparaît par vagues, pas d'un coup
4. ✅ **Expérience fluide:** Sensation naturelle et réactive
5. ✅ **Pas d'erreurs:** Aucune erreur console ou application
6. ✅ **Citations OK:** Les citations fonctionnent normalement
7. ✅ **Historique OK:** L'historique de conversation est préservé

## 📚 Références

- **Issue GitHub #15:** Bot Commands - Generic handlers
- **Commit:** 1014f34 - "feat: Implement streaming responses"
- **Documentation Azure OpenAI:** [Streaming](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/streaming)
- **Teams AI Library:** [GitHub](https://github.com/microsoft/teams-ai)

## 🔄 Prochaines Étapes

Après validation du streaming:
1. Tester en environnement sandbox
2. Valider avec plusieurs utilisateurs
3. Ajuster `UPDATE_INTERVAL` si nécessaire
4. Documenter les métriques observées
5. Fermer l'issue #15 si tous les critères sont remplis
