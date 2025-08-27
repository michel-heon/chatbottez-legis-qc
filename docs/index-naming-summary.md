# 🏷️ Gestion d'Index Azure Search - Guide Utilisateur

## 🚀 Commandes Principales (Simplifiées)

Le Makefile a été complètement réorganisé pour être plus accessible. Voici les commandes principales :

### Configuration Initiale
```bash
# 1. Installation des dépendances
make install

# 2. Configuration de l'environnement (clés API)
make env-setup

# 3. Configuration complète (RECOMMANDÉ pour débuter)
make setup-complete
```

### Gestion Quotidienne
```bash
# Vérifier l'état de l'index
make index-status

# Ajouter du contenu à un index existant
make populate-content

# Tester les recherches
make index-test

# Supprimer l'index
make index-delete
```

## 📊 Commandes de Gestion d'Index

### Création et Population
```bash
# Créer seulement l'index (sans contenu)
make setup-index-only

# Créer un nouvel index complet
make index-create

# Peupler un index existant
make index-populate

# Recréer complètement l'index
make index-reindex
```

### Configuration et Monitoring
```bash
# Configurer un nom d'index personnalisé
make index-name-set INDEX_NAME=mon-index-personnalise

# Lister toutes les configurations
make index-config-list
```

## ⚙️ Environnements Disponibles

```bash
# Environnement de test (par défaut)
make setup-complete ENV_CONFIG=playground

# Environnement local
make setup-complete ENV_CONFIG=local

# Environnement de développement
make setup-complete ENV_CONFIG=dev
```

## 🔧 Variables de Configuration

### Priorité de Configuration
1. **Variable d'environnement**: `AZURE_SEARCH_INDEX_NAME`
2. **Paramètre de commande**: `INDEX_NAME=mon-index`
3. **Par défaut**: `my-documents`

### Variables Importantes
- `SECRET_AZURE_SEARCH_KEY` - Clé d'accès Azure Search
- `SECRET_AZURE_OPENAI_API_KEY` - Clé OpenAI pour les embeddings
- `ENV_CONFIG` - Environnement (playground/local/dev)

## ✅ Validation des Noms d'Index

### Règles de Validation
- **Longueur**: 2-128 caractères
- **Format**: lettres minuscules, chiffres, tirets uniquement
- **Début/Fin**: caractères alphanumériques obligatoires

### Exemples Valides
```bash
make index-name-set INDEX_NAME=legis-qc-documents
make index-name-set INDEX_NAME=mon-index-v2
make index-name-set INDEX_NAME=docs-2024
```

### Exemples Invalides (seront rejetés)
```bash
make index-name-set INDEX_NAME=Mon-Index        # majuscules interdites
make index-name-set INDEX_NAME=-invalide-       # commence par un tiret
make index-name-set INDEX_NAME=Index_Avec_Under # underscores interdits
```

## 📁 Fichiers de Configuration

### Sources de Configuration
- `env/.env.playground.user` - Configuration environnement Playground
- `env/.env.local.user` - Configuration environnement local
- `env/.env.dev.user` - Configuration environnement développement
- `package.json` - Configuration npm (si jq disponible)

### Structure des Fichiers d'Environnement
```bash
# Exemple de contenu d'un fichier .env.playground.user
SECRET_AZURE_SEARCH_KEY=votre_cle_azure_search
SECRET_AZURE_OPENAI_API_KEY=votre_cle_openai
AZURE_SEARCH_INDEX_NAME=mon-index-legis-qc
AZURE_SEARCH_ENDPOINT=https://votre-service.search.windows.net
```

## 🛠️ Commandes de Diagnostic

```bash
# Vérifier la configuration
make env-check

# Valider Azure Search
make config-validate

# Diagnostic complet du système
make diagnostic
```

## 📝 Scripts Modifiés

### Nouveaux Scripts
- `scripts/index-name-set.sh` - Attribution de noms d'index personnalisés avec validation
- `scripts/index-config-list.sh` - Liste toutes les configurations d'index actuelles

### Scripts Mis à Jour
- `scripts/index-setup.sh` - Support des noms d'index personnalisés
- `scripts/index-delete.sh` - Support des noms d'index personnalisés  
- `scripts/index-status.sh` - Support des noms d'index personnalisés
- `scripts/documents-add.sh` - Support des noms d'index personnalisés
- `scripts/setup-index-pipeline.sh` - Workflow complet simplifié

## 🔄 Migration depuis l'Ancienne Version

### Correspondance des Commandes
```bash
# ANCIEN → NOUVEAU
enhanced-setup-v2     → setup-complete
ontology-driven-setup → setup-complete
index-setup           → setup-complete (ou setup-index-only)
ttl-ontology-pipeline → setup-complete
```

### Anciennes Commandes Conservées
Les anciennes commandes sont conservées comme alias pour la compatibilité :
- `enhanced-setup-v2` → `setup-complete`
- `ontology-driven-setup` → `setup-complete`
- `ttl-ontology-pipeline` → `setup-complete`

## 💡 Guide de Démarrage Rapide

### Pour un Utilisateur Débutant
```bash
# Étape 1 : Voir l'aide
make help

# Étape 2 : Configuration complète
make install
make env-setup
make setup-complete

# Étape 3 : Vérification
make index-status
make index-test
```

### Pour un Utilisateur Expérimenté
```bash
# Configuration spécifique
make setup-index-only ENV_CONFIG=local INDEX_NAME=mon-index-prod

# Gestion avancée
make populate-content ENV_CONFIG=local
make index-reindex FORCE=true
```

## 🔍 Intégration Automatique

Toutes les commandes de gestion d'index utilisent automatiquement le nom d'index configuré :
- `make setup-complete`
- `make setup-index-only`
- `make populate-content`
- `make index-delete`
- `make index-status`
- `make index-test`
- `make index-reindex`
