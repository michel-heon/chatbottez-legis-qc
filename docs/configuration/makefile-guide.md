# Guide Makefile - ChatBotTez Légis Québec

Guide complet d'utilisation du Makefile pour gérer le provisioning, le déploiement et la maintenance du bot Teams ChatBotTez Légis Québec avec Microsoft 365 Agents Toolkit.

---

## 📖 Table des matières

- [Démarrage rapide](#-démarrage-rapide)
- [Commandes principales](#-commandes-principales)
- [Workflows recommandés](#-workflows-recommandés)
- [Bonnes pratiques](#-bonnes-pratiques)

---

## ⚡ Démarrage rapide

### Commandes essentielles

```bash
# Déploiement complet sur Cotechnoe
make cotechnoe-deploy

# Vérifier le statut
make status

# Aide complète
make help

# Liste exhaustive des cibles
make help-detailed
```

### Environnements supportés

- **local** : Développement local avec dev tunnel
- **playground** : Environnement de test Microsoft 365 Agents Playground
- **cotechnoe** : Environnement de production Cotechnoe

---

## 🔧 Commandes principales

### 🆘 Aide et information

```bash
make help          # Résumé de démarrage rapide
make help-detailed # Liste exhaustive des cibles documentées
make status        # Vérifie le statut de tous les environnements
```

### 🔐 Authentification

```bash
make auth-status         # Vérifie le statut d'authentification
make auth-setup          # Configuration complète (logout + login M365 + Azure)
make auth-login-m365     # Connexion Microsoft 365 uniquement
make auth-login-azure    # Connexion Azure uniquement
make auth-logout         # Déconnexion complète
```

**Important** : Toujours vérifier `make auth-status` avant les opérations critiques.

### 🛠️ Installation et Configuration

```bash
make install               # Installe les dépendances npm
make validate-env ENV=cotechnoe  # Valide un environnement spécifique
make dev-setup             # Configure VS Code pour le playground
```

### 🚀 Développement local

```bash
make dev-start        # Démarrer le bot local via Teams Toolkit
make dev-playground   # Lancer l'environnement playground/TestTool
make playground       # Alias de dev-playground
make test-tunnel      # Ouvrir un tunnel local (Dev Tunnels)
```

### 📦 Packaging & Preview

```bash
make package-app       # Générer appPackage.<ENV>.zip
make install-app       # Sideload du package (INSTALL_SCOPE=Personal par défaut)
make preview           # Preview Teams (Chrome par défaut via ATK, edge possible)
make preview-firefox   # Preview locale dans Firefox (script open-teams-firefox)
make refresh-secrets   # Provision + rotation des secrets pour ENV
```

### ☁️ Déploiement

#### Déploiement complet par environnement
```bash
make local-deploy       # Déploiement environnement local
make playground-deploy  # Déploiement environnement playground
make cotechnoe-deploy   # Déploiement environnement cotechnoe
```

#### Opérations individuelles
```bash
make provision ENV=cotechnoe  # Provisioning des ressources Azure
make deploy ENV=cotechnoe     # Déploiement de l'application
make publish ENV=cotechnoe    # Publication dans Teams
make full-deploy ENV=cotechnoe # Séquence complète (install + auth + deploy)
```

### 🧹 Maintenance & Nettoyage

```bash
make status           # Vérifier les environnements disponibles
make clean            # Nettoyer les artefacts courants
make clean-all        # Nettoyage approfondi (node_modules, devTools…)
make teams-clean      # Réinitialiser les artefacts Teams générés
make archive          # Créer une archive tar.gz du projet
make backup           # Copie rapide de env/ et appPackage/ (dans backups/)
```

### 🔧 Utilitaires

```bash
make open-admin-portal      # Ouvre https://aka.ms/teamsfx-mtac
make logs ENV=local         # Informations sur l'environnement ciblé
make health-check ENV=local # Vérification simple du bot déployé
```

---

## 📚 Workflows recommandés

### 🆕 Premier déploiement complet

```bash
# 1. Installer les dépendances
make install

# 2. Valider l'environnement
make validate-env ENV=cotechnoe

# 3. Configurer l'authentification
make auth-setup

# 4. Déploiement tout-en-un
make cotechnoe-deploy
```

**OU** en une seule commande :
```bash
make cotechnoe-deploy  # Exécute toute la séquence
```

### 🔄 Mise à jour du code source

```bash
# Pour changements dans le code source uniquement
make deploy ENV=cotechnoe
```

### 📝 Mise à jour du manifest Teams

```bash
# Pour changements dans le manifest Teams
make publish ENV=cotechnoe
```

### 🏗️ Mise à jour de l'infrastructure

```bash
# Pour changements dans l'infrastructure Azure
make provision ENV=cotechnoe
make deploy ENV=cotechnoe
```

### 💻 Développement quotidien

```bash
# Première fois
make local-deploy

# Développement jour après jour
make dev-start

# OU utiliser le Playground pour tests rapides
make playground
```

### 🧪 Tests et validation

```bash
# Test avec playground Microsoft 365
make playground-deploy

# Vérifier la santé du déploiement
make health-check ENV=cotechnoe

# Voir les logs d'environnement
make logs ENV=cotechnoe
```

### 🔍 Diagnostic

```bash
make status           # Vue d'ensemble
make auth-status      # Statut authentification
make logs ENV=local   # Logs environnement
make validate-env ENV=cotechnoe  # Validation fichiers
```

---

## 🎯 Bonnes pratiques

### 🔒 Sécurité et Authentification

#### Gestion des credentials
- ✅ Toujours utiliser `make auth-logout` avant de changer d'environnement
- ✅ Vérifier l'authentification avec `make auth-status` avant les opérations
- ❌ Ne **JAMAIS** committer les fichiers `.env.*.user` (contenus secrets)
- ✅ Utiliser `make refresh-secrets` pour rotation des secrets

#### Multi-tenant
- Le Makefile gère automatiquement le tenant ID Cotechnoe (`2cac8fbf-67ae-46f7-9b44-85f04c1dcd97`)
- Pour d'autres tenants, modifier la variable `TENANT_ID` dans le Makefile

### 🏗️ Déploiement

#### Ordre recommandé pour nouveaux environnements

1. `make validate-env ENV=<env>` - Validation des fichiers
2. `make auth-setup` - Configuration authentification
3. `make provision ENV=<env>` - Provisioning ressources
4. `make deploy ENV=<env>` - Déploiement application
5. `make publish ENV=<env>` - Publication Teams

#### Quand utiliser quelle commande ?

| Changement | Commande |
|------------|----------|
| Code source uniquement | `make deploy ENV=<env>` |
| Manifest Teams | `make publish ENV=<env>` |
| Infrastructure Azure | `make provision ENV=<env>` puis `make deploy ENV=<env>` |
| Secrets/credentials | `make refresh-secrets ENV=<env>` |
| Tout (full reset) | `make full-deploy ENV=<env>` |

### 🔧 Développement

#### Environnement local
```bash
# Première fois
make local-deploy

# Développement quotidien
make dev-start

# Si problèmes de tunnel
make test-tunnel
```

#### Tests
```bash
# Test rapide sans Teams
make playground

# Preview dans Teams
make preview

# Preview avec Firefox
make preview-firefox
```

### 🧹 Maintenance

#### Nettoyage régulier
```bash
# Après avoir terminé le développement
make clean

# Si problèmes persistants
make clean-all
make install
```

#### Avant un commit Git
```bash
# S'assurer que les artefacts temporaires sont nettoyés
make teams-clean
make clean
```

#### Backup avant changements majeurs
```bash
# Créer une sauvegarde rapide
make backup

# OU archive complète
make archive
```

### ⚠️ Pièges courants

1. **Authentification expirée** : Toujours vérifier `make auth-status` avant deploy
2. **Mauvais environnement** : Vérifier `make status` pour voir quel env est actif
3. **Secrets manquants** : Utiliser `make validate-env ENV=<env>` avant deploy
4. **Cache corrompu** : En cas de problème étrange, faire `make clean-all` puis `make install`

---

## 🆘 Résolution de problèmes

### Erreur d'authentification
```bash
make auth-logout
make auth-setup
```

### Tunnel ne démarre pas
```bash
make test-tunnel
# Vérifier les ports 3978, 9239 disponibles
```

### Package invalide
```bash
make clean
make package-app ENV=<env>
```

### Déploiement échoué
```bash
# Vérifier configuration
make validate-env ENV=<env>
make status

# Réessayer séquence complète
make full-deploy ENV=<env>
```

---

## 📚 Références

- [Microsoft 365 Agents Toolkit](https://aka.ms/teams-toolkit)
- [Teams App Manifest Schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Azure Developer CLI (azd)](https://aka.ms/azd)
- [Documentation interne](../README.md)

---

**Auteur** : Équipe ChatBotTez  
**Dernière mise à jour** : 2025-12-11  
**Version Makefile** : v2.0
