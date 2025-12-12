# 📚 Guide des 6 Commandes Juridiques Personnalisées

## 🎯 Vue d'ensemble

Les **6 commandes juridiques personnalisées** sont des contextes spécialisés qui optimisent les réponses de Légis Québec pour des domaines juridiques spécifiques. Lorsqu'une commande est détectée, l'agent active des instructions enrichies qui guident la recherche RAG et la génération de réponse.

## ⚖️ Les 6 Commandes

### 1. Droits au Travail 👷

**Déclencheurs:**
- "Mes droits au travail"
- "Normes du travail"
- "CNESST"
- "Congédiement"
- "Salaire minimum"

**Domaines couverts:**
- Loi sur les normes du travail
- Code du travail du Québec
- Santé et sécurité au travail
- Discrimination au travail
- Syndicalisation

**Exemples de questions:**
- "Quels sont mes droits en cas de congédiement?"
- "Combien d'heures supplémentaires puis-je faire?"
- "Comment porter plainte à la CNESST?"

---

### 2. Protection du Consommateur 🛒

**Déclencheurs:**
- "Protection du consommateur"
- "Droits des consommateurs"
- "Garantie légale"
- "OPC"
- "Contrat de consommation"

**Domaines couverts:**
- Loi sur la protection du consommateur
- Garanties légales
- Pratiques commerciales interdites
- Annulation de contrat
- Recours

**Exemples de questions:**
- "Puis-je annuler un contrat signé à domicile?"
- "Qu'est-ce que la garantie légale?"
- "Comment porter plainte à l'OPC?"

---

### 3. Protection des Données Personnelles 🔒

**Déclencheurs:**
- "Protéger mes données personnelles"
- "Vie privée"
- "Loi 25"
- "Confidentialité"
- "CAI"

**Domaines couverts:**
- Loi 25 (protection des renseignements personnels)
- Droit d'accès et rectification
- Consentement
- Incidents de confidentialité
- Commission d'accès à l'information

**Exemples de questions:**
- "Comment retirer mon consentement?"
- "Quels sont mes droits sur mes données personnelles?"
- "Comment signaler une fuite de données?"

---

### 4. Rédiger une Mise en Demeure ✍️

**Déclencheurs:**
- "Rédiger une mise en demeure"
- "Mise en demeure"
- "Lettre de mise en demeure"
- "Comment écrire une mise en demeure"

**Domaines couverts:**
- Structure et contenu obligatoire
- Fondements juridiques
- Délais et modalités
- Conséquences du non-respect
- Exemples et modèles

**Exemples de questions:**
- "Quels éléments doivent figurer dans une mise en demeure?"
- "Quel délai accorder dans une mise en demeure?"
- "Comment envoyer une mise en demeure?"

---

### 5. Contester une Décision 📋

**Déclencheurs:**
- "Contester une décision"
- "Faire appel"
- "Révision de décision"
- "Contrôle judiciaire"

**Domaines couverts:**
- Révision administrative
- Appel devant tribunaux administratifs
- Contrôle judiciaire
- Délais de contestation
- Tribunaux compétents (TAQ, TAT, etc.)

**Exemples de questions:**
- "Comment contester une décision de la CNESST?"
- "Quel est le délai pour faire appel?"
- "Où déposer un appel au TAQ?"

---

### 6. Déposer une Plainte 📢

**Déclencheurs:**
- "Déposer une plainte"
- "Porter plainte"
- "Comment faire une plainte"
- "Formulaire de plainte"

**Domaines couverts:**
- Organismes compétents (CNESST, OPC, CAI, etc.)
- Procédures de dépôt
- Délais de plainte
- Documents requis
- Suivi de la plainte

**Exemples de questions:**
- "Où déposer une plainte pour discrimination?"
- "Quel est le délai pour porter plainte à la CNESST?"
- "Comment suivre ma plainte?"

---

## 🔧 Fonctionnement Technique

### Architecture

