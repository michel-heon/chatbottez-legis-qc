# ADR-014 : Développement avec Microsoft 365 Agents Toolkit et Azure AI Foundry

## 📋 Métadonnées

- **Statut** : ✅ Accepté
- **Date de création** : 2025-02-02
- **Auteur(s)** : Équipe de développement Légis Québec
- **Décideurs** : Équipe technique
- **Catégorie** : Outils de développement, Infrastructure IA
- **Priorité** : Haute

## 🎯 Contexte

L'application Légis Québec Québec Teams est un agent IA personnalisé déployé sur Microsoft 365. Le projet nécessite un cadre de développement standardisé pour garantir la cohérence, la qualité et la maintenabilité du code. Avec l'évolution des outils Microsoft (Microsoft 365 Agents Toolkit, Azure AI Foundry), il est essentiel de documenter les bonnes pratiques de développement pour cette stack technologique spécifique.

### Outils concernés

- **Microsoft 365 Agents Toolkit** : Extension VS Code pour le développement d'agents
- **Azure AI Foundry** : Plateforme de développement IA avec SDK multi-langages
- **Microsoft 365 Agents SDK** : Framework pour agents multi-canaux
- **Microsoft 365 Agents Playground** : Environnement de test local sans tenant M365

## ❓ Problématique

Comment structurer le développement d'agents IA pour Microsoft 365 de manière à :

- Maximiser la productivité des développeurs
- Assurer la qualité et la traçabilité du code
- Faciliter les tests locaux et l'intégration continue
- Respecter les standards de sécurité et conformité Microsoft
- Permettre l'évolution vers d'autres canaux de déploiement

## 🎯 Décision

Nous adoptons un cadre de développement standardisé basé sur :

### 1. Environnement de développement

#### VS Code avec Microsoft 365 Agents Toolkit

- **Extension obligatoire** : `ms-microsoft-365.vscode-microsoft-365-agents-toolkit`
- **Formats disponibles** : Extension VS Code (recommandé), Visual Studio, GitHub Copilot extension, CLI
- **Avantages** :
  - Templates préconfigurés pour démarrage rapide
  - Debugging intégré avec breakpoints
  - Déploiement simplifié vers environnements multiples
  - CI/CD natif pour GitHub et Azure DevOps

#### Configuration projet

```json
{
  "workbench.extensions.recommendations": [
    "ms-microsoft-365.vscode-microsoft-365-agents-toolkit",
    "ms-azuretools.vscode-azure-github-copilot",
    "ms-vscode.azure-account"
  ]
}
```

### 2. Choix du type d'agent

#### Agents déclaratifs vs. Custom engine agents

| Critère | Agent déclaratif | Custom engine agent |
|---------|-----------------|---------------------|
| **Cas d'usage** | Extension M365 Copilot avec connaissances entreprise | Workflows spécialisés, orchestration complexe, intégrations externes |
| **Complexité** | Faible (configuration JSON) | Élevée (code complet) |
| **Orchestration** | M365 Copilot natif | Personnalisée (Semantic Kernel, LangChain, etc.) |
| **Modèles IA** | Azure OpenAI via M365 | N'importe quel LLM (Azure OpenAI, modèles personnalisés, etc.) |
| **Canaux** | M365 Copilot, Teams | M365 Copilot, Teams, Web, Email, SMS, +10 canaux |
| **Validation RAI** | Automatique | Manuelle requise |

**Décision pour Légis Québec** : Custom engine agent

- **Raisons** :
  - Nécessité d'intégration Azure AI Search personnalisée
  - Orchestration complexe avec gestion de contexte multi-conversations
  - Restriction périmètre UQAM (ADR-004)
  - Architecture existante basée sur Bot Framework

### 3. SDK et architecture

#### Microsoft 365 Agents SDK (recommandé)

