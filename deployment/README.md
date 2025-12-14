# Deployment - CI/CD Orchestration

Ce répertoire contient l'orchestration CI/CD pour le projet Légis Québec.

## Structure

```
deployment/
├── Makefile      # Orchestrateur central (⭐)
└── README.md     # Cette documentation
```

## Philosophie Makefile-oriented

Le `Makefile` est l'interface unique pour toutes les opérations de déploiement, que ce soit en développement local ou dans GitHub Actions.

**Avantages** :
- 🔄 **Portabilité** : Les mêmes commandes fonctionnent localement et en CI/CD
- 🧪 **Testabilité** : Dev peut tester déploiement avant de pousser
- 📖 **Documentation vivante** : `make help` documente toutes les opérations
- 🎯 **Simplicité** : GitHub Actions = wrapper minimal autour de Make
- 🛠️ **Maintenabilité** : Logique centralisée, pas dispersée dans YAML

## Prérequis

- **Node.js** 18+
- **Teams Toolkit CLI** : `npm install -g @microsoft/teamsfx-cli`
- **Azure CLI** : Pour authentification Azure

## Commandes disponibles

### Aide

```bash
make help
```

Affiche tous les targets disponibles avec descriptions.

### Tests locaux

```bash
make test
```

Exécute les tests npm. Utilisez cette commande avant de créer une PR pour vérifier que vos tests passent.

### Build

```bash
make build
```

Build l'application. Vérifie que le code compile sans erreurs.

### Déploiement DEV

```bash
# 1. Provisionner ressources Azure DEV (première fois)
make provision-dev

# 2. Déployer vers DEV
make deploy-dev

# 3. Valider déploiement
make validate
```

### Déploiement PROD

```bash
# 1. Provisionner ressources Azure PROD (première fois)
make provision-prod

# 2. Déployer vers PROD
make deploy-prod

# 3. Valider déploiement
make validate
```

## Usage local (développeur)

### Tester avant de pousser

```bash
# Avant de créer une PR
make test
make build

# Si succès → créer PR
# GitHub Actions exécutera les mêmes commandes
```

### Tester déploiement DEV localement

```bash
# S'assurer d'être authentifié Azure
az login

# Tester déploiement
make deploy-dev

# Si succès → pousser vers branche dev
# GitHub Actions exécutera la même commande
```

## Usage CI/CD (GitHub Actions)

Les workflows GitHub Actions sont des **wrappers minimalistes** autour du Makefile:

### ci-tests.yml

```yaml
- run: make -C deployment test
- run: make -C deployment build
```

### deploy-dev.yml

```yaml
- run: make -C deployment deploy-dev
- run: make -C deployment validate
```

### deploy-prod.yml

```yaml
- run: make -C deployment deploy-prod
- run: make -C deployment validate
```

## Avantages approche Makefile

### 1. Portabilité

Même commande fonctionne sur:
- Machine développeur (Windows/Mac/Linux)
- GitHub Actions runners (Ubuntu)
- Tout environnement avec `make` installé

### 2. Testabilité

Développeur peut:
- Tester `make deploy-dev` localement avant de pousser
- Déboguer problèmes déploiement sans CI/CD
- Vérifier configuration Azure localement

### 3. Debugging

Si CI/CD échoue:
1. Reproduire localement: `make <target>`
2. Identifier problème
3. Fixer localement
4. Pousser fix

### 4. Documentation

`make help` documente toutes opérations disponibles. Pas besoin de lire YAML complexe.

### 5. Simplicité

GitHub Actions devient ultra-simple:
```yaml
- run: make -C deployment <target>
```

Pas de logique complexe dans YAML. Tout est dans Makefile.

## Principes du Makefile

- ✅ **Minimaliste** : Pas de couleurs, pas de "flala", focus sur fonctionnalité
- ✅ **Clair** : Messages explicites, erreurs lisibles
- ✅ **Robuste** : Vérifications prérequis (Node.js, Teams CLI)
- ✅ **Idempotent** : Même commande plusieurs fois = même résultat
- ✅ **Rapide** : Pas d'opérations inutiles

## Troubleshooting

### `make: command not found`

**Windows**: Installer `make` via Chocolatey:
```powershell
choco install make
```

**Mac**: Installer Xcode Command Line Tools:
```bash
xcode-select --install
```

**Linux**: Installer via package manager:
```bash
sudo apt-get install make
```

### `teamsapp: command not found`

Installer Teams Toolkit CLI:
```bash
npm install -g @microsoft/teamsfx-cli
```

### `ERREUR: Node.js n'est pas installe`

Installer Node.js 18+:
- [nodejs.org](https://nodejs.org/)

### Tests échouent localement mais pas en CI

Vérifier:
1. Version Node.js identique (18+)
2. Dépendances à jour: `npm ci`
3. Variables d'environnement `.env` configurées

## Références

- [ADR-023: CI/CD GitHub Actions](../docs/adr/023-cicd-github-actions.md)
- [ADR-012: Pratiques Développement Toolkit](../docs/adr/012-pratiques-developpement-toolkit.md)
- [Guide: Production Deployment](../docs/guides/deployment/production-deployment.md)
- [Issue #29: CI/CD Automation](https://github.com/michel-heon/chatbottez-legis-qc/issues/29)

## Historique

| Date | Version | Changements |
|------|---------|-------------|
| 2025-01-20 | 1.0 | Création initiale Makefile-oriented |
