const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');
const fs = require('fs');

async function checkIndexStats() {
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

        // Créer le client Azure Search
        console.log('🔌 Connexion à Azure Search...');
        const client = new SearchClient(
            envVars.AZURE_SEARCH_ENDPOINT,
            envVars.AZURE_SEARCH_INDEX_NAME,
            new AzureKeyCredential(envVars.SECRET_AZURE_SEARCH_KEY)
        );

        // 1. Compter tous les documents
        console.log('\n📊 Statistiques de l\'index:');
        console.log('============================');
        
        const allDocsResults = await client.search('*', {
            select: ['legalIdentifier'],
            top: 50 // Limite élevée pour compter
        });
        
        let totalCount = 0;
        for await (const result of allDocsResults.results) {
            totalCount++;
        }
        console.log(`📄 Total de documents dans l'index: ${totalCount}`);

        // 2. Test de recherche textuelle simple
        console.log('\n🔍 Test recherche "loi":');
        const textSearch = await client.search('loi', {
            select: ['legalIdentifier', 'title'],
            top: 10
        });
        
        let textCount = 0;
        for await (const result of textSearch.results) {
            textCount++;
            console.log(`  📄 ${result.document.legalIdentifier}: ${result.document.title}`);
        }
        console.log(`📈 Résultats pour "loi": ${textCount} documents`);

        // 3. Test de recherche par défaut (sans paramètre top)
        console.log('\n🔍 Test recherche sans limite explicite:');
        const defaultSearch = await client.search('*', {
            select: ['legalIdentifier']
        });
        
        let defaultCount = 0;
        for await (const result of defaultSearch.results) {
            defaultCount++;
            if (defaultCount <= 10) {
                console.log(`  📄 ${result.document.legalIdentifier}`);
            }
        }
        console.log(`📈 Résultats par défaut: ${defaultCount} documents`);
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

checkIndexStats();
