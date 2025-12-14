# Architecture Decision Records (ADR)

Ce répertoire contient les Architecture Decision Records (ADR) pour le projet **Légis Québec** (Chatbot Conseiller Juridique). Les ADR documentent les décisions architecturales importantes prises au cours du développement du système.

## Qu'est-ce qu'un ADR ?

Un **Architecture Decision Record (ADR)** est un document qui capture une décision architecturale importante, son contexte, les alternatives considérées, et les conséquences de la décision. Les ADR aident à :

- 📚 **Préserver le contexte** : Comprendre pourquoi certaines décisions ont été prises
- 🔍 **Faciliter l'onboarding** : Nouveaux membres comprennent rapidement les choix techniques
- ✅ **Justifier les choix** : Expliquer les trade-offs et alternatives considérées
- 🔄 **Réévaluer** : Revisiter les décisions quand le contexte change

## Format ADR

Chaque ADR suit ce format standardisé :

```markdown
# ADR XXX: Titre de la décision

## Statut
Accepté | Rejeté | Déprécié | Superseded

## Contexte
Quel est le problème ou la situation qui nécessite une décision?

## Décision
Quelle solution avons-nous choisie?

## Conséquences
Quels sont les impacts (positifs et négatifs) de cette décision?

## Alternatives considérées
Quelles autres options avons-nous évaluées et pourquoi les avons-nous rejetées?
```

## Index des ADR

| # | Titre | Statut | Date |
|---|-------|--------|------|
| [000](./000-processus-creation-adr.md) | Processus de Création et Gestion des ADR | ✅ Accepté | 2025-11-21 |
| [001](./001-git-workflow-et-strategie-de-versioning.md) | Git Workflow et Stratégie de Versioning | ✅ Accepté | 2025-11-17 |
| [002](./002-azure-ad-service-principal-creation-manuelle.md) | Création Manuelle du Service Principal Azure AD | ✅ Accepté | 2025-11-27 |
| [003](./003-optimisation-recherche-vectorielle-rag.md) | Optimisation Recherche Vectorielle RAG | ✅ Accepté | 2025-11-26 |
| [004](./004-format-reponse-markdown-citations.md) | Format Réponse Markdown avec Citations | ✅ Accepté | 2025-11-26 |
| [005](./005-streaming-reponses-progressives.md) | Streaming des Réponses Progressives | ✅ Accepté | 2025-11-26 |
| [006](./006-bonnes-pratiques-instructions-agent.md) | Bonnes Pratiques Instructions Agent | ✅ Accepté | 2025-11-27 |
| [007](./007-deploiement-toolkit-cli.md) | Déploiement Microsoft 365 Agents Toolkit CLI | ✅ Accepté | 2025-11-27 |
| [008](./008-nomenclature-versions-tags.md) | Nomenclature Versions et Tags Git | ✅ Accepté | 2025-12-08 |
| [009](./009-gestion-noms-index-azure-search.md) | Gestion Noms Index Azure Search | ✅ Accepté | 2025-11-18 |
| [010](./010-securite-secrets-git.md) | Sécurité des Secrets dans l'Historique Git | ✅ Accepté | 2025-11-18 |
| [011](./011-configuration-centralisee.md) | Gestion Configuration Centralisée | 🔄 Proposé | 2025-11-21 |
| [012](./012-pratiques-developpement-toolkit.md) | Développement avec Microsoft 365 Agents Toolkit | ✅ Accepté | 2025-02-02 |
| [013](./013-systeme-logging-centralise.md) | Système de Logging Centralisé | ✅ Accepté | 2025-11-26 |
| [014](./014-message-bienvenue-adaptive-card.md) | Message de Bienvenue avec Adaptive Card | ✅ Accepté | 2025-11-26 |
| [015](./015-mapping-automatique-variables.md) | Mapping Automatique Variables Runtime | ✅ Accepté | 2025-12-04 |
| [016](./016-utilisation-emojis-icones-documentation.md) | Utilisation Émojis et Icônes dans Documentation | 🔄 Proposé | 2025-11-21 |
| [017](./017-nomenclature-scripts-bash.md) | Nomenclature Scripts Bash | ✅ Accepté | 2025-11-27 |
| [018](./018-git-bash-vscode-premier-caractere-tronque.md) | Git Bash VSCode Premier Caractère Tronqué | ✅ Accepté | 2025-11-27 |
| [019](./019-microsoft-365-agents-toolkit-bonnes-pratiques.md) | Microsoft 365 Agents Toolkit Bonnes Pratiques | ✅ Accepté | 2025-12-10 |
| [020](./020-validation-guidelines-microsoft-365-copilot.md) | Guidelines de Validation Microsoft 365 Copilot | ✅ Accepté | 2025-12-12 |
| [021](./021-nomenclature-resource-groups-azure.md) | Nomenclature Resource Groups Azure | ✅ Accepté | 2025-12-13 |
| [022](./022-architecture-custom-engine-agent.md) | Architecture Custom Engine Agent Microsoft 365 Copilot | ✅ Accepté | 2025-12-14 |

