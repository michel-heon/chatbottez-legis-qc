# 🛠️ Commandes Make - Référence complète

## ⚡ Commandes essentielles

### Configuration initiale
```bash
make install                # Installer les dépendances npm
make env-setup             # Configurer l'environnement (alias: playground-env-setup)
make setup-complete        # Configuration complète automatique (RECOMMANDÉ)
```

### Gestion quotidienne
```bash
make index-status          # Vérifier l'état de l'index
make index-test           # Tester les recherches
make index-summary        # Afficher résumé et problèmes
make index-warnings       # Analyser les avertissements d'indexation
```

## 🏗️ Gestion d'index

### Cycle de vie de l'index
```bash
make index-create         # Créer un nouvel index
make index-populate       # Peupler avec des documents
make index-delete         # Supprimer l'index
make index-reindex        # Recréer complètement (delete + create + populate)
```

### Configuration d'index
```bash
make index-config-list    # Lister les configurations disponibles
make setup-index-only     # Créer l'index sans contenu
make populate-content     # Ajouter contenu à un index existant
```

## 🔍 Diagnostic et validation

### Vérifications système
```bash
make env-check            # Vérifier variables d'environnement
make config-validate      # Valider configuration Azure Search
make diagnostic           # Diagnostic complet du système
```

### Environnement playground
```bash
make playground-env-setup    # Configuration automatique playground
make playground-env-validate # Validation complète playground
```

## 🧹 Maintenance et nettoyage

### Nettoyage des fichiers
```bash
make clean                # Nettoyer fichiers temporaires
make json-data-purge     # Purger fichiers JSON d'embedding
make reset-caches        # Reset complet caches et configurations
```

### Développement
```bash
make build               # Compiler TypeScript
make dev                 # Démarrer serveur de développement
```

## 🌍 Support multi-environnement

### Utilisation avec environnements
```bash
# Playground (défaut)
make setup-complete

# Local
make setup-complete ENV_CONFIG=local

# Développement
make setup-complete ENV_CONFIG=dev
```

### Validation par environnement
```bash
make env-check ENV_CONFIG=playground
make env-check ENV_CONFIG=local
make env-check ENV_CONFIG=dev
```

## ⚙️ Options et variables

### Variables globales disponibles
```bash
ENV_CONFIG=playground|local|dev     # Environnement (défaut: playground)
DRY_RUN=true|false                  # Mode simulation
FORCE=true|false                    # Forcer sans confirmation
```

### Exemples avec options
```bash
# Supprimer sans confirmation
make index-delete FORCE=true

# Purger en mode simulation
make json-data-purge DRY_RUN=true ENV_CONFIG=local

# Forcer la suppression avec simulation d'abord
make json-data-purge DRY_RUN=true
make json-data-purge FORCE=true
```

## 📊 Commandes de diagnostic avancées

### Nouvelles commandes v1.7.0
```bash
make index-summary        # Résumé documents indexés + identification problèmes
make index-warnings       # Analyse détaillée avertissements d'indexation
```

### Informations système
```bash
make help                 # Afficher toutes les commandes disponibles
make index-config-list    # Lister configurations d'index
```

## 🔧 Exemples d'utilisation pratiques

### Setup complet pour débutant
```bash
make install
make env-setup
# Éditer env/.env.playground.user avec vos clés
make setup-complete
```

### Workflow quotidien développeur
```bash
make index-status         # Vérifier l'état
make index-summary        # Identifier les problèmes
make populate-content     # Ajouter nouveau contenu
make index-test          # Valider les recherches
```

### Maintenance et nettoyage
```bash
make json-data-purge DRY_RUN=true     # Voir ce qui sera supprimé
make json-data-purge                  # Supprimer les fichiers JSON
make reset-caches                     # Reset complet
```

### Troubleshooting
```bash
make diagnostic                       # Diagnostic complet
make index-warnings                   # Analyser les warnings
make env-check                       # Vérifier la configuration
make config-validate                 # Tester Azure Search
```

### Recréation complète d'index
```bash
make index-delete FORCE=true         # Supprimer sans confirmation
make setup-complete                  # Recréer complètement
```

## 📋 Workflow recommandés

### Premier setup
1. `make install` - Dépendances
2. `make env-setup` - Configuration
3. Éditer `env/.env.playground.user`
4. `make setup-complete` - Création index + population

### Développement quotidien
1. `make index-status` - État actuel
2. `make index-summary` - Identifier problèmes
3. `make populate-content` - Ajouter contenu
4. `make index-test` - Valider

### Maintenance périodique
1. `make index-warnings` - Analyser avertissements
2. `make json-data-purge DRY_RUN=true` - Voir fichiers à purger
3. `make json-data-purge` - Purger si nécessaire
4. `make diagnostic` - Vérification complète

## 🆘 Aide et support

```bash
make help                 # Documentation complète dans le terminal
```

Pour plus de détails :
- [Configuration](./configuration.md) - Variables d'environnement
- [Dépannage](./troubleshooting.md) - Solutions aux problèmes
- [Guide développeur](./developer-guide.md) - Architecture technique

---

*Version : v1.7.0-ui-diagnostic-tools | Commandes mises à jour : 2025-08-28*
