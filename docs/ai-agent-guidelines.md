# 🤖 Guide Agent IA - Conventions et bonnes pratiques

## 🎯 Informations essentielles pour l'agent IA

### Contexte du projet
- **Projet** : Chatbot Legis QC - Système juridique avec Azure AI Search
- **Architecture** : Ontology-driven avec intégration Microsoft 365 Teams
- **Environnement principal** : `playground` (Microsoft 365 Agents)
- **Version actuelle** : v1.7.0-ui-diagnostic-tools

### Structure des commandes disponibles
```bash
# Commandes principales (toujours suggérer ces workflows)
make install && make env-setup && make setup-complete  # Setup complet
make index-status                                       # Vérifier état
make index-summary                                      # Identifier problèmes  
make index-warnings                                     # Analyser warnings
make help                                              # Aide complète
```

## 📋 Conventions obligatoires à respecter

### Nommage des commandes Make
**Pattern strict** : `<objet>-<action>`

✅ **À suggérer** :
- `index-create`, `index-delete`, `index-status`
- `data-populate`, `env-check`, `config-validate`

❌ **Ne jamais suggérer** :
- `createIndex`, `deleteIndex` (CamelCase interdit)
- `setup_env`, `check_config` (underscores interdits)

### Usage des icônes - Règle de parcimonie
**Principe** : Limiter strictement l'usage des icônes pour préserver la lisibilité

✅ **Usage autorisé** (uniquement pour mettre en évidence) :
- `❌` Pour les erreurs critiques uniquement
- `✅` Pour les succès importants uniquement  
- `⚠️` Pour les avertissements de sécurité uniquement
- `🚨` Pour les alertes urgentes uniquement

❌ **Usage à éviter** :
- Icônes décoratives multiples (🔍📊🚀📋🏗️✨🔧🛠️📤🗑️)
- Icônes dans chaque ligne de commande ou instruction
- Icônes redondantes avec le contexte textuel
- Plus de 1-2 icônes par section

**Exemple INCORRECT** :
```bash
🔍 make index-status    # 📊 Vérifier l'état
🚀 make index-test      # ✨ Tester les recherches  
🛠️ make diagnostic     # 🔧 Diagnostic complet
```

**Exemple CORRECT** :
```bash
make index-status      # Vérifier l'état
make index-test        # Tester les recherches
make diagnostic        # Diagnostic complet

❌ Erreur critique : Index non trouvé
✅ Configuration validée avec succès
```

### Favoriser la réutilisabilité
**Principe** : Concevoir tout élément pour être réutilisable et modulaire

✅ **Patterns à promouvoir** :

**Documentation réutilisable** :
- Créer des sections référençables : `[Voir configuration](./configuration.md#variables-azure)`
- Utiliser des templates : Structures de commandes standardisées
- Éviter la duplication : Une information = un seul endroit de référence

**Scripts réutilisables** :
- Fonctions modulaires : `scripts/common-functions.sh` à sourcer
- Paramètres configurables : `./script.sh ENV_CONFIG OPTION`
- Variables d'environnement : Support multi-environnement intégré

**Règles Make réutilisables** :
- Macros Make : `$(call check_env_config)` pour validations communes
- Variables partagées : `EFFECTIVE_ENV := $(or $(ENV_CONFIG),playground)`
- Patterns communs : Structure identique pour toutes les règles similaires

**Programmes réutilisables** :
- Configuration externalisée : Pas de valeurs hard-codées
- Interfaces standardisées : API cohérentes entre modules
- Composants modulaires : Fonctions importables et testables

### Variables d'environnement
**Règle de sécurité stricte** :

```env
# Variables sensibles : préfixe SECRET_ OBLIGATOIRE
SECRET_AZURE_SEARCH_KEY=xxx
SECRET_AZURE_OPENAI_API_KEY=xxx

# Variables de configuration : PAS de préfixe SECRET_
AZURE_SEARCH_INDEX_NAME=xxx
AZURE_SEARCH_ENDPOINT=xxx
ENV_CONFIG=playground|local|dev
```

