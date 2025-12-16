# ADR 007: Déploiement avec Microsoft 365 Agents Toolkit CLI

## Statut

✅ Accepté

## Date

2025-11-27

## Contexte

Le projet Légis Québec nécessite un processus de déploiement standardisé, reproductible et automatisable pour publier l'application Teams vers différents environnements (local, dev/staging, production). Historiquement, le déploiement s'effectuait via l'extension VS Code Teams Toolkit, mais cette approche présente plusieurs limitations :

- **Non automatisable** : Nécessite des interactions manuelles via l'interface graphique
- **Difficile à documenter** : Les étapes ne sont pas scriptables
- **Non reproductible en CI/CD** : Impossible à intégrer dans un pipeline automatisé
- **Manque de traçabilité** : Pas de logs détaillés des opérations effectuées

### Contraintes identifiées

1. **Environnements multiples** : local (développement), dev (staging), production
2. **Ressources Azure** : App Service, Bot Registration, Teams App Registration
3. **Validation stricte** : Manifest Teams v1.19 avec 54 règles de validation
4. **Authentification** : Azure et Microsoft 365 avec gestion des tokens
5. **Versioning** : Intégration avec la stratégie Git Flow (ADR-001)

### Documentation officielle consultée

- [Microsoft 365 Agents Toolkit CLI](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/microsoft-365-agents-toolkit-cli)
- [Environments in Microsoft 365 Agents Toolkit](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teamsfx-multi-env)
- Package npm : `@microsoft/m365agentstoolkit-cli`

## Décision

**Adoption du Microsoft 365 Agents Toolkit CLI (commande `atk`) comme outil principal de déploiement pour tous les environnements.**

### Workflow de déploiement standardisé

Le processus de déploiement suit une séquence stricte en 4 étapes :

#### 1. **Provision** (`atk provision --env <environment>`)

**Objectif** : Créer et configurer les ressources cloud Azure et Microsoft 365

**Actions exécutées** :
- Création de l'app Teams dans Developer Portal (si inexistante)
- Déploiement des templates ARM (Azure Resource Manager)
- Configuration du resource group Azure
- Création/mise à jour de l'Azure App Service
- Enregistrement du bot dans Bot Framework
- Validation du manifest Teams
- Génération du package `.zip` de l'app
- Mise à jour des fichiers `.env.{environment}` avec les IDs générés

**Commande** :
```bash
atk provision --env dev
```

**Outputs attendus** (écrits dans `env/.env.dev`) :
- `TEAMS_APP_ID` : ID de l'application Teams
- `BOT_ID` : ID du bot Azure
- `BOT_DOMAIN` : Domaine Azure App Service (ex: `bot35a91d.azurewebsites.net`)
- `BOT_AZURE_APP_SERVICE_RESOURCE_ID` : Resource ID complet Azure

#### 2. **Deploy** (`atk deploy --env <environment>`)

**Objectif** : Déployer le code de l'application sur Azure App Service

**Actions exécutées** :
- Installation des dépendances (`npm install`)
- Build de l'application (`npm run build --if-present`)
- Compression du code en package `.zip`
- Upload du package vers Azure App Service via Entra Auth (AAD)
- Démarrage/redémarrage du service

**Commande** :
```bash
atk deploy --env dev
```

**Prérequis** :
- `atk provision` doit avoir été exécuté au préalable
- Token d'authentification Azure valide

#### 3. **Publish** (`atk publish --env <environment>`)

**Objectif** : Publier l'application dans le portail administrateur Microsoft 365

