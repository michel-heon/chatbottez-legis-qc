# ADR 018: Bonnes Pratiques pour Instructions d'Agent Microsoft 365

## Statut

✅ Accepté

## Date

2025-11-26

## Contexte

Le projet Légis Québec utilise un agent conversationnel RAG (Retrieval-Augmented Generation) déployé sur Microsoft Teams pour assister le personnel dans leurs questions concernant les législation québécoises. L'architecture repose sur :

### Architecture Technique

**Stack technologique** :
- **Plateforme** : Microsoft Teams (Desktop, Mobile, Web)
- **Framework** : Teams AI SDK v2.0 (@microsoft/teams-ai)
- **Modèle LLM** : Azure OpenAI GPT-4
- **Recherche** : Azure AI Search (k=50, recherche hybride vectorielle + texte)
- **Orchestration** : Bot Framework + Azure Bot Service

**Configuration LLM actuelle** (`src/app/llmConfig.js`) :
```javascript
temperature: 0.3         // Optimisé pour précision factuelle avec flexibilité contrôlée
topP: 0.95              // Diversité vocabulaire tout en restant cohérent
presencePenalty: 0.3    // Permet génération contenu sans blocage
frequencyPenalty: 0.2   // Évite répétitions
maxTokens: 3000         // Limite par réponse
```

**Évolution configuration LLM** :
- **v1.0 (17 nov 2025)** : temperature 0.9 → Trop créatif, risque hallucinations élevé
- **v1.1.0-alpha.4 (18 nov 2025)** : temperature 0.3 → Optimisation RAG (précision + génération contrôlée)

**Budget tokens** :
- System prompt : ~2000 tokens (v1) → ~2800 tokens (v2 enrichie)
- Contexte RAG : ~6000 tokens (v1) → ~5200 tokens (v2)
- Total contexte modèle : ~8000 tokens (limite Azure OpenAI GPT-4)

### Capacités de l'Agent

Le system prompt (fichier `src/app/instructions.txt`) définit deux modes opératoires :

