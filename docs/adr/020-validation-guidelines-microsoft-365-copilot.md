# ADR 020: Guidelines de Validation Microsoft 365 Copilot

## Statut

✅ Accepté

## Date

2025-12-12

## Contexte

Lors du développement et du déploiement de l'agent Légis Québec comme custom engine agent pour Microsoft 365 Copilot, nous devons nous conformer aux **Validation Guidelines for Agents** de Microsoft. Ces directives sont essentielles pour :

- Assurer la compatibilité avec Microsoft 365 Copilot
- Passer la validation Microsoft Store (si publication publique)
- Offrir une expérience utilisateur cohérente et professionnelle
- Respecter les standards de sécurité et de conformité Microsoft

Sans respect de ces guidelines, l'agent risque :

- De ne pas fonctionner correctement dans M365 Copilot
- D'être rejeté lors de la validation Microsoft Store
- D'offrir une expérience utilisateur incohérente
- De ne pas respecter les exigences de sécurité

**Référence officielle** : [Review Copilot Validation Guidelines](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/prepare/review-copilot-validation-guidelines?context=%2Fmicrosoft-365-copilot%2Fextensibility%2Fcontext)

## Décision

Adopter et implémenter les **Microsoft 365 Copilot Validation Guidelines** comme standard obligatoire pour le développement de l'agent Légis Québec. Les exigences critiques (**Must Fix**) doivent être implémentées immédiatement, les recommandations (**Good-to-fix**) lors de la prochaine itération.

### Exigences Critiques (Must Fix)

#### 1. Description et Manifest

**Description (`manifest.json`)**

- ❌ **INTERDIT** : URLs, emojis, caractères cachés dans les descriptions
- ❌ **INTERDIT** : Phrases instructionnelles ("if the user says X", "ignore", "delete")
- ❌ **INTERDIT** : Erreurs grammaticales et de ponctuation
- ✅ **REQUIS** : Descriptions claires et concises
- ✅ **REQUIS** : Version manifest ≥ 1.13

**Implémentation actuelle** :
```json
{
  "manifestVersion": "1.24",
  "description": {
    "short": "Assistant juridique spécialisé dans les lois du Québec",
    "full": "Légis Québec est un assistant juridique intelligent..."
  }
}
```

#### 2. Prompt Starters (Conversation Starters)

**Exigences obligatoires** :

- ✅ **Minimum 3, maximum 6** prompt starters pour custom engine agents
- ✅ Tous les prompts doivent être **fonctionnels** et retourner des réponses
- ✅ Chaque prompt ≤ 128 caractères
- ✅ Prompts pertinents aux capacités de l'agent

**Implémentation** :
```json
{
  "commandLists": [{
    "scopes": ["copilot", "personal"],
    "commands": [
      {
        "title": "Comment peux-tu m'aider?",
        "description": "Découvrir les fonctionnalités de Légis Québec"
      },
      {
        "title": "Quelles lois sont disponibles?",
        "description": "Liste des lois du Québec disponibles dans la base"
      },
      {
        "title": "Explique-moi cette loi",
        "description": "Explication détaillée d'une loi spécifique"
      },
      {
        "title": "Mes droits au travail",
        "description": "Information sur les normes du travail au Québec"
      },
      {
        "title": "Protection du consommateur",
        "description": "Droits et recours des consommateurs"
      }
    ]
  }]
}
```

#### 3. Bot Requirements pour Custom Engine Agents

**Composants UX obligatoires** :

✅ **AI Label** : Identifier le contenu généré par IA
- Implémenté via message d'avertissement : "Cette réponse est générée par l'IA..."

✅ **Feedback Buttons** : Permettre les retours positifs/négatifs
- À implémenter dans les Adaptive Cards

✅ **Citations** : Références aux sources
- Implémenté via `formatResponseWithCitations()` dans `agent.js`

✅ **Streaming Responses** : Réponses progressives
- Supporté par le SDK, à implémenter

