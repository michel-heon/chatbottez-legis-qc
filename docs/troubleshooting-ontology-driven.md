# Guide de Dépannage - Microsoft 365 Agents Toolkit Ontology-Driven

## 🎯 Vue d'Ensemble

Ce guide fournit une méthodologie systématique pour diagnostiquer et résoudre les problèmes dans l'architecture ontology-driven du Microsoft 365 Agents Toolkit.

## 📋 Architecture et Composants

### Pipeline Ontology-Driven
```
TTL/RDF Metadata → Schema Analysis → Azure Search Index → Teams AI → User Query
```

### Composants Clés
1. **TTL Parser** (`ttlSchemaAnalyzer.ts`)
2. **Index Creator** (`indexCreatorFromTTL.ts`)
3. **Environment Configuration** (`.env.*.user`)
4. **Makefile Rules** (ontology-driven patterns)

## 🔍 Méthodologie de Diagnostic

### 1. Identification du Problème

#### Étape 1.1 : Catégoriser l'Erreur
```bash
# Exécuter la commande qui échoue et capturer l'output
make index-create 2>&1 | tee debug.log

# Identifier la catégorie d'erreur
grep -E "(ERROR|Failed|❌)" debug.log
```

#### Étape 1.2 : Vérifier l'État du Système
```bash
# Vérifier l'environnement
make env-check

# Vérifier la connectivité Azure
make index-status
```

### 2. Vérification des Prérequis

#### Étape 2.1 : Variables d'Environnement
```bash
# Valider la configuration
make config-validate

# Vérifier les secrets
env | grep -E "(SECRET_|AZURE_)" | wc -l
```

#### Étape 2.2 : Fichiers TTL
```bash
# Vérifier l'existence et la validité du TTL
ls -la "$EXTERNAL_DATA_SOURCE_PATH/extract/rdf/"
head -20 "$EXTERNAL_DATA_SOURCE_PATH/extract/rdf/legisquebec-metadata-small.ttl"
```

### 3. Diagnostic par Composant

#### 3.1 : TTL Schema Analysis
```bash
# Test isolé de l'analyseur TTL
node lib/src/indexers/ttlSchemaAnalyzer.js \
  "$EXTERNAL_DATA_SOURCE_PATH/extract/rdf/legisquebec-metadata-small.ttl" \
  "schema-test.json"

# Vérifier le schéma généré
jq '.fields | length' schema-test.json
jq '.fields[] | select(.name == "contentVector")' schema-test.json
```

#### 3.2 : Index Creation
```bash
# Test isolé du créateur d'index
node lib/src/indexers/indexCreatorFromTTL.js \
  "$SECRET_AZURE_SEARCH_KEY" \
  "schema-output.json" \
  "test-index-$(date +%s)"
```

#### 3.3 : Environment Configuration
```bash
# Vérifier le pattern EFFECTIVE_ENV
make index-name-set ENV_CONFIG=playground
make index-name-set ENV_CONFIG=local
make index-name-set  # Devrait utiliser playground par défaut
```

## 🛠️ Résolution par Type d'Erreur

### Erreur Type 1 : Configuration Environment

#### Symptômes
```
ERROR: Environment variable not set
ERROR: Cannot find .env file
```

#### Diagnostic
```bash
# Vérifier les fichiers d'environnement
ls -la env/.env.*.user
echo "Current ENV_CONFIG: ${ENV_CONFIG:-playground}"

# Tester le pattern EFFECTIVE_ENV
make -n index-create | grep EFFECTIVE_ENV
```

#### Résolution
```bash
# Copier un template d'environnement
cp env/.env.playground.user.example env/.env.playground.user

# Configurer les variables manquantes
$EDITOR env/.env.playground.user
```

### Erreur Type 2 : Azure Search SDK

#### Symptômes
```
The vector field must have properties 'dimensions' and 'vectorSearchConfiguration' set
RestError: InvalidRequestParameter
```

#### Diagnostic
```bash
# Vérifier la version du SDK
npm list @azure/search-documents

# Comparer avec les indices existants
curl -X GET "$AZURE_SEARCH_ENDPOINT/indexes?api-version=2024-07-01" \
  -H "api-key: $SECRET_AZURE_SEARCH_KEY" | jq '.value[0].fields[] | select(.type == "Collection(Edm.Single)")'
```

#### Résolution
Voir : [troubleshooting-azure-search-vector-fields.md](./troubleshooting-azure-search-vector-fields.md)

