# 🔍 Apache Jena Integration Guide

Ce guide détaille l'intégration d'**Apache Jena** dans le projet pour l'extraction robuste des métadonnées ontologiques avec support des tags de langue `@fr`.

## 🎯 Objectif

Le pipeline enhanced utilise **Apache Jena SPARQL** pour résoudre les limitations du parsing regex traditionnel :

- ❌ **Problème initial** : Tags `@fr` non gérés → `legalStatus: null` pour A-3.001
- ✅ **Solution SPARQL** : Extraction native → `legalStatus: "en vigueur"` correct

## 📋 Installation Apache Jena

### Installation automatique (Linux/macOS)

```bash
# Téléchargement et installation
sudo wget https://archive.apache.org/dist/jena/binaries/apache-jena-5.5.0.tar.gz
sudo tar -xzf apache-jena-5.5.0.tar.gz -C /opt/
sudo ln -s /opt/apache-jena-5.5.0 /opt/jena

# Configuration environnement
echo 'export JENA_HOME=/opt/jena' >> ~/.bashrc
echo 'export PATH=$JENA_HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Validation installation

```bash
# Vérifier la version
sparql --version

# Tester avec TTL du projet
sparql --data="/path/to/legisquebec-metadata.ttl" --query="SELECT * WHERE { ?s ?p ?o } LIMIT 10"
```

## 🔧 Architecture Technique

### Pipeline Enhanced

```typescript
// src/indexers/indexPopulatorFromTTL.ts
class IndexPopulatorFromTTL {
    // 1. SPARQL extraction (principal)
    private async extractMetadataWithSPARQL(ttlPath: string)
    
    // 2. Legacy parsing (fallback)
    private parseTTLDocumentsLegacy(ttlPath: string)
    
    // 3. Intelligent sorting (workaround déployé)
    private addTTLMetadata(indexDoc: IndexDocument, doc: DocumentManifest)
}
```

### Requête SPARQL Type

```sparql
PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
PREFIX legal: <http://www.legalruleml.org/ns/>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX schema: <https://schema.org/>

SELECT ?legalIdentifier ?title ?status ?abrogatedBy ?downloadStatus
WHERE {
    ?doc a legal:LegalRule ;
         dcterms:identifier ?legalIdentifier .
    
    # Support natif des tags @fr
    OPTIONAL { ?doc dcterms:title ?title }
    OPTIONAL { ?doc legis:status ?status }
    OPTIONAL { 
        ?doc legis:abrogatedBy ?abrogatedByURI .
        BIND(REPLACE(STR(?abrogatedByURI), ".*ontology/loi/", "") AS ?abrogatedBy)
    }
    OPTIONAL { ?doc legis:downloadStatus ?downloadStatus }
}
ORDER BY ?legalIdentifier
```

## 🧪 Tests et Validation

### Test SPARQL Direct

```bash
# Test extraction A-3 vs A-3.001
cd /media/psf/Developpement/00-GIT/legis-qc
node tests/test-sparql-direct.js
```

**Résultat attendu :**
```
✅ A-3.001 found: status="en vigueur"
✅ A-3 found: status="abrogée" 
🎉 SPARQL EXTRACTION SUCCESSFUL!
```

### Test Pipeline Enhanced

```bash
# Test pipeline complet
node tests/test-enhanced-pipeline.js
```

### Validation Déploiement

```bash
# Après re-indexation
node tests/validate-deployment.js
```

## 🚀 Déploiement Production

### 1. Compilation TypeScript

```bash
cd /media/psf/Developpement/00-GIT/legis-qc
npm run build
```

### 2. Re-indexation avec SPARQL

```bash
# Mode full pour corriger les métadonnées
node lib/indexers/setup.js --mode=full
```

### 3. Validation des résultats

**Vérifications critiques :**
- A-3.001 : `legalStatus: "en vigueur"` ✅
- A-3 : `legalStatus: "abrogée"` ✅
- Position intelligente : A-3.001 (12) > A-3 (13) ✅

## 📊 Avantages SPARQL vs Regex

| Aspect | Regex Parsing | SPARQL + Jena |
|--------|---------------|----------------|
| **Tags @fr** | ❌ Non supporté | ✅ Support natif |
| **Robustesse** | ❌ Fragile | ✅ Standard W3C |
| **Performance** | ✅ Rapide | ✅ Optimisé |
| **Maintenance** | ❌ Complexe | ✅ Déclaratif |
| **Évolutivité** | ❌ Limitée | ✅ Extensible |

## 🔍 Dépannage

### Erreur "command not found: sparql"

```bash
# Vérifier installation
ls -la /opt/jena/bin/sparql
echo $JENA_HOME
echo $PATH | grep jena
```

### Erreur parsing TTL

```bash
# Validation syntaxe TTL
riot --validate /path/to/legisquebec-metadata.ttl
```

### SPARQL timeout

```bash
# Réduire la taille de requête
# Utiliser LIMIT dans les requêtes de test
SELECT * WHERE { ?s ?p ?o } LIMIT 100
```

## 📚 Ressources

- [Apache Jena Documentation](https://jena.apache.org/documentation/)
- [SPARQL 1.1 Specification](https://www.w3.org/TR/sparql11-query/)
- [TTL Syntax Reference](https://www.w3.org/TR/turtle/)
- [RDF Primer](https://www.w3.org/TR/rdf11-primer/)

## 🎯 Statut Projet

- ✅ **SPARQL Integration** : Complète et validée
- ✅ **Pipeline Enhanced** : Déployé avec fallback
- ✅ **Intelligent Sorting** : Solution de production active
- 🚀 **Production Ready** : Métadonnées correctes garanties