✅ **Prompt Starters ou Welcome Message**
- Implémenté via prompt starters + carte de bienvenue

✅ **Suggestions contextuelles** : Minimum 2 suggestions par message
- À implémenter via suggested actions

#### 4. Compatibilité

**Canaux Microsoft 365** :

✅ **Microsoft 365 Channel** : Ajouter le canal M365 au bot
- Requis pour fonctionner dans Outlook et autres apps M365

✅ **SSO (Single Sign-On)** : Configurer les client IDs autorisés

Client IDs à ajouter dans Azure AD :
```
- Word, PowerPoint, Excel (web/desktop): 3068386c-7a16-4f6a-a664-043b6b232816
- Teams desktop/mobile: 1fec8e78-bce4-4aaf-ab1b-5451cc387264
- Teams web: 5e3ce6c0-2b1f-4285-8d4b-75ee78787346
- Microsoft 365 web: 4765445b-32c6-49b0-83e6-1d93765276ca
- Microsoft 365 desktop: 0ec893e0-5785-4de6-99da-4ed124e5296c
- Copilot.cloud.microsoft: (nouveau domaine)
```

✅ **Content Security Policy (CSP)** : Configurer les frame-ancestors

Frame-ancestors requis :
```
- *.cloud.microsoft (NOUVEAU)
- *.microsoft365.com
- *.office.com
- copilot.microsoft.com
- edgeservices.bing.com
- outlook.office.com
```

#### 5. Exigences Techniques

| Critère | Exigence | Implémentation |
|---------|----------|----------------|
| Version manifest | ≥ 1.13 | ✅ 1.24 |
| Temps de réponse | <9s (99%), <5s (75%), <2s (50%) | ⚠️ À mesurer |
| Fiabilité | 99.9% disponibilité | ⚠️ À mesurer |
| Zero regressions | Fonctionnalités existantes intactes | ✅ Tests requis |

#### 6. Adaptive Card Response

**Exigences pour les cartes** :

✅ **Preview + Content** : Card doit inclure preview et contenu
✅ **Minimum 2 champs de données** : Au-delà du logo/titre
✅ **Responsive** : Desktop, web, mobile (iOS/Android)
✅ **Metadata URL** : Permettre copie entre hubs

**Implémentation** : `welcome-card.json`
```json
{
  "type": "AdaptiveCard",
  "version": "1.5",
  "body": [...],
  "metadata": {
    "webUrl": "https://chatbottez-legis-qc.cotechnoe.net"
  }
}
```

#### 7. Gestion des Erreurs

✅ **Graceful Error Handling** obligatoire pour :
- Paramètres de recherche incorrects
- Langage inapproprié ou abus

**Implémentation** : `contentModeration.js`
```javascript
export function moderateContent(userText) {
  // Détection contenu inapproprié
  // Gestion erreurs paramétriques
}
```

#### 8. Sécurité (Message Extensions, OpenAPI, MCP)

✅ **HTTPS/TLS 1.2+** : Tous les appels serveur
✅ **Pas de redirections** : URLs directes uniquement
✅ **Domaine vérifié** : Même domaine/sous-domaine que le développeur

#### 9. Actions avec Conséquences

Pour les opérations modifiant des données externes :

✅ **User Disclosure** : Informer l'utilisateur de l'action
✅ **User Confirmation** : Demander confirmation avant exécution
✅ **Confirmation Prompt** : Langage clair et explicite
✅ **Flag `isConsequential: true`** pour Create/Update/Delete

#### 10. Screenshots

**Exigences obligatoires** :

✅ **Au moins 1 screenshot M365 Copilot** : Apps avec fonctionnalité agent doivent inclure minimum un screenshot montrant l'agent dans Microsoft 365 Copilot
✅ **Teams Store Guidelines applicables** : Respecter les directives screenshots pour apps M365

**Implémentation** :
- Capturer screenshots de l'agent dans M365 Copilot
- Ajouter au package de soumission Microsoft Store

#### 11. Agent Name Consistency

**Pour declarative agents** :

