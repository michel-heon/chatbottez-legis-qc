# 📝 Conventions de nommage - Chatbot Legis QC

## 🎯 Règles obligatoires

### Nommage des scripts shell
**Pattern** : `<objet>-<action>.sh`

✅ **Exemples conformes** :
- `index-create.sh` - Créer un index
- `data-populate.sh` - Peupler des données  
- `env-validate.sh` - Valider l'environnement

❌ **Exemples non conformes** :
- `createIndex.sh` - CamelCase non autorisé
- `setup_env.sh` - Underscores non autorisés
- `validate.sh` - Action sans objet

### Nommage des règles Makefile
**Pattern** : `<objet>-<action>`

✅ **Exemples conformes** :
- `index-create` - Créer un index
- `data-populate` - Peupler des données
- `env-validate` - Valider l'environnement

❌ **Exemples non conformes** :
- `createIndex` - CamelCase non autorisé
- `setup_env` - Underscores non autorisés

### Usage des icônes - Règle de parcimonie

**Principe** : Utiliser les icônes uniquement pour mettre en évidence des informations critiques.

✅ **Usage approprié** :
- `❌` Erreurs critiques uniquement
- `✅` Succès d'opérations importantes
- `⚠️` Avertissements de sécurité

❌ **Usage à éviter** :
- Icônes décoratives multiples
- Icônes dans chaque ligne de code
- Plus de 1-2 icônes par section

### Réutilisabilité obligatoire

**Principe** : Concevoir chaque élément pour être réutilisable et modulaire.

✅ **Bonnes pratiques** :
- Fonctions communes dans `scripts/common-functions.sh`
- Configuration externalisée via variables d'environnement
- Règles Make génériques avec support multi-environnement
- Documentation centralisée (une information = un seul endroit)

❌ **Anti-patterns** :
- Code dupliqué dans multiple scripts
- Valeurs hard-codées non configurables
- Documentation dupliquée dans plusieurs fichiers

### Variables d'environnement

**Variables sensibles** : Préfixe `SECRET_` obligatoire
```env
SECRET_AZURE_SEARCH_KEY=xxx
SECRET_AZURE_OPENAI_API_KEY=xxx
```

**Variables de configuration** : Pas de préfixe
```env
AZURE_SEARCH_INDEX_NAME=xxx
AZURE_SEARCH_ENDPOINT=xxx
ENV_CONFIG=playground
```

## 📁 Organisation des fichiers

```bash
docs/                    # Documentation (.md uniquement)
scripts/                 # Scripts shell (.sh uniquement)
src/indexers/data/      # Données d'indexation
env/                    # Fichiers d'environnement
tests/                  # Scripts de test et validation
```

## ✅ Validation des conventions

```bash
# Valider automatiquement les conventions
make conventions-validate

# Diagnostic général incluant les conventions
make diagnostic
```

---

*Ces conventions sont obligatoires pour maintenir la cohérence du projet.*

*Voir aussi : [developer-guide.md](./developer-guide.md) pour plus de détails techniques*

## Validation

### Vérification automatique
```bash
make conventions-validate
```

---
**⚠️ IMPORTANT : Ces conventions sont obligatoires pour maintenir la cohérence du projet.**
