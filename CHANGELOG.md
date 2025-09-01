# CHANGELOG

## [v4.0.0-index-configurator] - 2025-09-01

### 🎯 Changements majeurs (BREAKING CHANGES)

#### Refactorisation complète de l'architecture Java
- **Migration du package** : `com.cotechnoe.teamsrag.legisqc` → `com.cotechnoe.teamsrag.indexconfigurator`
- **Suppression de l'ancienne architecture** : 25+ classes réduites à 5 classes essentielles
- **Nouvelle mission focalisée** : Génération automatique de fichiers TypeScript à partir d'Azure Search

#### Architecture Java refactorisée
- `AzureSearchConfigGenerator` - CLI principal pour orchestration
- `AzureSearchIndexReader` - Lecture dynamique de structure d'index Azure
- `TypeScriptGenerator` - Générateur unifié (simple + avancé)
- `IndexSchema` & `FieldDefinition` - Modèles de données immutables

### ✨ Nouvelles fonctionnalités

#### TypeScriptGenerator unifié intelligent
- **Mode simple** : Remplacement de placeholders (`// GENERATED_FIELDS_PLACEHOLDER`)
- **Mode avancé** : Mise à jour entre marqueurs START/END avec préservation de logique métier
- **Détection automatique** du mode selon le contenu du template
- **Backup automatique** uniquement en mode avancé
- **Support complet** des fichiers `azureAISearchDataSource.ts`, `setup.ts`, `utils.ts`

#### Intégration Makefile avancée
- `azure-config-generate` - Génération TypeScript de base
- `azure-config-generate-enhanced` - Génération avec préservation métier
- `typescript-generate-complete` - Workflow complet
- `java-test-tdd` - Tests TDD pour générateurs
- `azure-config-workflow` - Pipeline de génération et validation

#### Développement TDD strict
- **31 tests JUnit 5** complets avec couverture exhaustive
- Tests d'intégration Makefile validés
- Tests de génération TypeScript (simple et avancée)
- Gestion complète des cas limites et exceptions

### 🔧 Améliorations techniques

#### Qualité du code
- Architecture SOLID respectée
- Injection de dépendances
- Immutabilité privilégiée
- Gestion d'erreurs spécifiques (`AzureSearchConnectionException`)

#### Compatibilité
- Java 17 + Maven
- Compatibilité Eclipse maintenue
- Environnement Linux optimisé

### 📚 Documentation

#### Nouvelle documentation
- `copilot-instructions.md` - Instructions IA focalisées sur le projet
- Documentation README.md mise à jour avec nouvelle architecture
- Guides d'utilisation des nouvelles cibles Makefile

#### Guides existants mis à jour
- `docs/azure-search-config-generator.md` - Guide complet du générateur
- `docs/azure-search-management.md` - Gestion d'index mise à jour

### 🗑️ Suppressions (Ménage)

#### Classes Java supprimées
- `LegisQcApplication` - Classe principale obsolète
- `TemplateBasedGenerator` - Remplacé par TypeScriptGenerator unifié
- `EnhancedTypeScriptGenerator` - Fusionné dans TypeScriptGenerator
- `RevisionResult` - Non essentiel
- Anciens tests du package `legisqc` (supprimés)

#### Simplification
- Suppression de la duplication de code
- Élimination des classes non-essentielles
- Focus sur la mission principale : génération TypeScript

### 🎯 Impact

#### Pour les développeurs
- **API simplifiée** : 5 classes au lieu de 25+
- **Tests TDD complets** : Développement sécurisé
- **Documentation claire** : Focalisée sur l'essentiel

#### Pour les utilisateurs
- **Génération automatique** : Plus de synchronisation manuelle
- **Préservation métier** : Logique existante protégée
- **Workflow intégré** : Makefile simplifié

### 🔄 Migration

#### Depuis v3.0.0
1. **Package Java** : Migrer de `legisqc` vers `indexconfigurator`
2. **Classes principales** : Utiliser `AzureSearchConfigGenerator` et `TypeScriptGenerator`
3. **Cibles Makefile** : Utiliser `azure-config-generate` et variantes
4. **Tests** : Exécuter `make java-test-tdd` pour validation

### 📋 Notes techniques

- Tous les tests passent (31/31) ✅
- Compatibilité Maven maintenue ✅
- Architecture TDD respectée ✅
- Documentation synchronisée ✅