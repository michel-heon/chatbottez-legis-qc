# 📦 Archive des anciens documents

## 🗂️ Fichiers archivés (2025-08-28)

Les fichiers suivants ont été déplacés vers `archive-old-docs/` lors du nettoyage de documentation v1.7.0.

### Raisons de l'archivage

- **Doublons** : Contenu dupliqué dans d'autres fichiers
- **Obsolète** : Informations dépassées ou non maintenues
- **Redondance** : Sujets traités dans la nouvelle structure

### Liste des fichiers archivés

| Fichier | Raison | Remplacé par |
|---------|--------|--------------|
| `ARCHITECTURE_IMPROVEMENTS.md` | Informations techniques dépassées | `developer-guide.md` |
| `DEVELOPMENT_GUIDE.md` | Guide développeur obsolète | `developer-guide.md` |
| `documentation-index.md` | Doublon exact de README.md | `README.md` |
| `ENHANCED_ARCHITECTURE.md` | Architecture dépassée | `developer-guide.md` |
| `ENHANCED_SETUP_SUMMARY.md` | Guide setup obsolète | `getting-started.md` |
| `environment-alignment-summary.md` | Informations de config dépassées | `configuration.md` |
| `index-naming-summary.md` | Conventions dépassées | `NAMING_CONVENTIONS.md` |
| `index-population-analysis-improvements.md` | Analyse technique obsolète | `troubleshooting.md` |
| `MAKEFILE_SIMPLIFICATION.md` | Documentation make obsolète | `make-commands.md` |
| `PROJECT_SUMMARY.md` | Résumé projet dépassé | `README.md` |
| `quick-troubleshooting-reference.md` | Guide dépannage obsolète | `troubleshooting.md` |
| `REFERENCE_RAPIDE.md` | Référence rapide dépassée | `make-commands.md` |
| `SCRIPT_RENAMING_SUMMARY.md` | Historique de renommage | `NAMING_CONVENTIONS.md` |
| `setup-guide.md` | Guide setup obsolète | `getting-started.md` |
| `validation-index-report.md` | Rapport technique ponctuel | `troubleshooting.md` |

## 🔄 Migration vers nouvelle structure

### Ancienne structure (23 fichiers)
- Beaucoup de doublons
- Standards de nommage incohérents  
- Informations obsolètes
- Redondance excessive

### Nouvelle structure (10 fichiers)
```
docs/
├── README.md                    # Index principal
├── getting-started.md           # Guide démarrage
├── configuration.md             # Variables et config
├── make-commands.md            # Référence commandes
├── troubleshooting.md          # Dépannage
├── developer-guide.md          # Conventions et architecture
├── NAMING_CONVENTIONS.md       # Conventions projet
├── apache-jena-integration.md  # Guide SPARQL/RDF (spécialisé)
├── azure-search-management.md  # Guide Azure (spécialisé)
├── playground-guide.md         # Guide M365 (spécialisé)
├── scripts-reference.md        # Référence scripts (spécialisé)
├── troubleshooting-ontology-driven.md  # Dépannage ontology (spécialisé)
└── troubleshooting-azure-search-vector-fields.md  # Dépannage vectors (spécialisé)
```

## 📚 Guides de migration

### Pour les développeurs
- **Ancien** : `DEVELOPMENT_GUIDE.md` → **Nouveau** : `developer-guide.md`
- **Ancien** : `REFERENCE_RAPIDE.md` → **Nouveau** : `make-commands.md`

### Pour les utilisateurs  
- **Ancien** : `setup-guide.md` → **Nouveau** : `getting-started.md`
- **Ancien** : `quick-troubleshooting-reference.md` → **Nouveau** : `troubleshooting.md`

### Pour la configuration
- **Ancien** : `environment-alignment-summary.md` → **Nouveau** : `configuration.md`

## 🔍 Recherche dans les archives

Si vous cherchez une information spécifique qui était dans un ancien fichier :

```bash
# Rechercher dans les archives
grep -r "terme_recherché" docs/archive-old-docs/

# Lister le contenu des archives
ls -la docs/archive-old-docs/
```

---

*Les fichiers archivés restent disponibles pour référence historique mais ne sont plus maintenus.*
