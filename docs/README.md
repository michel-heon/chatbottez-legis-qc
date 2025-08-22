# 📚 Documentation - Chatbot Legis QC

Bienvenue dans la documentation complète du projet **Chatbot Legis Q### Ajout de nouveaux documents
```bash
# 1. Placer les fichiers .md dans src/indexers/new-data/
# 2. Indexer
make documents-add AZURE_SEARCH_KEY=key AZURE_OPENAI_KEY=key
```

### 2. Test et validation
```bash
# Vérifier l'index
make index-status AZURE_SEARCH_KEY=key

# Démarrer l'application
make dev
```conversationnel Microsoft 365 Teams avec capacités RAG (Retrieval Augmented Generation) alimenté par Azure AI Search.

## 🗂️ Organisation de la documentation

### 📖 Guides utilisateur
- **[azure-search-management.md](./azure-search-management.md)** - Guide complet de gestion de l'index Azure AI Search
- **[setup-guide.md](./setup-guide.md)** - Guide d'installation et configuration pas à pas

### 🔧 Référence technique
- **[scripts-reference.md](./scripts-reference.md)** - Documentation technique détaillée des scripts

## 🚀 Démarrage rapide

### Nouveaux utilisateurs
1. 📋 Lire le [Guide d'installation](./setup-guide.md)
2. 🛠️ Suivre la [Configuration Azure Search](./azure-search-management.md#configuration-requise)
3. ⚡ Exécuter `make help` pour voir toutes les commandes disponibles

### Utilisateurs expérimentés
```bash
# Configuration rapide
make check-env && make validate-config

# Setup complet
make setup-index AZURE_SEARCH_KEY=your_key AZURE_OPENAI_KEY=your_key

# Démarrage de l'application
make dev
```

## 🎯 Architecture du projet

```
📁 Chatbot Legis QC
├── 🔧 scripts/           # Scripts d'automatisation
├── 📚 docs/              # Documentation (ce répertoire)
├── 🗃️ src/indexers/      # Logique d'indexation Azure Search
├── 🤖 src/app/           # Logique applicative Teams Bot
├── 🏗️ infra/            # Infrastructure Azure (Bicep)
└── 📄 Makefile          # Commandes de gestion automatisées
```

## 🛠️ Fonctionnalités principales

### 🔍 Recherche hybride
- **Recherche textuelle** : Correspondance exacte des mots-clés
- **Recherche sémantique** : Similarité vectorielle via embeddings Azure OpenAI

### 📊 Gestion automatisée
- **Indexation** : Scripts automatisés pour la création et mise à jour
- **Monitoring** : Vérification de l'état et des métriques
- **Validation** : Tests de connectivité et configuration

### 🚀 Déploiement
- **Multi-environnements** : Local, Playground, Production
- **Infrastructure as Code** : Templates Azure Bicep
- **CI/CD Ready** : Scripts compatibles avec les pipelines

## 📋 Commandes essentielles

### Configuration initiale
```bash
make install              # Installation des dépendances
make env-check           # Validation de l'environnement
make config-validate     # Test de connectivité Azure
```

### Gestion de l'index
```bash
make index-setup         # Création et indexation
make index-status        # Vérification du statut
make documents-add       # Ajout de nouveaux documents
make index-reindex       # Reconstruction complète
```

### Développement
```bash
make build              # Compilation TypeScript
make dev               # Démarrage en mode développement
make clean             # Nettoyage des artefacts
```

## 🔐 Configuration Azure

### Services requis
- **Azure AI Search** (Standard S1+ recommandé)
- **Azure OpenAI** avec modèles :
  - `gpt-4-mini` (ou équivalent)
  - `text-embedding-ada-002` (ou text-embedding-3-small)

### Variables d'environnement
```bash
# Azure AI Search
AZURE_SEARCH_ENDPOINT=https://your-service.search.windows.net/
SECRET_AZURE_SEARCH_KEY=your_admin_key

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/
SECRET_AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4-mini
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002
```

## 🔄 Workflow de développement

### 1. Ajout de nouveaux documents
```bash
# 1. Placer les fichiers .md dans src/indexers/new-data/
# 2. Indexer
make add-documents AZURE_SEARCH_KEY=key AZURE_OPENAI_KEY=key
```

### 2. Test et validation
```bash
# Vérifier l'index
make index-status AZURE_SEARCH_KEY=key

# Démarrer l'application
make dev
```

### 3. Déploiement
```bash
# Build pour production
make build

# Déploiement (selon votre pipeline)
# Par exemple avec Azure DevOps, GitHub Actions, etc.
```

## 🚨 Dépannage rapide

### Erreurs communes
| Problème | Commande de diagnostic | Solution |
|----------|----------------------|----------|
| Variables manquantes | `make env-check` | Configurer les variables d'environnement |
| Connectivité Azure | `make config-validate` | Vérifier les endpoints et clés |
| Index inexistant | `make index-status` | Exécuter `make index-setup` |
| Build échoué | `make clean && make build` | Nettoyer et recompiler |

### Support et ressources
- 📖 **Documentation Microsoft** : [Azure AI Search](https://docs.microsoft.com/azure/search/)
- 🛠️ **Teams Toolkit** : [Microsoft Teams Toolkit](https://docs.microsoft.com/microsoftteams/platform/toolkit/)
- 💡 **Exemples** : [Azure Search Vector Samples](https://github.com/Azure/azure-search-vector-samples)

## 🎓 Apprentissage et formation

### Pour les débutants
1. 📚 Comprendre les concepts RAG et vector search
2. 🏗️ Découvrir l'architecture Azure AI Search
3. 🤖 Explorer le développement d'agents Teams

### Pour les développeurs expérimentés
1. 🔧 Personnaliser les scripts d'indexation
2. 📊 Optimiser les performances de recherche
3. 🚀 Implémenter des fonctionnalités avancées

## 🔄 Mise à jour de la documentation

Cette documentation est maintenue activement. Pour contribuer :

1. **Corrections** : Créer une issue ou PR
2. **Améliorations** : Proposer des ajouts via PR
3. **Questions** : Utiliser les discussions GitHub

---

**Version** : 1.0.0  
**Dernière mise à jour** : Août 2025  
**Projet** : [Chatbot Legis QC](https://github.com/michel-heon/chatbottez-legis-qc)
