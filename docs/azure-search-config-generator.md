# Azure Search Configuration Generator

## Vue d'ensemble

L'utilitaire **Azure Search Configuration Generator** permet de lire automatiquement la structure d'un index Azure Search déployé et de générer les fichiers TypeScript correspondants pour le chatbot Legis QC. Cet outil suit les principes TDD (Test-Driven Development) et garantit une synchronisation parfaite entre l'index Azure Search et le code TypeScript.

## Architecture

```mermaid
graph TB
    subgraph "Environnement Playground"
        ENV[".env.playground.user"]
        ENV --> |SECRET_AZURE_SEARCH_KEY| AZ[Azure Search Index]
        ENV --> |AZURE_SEARCH_ENDPOINT| AZ
        ENV --> |AZURE_SEARCH_INDEX_NAME| AZ
    end
    
    subgraph "Utilitaire Java"
        CLI[AzureSearchConfigGenerator]
        READER[AzureSearchIndexReader]
        SCHEMA[IndexSchema]
        GENERATOR[TypeScriptGenerator]
        
        CLI --> READER
        READER --> |lit métadonnées| AZ
        READER --> SCHEMA
        SCHEMA --> GENERATOR
    end
    
    subgraph "Fichiers générés"
        DS[azureAISearchDataSource.ts]
        SETUP[setup.ts]
        UTILS[utils.ts]
        
        GENERATOR --> DS
        GENERATOR --> SETUP
        GENERATOR --> UTILS
    end
    
    subgraph "Intégration Teams"
        CONFIG[config.ts]
        APP[app.ts]
        
        DS --> APP
        CONFIG --> APP
    end
```

## Fonctionnalités

### ✅ Lecture automatique des métadonnées
- Connexion sécurisée à Azure Search avec les clés du playground
- Analyse complète du schéma d'index (champs, types, propriétés)
- Détection automatique des champs clés, recherchables et vectoriels
- Gestion robuste des erreurs (index inexistant, authentification, etc.)

### ✅ Génération TypeScript intelligente
- **Interface TypeScript** typée selon le schéma réel
- **Configuration AzureAISearchDataSource** optimisée
- **Scripts de setup** adaptés aux champs détectés
- **Fonctions utilitaires** spécialisées

### ✅ Tests complets (67 tests)
- **Tests unitaires** (59) : Logique métier pure avec mocks
- **Tests d'intégration** (8) : Validation avec Azure Search réel
- **Couverture complète** : Edge cases, validation, gestion d'erreurs

## Structure du code

```mermaid
classDiagram
    class AzureSearchConfigGenerator {
        +main(args) void
        +create(endpoint, apiKey) AzureSearchConfigGenerator
        +generateConfig(indexName, outputDir) void
        -loadEnvironmentVariables() void
        -validateParameters(indexName, outputDir) void
    }
    
    class AzureSearchIndexReader {
        -endpoint: String
        -apiKey: String
        -searchIndexClient: SearchIndexClient
        +create(endpoint, apiKey) AzureSearchIndexReader
        +readIndexSchema(indexName) IndexSchema
        -convertToFieldDefinition(azureField) FieldDefinition
        -validateConnection() void
    }
    
    class IndexSchema {
        -indexName: String
        -fields: List~FieldDefinition~
        +create(indexName, fields) IndexSchema
        +getSearchableFields() List~FieldDefinition~
        +getVectorFields() List~FieldDefinition~
        +getKeyField() Optional~FieldDefinition~
        +getSelectableFields() List~FieldDefinition~
    }
    
    class FieldDefinition {
        -name: String
        -type: String
        -key: boolean
        -retrievable: boolean
        -searchable: boolean
        -filterable: boolean
        -sortable: boolean
        -facetable: boolean
        +create(name, type, properties) FieldDefinition
        +isVectorField() boolean
        +getTypeScriptType() String
        +isSearchable() boolean
        +isRetrievable() boolean
    }
    
    class TypeScriptGenerator {
        +generateFiles(schema, outputDir) void
        +generateInterface(schema) String
        +generateDataSourceConfig(schema) String
        +generateSetupScript(schema) String
        +generateUtilsFile(schema) String
        -generateSimpleMode(template, schema) String
        -generateEnhancedMode(template, schema) String
        -detectGenerationMode(templateContent) GenerationMode
        -createBackup(filePath) void
    }
    
    AzureSearchConfigGenerator --> AzureSearchIndexReader
    AzureSearchConfigGenerator --> TypeScriptGenerator
    AzureSearchIndexReader --> IndexSchema
    IndexSchema --> FieldDefinition
    TypeScriptGenerator --> IndexSchema
```

## Variables d'environnement requises

L'utilitaire utilise les variables définies dans `env/.env.playground.user` :

```bash
# Authentification Azure Search
SECRET_AZURE_SEARCH_KEY=YDcIo6Do1dEXTwLXEcuXLCdEQMELiXn3Q7HDhwrxEAAzSeD3CIr6
AZURE_SEARCH_ENDPOINT=https://search-cotechnoe-ai.search.windows.net
AZURE_SEARCH_INDEX_NAME=legis-qc-index-01

# Authentification Azure OpenAI (pour les embeddings)
SECRET_AZURE_OPENAI_API_KEY=2ad1VT9CKCOgRAetxF9BCE03VfYrDIZ0L95KRB7IFaZFu4gW9nebJQQJ99BAACHYHv6XJ3w3AAABACOGsefB
AZURE_OPENAI_ENDPOINT=https://openai-cotechnoe.openai.azure.com/
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002
```

