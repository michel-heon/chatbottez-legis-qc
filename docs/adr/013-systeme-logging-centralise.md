# ADR 016: Système de Logging Centralisé avec Niveaux Configurables

## Statut

✅ Accepté

## Date

2025-11-26

## Contexte

Le projet Légis Québec utilise Microsoft Teams SDK et Azure OpenAI pour fournir un agent conversationnel. Durant le développement et le débogage, plusieurs problèmes liés aux traces et au logging sont apparus :

### Problèmes identifiés

1. **Traces dispersées** : Utilisation ad-hoc de `console.log()`, `console.error()`, et `console.warn()` à travers toute la base de code (43 occurrences dans 7 fichiers)
2. **Pas de contrôle de verbosité** : Impossible de filtrer les logs selon l'environnement (développement local, staging, production)
3. **Débogage difficile** : Besoin de tracer les commandes désactivées (`/removehistory`) sans les activer
4. **Production non préparée** : Aucune intégration prévue avec Application Insights pour la télémétrie en production
5. **Inconsistance** : Formats de messages variés, pas de contexte structuré, pas de timestamps
6. **Non conforme aux standards Microsoft** : Les bonnes pratiques Microsoft Teams SDK et Azure Bot Service n'étaient pas suivies

### Exemple de problème concret

Lors du débogage de la commande `/removehistory`, il était impossible de voir la trace de détection sans activer la commande elle-même. Les autres commandes comme `/clear` affichaient des traces, mais de manière inconsistante.

### Besoins identifiés

- Système de logging centralisé et unifié
- Niveaux de log hiérarchiques configurables (TRACE → ERROR)
- Configuration par variable d'environnement
- Logs structurés avec contexte (utilisateur, conversation, etc.)
- Préparation pour Application Insights (production)
- Conformité aux standards Microsoft

## Décision

Implémenter un système de logging centralisé via le module `src/utils/logger.js` avec les caractéristiques suivantes :

### 1. Architecture du Logger

```javascript
// Singleton pattern pour instance unique
class Logger {
  constructor() {
    this.levels = {
      TRACE: 0,  // Détails très fins (entrées/sorties fonctions)
      DEBUG: 1,  // Debugging (requêtes, recherches)
      INFO: 2,   // Messages informatifs généraux [DÉFAUT]
      WARN: 3,   // Avertissements
      ERROR: 4,  // Erreurs
      OFF: 5     // Désactive tous les logs
    };
  }
  
  // Méthodes publiques
  trace(context, message, data = null)
  debug(context, message, data = null)
  info(context, message, data = null)
  warn(context, message, data = null)
  error(context, message, error = null)
}
```

### 2. Configuration par Environnement

**Variable d'environnement** :

```bash
LOG_LEVEL=DEBUG  # TRACE | DEBUG | INFO | WARN | ERROR | OFF
```

**Valeurs recommandées par environnement** :

- **Local/Dev** : `DEBUG` ou `TRACE` (débogage détaillé)
- **Staging** : `INFO` (monitoring général)
- **Production** : `WARN` (erreurs et avertissements uniquement)

### 3. Format de Log Structuré

```
[TIMESTAMP] [LEVEL] [CONTEXT] message
```

**Exemple** :
```
[2025-11-26T10:15:30.123Z] [TRACE] [Commands] Commande détectée: "/removehistory"
[2025-11-26T10:15:30.125Z] [WARN] [Commands] ⚠️  Commande DÉSACTIVÉE: /removehistory
[2025-11-26T10:15:30.150Z] [DEBUG] [AzureAISearch] Returned 5 documents for query "..."
```

### 4. Intégration Application Insights

Préparation pour la production :

```javascript
// Configuration future (production)
const { TelemetryClient } = require("applicationinsights");
const telemetryClient = new TelemetryClient(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);
logger.setTelemetryClient(telemetryClient);
```

**Mapping des sévérités** :

- TRACE → Verbose (0)
- DEBUG → Verbose (0)
- INFO → Information (1)
- WARN → Warning (2)
- ERROR → Error (3)

### 5. Migration des Console.* existants

**Remplacer tous les `console.*` par le logger** :

