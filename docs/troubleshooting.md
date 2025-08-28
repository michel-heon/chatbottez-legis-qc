# 🔧 Dépannage - Solutions aux problèmes courants

## 🚨 Problèmes critiques

### ❌ Erreur : "Index name must only contain lowercase letters"

**Cause** : Le nom d'index contient des caractères non autorisés.

**Solution** :
```bash
# Vérifier le nom actuel
echo $AZURE_SEARCH_INDEX_NAME

# Corriger dans le fichier d'environnement
# Utiliser uniquement : a-z, 0-9, tirets
# Exemple correct : legis-qc-index-full-01
```

### ❌ Erreur : "RestError: Access denied" 

**Cause** : Clés Azure incorrectes ou expirées.

**Solution** :
```bash
# Vérifier la configuration
make env-check

# Valider les clés Azure
make config-validate

# Régénérer les clés dans Azure Portal si nécessaire
```

### ❌ Erreur : "No documents found in index"

**Cause** : Index vide ou problème de population.

**Solution** :
```bash
# Vérifier l'état de l'index
make index-status

# Analyser les warnings
make index-warnings

# Repeupler l'index
make populate-content

# Si nécessaire, recréer complètement
make index-reindex
```

## 🔍 Problèmes de configuration

### Variable d'environnement manquante

**Symptôme** : Messages d'erreur sur variables non définies.

**Solution** :
```bash
# Diagnostic complet
make env-check

# Configuration playground manquante
make playground-env-setup

# Vérifier les fichiers d'environnement
ls -la env/.env.*.user
```

### Fichier d'environnement corrompu

**Symptôme** : Erreurs de parsing ou variables mal définies.

**Solution** :
```bash
# Recréer le fichier d'environnement
rm env/.env.playground.user
make playground-env-setup

# Valider après édition
make playground-env-validate
```

## 📊 Problèmes d'indexation

### Documents non indexés

**Diagnostic** :
```bash
# Résumé des documents
make index-summary

# Analyser les avertissements
make index-warnings

# État détaillé
make index-status
```

**Solutions** :
```bash
# Repeupler incrémental
make populate-content

# Si échec persistant, recréer
make index-delete FORCE=true
make setup-complete
```

### Échecs d'embedding

**Symptôme** : Warnings "chunk embeddings failed" ou "Content embedding failed".

**Diagnostic** :
```bash
make index-warnings
```

**Solutions** :
```bash
# Vérifier les clés OpenAI
make config-validate

# Vérifier les quotas Azure OpenAI
# Réduire la taille des batches si nécessaire
```

## 🔧 Problèmes de build et développement

### Erreurs TypeScript

**Symptôme** : Échec de compilation.

**Solution** :
```bash
# Nettoyer et rebuilder
make clean
make install
make build
```

### Processus bloqués

**Symptôme** : Ports occupés ou processus qui ne s'arrêtent pas.

**Solution** :
```bash
# Reset complet
make reset-caches

# Tuer les processus Node.js
pkill -f "node.*index.ts"
pkill -f "nodemon"
```

## 🌍 Problèmes d'environnement

### Environnement playground non fonctionnel

**Diagnostic** :
```bash
make playground-env-validate
```

**Solution** :
```bash
# Reconfiguration complète
make playground-env-setup
# Éditer env/.env.playground.user
make playground-env-validate
```

### Synchronisation des fichiers d'environnement

**Symptôme** : Incohérences entre fichiers de config.

**Solution** :
```bash
# Synchronisation automatique
make env-sync

# Reset complet si nécessaire
make reset-caches
```

## 📁 Problèmes de données

### Données TTL non trouvées

**Symptôme** : "TTL file not found" ou "No TTL data".

**Solution** :
```bash
# Vérifier les chemins
echo $EXTERNAL_DATA_SOURCE_PATH
echo $TTL_METADATA_FILE

# Lister les fichiers TTL disponibles
ls -la $EXTERNAL_DATA_SOURCE_PATH/*.ttl
```

### Fichiers JSON corrompus

**Symptôme** : Erreurs de parsing JSON.

**Solution** :
```bash
# Purger les fichiers JSON
make json-data-purge DRY_RUN=true  # Voir les fichiers
make json-data-purge               # Supprimer

# Regenerer
make populate-content
```

## 🛠️ Commandes de diagnostic

### Diagnostic complet automatique
```bash
make diagnostic
```

### Diagnostic étape par étape
```bash
# 1. Configuration
make env-check

# 2. Connectivité Azure
make config-validate

# 3. État index
make index-status

# 4. Résumé documents
make index-summary

# 5. Analyse warnings
make index-warnings
```

## 🆘 Solutions d'urgence

### Reset complet du projet
```bash
# Sauvegarder vos clés d'abord !
cp env/.env.playground.user /tmp/backup-env

# Reset complet
make reset-caches
make clean
rm -rf node_modules lib dist

# Réinstaller
make install
make build

# Restaurer configuration
cp /tmp/backup-env env/.env.playground.user
make playground-env-validate

# Recréer index
make setup-complete
```

### Problème Azure persistant
```bash
# Changer d'environnement temporairement
make setup-complete ENV_CONFIG=local

# Tester avec un nouvel index
AZURE_SEARCH_INDEX_NAME=test-$(date +%s) make index-create
```

## 📞 Escalade et support

### Logs à collecter
```bash
# Logs de diagnostic
make diagnostic > diagnostic-$(date +%Y%m%d).log

# Logs d'indexation
cat $EXTERNAL_DATA_SOURCE_PATH/transform/processed/warnings.log

# Configuration anonymisée
make env-check | sed 's/SECRET_[^=]*=.*/SECRET_***=***/g'
```

### Informations système
```bash
# Version du projet
head -3 Makefile

# Version Node.js
node --version

# État des dépendances
npm list --depth=0
```

## 🔄 Workflows de récupération

### Récupération après échec d'indexation
1. `make index-warnings` - Identifier le problème
2. `make json-data-purge` - Nettoyer les fichiers corrompus
3. `make populate-content` - Repeupler
4. `make index-summary` - Vérifier le résultat

### Récupération après échec de configuration
1. `make env-check` - Identifier les variables manquantes
2. `make playground-env-setup` - Reconfigurer
3. Éditer `env/.env.playground.user`
4. `make playground-env-validate` - Valider
5. `make setup-complete` - Relancer

---

**💡 Conseil** : Toujours commencer par `make diagnostic` pour un aperçu global !

*Pour plus d'aide : consultez [make-commands.md](./make-commands.md) ou [configuration.md](./configuration.md)*
