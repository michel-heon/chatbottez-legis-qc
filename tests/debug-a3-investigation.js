const { SearchClient } = require('@azure/search-documents');

// Configuration directe basée sur .env.local.user
const config = {
  endpoint: 'https://search-cotechnoe-ai.search.windows.net',
  apiKey: 'YDcIo6Do1dEXTwLXEcuXLCdEQMELiXn3Q7HDhwrxEAAzSeD3CIr6',
  indexName: 'legis-qc-index-full-01'
};

async function investigateA3Laws() {
  try {
    console.log('=== INVESTIGATION DÉTAILLÉE A-3 vs A-3.001 ===');
    
    const client = new SearchClient(
      config.endpoint,
      config.indexName,
      { key: config.apiKey }
    );
    
    // Recherche large pour tous les documents A-3*
    console.log('\n=== Recherche pour tous les A-3* ===');
    const broadA3Search = await client.search('A-3', {
      select: ['id', 'title', 'legalStatus', 'legalIdentifier'],
      top: 20
    });
    
    const foundDocs = [];
    for await (const result of broadA3Search.results) {
      if (result.document.legalIdentifier?.startsWith('A-3')) {
        foundDocs.push(result.document);
      }
    }
    
    console.log(`Trouvé ${foundDocs.length} documents A-3*:`);
    foundDocs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.legalIdentifier} - "${doc.title}" - Statut: ${JSON.stringify(doc.legalStatus)}`);
    });
    
    // Recherche simulant la requête utilisateur "Je me suis blessé"
    console.log('\n=== Simulation requête "accident travail" ===');
    const accidentSearch = await client.search('accident travail', {
      select: ['id', 'title', 'legalStatus', 'legalIdentifier'],
      searchFields: ['title', 'description', 'content'],
      top: 10
    });
    
    console.log('Documents retournés pour "accident travail":');
    let count = 0;
    for await (const result of accidentSearch.results) {
      count++;
      const score = result['@search.score'] || result.score || 0;
      console.log(`${count}. ${result.document.legalIdentifier} - Score: ${score.toFixed(3)} - Statut: ${JSON.stringify(result.document.legalStatus)}`);
      console.log(`   Titre: ${result.document.title}`);
      
      if (count >= 5) break; // Limiter à 5 pour la lisibilité
    }
    
    // Recherche avec le query exact de l'utilisateur
    console.log('\n=== Test query hybride spécifique ===');
    const hybridSearch = await client.search('accident travail blessé', {
      select: ['id', 'title', 'legalStatus', 'legalIdentifier'],
      searchFields: ['title', 'description', 'content'],
      queryType: 'simple',
      searchMode: 'any',
      top: 20
    });
    
    console.log('Top documents pour query hybride:');
    count = 0;
    for await (const result of hybridSearch.results) {
      if (result.document.legalIdentifier?.includes('A-3')) {
        count++;
        const score = result['@search.score'] || result.score || 0;
        console.log(`${count}. ${result.document.legalIdentifier} - Score: ${score.toFixed(3)} - Statut: ${JSON.stringify(result.document.legalStatus)}`);
        console.log(`   Titre: ${result.document.title}`);
      }
    }
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

investigateA3Laws();