```javascript
// ❌ ANCIEN
console.log('[TRACE] Commande détectée:', userInput);
console.error('Error processing message:', error);

// ✅ NOUVEAU
logger.trace('Commands', `Commande détectée: "${userInput}"`, { user, conversationId });
logger.error('MessageHandler', 'Error processing message:', error);
```

### 6. Standards Microsoft suivis

- **TeamsFx SDK** : Configuration par `setLogLevel()`, environnement-spécifique
- **Azure Bot Service** : Télémétrie avec `IBotTelemetryClient`, mapping sévérité standard
- **Azure Functions** : Logs console en dev, Application Insights en production
- **MSAL** : Niveaux TRACE pour opérations sensibles (tokens, auth)

## Conséquences

### ✅ Avantages

1. **Contrôle de verbosité** : Changer `LOG_LEVEL` sans modifier le code
2. **Débogage efficace** : Tracer les commandes désactivées avec `LOG_LEVEL=TRACE`
3. **Performance en production** : Réduire les logs avec `LOG_LEVEL=WARN` ou `ERROR`
4. **Logs structurés** : Contexte enrichi (utilisateur, conversation) facilite le debugging
5. **Prêt pour Application Insights** : Migration transparente vers télémétrie cloud
6. **Conformité Microsoft** : Suit les patterns officiels Teams SDK et Bot Service
7. **Maintenance facilitée** : API unique, changements centralisés
8. **Lisibilité** : Color-coding console, timestamps, contexte clair
9. **Sécurité** : try/catch autour de la télémétrie évite les crashs
10. **Réutilisabilité** : Singleton pattern garantit instance unique

### ⚠️ Compromis

1. **Migration manuelle** : 43 occurrences de `console.*` à remplacer
2. **Dépendance** : Tous les modules doivent importer `logger`
3. **Overhead léger** : Vérification de niveau à chaque appel (négligeable en pratique)
4. **Discipline requise** : Développeurs doivent utiliser le logger systématiquement

### 🔄 Changements requis

1. **Fichiers à migrer** (priorité) :
   - ✅ `src/index.js` (1 occurrence) - COMPLÉTÉ
   - ✅ `src/app/app.js` (4 occurrences) - COMPLÉTÉ
   - ✅ `src/app/azureAISearchDataSource.js` (1 occurrence) - COMPLÉTÉ
   - ⏳ `src/app/graphClient.js` (5 occurrences)
   - ⏳ `src/app/contextManager.js` (10 occurrences)
   - ⏳ `src/app/channelManager.js` (8 occurrences)
   - ⏳ `src/app/gptChannelCommands.js` (5 occurrences)

2. **Configuration** :
   - ✅ Ajouter `logLevel` à `src/config.js`
   - ✅ Documenter `LOG_LEVEL` dans `env/.env.local.user.example`
   - ✅ Définir `LOG_LEVEL=DEBUG` dans `env/.env.local.user`

3. **Documentation** :
   - 📝 Mettre à jour le README avec section "Logging"
   - 📝 Ajouter exemples d'utilisation dans le wiki
   - 📝 Documenter la configuration Application Insights pour production

## Alternatives Considérées

### 1. ❌ Continuer avec console.log/error

**Rejeté pour** :

- Pas de contrôle de verbosité
- Pas d'intégration Application Insights
- Inconsistance des formats
- Non professionnel pour production

### 2. ❌ Utiliser winston ou bunyan

**Rejeté pour** :

- Dépendance externe lourde (overkill pour besoins actuels)
- Configuration complexe
- Overhead de performance
- Notre logger custom (153 lignes) suffit largement

**Peut être reconsidéré si** :

- Besoin de rotation de logs fichiers
- Formats de sortie multiples (JSON, syslog)
- Transports personnalisés avancés

### 3. ❌ Application Insights directement

**Rejeté pour** :

- Besoin de logs console en développement local
- Coût Azure même en dev (pas acceptable)
- Complexité de configuration
- Latence réseau pour chaque log

**Notre solution** : Console en dev, Application Insights en production (best of both)

### 4. ❌ Console.* avec préfixes manuels

**Rejeté pour** :

- Discipline humaine peu fiable
- Pas de filtrage automatique
- Format inconsistant
- Pas de télémétrie

## Implémentation

