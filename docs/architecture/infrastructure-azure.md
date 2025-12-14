# Infrastructure Azure - Légis Québec

## Vue d'Ensemble

L'infrastructure **Légis Québec** est déployée sur **Azure Canada East** avec une approche **Infrastructure as Code** (Bicep). Elle utilise des services managés Azure pour garantir disponibilité, scalabilité et sécurité.

## Architecture Cloud

```
┌─────────────────────────────────────────────────────────────┐
│              AZURE SUBSCRIPTION (Canada East)               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Resource Group: rg-bot-legisqc-{ENV}-cae-01     │    │
│  │  ENV = dev | prd                                  │    │
│  │                                                    │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │  COMPUTE                                     │ │    │
│  │  │                                              │ │    │
│  │  │  ┌──────────────┐      ┌──────────────┐    │ │    │
│  │  │  │ App Service  │──────│  Web App     │    │ │    │
│  │  │  │ Plan         │      │  (Node 18)   │    │ │    │
│  │  │  │ Tier: B1     │      │  Port: 3978  │    │ │    │
│  │  │  │ Linux        │      │  HTTPS only  │    │ │    │
│  │  │  └──────────────┘      └──────────────┘    │ │    │
│  │  │                                              │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │                                                    │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │  MESSAGING                                   │ │    │
│  │  │                                              │ │    │
│  │  │  ┌──────────────┐                           │ │    │
│  │  │  │ Bot Service  │                           │ │    │
│  │  │  │ SKU: F0      │                           │ │    │
│  │  │  │ Endpoint     │                           │ │    │
│  │  │  └──────────────┘                           │ │    │
│  │  │                                              │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │                                                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  EXTERNAL SERVICES (Shared, not deployed)         │    │
│  │                                                    │    │
│  │  • Azure OpenAI (gpt-4-1106-preview)              │    │
│  │  • Azure OpenAI (text-embedding-ada-002)          │    │
│  │  • Azure AI Search (fileupload-justice-index-02)  │    │
│  │                                                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Ressources Déployées

### 1. App Service Plan

**Configuration:**
- **Tier**: B1 (Basic) pour DEV
- **OS**: Linux
- **Compute**: 1 vCPU, 1.75 GB RAM
- **Instances**: 1 (no autoscale in B1)

**Nomenclature**: `asp-bot-legisqc-{ENV}-cae-01`

### 2. App Service (Web App)

**Runtime:**
- Node.js 18 LTS
- Port 3978
- HTTPS enforced
- Always On enabled

**Environment Variables:**
```
AZURE_OPENAI_API_KEY
AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_DEPLOYMENT_NAME
AZURE_SEARCH_ENDPOINT
AZURE_SEARCH_KEY
AZURE_SEARCH_STRICTNESS=1
DEBUG=false
```

**Health Endpoint**: `/api/messages` (Bot Framework)

**Nomenclature**: `bot{random}.azurewebsites.net`

### 3. Bot Service

**Configuration:**
- **SKU**: F0 (Free, 10K messages/month)
- **Channels**: Teams, M365 Copilot
- **Authentication**: Azure AD (Entra ID)
- **Messaging Endpoint**: `https://{app}.azurewebsites.net/api/messages`

**Nomenclature**: `bot-legisqc-{ENV}-cae-01`

### 4. Services Externes (Référencés)

**Azure OpenAI** (Shared):
- Deployments: gpt-4-1106-preview, text-embedding-ada-002
- Authentication: API Key
- Capacity: 60K tokens/min

**Azure AI Search** (Shared):
- Index: fileupload-justice-index-02
- Documents: 20+ lois/règlements
- Search: Hybrid (vector + keyword)
- Authentication: API Key

## Infrastructure as Code

### Bicep Structure

```
infra/
├── azure.bicep                 # Template principal
├── azure.parameters.json       # Paramètres
└── botRegistration/
    └── azurebot.bicep          # Bot Service
```

### Déploiement

