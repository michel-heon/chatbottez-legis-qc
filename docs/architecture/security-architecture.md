# Architecture Sécurité - Légis Québec

## Vue d'Ensemble

L'architecture sécurité de **Légis Québec** implémente une approche **defense-in-depth** avec multiples couches de protection: modération de contenu, authentification, chiffrement transport/repos, et gestion sécurisée des secrets.

## Modèle de Sécurité

```
┌────────────────────────────────────────────────────────────┐
│                    COUCHE 1: TRANSPORT                     │
│  • HTTPS enforced (TLS 1.2+)                              │
│  • Azure-managed certificates                              │
│  • Bot Framework secure channel                            │
└────────────────────┬───────────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────────────────┐
│                 COUCHE 2: AUTHENTICATION                   │
│  • Microsoft 365 OAuth 2.0                                │
│  • Azure AD (Entra ID) integration                        │
│  • Bot Service App ID + Password                          │
└────────────────────┬───────────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────────────────┐
│              COUCHE 3: CONTENT MODERATION                  │
│  • Pattern-based filtering                                │
│  • 8 categories monitored                                 │
│  • Legal context awareness                                │
└────────────────────┬───────────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────────────────┐
│                COUCHE 4: APPLICATION LOGIC                 │
│  • Input validation                                       │
│  • Rate limiting (Azure services)                         │
│  • Error handling (no info leak)                          │
└────────────────────┬───────────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────────────────┐
│                  COUCHE 5: DATA PROTECTION                 │
│  • Secrets encrypted (App Service Config)                 │
│  • No persistent user data                                │
│  • Logs sanitized (no PII)                                │
└────────────────────────────────────────────────────────────┘
```

## Content Moderation

### Stratégie: Permissive Legal Context

**Principe**: Bloquer uniquement les intentions **clairement nuisibles**, permettre les questions juridiques légitimes.

**8 Catégories Surveillées:**

| Catégorie | Exemples BLOQUÉS | Exemples PERMIS |
|-----------|------------------|-----------------|
| **Weapons** | "How to buy illegal gun" | "Menacé avec une arme" (victime) |
| **Violence** | "How to attack someone" | "Victime d'agression" (legal help) |
| **Hate Speech** | "Which race is superior" | "Discrimination au travail" (legal) |
| **Sexual** | "Where to find porn" | "Harcèlement sexuel" (legal) |
| **Drugs** | "How to buy cocaine" | "Accusé trafic drogue" (defense) |
| **Harmful** | "How to commit suicide" | "Prévention suicide" (policy) |
| **Political** | "Assassinate government" | Questions politiques légitimes |
| **Alcohol** | "Alcohol cures cancer" | "Vente d'alcool" (legal) |

### Implémentation

**Détection:**
- Pattern matching (regex)
- Bilingue (FR + EN)
- Context-aware (intent analysis)

**Action si Détecté:**
```
❌ [CONTENU INAPPROPRIÉ]
Je ne peux pas vous aider avec ce type de question.
I cannot assist you with this type of query.

Pour signaler: support@cotechnoe.com
```

**Logging:**
- Incident logged (sanitized)
- No user PII stored
- Review queue (manual validation)

## Authentication & Authorization

### User Authentication

**Flow:**
```
User → Microsoft Teams/Copilot
         ↓
      OAuth 2.0 (Microsoft 365)
         ↓
      Azure AD validation
         ↓
      Bot receives authenticated context
```

**User Context:**
- User ID (AAD Object ID)
- Tenant ID
- Display name
- **No password storage**

### Bot Authentication

**Bot Service:**
- **App ID**: Azure AD Application
- **App Password**: Encrypted secret
- **Validation**: Microsoft Bot Framework validates all incoming activities

**Service-to-Service:**
- Azure OpenAI: API Key (⚠️ Migrate to Managed Identity)
- Azure AI Search: Admin API Key (⚠️ Migrate to Managed Identity)

### Future: Managed Identity

**Recommandation:**
```
Current: API Keys (environment variables)
Target:  Managed Identity (passwordless)
         ↓
         No secrets in configuration
         Automatic credential rotation
         Azure RBAC permissions
```

## Transport Security

### HTTPS Enforcement

**Configuration:**
- HTTPS only (App Service setting)
- HTTP → HTTPS redirect
- TLS 1.2+ minimum
- Azure-managed certificates (auto-renewal)

**Bot Framework Channel:**
- End-to-end encryption
- Microsoft-managed infrastructure
- Secure WebSocket connections

### Certificate Management

**Automatic:**
- Azure provides TLS certificate
- Auto-renewal (90 days)
- Wildcard: `*.azurewebsites.net`

**Custom Domain (Future):**
- Azure-managed certificate via Let's Encrypt
- OR Azure Key Vault certificate

## Secrets Management

### Current: App Service Configuration