### Fichier principal : `src/utils/logger.js`

```javascript
/**
 * Centralized logging system with configurable levels
 * 
 * Usage:
 *   const logger = require('./utils/logger');
 *   logger.trace('Context', 'Message', { data });
 *   logger.debug('Context', 'Message', { data });
 *   logger.info('Context', 'Message');
 *   logger.warn('Context', 'Warning message');
 *   logger.error('Context', 'Error message', error);
 * 
 * Configuration:
 *   Set LOG_LEVEL environment variable:
 *   TRACE (most verbose) → DEBUG → INFO (default) → WARN → ERROR → OFF
 * 
 * @see https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teamsfx-sdk
 * @see https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-telemetry
 */
class Logger {
  // ... 153 lignes ...
}

module.exports = new Logger();
```

### Configuration : `src/config.js`

```javascript
const config = {
  // ... autres configs ...
  logLevel: process.env.LOG_LEVEL || 'INFO',
};
```

### Exemple d'utilisation : `src/app/app.js`

```javascript
const logger = require("../utils/logger");

// Tracer les commandes détectées
logger.trace('Commands', `Commande détectée: "${userInput}"`, {
  user: activity.from?.name || 'unknown',
  conversationId: activity.conversation?.id || 'unknown'
});

// Avertir pour commandes désactivées
logger.warn('Commands', `⚠️  Commande DÉSACTIVÉE: ${userInput}`);

// Logger les erreurs
logger.error('MessageHandler', 'Error processing message:', error);
```

### Tests recommandés

```bash
# Tester avec différents niveaux
LOG_LEVEL=TRACE npm run dev:teamsfx   # Maximum de détails
LOG_LEVEL=DEBUG npm run dev:teamsfx   # Debugging normal
LOG_LEVEL=INFO npm run dev:teamsfx    # Défaut (production-like)
LOG_LEVEL=WARN npm run dev:teamsfx    # Silencieux (erreurs seulement)
LOG_LEVEL=OFF npm run dev:teamsfx     # Aucun log
```

### Migration Application Insights (future production)

```javascript
// Dans src/index.js ou fichier d'initialisation
const appInsights = require("applicationinsights");
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoCollectConsole(true, true)
  .start();

const logger = require("./utils/logger");
logger.setTelemetryClient(appInsights.defaultClient);
```

## Références

### Documentation Microsoft

- [TeamsFx SDK - Configure Log](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teamsfx-sdk#configure-log)
- [Azure Bot Service - Add telemetry](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-telemetry)
- [Application Insights for Node.js](https://learn.microsoft.com/en-us/azure/azure-monitor/app/nodejs)
- [Azure Functions - Monitor executions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-monitoring)

### ADR liés

- [ADR-001](./001-git-workflow-et-strategie-de-versioning.md) : Git workflow et versioning
- [ADR-012](./012-gestion-configuration-centralisee.md) : Gestion configuration centralisée

### Commit associé

```bash
git commit -m "feat(logging): implement centralized logging system with configurable levels

- Add src/utils/logger.js with TRACE/DEBUG/INFO/WARN/ERROR/OFF levels
- Configure via LOG_LEVEL environment variable
- Migrate core files (index.js, app.js, azureAISearchDataSource.js)
- Prepare Application Insights integration for production
- Follow Microsoft Teams SDK and Azure Bot Service patterns
- Add comprehensive documentation in .env examples

Refs: ADR-016"
```

## Suivi

- **Date de création** : 2025-11-26
- **Auteur** : Équipe Cotechnoe
- **Révisions** : -
- **Prochaines étapes** :
  1. ✅ Créer `src/utils/logger.js` (COMPLÉTÉ)
  2. ✅ Migrer fichiers core (index.js, app.js, azureAISearchDataSource.js) (COMPLÉTÉ)
  3. ⏳ Migrer fichiers restants (graphClient, contextManager, channelManager, gptChannelCommands)
  4. ⏳ Tester avec application en cours d'exécution
  5. ⏳ Mettre à jour README avec section "Logging"
  6. ⏳ Documenter configuration Application Insights pour production
  7. ⏳ Former l'équipe sur l'utilisation du logger

**Historique des modifications** :

- 2025-11-26 : Création initiale (version 1.0)
