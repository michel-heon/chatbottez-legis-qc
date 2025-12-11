# ADR 015: Nomenclature des Scripts Bash

## Statut

✅ Accepté

## Date

2025-11-26

## Contexte

Le projet Légis Québec Postdoc nécessite des scripts d'automatisation pour diverses tâches (gestion de version, déploiement, maintenance, etc.). Sans convention de nommage claire, plusieurs problèmes surviennent :

- **Difficulté de découverte** : Les développeurs ne trouvent pas facilement le script dont ils ont besoin
- **Inconsistance** : Différents styles de nommage créent de la confusion (`update-version.sh`, `deploy.sh`, `setupEnvironment.sh`)
- **Maintenance complexe** : Difficile de comprendre rapidement la fonction d'un script
- **Organisation** : Pas de structure logique pour regrouper les scripts par domaine

Questions à répondre :
- Comment nommer les scripts de manière cohérente et prévisible ?
- Comment faciliter la découverte des scripts disponibles ?
- Comment maintenir la lisibilité tout en restant concis ?
- Comment gérer les scripts avec plusieurs actions sur un même objet ?

## Décision

Adopter une nomenclature standardisée pour tous les scripts bash du projet selon le format :

```
{object}-{action}.sh
```

### Règles de Nomenclature

1. **Format obligatoire** : `{object}-{action}.sh`
   - `{object}` : Le nom du domaine/composant concerné (nom singulier)
   - `{action}` : L'action effectuée par le script (verbe infinitif)
   - Séparateur : tiret (`-`)
   - Extension : `.sh`

2. **Conventions de nommage**
   - **Tout en minuscules** (lowercase)
   - **Mots séparés par des tirets** dans chaque segment si nécessaire
   - **Object en nom singulier** : `version`, `database`, `deployment`
   - **Action en verbe infinitif** : `update`, `deploy`, `backup`, `restore`, `clean`

3. **Exemples valides**
   ```
   version-update.sh       # Met à jour la version du projet
   version-bump.sh         # Incrémente la version
   database-backup.sh      # Sauvegarde la base de données
   database-restore.sh     # Restaure la base de données
   deployment-deploy.sh    # Déploie l'application
   environment-setup.sh    # Configure l'environnement
   dependencies-install.sh # Installe les dépendances
   logs-clean.sh          # Nettoie les logs
   manifest-build.sh      # Construit le manifest Teams
   ```

4. **Cas particuliers**
   - **Plusieurs mots dans l'objet** : `azure-storage-sync.sh`
   - **Plusieurs mots dans l'action** : `version-bump-major.sh`
   - **Scripts génériques** : Préfixer avec `project-` (ex: `project-init.sh`)

5. **Organisation dans `/scripts`**
   ```
   scripts/
   ├── README.md                 # Documentation des scripts
   ├── version-update.sh         # Gestion de version
   ├── version-bump.sh
   ├── deployment-deploy.sh      # Déploiement
   ├── deployment-rollback.sh
   ├── database-backup.sh        # Base de données
   ├── database-restore.sh
   └── environment-setup.sh      # Configuration
   ```

### Exemples de Migration

**Avant (❌ non-standard) :**
```bash
scripts/update-version.sh      # Action avant objet
scripts/deployToAzure.sh       # camelCase
scripts/backup_db.sh           # underscore
scripts/Setup.sh               # Majuscule
```

**Après (✅ standard ADR-015) :**
```bash
scripts/version-update.sh      # Objet-Action
scripts/azure-deploy.sh        # lowercase
scripts/database-backup.sh     # tirets
scripts/environment-setup.sh   # lowercase
```

## Conséquences

### Positives ✅

- **Prévisibilité** : Le nom du script révèle immédiatement son domaine et son action
- **Découvrabilité** : Facile de trouver tous les scripts liés à un domaine (`ls scripts/version-*`)
- **Cohérence** : Tous les scripts suivent le même pattern
- **Documentation naturelle** : Le nom du script est auto-documenté
- **Compatibilité** : Compatible avec les conventions Unix/Linux (lowercase, tirets)
- **Auto-complétion** : Facilite l'auto-complétion dans le shell (`version-<TAB>`)
- **Lisibilité** : Format clair et sans ambiguïté

### Négatives ⚠️

- **Migration nécessaire** : Les scripts existants doivent être renommés
- **Références à mettre à jour** : Makefile, documentation, et autres scripts doivent être mis à jour
- **Verbosité** : Noms potentiellement plus longs que des alternatives (`v-update.sh`)
- **Contrainte** : Certains scripts complexes peuvent ne pas correspondre facilement au format

### Neutres ℹ️

- Les scripts doivent toujours avoir une documentation claire dans leur en-tête
- Le `README.md` dans `/scripts` doit lister tous les scripts disponibles
- Les scripts obsolètes doivent être supprimés ou archivés

## Alternatives Considérées

### 1. Action-Object (`update-version.sh`)
**Rejetée** : Moins intuitif pour regrouper par domaine. L'auto-complétion basée sur l'objet est plus utile.

### 2. CamelCase (`updateVersion.sh`)
**Rejetée** : Non-conforme aux conventions Unix/Linux. Moins lisible en ligne de commande.

### 3. Underscore (`version_update.sh`)
**Rejetée** : Les tirets sont préférés dans l'écosystème Unix/Linux moderne.

### 4. Pas de convention
**Rejetée** : Crée de l'incohérence et de la confusion à long terme.

## Implémentation

### Checklist de Migration

- [ ] Renommer `scripts/update-version.sh` → `scripts/version-update.sh`
- [ ] Mettre à jour les références dans `Makefile`
- [ ] Mettre à jour `scripts/README.md`
- [ ] Mettre à jour la documentation ADR (ce document)
- [ ] Commit avec message : `refactor(scripts): apply ADR-015 naming convention`

### Validation

Un script respecte ADR-015 si :
1. Format : `{object}-{action}.sh`
2. Tout en minuscules
3. Tirets comme séparateurs
4. Extension `.sh`
5. Objet au singulier
6. Action en verbe infinitif

### Commandes de Vérification

```bash
# Lister tous les scripts
ls -1 scripts/*.sh

# Vérifier la conformité (regex)
find scripts -name "*.sh" | grep -vE '^scripts/[a-z][a-z0-9-]*-[a-z][a-z0-9-]*\.sh$'
```

## Références

- [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html#s7-naming-conventions)
- [Bash Style Guide](https://github.com/bahamas10/bash-style-guide)
- ADR-001: Git Workflow et Stratégie de Versioning
- Makefile du projet

## Notes

Cette convention s'applique **uniquement aux scripts bash** (`.sh`). Les autres types de fichiers (JavaScript, Python, etc.) suivent leurs propres conventions de nommage spécifiques à leur langage.

Pour les scripts très spécifiques à un environnement, préfixer avec l'environnement : `local-deploy.sh`, `prod-backup.sh`.
