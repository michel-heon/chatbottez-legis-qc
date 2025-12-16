/**
 * Exemple d'utilisation de la configuration Azure AI Search
 * avec les paramètres optimisés selon Azure AI Foundry
 */

import { AzureAISearchDataSource } from '../app/azureAISearchDataSource';

// Configuration exemple basée sur votre Azure AI Foundry
const searchConfig = {
    name: "legal-search",
    indexName: "fileupload-justice-index-02",
    azureAISearchApiKey: process.env.SECRET_AZURE_SEARCH_KEY!,
    azureAISearchEndpoint: process.env.AZURE_SEARCH_ENDPOINT!,
    azureOpenAIApiKey: process.env.SECRET_AZURE_OPENAI_API_KEY!,
    azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    azureOpenAIEmbeddingDeploymentName: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME!,
    
    // Paramètres selon votre configuration Azure AI Foundry
    strictness: 1,                    // ✓ Filtrage minimal pour maximum de contexte
    retrievedDocuments: 20,           // ✓ Maximum de documents pour couverture complète  
    limitToDataContent: true          // ✓ RAG strict - réponses basées sur vos données uniquement
};

async function demonstrateSearchConfiguration() {
    console.log('🔧 Configuration Azure AI Search - Démonstration');
    console.log('================================================');
    
    const dataSource = new AzureAISearchDataSource(searchConfig);
    
    // Test avec une requête juridique typique
    const testQuery = "Quelles sont les procédures de contestation d'une décision administrative?";
    
    console.log(`📝 Requête test: "${testQuery}"`);
    console.log('\n🔍 Exécution de la recherche avec les paramètres optimisés...\n');
    
    try {
        const context = await dataSource.renderContext(testQuery);
        
        console.log('✅ Recherche terminée avec succès !');
        console.log(`📊 Contexte généré: ${context.length} caractères`);
        console.log(`🎯 Tokens estimés: ~${Math.round(context.length / 4)}`);
        console.log('\n📋 Paramètres appliqués:');
        console.log(`   • Strictness: ${searchConfig.strictness} (filtrage minimal)`);
        console.log(`   • Documents récupérés: ${searchConfig.retrievedDocuments}`);
        console.log(`   • Limitation aux données: ${searchConfig.limitToDataContent}`);
        
        // Affichage d'un extrait du contexte
        const preview = context.substring(0, 200) + '...';
        console.log('\n📄 Aperçu du contexte généré:');
        console.log(preview);
        
    } catch (error) {
        console.error('❌ Erreur lors de la recherche:', error);
    }
}

// Configuration des différents niveaux de strictness pour comparaison
export const strictnessConfigurations = {
    minimal: { strictness: 1, description: "Filtrage minimal - Maximum de contexte" },
    balanced: { strictness: 3, description: "Équilibré - Recommandation Microsoft" },
    strict: { strictness: 5, description: "Strict - Documents très pertinents uniquement" }
};

// Configuration des différents nombres de documents
export const documentConfigurations = {
    focused: { retrievedDocuments: 5, description: "Recherche ciblée - Contexte réduit" },
    balanced: { retrievedDocuments: 10, description: "Équilibré - Bon compromis" },
    comprehensive: { retrievedDocuments: 20, description: "Complet - Contexte maximum" }
};

export { demonstrateSearchConfiguration, searchConfig };
