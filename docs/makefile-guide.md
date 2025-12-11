# Guide d'utilisation du Makefile
## Légis Québec - Chatbot juridique du Québec

Ce guide présente les cibles importantes du Makefile modernisé pour travailler avec Microsoft 365 Agents Toolkit.

## 🚀 Développement
```bash
make install          # Installer les dépendances npm
make dev-start        # Démarrer le bot local via Teams Toolkit
make dev-playground   # Lancer l'environnement playground/TestTool
make playground       # Alias de dev-playground
make test-tunnel      # Ouvrir un tunnel local (Dev Tunnels)
```

## 🎯 Packaging & Preview
```bash
make refresh-secrets  # Provision + rotation des secrets pour ENV
make package-app      # Générer appPackage.<ENV>.zip
make install-app      # Sideload du package (INSTALL_SCOPE=Personal par défaut)
make preview          # Preview Teams (Chrome (Chromium snap) par défaut via ATK, edge possible)
make preview-firefox  # Preview locale dans Firefox (script open-teams-firefox)
```

## ☁️ Déploiement
```bash
make provision ENV=cotechnoe  # Provision Azure pour l'environnement
make deploy ENV=cotechnoe     # Déployer le code
make publish ENV=cotechnoe    # Publier dans le catalogue Teams
make full-deploy ENV=cotechnoe # Chaîne complète (install + auth + deploy)
```

## 🧹 Maintenance & Nettoyage
```bash
make status           # Vérifier les environnements disponibles
make clean            # Nettoyer les artefacts courants
make clean-all        # Nettoyage approfondi (node_modules, devTools…)
make teams-clean      # Réinitialiser les artefacts Teams générés
make archive          # Créer une archive tar.gz du projet
```

## 🔧 Utilitaires
```bash
make backup           # Copie rapide de env/ et appPackage/ (dans backups/)
make dev-setup        # Configure VS Code pour le playground
make open-admin-portal # Ouvre https://aka.ms/teamsfx-mtac
make logs ENV=local   # Informations sur l'environnement ciblé
make health-check ENV=local # Vérification simple du bot déployé
```

## 📚 Workflows recommandés

### Développement local
```bash
make install
make auth-setup
make refresh-secrets ENV=local
make dev-start
```

### Sideload Teams rapide
```bash
make refresh-secrets ENV=local
make package-app ENV=local
make install-app ENV=local INSTALL_SCOPE=Personal
make preview-firefox
```

### Déploiement vers Azure (prod/cotechnoe)
```bash
make install
make auth-setup
make full-deploy ENV=cotechnoe
```

## ℹ️ Références utiles
- `make help` : résumé rapide des commandes essentielles
- `make help-detailed` : liste exhaustive des cibles documentées
- `docs/MAKEFILE.md` : guide détaillé avec exemples
- `docs/ENVIRONMENT_SETUP.md` : configuration des environnements et VS Code

Ce Makefile vise la réutilisabilité : préférez les cibles `refresh-secrets`, `package-app`, `install-app` et `preview` plutôt que des scripts ad hoc. Les commandes obsolètes et les anciens scripts de résolution de conflits ont été retirés pour alléger le workflow.
