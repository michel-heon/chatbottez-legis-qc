# ADR 017: Message de Bienvenue avec Adaptive Card et Disclaimer IA

## Statut

✅ Accepté

## Date

2025-11-26

## Contexte

L'ADR-xxx (Validation Teams Store) exige un message de bienvenue conforme aux guidelines Microsoft :
- **Welcome message obligatoire** lors du premier contact avec le bot
- **Disclaimer IA visible** pour respecter les politiques AI-generated content
- **Mécanisme de confirmation** (bouton "J'ai compris")
- **Liens vers ressources** (politique confidentialité, documentation)

L'application avait un welcome message basique avec des tuiles cliquables, mais **manquait le disclaimer IA visible** requis par ADR-xxx.

---

## Décision

Implémentation de l'**Option 2 : Adaptive Card Interactive avec Disclaimer** pour le message de bienvenue.

### Architecture

#### **1. Déclencheur : conversationUpdate (membersAdded)**

Le message s'affiche quand le bot est ajouté à une conversation :

```javascript
app.on('conversationUpdate', async ({ send, activity, context }) => {
  const membersAdded = activity.membersAdded || [];
  const botId = activity.recipient?.id;
  const botWasAdded = membersAdded.some(member => member.id === botId);
  
  if (botWasAdded) {
    // Envoyer welcome card avec disclaimer
  }
});
```

#### **2. Structure de l'Adaptive Card**

**Sections principales** :
1. **Header** (Container emphasis) :
   - Logo Québec
   - Titre "Bienvenue dans Légis Québec"
   - Version de l'application

2. **Description** :
   - Texte explicatif du rôle de l'assistant