```javascript
// 1. Détection dans agent.js
const legalCommand = detectLegalCommand(userText);

// 2. Si détecté, envoyer message de bienvenue spécialisé
await context.sendActivity(legalCommand.welcomeMessage);

// 3. Ajouter instructions enrichies pour RAG + OpenAI
enhancedInstructions += legalCommand.enhancedInstructions;
```

### Flux de traitement

```
User Message
    ↓
detectLegalCommand()
    ↓
[Commande détectée?]
    ↓ OUI
    ├── Envoyer welcomeMessage
    ├── Ajouter enhancedInstructions
    └── Continuer avec RAG normal
    ↓ NON
    └── Traitement RAG standard
```

### Fichiers impliqués

- **`src/app/legalCommands.js`** - Définition des 6 commandes
- **`src/agent.js`** - Intégration dans le flow principal
- **`src/app/contentModeration.js`** - Message d'aide mis à jour

---

## 📊 Avantages des Commandes Spécialisées

### 1. Recherche RAG Optimisée
Les instructions enrichies guident Azure AI Search vers les documents les plus pertinents.

### 2. Réponses Plus Détaillées
L'agent sait quels aspects juridiques couvrir pour chaque domaine.

### 3. Meilleure Expérience Utilisateur
Message de bienvenue contextuel qui confirme la compréhension de la requête.

### 4. Respect des Bonnes Pratiques
- ADR-016: Messages sans émojis
- ADR-019: Patterns Microsoft 365 Agents SDK
- ADR-006: Instructions spécialisées pour l'agent

---

## 🧪 Tests Recommandés

### Test 1: Détection des commandes
```
Input: "Mes droits au travail"
Expected: 
- Message de bienvenue "Droits au travail - Légis Québec"
- Réponse couvrant normes, CNESST, etc.
```

### Test 2: Variations de formulation
```
Input: "Comment protéger mes données personnelles?"
Expected: 
- Détection de la commande "Données personnelles"
- Réponse couvrant Loi 25, consentement, CAI
```

### Test 3: Questions de suivi
```
Input: "Rédiger une mise en demeure"
Follow-up: "Quel délai donner?"
Expected:
- Réponse détaillée sur les délais (10-15 jours généralement)
```

### Test 4: Combinaisons
```
Input: "Je veux contester un congédiement"
Expected:
- Possiblement 2 commandes: "Droits au travail" + "Contester décision"
- Réponse couvrant CNESST, délais (45 jours), procédures
```

---

## 📝 Maintenance et Évolution

### Ajouter une nouvelle commande

1. **Créer le handler dans `legalCommands.js`:**
```javascript
export function handleNouvelleCommande() {
  return {
    name: 'nouvelle_commande',
    enhancedInstructions: `...`,
    welcomeMessage: `...`
  };
}
```

2. **Ajouter pattern de détection:**
```javascript
{
  patterns: [/\bnouvelle commande\b/i],
  handler: handleNouvelleCommande
}
```

3. **Mettre à jour message d'aide dans `contentModeration.js`**

4. **Documenter dans ce fichier**

---

## 🔗 Références

- [Issue #17 - Migration Custom Engine Agent](https://github.com/michel-heon/chatbottez-legis-qc/issues/17)
- [Issue #18 - Phase 4 Observabilité](https://github.com/michel-heon/chatbottez-legis-qc/issues/18)
- [ADR-006 - Bonnes pratiques instructions agent](../adr/006-bonnes-pratiques-instructions-agent.md)
- [ADR-016 - Utilisation émojis](../adr/016-utilisation-emojis-icones-documentation.md)
- [ADR-019 - Microsoft 365 Agents Toolkit](../adr/019-microsoft-365-agents-toolkit-bonnes-pratiques.md)

---

**Date de création:** 12 décembre 2025  
**Version:** 4.0.0-beta.1  
**Auteur:** Michel Héon  
**Branch:** michel-heon/template-engine-agent-base
