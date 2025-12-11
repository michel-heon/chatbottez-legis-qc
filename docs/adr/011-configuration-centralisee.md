# ADR 012: Gestion de la Configuration Centralisée

## Statut

🔄 Proposé

## Date

2025-11-21

## Contexte

Le projet contient actuellement plusieurs fichiers où les métadonnées de l'application (nom, version, description) sont définies de manière redondante :

- `package.json` : `name`, `version`, `description`
- `appPackage/manifest.json` : `version`, `name.short`, `name.full`, `description`
- `env/.env.local` : `APP_VERSION`, `APP_NAME`, `APP_SHORT_NAME`
- `env/.env.playground` : `APP_VERSION`, `APP_NAME`, `APP_SHORT_NAME`
- `env/.env.dev` : `APP_VERSION`, `APP_NAME`, `APP_SHORT_NAME`
- `src/config.js` : Lit les variables d'environnement

### Problème

Lors d'un changement de version (ex: 2.1.0 → 2.2.0), il faut modifier manuellement **plusieurs fichiers**, ce qui :

1. **Augmente le risque d'erreurs** : Oubli d'un fichier, incohérence entre environnements
2. **Ralentit le workflow** : Rechercher tous les fichiers à modifier
3. **Complique le versioning** : Difficile de suivre ADR-001 (Semantic Versioning)
4. **Crée des désynchronisations** : Version dans `package.json` ≠ version dans `manifest.json`

### Objectif

Établir un **point unique de vérité** pour les métadonnées de l'application, avec synchronisation automatique vers tous les fichiers nécessaires.

### Contraintes

