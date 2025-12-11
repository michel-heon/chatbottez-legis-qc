# ADR 021: Nomenclature des Versions et Tags Git

## Statut

✅ Accepté

## Date

2025-12-08

## Contexte

Le projet Légis Québec nécessite une nomenclature claire et descriptive pour les versions Git afin de :
- Faciliter l'identification rapide du contenu d'une version
- Améliorer la traçabilité des fonctionnalités et corrections
- Permettre une meilleure communication entre les membres de l'équipe
- Faciliter la recherche et la navigation dans l'historique Git
- Assurer une cohérence avec les pratiques de versioning sémantique

Auparavant, les tags utilisaient uniquement un numéro de version (ex: `v1.2.8`), ce qui ne permettait pas d'identifier rapidement le contenu de la version sans consulter les détails du tag ou l'historique des commits.

**Problèmes identifiés :**
- Difficulté à retrouver une version spécifique basée sur une fonctionnalité
- Communication imprécise lors des déploiements
- Manque de documentation intégrée dans l'historique Git
- Confusion entre versions mineures et patches

## Décision

Nous adoptons la nomenclature suivante pour les tags de version Git :

```
v{MAJOR}.{MINOR}.{PATCH}-{descripteur-signifiant}
```

### Format

- **v** : Préfixe obligatoire pour tous les tags de version
- **{MAJOR}.{MINOR}.{PATCH}** : Numéro de version sémantique (SemVer 2.0.0)
- **-** : Séparateur entre le numéro et le descripteur
- **{descripteur-signifiant}** : Texte court décrivant les principales fonctionnalités de la version

### Règles pour le Descripteur

1. **Langue** : Anglais (cohérence avec le code et Git)
2. **Format** : kebab-case (mots en minuscules séparés par des tirets)
3. **Longueur** : 2-4 mots maximum pour rester concis
4. **Contenu** : Focus sur les fonctionnalités majeures ou le thème de la version
5. **Exemples valides** :
   - `azure-openai-integration`
   - `teams-adaptive-cards`
   - `search-optimization`
   - `auth-improvements`
   - `database-migration`
   - `bugfixes-security`

### Versioning Sémantique (SemVer)

