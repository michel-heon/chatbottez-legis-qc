# Guide d'utilisation du Makefile - ChatBotTez Légis Québec

Ce document explique comment utiliser le Makefile pour gérer le provisioning, le déploiement et la maintenance du bot Teams ChatBotTez Légis Québec.

## Vue d'ensemble

Le Makefile fourni automatise toutes les opérations courantes du projet, depuis l'installation des dépendances jusqu'au déploiement complet sur différents environnements.

## Commandes principales

### 🆘 Aide et information

```bash
make help          # Résumé de démarrage rapide
make help-detailed # Liste exhaustive des cibles documentées
make status         # Vérifie le statut de tous les environnements
```

### 🔧 Installation et Configuration

```bash
make install        # Installe les dépendances npm
make validate-env ENV=cotechnoe  # Valide un environnement spécifique
```

### 🔐 Authentification

```bash
make auth-status    # Vérifie le statut d'authentification
make auth-setup     # Configuration complète (logout + login M365 + Azure)
make auth-login-m365     # Connexion Microsoft 365 uniquement
make auth-login-azure    # Connexion Azure uniquement
make auth-logout    # Déconnexion complète
```

### 🚀 Déploiement

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
make full-deploy ENV=cotechnoe # Séquence complète
```

### 🛠️ Développement

```bash
make dev-start      # Démarre l'application en mode développement
make dev-playground # Lance l'environnement de test
make test-tunnel    # Démarre le tunnel de développement local
make preview-firefox # Ouvre la preview Teams dans Firefox via script dédié
make preview PREVIEW_BROWSER=edge # Par défaut Chrome; changer pour edge si besoin
make refresh-secrets ENV=local    # Régénère les secrets via provision
make package-app ENV=local        # Construit appPackage.<ENV>.zip
make install-app ENV=local        # Sideload du package (scope configurable via INSTALL_SCOPE)
```

### 📊 Monitoring et Debug

```bash
make logs ENV=cotechnoe  # Affiche les informations de l'environnement
make auth-status         # Vérifie l'authentification
```

### 🗂️ Gestion des environnements

```bash
make clean-env ENV=cotechnoe  # Supprime les ressources d'un environnement
make reset-env ENV=cotechnoe  # Remet à zéro un environnement
```

### 📦 Archivage et Nettoyage

```bash
make archive        # Crée une archive tar.gz du projet
make clean          # Nettoie les fichiers temporaires
make clean-all      # Nettoyage approfondi (node_modules, devTools)
make teams-clean    # Supprime les artefacts Teams générés
make backup         # Sauvegarde rapide de env/ et appPackage/
```

## Workflows typiques

### 1. Premier déploiement complet

```bash
# Déploiement sur l'environnement Cotechnoe
make cotechnoe-deploy

# Ou étape par étape :
make install
make auth-setup
make provision ENV=cotechnoe
make deploy ENV=cotechnoe
make publish ENV=cotechnoe
```

### 2. Mise à jour après modification du code

```bash
# Redéploiement rapide
make deploy ENV=cotechnoe

# Si changements dans le manifest Teams
make publish ENV=cotechnoe
```

### 3. Développement local

```bash
make install
make auth-setup
make local-deploy
make dev-start
```

### 3bis. Rafraîchir le secret local et relancer la preview

```bash
make refresh-secrets           # Régénère les secrets et met à jour env/.env.local*
make package-app               # Construit l'archive Teams
make install-app               # Sideload du package (scope Personal par défaut)
make preview-firefox           # Ouvre Teams (Firefox) avec l'app locale (script open-teams-firefox)
```

### 4. Diagnostic et dépannage

```bash
make status         # Vue d'ensemble
make auth-status    # Vérification authentification
make logs ENV=cotechnoe  # Informations détaillées
```

### 5. Remise à zéro complète

```bash
make clean-env ENV=cotechnoe
make provision ENV=cotechnoe
make deploy ENV=cotechnoe
make publish ENV=cotechnoe
```

## Variables d'environnement

Le Makefile utilise plusieurs variables que vous pouvez surcharger :

- `ENV` : Environnement cible (local, playground, cotechnoe)
- `TENANT_ID` : ID du tenant Azure (défaut: aba0984a-85a2-4fd4-9ae5-0a45d7efc9d2)

Exemple :
```bash
make provision ENV=playground TENANT_ID=mon-tenant-id
```

## Structure des fichiers

Le Makefile s'attend à trouver :
- `env/common.env` : Variables partagées (chargé automatiquement)
- `env/common.env.user` : Secrets partagés locaux (chargé automatiquement si présent)
- `env/.env.{ENV}` : Variables d'environnement
- `env/.env.{ENV}.user` : Variables secrètes
- `m365agents.{ENV}.yml` : Configuration Teams Toolkit

## Messages d'erreur courants

### "ENV doit être spécifié"
```bash
# ❌ Incorrect
make provision

# ✅ Correct
make provision ENV=cotechnoe
```

### "Fichier env/.env.{ENV} introuvable"
Vérifiez que le fichier d'environnement existe :
```bash
ls -la env/.env.*
```

### Erreurs d'authentification
```bash
make auth-logout
make auth-setup
```

## Conseils d'utilisation

1. **Toujours commencer par `make help`** pour voir les options disponibles
2. **Utiliser `make status`** pour vérifier l'état avant les opérations
3. **Les déploiements complets** (`make cotechnoe-deploy`) incluent toutes les étapes
4. **En cas d'erreur**, utiliser `make auth-status` et `make status` pour diagnostiquer
5. **Pour le développement**, utiliser `make dev-start` après `make local-deploy`

## Support

Pour plus d'informations sur les commandes Teams Toolkit utilisées :
- Documentation officielle : https://docs.microsoft.com/en-us/microsoftteams/platform/toolkit/
- Référence CLI : `atk --help`

---

*Dernière mise à jour : Septembre 2025*
*Auteur : Michel Héon PhD - Cotechnoe inc.*