- Doit rester compatible avec **npm** (commande `npm version`)
- Doit respecter **ADR-001** (Semantic Versioning avec tags git)
- Doit fonctionner avec **Teams Toolkit** (format manifest.json)
- Doit supporter les **environnements multiples** (local, playground, dev, prod)
- `package.json` doit rester au format JSON standard (pas d'interpolation de variables)

## Décision

⚠️ **DÉCISION EN ATTENTE** - Ce document compare les options disponibles pour faciliter le choix futur.

Les options suivantes ont été analysées en détail. La décision sera prise ultérieurement et ce document sera mis à jour.

## Alternatives Considérées

### Alternative 1: Fichier `.env.version` comme source de vérité

**Description** :
- Créer `env/.env.version` contenant toutes les métadonnées
- Script Node.js `scripts/sync-version.js` lit ce fichier
- Synchronise automatiquement vers `package.json`, `manifest.json`, et tous les `.env.*`

**Workflow** :
```bash
# Modifier UNE SEULE FOIS
vim env/.env.version  # APP_VERSION=2.2.0

# Synchroniser partout
npm run sync-version

# Commit
git add . && git commit -m "chore: bump version to 2.2.0"
```

**Avantages** :
- ✅ Un seul fichier à modifier
- ✅ Format simple (KEY=VALUE)
- ✅ Automatisation complète
- ✅ Support multi-environnement natif
- ✅ Peut contenir toute la config métier

**Inconvénients** :
- ❌ Fichier `.env` non standard npm
- ❌ Nécessite script de synchronisation (~50 lignes)
- ❌ Commande `npm version` ne fonctionne plus directement

**Complexité** : Moyenne (script Node.js simple)

---

### Alternative 2: `package.json` comme référence + Script de propagation

**Description** :
- `package.json` reste la source de vérité pour `name` et `version`
- Utiliser `npm version` pour gérer les versions
- Script lit `package.json` et propage vers `manifest.json` et `.env.*`

**Workflow** :
```bash
# Utiliser npm standard
npm version 2.2.0 --no-git-tag-version

# Synchroniser vers autres fichiers
npm run sync-manifests

# Commit selon ADR-001
git add . && git commit -m "chore: bump version to 2.2.0"
```

**Avantages** :
- ✅ Standard npm (commande `npm version` intégrée)
- ✅ `package.json` déjà existant et reconnu
- ✅ Compatible avec tous les outils npm/node
- ✅ Versionning git intégré (`npm version` peut créer commit + tag)

**Inconvénients** :
- ❌ `package.json` pas conçu pour config métier
- ❌ Moins flexible pour variables custom (APP_SHORT_NAME, etc.)
- ❌ Nécessite quand même un script de sync

**Complexité** : Faible (script de sync simple)

---

### Alternative 3: Makefile avec variables centralisées

**Description** :
- Variables définies en haut du `Makefile`
- Commandes Make pour synchroniser (sed/awk)
- Support pour bump automatique de version

**Workflow** :
```bash
# Modifier dans Makefile
vim Makefile  # APP_VERSION := 2.2.0

# Synchroniser
make sync-version

# OU bump automatique
make bump-minor
```

**Avantages** :
- ✅ Pas de dépendance Node.js
- ✅ Commandes shell standard
- ✅ Le projet a déjà un Makefile (appPackage/Makefile)
- ✅ Support pour automatisation avancée

**Inconvénients** :
- ❌ Syntaxe Makefile moins accessible
- ❌ `sed` varie selon OS (GNU/BSD)
- ❌ Moins intégré avec npm
- ❌ Makefile actuel est pour wiki, pas pour config

**Complexité** : Moyenne (syntaxe Make + portabilité)

---

### Alternative 4: Fichier JSON centralisé (`config/app.config.json`)

**Description** :
- Créer `config/app.config.json` avec toute la configuration projet
- Support pour configuration par environnement
- Scripts lisent ce JSON pour synchroniser
- `src/config.js` peut aussi le lire pour runtime

**Structure** :
```json
{
  "name": "chatbottezlegisqc",
  "displayName": "Légis Québec Postdoc",
  "version": "2.1.0",
  "description": "Assistant juridique Québec",
  "environments": {
    "local": { "suffix": "local" },
    "playground": { "suffix": "alpha" },
    "dev": { "suffix": "rc" },
    "prod": { "suffix": "" }
  }
}
```

**Workflow** :
```bash
# Modifier dans config JSON
vim config/app.config.json

# Synchroniser
npm run sync-config
```

**Avantages** :
- ✅ Structure très flexible
- ✅ Support natif multi-environnement
- ✅ Lisible par code JS : `require('../config/app.config.json')`
- ✅ Peut contenir toute la config projet (URLs, features flags, etc.)
- ✅ Format JSON standard

**Inconvénients** :
- ❌ Fichier supplémentaire à maintenir
- ❌ Script de sync plus complexe (~80 lignes)
- ❌ Non standard npm
- ❌ Duplication avec `package.json`

**Complexité** : Élevée (structure + script)

---

### Alternative 5A: `config.js` lit `package.json` (Hybride) ⭐ RECOMMANDÉ

**Description** :
- `package.json` reste la source pour `name` et `version`
- `src/config.js` lit `package.json` via `require('../package.json')`
- Script synchronise `package.json` vers `manifest.json` et `.env.*`
- Pas de duplication dans `config.js`

**Structure** :
```javascript
// src/config.js
const packageJson = require('../package.json');

const config = {
  appName: process.env.APP_NAME || packageJson.name,
  appVersion: process.env.APP_VERSION || packageJson.version,
  appDescription: packageJson.description,
  // ... reste de la config runtime
};
```

**Workflow** :
```bash
# 1. Changer version (standard npm)
npm version 2.2.0 --no-git-tag-version

# 2. Synchroniser vers manifests Teams
npm run sync-version

# 3. config.js lit automatiquement package.json (pas de sync)

# 4. Commit selon ADR-001
git add . && git commit -m "chore: bump version to 2.2.0"
```

**Avantages** :
- ✅ `package.json` reste standard npm
- ✅ `config.js` récupère automatiquement (pas de sync config.js)
- ✅ Un seul script pour sync vers manifests
- ✅ Compatible ADR-001 (semantic versioning)
- ✅ Pas de duplication dans le code
- ✅ Valeurs par défaut si `.env` manque

**Inconvénients** :
- ❌ Nécessite quand même un script de sync (manifest + .env)
- ❌ Deux sources : `package.json` pour metadata, `.env` pour runtime

**Complexité** : Faible (modification config.js + script sync simple)

---

### Alternative 5B: `config.js` comme source unique

**Description** :
- Définir version directement dans `src/config.js` (valeurs en dur)
- Script parse `config.js` et extrait les valeurs
- Synchronise vers `package.json`, `manifest.json`, `.env.*`

**Avantages** :
- ✅ Un seul fichier source pour tout
- ✅ Runtime et build utilisent la même source

**Inconvénients** :
- ❌ Non standard npm (npm ne connaît pas config.js)
- ❌ Script de sync très complexe (parser JavaScript)
- ❌ Risque de régression (parsing peut casser)
- ❌ `package.json` devient secondaire

**Complexité** : Élevée (parsing JS + sync multi-fichiers)

**Rejetée immédiatement** : Trop complexe, non standard

---

## Comparaison des Alternatives

| Critère | Alt 1 (.env) | Alt 2 (package.json) | Alt 3 (Makefile) | Alt 4 (JSON) | Alt 5A (Hybride) |
|---------|--------------|----------------------|------------------|--------------|------------------|
| **Flexibilité** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Standard npm** | ⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Facilité d'usage** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Multi-environnement** | ⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Complexité script** | Moyenne | Faible | Moyenne | Élevée | Faible |
| **Compatibilité ADR-001** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Maintenabilité** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

## Conséquences

### Note

Les conséquences seront détaillées une fois la décision prise et l'implémentation effectuée.

### Conséquences générales (communes à toutes les options)

**Positives ✅** :
- Point unique à modifier pour changer la version
- Automatisation du workflow de versioning
- Réduction des erreurs humaines
- Cohérence garantie entre tous les fichiers
- Support du workflow ADR-001

**Négatives ⚠️** :
- Nécessite un script de synchronisation
- Dépendance à npm scripts
- Courbe d'apprentissage pour l'équipe

**Mitigations** :
- Documentation claire dans README
- Script simple et commenté
- Commandes npm intuitives (`npm run sync-version`)
- Possibilité de commit hook pour automatiser

## Implémentation

⚠️ **À DÉFINIR** - L'implémentation sera effectuée après choix de l'alternative.

### Étapes générales (quelle que soit l'option choisie)

1. **Phase 1 : Préparation**
   - Créer le script de synchronisation
   - Ajouter npm scripts dans `package.json`
   - Tester en local

2. **Phase 2 : Migration**
   - Identifier toutes les occurrences actuelles
   - Exécuter la première synchronisation
   - Valider la cohérence

3. **Phase 3 : Documentation**
   - Mettre à jour README avec nouveau workflow
   - Documenter dans `docs/guides/CONFIGURATION.md`
   - Former l'équipe

4. **Phase 4 : Intégration CI/CD**
   - Ajouter validation dans pipeline
   - Automatiser avec git hooks (optionnel)

### Artefacts à créer (selon option choisie)

- Script : `scripts/sync-version.js` (ou équivalent)
- Documentation : Mise à jour de `docs/guides/CONFIGURATION.md`
- npm script : `"sync-version": "node scripts/sync-version.js"`
- Tests : Script de validation de cohérence

## Références

- [ADR-001: Git Workflow et Stratégie de Versioning](001-git-workflow-et-strategie-de-versioning.md)
- [ADR-000: Processus de Création d'ADR](000-processus-creation-adr.md)
- [npm version documentation](https://docs.npmjs.com/cli/v8/commands/npm-version)
- [Teams Toolkit manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Twelve-Factor App - Config](https://12factor.net/config)

## Notes

- **Date de création** : 2025-11-21
- **Décision attendue** : À déterminer
- **Implémentation prévue** : Après choix de l'alternative
- **Impact** : Moyen (workflow de développement)
- **Urgence** : Faible (amélioration qualité)

---

**Historique des modifications** :
- 2025-11-21 : Création de l'ADR avec analyse des 5 alternatives principales