Nous suivons les principes du [Semantic Versioning 2.0.0](https://semver.org/) :

- **MAJOR** (X.0.0) : Changements incompatibles avec les versions précédentes (breaking changes)
  - Exemple : Migration vers une nouvelle version d'API, changement de structure de données
- **MINOR** (0.X.0) : Ajout de fonctionnalités rétrocompatibles
  - Exemple : Nouvelle fonctionnalité de recherche, ajout d'un endpoint API
- **PATCH** (0.0.X) : Corrections de bugs rétrocompatibles
  - Exemple : Correction de bug, optimisation de performance

### Structure du Message de Tag

Chaque tag annoté doit inclure un message structuré suivant ce template :

```markdown
Version {VERSION} - {Titre Descriptif}

Description courte de la release.

## New Features
- Liste des nouvelles fonctionnalités
- Organisées par catégories si nécessaire

## Technical Improvements
- Améliorations techniques
- Refactoring
- Optimisations

## Bug Fixes
- Liste des corrections de bugs
- Référence aux issues GitHub si applicable

## Breaking Changes
- Liste des changements incompatibles
- Instructions de migration si nécessaire
- "None" si aucun changement incompatible

## Dependencies
- Changements de dépendances
- Nouvelles dépendances ajoutées
- Mises à jour de versions
- "No dependency changes" si aucun changement

## Files Modified
- Liste des principaux fichiers modifiés (optionnel)
- Focus sur les fichiers critiques
```

## Conséquences

### Positives ✅

- **Lisibilité améliorée** : Identification immédiate du contenu d'une version
- **Communication facilitée** : Partage plus clair entre développeurs, testeurs et ops
- **Documentation intégrée** : L'historique Git devient auto-documenté
- **Recherche simplifiée** : Trouver facilement une version par fonctionnalité (`git tag -l "*search*"`)
- **Professionnalisme** : Apparence mature du projet
- **Traçabilité** : Meilleure compréhension de l'évolution du projet
- **Déploiements** : Identification claire des versions déployées en production

### Négatives ⚠️

- **Tags plus longs** : Nécessite plus de caractères lors des références
- **Effort supplémentaire** : Réflexion nécessaire pour choisir le descripteur
- **Discipline requise** : L'équipe doit suivre la convention systématiquement
- **Apprentissage** : Formation nécessaire pour les nouveaux membres de l'équipe

### Mitigations

- Utiliser des descripteurs courts (2-4 mots max)
- Documenter des exemples dans cet ADR et le README
- Réviser la nomenclature en code review
- Créer un script d'aide pour générer les tags (`scripts/version-update.sh`)
- Utiliser des alias Git pour simplifier les commandes
- Automatiser la validation du format via Git hooks (optionnel)

## Alternatives Considérées

### Alternative 1: Continuer avec le format simple `v{MAJOR}.{MINOR}.{PATCH}`

**Description** : Garder uniquement les numéros de version sans descripteur

**Rejetée parce que** :
- Ne permet pas d'identifier rapidement le contenu d'une version
- Nécessite de consulter les logs ou le CHANGELOG
- Moins intuitif pour les nouveaux membres de l'équipe
- Ne correspond pas aux pratiques modernes de versioning

### Alternative 2: Utiliser des dates `v2025.12.08`

**Description** : Versioning basé sur les dates (CalVer)

**Rejetée parce que** :
- Ne communique pas l'impact des changements (breaking vs. feature vs. fix)
- Moins adapté pour un projet à évolution fonctionnelle
- Incompatible avec SemVer utilisé par npm et les dépendances
- Confusion pour les utilisateurs habitués à SemVer

### Alternative 3: Descripteur en préfixe `scheduler-v1.2.9`

**Description** : Mettre le descripteur avant le numéro de version

**Rejetée parce que** :
- Casse le tri chronologique par défaut de Git
- Non conforme aux standards de versioning
- Difficile à parser automatiquement
- Incompatible avec les outils de gestion de versions

## Implémentation

### Phase 1: Adoption du Standard ✅

- [x] Rédaction de cet ADR
- [x] Documentation des exemples
- [x] Communication à l'équipe

### Phase 2: Outillage

- [ ] Créer/mettre à jour le script `scripts/version-update.sh`
- [ ] Ajouter des exemples dans le README.md
- [ ] Créer des alias Git dans `.gitconfig` (optionnel)
- [ ] Documenter le workflow dans le guide de contribution

### Phase 3: Application (En cours)

- [ ] Appliquer à toutes les nouvelles versions
- [ ] Former les nouveaux contributeurs
- [ ] Réviser en retrospective après 3 mois

## Exemples Pratiques

### Exemple 1: Version avec Nouvelles Fonctionnalités

```bash
git tag -a v1.3.0-azure-openai-integration -m "Version 1.3.0 - Azure OpenAI Integration

Integration of Azure OpenAI Service with GPT-4 support.

## New Features
- Azure OpenAI Service integration
- GPT-4 model support
- Dynamic model selection
- Token usage tracking

## Technical Improvements
- Refactored API client for better error handling
- Added retry logic with exponential backoff
- Improved logging for API calls

## Bug Fixes
- Fixed token counting for long conversations

## Breaking Changes
None

## Dependencies
- Added @azure/openai ^1.0.0
- Updated @microsoft/teams-ai to ^1.5.0"

git push origin v1.3.0-azure-openai-integration
```

### Exemple 2: Version de Correctifs

```bash
git tag -a v1.3.1-bugfixes-security -m "Version 1.3.1 - Bug Fixes & Security Patches

Critical bug fixes and security updates.

## Bug Fixes
- Fixed authentication token expiration handling
- Corrected timezone issues in conversation timestamps
- Resolved memory leak in long-running sessions

## Technical Improvements
- Enhanced error logging
- Improved session cleanup

## Breaking Changes
None

## Dependencies
- Updated jsonwebtoken to ^9.0.2 (security fix)"

git push origin v1.3.1-bugfixes-security
```

### Exemple 3: Version Majeure avec Breaking Changes

```bash
git tag -a v2.0.0-cosmos-db-migration -m "Version 2.0.0 - Cosmos DB Migration

Major migration from Azure Storage to Cosmos DB.

## New Features
- Cosmos DB integration for conversation storage
- Improved query performance
- Better data consistency

## Breaking Changes
⚠️ REQUIRES MIGRATION
- Configuration format changed (see docs/migration/cosmos-db.md)
- Environment variables updated (BOT_COSMOS_* instead of BOT_STORAGE_*)
- Data migration script required

## Migration Guide
1. Run migration script: npm run migrate:cosmos
2. Update environment variables (see env/.env.example)
3. Test in dev environment before production

## Dependencies
- Added @azure/cosmos ^4.0.0
- Removed azure-storage ^2.10.7"

git push origin v2.0.0-cosmos-db-migration
```

## Workflow de Création de Tags

1. **Compléter le travail** : S'assurer que tous les commits nécessaires sont faits
2. **Vérifier l'état Git** : `git status` doit être propre (pas de modifications non committées)
3. **Déterminer le numéro de version** :
   - MAJOR : Breaking changes
   - MINOR : Nouvelles fonctionnalités
   - PATCH : Bug fixes uniquement
4. **Choisir le descripteur** : 2-4 mots décrivant le thème principal
5. **Préparer le message** : Utiliser le template structuré
6. **Créer le tag annoté** :
   ```bash
   git tag -a v{VERSION}-{descripteur} -m "Message complet"
   # ou avec un fichier
   git tag -a v{VERSION}-{descripteur} -F message.txt
   ```
7. **Vérifier le tag** : `git show v{VERSION}-{descripteur}`
8. **Pousser le tag** : `git push origin v{VERSION}-{descripteur}`

## Commandes Utiles

```bash
# Lister les tags avec leurs messages (3 premières lignes)
git tag -n3

# Afficher les détails complets d'un tag
git show v1.3.0-azure-openai-integration

# Lister les derniers 5 tags
git tag -l | tail -5

# Rechercher des tags par mot-clé
git tag -l "*azure*"
git tag -l "*bugfix*"

# Supprimer un tag local (en cas d'erreur)
git tag -d v1.3.0-azure-openai-integration

# Supprimer un tag distant (à utiliser avec précaution)
git push origin --delete v1.3.0-azure-openai-integration

# Créer une release GitHub depuis un tag
# (via l'interface GitHub ou gh CLI)
gh release create v1.3.0-azure-openai-integration --notes-file CHANGELOG.md
```

## Références

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Git Tagging Best Practices](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- ADR-001: Git Workflow et Stratégie de Versioning
- ADR-015: Nomenclature Scripts Bash

## Notes

- Cette nomenclature s'applique uniquement aux **tags Git** (releases publiques)
- Les **branches** suivent une nomenclature différente (feature/, bugfix/, hotfix/)
- Les **commits** suivent les Conventional Commits (feat:, fix:, docs:, etc.)
- Le descripteur peut être omis pour les versions de patch très mineurs si le message du tag est suffisamment explicite
- Pour les hotfixes urgents, préférer un descripteur simple comme `hotfix-critical`
- Les tags doivent être **annotés** (`-a`) plutôt que légers pour inclure les métadonnées
- Synchroniser avec le `package.json` version lors de la création du tag

---

**Auteur** : Équipe UQAM Recherche  
**Dernière mise à jour** : 2025-12-08  
**Prochaine révision** : 2026-03-08 (3 mois après adoption)
