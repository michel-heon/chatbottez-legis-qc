# 🚀 Guide de Référence Rapide - Azure Search Index

## 🎯 Pour Commencer (Débutants)

```bash
# 1. Installation et configuration
make install           # Installer les dépendances
make env-setup         # Configurer l'environnement
make setup-complete    # Configuration complète

# 2. Vérification
make index-status      # Vérifier l'état
make index-test        # Tester les recherches
```

## 📊 Gestion Quotidienne

```bash
# Ajouter du contenu
make populate-content

# Vérifier l'état
make index-status  

# Tester les recherches
make index-test

# Supprimer l'index
make index-delete

# Recréer complètement
make index-reindex
```

## 🔧 Configuration Avancée

```bash
# Environnements
make setup-complete ENV_CONFIG=playground  # Test
make setup-complete ENV_CONFIG=local       # Local  
make setup-complete ENV_CONFIG=dev         # Développement

# Index personnalisé
make setup-index-only INDEX_NAME=mon-index

# Forcer les actions
make index-delete FORCE=true
```

## 🆘 Diagnostic et Aide

```bash
# Aide complète
make help

# Vérifier la configuration
make env-check
make config-validate

# Diagnostic complet
make diagnostic

# Lister les configurations
make index-config-list
```

## 📁 Fichiers de Configuration

```bash
# Fichiers d'environnement
env/.env.playground.user    # Configuration Playground
env/.env.local.user         # Configuration locale
env/.env.dev.user           # Configuration développement
```

## 🔑 Variables Importantes

```bash
# Dans les fichiers .env.*.user
SECRET_AZURE_SEARCH_KEY=votre_cle_azure
SECRET_AZURE_OPENAI_API_KEY=votre_cle_openai
AZURE_SEARCH_INDEX_NAME=nom_de_votre_index
AZURE_SEARCH_ENDPOINT=https://votre-service.search.windows.net
```

## ⚡ Exemples Rapides

### Premier Setup
```bash
make install && make env-setup && make setup-complete
```

### Recréation Rapide
```bash
make index-delete FORCE=true && make setup-complete
```

### Test Complet
```bash
make index-status && make index-test && make diagnostic
```

---
💡 **Conseil** : Commencez toujours par `make help` pour voir toutes les options disponibles !
