#!/usr/bin/env node

/**
 * Script pour analyser la structure globale de l'index
 * Identification des types de documents présents et patterns d'ID
 */

const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');
require('dotenv').config({ path: 'env/.env.local.user' });

const searchClient = new SearchClient(
    process.env.AZURE_SEARCH_ENDPOINT,
    process.env.AZURE_SEARCH_INDEX_NAME || 'legis-qc-index-full-01',
    new AzureKeyCredential(process.env.SECRET_AZURE_SEARCH_KEY)
);

async function analyzeIndexStructure() {
    console.log('🔍 Analyse structure globale de l\'index...');
    console.log('=============================================\n');

    try {
        // 1. Échantillon général des documents
        console.log('📋 1. Échantillon général des documents:');
        const sampleResults = await searchClient.search('*', {
            select: ['id', 'title', 'legalStatus', 'legalType', 'legalIdentifier'],
            top: 20
        });

        let sampleDocs = [];
        for await (const result of sampleResults.results) {
            sampleDocs.push(result.document);
        }

        console.log(`   Échantillon: ${sampleDocs.length} documents`);
        sampleDocs.forEach((doc, i) => {
            console.log(`   ${i+1}. ID: "${doc.id}" | Titre: "${doc.title ? doc.title.substring(0, 50) + '...' : 'N/A'}"`);
            console.log(`      Legal ID: "${doc.legalIdentifier}" | Type: "${doc.legalType}" | Statut: "${doc.legalStatus}"`);
        });

        // 2. Analyse des patterns d'ID
        console.log('\n📋 2. Analyse des patterns d\'ID:');
        const allIdsResults = await searchClient.search('*', {
            select: ['id'],
            top: 1000
        });

        let allIds = [];
        for await (const result of allIdsResults.results) {
            allIds.push(result.document.id);
        }

        // Analyser les patterns
        const patterns = {};
        allIds.forEach(id => {
            const prefix = id.split('-')[0] || id.substring(0, 3);
            patterns[prefix] = (patterns[prefix] || 0) + 1;
        });

        console.log(`   Total documents: ${allIds.length}`);
        console.log('   Patterns d\'ID les plus fréquents:');
        const sortedPatterns = Object.entries(patterns)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        
        sortedPatterns.forEach(([pattern, count]) => {
            console.log(`      • ${pattern}*: ${count} documents`);
        });

        // 3. Analyse des statuts légaux
        console.log('\n📋 3. Distribution des statuts légaux:');
        const statusResults = await searchClient.search('*', {
            select: ['legalStatus'],
            top: 1000
        });

        const statusCounts = {};
        for await (const result of statusResults.results) {
            const status = result.document.legalStatus || 'null';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        }

        Object.entries(statusCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([status, count]) => {
                console.log(`      • "${status}": ${count} documents`);
            });

        // 4. Analyse des types légaux
        console.log('\n📋 4. Types de documents légaux:');
        const typeResults = await searchClient.search('*', {
            select: ['legalType'],
            top: 1000
        });

        const typeCounts = {};
        for await (const result of typeResults.results) {
            const type = result.document.legalType || 'null';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        }

        Object.entries(typeCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([type, count]) => {
                console.log(`      • "${type}": ${count} documents`);
            });

        // 5. Recherche de lois spécifiques
        console.log('\n📋 5. Recherche de lois importantes:');
        const importantLaws = [
            'Charte des droits',
            'Code civil',
            'Loi sur l\'accès',
            'Loi électorale'
        ];

        for (const lawKeyword of importantLaws) {
            const lawResults = await searchClient.search(`title:"${lawKeyword}"`, {
                select: ['id', 'title'],
                top: 3
            });

            let lawDocs = [];
            for await (const result of lawResults.results) {
                lawDocs.push(result.document);
            }

            console.log(`   "${lawKeyword}": ${lawDocs.length} résultats`);
            lawDocs.forEach(doc => {
                console.log(`      • ${doc.id}: "${doc.title}"`);
            });
        }

        // 6. IDs numériques vs alphabétiques
        console.log('\n📋 6. Classification des IDs:');
        const numericIds = allIds.filter(id => /^\d/.test(id));
        const alphaIds = allIds.filter(id => /^[A-Za-z]/.test(id));
        const mixedIds = allIds.filter(id => !/^[\d]/.test(id) && !/^[A-Za-z]/.test(id));

        console.log(`   IDs numériques (123...): ${numericIds.length}`);
        console.log(`   IDs alphabétiques (A-3...): ${alphaIds.length}`);
        console.log(`   IDs mixtes/autres: ${mixedIds.length}`);

        if (numericIds.length > 0) {
            console.log(`   Échantillon numériques: ${numericIds.slice(0, 5).join(', ')}`);
        }
        if (alphaIds.length > 0) {
            console.log(`   Échantillon alphabétiques: ${alphaIds.slice(0, 5).join(', ')}`);
        }

        console.log('\n🎯 DIAGNOSTIC STRUCTURE INDEX:');
        console.log('===============================');
        
        if (allIds.length === 0) {
            console.log('❌ INDEX VIDE - Aucun document trouvé');
        } else if (alphaIds.length === 0) {
            console.log('⚠️ AUCUN DOCUMENT AVEC ID ALPHABÉTIQUE (A-3, A-3.001)');
            console.log('   L\'index contient uniquement des documents avec IDs numériques');
            console.log('   Les documents de lois québécoises (A-3, etc.) ne sont pas présents');
        } else {
            console.log('✅ Index contient des documents avec différents types d\'IDs');
        }

        return {
            totalDocs: allIds.length,
            sampleDocs,
            patterns,
            statusCounts,
            typeCounts,
            numericIds: numericIds.length,
            alphaIds: alphaIds.length,
            allIds: allIds.slice(0, 50) // Limitation pour éviter l'overflow
        };

    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse:', error.message);
        throw error;
    }
}

// Exécution
if (require.main === module) {
    analyzeIndexStructure()
        .then(results => {
            console.log('\n✅ Analyse structure terminée.');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Échec de l\'analyse:', error.message);
            process.exit(1);
        });
}

module.exports = { analyzeIndexStructure };
