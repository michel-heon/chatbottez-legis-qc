# Playground Studio 🎮

Environnement de test et développement pour Microsoft 365 Agents Playground.

## 🚀 Démarrage Rapide

```bash
cd playgroundStudio
make start
```

Le Playground sera accessible sur http://localhost:56150

## 📋 Commandes Principales

| Commande | Description |
|----------|-------------|
| `make start` | Démarre l'environnement complet (validation + deploy + app + UI) |
| `make stop` | Arrête tous les services |
| `make restart` | Redémarre l'environnement |
| `make status` | Affiche l'état des services |
| `make logs` | Affiche les logs en temps réel |

## 🛠️ Services

### Application Agent (Port 3978)
Serveur Bot Framework avec l'agent conversationnel.

### Debug Server (Port 9239)
Point d'entrée pour le debugger Node.js.

### Playground UI (Port 56150)
Interface de test Microsoft 365 Agents Playground.

## 🔧 Commandes Utiles

### Validation et Déploiement
```bash
make validate          # Vérifie Node.js, npm, ports
make check-ports       # Vérifie disponibilité des ports
make deploy           # Déploie les ressources Playground
```

### Services Individuels
```bash
make start-app         # Démarre seulement l'application
make start-playground  # Démarre seulement le Playground UI
```

### Monitoring
```bash
make status           # État de tous les services
make ports            # Liste processus sur les ports
make test-connection  # Teste la connexion HTTP
```

### Nettoyage
```bash
make clean            # Nettoie logs et cache
make clean-all        # Nettoyage complet (incl. node_modules)
make reset            # Reset complet de l'environnement
make kill-ports       # Force la libération des ports
```

### Informations
```bash
make info             # Configuration actuelle
make version          # Versions des outils
make help             # Affiche toutes les commandes
```

## 🐛 Dépannage

### Les ports sont déjà utilisés
```bash
make kill-ports       # Libère les ports
make start            # Redémarre
```

### L'application ne démarre pas
```bash
make validate         # Vérifie les prérequis
make clean            # Nettoie l'environnement
make start            # Redémarre
```

### Playground UI ne s'affiche pas
```bash
# Vérifier que l'application est démarrée
make status

# Redémarrer seulement le Playground UI
make start-playground
```

### Reset complet
```bash
make reset            # Reset tout
cd ..
npm install           # Réinstaller dépendances si nécessaire
cd playgroundStudio
make start
```

## 📊 Workflow de Test

1. **Démarrer l'environnement**
   ```bash
   make start
   ```

2. **Vérifier l'état**
   ```bash
   make status
   ```

3. **Ouvrir le Playground**
   - Navigateur: http://localhost:56150
   - Tester les commandes juridiques
   - Observer les logs: `make logs`

4. **Arrêter proprement**
   ```bash
   make stop
   ```

## 🔄 Développement Itératif

```bash
# Terminal 1: Logs en temps réel
make logs

# Terminal 2: Commandes
make start            # Démarrer
# ... faire des modifications dans src/ ...
make restart          # Redémarrer pour appliquer
```

## 🎯 Ports Utilisés

| Service | Port | URL |
|---------|------|-----|
| Application Agent | 3978 | http://localhost:3978 |
| Debug Server | 9239 | http://localhost:9239 |
| Playground UI | 56150 | http://localhost:56150 |

## 📝 Fichiers de Configuration

- `.localConfigs.playground` - Configuration locale Playground
- `env/.env.playground` - Variables d'environnement Playground
- `m365agents.playground.yml` - Manifest agent Playground

## 🚨 Notes Importantes

- **Nodemon:** L'application utilise nodemon pour le hot-reload
- **Background:** Les processus `start-app` et `start-playground` tournent en arrière-plan
- **Logs:** Les logs de l'application sont visibles avec `make logs`
- **Cache:** Le Playground garde un cache, utiliser `make clean` si comportement étrange

## 🤝 Contribution

Pour ajouter de nouvelles commandes au Makefile:

1. Ajouter la target avec description `##`
2. Utiliser les couleurs définies (COLOR_*)
3. Documenter dans ce README
4. Tester avec `make help`

## 📚 Références

- [Microsoft 365 Agents SDK](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/)
- [Teams Toolkit CLI](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teams-toolkit-cli)
- [Bot Framework](https://dev.botframework.com/)

---

**Auteur:** @michel-heon  
**Version:** 1.0.0  
**Dernière mise à jour:** 12 décembre 2025
