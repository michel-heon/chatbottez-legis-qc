# 📚 Documentation ChatBotTez Légis Québec

Bienvenue dans la documentation du projet **ChatBotTez Légis Québec** - Agent intelligent spécialisé dans les lois et règlements du Québec.

---

## 🎯 Vue d'ensemble du projet

**ChatBotTez Légis Québec** est un agent conversationnel Microsoft Teams alimenté par Azure OpenAI et Azure AI Search, spécialisé dans la législation québécoise. Le bot utilise le pattern RAG (Retrieval-Augmented Generation) pour fournir des réponses précises basées sur les textes officiels de lois.

### Caractéristiques principales

- **🤖 Agent Teams natif** : Intégration native dans Microsoft Teams
- **⚖️ Expertise juridique** : Spécialisé dans les lois et règlements du Québec
- **🔍 RAG Pattern** : Recherche vectorielle + génération contextuelle
- **🎨 Template Engine** : Architecture basée sur Custom Engine Agent (phase de migration en cours)
- **🌐 Multi-environnement** : Support local, playground, et production (Cotechnoe)

### Stack technologique

- **Runtime** : Node.js + TypeScript
- **Framework** : Microsoft 365 Agents Toolkit (TeamsFx)
- **LLM** : Azure OpenAI (GPT-4)
- **Search** : Azure AI Search (Vector + Hybrid)
- **Infrastructure** : Azure (Bot Service, App Service, Cosmos DB)
- **Deployment** : Azure Developer CLI (azd)

---

## 📖 Structure de la documentation

### 📋 Architecture Decision Records (ADR)

Documentation des décisions architecturales majeures du projet :

- **[ADR 000 - Processus de création ADR](adr/000-processus-creation-adr.md)** - Template et processus
- **[ADR 019 - Microsoft 365 Agents Toolkit Bonnes Pratiques](adr/019-microsoft-365-agents-toolkit-bonnes-pratiques.md)** - Adoption nouveau toolkit
- **[ADR 021 - Nomenclature Resource Groups Azure](adr/021-nomenclature-resource-groups-azure.md)** - Naming conventions Azure
- **[ADR 022 - Architecture Custom Engine Agent](adr/022-architecture-custom-engine-agent.md)** - ⭐ Migration complète Custom Engine Agent (v4.0.0)

➡️ **[Voir tous les ADRs](adr/)** - 23 ADRs disponibles

### ⚙️ Configuration

Guides de configuration des composants Azure et environnements :

- **[Configuration des environnements](configuration/environment-setup.md)** - Variables d'environnement et secrets
- **[Configuration Azure AI Search](configuration/azure-search-config.md)** - Paramètres de recherche optimaux
- **[Guide d'authentification Azure](configuration/azure-auth-guide.md)** - Auth Azure CLI & M365
- **[Guide Makefile](configuration/makefile-guide.md)** - Utilisation du Makefile (provisioning, deploy, maintenance)

➡️ **[Voir configuration/](configuration/)**

### 📘 Guides

Procédures et guides pratiques :

#### Déploiement
- **[Procédure déploiement production](guides/deployment/production-procedure.md)** - Checklist déploiement Cotechnoe
- **[Guide documentation déploiement](guides/deployment/deployment-documentation.md)** - Documentation des déploiements

#### Tests & Validation
- **[Guide tests streaming](guides/testing/streaming-test-guide.md)** - Tester les réponses streaming

#### Teams & PWA
- **[Guide Teams PWA](guides/teams-pwa-guide.md)** - Installation progressive web app Teams

➡️ **[Voir guides/](guides/)**

### 📦 Release Notes

Historique des versions et notes de release :

- **[Version 1.1.10](release/v1.1.10.md)** - Dernière version stable
- **[Version 1.1.9](release/v1.1.9.md)** - Certification Microsoft 365
- **[Version 1.1.8](release/v1.1.8.md)** - Améliorations UX
- **[Version 1.1.1](release/v1.1.1.md)** - Premières optimisations
- **[Versions antérieures](release/)** - v1.0.11, v1.0.12...

➡️ **[Voir release/](release/)**

### 📜 Archives

Documentation historique conservée pour référence :

- **[Certification](archives/certification/)** - Historique certification Microsoft
- **[Améliorations](archives/improvements/)** - Analyses d'améliorations passées
- **[Troubleshooting](archives/troubleshooting/)** - Résolutions de problèmes historiques
- **[Analyses](archives/analysis/)** - Audits et analyses de code

➡️ **[Voir archives/](archives/)**

---

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ LTS
- Azure CLI (`az`) authentifié
- Microsoft 365 Developer account
- VS Code + Teams Toolkit extension

### Installation

```bash
# 1. Cloner le repo
git clone <repo-url>
cd chatbottez-legis-qc

# 2. Installer les dépendances
make install

# 3. Configurer l'authentification
make auth-setup

# 4. Lancer en local
make local-deploy
```

### Déploiement production

```bash
# Déploiement complet environnement Cotechnoe
make cotechnoe-deploy
```

➡️ **Voir [Guide Makefile](configuration/makefile-guide.md) pour toutes les commandes**

---

## 🏗️ Architecture

### Flux de traitement

```
Utilisateur → Teams → Bot Service → App Service
                ↓                      ↓
           Teams App             Azure OpenAI
                                       ↓
                               Azure AI Search
                                       ↓
                                  Cosmos DB
                                  (contexte)
```

### Composants Azure

- **Azure Bot Service** : Connecteur Teams
- **Azure App Service** : Runtime Node.js du bot
- **Azure OpenAI** : LLM GPT-4 pour génération
- **Azure AI Search** : Index vectoriel + hybrid search
- **Azure Cosmos DB** : Stockage contexte conversationnel (optionnel)

### Pattern RAG

1. **Requête utilisateur** → Embedding (Azure OpenAI)
2. **Recherche vectorielle** → Azure AI Search (top 20 documents)
3. **Génération contextuelle** → GPT-4 + contexte retrieved
4. **Réponse streaming** → Teams adaptive card

---

## 🔧 Environnements

| Environnement | Usage | Configuration |
|---------------|-------|---------------|
| **local** | Développement local | `.env.local`, dev tunnel |
| **playground** | Tests rapides | Microsoft 365 Agents Playground |
| **cotechnoe** | Production | `.env.cotechnoe`, tenant Cotechnoe |

---

## 📞 Support & Contribution

### Rapporter un bug

1. Vérifier les [ADRs](adr/) et [Archives](archives/) pour problèmes connus
2. Créer un issue GitHub avec contexte complet
3. Si récurrent, créer un ADR selon [processus ADR 000](adr/000-processus-creation-adr.md)

### Contribuer

1. Lire les ADRs pertinents
2. Suivre les conventions de code existantes
3. Documenter les décisions architecturales (ADR si majeur)
4. Tester localement avec `make local-deploy`

---

## 📚 Ressources externes

- [Microsoft 365 Agents Toolkit](https://aka.ms/teams-toolkit)
- [Azure OpenAI Service](https://learn.microsoft.com/azure/ai-services/openai/)
- [Azure AI Search](https://learn.microsoft.com/azure/search/)
- [Teams App Development](https://learn.microsoft.com/microsoftteams/platform/)

---

**Équipe** : ChatBotTez  
**Dernière mise à jour** : 2025-12-11  
**Version** : 1.1.10 (branch: michel-heon/template-engine-agent-base)
