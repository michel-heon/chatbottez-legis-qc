# 🎮 Guide Microsoft 365 Agents Playground

Guide complet pour utiliser le Microsoft 365 Agents Playground avec Chatbot Legis QC.

## 🎯 Vue d'ensemble

Le Microsoft 365 Agents Playground est un environnement de test intégré qui permet de tester rapidement votre agent conversationnel sans avoir besoin de déployer sur Teams. Ce guide couvre la configuration automatisée mise en place pour ce projet.

## 🚀 Configuration automatisée

### 1. Setup initial de l'environnement
```bash
make playground-env-setup
```

Cette commande :
- ✅ Crée le fichier `env/.env.playground.user` avec les variables nécessaires
- ✅ Génère `.localConfigs.playground` avec la configuration runtime
- ✅ Configure les bonnes variables d'environnement avec préfixe `SECRET_`

### 2. Configuration des clés Azure

Éditez le fichier `env/.env.playground.user` créé automatiquement :

```bash
# Azure OpenAI Configuration
SECRET_AZURE_OPENAI_API_KEY=your_actual_openai_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002

# Azure AI Search Configuration
SECRET_SECRET_AZURE_SEARCH_KEY=your_actual_search_key_here
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_SEARCH_INDEX_NAME=index-data-sample

# Preview Playground Configuration
TEAMSFX_NOTIFICATION_STORE_FILENAME=.notification.playgroundstore.json
TEAMSAPPTESTER_PORT=56150
TEAMSFX_ENV=playground
```

### 3. Validation de la configuration
```bash
make playground-env-validate
```

Cette commande vérifie :
- ✅ Présence de tous les fichiers nécessaires
- ✅ Validité des variables d'environnement
- ✅ Format correct des endpoints Azure
- ✅ Disponibilité du port configuré
- ✅ Masquage sécurisé des clés sensibles

### 4. Création et indexation des données
```bash
make playground-setup
```

Cette commande utilise automatiquement les clés de `env/.env.playground.user` pour :
- ✅ Créer l'index Azure Search `index-data-sample`
- ✅ Indexer les documents du dossier `src/indexers/data/`
- ✅ Configurer la recherche vectorielle et textuelle

## 🎮 Démarrage du Playground

### Via les commandes NPM
```bash
# Terminal 1 : Démarrer l'application
npm run dev:teamsfx:testtool

# Terminal 2 : Lancer le playground
npm run dev:teamsfx:launch-testtool
```

### Via VS Code Tasks
1. **Ctrl+Shift+P** → "Tasks: Run Task"
2. Sélectionner : "Start application (Microsoft 365 Agents Playground)"
3. Sélectionner : "Start Microsoft 365 Agents Playground"

## 🔧 Gestion de l'index

### Vérifier le statut de l'index
```bash
# Utilise automatiquement les clés du playground
SECRET_AZURE_SEARCH_KEY="$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2)" make index-status
```

### Ajouter de nouveaux documents
1. Placer vos fichiers `.md` dans `src/indexers/data/`
2. Exécuter : `make playground-setup`

### Reconstruire l'index complet
```bash
# Supprime et recrée l'index avec toutes les données
SECRET_AZURE_SEARCH_KEY="$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2)" make index-reindex
```

## 🛡️ Sécurité

### Variables sensibles
- ✅ Toutes les clés utilisent le préfixe `SECRET_`
- ✅ Masquage automatique dans les logs Teams
- ✅ Fichiers `.env.playground.user` gitignorés
- ✅ Configuration runtime générée automatiquement

### Bonnes pratiques
- 🔒 Ne jamais commiter les fichiers `.env.*.user`
- 🔒 Utiliser des clés dédiées pour le développement
- 🔒 Régénérer les clés périodiquement
- 🔒 Vérifier régulièrement avec `make playground-env-validate`

## 🐛 Dépannage

### Erreur "Index name must only contain lowercase letters"
```bash
# Vérifiez le nom d'index dans la configuration
grep AZURE_SEARCH_INDEX_NAME env/.env.playground.user

# Nom valide : index-data-sample (lettres minuscules, chiffres, tirets)
```

### Erreur "RestError: The index was not found"
```bash
# Recréez l'index
make playground-setup
```

### Application ne démarre pas
```bash
# 1. Validez la configuration
make playground-env-validate

# 2. Recompilez l'application
npm run build

# 3. Redémarrez
npm run dev:teamsfx:testtool
```

### Port 56150 occupé
```bash
# Trouvez le processus utilisant le port
lsof -i :56150

# Tuez le processus si nécessaire
kill -9 <PID>
```

## 📊 Commandes de diagnostic

```bash
# Afficher la configuration actuelle
make playground-env-validate

# Vérifier l'état de l'index
SECRET_AZURE_SEARCH_KEY="$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2)" make index-status

# Tester la connectivité Azure
curl -H "api-key: $(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2)" \
     "$(grep AZURE_SEARCH_ENDPOINT env/.env.playground.user | cut -d'=' -f2)/indexes?api-version=2023-11-01"
```

## 🔄 Workflow de développement

1. **Configuration initiale** : `make playground-env-setup`
2. **Édition des clés** : Modifier `env/.env.playground.user`
3. **Validation** : `make playground-env-validate`
4. **Indexation** : `make playground-setup`
5. **Test** : Démarrer le playground
6. **Itération** : Modifier code → recompiler → tester

Ce workflow garantit un environnement de développement stable et sécurisé pour votre agent Microsoft 365.
