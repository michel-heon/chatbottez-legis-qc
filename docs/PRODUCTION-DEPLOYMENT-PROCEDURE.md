# 🚀 Procédure de Mise en Production - Chatbottez-Légis-QC

**Version** : 1.0  
**Date** : 2025-09-26  
**Projet** : Chatbottez-Légis-QC - Conseiller Juridique Virtuel  
**Architecture** : Microsoft 365 Agents Toolkit v1.10  

---

## 📋 Vue d'ensemble

Cette procédure détaille les étapes complètes pour déployer l'application Chatbottez-Légis-QC depuis l'environnement de développement vers le tenant de production Cotechnoe Inc.

### 🎯 Objectifs
- Déploiement sécurisé et contrôlé vers la production
- Validation complète des fonctionnalités RAG juridiques
- Gestion appropriée des versions Git
- Plan de rollback en cas de problème

### 📊 Environnements Cibles
- **Développement** : `local` (tunnel ngrok)
- **Test** : `playground` (Microsoft 365 Agents Playground)
- **Production** : `cotechnoe` (admin@cotechnoe01.onmicrosoft.com)

---

## 🔄 Phase 1 : Préparation et Validation Git

### 1.1 Merge vers la branche principale

```bash
# Basculer vers la branche principale
git checkout main
git pull origin main

# Merger la feature branch (après validation)
git merge feature/migrate-atk-v110-architecture

# Résoudre les conflits si nécessaire
# Vérifier que tous les tests passent
```

**Alternative recommandée - Pull Request :**
1. Créer une Pull Request sur GitHub
2. Faire reviewer par l'équipe
3. Merger après approbation

### 1.2 Créer une branche de release (Optionnel mais recommandé)

```bash
# Créer une branche dédiée à cette release
git checkout -b release/v1.1.8
git push origin release/v1.1.8

# Cette branche permet de faire des hotfixes sans impacter main
```

### 1.3 Tagging de production

```bash
# Créer un tag spécifique production
git tag v1.1.8-production -m "Production release v1.1.8 - ATK Migration"
git push origin v1.1.8-production

# Vérifier la création du tag
git tag -l "v1.1.8*"
```

---

## ⚙️ Phase 2 : Configuration Environnement de Production

### 2.1 Validation des fichiers d'environnement

**Fichiers à vérifier :**
- `env/.env.cotechnoe` : Variables de production
- `m365agents.cotechnoe.yml` : Configuration deployment
- `appPackage/manifest.json` : Manifest Teams

**Variables critiques à valider :**
```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/
AZURE_OPENAI_API_KEY=***
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o

# Bot Configuration
BOT_ID=***
BOT_PASSWORD=***

# Teams Configuration
TEAMS_APP_ID=***
TEAMS_APP_VERSION=1.1.8
```

### 2.2 Validation du manifest

```bash
# Vérifier la configuration du manifest
grep -A 5 -B 5 "version\|id" appPackage/manifest.json

# S'assurer que les variables sont bien remplacées
# Pas de ${{}} dans le manifest final
```

### 2.3 Vérification des permissions Azure

- Accès au Resource Group de production
- Permissions sur Azure App Service
- Droits d'administration Teams Admin Center

---

## 🛠️ Phase 3 : Commandes ATK pour la Production

### 3.1 Authentification

```bash
# S'assurer d'être connecté au bon tenant
atk auth login

# Vérifier le tenant actuel
atk auth list
```

### 3.2 Provision des ressources Azure

```bash
# Créer/mettre à jour les ressources Azure pour production
atk provision --env cotechnoe

# En cas d'erreur, vérifier les logs et variables d'environnement
# Reprendre la commande après correction
```

**Ressources créées/mises à jour :**
- Azure App Service
- Azure Bot Service Registration
- Application Registration (Microsoft Entra ID)

### 3.3 Déploiement de l'application

```bash
# Déployer le code vers Azure App Service
atk deploy --env cotechnoe

# Suivre les logs de déploiement
# Vérifier l'absence d'erreurs
```