**Storage:**
- Environment variables (encrypted at rest)
- Azure Storage encryption (AES-256)
- Access: App Service identity only

**Secrets Stored:**
```
AZURE_OPENAI_API_KEY=***
AZURE_SEARCH_KEY=***
BOT_APP_PASSWORD=***
```

**Protection:**
- Never committed to Git (ADR-010)
- `.gitignore` enforced
- Pre-commit hooks validation

### Future: Azure Key Vault

**Target Architecture:**
```
App Service
    ↓
Managed Identity
    ↓
Azure Key Vault
    ├─ azure-openai-key (secret)
    ├─ azure-search-key (secret)
    └─ bot-app-password (secret)
```

**Benefits:**
- Centralized secret management
- Audit trail (who accessed when)
- Automatic rotation support
- Granular access control (RBAC)

## Data Protection

### User Data

**Principe**: Stateless architecture, no persistent user data

**Not Stored:**
- User messages (transient)
- Conversation history (handled by Bot Framework)
- Personal information

**Stored (Logs only):**
- Error traces (sanitized)
- Performance metrics (aggregated)
- Moderation incidents (anonymized)

### Logs Sanitization

**Pattern:**
```javascript
// Before logging
const sanitizedMessage = message.replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]');
const sanitizedEmail = message.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
```

**Retention:**
- Application logs: 7 jours
- Audit logs: 90 jours (future)
- No long-term PII storage

## Compliance Considerations

### GDPR / Loi 25 (Québec)

**Principes:**
- ✅ Data minimization (no persistent data)
- ✅ Purpose limitation (legal assistance only)
- ✅ Transparency (privacy policy, terms)
- ✅ User rights (no data = no deletion needed)
- ⚠️ Data residency: Canada East (Azure)

**Documentation:**
- Privacy policy: `appPackage/privacy.html`
- Terms of use: `appPackage/terms.html`

### Microsoft Teams Store Requirements

**Content Moderation:**
- ✅ Harmful content blocked
- ✅ Age-appropriate responses
- ✅ No adult content
- ✅ No hate speech
- ✅ Violence prevention

**Legal Compliance:**
- ✅ Legal disclaimer displayed
- ✅ Not a substitute for legal advice
- ✅ Professional consultation encouraged

## Security Best Practices

### Implemented ✅

- HTTPS enforced
- OAuth 2.0 authentication
- Content moderation (permissive legal)
- Secrets encrypted at rest
- No Git secrets (ADR-010)
- Error messages sanitized
- Stateless architecture
- Logs sanitized (no PII)

### To Implement ⚠️

- Managed Identity (replace API Keys)
- Azure Key Vault integration
- Application Insights security events
- Rate limiting (application-level)
- Input validation hardening
- SIEM integration (security events)
- Penetration testing (PROD)

## Incident Response

### Detection

**Monitoring:**
- Moderation incidents (logged)
- Authentication failures (Azure AD)
- Error rates (Application Insights - future)

**Alerts:**
- Spike in moderation blocks
- Unusual error patterns
- Service availability < 99%

### Response Plan

1. **Triage**: Classify severity (low/medium/high/critical)
2. **Investigation**: Review logs, identify root cause
3. **Mitigation**: Block malicious patterns, patch vulnerabilities
4. **Communication**: Notify stakeholders if needed
5. **Post-mortem**: Document incident, update procedures

### Contacts

- **Security Team**: support@cotechnoe.com
- **Azure Support**: Via portal (if infrastructure)
- **Microsoft Teams**: Via admin center (if channel issue)

## Threat Model

### Identified Threats

| Threat | Mitigation | Status |
|--------|------------|--------|
| Man-in-the-middle | HTTPS + TLS 1.2+ | ✅ Active |
| Credential theft | OAuth (no passwords stored) | ✅ Active |
| Harmful content | Pattern-based moderation | ✅ Active |
| Data breach | No persistent PII | ✅ Active |
| Secret exposure | Encrypted config, no Git | ✅ Active |
| DDoS | Azure protection + Bot Framework rate limiting | ✅ Active |
| Prompt injection | Input validation + system prompt hardening | ⚠️ Partial |

### Future Enhancements

- Advanced prompt injection detection
- Anomaly detection (ML-based)
- Real-time security dashboards
- Automated threat response

## Références

- [ADR-010: Sécurité Secrets Git](../adr/010-securite-secrets-git.md)
- [ADR-011: Configuration Centralisée](../adr/011-configuration-centralisee.md)
- [Privacy Policy](../../appPackage/privacy.html)
- [Terms of Use](../../appPackage/terms.html)
- [Azure Security Best Practices](https://learn.microsoft.com/en-us/azure/security/fundamentals/best-practices-and-patterns)

---

**Auteur**: Michel Héon  
**Dernière mise à jour**: 2025-12-14  
**Version**: v4.0.0
