# Configuration d'Environnement

## ⚠️ SÉCURITÉ
Les fichiers `.env.*` de ce dossier contiennent des informations sensibles et ne doivent JAMAIS être commités dans Git.

## 📋 Configuration d'un nouvel environnement

### Option 1: Via le Makefile principal
```bash
# Depuis la racine du projet
make init-env ENV=votre-environnement
make list-env
make validate-env-config ENV=votre-environnement
```

### Option 2: Via le Makefile local
```bash
# Depuis le dossier env/
cd env
make init ENV=votre-environnement
make list
make validate ENV=votre-environnement
```

### Configuration manuelle
1. **Copier le template**
```bash
cp .env.template .env.votre-environnement
```

2. **Remplacer les placeholders**
- `<ENVIRONMENT_NAME>` : Nom de l'environnement (dev, prod, etc.)
- `<AZURE_SUBSCRIPTION_ID>` : ID de votre souscription Azure
- `<KV_NAME>` : Nom de votre Key Vault
- `<SECRET_NAME>` : Nom du secret dans Key Vault

### 3. Obtenir les valeurs réelles
- **IDs Azure** : Via Azure Portal ou `az account show`
- **Key Vault** : `az keyvault secret list --vault-name <vault>`
- **Teams App IDs** : Via Teams Developer Portal

## 🔑 Stratégie de sécurité
- ✅ Secrets stockés dans Azure Key Vault
- ✅ Références Key Vault dans les fichiers .env
- ✅ Placeholders génériques dans les templates
- ❌ Jamais de secrets en clair dans Git

## 🏗️ Architecture Key Vault
- `kv-*-shared-*` : Secrets partagés (OpenAI, etc.)
- `kv-*-bot-*` : Secrets spécifiques au bot
- `kv-*-central` : Configuration centralisée

## 🛠️ Commandes utiles
```bash
# Valider un environnement
make keyvault-validate ENV=votre-environnement

# Résoudre les secrets Key Vault
make keyvault-resolve ENV=votre-environnement
```