```javascript
// Structure projet type
project-root/
├── src/
│   ├── app.js              // Point d'entrée, initialisation agent
│   ├── config.js           // Configuration centralisée (ADR-012)
│   ├── app/
│   │   ├── azureAISearchDataSource.js
│   │   ├── contextManager.js
│   │   └── llmConfig.js
│   └── index.js
├── env/
│   ├── .env.local          // Variables environnement local
│   ├── .env.dev            // Variables environnement dev
│   └── .env.production     // Variables environnement production
├── appPackage/
│   └── manifest.json       // Manifest M365 (v1.21+)
└── package.json
```

#### Principes architecturaux

1. **Séparation des préoccupations** : Configuration, logique métier, intégrations séparées
2. **Configuration centralisée** : Toutes les variables d'environnement dans `config.js` (ADR-012)
3. **Gestion des secrets** : Utilisation Azure Key Vault, jamais de commits en clair (ADR-007)
4. **Write once, run everywhere** : Code portable entre M365 Copilot, Teams, autres canaux

### 4. Intégration Azure AI Foundry

#### Foundry Project SDK

```javascript
import { AIProjectClient } from '@azure/ai-projects';
import { DefaultAzureCredential } from '@azure/identity';

// Initialisation client projet
const project = new AIProjectClient(
  process.env.AZURE_AI_PROJECT_ENDPOINT,
  new DefaultAzureCredential()
);

// Récupération client OpenAI depuis projet
const openAIClient = await project.getOpenAIClient();

// Utilisation pour requêtes
const response = await openAIClient.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Question utilisateur" }]
});
```

#### Avantages Foundry

- **Endpoint unifié** : Un seul point d'accès pour modèles, données, services
- **Authentification Microsoft Entra ID** : Sécurité renforcée vs. clés API
- **Tracing natif** : Observabilité avec Azure Application Insights (voir section 5)
- **Évaluations cloud** : Tests qualité/sécurité automatisés
- **Fine-tuning** : Possibilité personnaliser modèles

#### Foundry Tools disponibles

- **Azure AI Search** : Recherche vectorielle, RAG classique
- **Content Safety** : Détection contenu nuisible (texte, images)
- **Document Intelligence** : Extraction données documents
- **Language Services** : NER, analyse sentiments, résumés, PII
- **Speech Services** : Speech-to-text, text-to-speech, traduction

### 5. Tests et débogage

#### Microsoft 365 Agents Playground

- **Usage** : Tests locaux SANS tenant M365, SANS ngrok, SANS enregistrement bot
- **Avantages** :
  - Démarrage rapide sans dépendances externes
  - Itérations rapides pendant développement
  - Pas de coûts Azure pendant développement
  - Simulation conversations multi-tours

#### Workflow de test

1. **Local (Playground)** : Développement quotidien, tests unitaires
2. **Dev/Sandbox** : Tests d'intégration avec vraies ressources Azure
3. **Staging (RC)** : Validation complète avant production
4. **Production** : Déploiement final après validation RC

#### Commandes tasks.json

```json
{
  "tasks": [
    {
      "label": "Start Agent in Microsoft 365 Agents Playground",
      "type": "teamsfx",
      "command": "debug-check-prerequisites"
    },
    {
      "label": "Start Agent Locally",
      "type": "teamsfx",
      "command": "provision"
    }
  ]
}
```

### 6. Tracing et observabilité

#### OpenTelemetry avec Azure Application Insights

```javascript
import { configure_azure_monitor } from 'azure-monitor-opentelemetry';
import { OpenAIInstrumentor } from 'opentelemetry-instrumentation-openai-v2';

// Configuration tracing
const connectionString = project.telemetry.get_application_insights_connection_string();
configure_azure_monitor(connectionString);
OpenAIInstrumentor().instrument();

// Création spans personnalisés
import { trace } from 'opentelemetry';
const tracer = trace.get_tracer(__name__);

// Décorateur pour méthodes métier
tracer.start_as_current_span("assess_claims_with_context", async () => {
  const current_span = trace.get_current_span();
  current_span.set_attribute("operation.claims_count", claims.length);
  
  // Logique métier avec appels LLM
  // Tous les appels OpenAI sont tracés automatiquement
});
```

#### Visualisation traces

