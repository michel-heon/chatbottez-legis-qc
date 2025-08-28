# ⚙️ Configuration - Chatbot Legis QC

## 🌍 Environnements disponibles

| Environnement | Fichier | Usage |
|---------------|---------|-------|
| **playground** | `env/.env.playground.user` | Microsoft 365 Agents (défaut) |
| **local** | `env/.env.local.user` | Développement local |
| **dev** | `env/.env.dev.user` | Environnement de développement |

## 🔑 Variables d'environnement

### Variables obligatoires (clés sensibles)

```env
# Azure AI Search
SECRET_AZURE_SEARCH_KEY=votre_cle_azure_search

# Azure OpenAI  
SECRET_AZURE_OPENAI_API_KEY=votre_cle_openai
```

### Variables de configuration (non sensibles)

```env
# Index Azure Search
AZURE_SEARCH_INDEX_NAME=legis-qc-index-full-01
AZURE_SEARCH_ENDPOINT=https://votre-service.search.windows.net

# Service Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://votre-service.openai.azure.com
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-small
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME=gpt-4o

# Configuration des données
EXTERNAL_DATA_SOURCE_PATH=/chemin/vers/vos/donnees
TTL_METADATA_FILE=metadata.ttl
TTL_CONTENT_DIRECTORY=contenu/
TTL_PROCESSED_DIRECTORY=transform/processed/

# Paramètres d'embedding
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
MAX_RETRIES=3
BATCH_SIZE=10
```

## 🏗️ Configuration par environnement

### Playground (Microsoft 365 Agents)
```bash
# Configuration automatique
make playground-env-setup

# Validation
make playground-env-validate
```

### Local (Développement)
```bash
# Copier et éditer le fichier
cp env/.env.playground.user env/.env.local.user

# Adapter les chemins pour votre environnement local
# Utiliser avec ENV_CONFIG=local
make setup-complete ENV_CONFIG=local
```

### Dev (Équipe de développement)
```bash
# Configuration spécifique équipe
cp env/.env.playground.user env/.env.dev.user

# Utilisation
make setup-complete ENV_CONFIG=dev
```

## 🔒 Sécurité des variables

### Règle du préfixe SECRET_
- **Variables sensibles** : Préfixe `SECRET_` obligatoire
- **Variables publiques** : Pas de préfixe
- **Masquage automatique** : Les variables `SECRET_*` sont masquées dans les logs

### Fichiers protégés
```bash
# Fichiers ignorés par git (déjà configuré)
env/.env.*.user
.localConfigs.*
```

## 🛠️ Validation de configuration

### Vérification automatique
```bash
# Vérifier les variables d'environnement
make env-check

# Valider la connectivité Azure
make config-validate

# Diagnostic complet
make diagnostic
```

### Vérification manuelle
```bash
# Lister les configurations disponibles
make index-config-list

# Tester la connectivité Azure Search
node test-index-content.js
```

## 📊 Options de commandes Make

### Variables globales
```bash
# Environnement (défaut: playground)
ENV_CONFIG=playground|local|dev

# Mode simulation (certaines commandes)
DRY_RUN=true|false

# Forcer l'action sans confirmation
FORCE=true|false
```

### Exemples d'utilisation
```bash
# Supprimer sans confirmation
make index-delete FORCE=true

# Purger en mode simulation
make json-data-purge DRY_RUN=true

# Utiliser l'environnement local
make index-status ENV_CONFIG=local
```

## 🔧 Configuration avancée

### Personnalisation des chemins
```env
# Structure de données personnalisée
EXTERNAL_DATA_SOURCE_PATH=/mon/chemin/custom
TTL_METADATA_FILE=mon-metadata.ttl
TTL_CONTENT_DIRECTORY=mon-contenu/
```

### Optimisation des performances
```env
# Paramètres d'embedding optimisés
CHUNK_SIZE=800           # Taille des chunks (défaut: 1000)
CHUNK_OVERLAP=150        # Chevauchement (défaut: 200)
BATCH_SIZE=15            # Traitement par lots (défaut: 10)
MAX_RETRIES=5            # Tentatives max (défaut: 3)
```

### Configuration des modèles
```env
# Modèles Azure OpenAI
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-large
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-01
```

## 🚨 Dépannage configuration

### Problèmes courants

**❌ Erreur : "Index name must only contain lowercase letters"**
```bash
# Solution : Vérifier AZURE_SEARCH_INDEX_NAME
echo $AZURE_SEARCH_INDEX_NAME  # Doit être en minuscules
```

**❌ Erreur : "RestError: Access denied"**
```bash
# Solution : Vérifier les clés
make env-check
```

**❌ Erreur : "No documents found"**
```bash
# Solution : Vérifier les chemins de données
ls -la $EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE
```

### Commandes de diagnostic
```bash
# Vérification complète
make diagnostic

# Validation spécifique playground
make playground-env-validate

# Résumé de l'index
make index-summary
```

---

*Voir aussi : [troubleshooting.md](./troubleshooting.md) pour plus de solutions*
