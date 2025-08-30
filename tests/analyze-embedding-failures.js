/**
 * Script d'analyse des échecs d'embeddings et documents problématiques
 * 
 * Objectif : Identifier les documents qui ont échoué lors de l'indexation
 * à cause de problèmes d'embeddings, et analyser les patterns d'erreur.
 */

require('dotenv').config();
const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');

// Configuration Azure Search
const searchClient = new SearchClient(
    process.env.AZURE_SEARCH_ENDPOINT,
    process.env.AZURE_SEARCH_INDEX_NAME || 'legis-qc-index-full-01',
    new AzureKeyCredential(process.env.SECRET_AZURE_SEARCH_KEY)
);

/**
 * Analyser les documents avec des embeddings manquants ou défaillants
 */
async function analyzeEmbeddingFailures() {
    console.log('🔍 Analyse des échecs d\'embeddings...');
    console.log('====================================');

    try {
        // 1. Chercher documents avec contentVector vide/null
        console.log('\n📋 1. Documents avec contentVector manquant:');
        const missingVectorResults = await searchClient.search('*', {
            filter: 'contentVector eq null',
            select: ['legalIdentifier', 'title', 'content'],
            top: 20
        });

        let missingVectorCount = 0;
        for await (const result of missingVectorResults.results) {
            console.log(`   ❌ ${result.document.legalIdentifier}: ${result.document.title?.substring(0, 80)}...`);
            missingVectorCount++;
        }
        console.log(`   Total: ${missingVectorCount} documents`);

        // 2. Chercher documents avec description courte (indicateur d'échec)
        console.log('\n📋 2. Documents avec description très courte (<50 chars):');
        const shortDescResults = await searchClient.search('*', {
            select: ['legalIdentifier', 'title', 'description'],
            top: 50
        });

        let shortDescCount = 0;
        for await (const result of shortDescResults.results) {
            const desc = result.document.description || '';
            if (desc.length < 50 && desc.length > 0) {
                console.log(`   ⚠️  ${result.document.legalIdentifier}: "${desc}"`);
                shortDescCount++;
            }
        }
        console.log(`   Total: ${shortDescCount} documents`);

        // 3. Rechercher spécifiquement les documents mentionnés dans les warnings
        console.log('\n📋 3. Vérification des documents signalés (A-14, A-19.1, A-2.1):');
        const problematicDocs = ['A-14', 'A-19.1', 'A-2.1', 'A-3', 'A-3.001'];
        
        for (const docId of problematicDocs) {
            try {
                const results = await searchClient.search('*', {
                    filter: `legalIdentifier eq '${docId}'`,
                    select: ['legalIdentifier', 'title', 'description', 'content'],
                    top: 1
                });

                let found = false;
                for await (const result of results.results) {
                    found = true;
                    const doc = result.document;
                    console.log(`   ✅ ${docId}: "${doc.title}" (desc: ${doc.description?.length || 0} chars)`);
                    
                    // Vérifier si c'est la loi sur l'accès
                    if (doc.title?.toLowerCase().includes('accès') && doc.title?.toLowerCase().includes('documents')) {
                        console.log(`      🎯 TROUVÉ: Loi sur l'accès aux documents (potentiellement A-3)`);
                    }
                }
                
                if (!found) {
                    console.log(`   ❌ ${docId}: Non trouvé dans l'index`);
                }
            } catch (error) {
                console.log(`   ❌ ${docId}: Erreur de recherche - ${error.message}`);
            }
        }

        // 4. Rechercher par titre "Loi sur l'accès"
        console.log('\n📋 4. Recherche par titre "Loi sur l\'accès aux documents":');
        const accessLawResults = await searchClient.search('loi accès documents', {
            searchFields: ['title'],
            select: ['legalIdentifier', 'title', 'description'],
            top: 10
        });

        let accessLawCount = 0;
        for await (const result of accessLawResults.results) {
            console.log(`   📄 ${result.document.legalIdentifier}: ${result.document.title}`);
            accessLawCount++;
        }
        console.log(`   Total: ${accessLawCount} documents trouvés`);

        // 5. Analyser les patterns d'identifiants
        console.log('\n📋 5. Analyse des patterns d\'identifiants:');
        const allResults = await searchClient.search('*', {
            select: ['legalIdentifier'],
            top: 100
        });

        const identifierPatterns = {};
        let totalDocs = 0;
        for await (const result of allResults.results) {
            const id = result.document.legalIdentifier;
            if (id) {
                const pattern = id.match(/^([A-Z]+)-?/)?.[1] || 'OTHER';
                identifierPatterns[pattern] = (identifierPatterns[pattern] || 0) + 1;
                totalDocs++;
            }
        }

        console.log('   Patterns d\'identifiants trouvés:');
        Object.entries(identifierPatterns)
            .sort(([,a], [,b]) => b - a)
            .forEach(([pattern, count]) => {
                console.log(`   ${pattern}: ${count} documents`);
            });

        console.log(`\n🎯 RAPPORT D'ANALYSE DES EMBEDDINGS:`);
        console.log('=====================================');
        console.log(`❌ ${missingVectorCount} documents avec embeddings manquants`);
        console.log(`⚠️  ${shortDescCount} documents avec descriptions courtes`);
        console.log(`📊 ${totalDocs} documents total analysés`);
        console.log(`📄 ${accessLawCount} documents "loi accès" trouvés`);

        // Recommandations
        console.log('\n💡 RECOMMANDATIONS:');
        console.log('==================');
        console.log('1. Vérifier les logs d\'indexation pour les erreurs d\'embeddings');
        console.log('2. Re-indexer les documents avec embeddings manquants');
        console.log('3. Analyser si A-2.1 est effectivement A-3 sous un autre identifiant');
        console.log('4. Vérifier la transformation TTL → Index pour les identifiants');

    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse:', error.message);
        process.exit(1);
    }
}

// Exécution
if (require.main === module) {
    analyzeEmbeddingFailures()
        .then(() => {
            console.log('\n✅ Analyse des embeddings terminée.');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = { analyzeEmbeddingFailures };
