# ADR 001: Git Workflow et Stratégie de Versioning

## Statut

✅ Accepté

## Date

2025-11-17

## Contexte
Le projet UQAM-GPT nécessite une stratégie de gestion de code source qui permette de :
- Séparer clairement les phases de développement, intégration et production
- Faciliter les tests et validations avant déploiement
- Maintenir un historique clair des releases
- Permettre des rollbacks rapides en cas de problème
- Gérer plusieurs développeurs travaillant en parallèle

Le repository existe déjà avec une structure de branches (`main`, `dev`, `feature/*`), mais sans convention formelle de workflow et de versioning.

## Décision

### 1. Structure des branches (Git Flow adapté)

Nous adoptons une structure Git Flow simplifiée avec trois niveaux de branches :

```
main (production)
  ↑
dev (intégration/staging)
  ↑
utilisateur/feature-name (développement)
```

#### **Branche `main`**
- **Rôle** : Production stable uniquement
- **Protection** : Protégée, merges uniquement depuis `dev`
- **Déploiement** : Automatique vers environnement de production
- **Tags** : Versions stables (ex: `v1.0.0`, `v2.0.0`)

#### **Branche `dev`**
- **Rôle** : Intégration et tests de validation
- **Protection** : Protégée, merges depuis branches personnelles
- **Déploiement** : Environnement de staging/test
- **Tags** : Release candidates (ex: `v1.0.0-rc1`, `v1.1.0-dev`)

#### **Branches personnelles `utilisateur/feature-name`**

**⭐ DÉCISION CLÉ : Préfixe utilisateur obligatoire**

Au lieu du pattern standard `feature/nom`, nous utilisons `utilisateur/feature-name` :

- **Rôle** : Développement actif de nouvelles fonctionnalités
- **Nomenclature** : `utilisateur/description-courte`
  - ✅ `michel-heon/rag-optimization`
  - ✅ `jane-doe/markdown-citations`
  - ❌ `feature/rag-optimization` (ÉVITER)

**Avantages clés :**

1. **Isolation complète** : Chaque développeur travaille dans son espace
2. **Zéro conflit de noms** : Impossible que 2 devs créent la même branche
3. **Traçabilité instantanée** : `git branch -r` montre qui travaille sur quoi
4. **Collaboration flexible** : Facile de créer une branche partagée si besoin (`equipe/feature`)
5. **Permissions granulaires** : Possible de configurer protections par utilisateur

**Exemple concret :**

```bash
# Michel travaille sur RAG
git checkout -b michel-heon/rag-optimization

# Jane travaille sur citations (en parallèle)
git checkout -b jane-doe/markdown-citations

# Aucun conflit, aucune confusion! ✅
```

- **Cycle de vie** : Créées depuis `dev`, mergées dans `dev`, supprimées après merge
- **Tags** : Versions alpha/beta (ex: `v1.0.0-alpha.1`, `v1.0.0-beta.2`)

### 2. Convention de versioning (SemVer adapté)

Nous adoptons le **Semantic Versioning 2.0.0** avec suffixes d'environnement :

```
v{MAJOR}.{MINOR}.{PATCH}[-{PRERELEASE}]
```

#### **Numérotation sémantique**
- **MAJOR** : Changements incompatibles (breaking changes)
- **MINOR** : Nouvelles fonctionnalités compatibles
- **PATCH** : Corrections de bugs

#### **🎯 Arbre de décision rapide**

**Question 1 : Sur quelle branche êtes-vous ?**
```
┌─ Branche personnelle (nom/feature) ?
│  └─> Format: v{X}.{Y}.{Z}-alpha.{n}-{mot-clé}  ✅ OBLIGATOIRE
│
├─ Branche dev ?
│  ├─> Release candidate? → v{X}.{Y}.{Z}-rc{n}
│  └─> Snapshot intégration? → v{X}.{Y}.{Z}-dev-{mot-clé}
│
└─ Branche main ?
   └─> Format: v{X}.{Y}.{Z}  (aucun suffixe)
```

**Question 2 : Quelle phase de développement ?**
```
┌─ Développement actif (code en cours) ?
│  └─> Utiliser: -alpha.{n}-{mot-clé}
│
├─ Tests internes (feature complète) ?
│  └─> Utiliser: -beta.{n}-{mot-clé}
│
├─ Prêt pour staging (merge vers dev imminent) ?
│  └─> Utiliser: -rc{n}
│
└─ Prêt pour production (merge vers main) ?
   └─> Utiliser: v{X}.{Y}.{Z} (sans suffixe)
```

#### **Suffixes par environnement**

| Environnement | Suffixe | Exemple | Usage |
|---------------|---------|---------|-------|
| Branche personnelle (dev actif) | `-alpha.{n}-{mot-clé}` | `v1.1.0-alpha.1-azure-search-fix` | **OBLIGATOIRE** : Développement feature |
| Branche personnelle (tests internes) | `-beta.{n}-{mot-clé}` | `v1.0.0-beta.1-rag-tests` | **OBLIGATOIRE** : Tests feature complète |
| Branche `dev` (staging) | `-rc{n}` | `v1.0.0-rc1` | Release candidate (avant merge main) |
| Branche `dev` (intégration continue) | `-dev-{mot-clé}` | `v1.1.0-dev-teams-migration` | Snapshot intégration (optionnel) |
| Branche `main` (production) | Aucun | `v1.0.0` | **Production stable uniquement** |

