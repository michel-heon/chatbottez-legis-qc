# Architecture Améliorée - Pilotée par TTL

## 🎯 Principe Central
**Tout est défini par les métadonnées TTL** : structure d'index, fichiers à charger, mapping des champs.

## 📋 Phases de Traitement

### Phase 1: Analyse TTL
- **Script**: `ttl-schema-analyze.sh`
- **But**: Analyser le TTL pour extraire la structure d'index requise
- **Sortie**: Configuration JSON de l'index

### Phase 2: Création Index
- **Script**: `index-create-from-ttl.sh`
- **But**: Créer l'index Azure Search basé sur la structure TTL
- **Entrée**: Configuration JSON de l'index

### Phase 3: Découverte Fichiers
- **Script**: `ttl-files-discover.sh`
- **But**: Lister tous les fichiers à traiter selon les métadonnées TTL
- **Sortie**: Liste des fichiers avec leurs métadonnées

### Phase 4: Traitement Contenu
- **Script**: `content-process-batch.sh`
- **But**: Traiter les PDF et extraire le contenu
- **Parallélisation**: Support du traitement par lot

### Phase 5: Population Index
- **Script**: `index-populate-from-ttl.sh`
- **But**: Peupler l'index avec contenu + métadonnées
- **Mode**: Incremental ou full

## 🔧 Scripts Principaux

```bash
# Workflow complet
make enhanced-setup-v2 ENV_CONFIG=playground

# Phases individuelles
make ttl-analyze ENV_CONFIG=playground
make index-create-ttl ENV_CONFIG=playground
make files-discover ENV_CONFIG=playground
make content-process ENV_CONFIG=playground
make index-populate ENV_CONFIG=playground
```

## 📁 Structure des Données

```
src/indexers/
├── ttl/
│   ├── metadata.ttl          # Source de vérité
│   ├── schema.json           # Schema extrait du TTL
│   └── files-manifest.json   # Liste des fichiers découverts
├── data/
│   ├── pdf/                  # Fichiers PDF
│   ├── processed/            # Contenu traité
│   └── embeddings/           # Vecteurs pré-calculés
└── config/
    ├── index-config.json     # Configuration d'index
    └── processing-config.json # Configuration de traitement
```

## 🎛️ Configuration Pilotée par TTL

Le fichier TTL définit :
1. **Structure d'index** : Champs, types, analyseurs
2. **Mapping fichiers** : Quels PDFs charger
3. **Règles de traitement** : Comment traiter chaque type de document
4. **Métadonnées** : Enrichissement automatique

## 🔄 Workflow de Développement

1. **Modifier TTL** → Schema et fichiers updated
2. **Exécuter analyse** → Nouvelle structure détectée
3. **Recréer index** → Schema mis à jour
4. **Retraiter contenu** → Seulement les fichiers modifiés
5. **Repeupler** → Population incrémentale
