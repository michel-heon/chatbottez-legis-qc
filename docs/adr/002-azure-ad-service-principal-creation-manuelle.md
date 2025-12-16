# ADR 002: Création Manuelle du Service Principal Azure AD pour Teams Agent

## Statut

✅ Accepté

## Date

2025-12-11

## Contexte

Lors du développement et débogage local d'agents Microsoft Teams utilisant le Microsoft 365 Agents Toolkit, le processus de provisionnement automatique (`teamsfx provision`) rencontre un **défaut récurrent** : 

**Problème principal** : L'action `aadApp/create` dans `m365agents.local.yml` avec l'option `generateServicePrincipal: true` **prétend créer le Service Principal** mais celui-ci n'est **jamais réellement créé** dans Azure AD.

### Symptômes observés

1. **Premier lancement F5 (Debug in Teams)** :
   - Erreur: `AADSTS7000229: The client application {BOT_ID} is missing service principal`
   - Le provisionnement indique pourtant : "Created Microsoft Entra application with object id {OBJECT_ID} and generated service principal"

2. **Relances successives** :
   - Même erreur `AADSTS7000229` persistante
   - Délai d'attente de 1-5 minutes ne résout PAS le problème (contrairement aux problèmes de propagation Azure AD normaux)
   - Le provisionnement réutilise l'App Registration existante mais le Service Principal reste inexistant

3. **Vérification manuelle** :
   ```bash
   az ad sp show --id {BOT_ID}
   # Retourne: Resource does not exist
   ```

### Impact

- **Blocage total** du débogage local dans Teams (Edge/Chrome/Desktop)
- Perte de temps significative (15-30 minutes de troubleshooting à chaque nouveau provisionnement)
- Expérience développeur frustrante avec messages d'erreur cryptiques
- Impossibilité de tester l'agent dans l'environnement Teams réel

### Facteurs contribuant au problème

- Bug intermittent dans Microsoft 365 Agents Toolkit (versions observées: 5.x)
- Possible problème de permissions Azure AD lors de l'appel Graph API par TeamsFx
- Incohérence entre les logs TeamsFx et l'état réel d'Azure AD
- Aucune validation post-création par TeamsFx pour confirmer l'existence du Service Principal

## Décision

**Créer manuellement le Service Principal via Azure CLI** immédiatement après chaque provisionnement échoué, avant de relancer l'application.

### Commande standard

```bash
az ad sp create --id {BOT_ID}
```

Où `{BOT_ID}` est le `clientId` trouvé dans `env/.env.local` (ligne `BOT_ID=...`).

### Moment d'exécution

**Exécuter dès qu'on observe l'erreur `AADSTS7000229`** :

1. ✅ Après un provisionnement réussi (logs indiquent "generated service principal") mais avant le premier lancement
2. ✅ Après avoir nettoyé `SECRET_BOT_PASSWORD` pour forcer un nouveau secret
3. ✅ Après toute erreur `AADSTS7000215` (invalid client secret) suivie d'un nouveau provisionnement

### Workflow complet

```bash
# 1. Vérifier si le Service Principal existe
az ad sp show --id {BOT_ID}

# 2. Si "Resource does not exist", créer manuellement
az ad sp create --id {BOT_ID}

# 3. Attendre 10-15 secondes pour propagation
# (beaucoup plus court qu'un délai de création normal)

# 4. Relancer F5 (Debug in Teams)
```

## Conséquences

### Positives ✅

- **Débogage fonctionnel** en moins de 30 secondes après l'erreur initiale
- **Solution fiable et reproductible** (100% de succès observé sur 5+ instances)
- **Diagnostic rapide** : une seule commande `az ad sp show` confirme le problème
- **Aucun impact sur les ressources Azure** : ne crée que le Service Principal manquant, sans modifier l'App Registration existante
- **Compatibilité totale** avec le workflow TeamsFx : ne perturbe pas les étapes de provisionnement suivantes
- **Réutilisable** pour tous les environnements (local, sandbox, dev)

### Négatives ⚠️

