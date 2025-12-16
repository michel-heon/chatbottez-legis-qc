# ADR 000: Processus de Création et Gestion des ADR

## Statut

✅ Accepté

## Date

2025-11-21

## Contexte

Le projet UQAM-GPT nécessite une documentation structurée des décisions architecturales importantes. Les Architecture Decision Records (ADR) sont un moyen éprouvé de capturer le **pourquoi** derrière les décisions techniques, facilitant :

- La compréhension des choix architecturaux par les nouveaux développeurs
- La traçabilité des décisions dans le temps
- L'évaluation des alternatives considérées
- La documentation des conséquences (positives et négatives)
- La justification des changements futurs

Sans processus formalisé, les décisions restent implicites, rendant difficile :

- La cohérence de la documentation
- La recherche de décisions passées
- La compréhension du contexte historique
- L'évaluation de la pertinence actuelle des décisions

## Décision

Adopter un processus formalisé de création et gestion des ADR basé sur le modèle Michael Nygard, adapté pour UQAM-GPT.

### Structure des ADR

Chaque ADR suit le template `docs/adr/adr-template.md` avec les sections obligatoires :

```markdown
# ADR XXX: Titre Court et Descriptif

## Statut
[Emoji] [État]

## Date
YYYY-MM-DD

## Contexte
[Description du problème]

## Décision
[Solution choisie]

## Conséquences
### Positives ✅
### Négatives ⚠️
### Mitigations 🔧

## Alternatives Considérées
[Options rejetées avec justification]
```

### Numérotation

- **Format** : `XXX-titre-kebab-case.md`
- **Séquence** : 000, 001, 002, ..., 999
- **ADR 000** : Ce document (méta-ADR sur le processus)
- **Pas de gaps** : Numérotation continue sans sauts

### États Possibles

