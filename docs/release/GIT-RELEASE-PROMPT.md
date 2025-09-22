# 🚀 Prompt Git Release - Chatbottez-Légis-QC

## Usage Rapide
```
Procédons avec une release Chatbottez-Légis-QC v1.0.[z+1] :

1. Incrémente version automatiquement : make increment-version
2. Valide fonctionnement : make deploy ENV=cotechnoe
3. Crée release notes docs/release/v1.0.[z+1].md
4. Valide Tests : npm test (si disponible) 
5. Todo list Git : status → add → commit → tag → push
6. Tag nomenclature : v1.0.X-{COMPOSANT}_{FEATURE-DESCRIPTION}

Utilise une todo list structurée.
```

## Templates Essentiels

### Commit
```
feat: release v1.0.X - [BUSINESS_TITLE]

✨ Valeur: [impact juridique/fonctionnel principal]
🤖 AI: [amélioration RAG/OpenAI + composant Teams] 
📋 Qualité: [déploiement Azure] réussi, version cohérente
🎯 Résultat: [Teams app publié + status Admin Portal]
```

### Tag Nomenclature
```
v1.0.X-{composant}_{feature-description}

Composants: teams-ai | azure-openai | rag-search | deployment | infrastructure | manifest | legal-bot
Features: queryfix-correction | version-automation | legal-responses | teams-integration | etc.
```

## Checklist Rapide Teams AI
- [ ] Version cohérente dans manifest.json (automatique via make increment-version)
- [ ] Azure OpenAI config validée (queryLanguage fix appliqué)
- [ ] make deploy ENV=cotechnoe ✅ 
- [ ] make auto-publish ENV=cotechnoe ✅
- [ ] Teams app published successfully
- [ ] Release notes créées
- [ ] Tag nomenclature correcte
- [ ] Push commit + tag réussi

## Commandes Spécifiques au Projet

### Workflow de Release Automatisé
```bash
# 1. Incrémenter et publier
make auto-publish-and-open ENV=cotechnoe

# 2. Vérifier version actuelle
grep '"version"' appPackage/manifest.json

# 3. Git workflow
git status
git add .
git commit -m "feat: release v1.0.X - [DESCRIPTION]"
git tag v1.0.X-teams-ai_[FEATURE]
git push origin refactor/arch-2-rag-chat --tags
```

### Vérification Post-Release
```bash
# Vérifier le déploiement
curl -X POST https://botf2c163.azurewebsites.net/api/messages \
  -H "Content-Type: application/json" \
  -d '{"test":"test"}' -w "\nHTTP Status: %{http_code}\n" -s

# Ouvrir le portail Teams Admin
make open-admin-portal

# Vérifier les logs
make debug-logs ENV=cotechnoe
```

## Structure Version du Projet
- **Source de vérité** : `appPackage/manifest.json` → `"version": "1.0.X"`
- **Auto-incrémentation** : `make increment-version` (Python script)
- **Environnements** : local, playground, cotechnoe
- **Azure Resources** : botf2c163.azurewebsites.net
- **Teams Admin Portal** : https://aka.ms/teamsfx-mtac

## Composants Clés à Tagger
- **teams-ai** : Bot Framework + Teams AI Library
- **azure-openai** : Configuration OpenAI RAG + corrections API
- **legal-bot** : Fonctionnalités juridiques RAG Québec
- **deployment** : Infrastructure Azure + provisioning
- **manifest** : Configuration Teams app + permissions

## Architecture du Projet

### Stack Technique
- **Frontend** : Microsoft Teams App (manifest v1.19)
- **Backend** : Node.js + Express + Bot Framework v4.23.1
- **AI Engine** : Azure OpenAI API 2024-10-21 + Teams AI Library v1.5.3
- **RAG System** : Azure Cognitive Search + Embedding ada-002
- **Infrastructure** : Azure App Service + Resource Group
- **Deployment** : Azure Developer CLI (atk)

### Environnements
```
local      : Développement local avec tunnel
playground : Test Microsoft 365 Agents Playground  
cotechnoe  : Production Cotechnoe Inc. (admin@cotechnoe01.onmicrosoft.com)
```

## Exemple de Release Notes Template

### Template : `docs/release/v1.0.X.md`
```markdown
# Release v1.0.X - [TITRE_FONCTIONNEL]

**Date** : $(date +%Y-%m-%d)  
**Tag** : v1.0.X-{composant}_{feature}  
**Environnement** : cotechnoe  

## 🎯 Objectif
[Description de la valeur ajoutée juridique/fonctionnelle]

## ✨ Nouvelles Fonctionnalités
- [ ] [Fonctionnalité 1]
- [ ] [Fonctionnalité 2]

## 🔧 Améliorations Techniques
- [ ] [Amélioration technique 1]
- [ ] [Amélioration technique 2]

## 🐛 Corrections
- [ ] [Bug fix 1]
- [ ] [Bug fix 2]

## 📋 Tests & Validation
- [ ] Déploiement Azure réussi
- [ ] Teams app publiée (Admin Portal)
- [ ] Tests RAG fonctionnels
- [ ] Validation juridique des réponses

## 📈 Métriques
- Version manifest.json : 1.0.X
- Status Azure App Service : ✅ Running
- Teams Admin Portal : ✅ Published
- Tests automatisés : [X/Y] passés

## 🔗 Liens Utiles
- [Azure App Service](https://botf2c163.azurewebsites.net)
- [Teams Admin Portal](https://aka.ms/teamsfx-mtac)
- [Commit](https://github.com/michel-heon/chatbottez-legis-qc/commit/[HASH])
```

---

## 📚 Références Rapides

### Makefile Commands
```bash
make help                    # Afficher toutes les commandes
make increment-version       # Incrémenter version manifest.json
make auto-publish ENV=cotechnoe           # Publish avec auto-increment
make auto-publish-and-open ENV=cotechnoe  # Publish + ouvrir Admin Portal
make open-admin-portal       # Ouvrir Teams Admin Portal
```

### Fichiers de Configuration Clés
```
appPackage/manifest.json     # Configuration Teams + version
src/prompts/chat/config.json # Configuration Azure OpenAI RAG
env/.env.cotechnoe           # Variables environnement production
m365agents.cotechnoe.yml     # Configuration deployment
```