### Erreur Type 3 : TTL Parsing

#### Symptômes
```
ERROR: TTL file not found
ERROR: Failed to parse TTL content
```

#### Diagnostic
```bash
# Vérifier le chemin TTL
echo "TTL Path: $EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE"
file "$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE"

# Valider la syntaxe TTL
rapper -c "$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE" 2>&1 | head -10
```

#### Résolution
```bash
# Corriger le chemin dans .env
export TTL_METADATA_FILE="extract/rdf/legisquebec-metadata-small.ttl"

# Ou utiliser un TTL de test
cp src/indexers/config/sample.ttl test-sample.ttl
export TTL_METADATA_FILE="test-sample.ttl"
```

### Erreur Type 4 : Makefile Rules

#### Symptômes
```
make: *** No rule to make target
ERROR: EFFECTIVE_ENV not working
```

#### Diagnostic
```bash
# Vérifier la syntaxe Makefile
make -n index-create | head -20

# Tester le pattern EFFECTIVE_ENV
make -f <(echo -e 'test:\n\t@echo "ENV: $(or $(ENV_CONFIG),playground)")') test
```

#### Résolution
```bash
# Vérifier la cohérence du pattern EFFECTIVE_ENV
grep -n "EFFECTIVE_ENV" Makefile

# Corriger le pattern si nécessaire
sed -i 's/$(ENV_CONFIG)/$(or $(ENV_CONFIG),playground)/g' Makefile
```

## 🔧 Outils de Debug

### Script de Diagnostic Automatique
```bash
#!/bin/bash
# debug-ontology.sh

echo "🔍 DIAGNOSTIC ONTOLOGY-DRIVEN SYSTEM"
echo "===================================="

echo "📋 Environment:"
echo "ENV_CONFIG: ${ENV_CONFIG:-playground}"
echo "PWD: $(pwd)"

echo "📋 Files:"
ls -la env/.env.*.user | head -3
ls -la schema-*.json 2>/dev/null | head -3

echo "📋 Azure Connectivity:"
curl -s "$AZURE_SEARCH_ENDPOINT/indexes?api-version=2024-07-01" \
  -H "api-key: $SECRET_AZURE_SEARCH_KEY" | jq '.value | length'

echo "📋 TTL Source:"
wc -l "$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE" 2>/dev/null || echo "TTL not found"

echo "📋 Compilation:"
npx tsc --noEmit 2>&1 | head -5 || echo "TypeScript OK"
```

### Logging Enhanced
```bash
# Activer le debug verbose
export DEBUG=azure-search,ttl-analyzer

# Sauvegarder les logs détaillés
make index-create 2>&1 | tee "debug-$(date +%Y%m%d-%H%M%S).log"
```

## 📚 Resources de Référence

### Documentation Interne
- [Architecture Document](./ENHANCED_ARCHITECTURE.md)
- [Setup Guide](./setup-guide.md)
- [Scripts Reference](./scripts-reference.md)

### Documentation Externe
- [Microsoft 365 Agents Toolkit](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-agents-toolkit)
- [Azure Search JavaScript SDK](https://learn.microsoft.com/en-us/javascript/api/@azure/search-documents/)
- [RDF/TTL Specification](https://www.w3.org/TR/turtle/)

### Commandes de Référence Rapide
```bash
# État du système
make env-check && make index-status

# Recréation complète
make index-delete && make index-create

# Debug schema TTL
node lib/src/indexers/ttlSchemaAnalyzer.js [TTL_FILE] [OUTPUT]

# Test connectivité Azure
curl -s "$AZURE_SEARCH_ENDPOINT?api-version=2024-07-01" -H "api-key: $SECRET_AZURE_SEARCH_KEY"
```

## ✅ Checklist de Résolution

### Problème Résolu Quand
- [ ] `make index-status` retourne l'état de l'index
- [ ] `make index-create` s'exécute sans erreur
- [ ] Schema TTL génère les 15 champs attendus
- [ ] Le champ `contentVector` est correctement configuré
- [ ] Les variables d'environnement sont validées
- [ ] La compilation TypeScript réussit

### Actions Post-Résolution
- [ ] Documenter la solution dans ce guide
- [ ] Mettre à jour les tests unitaires si applicable
- [ ] Committer les corrections dans le repository
- [ ] Partager la solution avec l'équipe

---
**Dernière mise à jour :** 26 août 2025  
**Mainteneur :** Équipe Microsoft 365 Agents Toolkit