## Utilisation

### Via Makefile (recommandé)

```bash
# Génération complète avec l'index playground
make azure-config-generate

# Génération avec index spécifique
make azure-config-generate INDEX_NAME=mon-index

# Validation de la configuration
make azure-config-validate

# Tests d'intégration avec Azure Search réel
make azure-config-test-integration
```

### Via Java directement

```bash
# Compilation
mvn compile

# Exécution avec variables playground
java -cp target/classes:$(mvn dependency:build-classpath -q -Dmdep.outputFile=/dev/stdout) \
  com.cotechnoe.teamsrag.indexconfigurator.AzureSearchConfigGenerator

# Avec paramètres personnalisés
java -cp target/classes:$(mvn dependency:build-classpath -q -Dmdep.outputFile=/dev/stdout) \
  com.cotechnoe.teamsrag.indexconfigurator.AzureSearchConfigGenerator \
  --endpoint=https://search.windows.net \
  --api-key=your-key \
  --index-name=your-index \
  --output-dir=./src/indexers
```

## Fichiers générés

### azureAISearchDataSource.ts
Interface TypeScript et configuration de la source de données :

```typescript
export interface MyDocument {
    docId?: string;
    docTitle?: string | null;
    description?: string | null;
    descriptionVector?: number[] | null;
}

export const azureAISearchDataSource = new AzureAISearchDataSource({
    name: "azure-ai-search",
    indexName: config.azureSearchIndexName,
    searchFields: ["docTitle", "description"],
    select: ["docId", "docTitle", "description"],
    vectorFields: ["descriptionVector"],
    // ... configuration complète
});
```

### setup.ts
Script de création et peuplement d'index :

```typescript
export async function main() {
    const index = config.azureSearchIndexName;
    
    // Validation des variables d'environnement
    // Création du client Azure Search
    // Logique de peuplement adaptée au schéma
}
```

### utils.ts
Fonctions utilitaires spécialisées :

```typescript
export async function createIndexIfNotExists(client: SearchIndexClient, indexName: string): Promise<void>
export async function upsertDocuments(client: SearchClient<MyDocument>, documents: MyDocument[]): Promise<void>
export async function getEmbeddingVector(text: string): Promise<number[]>
```

## Workflow de développement

```mermaid
sequenceDiagram
    participant Dev as Développeur
    participant Make as Makefile
    participant Java as Utilitaire Java
    participant Azure as Azure Search
    participant TS as Fichiers TS
    
    Dev->>Make: make azure-config-generate
    Make->>Java: Lance utilitaire avec env playground
    Java->>Azure: Lit schéma index (SECRET_AZURE_SEARCH_KEY)
    Azure-->>Java: Retourne métadonnées complètes
    Java->>TS: Génère azureAISearchDataSource.ts
    Java->>TS: Génère setup.ts
    Java->>TS: Génère utils.ts
    TS-->>Dev: Fichiers TypeScript synchronisés
    
    Note over Dev: Tests automatiques
    Dev->>Make: make azure-config-test-integration
    Make->>Java: Lance tests d'intégration
    Java->>Azure: Valide avec index réel
    Azure-->>Java: Confirme cohérence
```

## Tests et validation

### Tests unitaires (TDD)
```bash
# Tous les tests (67 tests)
mvn test

# Tests spécifiques
mvn test -Dtest="AzureSearchIndexReaderTest"
mvn test -Dtest="TypeScriptGeneratorTest"
```

### Tests d'intégration avec Azure Search réel
```bash
# Nécessite les variables playground
mvn verify

# Ou via Makefile
make azure-config-test-integration
```

### Couverture des tests

- ✅ **AzureSearchIndexReader** (18 tests) : Lecture métadonnées, gestion erreurs
- ✅ **TypeScriptGenerator** (5+3 tests) : Génération code, intégration
- ✅ **IndexSchema & FieldDefinition** (26 tests) : Modèles immutables
- ✅ **AzureSearchConfigGenerator** (6 tests) : Orchestration
- ✅ **Gestion d'erreurs** (2 tests) : Exceptions spécialisées
- ✅ **Tests d'intégration** (8 tests) : Validation Azure Search réel

## Troubleshooting

### Erreurs courantes

**Erreur d'authentification**
```
AzureSearchConnectionException: Authentication failed - invalid API key
```
→ Vérifier `SECRET_AZURE_SEARCH_KEY` dans `.env.playground.user`

**Index non trouvé**
```
AzureSearchConnectionException: Index not found: mon-index
```
→ Vérifier `AZURE_SEARCH_INDEX_NAME` et l'existence de l'index

**Variables manquantes**
```
IllegalArgumentException: Endpoint cannot be null or empty
```
→ Exécuter `make env-check` pour valider la configuration

### Debug et logging

```bash
# Mode verbose
make azure-config-generate VERBOSE=true

# Validation configuration
make azure-config-validate

# Diagnostic complet
make diagnostic
```

## Intégration avec le projet Legis QC

L'utilitaire s'intègre parfaitement dans l'écosystème existant :

1. **Variables playground** : Utilise la configuration existante
2. **Structure config.ts** : Compatible avec le système de configuration
3. **Makefile** : Nouvelles règles intégrées harmonieusement
4. **Tests** : Respecte les conventions TDD du projet

## Évolutions futures

- Support de plusieurs index simultanément
- Génération de scripts de migration
- Intégration avec CI/CD pour validation automatique
- Support des index avec schémas complexes (nested objects)
- Interface CLI avancée avec options