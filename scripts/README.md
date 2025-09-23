# Scripts de Déploiement et Gestion des Secrets

Ce répertoire contient les scripts utilitaires pour le déploiement, la gestion des secrets et la configuration du projet.

## 📁 Fichiers disponibles

### `keyvault-preprocessor.js` 🔐
**Script principal pour la gestion sécurisée des secrets via Azure Key Vault.**

**Usage:**
```bash
# Validation des environnements
node scripts/keyvault-preprocessor.js validate dev
node scripts/keyvault-preprocessor.js validate --all

# Génération de fichiers .env résolus
node scripts/keyvault-preprocessor.js generate cotechnoe

# Démarrage direct avec résolution des secrets
node scripts/keyvault-preprocessor.js start cotechnoe
```

**Fonctionnalités:**
- Résolution automatique des références `@Microsoft.KeyVault(...)`
- Support de tous les environnements (dev, local, cotechnoe, playground)
- Traitement des fichiers `.env.{env}` et `.env.{env}.user`
- Architecture 5 Key Vaults pour sécurisation par environnement
- Cache des secrets pour optimiser les performances

### `config-cotechnoe.sh`
Script interactif pour configurer les variables d'environnement pour l'organisation Cotechnoe.

**Usage:**
```bash
./scripts/config-cotechnoe.sh
```

**Ce que fait le script:**
- Configure `AZURE_SUBSCRIPTION_ID` et `RESOURCE_SUFFIX` dans `.env.cotechnoe`
- Configure les clés Azure OpenAI dans `.env.cotechnoe.user`
- Guide l'utilisateur pour les prochaines étapes

### `deploy-cotechnoe.sh`
Script d'information et guide pour le déploiement vers Cotechnoe.

**Usage:**
```bash
./scripts/deploy-cotechnoe.sh
```

**Ce que fait le script:**
- Affiche les étapes de déploiement
- Liste les fichiers créés/modifiés
- Donne les commandes à exécuter

## 🚀 Processus de Déploiement Complet

1. **Configuration:** `./scripts/config-cotechnoe.sh`
2. **Authentification:** Se connecter à Azure et M365 Cotechnoe
3. **Provisioning:** `atk provision --env cotechnoe --config-file-path m365agents.cotechnoe.yml`
4. **Déploiement:** `atk deploy --env cotechnoe --config-file-path m365agents.cotechnoe.yml`
5. **Test:** Valider l'application dans Teams

## 📋 Prérequis

- Azure CLI installé
- Microsoft 365 Agents Toolkit (ATK) installé
- Accès administrateur au tenant cotechnoe01.onmicrosoft.com
- Souscription Azure associée à Cotechnoe
