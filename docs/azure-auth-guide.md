# Guide de Configuration Authentification Azure

## Vue d'ensemble
Ce guide détaille comment configurer l'authentification Azure pour accéder aux Key Vaults depuis votre application.

## Options d'Authentification

### 1. Azure CLI (Pour le développement local)
```bash
# Se connecter à Azure
az login

# Vérifier la connexion
az account show

# Optionnel : changer de souscription si nécessaire
az account set --subscription "your-subscription-id"
```

### 2. Variables d'Environnement (Service Principal)
Si vous préférez utiliser un Service Principal :

```bash
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
export AZURE_TENANT_ID="your-tenant-id"
```

### 3. Managed Identity (Pour Azure)
En production sur Azure, l'application utilisera automatiquement la Managed Identity.

## Vérification de la Configuration

### Test rapide
```bash
# Depuis le répertoire du projet
node scripts/validate-keyvault.js
```

### Test manuel avec Azure CLI
```bash
# Tester l'accès à un secret spécifique
az keyvault secret show --name "AZURE-OPENAI-API-KEY-DEV" --vault-name "kv-legis-shared-dev-ce"
```

## Résolution des Problèmes

### Erreur "authentication failed"
1. Vérifiez que vous êtes connecté : `az login`
2. Vérifiez vos permissions sur les Key Vaults
3. Assurez-vous que votre compte a le rôle "Key Vault Secrets User"

### Erreur "vault not found"
1. Vérifiez les noms des Key Vaults dans `src/keyVaultConfig.js`
2. Assurez-vous que les vaults existent : `az keyvault list`

### Erreur de réseau
1. Vérifiez votre connexion internet
2. Assurez-vous que les URL des Key Vaults sont correctes

## Bonnes Pratiques

1. **Développement local** : Utilisez `az login`
2. **CI/CD** : Utilisez un Service Principal
3. **Production Azure** : Utilisez Managed Identity
4. **Mise en cache** : Les secrets sont mis en cache 5 minutes par défaut
5. **Fallback** : L'application peut utiliser les variables d'environnement en cas d'échec

## Commandes Utiles

```bash
# Lister les Key Vaults accessibles
az keyvault list --output table

# Lister les secrets d'un vault
az keyvault secret list --vault-name "kv-legis-shared-dev-ce" --output table

# Obtenir un secret (masqué)
az keyvault secret show --name "SECRET-NAME" --vault-name "VAULT-NAME" --query "value" -o tsv
```