**Via Microsoft 365 Agents Toolkit:**
```bash
teamsfx provision --env dev
teamsfx deploy --env dev
```

### Environnements

| Env | Resource Group | Status | URL |
|-----|----------------|--------|-----|
| local | - | ✅ Active | localhost:3978 |
| sandbox | - | ✅ Active | Teams Sandbox |
| **dev** | rg-bot-legisqc-dev-cae-01 | ✅ Active | bot34879.azurewebsites.net |
| prod | rg-bot-legisqc-prd-cae-01 | ⏳ Planned | TBD |

## Sécurité

### Transport Security
- **TLS 1.2+** enforced
- **HTTPS only**
- Azure-managed certificates

### Authentication
- **Bot**: Microsoft App ID + Password (Azure AD)
- **Users**: OAuth 2.0 (Microsoft 365)
- **Services**: API Keys → Managed Identity (future)

### Secrets Management
- **Storage**: App Service Configuration (encrypted at rest)
- **Git**: Secrets NEVER committed (ADR-010)
- **Future**: Azure Key Vault for PROD

### Network Flow

```
Users → Bot Framework → Bot Service → App Service
                                      ├─> Azure OpenAI
                                      └─> Azure AI Search
```

## Monitoring & Observabilité

### Logs

**App Service Logs:**
- Application logs (stdout/stderr)
- HTTP access logs
- Retention: 7 jours

**Accès:**
```bash
az webapp log tail --name bot34879 --resource-group rg-bot-legisqc-dev-cae-01
```

### Métriques (Future)

**Application Insights** (à implémenter):
- Request rate, response time
- Error rate, dependency calls
- Custom events (RAG searches, commands)

**Alertes** (à configurer):
- Latence > 10s (p95)
- Error rate > 5%
- Resource usage > 80%

## Backup & Disaster Recovery

### Backup Strategy

**Code**: Git (GitHub) + version tags  
**Configuration**: Bicep templates + env files  
**Data**: Stateless (no persistent data)

### Recovery

**RTO**: < 1 heure  
**RPO**: < 15 minutes

**Steps**: Clone repo → Deploy Bicep → Configure vars → Deploy app

## Scalabilité

### Vertical Scaling (Scale Up)

| Tier | vCPU | RAM | CAD/mois | Capacité |
|------|------|-----|----------|----------|
| B1 | 1 | 1.75 GB | ~$13 | 10-20 users |
| S1 | 1 | 1.75 GB | ~$75 | 20-50 users |
| P1V2 | 1 | 3.5 GB | ~$95 | 50-100 users |

### Horizontal Scaling (Scale Out)

**Prérequis**: S1+ tier, stateless app  
**Max instances**: 3 (recommended)  
**Trigger**: CPU > 70%

## Coûts Estimés

### DEV (Mensuel)

| Service | SKU | CAD |
|---------|-----|-----|
| App Service Plan | B1 | ~$13 |
| Bot Service | F0 | $0 |
| Azure OpenAI | Shared | ~$50* |
| Azure AI Search | Standard | ~$250* |
| **Total** | | **~$313** |

*Coûts partagés entre projets

## Best Practices

✅ Infrastructure as Code (Bicep)  
✅ Nomenclature cohérente (ADR-008)  
✅ Secrets hors Git (ADR-010)  
✅ HTTPS enforced  
✅ Stateless architecture  
✅ Logs centralisés

⚠️ À Implémenter:
- Managed Identity
- Application Insights
- Autoscaling (PROD)
- Azure Key Vault

## Références

- [ADR-007: Déploiement Toolkit CLI](../adr/007-deploiement-toolkit-cli.md)
- [ADR-008: Nomenclature Versions](../adr/008-nomenclature-versions-tags.md)
- [ADR-010: Sécurité Secrets Git](../adr/010-securite-secrets-git.md)
- [Production Deployment Guide](../guides/deployment/production-deployment.md)

---

**Auteur**: Michel Héon  
**Dernière mise à jour**: 2025-12-14  
**Version**: v4.0.0
