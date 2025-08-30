/**
 * Script simplifié d'analyse A-2.1 - Focus sur les échecs d'embedding
 */

require('dotenv').config({ path: 'env/.env.playground.user' });
const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');

const searchClient = new SearchClient(
    process.env.AZURE_SEARCH_ENDPOINT,
    process.env.AZURE_SEARCH_INDEX_NAME || 'legis-qc-index-full-01',
    new AzureKeyCredential(process.env.SECRET_AZURE_SEARCH_KEY)
);

async function analyzeA21Simple() {
    console.log('🔍 Analyse simplifiée A-2.1 - Échecs d\'embedding');
    console.log('================================================');

    try {
        // 1. Récupérer A-2.1
        const a21Results = await searchClient.search('*', {
            filter: `legalIdentifier eq 'A-2.1'`,
            select: ['legalIdentifier', 'title', 'description', 'content'],
            top: 1
        });

        let a21Doc = null;
        for await (const result of a21Results.results) {
            a21Doc = result.document;
        }

        if (!a21Doc) {
            console.log('❌ A-2.1 non trouvé');
            return;
        }

        console.log('\n📋 Document A-2.1:');
        console.log(`   Titre: ${a21Doc.title}`);
        console.log(`   Description: ${a21Doc.description?.length || 0} caractères`);
        console.log(`   Contenu: ${a21Doc.content?.length || 0} caractères`);

        // 2. Analyser la description
        if (a21Doc.description) {
            console.log('\n📋 Analyse de la description:');
            console.log(`   "${a21Doc.description.substring(0, 200)}..."`);
            
            // Caractères problématiques
            const problematicChars = a21Doc.description.match(/[^\x00-\x7F]/g);
            if (problematicChars) {
                console.log(`   ⚠️  ${problematicChars.length} caractères non-ASCII détectés`);
                const uniqueChars = [...new Set(problematicChars)];
                console.log(`   Caractères: ${uniqueChars.slice(0, 10).join(', ')}`);
            }
        }

        // 3. Test de recherche vectorielle
        console.log('\n📋 Test recherche vectorielle:');
        
        // Test 1: Recherche par titre exact
        const exactResults = await searchClient.search('Loi sur l\'accès aux documents', {
            select: ['legalIdentifier', 'title'],
            top: 3
        });
        
        let foundInExact = false;
        for await (const result of exactResults.results) {
            if (result.document.legalIdentifier === 'A-2.1') {
                foundInExact = true;
                console.log('   ✅ A-2.1 trouvé par recherche titre exact');
            }
        }
        if (!foundInExact) {
            console.log('   ⚠️  A-2.1 NON trouvé par recherche titre exact');
        }

        // Test 2: Recherche générale
        const generalResults = await searchClient.search('accès documents organismes', {
            select: ['legalIdentifier', 'title'],
            top: 10
        });
        
        let foundInGeneral = false;
        let position = 0;
        for await (const result of generalResults.results) {
            position++;
            if (result.document.legalIdentifier === 'A-2.1') {
                foundInGeneral = true;
                console.log(`   ✅ A-2.1 trouvé en position ${position} (recherche générale)`);
                break;
            }
        }
        if (!foundInGeneral) {
            console.log('   ❌ A-2.1 NON trouvé dans top 10 recherche générale');
        }

        // 4. Comparer avec A-14 (qui fonctionne)
        console.log('\n📋 Comparaison avec A-14:');
        const a14Results = await searchClient.search('*', {
            filter: `legalIdentifier eq 'A-14'`,
            select: ['legalIdentifier', 'title', 'description'],
            top: 1
        });

        for await (const result of a14Results.results) {
            const a14Doc = result.document;
            console.log(`   A-14 description: ${a14Doc.description?.length || 0} chars`);
            console.log(`   A-2.1 description: ${a21Doc.description?.length || 0} chars`);
            
            // Test de recherche pour A-14
            const a14SearchResults = await searchClient.search('aide juridique', {
                select: ['legalIdentifier', 'title'],
                top: 3
            });
            
            let foundA14 = false;
            for await (const searchResult of a14SearchResults.results) {
                if (searchResult.document.legalIdentifier === 'A-14') {
                    foundA14 = true;
                    console.log('   ✅ A-14 trouvé par recherche thématique');
                    break;
                }
            }
            if (!foundA14) {
                console.log('   ⚠️  A-14 NON trouvé par recherche thématique');
            }
        }

        console.log(`\n🎯 DIAGNOSTIC A-2.1:`);
        console.log('===================');
        
        if (!foundInExact && !foundInGeneral) {
            console.log('❌ PROBLÈME MAJEUR: A-2.1 non trouvé par recherche vectorielle');
            console.log('   → Les embeddings ont probablement complètement échoué');
            console.log('   → Le document est indexé mais non recherchable vectoriellement');
        } else if (!foundInExact) {
            console.log('⚠️  PROBLÈME PARTIEL: A-2.1 trouvé seulement par recherche générale');
            console.log('   → Embeddings partiellement fonctionnels');
        } else {
            console.log('✅ A-2.1 fonctionnel en recherche vectorielle');
        }

        console.log('\n💡 ACTIONS RECOMMANDÉES:');
        console.log('1. Vérifier les logs d\'embedding lors de l\'indexation');
        console.log('2. Nettoyer les caractères spéciaux avant embedding');
        console.log('3. Réindexer A-2.1 avec des paramètres d\'embedding ajustés');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

// Exécution
if (require.main === module) {
    analyzeA21Simple()
        .then(() => {
            console.log('\n✅ Analyse A-2.1 terminée.');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erreur fatale:', error);
            process.exit(1);
        });
}