### Environnements disponibles
- **`playground`** (défaut) - Microsoft 365 Agents - **TOUJOURS RECOMMANDER EN PREMIER**
- **`local`** - Développement individuel
- **`dev`** - Environnement équipe

## 🚀 Workflows recommandés à suggérer

### 1. Premier setup utilisateur
```bash
make install
make env-setup
# Éditer env/.env.playground.user avec les clés
make setup-complete
```

### 2. Diagnostic de problèmes
```bash
make diagnostic              # Diagnostic complet
make index-summary          # Résumé + identification problèmes
make index-warnings         # Analyser avertissements détaillés
```

### 3. Maintenance quotidienne
```bash
make index-status           # État actuel
make populate-content       # Ajouter nouveau contenu
make index-test            # Valider recherches
```

### 4. Dépannage d'urgence
```bash
make env-check              # Vérifier configuration
make config-validate        # Tester Azure
make index-delete FORCE=true && make setup-complete  # Reset complet
```

## ⚠️ Erreurs courantes à éviter

### ❌ Commandes incorrectes à ne jamais suggérer
```bash
# FAUX - Anciennes commandes obsolètes
make enhanced-setup         # Remplacé par setup-complete
make ontology-setup        # Remplacé par setup-complete  
make ttl-setup             # Remplacé par setup-complete

# FAUX - Variables incorrectes
SECRET_SECRET_AZURE_SEARCH_KEY    # Double préfixe SECRET_
AZURE_SEARCH_API_KEY              # Nom incorrect
```

### ❌ Usage excessif d'icônes à éviter
```bash
# FAUX - Trop d'icônes nuit à la lisibilité
🔍 make index-status 📊    # Vérifier l'état 🚀
🛠️ make diagnostic ⚙️     # Diagnostic 🔧 complet ✨

# FAUX - Icônes décoratives inutiles
echo "🌟 Démarrage du processus 🚀"
echo "📋 Étape 1 terminée ✅"
echo "🔧 Configuration en cours ⚙️"
```

### ❌ Anti-patterns de réutilisabilité
```bash
# FAUX - Code dupliqué sans réutilisabilité
# Dans script1.sh
if [ -f "env/.env.playground.user" ]; then
    set -a && . env/.env.playground.user && set +a
fi

# Dans script2.sh (même code dupliqué)
if [ -f "env/.env.playground.user" ]; then
    set -a && . env/.env.playground.user && set +a
fi

# FAUX - Documentation dupliquée
# Configuration Azure dans 3 fichiers différents

# FAUX - Règles Make non modulaires
index-create-playground:  # Spécifique à un env
index-create-local:       # Code dupliqué
index-create-dev:         # Code dupliqué
```

### ✅ Commandes correctes à toujours privilégier
```bash
# CORRECT - Commandes actuelles
make setup-complete         # Configuration complète
make index-summary         # Nouveau dans v1.7.0
make index-warnings        # Nouveau dans v1.7.0
make env-setup            # Alias correct pour playground-env-setup
```

### ✅ Usage approprié des icônes
```bash
# CORRECT - Icônes uniquement pour signaler importance
make index-status           # Vérifier l'état
make index-test            # Tester les recherches

❌ Erreur critique : Index non accessible
✅ Configuration Azure validée
⚠️ Attention : Clés expirées détectées
```

### ✅ Patterns de réutilisabilité à promouvoir
```bash
# CORRECT - Fonction réutilisable commune
# scripts/common-functions.sh
load_environment() {
    local env_config=${1:-playground}
    if [ -f "env/.env.${env_config}.user" ]; then
        set -a && . "env/.env.${env_config}.user" && set +a
    fi
}

# CORRECT - Usage dans multiple scripts
source scripts/common-functions.sh
load_environment "$ENV_CONFIG"

# CORRECT - Règle Make réutilisable multi-environnement
index-create: env-check
	$(eval EFFECTIVE_ENV := $(or $(ENV_CONFIG),playground))
	# Code générique pour tous les environnements

# CORRECT - Documentation centralisée
# Une seule source de vérité pour chaque information
```

