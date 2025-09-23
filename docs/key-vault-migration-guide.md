# Documentation de Migration vers Azure Key Vault

## Vue d'ensemble

Cette documentation détaille la migration complète des secrets de l'application vers Azure Key Vault, suite à la découverte d'un bris de sécurité majeur où des secrets étaient exposés dans l'historique Git.

## Problème Initial

- **Sécurité compromise** : Clés API, mots de passe et identifiants Azure exposés dans les fichiers `.env` suivis par Git
- **Historique contaminé** : 53 commits contenant des informations sensibles sur toutes les branches
- **Risque élevé** : Exposition publique de secrets critiques pour Azure OpenAI, Bot Framework, et infrastructure Azure

## Solution Implementée

### 1. Architecture Key Vault

Selon les bonnes pratiques Microsoft, nous avons créé une architecture de Key Vaults séparés :

```
Azure Key Vaults
├── kv-legis-shared-dev-ce      # Services partagés - développement
├── kv-legis-shared-prod-ce     # Services partagés - production  
├── kv-legis-bot-dev-ce         # Secrets bot - développement
├── kv-legis-bot-prod-ce        # Secrets bot - production
└── kv-cotechnoe-central        # Secrets infrastructure centraux
```

**Avantages** :
- Isolation des secrets par environnement et fonction
- Permissions granulaires par vault
- Facilite la gestion et l'audit
- Respecte le principe de moindre privilège

### 2. Purge Complète de l'Historique Git

```bash
# Installation de BFG Repo-Cleaner
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# Suppression de tous les fichiers .env de l'historique
java -jar bfg-1.14.0.jar --delete-files "*.env" --no-blob-protection .

# Nettoyage et repack
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

**Résultat** :
- 53 commits modifiés
- 126 objets réécrits
- Historique complètement nettoyé
- Tous les fichiers `.env` supprimés de toutes les branches

### 3. Migration des Secrets

#### Secrets Azure OpenAI (kv-legis-shared-dev-ce)
```bash
az keyvault secret set --vault-name kv-legis-shared-dev-ce --name AZURE-OPENAI-API-KEY-DEV --value "sk-..."
az keyvault secret set --vault-name kv-legis-shared-dev-ce --name AZURE-OPENAI-ENDPOINT-DEV --value "https://..."
az keyvault secret set --vault-name kv-legis-shared-dev-ce --name AZURE-OPENAI-DEPLOYMENT-NAME-DEV --value "gpt-4o"
```

#### Secrets Bot (kv-legis-bot-dev-ce)
```bash
az keyvault secret set --vault-name kv-legis-bot-dev-ce --name BOT-ID-DEV --value "..."
az keyvault secret set --vault-name kv-legis-bot-dev-ce --name BOT-PASSWORD-DEV --value "..."
az keyvault secret set --vault-name kv-legis-bot-dev-ce --name BOT-TENANT-ID-DEV --value "..."
```

#### Infrastructure Centrale (kv-cotechnoe-central)
```bash
az keyvault secret set --vault-name kv-cotechnoe-central --name AZURE-SUBSCRIPTION-ID --value "..."
az keyvault secret set --vault-name kv-cotechnoe-central --name AZURE-RESOURCE-GROUP-NAME-LEGIS --value "rg-cotechnoe-ai-01"
az keyvault secret set --vault-name kv-cotechnoe-central --name BOT-DOMAIN-LEGIS --value "..."
```

### 4. Intégration Application

#### Structure des Fichiers Modifiés

```
src/
├── keyVaultConfig.js          # Nouveau - Gestionnaire Key Vault
├── config.js                  # Modifié - Configuration asynchrone
├── adapter.js                 # Modifié - Initialisation asynchrone
├── index.js                   # Modifié - Point d'entrée avec gestion d'erreur
└── app/
    └── app.js                 # Modifié - Création d'app asynchrone
