/**
 * Script d'analyse des warnings d'indexation
 * 
 * Objectif : Analyser les warnings.log et corréler avec l'état de l'index
 * pour identifier les documents avec échecs d'embeddings
 */

require('dotenv').config({ path: 'env/.env.playground.user' });
const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');
const fs = require('fs');
const path = require('path');

// Configuration Azure Search
const searchClient = new SearchClient(
    process.env.AZURE_SEARCH_ENDPOINT,
    process.env.AZURE_SEARCH_INDEX_NAME || 'legis-qc-index-full-01',
    new AzureKeyCredential(process.env.SECRET_AZURE_SEARCH_KEY)
);

/**
 * Lire et analyser le fichier warnings.log
 */
function parseWarningsFile() {
    const warningsPath = path.join(
        process.env.EXTERNAL_DATA_SOURCE_PATH, 
        'transform', 
        'processed', 
        'warnings.log'
    );
    
    console.log(`📁 Lecture du fichier: ${warningsPath}`);
    
    if (!fs.existsSync(warningsPath)) {
        console.log('❌ Fichier warnings.log introuvable');
        return [];
    }
    
    const content = fs.readFileSync(warningsPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const warnings = [];
    for (const line of lines) {
        // Pattern: ⚠️  A-14: 1 chunk embeddings failed
        const chunkMatch = line.match(/⚠️\s+(.+?):\s+(\d+)\s+chunk embeddings failed/);
        if (chunkMatch) {
            warnings.push({
                type: 'chunk_embedding_failed',
                docId: chunkMatch[1],
                failedChunks: parseInt(chunkMatch[2]),
                originalLine: line
            });
            continue;
        }
        
        // Pattern: ⚠️  A-2.1: Content embedding failed - Failed to generate embeddings...
        const contentMatch = line.match(/⚠️\s+(.+?):\s+Content embedding failed\s+-\s+(.+)/);
        if (contentMatch) {
            warnings.push({
                type: 'content_embedding_failed',
                docId: contentMatch[1],
                error: contentMatch[2],
                originalLine: line
            });
            continue;
        }
        
        // Autres patterns de warnings
        if (line.includes('⚠️')) {
            warnings.push({
                type: 'other_warning',
                originalLine: line
            });
        }
    }
    
    return warnings;
}

/**
 * Analyser les warnings et corréler avec l'index
 */
async function analyzeWarningsWithIndex() {
    console.log('🔍 Analyse des warnings d\'indexation...');
    console.log('=====================================');

    try {
        // 1. Charger les warnings
        const warnings = parseWarningsFile();
        console.log(`\n📋 Warnings trouvés: ${warnings.length}`);
        
        if (warnings.length === 0) {
            console.log('✅ Aucun warning trouvé dans le fichier');
            return;
        }
        
        // 2. Afficher les warnings par type
        const warningsByType = warnings.reduce((acc, w) => {
            acc[w.type] = (acc[w.type] || 0) + 1;
            return acc;
        }, {});
        
        console.log('\n📊 Répartition des warnings:');
        Object.entries(warningsByType).forEach(([type, count]) => {
            console.log(`   ${type}: ${count} warning(s)`);
        });
        
        // 3. Analyser chaque document mentionné dans les warnings
        console.log('\n📋 Analyse de l\'état des documents problématiques:');
        
        const problematicDocs = warnings
            .filter(w => w.docId)
            .map(w => ({ docId: w.docId, warning: w }));
        
        for (const { docId, warning } of problematicDocs) {
            console.log(`\n🔍 Analyse de ${docId}:`);
            console.log(`   Warning: ${warning.originalLine}`);
            
            try {
                // Rechercher le document dans l'index
                const results = await searchClient.search('*', {
                    filter: `legalIdentifier eq '${docId}'`,
                    select: ['legalIdentifier', 'title', 'description', 'content'],
                    top: 1
                });
                
                let found = false;
                for await (const result of results.results) {
                    found = true;
                    const doc = result.document;
                    
                    console.log(`   ✅ Trouvé dans l'index:`);
                    console.log(`      Titre: ${doc.title}`);
                    console.log(`      Description: ${doc.description?.length || 0} caractères`);
                    console.log(`      Contenu: ${doc.content?.length || 0} caractères`);
                    
                    // Analyser la qualité du contenu indexé
                    if (!doc.description || doc.description.length < 50) {
                        console.log(`      ⚠️  Description très courte - embedding probablement échoué`);
                    }
                    
                    if (!doc.content || doc.content.length < 100) {
                        console.log(`      ⚠️  Contenu très court - données incomplètes`);
                    }
                    
                    // Vérifier si c'est la loi sur l'accès
                    if (doc.title?.toLowerCase().includes('accès') && 
                        doc.title?.toLowerCase().includes('documents')) {
                        console.log(`      🎯 IDENTIFICATION: Loi sur l'accès aux documents!`);
                        if (docId === 'A-2.1') {
                            console.log(`      💡 A-2.1 pourrait être le A-3 recherché`);
                        }
                    }
                }
                
                if (!found) {
                    console.log(`   ❌ Document absent de l'index`);
                    console.log(`      💡 Le document a probablement été complètement rejeté`);
                }
                
            } catch (error) {
                console.log(`   ❌ Erreur de recherche: ${error.message}`);
            }
        }
        
        // 4. Rechercher la loi sur l'accès par titre
        console.log('\n📋 Recherche spécifique "Loi sur l\'accès aux documents":');
        const accessResults = await searchClient.search('loi accès documents', {
            searchFields: ['title'],
            select: ['legalIdentifier', 'title', 'description'],
            top: 5
        });
        
        let accessDocsFound = 0;
        for await (const result of accessResults.results) {
            const doc = result.document;
            console.log(`   📄 ${doc.legalIdentifier}: ${doc.title}`);
            accessDocsFound++;
            
            // Vérifier si c'est un des documents problématiques
            const hasWarning = warnings.some(w => w.docId === doc.legalIdentifier);
            if (hasWarning) {
                console.log(`      ⚠️  Ce document a des warnings d'embedding`);
            }
        }
        
        console.log(`\n🎯 RAPPORT DE CORRÉLATION WARNINGS ↔ INDEX:`);
        console.log('===========================================');
        console.log(`📊 ${warnings.length} warnings analysés`);
        console.log(`📄 ${problematicDocs.length} documents problématiques identifiés`);
        console.log(`🔍 ${accessDocsFound} documents "loi accès" trouvés dans l'index`);
        
        // Recommandations basées sur l'analyse
        console.log('\n💡 RECOMMANDATIONS:');
        console.log('==================');
        
        const chunkFailures = warnings.filter(w => w.type === 'chunk_embedding_failed');
        const contentFailures = warnings.filter(w => w.type === 'content_embedding_failed');
        
        if (chunkFailures.length > 0) {
            console.log(`1. 🔄 ${chunkFailures.length} documents avec échecs de chunks partiels`);
            console.log('   → Réindexer avec une meilleure gestion des chunks');
        }
        
        if (contentFailures.length > 0) {
            console.log(`2. 🚨 ${contentFailures.length} documents avec échecs d'embedding complets`);
            console.log('   → Vérifier la longueur/format du contenu');
            console.log('   → Réessayer avec des chunks plus petits');
        }
        
        if (accessDocsFound === 0) {
            console.log('3. ❌ Aucune "Loi sur l\'accès" trouvée par recherche textuelle');
            console.log('   → Problème potentiel avec l\'indexation du titre/contenu');
        } else {
            console.log(`3. ✅ ${accessDocsFound} documents "loi accès" indexés`);
            console.log('   → Vérifier si A-2.1 correspond à A-3 attendu');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse:', error.message);
        process.exit(1);
    }
}

// Exécution
if (require.main === module) {
    analyzeWarningsWithIndex()
        .then(() => {
            console.log('\n✅ Analyse des warnings terminée.');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = { analyzeWarningsWithIndex };
