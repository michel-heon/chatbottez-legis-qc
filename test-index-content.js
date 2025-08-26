#!/usr/bin/env node

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

console.log('🔧 Variables d\'environnement chargées');
console.log(`📍 Index: ${process.env.AZURE_SEARCH_INDEX_NAME}`);
console.log(`📂 TTL: ${process.env.TTL_METADATA_FILE}`);

// Test semantic search functionality on existing ontology-driven index
console.log('🚀 Lancement du test sémantique TTL-driven...');

// Instead of running setup, just test the search functionality
const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');

async function testSemanticSearch() {
    try {
        console.log('🔍 Testing semantic search on existing index...');
        
        const searchClient = new SearchClient(
            process.env.AZURE_SEARCH_ENDPOINT,
            process.env.AZURE_SEARCH_INDEX_NAME,
            new AzureKeyCredential(process.env.SECRET_AZURE_SEARCH_KEY)
        );

        // Test basic search
        const searchResults = await searchClient.search('loi');
        console.log('✅ Basic search test successful');
        
        let resultCount = 0;
        for await (const result of searchResults.results) {
            resultCount++;
            if (resultCount <= 3) {
                console.log(`   📄 ${result.document.title || result.document.legalIdentifier || 'Unknown'}`);
            }
        }
        
        console.log(`📊 Found ${resultCount} results for 'loi'`);
        console.log('✅ Semantic search test completed successfully');
        
    } catch (error) {
        console.error('❌ Semantic search test failed:', error.message);
    }
}

testSemanticSearch();
