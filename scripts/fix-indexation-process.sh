#!/bin/bash

# scripts/fix-indexation-process.sh
# Correction du processus d'indexation pour traiter correctement les statuts manquants
# Problème : C-24.2 n'a pas de statut explicite dans TTL (correct) mais le parser l'interprète mal

# Chargement des fonctions communes
source "$(dirname "$0")/load-env.sh"

echo "🔧 Correction du processus d'indexation - Statuts par défaut"
echo "============================================================"

# Fonction pour créer une sauvegarde du fichier original
backup_original_file() {
    local file_path="$1"
    local backup_path="${file_path}.backup-$(date +%Y%m%d-%H%M%S)"
    
    if [[ -f "$file_path" ]]; then
        cp "$file_path" "$backup_path"
        echo "✅ Sauvegarde créée: $backup_path"
    else
        echo "❌ Fichier non trouvé: $file_path"
        return 1
    fi
}

# Fonction pour corriger le parser TTL
fix_ttl_parser() {
    local parser_file="src/indexers/ttlParser.ts"
    
    echo ""
    echo "🔧 Correction du parser TTL..."
    
    if [[ ! -f "$parser_file" ]]; then
        echo "❌ Fichier parser non trouvé: $parser_file"
        return 1
    fi
    
    # Créer une sauvegarde
    backup_original_file "$parser_file"
    
    # Vérifier si la correction est déjà appliquée
    if grep -q "Default status for documents without explicit status" "$parser_file"; then
        echo "✅ Correction déjà appliquée dans $parser_file"
        return 0
    fi
    
    echo "📝 Application de la correction dans $parser_file..."
    
    # Créer un fichier temporaire avec la correction
    cat > /tmp/ttl_parser_fix.patch << 'EOF'
            // Get status
            const statuses = this.store.getObjects(documentNode, namedNode('https://legisquebec.gouv.qc.ca/ontology/status'), null);
            if (statuses.length > 0) {
                metadata.status = statuses[0].value;
                metadata.statusLang = (statuses[0] as any).language || 'fr';
            } else {
                // Default status for documents without explicit status
                // In Quebec law, absence of status mention means "en vigueur" (in force)
                metadata.status = 'en vigueur';
                metadata.statusLang = 'fr';
                console.log(`📋 Document ${metadata.legalIdentifier || metadata.uri} - statut par défaut: 'en vigueur'`);
            }
EOF
    
    # Appliquer la correction en remplaçant la section problématique
    sed -i.bak '/\/\/ Get status/,/}/c\
            // Get status\
            const statuses = this.store.getObjects(documentNode, namedNode('\''https://legisquebec.gouv.qc.ca/ontology/status'\''), null);\
            if (statuses.length > 0) {\
                metadata.status = statuses[0].value;\
                metadata.statusLang = (statuses[0] as any).language || '\''fr'\'';\
            } else {\
                // Default status for documents without explicit status\
                // In Quebec law, absence of status mention means "en vigueur" (in force)\
                metadata.status = '\''en vigueur'\'';\
                metadata.statusLang = '\''fr'\'';\
                console.log(`📋 Document ${metadata.legalIdentifier || metadata.uri} - statut par défaut: '\''en vigueur'\''`);\
            }' "$parser_file"
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Correction appliquée avec succès"
        rm -f "${parser_file}.bak"
    else
        echo "❌ Erreur lors de l'application de la correction"
        return 1
    fi
}

# Fonction pour reconstruire le projet
rebuild_project() {
    echo ""
    echo "🔨 Reconstruction du projet..."
    
    # Nettoyer les anciens builds
    echo "🧹 Nettoyage des builds précédents..."
    rm -rf lib/src/indexers/ttlParser.js lib/src/indexers/ttlParser.d.ts lib/src/indexers/ttlParser.js.map 2>/dev/null || true
    
    # Recompiler
    echo "⚙️ Compilation TypeScript..."
    if npm run build; then
        echo "✅ Compilation réussie"
    else
        echo "❌ Erreur de compilation"
        return 1
    fi
}

# Fonction pour tester la correction
test_fix() {
    echo ""
    echo "🧪 Test de la correction..."
    
    # Créer un petit test pour vérifier que C-24.2 a maintenant le bon statut
    cat > /tmp/test-c242-status.js << 'EOF'
const { TTLMetadataParser } = require('./lib/src/indexers/ttlParser.js');

async function testC242Status() {
    try {
        console.log('🔍 Test du statut C-24.2 après correction...');
        
        const parser = new TTLMetadataParser();
        await parser.loadTTL();
        
        const doc = await parser.getDocumentByIdentifier('C-24.2');
        
        if (doc) {
            console.log(`📋 C-24.2 trouvé:`);
            console.log(`   Identifiant: ${doc.legalIdentifier}`);
            console.log(`   Titre: ${doc.title}`);
            console.log(`   Statut: ${doc.status}`);
            console.log(`   Langue du statut: ${doc.statusLang}`);
            
            if (doc.status === 'en vigueur') {
                console.log('✅ SUCCESS: C-24.2 a maintenant le statut correct "en vigueur"');
                return true;
            } else {
                console.log(`❌ FAIL: C-24.2 a toujours le statut incorrect "${doc.status}"`);
                return false;
            }
        } else {
            console.log('❌ FAIL: C-24.2 non trouvé');
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
        return false;
    }
}

testC242Status().then(success => {
    process.exit(success ? 0 : 1);
});
EOF
    
    if node /tmp/test-c242-status.js; then
        echo "✅ Test réussi - La correction fonctionne"
        rm -f /tmp/test-c242-status.js
        return 0
    else
        echo "❌ Test échoué"
        rm -f /tmp/test-c242-status.js
        return 1
    fi
}

# Fonction principale
main() {
    echo "🎯 Analyse du problème:"
    echo "   • C-24.2 n'a PAS de statut explicite dans l'ontologie TTL (correct)"
    echo "   • Le parser ne définit pas de statut par défaut"
    echo "   • En droit québécois: absence de mention = 'en vigueur'"
    echo ""
    
    read -p "Appliquer la correction au processus d'indexation? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Correction annulée"
        exit 0
    fi
    
    # Appliquer les corrections
    if fix_ttl_parser; then
        echo ""
        echo "🔄 Reconstruction nécessaire..."
        
        if rebuild_project; then
            echo ""
            echo "🧪 Test de la correction..."
            
            if test_fix; then
                echo ""
                echo "🎉 SUCCÈS: Correction du processus d'indexation terminée!"
                echo ""
                echo "📋 Prochaines étapes:"
                echo "   1. make fix-c242-status        # Corriger l'index Azure Search"
                echo "   2. make index-test              # Tester la recherche"
                echo "   3. Tester une question sur la conduite en état d'ébriété"
                echo ""
                echo "💡 Pour éviter le problème à l'avenir:"
                echo "   • La correction sera maintenant appliquée automatiquement"
                echo "   • Tous les documents sans statut explicite seront 'en vigueur'"
            else
                echo "❌ La correction a échoué au test"
                return 1
            fi
        else
            echo "❌ Échec de la reconstruction"
            return 1
        fi
    else
        echo "❌ Échec de la correction du parser"
        return 1
    fi
}

main "$@"