✅ **Noms identiques** dans :
- `name` dans manifest.json
- `name` dans declarative agent JSON file
- `name_for_human` dans plugin JSON files

**Implémentation actuelle** :
```json
// manifest.json
{
  "name": {
    "short": "Légis Québec",
    "full": "Légis Québec - Assistant Juridique"
  }
}
```

#### 12. Action & Knowledge Source

**Exigences pour agents** :

✅ **Nodes actions définis** : Tous les agents doivent avoir use case principal via API actions
✅ **Multi-tenant access** : Laisser nodes vides pour accès global (email, Teams messages, ODSP, Graph connectors)
✅ **Capabilities restreintes** : Dataverse, file embedding, sensitivity label, scenario model = LOB seulement
✅ **MCP servers** : Flags `enable_dynamic_discovery` et `enable_dynamic_client_registration` = **false** (static discovery uniquement)

**Pour custom action `insertImage`** :
- Titre bouton doit indiquer qu'une image sera insérée
- Image correcte insérée au clic
- Fallback = "Drop" pour compatibilité tous clients
- Support insertion toutes images dans Adaptive Card

#### 13. Bot Scopes Consistency

**Exigences de cohérence** :

✅ **Scopes identiques** : `bot.scopes` et `bot.commandList.scopes` doivent correspondre
✅ **Scope Copilot requis** : Custom engine agents doivent inclure `copilot` dans les scopes

**Implémentation** :
```json
{
  "bots": [{
    "scopes": ["copilot", "personal"],
    "commandLists": [{
      "scopes": ["copilot", "personal"],
      "commands": [...]
    }]
  }]
}
```

#### 14. Agent Response Requirements

**Exigences pour réponses** :

✅ **Titre ET sous-titre** : Tous les search results doivent inclure titre + sous-titre (pour citations)
✅ **Prompts correspondants** : Au moins 1 prompt dans sample prompts/conversation starters/instructions/test notes pour chaque fonction
✅ **Confirmation d'action** : Doit inclure détails action, way forward, source link OU tracking ID
✅ **Tracking ID** : Si fourni, agent doit retourner détails de l'action exécutée
✅ **Messages non-répétitifs** : Éviter messages redondants si multiples envois

**Implémentation** :
```javascript
// Réponses avec titre/sous-titre pour citations
{
  title: "Loi sur la protection du consommateur",
  subtitle: "Article 272 - Recours",
  content: "..."
}
```

#### 15. Duplicate Agents Prevention

**Exigences anti-duplication** :

✅ **Fonctionnalité différente** : Multiples agents pour même produit OK si fonctions distinctes
✅ **Justification claire** : Agent séparé du main app doit avoir justification
✅ **Nom/description uniques** : Nom, short/long description doivent différer d'apps existantes
✅ **Value proposition claire** : Descriptions doivent communiquer différenciation

#### 16. Teams JavaScript SDK Version

**Exigence technique** :

✅ **Teams JS ≥ 2.22.0** : Mise à jour obligatoire si version antérieure

**Vérification** :
```bash
npm list @microsoft/teams-js
# Doit retourner ≥ 2.22.0
```

**Mise à jour si nécessaire** :
```bash
npm install @microsoft/teams-js@latest
```

### Recommandations (Good-to-fix)

⚠️ **Sensitivity Label** : Indiquer la confidentialité des messages
⚠️ **Éviter bulk operations** : Pas de suppressions massives
⚠️ **Description concise** : Éviter le langage marketing excessif
⚠️ **Pas de superlatifs** : Éviter "#1", "amazing", "best"
⚠️ **Reference in M365 Copilot** : Permettre aux utilisateurs de référencer le custom engine agent dans M365 Copilot
⚠️ **Handoff chat experience** : Support du transfert de conversation dans Teams

## Conséquences

### Positives ✅

