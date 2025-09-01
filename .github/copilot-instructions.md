# Copilot Instructions - Projet legis-qc

## 🎯 Mission Spécifique de cette Étape
Construire un **générateur automatique de programmes TypeScript** qui produit les fichiers cibles :
- `./src/app/azureAISearchDataSource.ts`
- `./src/indexers/setup.ts`  
- `./src/indexers/utils.ts`

à partir des **images sources** contenues dans `./src/main/resources/teams-src/`, en se basant sur la structure réelle de l'index Azure Search accessible via les références playground.

## 🔄 Processus de Génération

### 1. Lecture de la Structure Azure Search
- Utiliser les variables d'environnement playground
- Analyser dynamiquement le schéma de l'index (champs, types, propriétés)
- Extraire les métadonnées : champs clés, recherchables, vectoriels

### 2. Traitement des Templates Source
- Localiser les templates dans `/src/main/resources/teams-src/`
- Identifier le mode de génération :
  - **Mode Simple** : remplacement de placeholders (`// GENERATED_FIELDS_PLACEHOLDER`)
  - **Mode Avancé** : mise à jour entre marqueurs START/END avec préservation logique métier
- Appliquer les transformations selon la structure Azure Search détectée

### 3. Génération des Fichiers Cibles
- Produire `azureAISearchDataSource.ts` avec interface TypeScript typée
- Générer `setup.ts` adapté aux champs de l'index
- Créer `utils.ts` avec fonctions spécialisées
- Synchroniser parfaitement avec la structure Azure Search réelle

## 📋 Règles de Développement

### TDD Strict (Red-Green-Refactor)
```java
// 1. RED - Écrire un test qui échoue
@Test
@DisplayName("should generate azureAISearchDataSource.ts from template")
void shouldGenerateAzureAISearchDataSourceFromTemplate() {
    // Given
    IndexSchema schema = createMockSchema();
    Path templateDir = Path.of("src/main/resources/teams-src");
    
    // When & Then
    assertThat(generator.generateDataSource(schema, templateDir))
        .contains("export interface MyDocument")
        .contains("docId?: string");
}

// 2. GREEN - Implémentation minimale
public String generateDataSource(IndexSchema schema, Path templateDir) {
    // Implémentation minimale pour faire passer le test
}

// 3. REFACTOR - Améliorer sans casser les tests
```

### Architecture Focalisée
```
com.cotechnoe.teamsrag.indexconfigurator/
├── AzureSearchConfigGenerator.java     # CLI + orchestration
├── azure/
│   └── AzureSearchIndexReader.java     # Lecture structure Azure Search
├── generator/
│   └── TypeScriptGenerator.java        # Génération templates → cibles
└── model/
    ├── IndexSchema.java                # Modèle structure index
    └── FieldDefinition.java            # Définition champ index
```

### Tests Spécialisés
- **Tests de lecture Azure Search** : validation métadonnées, gestion erreurs
- **Tests de génération** : templates → TypeScript, modes simple/avancé
- **Tests d'intégration** : workflow complet avec Azure Search réel
- **Tests de synchronisation** : cohérence structure index ↔ code généré

## 🛠️ Spécifications Techniques

### Templates Source (Input)
```
./src/main/resources/teams-src/
├── azureAISearchDataSource.template.ts
├── setup.template.ts
└── utils.template.ts
```

### Fichiers Cibles (Output)
```
./src/app/azureAISearchDataSource.ts        # Interface + configuration
./src/indexers/setup.ts                     # Script setup index
./src/indexers/utils.ts                     # Fonctions utilitaires
```

### Modes de Génération
1. **Mode Simple** : Remplacement direct de placeholders
2. **Mode Avancé** : Préservation logique métier entre marqueurs

### Variables Playground
```bash
AZURE_SEARCH_ENDPOINT=https://search-cotechnoe-ai.search.windows.net
SECRET_AZURE_SEARCH_KEY=***
AZURE_SEARCH_INDEX_NAME=legis-qc-index-01
```

## 🧪 Stratégie de Tests

### Tests Unitaires (59 tests)
- Logique métier pure avec mocks
- Validation templates et transformation
- Gestion cas limites (index vide, champs manquants)

### Tests d'Intégration (8 tests)
- Connexion Azure Search réelle
- Workflow complet de génération
- Validation fichiers générés

### Couverture Obligatoire
- ✅ Lecture structure Azure Search
- ✅ Transformation templates → TypeScript
- ✅ Préservation logique métier (mode avancé)
- ✅ Synchronisation index ↔ code
- ✅ Gestion erreurs (connexion, authentification)

## 📦 Intégration Makefile

### Cibles Principales
```makefile
azure-config-generate              # Génération de base
azure-config-generate-enhanced     # Mode avancé avec préservation
typescript-generate-complete       # Workflow complet
azure-config-validate             # Validation configuration
java-test-tdd                      # Tests TDD spécialisés
```

## 🎯 Objectif Final
Produire un **générateur fiable et automatisé** qui maintient une synchronisation parfaite entre la structure de l'index Azure Search et les fichiers TypeScript du chatbot, tout en préservant la logique métier existante lors des mises à jour.