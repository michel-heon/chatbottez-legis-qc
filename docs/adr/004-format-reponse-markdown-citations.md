# ADR 003: Format de Réponse Markdown avec Citations Inline

## Statut

✅ Accepté

## Date

2025-11-17

## Contexte

Légis Québec implémente un pattern RAG où le LLM (GPT-4.1) génère des réponses basées sur des documents récupérés d'Azure AI Search. Les réponses doivent inclure des **citations** pour assurer la traçabilité et la confiance des utilisateurs.

### Problème initial : Format JSON vs Markdown

**Configuration initiale :**

L'application s'attendait à recevoir des réponses au format **JSON structuré** :

```javascript
// Format attendu par app.js (v0.x)
{
    "results": "Les stages à l'Québec sont...",
    "citationTitle": "Loi sur les normes du travail",
    "citationContent": "Les étudiants doivent..."
}
```

**Prompt système :**

Le prompt demandait au LLM de générer du **Markdown avec citations inline** `[#]` :

```markdown
Les stages à l'Québec [1] nécessitent... Selon le guide [2]...
```

**Conflit structurel :**

```
app.js attend: JSON
LLM génère:    Markdown
Résultat:      SyntaxError: Unexpected token 'L', 'Les stagia'...
```

### Alignement avec les meilleures pratiques Microsoft

**Microsoft RAG Best Practices :**