- **Foundry Portal** : Tracing > Liste des traces avec ID, durée, statut
- **Détails trace** : Timeline exécution, inputs/outputs, métriques performance, erreurs
- **AI Toolkit VS Code** : Tracing local avec collecteur OTLP pour développement

#### Métriques clés à surveiller

- **Latence** : Temps réponse par opération (cible < 3s pour expérience utilisateur)
- **Token usage** : Input tokens, output tokens, coût par requête
- **Taux d'erreur** : Échecs par type (réseau, modèle, validation)
- **Qualité réponses** : Scores évaluation (voir section 7)

#### Tracing en CI/CD

```javascript
// Configuration pour tests automatisés
import { SimpleSpanProcessor, ConsoleSpanExporter } from 'opentelemetry/sdk/trace';

const span_exporter = new ConsoleSpanExporter();
tracer_provider.add_span_processor(new SimpleSpanProcessor(span_exporter));

// Traces visibles dans logs CI/CD
```

### 7. Évaluation et qualité

#### Azure AI Foundry Evaluations

```javascript
// Évaluations cloud via Foundry SDK
await project.evaluations.run({
  evaluatorId: "content-safety-evaluator",
  data: testDataset,
  metrics: ["harmfulness", "bias", "groundedness"]
});
```

#### Métriques d'évaluation

- **Content Safety** : Harmfulness, violence, sexual, hate speech
- **Groundedness** : Réponses ancrées dans sources (ADR-003)
- **Relevance** : Pertinence réponses vs. questions utilisateurs
- **Coherence** : Cohérence logique des réponses
- **Fluency** : Qualité linguistique (français juridique pour le Québec)

#### Intégration CI/CD

- Tests d'évaluation automatiques sur pull requests
- Seuils qualité minimum avant merge (ex: groundedness > 0.8)
- Rapports évaluation dans artifacts pipeline

### 8. Responsible AI et conformité

#### Validation RAI obligatoire pour custom engine agents

```javascript
// Content Safety avec Azure AI Foundry
import { ContentSafetyClient } from '@azure/ai-content-safety';

const safetyClient = new ContentSafetyClient(
  process.env.AZURE_CONTENT_SAFETY_ENDPOINT,
  new DefaultAzureCredential()
);

// Analyse avant envoi réponse utilisateur
const result = await safetyClient.analyzeText({
  text: response,
  categories: ['Hate', 'SelfHarm', 'Sexual', 'Violence']
});

if (result.severity > THRESHOLD) {
  // Bloquer réponse ou demander révision
}
```

#### Divulgation obligatoire IA (ADR-005)

- Message bienvenue explicite : "Je suis un assistant IA"
- Limitations clairement communiquées
- Redirection vers humains si nécessaire

#### Conformité données

- **Stockage** : Conversations dans Microsoft 365 (product terms)
- **Gestion** : Content Search, Microsoft Purview pour admins
- **Restriction périmètre** : Données UQAM uniquement (ADR-004)
- **Secrets** : Azure Key Vault, rotation régulière (ADR-007)

### 9. CI/CD et déploiement

#### GitHub Actions workflow

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]
  pull_request:
    branches: [dev]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run evaluations
        run: npm run evaluate
        env:
          AZURE_AI_PROJECT_ENDPOINT: ${{ secrets.AZURE_AI_PROJECT_ENDPOINT }}
  
  deploy:
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      - name: Deploy agent
        run: |
          npm run deploy:${{ github.ref == 'refs/heads/main' && 'prod' || 'dev' }}
