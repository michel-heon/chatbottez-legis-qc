# 👩‍💻 Guide développeur - Architecture et conventions

## 🏗️ Architecture du projet

### Structure générale
```
├── src/                    # Code source TypeScript
│   ├── adapter.ts         # Adaptateur Teams
│   ├── config.ts          # Configuration
│   ├── index.ts           # Point d'entrée
│   ├── app/               # Application Teams
│   └── indexers/          # Moteurs d'indexation
├── scripts/               # Scripts shell utilitaires  
├── lib/                   # Code compilé JavaScript
├── docs/                  # Documentation
├── env/                   # Fichiers d'environnement
└── tests/                 # Scripts de test et validation
```

### Architecture ontology-driven

Le projet utilise une approche **ontology-driven** pour la gestion des métadonnées juridiques :

1. **Données TTL/RDF** → Métadonnées structurées
2. **Analyse de schéma** → Génération automatique d'index
3. **Population intelligente** → Enrichissement avec embeddings
4. **Recherche sémantique** → Requêtes augmentées par IA

## 📝 Conventions obligatoires

### Nommage des fichiers

```bash
# Scripts shell : <objet>-<action>.sh
data-populate.sh           # ✅ Conforme
index-setup.sh            # ✅ Conforme
setupIndex.sh             # ❌ Non conforme

# Règles Make : <objet>-<action>
index-create              # ✅ Conforme  
data-populate             # ✅ Conforme
createIndex               # ❌ Non conforme
```

### Usage des icônes - Principe de parcimonie

**Règle stricte** : Limiter l'usage des icônes pour préserver la lisibilité du code et de la documentation.

