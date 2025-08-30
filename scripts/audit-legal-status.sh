#!/bin/bash
# Audit des statuts législatifs - Identifier les erreurs d'enrichissement IA
# Usage: ./audit-legal-status.sh [ENV_CONFIG]

set -e

# Load environment
ENV_CONFIG=${1:-${ENV_CONFIG:-playground}}
source "$(dirname "$0")/env-check.sh"

echo "📊 Audit des Statuts Législatifs - Base Complète"
echo "================================================"
echo "📋 Environment: $ENV_CONFIG"

# Créer un répertoire temporaire pour l'audit
AUDIT_DIR="audit-results"
mkdir -p "$AUDIT_DIR"

echo ""
echo "🔍 Phase 1: Analyse des métadonnées enrichies par IA..."

# Utiliser le TTL complet au lieu du petit fichier de test
TTL_FILE="${EXTERNAL_DATA_SOURCE_PATH}/extract/rdf/legisquebec-metadata.ttl"
if [ ! -f "$TTL_FILE" ]; then
    echo "⚠️  TTL complet non trouvé, utilisation du fichier test..."
    TTL_FILE="${EXTERNAL_DATA_SOURCE_PATH}/extract/rdf/legisquebec-metadata-small.ttl"
fi

echo "📁 Analyse du fichier TTL: $TTL_FILE"

# Créer un manifest temporaire avec tous les documents
echo "📋 Génération du manifest complet..."
TEMP_MANIFEST="$AUDIT_DIR/full-manifest.json"
node lib/src/indexers/ttlFilesDiscovery.js \
    "$TTL_FILE" \
    "$TEMP_MANIFEST" \
    "$EXTERNAL_DATA_SOURCE_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Manifest complet généré: $TEMP_MANIFEST"
    
    # Analyser les métadonnées avec un script Node.js
    echo ""
    echo "📊 Analyse des statuts..."
    
    node -e "
        const manifest = require('./$TEMP_MANIFEST');
        const docs = manifest.documents;
        
        console.log('📊 Statistiques générales:');
        console.log('  Total documents:', docs.length);
        
        // Analyser les méthodes d'enrichissement
        const enrichmentMethods = {};
        const statusByMethod = {};
        const suspiciousPatterns = [];
        
        docs.forEach(doc => {
            const method = doc.metadata.enrichmentMethod || 'unknown';
            enrichmentMethods[method] = (enrichmentMethods[method] || 0) + 1;
            
            if (!statusByMethod[method]) statusByMethod[method] = {};
            const status = doc.metadata.status || 'unknown';
            statusByMethod[method][status] = (statusByMethod[method][status] || 0) + 1;
            
            // Détecter les patterns suspects
            if (method === 'Azure OpenAI LLM Analysis' && status === 'abrogée' && doc.metadata.abrogatedBy) {
                const abrogatedBy = doc.metadata.abrogatedBy.toString();
                if (abrogatedBy.match(/\\\d+,\\\s*c\\\.\\\s*\\\d+|a\\\.\\\s*\\\d+|\\\d+,\\\s*\\\d+/)) {
                    suspiciousPatterns.push({
                        id: doc.legalIdentifier,
                        title: doc.title,
                        abrogatedBy: abrogatedBy,
                        enrichedAt: doc.metadata.enrichedAt
                    });
                }
            }
        });
        
        console.log('');
        console.log('📋 Méthodes d\\'enrichissement:');
        Object.entries(enrichmentMethods).forEach(([method, count]) => {
            console.log('  ' + method + ':', count);
        });
        
        console.log('');
        console.log('📊 Statuts par méthode d\\'enrichissement:');
        Object.entries(statusByMethod).forEach(([method, statuses]) => {
            console.log('  ' + method + ':');
            Object.entries(statuses).forEach(([status, count]) => {
                console.log('    ' + status + ':', count);
            });
        });
        
        console.log('');
        console.log('⚠️  Documents suspects (probablement mal enrichis):');
        console.log('  Total:', suspiciousPatterns.length);
        
        if (suspiciousPatterns.length > 0) {
            console.log('');
            console.log('🔍 Exemples de documents suspects:');
            suspiciousPatterns.slice(0, 10).forEach(doc => {
                console.log('  ' + doc.id + ' - ' + doc.title.substring(0, 50) + '...');
                console.log('    ❌ Référence suspecte:', doc.abrogatedBy);
            });
        }
        
        // Sauvegarder la liste complète des documents suspects
        require('fs').writeFileSync('$AUDIT_DIR/suspicious-documents.json', 
            JSON.stringify(suspiciousPatterns, null, 2));
        
        console.log('');
        console.log('📄 Liste complète sauvegardée: $AUDIT_DIR/suspicious-documents.json');
    "
    
else
    echo "❌ Échec de génération du manifest"
    exit 1
fi

echo ""
echo "🎯 Recommandations basées sur l'audit:"
echo "1. Correction automatique avec pattern matching (actuelle)"
echo "2. Validation manuelle des cas ambigus"
echo "3. Mise à jour par lots des documents corrects"
echo "4. Monitoring continu des nouveaux enrichissements"

echo ""
echo "📂 Fichiers générés:"
echo "  • $TEMP_MANIFEST - Manifest complet"
echo "  • $AUDIT_DIR/suspicious-documents.json - Documents suspects"