**Points de contrôle :**
- Build réussi sans erreurs TypeScript
- Packages npm installés correctement
- Variables d'environnement injectées

### 3.4 Package et Publication Teams

```bash
# Créer le package Teams pour production
atk package --env cotechnoe

# Le package sera créé dans appPackage/build/
# Vérifier l'existence du fichier .zip

# Publier dans le tenant de production
atk publish --env cotechnoe
```

**Alternative manuelle :**
1. Télécharger le package depuis `appPackage/build/appPackage.cotechnoe.zip`
2. Aller sur https://admin.teams.microsoft.com/policies/manage-apps
3. Upload du package manuellement

---

## ✅ Phase 4 : Validation Post-Déploiement

### 4.1 Tests de connectivité

```bash
# Test endpoint Azure App Service
curl -X POST https://botf2c163.azurewebsites.net/api/messages \
  -H "Content-Type: application/json" \
  -d '{"type":"message","text":"Bonjour, test de production"}' \
  -w "\nHTTP Status: %{http_code}\n"

# Utiliser le Makefile si disponible
make health-check ENV=cotechnoe
```

**Codes de réponse attendus :**
- `200` : OK, bot répond correctement
- `405` : Method Not Allowed (normal pour GET sur /api/messages)
- `500` : Erreur serveur (à investiguer)

### 4.2 Validation Teams Admin Portal

```bash
# Ouvrir le portail d'administration
make open-admin-portal

# Ou manuellement
# https://admin.teams.microsoft.com/policies/manage-apps
```

**Vérifications à faire :**
1. Application listée dans "Manage apps"
2. Statut : "Available" ou "Approved"
3. Version correspondante : 1.1.8
4. Permissions accordées correctement

### 4.3 Tests fonctionnels dans Teams

**Étapes de validation :**

1. **Installation dans un canal de test**
   - Créer un canal "Test Bot Juridique"
   - Installer l'application
   - Vérifier l'apparition du bot

2. **Tests de base**
   ```
   Messages à tester :
   - "Bonjour"
   - "Quelle est la loi sur la protection des consommateurs au Québec ?"
   - "Peux-tu m'expliquer les droits du locataire ?"
   ```

3. **Validation RAG**
   - Vérifier que les réponses incluent des sources législatives
   - S'assurer de la pertinence juridique
   - Tester avec des questions complexes

4. **Test des fonctionnalités avancées**
   - Follow-up questions
   - Citations législatives
   - Gestion des cas non juridiques

---

## 📈 Phase 5 : Gestion des Versions et Documentation

### 5.1 Documentation de la release

```bash
# Mettre à jour les release notes avec le succès production
cd docs/release/
echo "
## ✅ Production Deployment - $(date)
- Azure App Service: ✅ Deployed successfully
- Teams Admin Portal: ✅ Published and approved
- Functional Tests: ✅ RAG responses validated
- Endpoint Status: ✅ HTTP 200 responses
" >> v1.1.8.md

# Committer la mise à jour
git add docs/release/v1.1.8.md
git commit -m "docs: production deployment confirmed v1.1.8 - $(date)"
git push origin main
```

### 5.2 Communication aux parties prenantes

**Email type :**
```
Objet: [PROD] Chatbottez-Légis-QC v1.1.8 - Migration ATK Terminée

Bonjour,

La mise en production de Chatbottez-Légis-QC v1.1.8 a été réalisée avec succès.

Nouveautés :
✅ Architecture Microsoft 365 Agents Toolkit v1.10
✅ Performances améliorées
✅ Stabilité accrue
✅ Compatibilité Microsoft 365 Copilot

L'application est disponible dans Teams via [lien d'installation].

Tests recommandés : [instructions]

Cordialement,
[Équipe Technique]
```

---

## 🆘 Phase 6 : Plan de Rollback

### 6.1 Procédure de rollback automatique

```bash
# En cas de problème critique, revenir à la version précédente
git checkout v1.1.7-production  # ou dernière version stable

# Redéployer la version précédente
atk deploy --env cotechnoe
atk publish --env cotechnoe

# Notifier les utilisateurs du rollback temporaire
```