1. **Compatibilité garantie** : L'agent fonctionnera sur tous les clients M365
2. **Expérience utilisateur professionnelle** : UX cohérente avec standards Microsoft
3. **Éligibilité Microsoft Store** : Possibilité de publication publique
4. **Sécurité renforcée** : Conformité aux exigences de sécurité Microsoft
5. **Maintenance facilitée** : Alignement avec les évolutions de la plateforme
6. **Documentation claire** : Guidelines précises pour l'équipe de développement

### Négatives ⚠️

1. **Complexité accrue** : Nombreuses exigences à implémenter
2. **Effort de développement** : Temps nécessaire pour conformité complète
3. **Tests étendus** : Validation sur multiples clients (Teams, Copilot, Outlook, etc.)
4. **Configuration Azure** : Multiples client IDs SSO à configurer
5. **Monitoring requis** : Mesure des performances (temps de réponse, fiabilité)
6. **Maintenance continue** : Guidelines peuvent évoluer

### Mitigations 🔧

1. **Implémentation progressive** :
   - Phase 1 : Must Fix (critiques)
   - Phase 2 : Good-to-fix (recommandations)

2. **Tests automatisés** :
   - Validation manifest automatique
   - Tests de performance
   - Tests sur multiples clients

3. **Checklist de validation** :
   - Document de vérification pré-déploiement
   - Revue de code focalisée sur guidelines

4. **Monitoring proactif** :
   - Application Insights pour temps de réponse
   - Alertes sur disponibilité <99.9%

## Alternatives Considérées

### Alternative 1: Ignorer les guidelines non-critiques

**Description** : Implémenter uniquement le minimum pour que l'agent fonctionne

**Rejetée parce que** :
- Risque de rejet lors de validation Microsoft Store
- Expérience utilisateur dégradée
- Incompatibilités futures possibles
- Non-conformité professionnelle

### Alternative 2: Attendre la publication pour se conformer

**Description** : Développer sans guidelines, corriger lors de la soumission

**Rejetée parce que** :
- Refactoring coûteux et risqué
- Délais de publication allongés
- Risque de rejet multiple
- Mauvaise pratique de développement

### Alternative 3: Conformité partielle (Must Fix uniquement)

**Description** : Implémenter uniquement les exigences critiques, ignorer recommandations

**Retenue partiellement** :
- ✅ Approche pragmatique et économique
- ✅ Conformité minimale assurée
- ⚠️ Planifier les Good-to-fix pour itérations futures

## Implémentation

### Phase 1: Exigences Critiques (Must Fix) ✅ COMPLÉTÉ

- [x] Ajouter 5 prompt starters dans manifest
- [x] Créer welcome card adaptive (ADR-014)
- [x] Implémenter gestionnaire `installationUpdate`
- [x] Valider manifest.json (version 1.24)
- [x] Retirer emojis des descriptions (ADR-016)
- [x] Implémenter citations dans réponses
- [x] Ajouter avertissement IA dans réponses
- [x] Vérifier bot.scopes = bot.commandList.scopes
- [x] Vérifier Teams JS version ≥ 2.22.0

### Phase 2: Configuration Azure 🔄 EN COURS

- [ ] Ajouter canal Microsoft 365 au bot Azure
- [ ] Configurer SSO avec tous les client IDs
- [ ] Configurer CSP headers avec frame-ancestors
- [ ] Tester sur Word, PowerPoint, Excel
- [ ] Tester sur Outlook desktop/web/mobile
- [ ] Créer screenshots M365 Copilot pour Microsoft Store

### Phase 3: UX Avancée 📋 PLANIFIÉ

- [ ] Implémenter feedback buttons dans réponses
- [ ] Ajouter streaming responses
- [ ] Implémenter 2+ suggested actions contextuelles
- [ ] Ajouter sensitivity labels (optionnel)
- [ ] Créer tests automatisés de validation
- [ ] Assurer titre + sous-titre dans search results
- [ ] Implémenter tracking ID pour actions
- [ ] Support handoff chat experience Teams (optionnel)

### Phase 4: Performance & Monitoring 📋 PLANIFIÉ

