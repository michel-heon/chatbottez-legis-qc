# ADR 008: Streaming Réponses Progressives

## Statut

✅ Accepté

## Date

2025-11-17

## Contexte

Les modèles de langage (LLM) peuvent prendre plusieurs secondes pour générer une réponse complète, particulièrement lorsque :
- La réponse est longue et détaillée
- Le modèle effectue des appels RAG (Retrieval-Augmented Generation)
- Le traitement inclut des étapes de prétraitement complexes

Cette latence crée une expérience utilisateur sous-optimale où l'utilisateur attend sans feedback visuel, donnant l'impression que l'application est figée ou ne répond pas.

### Problème Initial

Avant l'implémentation du streaming :
- Les réponses apparaissaient d'un seul coup après plusieurs secondes d'attente
- Aucun feedback visuel pendant la génération
- Impression de lenteur même si le LLM génère activement
- Expérience utilisateur frustrante pour les questions complexes

### Tentatives Précédentes

Plusieurs approches ont été testées avant d'arriver à la solution finale :

1. **Tentative 1 : `prompt.stream()` non-existante**
   - Erreur : `TypeError: prompt.stream is not a function`
   - Cause : La méthode n'existe pas dans Teams.ai v2

2. **Tentative 2 : `stream: true` dans OpenAIChatModel**
   - Ajout de l'option `stream: true` au modèle
   - Tentative de lire `completion.stream`
   - Problème : API incompatible avec le framework

3. **Tentative 3 : Accumulation manuelle avec `send()`**
   - Accumulation de chunks et envoi périodique via `send()`
   - Problème : Chaque appel à `send()` créait un nouveau message, résultant en sauts de lignes à chaque mot

## Décision

Nous implémentons le streaming des réponses en utilisant **l'API officielle Teams.ai v2** avec le callback `onChunk` et l'objet `stream.emit()`.

### Solution Retenue

```javascript
// 1. Ajouter 'stream' au contexte du message handler
app.on('message', async ({ send, stream, activity }) => {
  
  // 2. Utiliser onChunk callback pour capturer les chunks
  const response = await prompt.send(activity.text, {
    onChunk: (chunk) => {
      stream.emit(chunk);  // Émet chaque chunk progressivement
    }
  });
  
  // 3. Envoyer l'indicateur AI-generated après le streaming
  if (!activity.conversation.isGroup) {
    stream.emit(new MessageActivity().addAiGenerated());
  }
  
  // 4. Gérer les citations après le streaming complet
  if (citations.length > 0) {
    if (activity.conversation.isGroup) {
      // Groupes : message complet avec citations
      const messageActivity = new MessageActivity(response.content)
        .addAiGenerated();
      citations.forEach(({ number, citation }) => {
        messageActivity.addCitation(number, citation);
      });
      await send(messageActivity);
    } else {
      // 1:1 : citations séparées après streaming
      const citationMessage = new MessageActivity();
      citations.forEach(({ number, citation }) => {
        citationMessage.addCitation(number, citation);
      });
      stream.emit(citationMessage);
    }
  }
});
```

### Principe de Fonctionnement

1. **Callback `onChunk`** : Appelé par le LLM pour chaque token généré
2. **`stream.emit(chunk)`** : Envoie le chunk progressivement au client Teams
3. **Distinction 1:1 vs Groupe** :
   - **Conversations 1:1** : Streaming supporté nativement
   - **Groupes/Channels** : Streaming non supporté, message complet envoyé

### Avantages de cette Approche

1. **Conforme à l'API officielle** : Utilise les méthodes documentées par Microsoft
2. **Expérience utilisateur fluide** : Le texte apparaît progressivement (effet "typewriter")
3. **Feedback immédiat** : L'utilisateur voit que le système répond
4. **Gestion correcte des citations** : Les citations sont ajoutées après le streaming
5. **Compatible avec les deux modes** : 1:1 et groupes gérés différemment

## Conséquences

### Positives

✅ **Expérience utilisateur améliorée**
- Réponses qui apparaissent progressivement
- Feedback visuel immédiat
- Perception de rapidité accrue

✅ **Conformité technique**
- Utilise l'API officielle Teams.ai v2
- Suit les bonnes pratiques Microsoft
- Code maintenable et documenté

✅ **Gestion des citations préservée**
- Citations ajoutées correctement après le streaming
- Formatage markdown et références maintenues

### Négatives

⚠️ **Limitation des groupes/channels**
- Streaming non supporté dans les conversations de groupe
- Fallback vers message complet nécessaire

⚠️ **Complexité accrue**
- Logique conditionnelle pour 1:1 vs groupes
- Gestion des citations en deux étapes

### Risques et Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Chunks trop petits (1 token) | Trop de mises à jour réseau | Accepté - Teams gère l'optimisation |
| Erreur pendant streaming | Message partiel | Bloc try-catch global maintenu |
| Citations manquantes | Perte d'information | Envoi séparé après streaming |

## Références

- [Microsoft Teams AI Library - Streaming Chat Responses](https://learn.microsoft.com/en-us/microsoftteams/platform/teams-ai-library/in-depth-guides/ai/chat?pivots=typescript#streaming-chat-responses)
- [Microsoft Teams SDK - Stream bot messages](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/streaming-ux)
- Teams.ai v2 Package: `@microsoft/teams.ai`
- Teams.apps v2 Package: `@microsoft/teams.apps`

## Notes Techniques

### Packages Impliqués

```json
{
  "@microsoft/teams.ai": "^2.0.0",
  "@microsoft/teams.apps": "^2.0.0",
  "@microsoft/teams.api": "^2.0.0",
  "@microsoft/teams.openai": "^2.0.0"
}
```

### Fichiers Modifiés

- `src/app/app.js` : Ajout du streaming avec `onChunk` callback

### Configuration LLM

Le streaming fonctionne avec les paramètres LLM existants :
```javascript
{
  temperature: 0.3,
  topP: 0.95,
  presencePenalty: 0.3,
  frequencyPenalty: 0.2,
  maxTokens: 2000
}
```

Aucune modification des paramètres LLM n'est nécessaire pour activer le streaming.

## Alternatives Considérées

### Alternative 1 : Accumulation avec Seuil de Caractères

**Description** : Accumuler les chunks et envoyer des mises à jour tous les N caractères

```javascript
let buffer = '';
onChunk: (chunk) => {
  buffer += chunk;
  if (buffer.length >= 50) {
    stream.emit(buffer);
    buffer = '';
  }
}
```

**Rejet** : Complexité inutile, Teams optimise déjà l'affichage

### Alternative 2 : Désactivation du Streaming

**Description** : Conserver le comportement par défaut sans streaming

**Rejet** : Expérience utilisateur médiocre pour les réponses longues

### Alternative 3 : Indicateur de Chargement

**Description** : Afficher "Génération en cours..." pendant l'attente

**Rejet** : Moins informatif que le streaming réel du contenu

## Historique

- **2025-11-18** : Création de l'ADR
- **2025-11-18** : Implémentation et validation du streaming
- **2025-11-18** : Tests réussis en conversation 1:1

## Validation

✅ Streaming fonctionne en conversation 1:1  
✅ Citations ajoutées correctement après streaming  
✅ Gestion des erreurs maintenue  
✅ Conforme à la documentation Microsoft  
✅ Code testé et validé

---

**Auteur** : Michel Héon  
**Date** : 2025-11-18  
**Version** : 1.0
