# 🚀 Guide de Référence Rapide - Ontology-Driven Troubleshooting

## 🆘 Diagnostic Immédiat

```bash
# 🔍 Diagnostic complet automatique
make diagnostic

# ⚡ Vérifications rapides
make env-check && make index-status
```

## 🎯 Problèmes Courants & Solutions Express

### ❌ Index Creation Failed: Vector Field Configuration

**Erreur :**
```
The vector field 'contentVector' must have the properties 'dimensions' and 'vectorSearchConfiguration' set
```

**Solution rapide :**
```bash
# Vérifier que le code utilise les bonnes propriétés SDK JavaScript
grep -r "vectorSearchDimensions\|vectorSearchProfileName" src/
```

**Fix :**
- ✅ Utiliser `vectorSearchDimensions: 1536`
- ✅ Utiliser `vectorSearchProfileName: "default"`
- ❌ Éviter `dimensions` et `vectorSearchProfile`

### ❌ Environment Configuration Missing

**Erreur :**
```
Environment file not found: env/.env.playground.user
```

**Solution rapide :**
```bash
make playground-env-setup
$EDITOR env/.env.playground.user  # Configurer les clés
make playground-env-validate
```

### ❌ TTL File Not Found

**Erreur :**
```
TTL file not found: /path/to/ttl
```

**Solution rapide :**
```bash
# Vérifier la configuration
echo $EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE

# Corriger le chemin dans .env
export TTL_METADATA_FILE="extract/rdf/legisquebec-metadata-small.ttl"
```

### ❌ Azure Connectivity Issues

**Erreur :**
```
Azure Search connection failed (HTTP: 401/403)
```

**Solution rapide :**
```bash
# Vérifier les clés
echo $SECRET_AZURE_SEARCH_KEY | wc -c  # Doit être > 10
curl -s "$AZURE_SEARCH_ENDPOINT/indexes?api-version=2024-07-01" -H "api-key: $SECRET_AZURE_SEARCH_KEY"
```

### ❌ TypeScript Compilation Errors

**Erreur :**
```
Property 'dimensions' does not exist on type 'IndexField'
```

**Solution rapide :**
```bash
# Corriger les propriétés dans ttlSchemaAnalyzer.ts
sed -i 's/dimensions/vectorSearchDimensions/g' src/indexers/ttlSchemaAnalyzer.ts
sed -i 's/vectorSearchProfile/vectorSearchProfileName/g' src/indexers/ttlSchemaAnalyzer.ts
npx tsc
```

## 🔧 Commandes de Récupération Rapide

### Recréation Complète
```bash
# 🔄 Reset complet avec diagnostic
make diagnostic
make index-delete && make index-create
make index-status
```

### Validation Schema TTL
```bash
# 🧠 Test isolé du schema TTL
node lib/src/indexers/ttlSchemaAnalyzer.js \
  "$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE" \
  "test-schema.json"
jq '.fields | length' test-schema.json  # Doit retourner 15
```

### Test Vector Configuration
```bash
# ⚡ Vérifier config vectorielle dans schema généré
jq '.fields[] | select(.name == "contentVector")' schema-output.json
# Doit montrer vectorSearchDimensions et vectorSearchProfileName
```

## 📋 Checklist Rapide de Résolution

### Avant Debugging
- [ ] `make diagnostic` → Note les erreurs
- [ ] Vérifier que `env/.env.playground.user` existe
- [ ] Confirmer que `npx tsc` compile sans erreur

### Debugging Vector Fields
- [ ] Propriétés utilisent `vectorSearchDimensions` (pas `dimensions`)
- [ ] Propriétés utilisent `vectorSearchProfileName` (pas `vectorSearchProfile`)
- [ ] Profile name "default" existe dans vectorSearch.profiles
- [ ] Recompilé avec `npx tsc` après modifications

### Post-Fix Validation
- [ ] `make index-create` réussit sans erreur
- [ ] `make index-status` confirme l'index existe
- [ ] Schema généré contient 15 champs
- [ ] Champ `contentVector` correctement configuré

## 🚨 Raccourcis Emergency

### Problème Vector Field - Fix en 2 minutes
```bash
# 1. Corriger les propriétés
sed -i 's/dimensions:/vectorSearchDimensions:/g' src/indexers/ttlSchemaAnalyzer.ts
sed -i 's/vectorSearchProfile:/vectorSearchProfileName:/g' src/indexers/ttlSchemaAnalyzer.ts

# 2. Recompiler et tester
npx tsc && make index-create
```

### Reset Environnement - Fix en 3 minutes
```bash
# 1. Recréer l'environnement
make playground-env-setup

# 2. Configurer (remplacer YOUR_KEYS)
cat > env/.env.playground.user << EOF
SECRET_AZURE_SEARCH_KEY=YOUR_SEARCH_KEY
SECRET_AZURE_OPENAI_API_KEY=YOUR_OPENAI_KEY
AZURE_SEARCH_ENDPOINT=https://search-cotechnoe-ai.search.windows.net
AZURE_OPENAI_ENDPOINT=https://openai-cotechnoe.openai.azure.com/
AZURE_SEARCH_INDEX_NAME=legis-qc-index-dev-01
# ... autres variables
EOF

# 3. Valider
make playground-env-validate
```

## 📚 References Ultra-Rapides

- **Doc Complète :** [troubleshooting-ontology-driven.md](./troubleshooting-ontology-driven.md)
- **Vector Fields :** [troubleshooting-azure-search-vector-fields.md](./troubleshooting-azure-search-vector-fields.md)
- **Architecture :** [ENHANCED_ARCHITECTURE.md](./ENHANCED_ARCHITECTURE.md)

## ⚡ One-Liners Utiles

```bash
# Status système complet
make diagnostic | grep -E "(✅|❌|⚠️)"

# Vérifier schema TTL rapidement
jq '.fields[].name' schema-output.json | grep -E "(content|Vector|id)"

# Test connectivité Azure minimal
curl -s "$AZURE_SEARCH_ENDPOINT?api-version=2024-07-01" -H "api-key: $SECRET_AZURE_SEARCH_KEY" >/dev/null && echo "✅ Azure OK" || echo "❌ Azure Failed"

# Compter indices existants
curl -s "$AZURE_SEARCH_ENDPOINT/indexes?api-version=2024-07-01" -H "api-key: $SECRET_AZURE_SEARCH_KEY" | jq '.value | length'

# Force recompilation et test
npx tsc --build --force && make index-create
```

---
**💡 Conseil :** Toujours commencer par `make diagnostic` - il détecte 90% des problèmes automatiquement !