| Emoji | État | Description |
|-------|------|-------------|
| 🔄 | Brouillon | En cours de rédaction |
| ✅ | Proposé | Prêt pour revue/validation |
| ✅ | Accepté | Décision approuvée et appliquée |
| ❌ | Rejeté | Proposition refusée (archivée) |
| ⚠️ | Déprécié | Remplacé par un ADR plus récent |
| 🔄 | Supersédé | Remplacé (référencer l'ADR qui remplace) |

### Processus de Création

#### 1. Identifier le Besoin

Un ADR est requis quand :

- ✅ Décision architecturale significative (framework, pattern, service cloud)
- ✅ Choix ayant des conséquences à long terme
- ✅ Alternatives multiples existantes nécessitant justification
- ✅ Décision affectant plusieurs composants/équipes
- ✅ Choix non évident nécessitant explication

Un ADR n'est **pas** requis pour :

- ❌ Décisions triviales ou de routine
- ❌ Choix sans alternative viable
- ❌ Décisions temporaires ou expérimentales
- ❌ Préférences de style de code (utiliser linter)

#### 2. Créer le Fichier

```bash
# Trouver le prochain numéro disponible
cd docs/adr
ls -1 [0-9]*.md | tail -1  # Voir le dernier numéro

# Créer le nouveau fichier
cp adr-template.md XXX-titre-descriptif.md
```

#### 3. Rédiger l'ADR

**Ordre de rédaction recommandé** :

1. **Contexte** : Commencer par décrire le problème (pas la solution)
2. **Alternatives** : Lister toutes les options considérées avec avantages/inconvénients
3. **Décision** : Expliquer la solution choisie et pourquoi
4. **Conséquences** : Documenter impacts positifs, négatifs et mitigations

**Conseils de rédaction** :

- ✍️ Écrire au **présent** : "Nous décidons" (pas "Nous avons décidé")
- 🎯 Être **spécifique** : Noms de technologies, versions, configurations
- 📊 Inclure des **exemples** : Extraits de code, diagrammes si pertinent
- 🔗 **Référencer** : Liens vers docs externes, autres ADRs
- ⚖️ Rester **objectif** : Présenter les faits, pas les opinions

#### 4. Revue et Validation

- **Brouillon** (🔄) : Rédaction initiale, peut contenir TODOs
- **Proposé** (✅) : Prêt pour discussion avec l'équipe
- **Accepté** (✅) : Décision finale, implémentation peut commencer

Pour les décisions critiques : review par au moins 1 autre développeur

#### 5. Référencement

Ajouter l'entrée dans `docs/adr/README.md` :

```markdown
| 000 | [Processus Création ADR](000-processus-creation-adr.md) | ✅ Accepté | 2025-11-21 |
```

#### 6. Commit Git

```bash
git add docs/adr/XXX-*.md docs/adr/README.md
git commit -m "docs(adr): ADR XXX - [Titre court]

[Description optionnelle du contexte]

Référence: #issue (si applicable)"
```

### Modification des ADR Existants

#### Corrections Mineures (Typos, Clarifications)

- ✅ Modifier directement l'ADR
- ✅ Commit : `docs(adr): correction ADR XXX - [description]`
- ✅ **Ne pas changer** la date originale

#### Changement de Décision

**Ne JAMAIS modifier** un ADR accepté pour changer la décision :

1. Créer un **nouvel ADR** avec la nouvelle décision
2. Marquer l'ancien ADR comme **Supersédé** (🔄)
3. Ajouter référence croisée :

```markdown
## Statut

🔄 Supersédé par [ADR XXX](XXX-nouveau-titre.md)
```

### Gestion Multi-Projets

Structure actuelle :

```
docs/adr/
  000-processus-creation-adr.md         # Méta-ADR (global)
  001-git-workflow.md                   # Projet Teams Agent
  002-optimisation-recherche.md         # Projet Teams Agent
  ...
```

Pour de futurs projets distincts, envisager :

```
docs/adr/
  global/
    000-processus-creation-adr.md
    ...
  teams-agent/
    001-git-workflow.md
    ...
  autre-projet/
    001-architecture.md
    ...
```

## Conséquences

### Positives ✅

- **Traçabilité** : Historique complet des décisions architecturales
- **Onboarding** : Nouveaux développeurs comprennent rapidement les choix
- **Cohérence** : Format standard facilite la recherche et compréhension
- **Débats constructifs** : Alternatives documentées préviennent les débats répétitifs
- **Évolution** : Facilite la révision de décisions devenues obsolètes
- **Documentation vivante** : ADRs évoluent avec le code dans le même repo

### Négatives ⚠️

- **Overhead initial** : Temps requis pour rédiger un ADR (~30-60 minutes)
- **Discipline requise** : Nécessite rigueur pour maintenir la pratique
- **Risque de sur-documentation** : Tentation de créer des ADRs pour des décisions triviales

### Mitigations 🔧

- **Template pré-rempli** : `adr-template.md` accélère la rédaction
- **Critères clairs** : Section "Identifier le Besoin" guide quand créer un ADR
- **Revue légère** : Pas de processus lourd, validation rapide en équipe
- **Exemples** : ADRs 001-011 servent de référence pour nouveaux contributeurs

## Alternatives Considérées

### 1. Documentation Wiki Externe

**Avantages** :

- Interface web conviviale
- Recherche full-text intégrée
- Édition collaborative WYSIWYG

**Inconvénients** :

- ❌ **Séparation code/docs** : Risque de désynchronisation
- ❌ **Pas de versioning** : Historique limité
- ❌ **Dépendance externe** : Plateforme additionnelle à maintenir

**Rejeté** : Préférons garder ADRs avec le code pour cohérence

### 2. Issues GitHub/Tickets Jira

**Avantages** :

- Outil déjà utilisé par l'équipe
- Discussions intégrées
- Liens avec commits

**Inconvénients** :

- ❌ **Format libre** : Pas de structure imposée
- ❌ **Recherche difficile** : Mélangé avec bugs/features
- ❌ **Archivage** : Issues fermées deviennent invisibles

**Rejeté** : Issues pour tracking, ADRs pour décisions architecturales

### 3. Documentation Google Docs/Confluence

**Avantages** :

- Collaboration temps réel
- Commentaires en ligne
- Rich formatting

**Inconvénients** :

- ❌ **Hors du repo** : Pas de lien code-décisions
- ❌ **Accès** : Authentification séparée
- ❌ **Export** : Difficile d'extraire pour CI/CD

**Rejeté** : Préférons Markdown versionné avec Git

### 4. Pas de Processus Formalisé

**Avantages** :

- Zéro overhead
- Flexibilité totale

**Inconvénients** :

- ❌ **Perte de connaissance** : Décisions oubliées avec le temps
- ❌ **Débats répétitifs** : Mêmes discussions refaites périodiquement
- ❌ **Onboarding difficile** : Nouveaux dev doivent tout redécouvrir

**Rejeté** : Coût de l'absence de documentation > coût de maintenance

## Implémentation

### Phase 1 : Fondation ✅ (Complété 2025-11-21)

- [x] Créer `adr-template.md` avec structure complète
- [x] Rédiger ADR 000 (ce document)
- [x] Standardiser ADRs 001-011 au nouveau format
- [x] Mettre à jour `docs/adr/README.md` avec index complet

### Phase 2 : Adoption (En cours)

- [ ] Communiquer le processus à l'équipe
- [ ] Créer ADR pour prochaines décisions architecturales
- [ ] Réviser après 3 mois d'utilisation

### Phase 3 : Automatisation (Futur)

- [ ] Script `new-adr.sh` pour créer ADR avec numéro auto
- [ ] Pre-commit hook validant format ADR
- [ ] CI check vérifiant référencement dans README.md

## Références

- [Architecture Decision Records](https://adr.github.io/) - Site communautaire ADR
- [Michael Nygard - Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Article original
- [ADR Tools](https://github.com/npryce/adr-tools) - Outils CLI pour ADRs
- [docs/adr/adr-template.md](./adr-template.md) - Template UQAM-GPT
- [docs/adr/README.md](./README.md) - Index des ADRs

## Notes

Ce document est lui-même un ADR (méta-ADR) et suit le processus qu'il définit. Il peut être modifié pour améliorer le processus basé sur l'expérience de l'équipe.

**Révisions majeures** : Si le processus change significativement, créer un nouvel ADR (ex: ADR 012) et marquer ADR 000 comme Supersédé.