```

#### Dépendances Ajoutées

```json
{
  "dependencies": {
    "@azure/identity": "^4.0.1",
    "@azure/keyvault-secrets": "^4.8.0"
  }
}
```

#### Authentification

L'application utilise `DefaultAzureCredential` qui tente automatiquement :
1. Variables d'environnement (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID)
2. Managed Identity (en production Azure)
3. Azure CLI (développement local)
4. Visual Studio / VS Code
5. Azure PowerShell

### 5. Configuration des Fichiers d'Environnement

Les anciens fichiers `.env` ont été remplacés par des références Key Vault :

```bash
# env/.env.dev
AZURE_OPENAI_API_KEY=@Microsoft.KeyVault(VaultName=kv-legis-shared-dev-ce;SecretName=AZURE-OPENAI-API-KEY-DEV)
BOT_ID=@Microsoft.KeyVault(VaultName=kv-legis-bot-dev-ce;SecretName=BOT-ID-DEV)
# ... autres secrets
```

### 6. Scripts d'Automatisation

#### Validation des Secrets
```bash
node scripts/validate-keyvault.js
```

#### Gestion des Secrets
```bash
# Audit complet
node scripts/secret-manager.js audit

# Validation d'un environnement
node scripts/secret-manager.js validate dev

# Synchronisation entre environnements
node scripts/secret-manager.js sync dev prod
```

## Sécurité et Bonnes Pratiques

### Contrôles d'Accès (RBAC)

```bash
# Attribution des permissions minimales
az role assignment create \
  --assignee user@domain.com \
  --role "Key Vault Secrets User" \
  --scope "/subscriptions/.../vaults/vault-name"
```

### Monitoring et Audit

- **Diagnostic Settings** : Tous les vaults envoient leurs logs vers Log Analytics
- **Retention** : 90 jours de récupération pour les secrets supprimés
- **Purge Protection** : Protection contre la suppression définitive accidentelle

### Mise en Cache et Performance

- **Cache local** : 5 minutes TTL pour réduire les appels API
- **Initialisation lazy** : Configuration chargée à la première requête
- **Fallback** : Variables d'environnement en cas d'échec Key Vault

## Procédures Opérationnelles

### Ajout d'un Nouveau Secret

1. **Identifier le bon vault** selon la fonction du secret
2. **Ajouter le secret** via Azure CLI ou Portal
3. **Mettre à jour l'application** si nécessaire
4. **Valider** avec les scripts d'audit

### Rotation des Secrets

1. **Générer un nouveau secret** dans le service source
2. **Mettre à jour le Key Vault** avec la nouvelle valeur
3. **Redémarrer l'application** pour vider le cache
4. **Valider** le bon fonctionnement
5. **Révoquer l'ancien secret** dans le service source

### Dépannage

#### Application ne démarre pas
```bash
# Vérifier l'authentification
az account show

# Tester l'accès aux vaults
node scripts/validate-keyvault.js

# Vérifier les logs
curl http://localhost:3978/api/health
```

#### Secrets non trouvés
```bash
# Lister les secrets disponibles
az keyvault secret list --vault-name "vault-name"

# Vérifier la valeur d'un secret
az keyvault secret show --name "secret-name" --vault-name "vault-name"
```

## État Post-Migration

✅ **Sécurité** : Aucun secret exposé dans le code ou Git
✅ **Architecture** : 4 Key Vaults avec séparation des responsabilités
✅ **Application** : Intégration complète avec cache et fallback
✅ **Automatisation** : Scripts pour audit et gestion des secrets
✅ **Documentation** : Guide complet et procédures opérationnelles

## Prochaines Étapes

1. **Tests environnements** : Validation playground et production
2. **Rotation automatique** : Configuration pour secrets critiques
3. **Monitoring avancé** : Alertes sur accès non autorisés
4. **Formation équipe** : Procédures de gestion des secrets

## Ressources

- [Azure Key Vault Best Practices](https://docs.microsoft.com/azure/key-vault/general/best-practices)
- [DefaultAzureCredential Documentation](https://docs.microsoft.com/dotnet/api/azure.identity.defaultazurecredential)
- [Secrets Management in Applications](https://docs.microsoft.com/azure/architecture/framework/security/design-storage-keys)

---

**Note** : Cette migration a transformé une vulnérabilité critique en une architecture sécurisée suivant les meilleures pratiques Microsoft. L'application est maintenant prête pour la production avec une gestion des secrets de niveau entreprise.
