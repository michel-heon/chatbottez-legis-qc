const { SearchClient } = require('@azure/search-documents');

// Configuration directe basée sur .env.local.user
const config = {
  endpoint: 'https://search-cotechnoe-ai.search.windows.net',
  apiKey: 'YDcIo6Do1dEXTwLXEcuXLCdEQMELiXn3Q7HDhwrxEAAzSeD3CIr6',
  indexName: 'legis-qc-index-full-01'
};

async function checkLegalStatus() {
  try {
    console.log('=== VÉRIFICATION DES STATUTS LÉGAUX ===');
    console.log('Endpoint:', config.endpoint);
    console.log('Index:', config.indexName);
    
    const client = new SearchClient(
      config.endpoint,
      config.indexName,
      { key: config.apiKey }
    );
    
    // Rechercher A-3.001 spécifiquement
    console.log('\n=== A-3.001 (Loi actuelle) ===');
    const resultsA3001 = await client.search('legalIdentifier:A-3.001', {
      select: ['id', 'title', 'legalStatus', 'legalIdentifier'],
      searchMode: 'all',
      top: 5
    });
    
    let foundA3001 = false;
    for await (const result of resultsA3001.results) {
      foundA3001 = true;
      console.log('Document trouvé:');
      console.log('  ID:', result.document.id);
      console.log('  Titre:', result.document.title);
      console.log('  Identifiant:', result.document.legalIdentifier);
      console.log('  Statut:', JSON.stringify(result.document.legalStatus));
      console.log('  Type status:', typeof result.document.legalStatus);
    }
    
    if (!foundA3001) {
      console.log('Aucun document A-3.001 trouvé avec recherche par identifiant');
      
      // Essayer une recherche plus large
      const broadSearch = await client.search('A-3.001', {
        select: ['id', 'title', 'legalStatus', 'legalIdentifier'],
        top: 10
      });
      
      console.log('\n=== Recherche élargie A-3.001 ===');
      for await (const result of broadSearch.results) {
        if (result.document.legalIdentifier === 'A-3.001' || result.document.title?.includes('A-3.001')) {
          console.log('Document trouvé:');
          console.log('  ID:', result.document.id);
          console.log('  Titre:', result.document.title);
          console.log('  Identifiant:', result.document.legalIdentifier);
          console.log('  Statut:', JSON.stringify(result.document.legalStatus));
        }
      }
    }
    
    // Rechercher A-3 pour comparaison
    console.log('\n=== A-3 (Loi abrogée) ===');
    const resultsA3 = await client.search('legalIdentifier:A-3', {
      select: ['id', 'title', 'legalStatus', 'legalIdentifier'],
      searchMode: 'all',
      top: 5
    });
    
    for await (const result of resultsA3.results) {
      console.log('Document trouvé:');
      console.log('  ID:', result.document.id);
      console.log('  Titre:', result.document.title);
      console.log('  Identifiant:', result.document.legalIdentifier);
      console.log('  Statut:', JSON.stringify(result.document.legalStatus));
      console.log('  Type status:', typeof result.document.legalStatus);
    }
    
    // Rechercher tous les documents avec statut null
    console.log('\n=== Documents avec statut null ===');
    const nullStatusResults = await client.search('*', {
      select: ['id', 'title', 'legalStatus', 'legalIdentifier'],
      filter: 'legalStatus eq null',
      top: 10
    });
    
    let nullCount = 0;
    for await (const result of nullStatusResults.results) {
      nullCount++;
      console.log(`${nullCount}. ${result.document.legalIdentifier} - ${result.document.title} - Status: ${JSON.stringify(result.document.legalStatus)}`);
    }
    
    if (nullCount === 0) {
      console.log('Aucun document avec statut null trouvé');
    }
    
  } catch (error) {
    console.error('Erreur lors de la vérification:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkLegalStatus();
