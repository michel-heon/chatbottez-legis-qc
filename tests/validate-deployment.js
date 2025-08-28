
/**
 * Post-deployment validation script
 */

const { SearchClient, AzureKeyCredential } = require("@azure/search-documents");

async function validateDeployment() {
    console.log('🔍 Validating enhanced pipeline deployment...');
    
    const searchClient = new SearchClient(
        "https://cognitiveailegisqcsearch.search.windows.net",
        "legis-qc-index-full-01",
        new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY)
    );
    
    try {
        // Search for A-3.001 and A-3
        const searchResults = await searchClient.search('A-3', {
            select: ['legalIdentifier', 'title', 'legalStatus'],
            top: 50
        });
        
        let a3001 = null;
        let a3 = null;
        
        for await (const result of searchResults.results) {
            const doc = result.document;
            if (doc.legalIdentifier === 'A-3.001') {
                a3001 = doc;
            } else if (doc.legalIdentifier === 'A-3') {
                a3 = doc;
            }
        }
        
        console.log('\n📊 VALIDATION RESULTS:');
        
        if (a3001) {
            console.log(`✅ A-3.001 found: status="${a3001.legalStatus}"`);
            if (a3001.legalStatus === 'en vigueur') {
                console.log('🎉 A-3.001 status CORRECTLY SET to "en vigueur"!');
            } else {
                console.log(`❌ A-3.001 status should be "en vigueur", got "${a3001.legalStatus}"`);
            }
        } else {
            console.log('❌ A-3.001 not found in search results');
        }
        
        if (a3) {
            console.log(`✅ A-3 found: status="${a3.legalStatus}"`);
            if (a3.legalStatus === 'abrogée') {
                console.log('✅ A-3 status correctly set to "abrogée"');
            } else {
                console.log(`❌ A-3 status should be "abrogée", got "${a3.legalStatus}"`);
            }
        } else {
            console.log('❌ A-3 not found in search results');
        }
        
        const success = a3001?.legalStatus === 'en vigueur' && a3?.legalStatus === 'abrogée';
        
        console.log(`\n🎯 DEPLOYMENT VALIDATION: ${success ? 'SUCCESS' : 'FAILED'}`);
        
        return success;
        
    } catch (error) {
        console.error('❌ Validation failed:', error);
        return false;
    }
}

validateDeployment()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Validation script failed:', error);
        process.exit(1);
    });
        