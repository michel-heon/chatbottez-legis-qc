# Scripts de Déploiement

Ce répertoire contient les scripts utilitaires pour le déploiement et la configuration du projet.

## 📁 Fichiers disponibles

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