**⭐ RÈGLE STRICTE : Mot-clé OBLIGATOIRE pour branches personnelles**

Pour les branches personnelles (`nom/feature`), le format **avec mot-clé est OBLIGATOIRE** :

✅ **FORMAT OBLIGATOIRE** :
```
v{MAJOR}.{MINOR}.{PATCH}-{alpha|beta}.{n}-{mot-clé-descriptif}
```

**Exemples conformes** :
- `v1.1.0-alpha.1-azure-search-fix` ✅ (branche personnelle, dev actif)
- `v1.2.0-alpha.2-markdown-citations` ✅ (branche personnelle, itération 2)
- `v1.3.0-beta.1-rag-optimization` ✅ (branche personnelle, phase tests)
- `v2.0.8-alpha.1-logging-system` ✅ (branche personnelle, nouvelle feature)

❌ **FORMATS NON CONFORMES** (à éviter absolument) :
- `v1.1.0-alpha.1` ❌ (manque mot-clé descriptif)
- `v1.2.0-alpha.2` ❌ (impossible d'identifier le contenu)
- `v1.1.0-logging` ❌ (manque numéro alpha/beta)
- `v1.1.0` ❌ (réservé production sur `main` uniquement)
- `v1.1.0-dev` ❌ (trop générique, manque mot-clé)

**Avantages** :
- 🔢 Numérotation séquentielle pour suivre l'ordre des releases (alpha/beta)
- 🔍 Identification rapide du contenu sans consulter l'historique
- 📋 Traçabilité améliorée dans les logs et releases
- 🤝 Communication facilitée entre développeurs
- 🏷️ Tags auto-documentés

### 3. Workflow de développement

#### **Cycle de vie d'une feature**

```bash
# 1. Créer une branche personnelle depuis dev
git checkout dev
git pull origin dev
git checkout -b michel-heon/rag-optimization

# 2. Développement avec tags alpha (numéro + mot-clé descriptif)
git commit -m "feat: implémentation recherche vectorielle k=50"
git tag -a v1.1.0-alpha.1-rag-optimization -m "Alpha: implémentation recherche vectorielle"
git push origin michel-heon/rag-optimization --tags

# 3. Tests internes avec tags beta
git commit -m "test: validation complète"
git tag -a v1.1.0-beta.1-rag-optimization -m "Beta: prêt pour tests"
git push --tags

# 4. Merge vers dev (via PR)
git checkout dev
git merge michel-heon/rag-optimization
git tag -a v1.0.0-rc1 -m "RC: prêt pour validation"
git push origin dev --tags

# 5. Après validation, merge vers main (via PR)
git checkout main
git merge dev
git tag -a v1.0.0 -m "Release: Production stable"
git push origin main --tags

# 6. Nettoyage
git branch -d michel-heon/rag-optimization
git push origin --delete michel-heon/rag-optimization
```

**Note** : Remplacez `michel-heon` par votre nom d'utilisateur GitHub pour vos propres branches.

#### **Hotfix en production**

```bash
# Créer depuis main
git checkout main
git checkout -b hotfix/correction-critique

# Fix et tag
git commit -m "fix: correction critique"
git tag -a v1.0.1 -m "Hotfix: correction urgente"

# Merge vers main ET dev
git checkout main
git merge hotfix/correction-critique
git push origin main --tags

git checkout dev
git merge hotfix/correction-critique
git push origin dev
```

### 4. Protection des branches

#### **Règles de protection `main`**
- ✅ Require pull request reviews (minimum 1)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Include administrators
- ❌ Direct pushes interdits

#### **Règles de protection `dev`**
- ✅ Require pull request reviews (optionnel)
- ✅ Require status checks to pass
- ⚠️ Direct pushes autorisés pour leads
- ✅ Delete branch on merge

### 5. Messages de commit (Conventional Commits)

Format standardisé pour génération automatique de changelogs :

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

**Types** :
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage, missing semi colons, etc.
- `refactor`: Refactoring sans changement de fonctionnalité
- `perf`: Amélioration de performance
- `test`: Ajout ou correction de tests
- `chore`: Maintenance, dépendances, configuration

**Exemple** :
```
feat(rag): recherche vectorielle exhaustive avec k=50

- Implémentation exhaustive=true pour précision maximale
- Augmentation de k de 5 à 50 documents
- Ajout de weight=1.0 pour priorisation

Refs: #123
```

## Conséquences

### Positives ✅
- **Clarté** : Séparation nette entre dev, staging et production
- **Sécurité** : Branches protégées évitent les erreurs
- **Traçabilité** : Tags sémantiques facilitent l'historique
- **Rollback** : Retour facile à une version stable
- **Collaboration** : Workflow standardisé pour toute l'équipe
- **Automatisation** : Base pour CI/CD

### Négatives ⚠️
- **Complexité initiale** : Courbe d'apprentissage pour l'équipe
- **Overhead** : Plus de branches et PRs à gérer
- **Discipline requise** : Nécessite respect strict des conventions

### Risques 🔴
- **Confusion tags** : Risque de tags mal nommés → Mitigé par documentation
- **Conflits merge** : Plus de merges → Mitigé par syncs fréquents
- **Features longues** : Branches feature anciennes → Mitigé par rebases réguliers

## Alternatives considérées

### 1. **Branches `feature/*` sans préfixe utilisateur**

```bash
feature/rag-optimization
feature/markdown-citations
```

**Avantages :**
- Nomenclature standard Git Flow
- Simplicité apparente

**Inconvénients :**
- ❌ **Conflits de noms** : Si 2 développeurs travaillent sur "rag-optimization"
- ❌ **Manque de traçabilité** : Qui travaille sur quelle branche?
- ❌ **Collaboration difficile** : Partager une `feature/*` entre plusieurs devs = conflits

**Verdict :** Rejeté en faveur de branches personnelles

---

### 2. **GitHub Flow (branch unique main)**

```bash
# Workflow simplifié
utilisateur/feature-name → main (directement)
```

**Avantages :**

- ✅ **Simplicité** : Moins de branches à gérer
- ✅ **Vélocité** : Déploiement continu rapide
- ✅ **Standard GitHub** : Workflow natif recommandé par GitHub
- ✅ **CI/CD friendly** : Parfait pour environnements automatisés

**Inconvénients :**

- ❌ **Pas de staging stable** : Nécessite environnements preview éphémères
- ❌ **CI/CD mature requis** : Tests automatisés complets obligatoires
- ❌ **Risqué sans tests** : Erreurs directement en production
- ❌ **Feature flags requis** : Pour fonctionnalités incomplètes

**Quand l'utiliser :**

- ✅ Équipe avec CI/CD très mature
- ✅ Tests automatisés couvrant >80% du code
- ✅ Déploiements multiples par jour acceptables
- ✅ Environnements preview automatiques disponibles
- ✅ Feature flags implémentés

**Workflow type :**

```bash
# 1. Créer feature
git checkout -b michel-heon/new-feature

# 2. Développement avec tests
npm test  # Doit passer à 100%

# 3. PR → main (après CI/CD green)
# GitHub Actions déploie automatiquement en preview

# 4. Merge → déploiement automatique en production
git checkout main
git merge michel-heon/new-feature
# → GitHub Actions déploie en production

# 5. Tag de release (optionnel)
git tag -a v2.1.1 -m "Release: Feature X"
```

**Verdict :** ✅ **Recommandé pour équipes avec CI/CD mature** - Alternative valide si votre infrastructure le permet. Considérer migration future quand CI/CD sera complet.

### 3. **Git Flow complet (avec release branches)**

- ❌ Rejeté : Trop complexe pour la taille de l'équipe
- ❌ Overhead inutile pour releases fréquentes

### 4. **Trunk-Based Development**

- ❌ Rejeté : Feature flags complexes
- ❌ Nécessite CI/CD très mature

### 5. **Fork-based workflow (GitHub standard)**

```bash
# Chaque développeur fork le repo
git clone https://github.com/michel-heon/uqam-gpt-postdoc-teams
git remote add upstream https://github.com/UQAM-RECHERCHE/uqam-gpt-postdoc-teams
```

**Avantages :**

- ✅ Isolation maximale
- ✅ Permissions granulaires

**Inconvénients :**

- ❌ **Complexité synchro** : Devoir gérer upstream/origin
- ❌ **Overhead CI/CD** : Chaque fork = setup distinct
- ❌ **Permissions** : Devs doivent avoir accès au repo principal anyway

**Verdict :** Rejeté - Branches personnelles suffisent pour équipe de taille moyenne

## Implémentation

### Phase 1 : Configuration (Immédiat)

- [x] Créer ADR
- [ ] Configurer protection branches GitHub
- [ ] Documenter workflow dans README
- [ ] Créer templates PR

### Phase 2 : Migration (Semaine 1)

- [ ] Merger features existantes vers dev
- [ ] Créer tags de référence
- [ ] Former l'équipe au workflow

### Phase 3 : Automatisation (Semaine 2-3)

- [ ] Configurer GitHub Actions pour CI
- [ ] Automatiser déploiements par branche
- [ ] Générer changelogs automatiquement

## Références

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Git Flow (Atlassian)](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [ADR Template (Michael Nygard)](https://github.com/joelparkerhenderson/architecture-decision-record)

## Historique des révisions

| Date | Version | Changements | Auteur |
|------|---------|-------------|--------|
| 2025-11-17 | 1.0 | Création initiale | GitHub Copilot |
| 2025-11-21 | 1.1 | Ajout alternative GitHub Flow avec recommandations | GitHub Copilot |
