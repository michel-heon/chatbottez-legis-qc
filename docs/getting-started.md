# 🚀 Guide de démarrage - Chatbot Legis QC

## 📋 Prérequis

- **Node.js** 18+ et npm
- **Clés Azure** : Azure AI Search + Azure OpenAI
- **Système** : Linux/macOS/WSL (recommandé)

## ⚡ Installation rapide

### 1. Installation des dépendances
```bash
make install
```

### 2. Configuration de l'environnement
```bash
make env-setup
```

Éditez le fichier généré `env/.env.playground.user` :
```env
# Clés Azure (OBLIGATOIRES)
SECRET_AZURE_SEARCH_KEY=votre_cle_azure_search
SECRET_AZURE_OPENAI_API_KEY=votre_cle_openai

# Configuration index
AZURE_SEARCH_INDEX_NAME=legis-qc-index-full-01
AZURE_SEARCH_ENDPOINT=https://votre-service.search.windows.net
AZURE_OPENAI_ENDPOINT=https://votre-service.openai.azure.com

# Données et modèles
EXTERNAL_DATA_SOURCE_PATH=/chemin/vers/vos/donnees
TTL_METADATA_FILE=metadata.ttl
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-small
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME=gpt-4o
```

### 3. Configuration complète automatique
```bash
make setup-complete
```

Cette commande va :
- Compiler le projet TypeScript
- Créer l'index Azure Search
- Peupler l'index avec vos données TTL
- Valider la configuration

## ✅ Vérification de l'installation

```bash
# Vérifier l'état de l'index
make index-status

# Tester les recherches
make index-test

# Diagnostic complet
make diagnostic
```

## 🚀 Démarrer l'application

### Pour Microsoft 365 Agents Playground
```bash
npm run dev:teamsfx:testtool      # Terminal 1
npm run dev:teamsfx:launch-testtool  # Terminal 2
```

### Pour développement local
```bash
make dev
```

## 🌍 Environnements multiples

```bash
# Playground (défaut)
make setup-complete ENV_CONFIG=playground

# Local
make setup-complete ENV_CONFIG=local

# Développement
make setup-complete ENV_CONFIG=dev
```

## 🔧 Commandes essentielles

| Commande | Description |
|----------|-------------|
| `make help` | Afficher toutes les commandes |
| `make index-summary` | Résumé des documents indexés |
| `make index-warnings` | Analyser les avertissements |
| `make index-delete` | Supprimer l'index |
| `make index-reindex` | Recréer complètement l'index |

## 🆘 Aide rapide

- **Problème de configuration** : `make env-check`
- **Validation Azure** : `make config-validate`
- **Documentation complète** : Voir [configuration.md](./configuration.md)
- **Dépannage** : Voir [troubleshooting.md](./troubleshooting.md)

---

**🎯 Objectif** : Être opérationnel en moins de 10 minutes !

*Prochaine étape : [Configuration avancée](./configuration.md)*
