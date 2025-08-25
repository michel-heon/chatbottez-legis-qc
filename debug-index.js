const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');
const fs = require('fs');

async function checkIndexData() {
    try {
        // Lire les variables playground
        console.log('🔄 Lecture des variables d\'environnement...');
        const envContent = fs.readFileSync('.localConfigs.playground', 'utf-8');
        const envVars = {};
        envContent.split('\n').forEach(line => {
            if (line.includes('=')) {
                const [key, value] = line.split('=');
                envVars[key] = value;
            }
        });

        console.log('📋 Variables trouvées:');
        console.log('  INDEX:', envVars.AZURE_SEARCH_INDEX_NAME);
        console.log('  ENDPOINT:', envVars.AZURE_SEARCH_ENDPOINT);
        console.log('  KEY présente:', envVars.SECRET_AZURE_SEARCH_KEY ? 'OUI' : 'NON');

        // Créer le client Azure Search
        console.log('\n🔌 Connexion à Azure Search...');
        const client = new SearchClient(
            envVars.AZURE_SEARCH_ENDPOINT,
            envVars.AZURE_SEARCH_INDEX_NAME,
            new AzureKeyCredential(envVars.SECRET_AZURE_SEARCH_KEY)
        );

        // Rechercher des documents
        console.log('🔍 Recherche de documents...');
        const searchResults = await client.search('*', {
            select: ['legalIdentifier', 'title', 'legalStatus'],
            top: 5
        });
        
        console.log('\n📊 Données legalStatus dans l\'index:');
        console.log('=====================================');
        let count = 0;
        for await (const result of searchResults.results) {
            count++;
            console.log(`📄 ${result.document.legalIdentifier}: "${result.document.legalStatus}"`);
            console.log(`   Titre: ${result.document.title}`);
            console.log('');
        }
        
        console.log(`✅ Total trouvé: ${count} documents`);
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('   Stack:', error.stack);
    }
}

checkIndexData();