**Actions exécutées** :
- Build du package final (`appPackage.{env}.zip`)
- Validation complète du manifest (54 règles)
- Publication dans Admin Portal (https://aka.ms/teamsfx-mtac)
- Mise à jour de l'app dans Developer Portal
- Génération du lien d'installation Teams

**Commande** :
```bash
atk publish --env dev
```

**Résultat** :
- Application disponible pour installation dans Teams
- Lien d'installation généré pour les utilisateurs
- Nécessite approbation admin pour déploiement organisationnel

#### 4. **Preview** (`atk preview --env <environment>`)

**Objectif** : Ouvrir l'application dans Teams/Outlook pour tests

**Actions exécutées** :
- Vérification du compte Microsoft 365 connecté
- Vérification des permissions de sideloading
- Génération de l'URL d'installation Teams
- Ouverture automatique du navigateur

**Commande** :
```bash
atk preview --env dev --browser chrome
```

**Options disponibles** :
- `--browser` : `chrome`, `edge`, `default`
- `--m365-host` : `teams`, `outlook`, `office`
- `--desktop` : Ouvre le client desktop Teams au lieu du web

### Authentification

Avant toute opération, l'authentification est requise :

```bash
# Authentification Azure (ressources Azure)
atk auth login azure

# Authentification Microsoft 365 (Teams/Developer Portal)
atk auth login m365

# Vérification des comptes connectés
atk auth list
```

**Gestion des tokens** :
- Tokens stockés dans `~/.fx/account`
- Expiration automatique (refresh nécessaire)
- Support multi-comptes (Azure + M365)

### Gestion des environnements

**Environnements par défaut** :
- `local` : Développement local (localhost)
- `dev` : Staging/pré-production (Azure)
- `prod` : Production (à créer manuellement)

**Création d'un nouvel environnement** :
```bash
# Copier la configuration dev vers prod
atk env add prod --env dev
```

**Fichiers de configuration** :
- `env/.env.{environment}` : Variables d'environnement (commitées)
- `env/.env.{environment}.user` : Secrets locaux (non committés)
- `m365agents.yml` : Pipeline de déploiement remote
- `m365agents.local.yml` : Pipeline de déploiement local

### Validation du manifest

Le CLI valide automatiquement **54 règles** lors de `provision` et `publish` :

**Catégories de validation** :
- ✅ Structure du manifest (schema v1.19)
- ✅ Métadonnées de l'app (nom, version, descriptions)
- ✅ Informations développeur (URLs, privacy policy, terms)
- ✅ Icônes (192x192 color, 32x32 outline transparent)
- ✅ Configurations bot (scopes, commands)
- ✅ Sécurité (URLs HTTPS, domaines valides)
- ✅ Compliance Teams Store

**Erreurs bloquantes** : Le déploiement échoue si une règle n'est pas respectée.

### Intégration CI/CD

Le CLI est conçu pour l'automatisation :

```yaml
# Exemple GitHub Actions
- name: Deploy to staging
  run: |
    npm install -g @microsoft/m365agentstoolkit-cli
    atk auth login azure --service-principal
    atk auth login m365 --client-secret
    atk provision --env dev
    atk deploy --env dev
    atk publish --env dev
```

### Commandes complémentaires

**Diagnostic** :
```bash
atk doctor  # Vérification des prérequis (Node.js, npm, etc.)
```

**Gestion des packages** :
```bash
atk package --env dev  # Génère uniquement le .zip (sans publish)
atk validate --env dev  # Valide le manifest sans déployer
```

**Gestion des collaborateurs** :
```bash
atk collaborator grant --email user@example.com --env dev
atk collaborator status --env dev
```

**Nettoyage** :
```bash
atk uninstall --mode env --env dev  # Supprime toutes les ressources
```

## Conséquences

### Positives ✅

1. **Automatisation complète** : Processus scriptable pour CI/CD
2. **Reproductibilité** : Mêmes étapes garanties à chaque déploiement
3. **Traçabilité** : Logs détaillés de chaque opération
4. **Validation stricte** : 54 règles de validation automatiques
5. **Multi-environnements** : Gestion simple de local/dev/prod
6. **Documentation intégrée** : `atk -h` pour référence rapide
7. **Gestion des secrets** : Séparation `.env` vs `.env.user`
8. **Compatibilité Teams Toolkit** : Partage les mêmes fichiers de config
9. **Support officiel Microsoft** : Outil maintenu activement
10. **Gestion des tokens** : Refresh automatique des authentifications

### Négatives ⚠️

1. **Courbe d'apprentissage** : Nouvelles commandes à apprendre
2. **Dépendance npm globale** : Nécessite installation CLI (`npm install -g`)
3. **Authentification manuelle** : Login Azure/M365 requis avant déploiement
4. **Logs verbeux** : Sortie console parfois trop détaillée
5. **Erreurs cryptiques** : Messages d'erreur ARM parfois peu clairs
6. **Token expiration** : Nécessite re-login périodique
7. **Pas de rollback automatique** : Nécessite un processus manuel
8. **Dépendance internet** : Impossible de déployer offline

### Risques identifiés 🚨

1. **Token expiré** : Peut bloquer le déploiement en CI/CD
   - *Mitigation* : Utiliser service principal avec client secret
2. **Validation stricte** : Une règle non respectée bloque tout
   - *Mitigation* : Tests locaux avec `atk validate` avant `publish`
3. **Modification manuelle** : Risque de désynchronisation `.env` vs Azure
   - *Mitigation* : Ne jamais modifier les IDs générés manuellement
4. **Multi-tenant** : Gestion complexe avec plusieurs tenants M365
   - *Mitigation* : Documenter clairement le tenant cible dans `.env`

## Alternatives considérées

### 1. Extension VS Code Teams Toolkit

**Avantages** :
- Interface graphique intuitive
- Pas de commandes à mémoriser
- Débogage intégré

**Inconvénients** :
- ❌ Non automatisable
- ❌ Pas de CI/CD
- ❌ Difficile à documenter
- ❌ Nécessite VS Code ouvert

**Décision** : Rejeté pour la production, conservé pour le développement local.

### 2. Azure CLI + PowerShell scripts custom

**Avantages** :
- Contrôle total du processus
- Pas de dépendance tierce

**Inconvénients** :
- ❌ Maintenance lourde des scripts
- ❌ Gestion manuelle du manifest Teams
- ❌ Pas de validation intégrée
- ❌ Complexité de l'authentification

**Décision** : Rejeté, trop de complexité pour un bénéfice faible.

### 3. GitHub Actions avec workflows Microsoft officiels

**Avantages** :
- Intégration GitHub native
- Templates fournis par Microsoft

**Inconvénients** :
- ❌ Limité à GitHub (pas GitLab/Bitbucket)
- ❌ Moins flexible que CLI direct
- ❌ Dépendance aux runners GitHub

**Décision** : Conservé comme complément, mais CLI reste l'outil principal.

## Implémentation

### Phase 1 : Setup initial (Complétée ✅)

- [x] Installation CLI : `npm install -g @microsoft/m365agentstoolkit-cli@1.1.3`
- [x] Authentification Azure : `heon.michel@uqam.ca`
- [x] Authentification M365 : `admin@gpt-sb-01.uqam.ca`
- [x] Configuration environnement dev : `env/.env.dev`

### Phase 2 : Premier déploiement staging (Complétée ✅)

- [x] Provision : Ressources Azure créées (rg-uqam-gpt-postdoc-staging-01)
- [x] Deploy : Code déployé sur bot35a91d.azurewebsites.net
- [x] Publish : App publiée dans Admin Portal
- [x] Preview : App testable dans Teams (ID: 5e6ce0b8-dffa-406f-b31d-fc61ab61c323)
- [x] Validation : 54 règles passées avec succès

### Phase 3 : Documentation (En cours 🔄)

- [x] ADR-019 : Processus de déploiement documenté
- [ ] Scripts bash helper (voir ADR-015)
- [ ] Guide CI/CD pour GitHub Actions
- [ ] Checklist de validation post-déploiement

### Phase 4 : Environnement production (À venir ⏳)

- [ ] Création environnement prod : `atk env add prod --env dev`
- [ ] Configuration `env/.env.prod`
- [ ] Premier déploiement production
- [ ] Tag Git v2.0.8 sur main

## Références

### Documentation Microsoft

- [Microsoft 365 Agents Toolkit CLI](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/microsoft-365-agents-toolkit-cli)
- [Environments in Microsoft 365 Agents Toolkit](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teamsfx-multi-env)
- [Teams Toolkit Fundamentals](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)

### Package npm

- [@microsoft/m365agentstoolkit-cli](https://www.npmjs.com/package/@microsoft/m365agentstoolkit-cli)
- [Code source GitHub](https://github.com/OfficeDev/microsoft-365-agents-toolkit/tree/dev/packages/cli)

### ADR liés

- **ADR-001** : Git Workflow et stratégie de versioning (intégration tags RC)
- **ADR-010** : Validation Teams Store Marketplace (règles de validation)
- **ADR-012** : Gestion configuration centralisée (fichiers `.env`)
- **ADR-014** : Microsoft 365 Agents Toolkit Development (contexte général)
- **ADR-015** : Nomenclature scripts bash (futurs scripts helper)

### Ressources projet

**Environnement dev (staging)** :
- Resource Group : `rg-uqam-gpt-postdoc-staging-01`
- App Service : `bot35a91d.azurewebsites.net`
- Teams App ID : `5e6ce0b8-dffa-406f-b31d-fc61ab61c323`
- Bot ID : `83b435f0-59f7-4f23-b97f-84b12085f5c0`
- Subscription : `127a4174-2ba7-44cb-9d42-eea89cbec6a3`

**URLs importantes** :
- Admin Portal : https://aka.ms/teamsfx-mtac
- Developer Portal : https://dev.teams.microsoft.com/apps
- Azure Portal : https://portal.azure.com

## Changelog

- **2025-11-27** : Création ADR-019
  - Déploiement v2.0.8-rc1 réussi vers staging
  - Documentation workflow complet provision → deploy → publish → preview
  - Validation 54 règles Teams Store

## Exemples d'utilisation

### Déploiement complet vers staging

```bash
# 1. Authentification (une fois par session)
atk auth login azure
atk auth login m365

# 2. Déploiement complet
atk provision --env dev
atk deploy --env dev
atk publish --env dev

# 3. Test dans Teams
atk preview --env dev --browser chrome
```

### Validation avant déploiement

```bash
# Vérifier les prérequis
atk doctor

# Valider le manifest uniquement
atk validate --env dev

# Générer le package sans publier
atk package --env dev
```

### Déploiement production (futur)

```bash
# Créer environnement prod (une fois)
atk env add prod --env dev

# Éditer env/.env.prod (changer APP_NAME_SUFFIX=prod)
# Éditer env/.env.prod (changer AZURE_RESOURCE_GROUP_NAME)

# Déployer en production
atk provision --env prod
atk deploy --env prod
atk publish --env prod
```

### CI/CD GitHub Actions (exemple)

```yaml
name: Deploy to Staging

on:
  push:
    branches:
      - dev

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install CLI
        run: npm install -g @microsoft/m365agentstoolkit-cli
      
      - name: Authenticate Azure
        run: |
          atk auth login azure --service-principal \
            --username ${{ secrets.AZURE_CLIENT_ID }} \
            --password ${{ secrets.AZURE_CLIENT_SECRET }} \
            --tenant ${{ secrets.AZURE_TENANT_ID }}
      
      - name: Authenticate M365
        run: |
          atk auth login m365 \
            --username ${{ secrets.M365_USERNAME }} \
            --password ${{ secrets.M365_PASSWORD }}
      
      - name: Deploy
        run: |
          atk provision --env dev
          atk deploy --env dev
          atk publish --env dev
      
      - name: Notify success
        run: echo "✅ Deployment successful"
```

## Notes d'implémentation

### Gestion des secrets en CI/CD

**Secrets GitHub requis** :
- `AZURE_CLIENT_ID` : Service principal Azure
- `AZURE_CLIENT_SECRET` : Secret du service principal
- `AZURE_TENANT_ID` : Tenant ID Azure
- `M365_USERNAME` : Compte admin M365
- `M365_PASSWORD` : Mot de passe M365

**Alternative recommandée** : Utiliser GitHub OIDC avec Azure Workload Identity (passwordless).

### Troubleshooting commun

**Erreur "invalid_grant" lors de `atk auth list`** :
```bash
# Solution : Supprimer le cache et re-login
rm -rf ~/.fx/account
atk auth login azure
atk auth login m365
```

**Erreur "could not determine executable to run"** :
```bash
# Solution : CLI non installé ou PATH incorrect
npm install -g @microsoft/m365agentstoolkit-cli
which atk  # Vérifier l'installation
```

**Erreur de validation manifest** :
```bash
# Solution : Vérifier avec validate avant publish
atk validate --env dev --verbose
# Consulter les 54 règles dans la sortie
```

**Déploiement bloqué sur Azure** :
```bash
# Solution : Vérifier les logs Azure App Service
az webapp log tail --name bot35a91d --resource-group rg-uqam-gpt-postdoc-staging-01
```

### Bonnes pratiques

1. **Toujours valider localement avant de déployer** :
   ```bash
   atk validate --env dev
   ```

2. **Ne jamais modifier manuellement les IDs dans .env** : 
   - Les IDs (TEAMS_APP_ID, BOT_ID) sont générés par `provision`
   - Modification manuelle = désynchronisation garantie

3. **Committer les .env.{environment} mais pas .env.{environment}.user** :
   - `.env.dev` : Committé (IDs publics)
   - `.env.dev.user` : Ignoré par git (secrets)

4. **Utiliser des branches séparées pour chaque environnement** :
   - `dev` branch → déploie vers staging automatiquement
   - `main` branch → déploie vers production manuellement

5. **Tagger après chaque déploiement production réussi** :
   ```bash
   git tag -a v2.0.8 -m "Production release 2.0.8"
   git push origin v2.0.8
   ```

---

**Auteur** : Michel Héon (UQAM/VRRCD)  
**Dernière mise à jour** : 2025-11-27  
**Version** : 1.0  
**Statut** : Accepté ✅
