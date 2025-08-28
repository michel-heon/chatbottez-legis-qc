#!/usr/bin/env node

/**
 * Script pour investiguer les documents A-3 et A-3.001 manquants
 * Recherche avancée pour localiser ces documents critiques
 */

const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');
require('dotenv').config({ path: 'env/.env.local.user' });

const searchClient = new SearchClient(
    process.env.AZURE_SEARCH_ENDPOINT,
    process.env.AZURE_SEARCH_INDEX_NAME || 'legis-qc-index-full-01',
    new AzureKeyCredential(process.env.SECRET_AZURE_SEARCH_KEY)
);

async function investigateMissingCriticalDocs() {
    console.log('🔍 Investigation documents critiques A-3 et A-3.001 manquants...');
    console.log('===================================================================\n');

    try {
        // 1. Recherche exacte par ID
        console.log('📋 1. Recherche exacte par ID:');
        const exactSearch = await searchClient.search('id:(A-3 OR A-3.001)', {
            select: ['id', 'title', 'legalStatus', 'legalIdentifier'],
            top: 10
        });

        let exactResults = [];
        for await (const result of exactSearch.results) {
            exactResults.push(result.document);
        }
        
        console.log(`   Résultats: ${exactResults.length} documents trouvés`);
        exactResults.forEach(doc => {
            console.log(`   ✅ ${doc.id}: "${doc.title}" (statut: ${doc.legalStatus})`);
        });

        // 2. Recherche par legalIdentifier
        console.log('\n📋 2. Recherche par legalIdentifier:');
        const legalIdSearch = await searchClient.search('legalIdentifier:(A-3 OR A-3.001)', {
            select: ['id', 'title', 'legalStatus', 'legalIdentifier'],
            top: 10
        });

        let legalIdResults = [];
        for await (const result of legalIdSearch.results) {
            legalIdResults.push(result.document);
        }
        
        console.log(`   Résultats: ${legalIdResults.length} documents trouvés`);
        legalIdResults.forEach(doc => {
            console.log(`   ✅ ${doc.id}: "${doc.title}" (legalId: ${doc.legalIdentifier})`);
        });

        // 3. Recherche fuzzy dans les titres
        console.log('\n📋 3. Recherche fuzzy dans les titres (Loi sur l\'accès):');
        const titleSearch = await searchClient.search('title:"accès" AND title:"information"', {
            select: ['id', 'title', 'legalStatus', 'legalIdentifier'],
            top: 20
        });

        let titleResults = [];
        for await (const result of titleSearch.results) {
            titleResults.push(result.document);
        }
        
        console.log(`   Résultats: ${titleResults.length} documents trouvés`);
        titleResults.slice(0, 5).forEach(doc => {
            console.log(`   📄 ${doc.id}: "${doc.title}"`);
            console.log(`      - Legal ID: ${doc.legalIdentifier}`);
            console.log(`      - Statut: ${doc.legalStatus}`);
        });

        // 4. Recherche par variations d'ID
        console.log('\n📋 4. Recherche variations ID (A3, A-03, etc.):');
        const variationSearch = await searchClient.search('id:(A3 OR A-03 OR A-3.* OR A-0003 OR LAI)', {
            select: ['id', 'title', 'legalStatus', 'legalIdentifier'],
            top: 20
        });

        let variationResults = [];
        for await (const result of variationSearch.results) {
            variationResults.push(result.document);
        }
        
        console.log(`   Résultats: ${variationResults.length} documents trouvés`);
        variationResults.forEach(doc => {
            console.log(`   📄 ${doc.id}: "${doc.title}"`);
        });

        // 5. Recherche documents avec "A-3" dans le contenu
        console.log('\n📋 5. Recherche "A-3" dans le contenu:');
        const contentSearch = await searchClient.search('content:"A-3"', {
            select: ['id', 'title', 'legalIdentifier'],
            top: 10
        });

        let contentResults = [];
        for await (const result of contentSearch.results) {
            contentResults.push(result.document);
        }
        
        console.log(`   Résultats: ${contentResults.length} documents mentionnent A-3`);
        contentResults.forEach(doc => {
            console.log(`   📄 ${doc.id}: "${doc.title}"`);
        });

        // 6. Analyse des IDs commençant par A-
        console.log('\n📋 6. Analyse des IDs commençant par "A-":');
        const aIdsSearch = await searchClient.search('id:A-*', {
            select: ['id', 'title'],
            top: 50
        });

        let aIds = [];
        for await (const result of aIdsSearch.results) {
            aIds.push(result.document.id);
        }
        
        aIds.sort();
        console.log(`   Total documents A-*: ${aIds.length}`);
        console.log(`   Échantillon: ${aIds.slice(0, 10).join(', ')}`);
        
        // Rechercher des patterns proches
        const closeToA3 = aIds.filter(id => id.includes('A-3') || id.startsWith('A-3'));
        console.log(`   IDs contenant "A-3": ${closeToA3.join(', ')}`);

        // RÉSUMÉ
        console.log('\n🎯 RÉSUMÉ DE L\'INVESTIGATION:');
        console.log('===============================');
        
        if (exactResults.length > 0) {
            console.log('✅ Documents trouvés par recherche exacte ID');
        } else if (legalIdResults.length > 0) {
            console.log('⚠️ Documents trouvés par legalIdentifier mais pas par ID');
        } else if (titleResults.length > 0) {
            console.log('🔍 Documents similaires trouvés par titre (Loi sur l\'accès)');
        } else {
            console.log('❌ DOCUMENTS A-3 et A-3.001 TOTALEMENT ABSENTS DE L\'INDEX');
            console.log('   Causes possibles:');
            console.log('   • Documents non inclus dans les données TTL source');
            console.log('   • Erreur lors de l\'indexation TTL');
            console.log('   • IDs transformés lors du processus SPARQL');
            console.log('   • Documents dans un autre format/structure');
        }

        return {
            exactResults,
            legalIdResults, 
            titleResults,
            variationResults,
            contentResults,
            allAIds: aIds,
            closeToA3
        };

    } catch (error) {
        console.error('❌ Erreur lors de l\'investigation:', error.message);
        throw error;
    }
}

// Exécution
if (require.main === module) {
    investigateMissingCriticalDocs()
        .then(results => {
            console.log('\n✅ Investigation terminée.');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Échec de l\'investigation:', error.message);
            process.exit(1);
        });
}

module.exports = { investigateMissingCriticalDocs };