## 🔧 Options de commandes importantes

### Variables Make disponibles
```bash
ENV_CONFIG=playground|local|dev    # Environnement (défaut: playground)
DRY_RUN=true|false                # Mode simulation  
FORCE=true|false                  # Forcer sans confirmation
```

### Exemples avec options
```bash
make index-delete FORCE=true                    # Supprimer sans confirmation
make json-data-purge DRY_RUN=true              # Simulation
make setup-complete ENV_CONFIG=local           # Environnement local
```

## 📚 Documentation à référencer

### Documents principaux (toujours à jour)
- **README.md** - Index général et navigation
- **getting-started.md** - Guide démarrage pour nouveaux utilisateurs
- **make-commands.md** - Référence complète des commandes
- **troubleshooting.md** - Solutions aux problèmes courants
- **configuration.md** - Variables d'environnement et config

### Documents spécialisés (pour experts)
- **developer-guide.md** - Conventions et architecture
- **apache-jena-integration.md** - Intégration SPARQL/RDF
- **azure-search-management.md** - Gestion Azure AI Search

## 🎯 Messages types à utiliser

### En cas de problème - Format épuré
```markdown
Je vais diagnostiquer le problème. Commençons par :

`make diagnostic`

Puis analysons les détails :
`make index-summary`
`make index-warnings`

❌ Si erreurs critiques détectées, voir troubleshooting.md
```

### Pour une première installation - Sans icônes excessives
```markdown
Configuration du projet en 4 étapes :

1. `make install` - Installer les dépendances
2. `make env-setup` - Configurer l'environnement  
3. Éditer `env/.env.playground.user` avec vos clés Azure
4. `make setup-complete` - Configuration complète

Vérification : `make index-status`

✅ Installation réussie si aucune erreur affichée
```

### Pour référencer la documentation - Liens réutilisables
```markdown
Consultez la documentation centralisée :

- [Guide démarrage](./docs/getting-started.md) - Setup complet
- [Commandes Make](./docs/make-commands.md) - Référence complète
- [Configuration](./docs/configuration.md) - Variables d'environnement
- [Dépannage](./docs/troubleshooting.md) - Solutions problèmes

⚠️ Pour problèmes urgents : `make diagnostic`
```

### Promotion de la réutilisabilité
```markdown
Ce workflow est réutilisable pour tous les environnements :

```bash
# Template réutilisable
make setup-complete ENV_CONFIG=playground  # Microsoft 365
make setup-complete ENV_CONFIG=local       # Développement
make setup-complete ENV_CONFIG=dev         # Équipe
```

Modifiez uniquement la variable ENV_CONFIG selon vos besoins.
```

## 🚨 Points critiques de sécurité

### Clés Azure
- **JAMAIS** exposer les clés dans les exemples
- **TOUJOURS** rappeler d'utiliser le préfixe `SECRET_`
- **TOUJOURS** mentionner que les clés sont masquées dans les logs

### Fichiers sensibles
```bash
# Ces fichiers ne doivent JAMAIS être commités
env/.env.*.user
.localConfigs.*
```

## 📊 Outils de diagnostic v1.7.0

### Nouvelles commandes importantes à promouvoir
```bash
make index-summary    # Résumé documents + identification problèmes
make index-warnings   # Analyse détaillée des avertissements
```

Ces commandes sont nouvelles et très utiles pour identifier rapidement les problèmes d'indexation.

---

**🤖 Rappel Agent IA** : 

1. **Lisibilité avant tout** : Limiter drastiquement l'usage des icônes pour préserver la clarté
2. **Réutilisabilité systématique** : Concevoir chaque élément pour être modulaire et réutilisable
3. **Workflows standardisés** : Toujours privilégier les commandes actuelles et patterns établis
4. **Documentation centralisée** : Une information = un seul endroit de référence

En cas de doute, référencer la documentation mise à jour !

*Version : v1.7.0-ui-diagnostic-tools | Guide Agent IA mis à jour : 2025-08-28*
