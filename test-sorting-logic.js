const { SearchClient } = require('@azure/search-documents');

// Configuration directe basée sur .env.local.user
const config = {
  endpoint: 'https://search-cotechnoe-ai.search.windows.net',
  apiKey: 'YDcIo6Do1dEXTwLXEcuXLCdEQMELiXn3Q7HDhwrxEAAzSeD3CIr6',
  indexName: 'legis-qc-index-full-01'
};

async function testSortingLogic() {
  try {
    console.log('=== TEST DE LA LOGIQUE DE TRI ===');
    
    const client = new SearchClient(
      config.endpoint,
      config.indexName,
      { key: config.apiKey }
    );
    
    // Simuler la recherche actuelle
    const searchResults = await client.search('accident travail', {
      select: ['id', 'title', 'legalStatus', 'legalIdentifier'],
      searchFields: ['title', 'description', 'content'],
      queryType: 'simple',
      searchMode: 'any',
      top: 20
    });
    
    const resultsArray = [];
    for await (const result of searchResults.results) {
      // Ajouter le score dans le bon format
      result.score = result['@search.score'] || result.score || 0;
      resultsArray.push(result);
    }
    
    console.log('\n=== AVANT TRI ===');
    resultsArray.slice(0, 5).forEach((result, index) => {
      console.log(`${index + 1}. ${result.document.legalIdentifier} - Score: ${result.score.toFixed(3)} - Statut: ${JSON.stringify(result.document.legalStatus)}`);
      console.log(`   Titre: ${result.document.title}`);
    });
    
    // Appliquer la logique de tri de notre code
    const sortedResults = resultsArray.sort((a, b) => {
      const statusA = a.document.legalStatus;
      const statusB = b.document.legalStatus;
      
      // Priority order: "en vigueur" > null > "modifiée" > "abrogée"
      const getPriority = (status) => {
        if (status === "en vigueur") return 4;
        if (status === null || status === "null") return 3;
        if (status === "modifiée") return 2;
        if (status === "abrogée") return 1;
        return 0;
      };
      
      const priorityA = getPriority(statusA);
      const priorityB = getPriority(statusB);
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Descending priority
      }
      
      // If same status, sort by score (descending)
      return (b.score || 0) - (a.score || 0);
    });
    
    console.log('\n=== APRÈS TRI INTELLIGENT ===');
    sortedResults.slice(0, 5).forEach((result, index) => {
      const statusA = result.document.legalStatus;
      const getPriority = (status) => {
        if (status === "en vigueur") return 4;
        if (status === null || status === "null") return 3;
        if (status === "modifiée") return 2;
        if (status === "abrogée") return 1;
        return 0;
      };
      
      console.log(`${index + 1}. ${result.document.legalIdentifier} - Score: ${result.score.toFixed(3)} - Statut: ${JSON.stringify(result.document.legalStatus)} (Priorité: ${getPriority(statusA)})`);
      console.log(`   Titre: ${result.document.title}`);
    });
    
    // Vérifier si A-3.001 passe avant A-3
    const a3001Index = sortedResults.findIndex(r => r.document.legalIdentifier === 'A-3.001');
    const a3Index = sortedResults.findIndex(r => r.document.legalIdentifier === 'A-3');
    
    console.log('\n=== VÉRIFICATION TRI A-3 vs A-3.001 ===');
    console.log(`A-3.001 position: ${a3001Index + 1}`);
    console.log(`A-3 position: ${a3Index + 1}`);
    console.log(`✅ A-3.001 avant A-3: ${a3001Index < a3Index && a3001Index !== -1 && a3Index !== -1}`);
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

testSortingLogic();