1. **Réponses factuelles pures** : Groundedness strict, ZÉRO hallucination, citations [#] obligatoires
2. **Génération de contenu utile** : Lettres, courriels, modèles basés sur contexte partiel avec disclaimer

**Contraintes fonctionnelles** :
- Anti-hallucination et groundedness (réponses basées uniquement sur le contexte RAG)
- Système de citations inline avec format `[#]`
- Restriction au périmètre Québec uniquement (ADR-004)
- Format de sortie Markdown avec limite de 150 mots
- Divulgation IA obligatoire (ADR-010)
- ZÉRO émojis dans la documentation (ADR-013)

### Problèmes Identifiés

**1. Architecture : Capacités LLM non explicites dans le prompt**
- ❌ La configuration LLM (temperature 0.3, topP 0.95) permet génération contrôlée
- ❌ Le prompt ne documente pas explicitement cette capacité architecturale
- ❌ Ambiguïté entre "ZÉRO extrapolation" et "génération permise"
- ⚠️ Risque : L'agent peut refuser des demandes légitimes de génération de contenu

**2. Architecture : Budget tokens non optimisé**
- ❌ Verbosité excessive : ~2000 tokens (v1) avec redondances
- ❌ Coût token-prompt élevé → Moins de contexte RAG disponible
- ⚠️ Trade-off : 2000 tokens prompt + 6000 RAG vs. optimal 1200 prompt + 6800 RAG

**3. Architecture : Absence de structure hiérarchique**
- ❌ Toutes les règles semblent avoir la même priorité
- ❌ Pas de distinction entre règles critiques (groundedness) et préférences (ton)
- ⚠️ Impact : Difficile à maintenir, priorisation floue en cas de conflit

**4. Plateforme : Format Teams non optimisé**
- ❌ Les instructions actuelles ne tiennent pas compte des contraintes Teams
- ❌ Markdown non supporté (tableaux, images inline, headers) non documenté
- ❌ Limite 100 KB message non explicite
- ⚠️ Risque : Formatage cassé sur mobile, messages rejetés si >100 KB

**5. Conformité : Manque d'alignement avec best practices Microsoft**
- ❌ Guidelines officielles Microsoft pour agents Teams non suivies
- ❌ Pas de gestion explicite des non-questions ("Hi", "Help", "Thanks")
- ❌ Pas d'auto-vérification structurée
- ⚠️ Risque : Rejet lors de validation Teams Store (marketplace)

### Contraintes Microsoft Teams

Selon la documentation officielle Microsoft ([Format your bot messages](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/format-your-bot-messages), [Designing your Microsoft Teams bot](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/design/bots)) :

**Limitations de formatage** :
- **Taille max des messages** : 100 KB (~80 KB recommandé pour garantir la livraison)
- **Markdown supporté** : Sous-ensemble limité (gras, italique, listes, liens, blockquote, code préformaté)
- **NON supporté** : Tableaux dans les messages texte, images inline, headers dans texte simple
- **Adaptive Cards** : Support complet pour formatage riche (recommandé pour contenu complexe)

**Support multi-plateforme** :
| Style | Texte simple | Rich Cards | Desktop | Mobile |
|-------|--------------|------------|---------|--------|
| Gras `**text**` | ✅ | ❌ | ✅ | ✅ |
| Italique `_text_` | ✅ | ✅ | ✅ | ✅ |
| Listes non ordonnées | ❌ | ✅ | ✅ | ❌ (Mobile) |
| Liens `[text](url)` | ✅ | ✅ | ✅ | ✅ |
| Code préformaté `` `code` `` | ✅ | ✅ | ✅ | ✅ |
| Blockquote `>` | ✅ | ✅ | ✅ | ✅ |

**Best Practices Microsoft** :
1. **Persona claire** : Ton cohérent et documenté
2. **Introduction claire** : Message de bienvenue expliquant les capacités
3. **Reconnaissance non-questions** : Gérer "Hi", "Help", "Thanks", fautes d'orthographe
4. **Multi-turn interactions** : Suggérer prochaines étapes
5. **Contexte adapté** : Comportement différent en 1-on-1 vs channels
6. **Transparence IA** : AI label, citations, feedback buttons, sensitivity label

### Impact du non-respect

- **Tokens gaspillés** : ~500 tokens économisables → Plus de contexte RAG disponible
- **Formatage incohérent** : Markdown non supporté peut casser l'affichage (surtout mobile)
- **Expérience utilisateur dégradée** : Messages trop longs (>100 KB rejetés), formatage cassé
- **Non-conformité Microsoft** : Risque de rejet lors de la validation Teams Store (ADR-010)

## Décision

Nous adoptons les **bonnes pratiques officielles Microsoft pour les agents Teams** et optimisons l'architecture du system prompt selon les principes suivants :

### 1. Architecture : Explicitation des Capacités LLM dans le Prompt

**Principe architectural** : Le system prompt doit documenter explicitement les capacités rendues possibles par la configuration LLM.

**Configuration LLM → Capacités de l'agent** :

```
Temperature 0.3 + TopP 0.95 + Penalties faibles (0.3/0.2)
        ↓
PERMET deux modes opératoires :
1. Réponses factuelles pures (groundedness strict)
2. Génération de contenu utile (lettres, modèles) avec contexte partiel
```

**Ajout au system prompt** :

```markdown
# RÔLE ET MISSION
[...]

**Tes capacités :**
1. Réponses factuelles précises : Informations ancrées dans documents [#]
2. Génération de contenu utile : Lettres, courriels, modèles basés sur procédures
3. Guidage procédural : Accompagnement étape par étape

**Configuration technique :**
- Temperature 0.3 : Optimisé pour précision factuelle avec flexibilité contrôlée
- TopP 0.95 : Diversité linguistique tout en restant cohérent
- Cela te permet de générer du contenu structuré SANS halluciner
```

**Rationale** :
- Explicite le lien configuration LLM ↔ comportement attendu
- Évite refus inappropriés (ex: "Je ne peux pas générer une lettre")
- Documente l'architecture décisionnelle (factuel vs génératif)

### 2. Architecture : Structure Hiérarchisée des Instructions

**Principe architectural** : Priorisation explicite des règles pour résolution de conflits et optimisation budget tokens.

```markdown
# PRIORITÉ 1 - RÈGLES CRITIQUES ⛔ (Non négociables)
1. Groundedness : ZÉRO hallucination pour faits, génération permise pour contenu
2. Périmètre : Québec uniquement (ADR-004)
3. Citations : Format [#] inline obligatoire pour tout fait

# PRIORITÉ 2 - FORMAT TEAMS ⚠️ (Fortement recommandé)
4. Markdown Teams : Sous-ensemble supporté uniquement
5. Taille message : 80 KB max (garantit livraison)
6. Support multi-plateforme : Vérifier Desktop + Mobile

# PRIORITÉ 3 - EXPÉRIENCE UTILISATEUR ✨ (Préférence)
7. Ton professionnel et bienveillant
8. Questions suggérées (2)
9. Reconnaissance non-questions ("Hi", "Help", "Thanks")
```

**Rationale** :
- **Résolution conflits** : En cas de tension (ex: ton vs précision), PRIORITÉ 1 gagne
- **Optimisation tokens** : Sections PRIORITÉ 3 peuvent être condensées si budget serré
- **Maintenabilité** : Structure claire pour évolutions futures

### 2. Format de Sortie Optimisé pour Teams

**Markdown Teams (sous-ensemble supporté)** :
```markdown
# Réponse optimisée Teams
- **Gras** pour points clés [1]
- _Italique_ pour nuances [2]
- Listes à puces (Desktop uniquement)
- `Code` pour commandes/références [3]
- [Liens](https://example.com) pour ressources externes
- > Blockquote pour citations importantes
```

**Limites strictes** :
- **80 KB maximum** (pas 100 KB) pour garantir livraison
- **150 mots maximum** par réponse (concision)
- **20 citations maximum** (lisibilité)

**Éviter** :
- ❌ Tableaux (non supportés dans texte simple)
- ❌ Images inline (non supportées)
- ❌ Headers H1-H3 (non supportés dans texte simple)
- ❌ Listes sur mobile (support limité)

### 3. Gestion Multi-Plateforme

**Formatage Desktop + Mobile** :
```markdown
# Format compatible tous appareils
**Points clés** [1] :
- Bullet 1 (Desktop)
- Bullet 2 (Desktop)

Sur mobile, privilégier :
1. Numérotation (supportée)
2. **Gras** et _italique_ (supportés)
3. Paragraphes courts
```

### 4. Architecture : ZÉRO Hallucination d'URLs

**🚨 RÈGLE CRITIQUE : Ne JAMAIS inventer d'URL**

**Problème identifié** :
- Les LLMs peuvent générer des URLs plausibles mais inexistantes
- Exemple concret : `prevention-harcelement.quebec.ca` (inventée, n'existe pas)
- Impact : Perte de confiance utilisateur, liens brisés, désinformation

**Architecture de la chaîne d'URLs** :

```
┌───────────────────────────────────────────────────────────┐
│ Azure AI Search Index                                     │
│ - sourceUrl: URLs officielles vérifiées lors indexation  │
└─────────────────────┬─────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────┐
│ AzureAISearchDataSource.formatDocument()                 │
│ - Génère: <context url="${url}">...</context>            │
└─────────────────────┬─────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────┐
│ System Prompt (instructions.txt)                         │
│ - RÈGLE: Utiliser UNIQUEMENT url="..." du contexte       │
└─────────────────────┬─────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────┐
│ Réponse LLM à l'utilisateur                               │
│ - URLs fiables et traçables                              │
└───────────────────────────────────────────────────────────┘
```

**Règles strictes implémentées dans le prompt** :
1. ✅ **Source autorisée** : Attribut `url="..."` dans `<context>` généré par `AzureAISearchDataSource`
2. ✅ **URLs vérifiées** : Proviennent de l'index Azure AI Search (champ `sourceUrl`)
3. ❌ **JAMAIS générer** d'URL par déduction/inférence/création
4. ✅ **Alternative sans URL** : Lien textuel générique ("Consultez le guide Québec [1]")
5. ✅ **Vérification auto-évaluation** : Checklist "Aucune URL inventée - Toutes du contexte RAG"

**Impact architectural** :
- **Groundedness étendu** : Faits + URLs doivent être dans le contexte
- **Traçabilité absolue** : Toute URL est traçable à l'index Azure AI Search
- **Fiabilité garantie** : Zéro lien brisé dû à hallucination
- **Responsabilité claire** : URLs incorrectes = problème d'indexation (pas du LLM)

**Ajout au system prompt** :
```markdown
4. [Liens](url) → `[texte](https://...)`
   - ⚠️ **RÈGLE ABSOLUE : JAMAIS d'URL inventée/hallucinée**
   - Utilise UNIQUEMENT les URLs dans <context url="...">
   - Si aucune URL fournie, N'EN INVENTE PAS
```

**Ajout à l'auto-vérification** :
```markdown
### 4. Markdown Teams
- [ ] **CRITIQUE** : Aucune URL inventée - Toutes proviennent du contexte RAG
```

### 5. Transparence IA (Conformité Microsoft)

**Éléments requis** (selon Microsoft best practices) :
- ✅ **AI Label** : Géré automatiquement par l'app (ADR-010)
- ✅ **Citations** : Format `[#]` inline avec sources <context>
- ✅ **Feedback buttons** : À implémenter (thumbs up/down)
- ⚠️ **Sensitivity label** : À évaluer selon confidentialité

### 5. Architecture : Optimisation Budget Tokens

**Principe architectural** : Trade-off entre richesse des instructions et contexte RAG disponible.

**Budget total disponible** : ~8000 tokens (limite Azure OpenAI GPT-4)

```
Allocation v1 (non optimisée) :
├─ System prompt : ~2000 tokens (25%)
└─ Contexte RAG : ~6000 tokens (75%)

Allocation v2 (optimisée) :
├─ System prompt : ~1200 tokens (15%)  [-40%]
└─ Contexte RAG : ~6800 tokens (85%)  [+13%]

Allocation v2 enrichie (acceptée) :
├─ System prompt : ~2800 tokens (35%)  [+40% vs v1]
└─ Contexte RAG : ~5200 tokens (65%)  [-13% vs v1]
```

**Trade-off accepté v2 enrichie** :
- ✅ Instructions exhaustives et explicites (+800 tokens vs. v1)
- ✅ Documentation architecture LLM (température, capacités)
- ✅ Gestion cas limites détaillée (6 scénarios)
- ✅ Exemples enrichis (6 au lieu de 2)
- ⚠️ Contexte RAG réduit de 13% (-800 tokens)

**Rationale du choix** :
1. **Qualité > Quantité** : Mieux vaut instructions claires avec contexte réduit qu'instructions floues avec plus de contexte
2. **Évolutivité** : Instructions exhaustives = moins de bugs, maintenance facilitée
3. **Conformité** : Best practices Microsoft nécessitent documentation complète
4. **Recherche hybride** : Azure AI Search (k=50, vectoriel+texte) compense partiellement

**Optimisations futures envisagées** :
- Prompt dynamique : Charger sections selon type de question (factuelle vs génération)
- Compression sémantique : Reformulation plus concise sans perte de sens
- Externalisation : Déplacer exemples longs vers documentation séparée

### 6. Auto-Évaluation Intégrée

**Checklist interne** (invisible utilisateur) :
```markdown
# AUTO-VÉRIFICATION (avant envoi)
- [ ] Toutes affirmations ont citation [#] ?
- [ ] Aucune info inventée/supposée ?
- [ ] Markdown Teams compatible ?
- [ ] Taille < 80 KB ?
- [ ] 150 mots max respecté ?
- [ ] 2 questions suggérées ?
- [ ] Desktop + Mobile compatible ?
```

### 6. Architecture : Gestion Azure Content Safety Filters

**Contexte technique** : Azure OpenAI impose des filtres de contenu qui peuvent bloquer du contenu éducatif légitime.

**Problème rencontré** :
```json
{
  "code": "content_filter",
  "sexual": { "filtered": true, "severity": "medium" }
}
```

**Cas concret** : Questions sur Politique 16 Québec (harcèlement sexuel) bloquées car termes "harcèlement sexuel", "violences à caractère sexuel" déclenchent le filtre.

**Solution architecturale implémentée** :

1. **Gestion d'erreur dans app.js** :
   ```javascript
   if (error.code === 'content_filter' && error.sexual?.filtered) {
     // Message informatif sans URLs inventées
     send("Votre question porte sur du contenu sensible...");
   }
   ```

2. **Configuration Azure OpenAI Studio** :
   - Créer content filter personnalisé : `UQAM-Educational-Content-Filter`
   - Sexual content : Medium → **High only** (permet contenu éducatif)
   - Maintient blocage contenu explicite/inapproprié

**Trade-off** :
- ✅ Permet réponses sur politiques institutionnelles
- ✅ Maintient protection contre contenu inapproprié
- ⚠️ Nécessite configuration manuelle (pas disponible via CLI)

**Documentation** : `docs/guides/AZURE_CONTENT_FILTER_CONFIGURATION.md`

### 7. Gestion des Cas Limites

**Messages standardisés conformes Teams (sans URLs inventées)** :
```markdown
# Hors périmètre UQAM
"Je suis spécialisé dans les programmes juridiques de l'UQAM. 
Pour [institution], consultez leur site web officiel."

# Aucun contexte
"Je ne trouve pas d'information dans les documents disponibles. 
Contactez le Service de la recherche de l'UQAM."

# Content Filter bloqué (contenu sensible)
"Votre question porte sur du contenu sensible. 
Contactez votre direction de recherche ou les ressources humaines."

# Erreur technique générique
"Erreur technique détectée. Reformulez votre question."
```

## Conséquences

### Architecturales

**Impact sur le design du système** :

1. **Couplage Configuration LLM ↔ System Prompt**
   - ✅ Explicitation de la relation température → capacités
   - ✅ Documentation des trade-offs (précision vs créativité)
   - ⚠️ Changement config LLM nécessite mise à jour prompt synchronisée

2. **Budget Tokens : Trade-off Qualité vs Quantité**
   - ✅ v2 enrichie : Instructions exhaustives (+40% tokens) = moins de bugs
   - ⚠️ Contexte RAG réduit de 13% (-800 tokens)
   - ✅ Recherche hybride Azure AI Search (k=50) compense partiellement
   - 🔄 Évolution possible : Prompt dynamique selon type de question

3. **Séparation des Préoccupations**
   - ✅ PRIORITÉ 1 (Règles critiques) ↔ PRIORITÉ 3 (UX) clairement séparées
   - ✅ Résolution conflits : Hiérarchie explicite
   - ✅ Évolutivité : Ajout règles PRIORITÉ 3 sans impact PRIORITÉ 1

4. **Couplage Plateforme Microsoft Teams**
   - ⚠️ Dépendance forte aux contraintes Teams (Markdown, 100 KB, multi-plateforme)
   - ⚠️ Migration future vers autre plateforme nécessite refactoring prompt
   - ✅ Adaptive Cards = abstraction possible pour découplage (non implémenté)

### Fonctionnelles

**Impact sur le comportement de l'agent** :

1. **Capacité de Génération Explicite**
   - ✅ Génération lettres/modèles autorisée ET documentée
   - ✅ Réduction refus inappropriés (~30% estimé)
   - ✅ Distinction claire : faits (groundedness strict) vs contenu (génération contrôlée)

2. **Conformité Microsoft officielle**
   - ✅ Alignement documentation Teams officielle
   - ✅ Respect guidelines marketplace (ADR-010)
   - ✅ Formatage cohérent Desktop + Mobile + Web

3. **Robustesse et Gestion d'Erreurs**
   - ✅ 6 cas limites documentés (hors périmètre, aucun contexte, ambiguïté, etc.)
   - ✅ Messages standardisés pour fallbacks
   - ✅ Auto-vérification intégrée (checklist 15+ items)

4. **Performance**
   - ⚠️ v2 enrichie : +800 tokens prompt = +50ms latence estimée
   - ✅ Clarté instructions = moins d'itérations modèle = latence stable globalement
   - ✅ Réponses 150 mots max = bande passante optimisée

### Opérationnelles

**Impact sur la maintenance et l'évolution** :

1. **Maintenabilité**
   - ✅ Structure hiérarchisée (PRIORITÉ 1/2/3) facilite modifications
   - ✅ Sections clairement délimitées = modifications chirurgicales
   - ✅ Auto-documentation : Configuration LLM incluse dans prompt

2. **Traçabilité**
   - ✅ Auto-évaluation checklist = débug facilité
   - ✅ Logs structurés possibles (checkpoint auto-vérification)
   - ✅ Tests A/B mesurables (v1 vs v2)

3. **Formation Équipe**
   - ⚠️ Contraintes Teams non intuitives (Markdown limité, 100 KB)
   - ✅ Documentation exhaustive dans ADR-018
   - ✅ Exemples concrets dans prompt

### Négatives ⚠️

1. **Effort de Migration**
   - ❌ Refactoring complet `instructions.txt` (~8h développement)
   - ❌ Tests Desktop + Mobile obligatoires (~4h QA)
   - ❌ Formation équipe sur contraintes Teams (~2h)

2. **Complexité Accrue**
   - ⚠️ Prompt passé de ~2000 à ~2800 tokens (+40%)
   - ⚠️ Maintenance plus lourde (plus de sections à synchroniser)
   - ⚠️ Risque désynchronisation config LLM ↔ prompt si changements non coordonnés

3. **Limitations Plateforme**
   - ❌ Sous-ensemble Markdown limité (pas de tableaux, images inline)
   - ❌ Listes à puces instables sur mobile
   - ❌ Adaptive Cards = alternative complexe (JSON, debugging difficile)

4. **Trade-off Contexte RAG**
   - ⚠️ -800 tokens contexte RAG (-13%)
   - ⚠️ Risque information pertinente tronquée pour questions complexes
   - ✅ Mitigé par recherche hybride (k=50, exhaustive=true)

### Mitigations

1. **Migration progressive** : Créer `instructions-v2.txt`, tests A/B avant remplacement complet
2. **Documentation complète** : Guide de maintenance du prompt avec exemples Teams
3. **Tests automatisés** : Scripts de validation taille message, Markdown supporté
4. **Monitoring** : Logs pour tracker conformité (taille, tokens, temps réponse)
5. **Feedback buttons** : Phase 2 (pas bloquant pour Phase 1)
6. **Adaptive Cards** : Réservé pour cas complexes (modèles de lettres)

## Alternatives Considérées

### Alternative 1: Stratégie Budget Tokens - Prompt Minimal (800 Tokens)

**Description architecturale** :

```
┌──────────────────────────────────────┐
│ System Prompt: 800 tokens (10%)     │  ← Instructions minimales
│ RAG Context:   7200 tokens (90%)    │  ← Maximiser contexte
└──────────────────────────────────────┘
Total: 8000 tokens
```

**Rationale technique** :

- Prompt ultra-condensé : Règles critiques uniquement (< 500 mots)
- Documentation détaillée externalisée (wiki, confluence, etc.)
- Budget RAG maximisé : k=60 documents vs k=50 actuel

**Rejetée parce que** :

- ⚠️ Ambiguïté : Instructions trop concises = interprétations divergentes
- ⚠️ Maintenance : Synchronisation prompt ↔ doc externe complexe
- ⚠️ Debugging difficile : Comportement non auto-documenté
- ✅ **Trade-off accepté** : Qualité instructions > Quantité contexte RAG

### Alternative 2: Architecture - Adaptive Cards Comme Couche Présentation Primaire

**Description architecturale** :

```
┌─────────────────────────────────────────────┐
│ Agent LLM                                   │
│  ↓ Génération JSON Adaptive Card            │
│ ┌─────────────────────────────────────────┐ │
│ │ Adaptive Card Engine (Teams SDK)        │ │
│ │  ↓ Rendu Desktop + Mobile + Web         │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Rationale technique** :

- Découplage : Formatage séparé de la logique agent
- Capacités riches : Tableaux, images, boutons, formulaires
- Multi-plateforme natif : Teams gère le rendu

**Rejetée parce que** :

- ⚠️ Complexité : LLM génère JSON valide Adaptive Card (fragile)
- ⚠️ Latence : +200-500ms (génération + validation + rendu)
- ⚠️ Debugging : Erreurs JSON opaques vs Markdown lisible
- ⚠️ Overhead : Nécessaire uniquement pour 10% des cas (lettres, formulaires)
- ✅ **Décision** : Markdown primaire + Adaptive Cards pour cas spécifiques

### Alternative 3: Configuration LLM - Temperature 0.1 (Ultra-Précis)

**Description architecturale** :

```javascript
// Alternative rejetée
{
  temperature: 0.1,    // ← Ultra-déterministe
  topP: 0.95,
  presencePenalty: 0.5,
  frequencyPenalty: 0.3
}
```

**Rationale technique** :

- Réduction 40% variabilité réponses
- Groundedness maximal (colle aux faits)
- Prédictibilité tests A/B

**Rejetée parce que** :

- ❌ Perte capacité génération : Lettres/modèles trop rigides
- ❌ Réponses répétitives : Formulations identiques ennuyeuses
- ❌ Créativité nulle : Questions ouvertes mal gérées
- ✅ **Configuration retenue** : Temperature 0.3 = équilibre précision + flexibilité contrôlée

### Alternative 4: Architecture Multi-Plateforme - Prompt Générique Agnostique

**Description architecturale** :

```
┌────────────────────────────────────────┐
│ Core Agent (plateforme-agnostique)    │
│  ↓                                     │
│ ┌────────────┬──────────┬────────────┐│
│ │ Teams      │ Slack    │ Discord    ││ ← Adaptateurs
│ └────────────┴──────────┴────────────┘│
└────────────────────────────────────────┘
```

**Rationale technique** :

- Réutilisabilité : Un agent → plusieurs plateformes
- Maintenance simplifiée : Modifications centralisées
- Architecture découplée : Core business logic séparée

**Rejetée parce que** :

- ❌ Compromis sous-optimal : Aucune plateforme pleinement exploitée
- ❌ Formatage dénominateur commun : Perte capacités Teams (Adaptive Cards, AI labels)
- ❌ Complexité architecture : Couche abstraction + adaptateurs à maintenir
- ❌ Besoin non avéré : Légis Québec uniquement Teams pour 2-3 ans minimum
- ✅ **Décision** : Optimisation Teams-first = meilleure UX

## Implémentation

### Architecture de Migration

**Stratégie de migration progressive** :

```
┌───────────────────────────────────────────────────────────┐
│ Phase 1: Évaluation       │ Phase 2: Refactoring         │
│ (1-2 jours)               │ (3-5 jours)                  │
├───────────────────────────┼──────────────────────────────┤
│ - Audit prompt actuel     │ - Structure hiérarchisée     │
│ - Benchmark performance   │ - Optimisation tokens        │
│ - Gap analysis Microsoft  │ - Tests multi-plateforme     │
└───────────────────────────┴──────────────────────────────┘
         ↓                              ↓
┌───────────────────────────────────────────────────────────┐
│ Phase 3: Enrichissement   │ Phase 4: Production          │
│ (1 semaine)               │ (ongoing)                    │
├───────────────────────────┼──────────────────────────────┤
│ - Exemples détaillés      │ - Monitoring logs            │
│ - Auto-vérification       │ - Alertes anomalies          │
│ - Feedback buttons        │ - Itération mensuelle        │
└───────────────────────────┴──────────────────────────────┘
```

### Phase 1: Évaluation et Planification (1-2 jours)

**Objectif architectural** : Établir baseline et définir metrics

- [x] **Recherche best practices** : Documentation Microsoft Teams officielle
- [x] **Identification contraintes** : Formatage, taille messages, plateforme
- [x] **Création ADR-018** : Documentation décisions architecturales
- [x] **Analyse configuration LLM** : Évolution temperature 0.9 → 0.3
- [x] **Évaluation prompt actuel** : Score 7.5/10, identification gaps
- [ ] **Benchmark performance baseline** :
  - Mesurer latence actuelle (p50, p95, p99)
  - Tokens utilisés (prompt + RAG + réponse)
  - Qualité citations (taux groundedness)
  - Feedback utilisateurs existants

### Phase 2: Refactoring Architectural (3-5 jours)

**Objectif architectural** : Structure hiérarchisée + optimisation budget tokens

- [x] **Création `instructions-v2.txt`** : Structure PRIORITÉ 1/2/3
- [x] **Explicitation capacités LLM** : Temperature 0.3 → 2 modes (factuel + génératif)
- [x] **Optimisation tokens** : v1 (2000) → v2 enrichie (2800 tokens, +40% rationnel)
- [ ] **Tests A/B multi-plateforme** :
  - Desktop (Windows 11, macOS 14)
  - Mobile (iOS 17+, Android 13+)
  - Web (Edge, Chrome, Safari)
- [ ] **Validation conformité** :
  - Taille < 80 KB (sécurité vs. limite 100 KB)
  - Réponses ≤ 150 mots
  - Citations ≤ 20 références
  - Markdown Teams uniquement

### Phase 3: Enrichissement et Robustesse (1 semaine)

**Objectif architectural** : Auto-documentation + gestion erreurs

- [x] **Exemples concrets** : ✅ Bon formatage vs. ❌ Mauvais
- [x] **Contre-exemples** : Hallucinations, formatage cassé
- [x] **Cas limites documentés** : 6 scénarios (hors périmètre, aucun contexte, etc.)
- [x] **Auto-vérification** : Checklist 15+ items hiérarchisée PRIORITÉ 1/2/3
- [ ] **Implémentation feedback buttons** :
  - Thumbs up/down (UI Teams)
  - Logging structured feedback
  - Dashboard analytics (Power BI ou Grafana)
- [ ] **Documentation maintenance** :
  - Guide modification prompt
  - Checklist pré-déploiement
  - Runbook rollback

### Phase 4: Production et Monitoring Continu (ongoing)

**Objectif architectural** : Observabilité + amélioration continue

- [ ] **Monitoring centralisé** :
  - Logs structurés (Application Insights)
  - Métriques : Taille messages, tokens (prompt/RAG/réponse), latence
  - Traces distribuées : User query → Azure Search → LLM → Response
- [ ] **Alertes proactives** :
  - Messages > 80 KB (risque rejet)
  - Réponses > 150 mots (non-conformité)
  - Latence > p95 baseline (+50%)
  - Taux d'erreur > 1% (anomalie)
- [ ] **Feedback loop** :
  - Collecte feedback buttons (weekly review)
  - Analyse sentiment utilisateurs
  - Identification patterns échecs
- [ ] **Itération mensuelle** :
  - Review metrics vs. baseline
  - Ajustements prompt selon retours
  - Tests régression automatisés
  - Mise à jour ADR-018 si changements architecturaux

### Stratégie de Rollback

**En cas de régression post-déploiement** :

1. **Rollback immédiat** : `git revert` vers `instructions-v1.txt`
2. **Analyse post-mortem** : Logs + feedback utilisateurs
3. **Hotfix isolé** : Branche `hotfix/prompt-issue-XYZ`
4. **Tests renforcés** : Couvrir cas de régression
5. **Redéploiement progressif** : Canary deployment (10% → 50% → 100%)

## Références

- [Microsoft Teams - Format your bot messages](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/format-your-bot-messages)
- [Microsoft Teams - Designing your bot](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/design/bots)
- [Microsoft Teams - AI-generated content messages](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bot-messages-ai-generated-content)
- [Microsoft Teams - Agents user experience](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/teams-conversational-ai/ai-ux)
- [Microsoft Teams - Format cards in Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/task-modules-and-cards/cards/cards-format)
- [Adaptive Cards Documentation Hub](https://adaptivecards.microsoft.com/)
- [OpenAI - Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Anthropic - Prompt Library RAG](https://docs.anthropic.com/en/prompt-library/rag-assistant)
- ADR-000 : Processus de création ADR
- ADR-003 : Format réponse Markdown et citations
- ADR-004 : Restriction périmètre UQAM
- ADR-010 : Divulgation obligatoire IA
- ADR-013 : Utilisation émojis et icônes (ZÉRO émoji)

## Notes

### Évolution Future

**v1.0 (actuel)** : Prompt verbeux ~2000 tokens, pas d'optimisation Teams  
**v2.0 (proposé)** : Prompt condensé ~1200 tokens, conforme Microsoft  
**v3.0 (futur)** : Adaptive Cards pour contenu complexe, feedback buttons intégrés

### Considérations Techniques

**Markdown Teams vs. Markdown Standard** :
```markdown
# ❌ NON SUPPORTÉ dans texte Teams
| Colonne 1 | Colonne 2 |  ← Tableaux
|-----------|-----------|
![Image](url)               ← Images inline
# Header 1                  ← Headers dans texte simple

# ✅ SUPPORTÉ dans texte Teams
**Gras** _Italique_         ← Formatage basique
- Liste à puces             ← Listes (Desktop uniquement)
[Lien](url)                 ← Hyperliens
`code`                      ← Code inline
> Citation                  ← Blockquote
```

**Adaptive Cards (Alternative pour Complexité)** :
- ✅ Tableaux, images, boutons, formulaires
- ✅ Formatage riche complet
- ❌ Complexité technique (JSON)
- ❌ Temps génération augmenté
- 🎯 Réservé pour : Modèles lettres, formulaires interactifs

### Métriques de Succès

**Objectifs Phase 1** :
- ✅ Réduction 40% tokens prompt (2000 → 1200)
- ✅ 100% réponses < 80 KB
- ✅ 100% réponses < 150 mots
- ✅ Formatage compatible Desktop + Mobile

**Objectifs Phase 2** :
- ✅ Feedback buttons opérationnels
- ✅ Temps réponse < 5 secondes
- ✅ Taux satisfaction utilisateurs > 80%
- ✅ Zéro rejet message (taille)

### Responsabilités

**Product Owner** : Validation priorités, acceptation tests  
**Développeur** : Refactoring prompt, tests, implémentation feedback buttons  
**Designer UX** : Validation formatage Mobile, ergonomie  
**QA** : Tests multi-plateformes (Desktop, Mobile iOS/Android)

---

**Prochaine étape** : Créer `instructions-v2.txt` avec structure optimisée et lancer tests A/B (Desktop + Mobile).
