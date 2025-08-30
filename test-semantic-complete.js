const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement
const envFile = path.join(__dirname, 'env', '.env.playground.user');
const envContent = fs.readFileSync(envFile, 'utf8');

envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            let value = valueParts.join('=').trim();
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    }
});

const { AzureAISearchDataSource } = require('./lib/src/app/azureAISearchDataSource');

async function testSemanticSearch() {
    console.log('🔧 Configuration de test avec recherche sémantique...');
    
    // Debug des variables
    console.log('Debug variables:');
    console.log('SECRET_AZURE_SEARCH_KEY length:', process.env.SECRET_AZURE_SEARCH_KEY?.length || 'UNDEFINED');
    console.log('SECRET_AZURE_OPENAI_API_KEY length:', process.env.SECRET_AZURE_OPENAI_API_KEY?.length || 'UNDEFINED');
    console.log('AZURE_SEARCH_ENDPOINT:', process.env.AZURE_SEARCH_ENDPOINT);
    console.log('AZURE_SEARCH_INDEX_NAME:', process.env.AZURE_SEARCH_INDEX_NAME);
    console.log('AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT);
    
    // Vérifier que les clés ne sont pas vides
    const searchKey = process.env.SECRET_AZURE_SEARCH_KEY?.trim();
    const openaiKey = process.env.SECRET_AZURE_OPENAI_API_KEY?.trim();
    
    if (!searchKey || !openaiKey) {
        console.error('❌ Clés manquantes ou vides!');
        console.error('Search key empty:', !searchKey);
        console.error('OpenAI key empty:', !openaiKey);
        return;
    }
    
    const dataSource = new AzureAISearchDataSource({
        name: 'test-semantic',
        indexName: process.env.AZURE_SEARCH_INDEX_NAME,
        azureOpenAIApiKey: openaiKey,
        azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
        azureSearchApiKey: searchKey,
        azureSearchEndpoint: process.env.AZURE_SEARCH_ENDPOINT,
        azureOpenAIEmbeddingDeployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME,
        strictness: 2 // Niveau 2 = seuil 0.5
    });
    
    console.log('\n🔍 Test 1: "Je me suis blessé au travail"');
    try {
        const result1 = await dataSource.renderData(null, null, 'memory', { 
            input: 'Je me suis blessé au travail' 
        });
        console.log(`📄 Résultat longueur: ${result1.length} caractères`);
        if (result1.length > 0) {
            console.log('✅ Des documents ont été trouvés et retournés');
            // Afficher les premières lignes pour voir le contenu
            const preview = result1.substring(0, 500) + (result1.length > 500 ? '...' : '');
            console.log(`📄 Aperçu des résultats:\n${preview}`);
        } else {
            console.log('❌ Aucun document retourné');
        }
    } catch (error) {
        console.error('❌ Erreur lors du test 1:', error.message);
    }
    
    console.log('\n🔍 Test 2: "Abeilles"');
    try {
        const result2 = await dataSource.renderData(null, null, 'memory', { 
            input: 'Abeilles' 
        });
        console.log(`📄 Résultat longueur: ${result2.length} caractères`);
        if (result2.length > 0) {
            console.log('✅ Des documents ont été trouvés et retournés');
        } else {
            console.log('❌ Aucun document retourné');
        }
    } catch (error) {
        console.error('❌ Erreur lors du test 2:', error.message);
    }
    
    console.log('\n🔍 Test 3: "Loi" (recherche large)');
    try {
        const result3 = await dataSource.renderData(null, null, 'memory', { 
            input: 'Loi' 
        });
        console.log(`📄 Résultat longueur: ${result3.length} caractères`);
        if (result3.length > 0) {
            console.log('✅ Des documents ont été trouvés et retournés');
        } else {
            console.log('❌ Aucun document retourné');
        }
    } catch (error) {
        console.error('❌ Erreur lors du test 3:', error.message);
    }
}

testSemanticSearch()
    .then(() => console.log('\n✅ Tests terminés'))
    .catch(console.error);