- [ ] Mesurer temps de réponse (99%, 75%, 50%)
- [ ] Mesurer taux de disponibilité (objectif 99.9%)
- [ ] Configurer alertes Application Insights
- [ ] Créer dashboard de monitoring
- [ ] Tests de charge et performance

## Références

- [Microsoft 365 Copilot Validation Guidelines](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/prepare/review-copilot-validation-guidelines)
- [Prompt Suggestions Guide](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/prompt-suggestions)
- [Custom Engine Agent UX Features](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/ux-custom-engine-agent)
- [Bot Messages with AI Content](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bot-messages-ai-generated-content)
- ADR-014: Message de Bienvenue avec Adaptive Card
- ADR-016: Utilisation des Emojis et Icônes

## Notes de Mise en Œuvre

### Fichiers Modifiés

1. **`appPackage/manifest.json`** : Ajout de 5 prompt starters
2. **`appPackage/welcome-card.json`** : Carte adaptative de bienvenue
3. **`src/agent.js`** : Gestionnaire `installationUpdate` et `conversationUpdate`
4. **`src/app/contentModeration.js`** : Validation contenu et messages
5. **`docs/adr/020-validation-guidelines-microsoft-365-copilot.md`** : Ce document

### Checklist de Validation Pré-Déploiement

Avant chaque déploiement, valider :

**Description & Manifest**
- [ ] Manifest version ≥ 1.13
- [ ] 3-6 prompt starters fonctionnels
- [ ] Pas d'emojis dans descriptions/prompts
- [ ] Pas de langage instructionnel
- [ ] Pas d'erreurs grammaticales
- [ ] Pas d'URLs dans descriptions

**Bot & UX**
- [ ] Welcome message OU prompt starters présents
- [ ] bot.scopes = bot.commandList.scopes
- [ ] Scope "copilot" inclus
- [ ] Citations implémentées dans réponses
- [ ] Avertissement IA visible
- [ ] Titre + sous-titre dans search results

**Compatibilité & Performance**
- [ ] Teams JS version ≥ 2.22.0
- [ ] Tests sur Teams desktop/web
- [ ] Tests sur Microsoft 365 Copilot
- [ ] Temps réponse <9s (99%), <5s (75%), <2s (50%)
- [ ] Graceful error handling fonctionnel

**Azure & Sécurité**
- [ ] Canal Microsoft 365 configuré
- [ ] SSO client IDs configurés (si applicable)
- [ ] CSP headers configurés (si applicable)
- [ ] HTTPS/TLS 1.2+ pour tous appels
- [ ] Pas de redirections URL

**Screenshots & Documentation**
- [ ] Au moins 1 screenshot M365 Copilot
- [ ] Nom agent cohérent (manifest/declarative/plugin)
- [ ] Actions API définies
- [ ] MCP dynamic discovery = false (si applicable)

### Commandes de Validation

```bash
# Valider le manifest
cat appPackage/manifest.json | jq '.manifestVersion'

# Compter les prompt starters
cat appPackage/manifest.json | jq '.bots[0].commandLists[0].commands | length'

# Vérifier absence d'emojis dans descriptions
grep -E '[\x{1F600}-\x{1F64F}]' appPackage/manifest.json

# Vérifier cohérence des scopes
cat appPackage/manifest.json | jq '.bots[0].scopes, .bots[0].commandLists[0].scopes'

# Vérifier version Teams JS
npm list @microsoft/teams-js

# Lancer les tests
npm test
```

## Historique des Modifications

| Date | Version | Changements |
|------|---------|-------------|
| 2025-12-12 | 1.0 | Création initiale de l'ADR |
| 2025-12-12 | 1.1 | Ajout section implémentation et checklist |
| 2025-12-12 | 1.2 | Ajout 8 exigences manquantes (screenshots, agent name, actions, responses, duplicates, scopes, Teams JS, reference) |

---

**Auteur** : Équipe Légis Québec  
**Dernière révision** : 2025-12-12  
**Prochaine révision** : 2025-12-26
