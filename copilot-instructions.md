# Copilot Instructions - Projet legis-qc

## Mission du projet
Développer un utilitaire Java (`indexconfigurator`) qui génère automatiquement les fichiers TypeScript (azureAISearchDataSource.ts, setup.ts, utils.ts) à partir des templates dans `/src/main/resources/teams-src/` et de la structure réelle de l'index Azure Search configuré dans playground.

## Règles de développement

### 1. Langage et build
- **Java 17** exclusivement
- Build avec **Maven** (pom.xml existant)
- Package principal : `com.cotechnoe.teamsrag.indexconfigurator`

### 2. Workflow TDD strict
- **TOUJOURS** écrire les tests qui échouent en premier (RED)
- Puis implémentation minimale pour faire passer les tests (GREEN)
- Enfin refactorisation en gardant les tests verts (REFACTOR)
- Jamais d'implémentation sans test préalable

### 3. Architecture du projet
- Classes essentielles uniquement :
  - `AzureSearchConfigGenerator` (CLI principal)
  - `AzureSearchIndexReader` (lecture index Azure)
  - `TypeScriptGenerator` (génération unifiée)
  - `IndexSchema` et `FieldDefinition` (modèles)
- Éviter la sur-ingénierie : rester focus sur la mission

### 4. Tests (JUnit 5 + Mockito + AssertJ)
- Nommage : `ClassNameTest`
- Couvrir les cas limites (null, vide, exceptions)
- Tests d'intégration pour les composants critiques
- Tests de validation des templates et génération TypeScript

### 5. Sources et templates
- Templates source : `/src/main/resources/teams-src/`
- Fichiers cibles : `azureAISearchDataSource.ts`, `setup.ts`, `utils.ts`
- Support des deux modes :
  - Simple : placeholders (`// GENERATED_FIELDS_PLACEHOLDER`)
  - Avancé : marqueurs START/END (préservation logique métier)

### 6. Configuration Azure
- Variables d'environnement playground pour accès Azure Search
- Lecture dynamique de la structure d'index
- Génération synchronisée avec l'index réel

### 7. Qualité du code
- Immutabilité privilégiée
- Fonctions pures et petites
- Principes SOLID
- Injection de dépendances
- Gestion d'erreurs spécifiques (`AzureSearchConnectionException`)

### 8. Contraintes techniques
- Compatibilité Linux + Eclipse
- Utiliser les bibliothèques standard Java
- Si nouvelles dépendances : fournir snippet Maven
- Éviter les bibliothèques non-essentielles

### 9. Documentation
- Commentaires minimaux
- JavaDoc uniquement sur APIs publiques
- Focus sur la lisibilité du code

### 10. Intégration Makefile
- Cibles : `azure-config-generate`, `azure-config-generate-enhanced`
- Tests TDD : `java-test-tdd`
- Validation CLI : `azure-cli-validate`

## Objectif final
Permettre la génération automatique et synchronisée des fichiers TypeScript du chatbot Legis QC à partir de la structure réelle de l'index Azure Search, en préservant la logique métier existante.