✅ **Usage approprié** (uniquement pour signaler l'importance) :
- `❌` Erreurs critiques qui stoppent l'exécution
- `✅` Succès d'opérations importantes
- `⚠️` Avertissements de sécurité ou de configuration

❌ **Usage à éviter** :
- Icônes décoratives dans le code : `echo "🚀 Starting process..."`
- Icônes multiples par fonction ou section
- Icônes dans les noms de variables ou fonctions
- Plus de 1-2 icônes par écran de terminal

**Exemple de code INCORRECT** :
```bash
#!/bin/bash
echo "🔍 Checking environment... 📊"
echo "🚀 Starting index creation... ✨" 
echo "🛠️ Processing data... ⚙️"
```

**Exemple de code CORRECT** :
```bash
#!/bin/bash
echo "Checking environment..."
echo "Starting index creation..."
echo "Processing data..."

# Utilisation appropriée pour signaler l'importance
if [ $? -eq 0 ]; then
    echo "✅ Operation completed successfully"
else
    echo "❌ Critical error: Operation failed"
fi
```

### Favoriser la réutilisabilité

**Principe fondamental** : Concevoir chaque composant pour être réutilisable et modulaire.

✅ **Patterns de réutilisabilité** :

**Code modulaire** :
```bash
# Fonctions communes réutilisables
scripts/common-functions.sh

# Usage dans multiple scripts
source scripts/common-functions.sh
load_environment "$ENV_CONFIG"
validate_azure_keys
```

**Configuration externalisée** :
```bash
# Éviter les valeurs hard-codées
INDEX_NAME="legis-qc-fixed"           # ❌ Non réutilisable

# Préférer la configuration
INDEX_NAME="${AZURE_SEARCH_INDEX_NAME}" # ✅ Réutilisable
```

**Règles Make modulaires** :
```makefile
# Pattern réutilisable pour tous les environnements
index-create: env-check
	$(eval EFFECTIVE_ENV := $(or $(ENV_CONFIG),playground))
	@echo "Creating index for environment: $(EFFECTIVE_ENV)"
	# Code générique réutilisable
```

### Structure des fichiers

```bash
# Documentation (.md) → docs/
# Scripts (.sh) → scripts/
# Données d'index → src/indexers/data/
# README.md → Racine uniquement
```

### Variables d'environnement

```bash
# Variables sensibles : préfixe SECRET_
SECRET_AZURE_SEARCH_KEY=xxx      # ✅ Sensible
SECRET_AZURE_OPENAI_API_KEY=xxx  # ✅ Sensible

# Variables de configuration : pas de préfixe
AZURE_SEARCH_INDEX_NAME=xxx      # ✅ Non sensible
AZURE_SEARCH_ENDPOINT=xxx        # ✅ Non sensible
```

## 🔧 Développement avec les conventions

### Validation automatique

```bash
# Valider les conventions de nommage
make conventions-validate

# Diagnostic développeur
make diagnostic
```

### Ajout de nouvelles commandes Make

```bash
# Template pour nouvelle règle Make
<objet>-<action>: env-check
	@echo "Description de l'action..."
	$(eval EFFECTIVE_ENV := $(or $(ENV_CONFIG),playground))
	# Votre code ici
```

### Création de nouveaux scripts

```bash
# Template pour nouveau script
#!/bin/bash
# scripts/<objet>-<action>.sh
# Description : <description>

set -euo pipefail

# Chargement de l'environnement
ENV_CONFIG=${1:-playground}
if [ -f "env/.env.${ENV_CONFIG}.user" ]; then
    set -a && . "env/.env.${ENV_CONFIG}.user" && set +a
else
    echo "❌ Fichier d'environnement non trouvé"
    exit 1
fi

# Votre logique ici
```

## 🧪 Tests et validation

### Tests automatisés disponibles

```bash
# Test de contenu d'index
node test-index-content.js

# Test de comptage
node test-index-count.js

# Test sémantique
node test-semantic.js

# Validation des erreurs
node tests/documents-error-analysis.js
```

### Ajout de nouveaux tests

```bash
# Placer dans tests/ avec nommage descriptif
tests/documents-error-analysis.js     # ✅ Bon nommage
tests/validation-<feature>.js         # ✅ Pattern recommandé
```

## 🔍 Outils de développement

### Compilation TypeScript

```bash
# Build automatique avec watch
npm run build:watch

# Build unique
make build

# Nettoyage
make clean
```

### Debugging

```bash
# Logs détaillés
NODE_ENV=development make dev

# Mode debug avec source maps
npm run debug
```

### Linting et formatting

```bash
# Format automatique (si configuré)
npm run format

# Vérification qualité code
npm run lint
```

## 📊 Monitoring et observabilité

### Logs structurés

Le projet utilise un système de logs structurés :

```javascript
// Logs d'erreur
console.error(`❌ [${module}] ${message}`, error);

// Logs d'info
console.log(`ℹ️ [${module}] ${message}`);

// Logs de succès
console.log(`✅ [${module}] ${message}`);
```

### Métriques de diagnostic

```bash
# Nouveau dans v1.7.0 : outils de diagnostic avancés
make index-summary        # Résumé + identification problèmes
make index-warnings       # Analyse warnings détaillée
```

## 🔐 Sécurité pour les développeurs

### Gestion des secrets

```bash
# JAMAIS commiter de fichiers .env.*.user
# Toujours utiliser le préfixe SECRET_ pour les clés
# Variables masquées automatiquement dans les logs
```

### Variables d'environnement sécurisées

```javascript
// Validation côté code
if (!process.env.SECRET_AZURE_SEARCH_KEY) {
    throw new Error('SECRET_AZURE_SEARCH_KEY is required');
}

// Masquage dans les logs
const maskedKey = process.env.SECRET_AZURE_SEARCH_KEY.replace(/.(?=.{4})/g, '*');
```

## ⚡ Optimisation et Performance

### Traitement Parallèle des Embeddings

Le projet utilise `ParallelEmbeddingProcessor` pour des performances optimales :

```typescript
import { ParallelEmbeddingProcessor } from './parallelEmbeddingProcessor';

// Configuration automatique par environnement
const processor = ParallelEmbeddingProcessor.createOptimizedProcessor('playground');

// Traitement avec métriques de performance
const results = await processor.generateDocumentEmbeddings(
    legalIdentifier,
    content,
    chunks
);
```

### Configurations par Environnement

```bash
# Development - Conservative pour débug
make content-process-optimized EMBEDDING_CONCURRENCY=3 EMBEDDING_BATCH_SIZE=10

# Playground - Équilibré pour tests
make content-process-optimized EMBEDDING_CONCURRENCY=5 EMBEDDING_BATCH_SIZE=20

# Production - Optimisé pour performance
make content-process-optimized EMBEDDING_CONCURRENCY=8 EMBEDDING_BATCH_SIZE=30
```

### Benchmark et Monitoring

```bash
# Test de performance
make embedding-benchmark

# Résultats attendus:
# - 3.22x speedup vs traitement séquentiel
# - 100% success rate sur ontologies étendues
# - Support automatique SPARQL jusqu'à 5MB
```

### Gestion des Rate Limits Azure

Le système inclut des protections automatiques :
- Délais configurables entre requêtes (100-300ms)
- Limitation de concurrence par environnement
- Retry automatique avec backoff exponentiel
- Troncature intelligente des textes longs

## 🚀 Déploiement et CI/CD

### Environnements cibles

```bash
# Playground → Microsoft 365 Agents
ENV_CONFIG=playground

# Local → Développement individuel  
ENV_CONFIG=local

# Dev → Environnement équipe
ENV_CONFIG=dev
```

### Pipeline de validation

```bash
# Étapes recommandées pour CI/CD
1. make install                    # Dépendances
2. make build                      # Compilation
3. make env-check                  # Configuration
4. make conventions-validate       # Conventions
5. npm test                        # Tests unitaires
6. make diagnostic                 # Tests d'intégration
```

## 📚 Ressources pour développeurs

### Documentation technique

- **Architecture Azure** : [azure-search-management.md](./azure-search-management.md)
- **Intégration SPARQL** : [apache-jena-integration.md](./apache-jena-integration.md)
- **Scripts techniques** : [scripts-reference.md](./scripts-reference.md)

### Commandes développeur essentielles

```bash
# Setup développeur complet
make install && make build

# Workflow quotidien
make env-check && make diagnostic

# Debug et troubleshooting
make index-summary && make index-warnings

# Validation avant commit
make conventions-validate
```

## 🔄 Contribution au projet

### Workflow Git recommandé

```bash
# 1. Créer une branche feature
git checkout -b feature/ma-nouvelle-fonctionnalite

# 2. Développer avec les conventions
# Suivre les patterns <objet>-<action>

# 3. Valider avant commit
make conventions-validate
make diagnostic

# 4. Commit avec message structuré
git commit -m "feat: ajout commande index-optimize

- Nouvelle règle make index-optimize
- Script scripts/index-optimize.sh
- Documentation mise à jour
- Tests de validation inclus"

# 5. Push et PR
git push origin feature/ma-nouvelle-fonctionnalite
```

### Checklist avant commit

- [ ] Conventions de nommage respectées
- [ ] Usage des icônes limité au strict nécessaire
- [ ] Code conçu pour la réutilisabilité (fonctions modulaires, configuration externalisée)
- [ ] `make conventions-validate` passe
- [ ] `make diagnostic` sans erreur
- [ ] Documentation mise à jour et centralisée
- [ ] Variables d'environnement validées
- [ ] Pas de duplication de code ou d'information

---

**🎯 Objectif** : Code maintenable, lisible, réutilisable et conventions cohérentes !

*Version guide : v1.7.0-ui-diagnostic-tools*
