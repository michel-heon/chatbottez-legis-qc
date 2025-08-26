# Dépannage : Champs Vectoriels Azure Search avec SDK JavaScript

## 🎯 Problème Identifié

**Erreur rencontrée :**
```
The vector field 'contentVector' must have the properties 'dimensions' and 'vectorSearchConfiguration' set.
```

**Contexte :** Lors de la création d'index Azure Search avec des champs vectoriels via le SDK JavaScript `@azure/search-documents`.

## 🔍 Diagnostic : Différences entre API REST et SDK JavaScript

### ❌ Configuration Erronée (API REST format)
```typescript
interface IndexField {
    name: string;
    type: string;
    dimensions?: number;                    // ❌ Incorrect pour SDK JS
    vectorSearchProfile?: string;          // ❌ Incorrect pour SDK JS
    vectorSearchConfiguration?: string;    // ❌ Incorrect pour SDK JS
}

// Usage incorrect :
{
    name: 'contentVector',
    type: 'Collection(Edm.Single)',
    searchable: true,
    dimensions: 1536,                       // ❌ Propriété non reconnue
    vectorSearchProfile: 'default',        // ❌ Propriété non reconnue
}
```

### ✅ Configuration Correcte (SDK JavaScript)
```typescript
interface IndexField {
    name: string;
    type: string;
    vectorSearchDimensions?: number;       // ✅ Correct pour SDK JS
    vectorSearchProfileName?: string;      // ✅ Correct pour SDK JS
}

// Usage correct :
{
    name: 'contentVector',
    type: 'Collection(Edm.Single)',
    searchable: true,
    vectorSearchDimensions: 1536,          // ✅ Propriété SDK
    vectorSearchProfileName: 'default',    // ✅ Propriété SDK
}
```

## 📚 Sources de Vérification

### 1. Documentation Microsoft Officielle
**URL :** [Azure Search Vector Fields - JavaScript SDK](https://learn.microsoft.com/en-us/javascript/api/@azure/search-documents/simplefield)

**Propriétés confirmées :**
- `vectorSearchDimensions?: number`
- `vectorSearchProfileName?: string`

### 2. Vérification dans le Projet
**Fichiers à consulter :** `src/indexers/utils.ts`
```bash
grep -r "vectorSearchDimensions" src/
grep -r "vectorSearchProfileName" src/
```

**Exemples fonctionnels trouvés :**
```typescript
// Dans src/indexers/utils.ts
{
    type: "Collection(Edm.Single)" as const,
    name: "descriptionVector",
    searchable: true,
    vectorSearchDimensions: 1536,
    vectorSearchProfileName: "my-vector-config"
}
```

## 🛠️ Procédure de Résolution

### Étape 1 : Identifier le Problème
```bash
# Vérifier l'erreur dans les logs
make index-create 2>&1 | grep -i "vector\|dimension"
```

### Étape 2 : Vérifier la Documentation
```bash
# Rechercher la documentation Azure Search JavaScript SDK
curl -s "https://learn.microsoft.com/en-us/javascript/api/@azure/search-documents/simplefield" | grep -i vector
```

### Étape 3 : Consulter les Scripts Fonctionnels
```bash
# Chercher les exemples dans le projet
find . -name "*.ts" -o -name "*.js" | xargs grep -l "vectorSearch" | head -5
grep -A5 -B5 "vectorSearchDimensions" src/indexers/utils.ts
```

### Étape 4 : Appliquer la Correction
1. **Modifier l'interface TypeScript :**
```typescript
interface IndexField {
    // ...existing properties...
    vectorSearchDimensions?: number;        // Au lieu de dimensions
    vectorSearchProfileName?: string;       // Au lieu de vectorSearchProfile
}
```

2. **Mettre à jour l'implémentation :**
```typescript
{
    name: 'contentVector',
    type: 'Collection(Edm.Single)',
    searchable: true,
    vectorSearchDimensions: 1536,           // Correction appliquée
    vectorSearchProfileName: 'default',     // Correction appliquée
    description: 'Content embedding vector for semantic search'
}
```

3. **Recompiler et tester :**
```bash
npx tsc
make index-create
```

### Étape 5 : Vérification du Succès
**Indicateurs de succès :**
```
✅ Index created successfully: legis-qc-index-dev-01
📊 Fields: 15
🔍 Suggesters: 1
```

## 🔧 Commandes de Dépannage

### Vérifier la Structure des Indices Existants
```bash
# Lister les indices existants avec leurs configurations vectorielles
curl -X GET "https://search-cotechnoe-ai.search.windows.net/indexes?api-version=2024-07-01" \
  -H "api-key: $SECRET_AZURE_SEARCH_KEY" | jq '.value[] | {name: .name, vectorFields: [.fields[] | select(.type == "Collection(Edm.Single)")]}'
```

### Comparer avec un Index Fonctionnel
```bash
# Examiner un index qui fonctionne
curl -X GET "https://search-cotechnoe-ai.search.windows.net/indexes/ccq-index-01?api-version=2024-07-01" \
  -H "api-key: $SECRET_AZURE_SEARCH_KEY" | jq '.fields[] | select(.name | contains("Vector"))'
```

### Tester la Configuration Vectorielle
```bash
# Créer un index de test minimal
cat > test-vector-config.json << EOF
{
  "name": "test-vector-index",
  "fields": [
    {
      "name": "id",
      "type": "Edm.String",
      "key": true
    },
    {
      "name": "testVector",
      "type": "Collection(Edm.Single)",
      "searchable": true,
      "vectorSearchDimensions": 1536,
      "vectorSearchProfileName": "default"
    }
  ],
  "vectorSearch": {
    "profiles": [{"name": "default", "algorithm": "hnsw-algorithm"}],
    "algorithms": [{"name": "hnsw-algorithm", "kind": "hnsw"}]
  }
}
EOF
```

## 📋 Checklist de Vérification

### Avant Modification
- [ ] Confirmer l'erreur exacte dans les logs
- [ ] Vérifier la version du SDK `@azure/search-documents`
- [ ] Consulter la documentation Microsoft pour la version courante
- [ ] Examiner les exemples fonctionnels dans le projet

### Après Modification
- [ ] Interface TypeScript mise à jour avec les bonnes propriétés
- [ ] Implémentation corrigée dans tous les fichiers concernés
- [ ] Compilation TypeScript réussie (`npx tsc`)
- [ ] Test de création d'index réussi (`make index-create`)
- [ ] Vérification de l'index créé dans Azure Portal

## 🚨 Pièges Courants à Éviter

1. **Mélanger API REST et SDK :** Les noms de propriétés diffèrent entre l'API REST et le SDK JavaScript
2. **Oublier de recompiler :** Toujours exécuter `npx tsc` après modification TypeScript
3. **Profil vectoriel manquant :** S'assurer que le `vectorSearchProfileName` correspond à un profil défini dans `vectorSearch.profiles`
4. **Version de SDK obsolète :** Vérifier la compatibilité avec la version d'Azure Search utilisée

## 📚 Références

- [Azure Search JavaScript SDK Documentation](https://learn.microsoft.com/en-us/javascript/api/@azure/search-documents/)
- [Vector Search Configuration Guide](https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-create-index)
- [SimpleField Interface](https://learn.microsoft.com/en-us/javascript/api/@azure/search-documents/simplefield)

## 📝 Notes de Version

**Dernière mise à jour :** 26 août 2025  
**Version SDK testée :** @azure/search-documents v12.1.0  
**API Version :** 2024-07-01  
**Résolution confirmée sur :** Index `legis-qc-index-dev-01`