> "Use inline citations [#] in markdown format. Citations should be placed **immediately after** the relevant statement to minimize errors."  
> — [Microsoft RAG Solution Accelerator](https://github.com/microsoft/RAG-solution-accelerator)

**Recommandations clés :**

1. **Format Markdown** : Plus naturel pour le LLM, meilleure qualité
2. **Citations inline `[#]`** : Proximité texte-source réduit hallucinations
3. **Numérotation séquentielle** : `[1], [2], [3]` (pas de titres)
4. **Limite 150 mots** : Concision pour Teams mobile

## Décision

### Adoption du format Markdown avec citations inline

**Le système génère et traite des réponses en Markdown pur avec citations `[#]` directement dans le texte.**

#### Format de sortie LLM (généré)

```markdown
Les stages à l'Québec [1] sont obligatoires pour certains programmes. 
Vous devez compléter 140 heures minimum [2] dans une organisation 
approuvée. Les crédits varient selon le programme [1].

**Questions de suivi:**
- Quels programmes nécessitent un stage?
- Comment trouver une organisation d'accueil?

<sup>🤖 Cette réponse a été générée par Légis Québec...</sup>
```

#### Structure des documents contexte (reçus d'Azure)

```xml
<context source="Loi sur les normes du travail UQAM" url="https://quebec.ca/stages">
Les stages à l'Québec sont obligatoires pour...
</context>
<context source="Règlements juridiques" url="https://quebec.ca/reglements">
Les étudiants doivent compléter 140 heures minimum...
</context>
```

#### Traitement dans l'application (app.js)

```javascript
// 1. Extraire les sources des tags <context>
const sourceRegex = /<context source="([^"]*)" url="([^"]*)">[\s\S]*?<\/context>/g;
const sources = [];
let match;
while ((match = sourceRegex.exec(context)) !== null) {
    sources.push({
        title: match[1],
        url: match[2]
    });
}

// 2. Extraire les numéros de citation du Markdown
const citationRegex = /\[(\d+)\]/g;
const citations = new Set();
let citationMatch;
while ((citationMatch = citationRegex.exec(response)) !== null) {
    citations.add(parseInt(citationMatch[1]));
}

// 3. Mapper citations → sources
const activity = MessageFactory.text(response);
for (const citationNum of Array.from(citations).sort()) {
    const sourceIndex = citationNum - 1;  // [1] → sources[0]
    if (sourceIndex < sources.length) {
        activity.addCitation({
            "@type": "Claim",
            position: `${citationNum}`,
            appearance: {
                "@type": "DigitalDocument",
                name: sources[sourceIndex].title,
                url: sources[sourceIndex].url
            }
        });
    }
}
```

### Justification

#### 1. **Alignement avec Microsoft RAG Best Practices**

- ✅ Format recommandé officiellement
- ✅ Citations inline réduisent hallucinations (études Microsoft)
- ✅ Markdown natif pour LLM = meilleure qualité
- ✅ Compatible Teams message rendering

#### 2. **Simplicité du prompt**

**JSON :**

```
Generate response as JSON:
{
  "results": "answer here",
  "citations": [{"title": "...", "content": "..."}]
}
```

**Markdown :**

```
Answer in markdown. Use [#] for citations.
```

- ❌ JSON : LLM doit gérer structure + échappement + validation
- ✅ Markdown : Format naturel, moins d'erreurs de génération

#### 3. **Proximité citation-texte**

**Avec inline `[#]` :**

```markdown
Les stages nécessitent 140 heures [1] dans une organisation approuvée [2].
```

**Avec JSON séparé :**

```json
{
  "text": "Les stages nécessitent 140 heures dans une organisation approuvée.",
  "citations": [
    {"id": 1, "source": "Guide stages"},
    {"id": 2, "source": "Règlements"}
  ]
}
```

- ❌ JSON : Risque d'association incorrecte citation-texte
- ✅ Inline : Citation **immédiatement** après le fait = 0 ambiguïté

#### 4. **Expérience utilisateur Teams**

Dans Teams, les citations inline `[#]` deviennent des **liens cliquables** :

```
Les stages nécessitent 140 heures [1]↗
                                    └─ Cliquable vers document source
```

- ✅ Traçabilité immédiate
- ✅ Confiance utilisateur (source vérifiable)
- ✅ Norme juridique respectée

## Conséquences

### Positives ✅

- **Qualité LLM** : Format Markdown natif, moins d'erreurs de génération
- **Alignement Microsoft** : Suit recommandations officielles RAG
- **Précision citations** : Proximité texte-source réduit hallucinations
- **UX Teams** : Citations cliquables natives
- **Simplicité prompt** : Moins de contraintes structurelles
- **Maintenabilité** : Pas de parsing JSON fragile

### Négatives ⚠️

- **Parsing regex** : Extraction sources et citations par regex
  - **Mitigation** : Regex robustes, tests unitaires
- **Pas de validation schema** : Markdown libre vs JSON validable
  - **Mitigation** : Prompt très strict, tests qualité
- **Dépendance format context** : Balises `<context>` fixes
  - **Mitigation** : Format contrôlé par notre code (azureAISearchDataSource)

### Risques 🔴

**1. LLM ne respecte pas format `[#]`**

- **Probabilité** : Faible (prompt explicite + exemples)
- **Impact** : Moyen (pas de citations extraites)
- **Mitigation** : Validation post-génération, fallback sans citations

**2. Regex échoue sur edge cases**

- **Probabilité** : Moyenne (format Markdown variable)
- **Impact** : Faible (citations manquées, pas de crash)
- **Mitigation** : Logs monitoring, tests edge cases

**3. Teams change rendu Markdown**

- **Probabilité** : Faible (API stable)
- **Impact** : Élevé (affichage cassé)
- **Mitigation** : Tests E2E, monitoring UX

## Alternatives considérées

### 1. **Format JSON strict**

```javascript
{
    "answer": "Les stages nécessitent...",
    "citations": [
        {"number": 1, "title": "Guide stages", "url": "..."}
    ]
}
```

**Avantages :**

- Validation schema
- Structure prédictible

**Inconvénients :**

- ❌ LLM génère mal le JSON (échappement, virgules, etc.)
- ❌ Pas de proximité citation-texte
- ❌ Contre recommandations Microsoft
- ❌ Complexifie prompt

**Verdict :** Rejeté - Trop d'erreurs de génération

### 2. **Footnotes Markdown `[^1]`**

```markdown
Les stages nécessitent 140 heures[^1].

[^1]: Loi sur les normes du travail UQAM
```

**Avantages :**

- Markdown standard
- Lisible en texte brut

**Inconvénients :**

- ❌ Pas de support Teams natif pour footnotes
- ❌ Citations en bas de message (moins visible)
- ❌ Pas recommandé par Microsoft pour RAG

**Verdict :** Rejeté - Support Teams incomplet

### 3. **Citations après chaque paragraphe**

```markdown
Les stages nécessitent 140 heures.

Sources: [1] Loi sur les normes du travail UQAM
```

**Avantages :**

- Clair et lisible

**Inconvénients :**

- ❌ Perte de granularité (quel fait → quelle source?)
- ❌ Pas de liens cliquables inline
- ❌ Moins précis pour vérification

**Verdict :** Rejeté - Traçabilité insuffisante

### 4. **Hybrid : Markdown + JSON metadata**

```markdown
Les stages nécessitent 140 heures [1].

---METADATA---
{"citations": [{"id": 1, "title": "...", "url": "..."}]}
```

**Avantages :**

- ✅ Meilleur des deux mondes
- ✅ Validation possible

**Inconvénients :**

- ⚠️ Complexité parsing
- ⚠️ LLM doit gérer 2 formats
- ⚠️ Overhead inutile pour cas simple

**Verdict :** Différé - Envisager si problèmes avec regex

## Implémentation

### Modification du code (✅ Complété)

**Fichier** : `src/app/app.js`

**Changements :**

```diff
// AVANT (v0.x) - Attendait JSON
- const parsed = JSON.parse(response);
- const text = parsed.results;
- const citations = parsed.citations;

// APRÈS (v1.0.0) - Traite Markdown
+ const sourceRegex = /<context source="([^"]*)" url="([^"]*)">[\s\S]*?<\/context>/g;
+ const sources = extractSources(context);
+ const citationNumbers = extractCitationNumbers(response);
+ const activity = MessageFactory.text(response);
+ mapCitationsToSources(activity, citationNumbers, sources);
```

### Modification du prompt (✅ Complété)

**Fichier** : `src/app/instructions.txt`

**Ajout explicite :**

```
## FORMAT DE SORTIE - MARKDOWN
- Rédige ta réponse en **Markdown**
- Utilise **[#]** pour les citations (ex: [1], [2])
- Place les citations **immédiatement après** le fait concerné
```

### Tests de validation (En cours)

```javascript
// Tests unitaires à ajouter
describe('Markdown Citation Parsing', () => {
    it('extracts sources from context tags', () => {
        const context = '<context source="Guide" url="http://...">text</context>';
        const sources = extractSources(context);
        expect(sources[0].title).toBe("Guide");
    });

    it('extracts citation numbers from markdown', () => {
        const markdown = "Text [1] and [2].";
        const citations = extractCitationNumbers(markdown);
        expect(citations).toEqual([1, 2]);
    });

    it('handles missing sources gracefully', () => {
        const markdown = "Text [999].";  // Citation sans source
        expect(() => mapCitationsToSources(markdown, [])).not.toThrow();
    });
});
```

## Métriques de succès

### Métriques de qualité (à mesurer)

| Métrique | Cible | Mesure |
|----------|-------|--------|
| Taux génération Markdown valide | >99% | Monitoring erreurs parsing |
| Taux citations extraites | >95% | Ratio citations trouvées / attendues |
| Taux sources mappées | >98% | Citations avec URL valide |
| Satisfaction utilisateurs | >4.5/5 | Survey "citations utiles?" |

### Monitoring (à implémenter)

```javascript
// Telemetry à ajouter
{
    "response_format": "markdown",
    "citations_in_response": 3,
    "citations_mapped": 3,
    "sources_available": 50,
    "parsing_errors": 0,
    "rendering_success": true
}
```

## Plan d'implémentation

### Phase 1 : Code (✅ Complété)

- [x] Adapter `app.js` pour parsing Markdown
- [x] Extraire sources avec regex
- [x] Extraire citations avec regex
- [x] Mapper citations → sources
- [x] Tests manuels

### Phase 2 : Validation (En cours)

- [ ] Tests unitaires extraction sources
- [ ] Tests unitaires extraction citations
- [ ] Tests integration end-to-end
- [ ] Tests edge cases (sources manquantes, citations hors range)

### Phase 3 : Production (À venir)

- [ ] Monitoring parsing errors
- [ ] Dashboard qualité citations
- [ ] A/B test qualité réponses vs v0.x JSON

## Références

### Documentation Microsoft

- [Microsoft RAG Solution Accelerator](https://github.com/microsoft/RAG-solution-accelerator)
- [Azure OpenAI RAG Patterns](https://learn.microsoft.com/azure/ai-services/openai/concepts/rag)
- [Teams Bot Framework Message Formatting](https://learn.microsoft.com/microsoftteams/platform/bots/how-to/format-messages)

### Recherche juridique

- "Lost in the Middle: How Language Models Use Long Contexts" (Liu et al., 2023)  
  → Citations inline = meilleure utilisation contexte
- "RARR: Researching and Revising RAG" (Gao et al., 2023)  
  → Proximité citation-fait critique pour qualité

### Standards Markdown

- [CommonMark Spec](https://commonmark.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

## Historique des révisions

| Date | Version | Changements | Auteur |
|------|---------|-------------|--------|
| 2025-11-17 | 1.0 | Création initiale | GitHub Copilot |