## Résumé des décisions clés

### ADR-000 : Processus de Création et Gestion des ADR

**Problème** : Le projet Légis Québec nécessite une documentation structurée des décisions architecturales importantes pour faciliter la compréhension et la traçabilité.

**Décision** : Adoption d'un processus formalisé de création et gestion des ADR basé sur le modèle Michael Nygard, adapté pour Légis Québec.

**Impact** : Documentation cohérente, traçabilité des décisions, facilite l'onboarding des nouveaux développeurs.

---

### ADR-001 : Git Workflow et Stratégie de Versioning

**Problème** : Besoin d'une stratégie claire de gestion de code source séparant développement, staging et production.

**Décision** : Adoption d'un Git Flow adapté avec trois niveaux de branches (`main` → `dev` → `utilisateur/feature-name`) et semantic versioning avec suffixes d'environnement (`-alpha`, `-beta`, `-rc`).

**Impact** : Séparation nette des phases de développement, traçabilité améliorée, possibilité de rollback facile, isolation complète par développeur.

---

## Processus de création d'un ADR

### Quand créer un ADR ?

Créez un ADR pour toute décision qui :

- ✅ Impacte l'architecture système de manière significative
- ✅ Nécessite de justifier des trade-offs entre plusieurs options
- ✅ Peut être remise en question plus tard ("Pourquoi avons-nous fait ça ?")
- ✅ Implique des conséquences importantes (positives ou négatives)

### Comment créer un ADR ?

1. **Numéroter** : Utiliser le prochain numéro séquentiel (ex: `006-titre-decision.md`)
2. **Structurer** : Suivre le format standard (Statut, Contexte, Décision, Conséquences, Alternatives)
3. **Justifier** : Expliquer le raisonnement, pas juste la conclusion
4. **Documenter alternatives** : Montrer que d'autres options ont été considérées
5. **Références** : Citer documentation, recherche, standards
6. **Réviser** : Faire relire par l'équipe avant acceptation
7. **Mettre à jour index** : Ajouter l'ADR à ce README

### Template ADR

Voir [adr-template.md](./adr-template.md) pour le template complet à copier lors de la création d'un nouvel ADR.

## Maintenance des ADR

### Statuts possibles

| Statut | Description |
|--------|-------------|
| **Proposé** | ADR en cours de discussion, pas encore accepté |
| **Accepté** | Décision validée et en application |
| **Déprécié** | Décision toujours en place mais à remplacer |
| **Superseded** | Remplacé par un nouvel ADR (indiquer lequel) |
| **Rejeté** | Décision proposée mais finalement rejetée |

### Révision des ADR

Les ADR sont **immutables** une fois acceptés. Si une décision doit être modifiée :

1. ❌ **Ne pas** modifier l'ADR original
2. ✅ Créer un **nouvel ADR** expliquant la nouvelle décision
3. ✅ Marquer l'ancien ADR comme **"Superseded by ADR-XXX"**
4. ✅ Mettre à jour l'index

### Historique des révisions

Chaque ADR maintient un tableau d'historique en bas du document :

```markdown
## Historique des révisions

| Date | Version | Changements | Auteur |
|------|---------|-------------|--------|
| 2025-11-17 | 1.0 | Création initiale | GitHub Copilot |
| 2025-12-01 | 1.1 | Clarification section X | Équipe |
```

## Références

### Ressources ADR

- [Michael Nygard - Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR GitHub Organization](https://adr.github.io/)
- [Architecture Decision Records (Book)](https://www.oreilly.com/library/view/architecture-decision-records/9781492090038/)

### Outils ADR

- [adr-tools](https://github.com/npryce/adr-tools) - CLI pour gérer ADR
- [log4brains](https://github.com/thomvaill/log4brains) - ADR avec UI web
- [ADR Manager](https://marketplace.visualstudio.com/items?itemName=ks89.vscode-adr-manager) - Extension VS Code

## Contact

Pour questions sur les ADR ou propositions de nouvelles décisions architecturales :

- **Projet** : Légis Québec – Conseiller Juridique Virtuel
- **Développeur** : Cotechnoe inc.
- **Repository** : [chatbottez-legis-qc](https://github.com/michel-heon/chatbottez-legis-qc)
- **Process** : Créer une issue GitHub avec label `adr-proposal`

---

*Dernière mise à jour : 2025-12-14*