### 6.2 Rollback manuel Teams

Si seule l'app Teams pose problème :
1. Admin Center → Manage apps
2. Localiser Chatbottez-Légis-QC
3. "Block" temporairement l'application
4. Uploader une version précédente stable

### 6.3 Investigation post-rollback

```bash
# Récupérer les logs Azure pour diagnostic
az webapp log tail --name botf2c163 --resource-group [RG_NAME]

# Analyser les erreurs dans Application Insights
# Identifier la cause racine avant re-déploiement
```

---

## 📊 Phase 7 : Monitoring et Maintenance

### 7.1 Surveillance continue

**Métriques à surveiller :**
- Disponibilité Azure App Service (>99%)
- Temps de réponse OpenAI (<2s)
- Taux d'erreur bot (<1%)
- Utilisation Teams (nombre d'interactions)

**Outils de monitoring :**
- Azure Monitor / Application Insights
- Teams Admin Center Analytics
- Logs personnalisés de l'application

### 7.2 Maintenance préventive

```bash
# Vérification hebdomadaire de la santé
make health-check ENV=cotechnoe

# Mise à jour des dépendances (mensuel)
npm audit
npm update

# Vérification des certificats et tokens (mensuel)
# Renouvellement si nécessaire
```

---

## 🛡️ Sécurité et Bonnes Pratiques

### Variables sensibles
- ❌ Ne jamais commiter les clés API
- ✅ Utiliser Azure Key Vault pour la production
- ✅ Rotation régulière des secrets

### Gestion des accès
- Principe du moindre privilège
- Authentification multi-facteur obligatoire
- Logs d'audit activés

### Sauvegarde
- Code source versionné sur GitHub
- Configuration sauvegardée
- Base de connaissances RAG sauvegardée

---

## 📞 Support et Escalade

### Contacts d'urgence
- **Technique** : [contact@cotechnoe.com]
- **Fonctionnel** : [équipe juridique]
- **Infrastructure** : [admin Azure]

### Canaux de support
- **Critique** : Téléphone + Email
- **Important** : Email + Teams
- **Normal** : Ticket interne

---

## 📚 Annexes

### A.1 Commandes ATK Résumées

```bash
# Workflow complet production
atk auth login                   # Authentification
atk provision --env cotechnoe    # Provisioning ressources
atk deploy --env cotechnoe       # Déploiement code
atk package --env cotechnoe      # Package Teams
atk publish --env cotechnoe      # Publication Teams
atk validate --env cotechnoe     # Validation finale
```

### A.2 Checklist Pré-Production

- [ ] Code mergé et testé sur branche main
- [ ] Tag de production créé (v1.1.8-production)
- [ ] Variables d'environnement validées
- [ ] Ressources Azure provisionées
- [ ] Tests fonctionnels passés
- [ ] Backup configuration précédente effectué
- [ ] Plan de rollback documenté et testé
- [ ] Équipe informée du planning déploiement
- [ ] Permissions Azure et Teams validées
- [ ] Documentation mise à jour

### A.3 Variables d'Environnement Production

```env
# Copier ce template dans env/.env.cotechnoe
TEAMSFX_ENV=cotechnoe
TEAMS_APP_VERSION=1.1.8

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT_NAME=

# Bot Framework
BOT_ID=
BOT_PASSWORD=

# Teams
TEAMS_APP_ID=
```

### A.4 Liens de Référence

- [Microsoft 365 Agents Toolkit Documentation](https://aka.ms/teams-toolkit)
- [Teams Admin Center](https://admin.teams.microsoft.com)
- [Azure Portal](https://portal.azure.com)
- [Repository GitHub](https://github.com/michel-heon/chatbottez-legis-qc)
- [Teams Developer Portal](https://dev.teams.microsoft.com)

---

**Document créé le** : 2025-09-26  
**Dernière mise à jour** : 2025-09-26  
**Version procédure** : 1.0  
**Validé par** : [À compléter]  

---

*Cette procédure doit être mise à jour à chaque évolution majeure de l'architecture ou des processus de déploiement.*
