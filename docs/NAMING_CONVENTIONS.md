# Conventions de Nomenclature du Projet

## 📁 Emplacements des fichiers

### Règles simples et obligatoires

1. **📚 Documents de projet (*.md)** → `./docs/`
2. **⚙️ Scripts (*.sh)** → `./scripts/`
3. **📄 Données d'index** → `./src/indexers/data/`
4. **🏠 README.md** → Racine du projet (`./`)

## Scripts Shell

### Règle Obligatoire
Tous les scripts shell doivent suivre la nomenclature : **`<objet>-<action>.sh`**

### Exemples Conformes
- `data-populate.sh` - Script pour peupler les données
- `index-setup.sh` - Script pour configurer un index
- `azure-deploy.sh` - Script pour déployer sur Azure

## Règles Makefile

### Règle Obligatoire
Toutes les règles Makefile doivent suivre la nomenclature : **`<objet>-<action>`**

### Exemples Conformes
- `data-populate` - Règle pour peupler les données
- `index-setup` - Règle pour configurer un index
- `index-delete` - Règle pour supprimer un index

## Validation

### Vérification automatique
```bash
make conventions-validate
```

---
**⚠️ IMPORTANT : Ces conventions sont obligatoires pour maintenir la cohérence du projet.**