```

#### Environnements

- **Local** : `.env.local` + Agents Playground
- **Dev/Sandbox** : `.env.dev` + Ressources Azure dev
- **Staging/RC** : `.env.staging` + Ressources Azure staging
- **Production** : `.env.production` + Ressources Azure production

#### Azure DevOps alternative

- Pipeline YAML similaire
- Intégration native avec Azure Boards pour tracking
- Artifacts management pour packages

### 10. Documentation et formation

#### Documentation obligatoire

- **README.md** : Instructions setup local, variables d'environnement requises
- **CONFIGURATION.md** : Guide configuration détaillé (voir docs/guides/)
- **Architecture Decision Records** : Décisions techniques documentées (ce ADR)
- **Code comments** : Fonctions complexes commentées en français

#### Ressources Microsoft officielles

- [Microsoft 365 Agents Toolkit](https://aka.ms/M365AgentsToolkit)
- [Microsoft 365 Agents SDK Documentation](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/create-deploy-agents-sdk)
- [Azure AI Foundry Documentation](https://learn.microsoft.com/en-us/azure/ai-foundry/)
- [Declarative Agents Overview](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-declarative-agent)
- [Custom Engine Agents Overview](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-custom-engine-agent)

## ✅ Conséquences

### Positives ✅

- **Standardisation** : Tous les développeurs suivent les mêmes pratiques
- **Productivité** : M365 Agents Toolkit accélère développement (templates, debugging)
- **Qualité** : Tracing et évaluation automatiques améliorent qualité code
- **Sécurité** : Intégration Microsoft Entra ID + Content Safety
- **Évolutivité** : Architecture multi-canaux permet expansion future
- **Maintenance** : Code structuré facilite évolutions et corrections
- **Conformité** : Respect standards Microsoft pour Store/ISV publishing

### Négatives ⚠️

- **Courbe apprentissage** : Nouveaux développeurs doivent maîtriser stack Microsoft
- **Dépendance** : Forte dépendance aux outils Microsoft (toolkit, Foundry)
- **Coûts** : Azure Application Insights, evaluations cloud = coûts additionnels
- **Complexité setup** : Configuration initiale (Foundry project, App Insights, etc.)

### Risques 🔴

- **Évolution outils** : Microsoft 365 Agents Toolkit en évolution rapide (breaking changes possibles)
- **Limitations plateforme** : Contraintes M365 (quotas, limitations API)
- **Vendor lock-in** : Migration vers autre plateforme difficile si architecture trop couplée

## 📊 Métriques de succès

- ✅ 100% développeurs utilisent M365 Agents Toolkit
- ✅ Temps setup nouvel environnement < 30 minutes
- ✅ Tracing activé sur tous environnements (dev, staging, prod)
- ✅ Évaluations automatiques sur tous PRs
- ✅ Scores qualité Content Safety > 0.9
- ✅ Latence p95 réponses < 3 secondes
- ✅ Zero incidents sécurité liés aux secrets

## 🔄 Revue et maintenance

- **Fréquence** : Revue trimestrielle
- **Déclencheurs** :
  - Nouvelles versions Microsoft 365 Agents Toolkit
  - Nouveaux services Azure AI Foundry
  - Retours équipe sur difficultés développement
  - Incidents qualité/sécurité
- **Responsable** : Équipe technique Légis Québec

## 🔗 Liens connexes

### ADRs liés

- [ADR-001 : Git workflow et stratégie de versioning](./001-git-workflow-et-strategie-de-versioning.md)
- [ADR-004 : Restriction périmètre UQAM](./004-restriction-perimetre-uqam.md)
- [ADR-005 : Divulgation obligatoire IA](./005-divulgation-obligatoire-ia.md)
- [ADR-007 : Sécurité secrets Git](./007-securite-secrets-git.md)
- [ADR-012 : Gestion configuration centralisée](./012-gestion-configuration-centralisee.md)

### Documentation externe

- [Microsoft 365 Agents Toolkit Overview](https://aka.ms/M365AgentsToolkit)
- [Azure AI Foundry SDK Overview](https://learn.microsoft.com/en-us/azure/ai-foundry/how-to/develop/sdk-overview)
- [OpenTelemetry Tracing Guide](https://learn.microsoft.com/en-us/azure/ai-foundry/how-to/develop/trace-application)
- [Responsible AI Guidelines](https://learn.microsoft.com/en-us/azure/well-architected/ai/responsible-ai)

**Version** : 1.0  
**Dernière mise à jour** : 2025-02-02  
**Prochaine revue** : 2025-05-02