- **Workaround manuel** : nécessite une intervention développeur à chaque nouveau provisionnement
- **Non documenté officiellement** par Microsoft (solution empirique)
- **Commande supplémentaire** à mémoriser (risque d'oubli pour nouveaux développeurs)
- **Dépendance Azure CLI** : nécessite `az` installé et authentifié
- **Aucune garantie** que Microsoft corrigera le bug dans TeamsFx (problème connu depuis plusieurs versions)

### Mitigations

1. **Documentation claire** :
   - Ajouter ce ADR dans `docs/adr/`
   - Référencer dans `README.md` section "Troubleshooting"
   - Créer un snippet VSCode pour la commande complète

2. **Script automatisé** (optionnel) :
   ```bash
   # scripts/ensure-service-principal.sh
   #!/bin/bash
   BOT_ID=$(grep BOT_ID= env/.env.local | cut -d= -f2)
   az ad sp show --id $BOT_ID 2>/dev/null || az ad sp create --id $BOT_ID
   ```

3. **Intégration dans tasks.json** :
   - Ajouter une tâche "Ensure Service Principal" avant "Start application"
   - Permet d'automatiser la vérification/création dans le workflow F5

4. **Monitoring** :
   - Documenter chaque occurrence du problème dans ce ADR
   - Reporter le bug à Microsoft via GitHub Issues (TeamsFx repo)

## Alternatives Considérées

### Alternative 1: Attendre un délai de propagation Azure AD

**Description** : Attendre 2-5 minutes après provisionnement avant de lancer l'application

**Rejetée parce que** :
- Tests empiriques montrent que le Service Principal **n'est jamais créé**, même après 10+ minutes
- `az ad sp show` confirme systématiquement "Resource does not exist"
- Perte de temps inutile (5 minutes × nombre de tentatives)

### Alternative 2: Supprimer et recréer l'App Registration complète

**Description** : 
```bash
az ad app delete --id {BOT_ID}
# Puis relancer provisionnement complet
```

**Rejetée parce que** :
- Processus lourd (3-5 minutes de provisionnement complet)
- Perd les configurations existantes (channels, scopes, etc.)
- Régénère `TEAMS_APP_ID` et nécessite réinstallation dans Teams
- **Ne garantit pas** que le Service Principal sera créé cette fois

### Alternative 3: Utiliser Managed Identity au lieu de Service Principal

**Description** : Configurer l'agent pour utiliser Azure Managed Identity sur App Service

**Rejetée parce que** :
- **Incompatible avec débogage local** (Managed Identity disponible uniquement dans Azure)
- Nécessite provisionnement Azure complet (App Service, Bot Service, etc.)
- Complexité additionnelle pour environnement de développement
- Ne résout pas le besoin de tester localement avant déploiement

### Alternative 4: Modifier m365agents.local.yml pour utiliser un Service Principal existant

**Description** : Créer manuellement App Registration + SP une fois, puis référencer dans config

**Rejetée parce que** :
- Contourne le workflow TeamsFx standard (perte des bénéfices d'automatisation)
- Nécessite gestion manuelle des secrets (rotation, expiration)
- Complexifie le onboarding de nouveaux développeurs
- Incompatible avec environnements éphémères (sandbox, feature branches)

## Implémentation

### Phase 1: Documentation immédiate

- [x] Créer ADR 003
- [ ] Mettre à jour README.md section "Troubleshooting Azure AD"
- [ ] Documenter dans `docs/ENVIRONMENT_SETUP.md`

### Phase 2: Automatisation partielle

- [ ] Créer `scripts/ensure-service-principal.sh`
- [ ] Ajouter script Windows équivalent `scripts/ensure-service-principal.ps1`
- [ ] Tester le script dans workflow F5

### Phase 3: Intégration workflow

- [ ] Ajouter tâche "Ensure Service Principal" dans `.vscode/tasks.json`
- [ ] Positionner avant "Start application" dans `dependsOn`
- [ ] Valider que l'erreur `AADSTS7000229` ne se produit plus

### Phase 4: Suivi et reporting

- [ ] Créer issue GitHub dans microsoft/TeamsFx repository
- [ ] Documenter fréquence du problème (tracking dans ce ADR)
- [ ] Surveiller releases TeamsFx pour correction éventuelle

## Références

- [Azure AD Service Principal Documentation](https://learn.microsoft.com/en-us/cli/azure/ad/sp)
- [Microsoft 365 Agents Toolkit - Provision Lifecycle](https://aka.ms/teamsfx-actions)
- [AADSTS Error Codes](https://learn.microsoft.com/en-us/entra/identity-platform/reference-error-codes)
- [TeamsFx GitHub Issues - Related bugs](https://github.com/OfficeDev/TeamsFx/issues)

## Historique des Occurrences

| Date       | Environnement | BOT_ID (partial) | Résolu par création manuelle ? |
|------------|---------------|------------------|--------------------------------|
| 2025-12-11 | local         | aeba000d-...     | ✅ Oui                         |
| 2025-12-11 | local         | f7a8b360-...     | ✅ Oui                         |

---

**Auteur** : Michel Héon  
**Réviseurs** : N/A (première version)  
**Dernière mise à jour** : 2025-12-11