3. **⚠️ Disclaimer IA** (Container warning - CRITIQUE ADR-xxx) :
   - Titre en gras avec emoji warning
   - Explication claire de l'utilisation d'Azure OpenAI GPT-4.1
   - FactSet avec 3 règles essentielles :
     * ✓ Vérifier les sources citées [#]
     * ✓ Consulter le Service de la recherche en cas de doute
     * ✓ Les réponses sont génératives, pas officielles

4. **Commandes disponibles** :
   - Liste des commandes principales (/help, /eligibilite, /financement, /dossier)
   - Invitation à poser des questions en français

5. **Actions (boutons)** :
   - ✅ "J'ai compris" → Confirmation disclaimer
   - 📖 "Afficher /help" → Lance commande /help
   - 🔗 "Politique de confidentialité" → Lien externe UQAM

#### **3. Handler de Confirmation**

```javascript
app.on('adaptiveCard/action', async ({ send, activity }) => {
  const action = activity.value?.action;
  
  if (action === 'acknowledged_disclaimer') {
    logger.info('[Welcome] Utilisateur a confirmé avoir lu le disclaimer IA (ADR-xxx)');
    await send('✅ Parfait ! Je suis prêt à répondre à vos questions...');
  }
});
```

---

## Conséquences

### ✅ Positives

1. **Conformité ADR-xxx** : Disclaimer IA très visible (container warning)
2. **Traçabilité** : Logger quand utilisateur confirme avoir lu le disclaimer
3. **UX professionnelle** : Adaptive Card visuellement attrayant
4. **Mobile-friendly** : Adaptive Cards bien supportées iOS/Android
5. **Interactif** : 3 actions immédiatement disponibles
6. **Maintenance** : Card structure claire et facile à modifier

### ⚠️ Négatives

1. **Taille du code** : ~100 lignes pour la card (vs 10 lignes texte simple)
2. **Tests requis** : Doit tester sur desktop + mobile (iOS/Android)
3. **Complexité** : Nécessite handler séparé pour `adaptiveCard/action`

### 📊 Métriques

- **Temps de développement** : 1-2h (conforme estimation Option 2)
- **Lignes de code** : ~120 lignes (welcome card + handler)
- **Complexité** : Moyenne (JSON Adaptive Card + event handler)

---

## Alternatives Considérées

### Alternative 1 : Message Texte Simple ❌
**Rejeté** : Disclaimer moins visible, pas de confirmation utilisateur, UX basique.

### Alternative 2 : Adaptive Card Interactive ✅
**ACCEPTÉ** : Équilibre optimal entre conformité, UX et effort de développement.

### Alternative 3 : Tour Guidé Multi-Étapes ❌
**Rejeté** : Sur-engineering pour besoin actuel, complexité élevée (3-4h dev).

---

## Détails Techniques

### **Champs Adaptive Card v1.5**

| Champ | Type | Objectif |
|-------|------|----------|
| `Container.style: "emphasis"` | Style | Header visuel distinct |
| `Container.style: "warning"` | Style | **Disclaimer visible en orange** |
| `FactSet` | Layout | Liste compacte des règles essentielles |
| `Action.Submit` | Action | Confirmation disclaimer + commandes |
| `Action.OpenUrl` | Action | Lien externe politique confidentialité |

### **Event Handlers**

1. **conversationUpdate (membersAdded)** : Détecte ajout du bot
2. **adaptiveCard/action** : Gère clics sur boutons card

### **Logging**

```javascript
logger.info('[Welcome] Envoi de la carte de bienvenue avec disclaimer IA (ADR-xxx)');
logger.info('[Welcome] Utilisateur a confirmé avoir lu le disclaimer IA (ADR-xxx)');
```

---

## Validation ADR-xxx

| Exigence | Status | Implémentation |
|----------|--------|----------------|
| **Welcome message au premier contact** | ✅ | conversationUpdate handler |
| **Disclaimer IA visible** | ✅ | Container warning avec texte explicite |
| **Confirmation utilisateur** | ✅ | Bouton "J'ai compris" + logger |
| **Liens politique confidentialité** | ✅ | Action.OpenUrl vers quebec.ca |
| **Commandes suggérées** | ✅ | FactSet + bouton "/help" |
| **Mobile-friendly** | ✅ | Adaptive Card v1.5 |

---

## Tests Requis

### Tests Fonctionnels

- [ ] **Desktop (Windows/macOS)** :
  - Bot ajouté → Welcome card s'affiche
  - Clic "J'ai compris" → Message de confirmation
  - Clic "Afficher /help" → Commande /help lancée
  - Clic "Politique confidentialité" → Lien ouvre navigateur

- [ ] **Mobile (iOS/Android)** :
  - Welcome card s'affiche correctement
  - Disclaimer warning bien visible
  - Tous les boutons fonctionnels
  - Pas de dead-end ou erreur

### Tests Visuels

- [ ] Logo Québec affiche correctement
- [ ] Container warning orange visible
- [ ] FactSet lisible (3 règles)
- [ ] Boutons bien alignés

### Tests de Conformité

- [ ] Disclaimer conforme ADR-xxx
- [ ] Texte français correct
- [ ] Liens HTTPS valides

---

## Plan de Déploiement

### Phase 1 : Tests Locaux
1. Lancer `npm run dev:teamsfx`
2. Ouvrir Teams Desktop
3. Ajouter bot à conversation → Vérifier welcome card
4. Tester tous les boutons

### Phase 2 : Tests Mobile
1. Déployer en environnement `sandbox`
2. Tester sur iOS (iPhone/iPad)
3. Tester sur Android
4. Corriger issues si nécessaire

### Phase 3 : Validation Finale
1. Revue UX avec équipe
2. Validation textes français
3. Merge vers `dev`
4. Tag version `v2.0.8-alpha.4-welcome-card`

---

## Références

- [ADR-xxx: Validation Teams Store](./010-validation-teams-store-marketplace.md)
- [ADR-005: Divulgation Obligatoire IA](./005-divulgation-obligatoire-ia.md)
- [Teams Store Validation Guidelines - Bots](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/prepare/teams-store-validation-guidelines#bots)
- [Adaptive Cards v1.5 Schema](https://adaptivecards.io/explorer/)
- [Microsoft AI-Generated Content Policy](https://learn.microsoft.com/en-us/legal/marketplace/certification-policies#1-apps-with-artificial-intelligenceai-generated-content-must-meet-below-requirements)

---

## Évolutions Futures

### Court Terme (v2.1.x)
- Ajouter métriques : combien d'utilisateurs cliquent "J'ai compris"
- A/B testing : mesurer engagement après welcome message

### Moyen Terme (v2.2.x)
- Personnalisation selon profil utilisateur (admin vs chercheur)
- Détection langue préférée (français/anglais)

### Long Terme (v3.x)
- Tour guidé multi-étapes (Option 3) si feedback utilisateurs positif
- Onboarding contextuel selon canal (personal/team/groupChat)

---

**Auteur** : Michel Héon Ph.D. (UQAM/VRRCD)  
**Réviseurs** : À compléter après revue équipe  
**Dernière mise à jour** : 2025-11-26
