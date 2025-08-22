# 📖 Azure AI Search Index Management

Documentation complète pour la gestion de l'index Azure AI Search dans le projet **Chatbot Legis QC**.

## 🎯 Vue d'ensemble

Ce projet utilise Azure AI Search pour implémenter les fonctionnalités RAG (Retrieval Augmented Generation) dans un agent conversationnel Microsoft 365 Teams. Les documents sont indexés avec des embeddings vectoriels pour permettre une recherche sémantique avancée.

## 🛠️ Configuration requise

### Prérequis
- Node.js (version 16+)
- npm ou yarn
- Azure AI Search service
- Azure OpenAI service
- Accès aux clés API Azure

### Variables d'environnement

Créer les fichiers d'environnement suivants :

**`env/.env.playground.user`** ou **`env/.env.local.user`** :
```bash
# Azure AI Search
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net/
SECRET_AZURE_SEARCH_KEY=your_search_api_key

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-openai-service.openai.azure.com/
SECRET_AZURE_OPENAI_API_KEY=your_openai_api_key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4-mini
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002
```

## 🚀 Commandes Makefile

### Installation et build
```bash
# Installer les dépendances
make install

# Compiler le projet TypeScript
make build
```

### Gestion de l'index
```bash
# Créer l'index et indexer les documents
make index-setup AZURE_SEARCH_KEY=your_key AZURE_OPENAI_KEY=your_key

# Supprimer l'index
make index-delete AZURE_SEARCH_KEY=your_key

# Recréer l'index (suppression + création)
make index-reindex AZURE_SEARCH_KEY=your_key AZURE_OPENAI_KEY=your_key

# Ajouter de nouveaux documents
make documents-add AZURE_SEARCH_KEY=your_key AZURE_OPENAI_KEY=your_key

# Vérifier le statut de l'index
make index-status AZURE_SEARCH_KEY=your_key
```

### Environnements spécifiques
```bash
# Setup pour l'environnement playground
make playground-setup

# Setup pour l'environnement local
make local-setup
```

### Validation et diagnostic
```bash
# Vérifier les variables d'environnement
make env-check

# Valider la configuration Azure
make config-validate

# Aide
make help
```

## 📁 Structure des données

### Emplacement des documents
- **Documents existants** : `src/indexers/data/`
- **Nouveaux documents** : `src/indexers/new-data/`
- **Documents traités** : `src/indexers/processed/`

### Format des documents
Les documents doivent être au format Markdown (`.md`) et sont traités comme suit :
- **Nom de fichier** → `docTitle`
- **Contenu** → `description`
- **Embedding du contenu** → `descriptionVector`

### Structure de l'index
```typescript
interface MyDocument {
    docId: string;                    // ID unique
    docTitle: string;                 // Nom du fichier
    description: string;              // Contenu du document
    descriptionVector: number[];      // Vecteur d'embedding (1536 dimensions)
}
```

## 🔧 Scripts disponibles

| Script | Description |
|--------|-------------|
| `env-check.sh` | Vérifie les variables d'environnement |
| `config-validate.sh` | Valide la configuration Azure |
| `index-setup.sh` | Crée l'index et indexe les documents |
| `index-delete.sh` | Supprime l'index |
| `documents-add.sh` | Ajoute de nouveaux documents |
| `index-status-check.sh` | Vérifie le statut de l'index |

## 🔍 Processus d'indexation

1. **Lecture des documents** depuis `src/indexers/data/`
2. **Génération des embeddings** via Azure OpenAI
3. **Création de l'index** avec support vectoriel
4. **Upload des documents** avec leurs vecteurs

### Schéma de l'index
- **Recherche textuelle** : champs `docTitle` et `description`
- **Recherche vectorielle** : champ `descriptionVector`
- **Algorithme** : HNSW (Hierarchical Navigable Small World)
- **Dimensions** : 1536 (compatible text-embedding-ada-002)

## 📊 Recherche hybride

L'application utilise une recherche hybride combinant :
- **Recherche lexicale** : correspondance exacte des mots-clés
- **Recherche sémantique** : similarité vectorielle via embeddings

## 🔐 Sécurité

- Les clés API sont stockées avec le préfixe `SECRET_`
- Support des clés chiffrées (préfixe `crypto_`)
- Variables d'environnement non versionnées (`.env.*.user`)

## 🚨 Dépannage

### Erreurs communes

1. **Variables d'environnement manquantes**
   ```bash
   make check-env
   ```

2. **Connectivité Azure**
   ```bash
   make validate-config
   ```

3. **Index inexistant**
   ```bash
   make index-status AZURE_SEARCH_KEY=your_key
   ```

4. **Problèmes de build**
   ```bash
   make clean
   make build
   ```

### Logs et debugging
- Les scripts fournissent des messages détaillés
- Utiliser `set -e` pour arrêter en cas d'erreur
- Vérifier les réponses HTTP des APIs Azure

## 📈 Monitoring

### Métriques importantes
- Nombre de documents indexés
- Taille de l'index
- Latence des requêtes
- Coûts des embeddings

### Commandes de monitoring
```bash
# Statut de l'index
make index-status AZURE_SEARCH_KEY=your_key

# Validation de la configuration
make validate-config
```

## 🔄 Maintenance

### Mise à jour des documents
1. Placer les nouveaux documents dans `src/indexers/new-data/`
2. Exécuter `make add-documents`
3. Les documents traités sont archivés automatiquement

### Reconstruction complète
```bash
make reindex AZURE_SEARCH_KEY=your_key AZURE_OPENAI_KEY=your_key
```

### Nettoyage
```bash
make clean  # Supprime les artefacts de build
```

## 🎓 Exemples d'usage

### Configuration initiale
```bash
# 1. Installer les dépendances
make install

# 2. Vérifier la configuration
make env-check
make config-validate

# 3. Créer l'index
make index-setup AZURE_SEARCH_KEY=sk-... AZURE_OPENAI_KEY=sk-...
```

### Ajout de nouveaux documents
```bash
# 1. Copier les documents .md dans src/indexers/new-data/
# 2. Indexer
make documents-add AZURE_SEARCH_KEY=sk-... AZURE_OPENAI_KEY=sk-...
```

### Développement quotidien
```bash
# Démarrer l'application
make dev

# Vérifier l'index
make index-status AZURE_SEARCH_KEY=sk-...
```
