const { SearchClient } = require('@azure/search-documents');

// Configuration directe basée sur .env.local.user
const config = {
  endpoint: 'https://search-cotechnoe-ai.search.windows.net',
  apiKey: 'YDcIo6Do1dEXTwLXEcuXLCdEQMELiXn3Q7HDhwrxEAAzSeD3CIr6',
  indexName: 'legis-qc-index-full-01'
};

async function simulateFixedSearch() {
  try {
    console.log('=== SIMULATION RECHERCHE CORRIGÉE ===');
    console.log('Requête: "Je me suis blessé au travail, que dois-je faire ?"');
    
    const client = new SearchClient(
      config.endpoint,
      config.indexName,
      { key: config.apiKey }
    );
    
    // Simulation de la recherche avec les bons champs
    const searchResults = await client.search('blessé accident travail', {
      select: ['id', 'title', 'legalStatus', 'legalIdentifier', 'description', 'content'],
      searchFields: ['title', 'description', 'content'],
      queryType: 'simple',
      searchMode: 'any',
      top: 20
    });
    
    // Récupérer tous les résultats
    const resultsArray = [];
    for await (const result of searchResults.results) {
      result.score = result['@search.score'] || result.score || 0;
      resultsArray.push(result);
    }
    
    console.log(`\n📊 ${resultsArray.length} documents bruts retournés`);
    
    // Appliquer le filtrage strictness (simulation avec seuil 0.010 pour strictness=2)
    const strictnessThreshold = 0.010;
    const filteredResults = resultsArray.filter(result => {
      const score = result.score;
      const isRelevant = score >= strictnessThreshold;
      
      if (!isRelevant) {
        const docId = result.document.legalIdentifier || 'UNKNOWN';
        console.log(`🔍 Document filtré par strictness: ${docId} (score: ${score.toFixed(3)} < ${strictnessThreshold})`);
      }
      
      return isRelevant;
    });
    
    console.log(`📊 Après filtrage strictness: ${filteredResults.length} documents conservés`);
    
    // Appliquer le tri intelligent
    const sortedResults = filteredResults.sort((a, b) => {
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
    
    console.log('\n=== TOP 10 DOCUMENTS APRÈS TRI INTELLIGENT ===');
    
    sortedResults.slice(0, 10).forEach((result, index) => {
      const statusA = result.document.legalStatus;
      const getPriority = (status) => {
        if (status === "en vigueur") return 4;
        if (status === null || status === "null") return 3;
        if (status === "modifiée") return 2;
        if (status === "abrogée") return 1;
        return 0;
      };
      
      console.log(`${index + 1}. ${result.document.legalIdentifier} - Score: ${result.score.toFixed(3)} - Statut: ${JSON.stringify(result.document.legalStatus)} (P:${getPriority(statusA)})`);
      console.log(`   Titre: ${result.document.title}`);
      
      // Mettre en évidence A-3 et A-3.001
      if (result.document.legalIdentifier === 'A-3' || result.document.legalIdentifier === 'A-3.001') {
        console.log(`   🎯 IMPORTANT: ${result.document.legalIdentifier} en position ${index + 1}`);
      }
    });
    
    // Vérifier l'ordre A-3.001 vs A-3
    const a3001Position = sortedResults.findIndex(r => r.document.legalIdentifier === 'A-3.001');
    const a3Position = sortedResults.findIndex(r => r.document.legalIdentifier === 'A-3');
    
    console.log('\n=== VÉRIFICATION FINALE DU TRI ===');
    if (a3001Position !== -1 && a3Position !== -1) {
      console.log(`A-3.001 position: ${a3001Position + 1}`);
      console.log(`A-3 position: ${a3Position + 1}`);
      console.log(`✅ A-3.001 avant A-3: ${a3001Position < a3Position}`);
    } else if (a3001Position !== -1) {
      console.log(`✅ A-3.001 trouvé en position ${a3001Position + 1}`);
      console.log('A-3 non inclus (bon signe si filtré par strictness)');
    } else if (a3Position !== -1) {
      console.log(`❌ A-3 trouvé en position ${a3Position + 1}`);
      console.log('A-3.001 non inclus (problème!)');
    } else {
      console.log('❓ Ni A-3 ni A-3.001 trouvés dans les résultats');
    }
    
    // Simulation de ce qui serait envoyé au LLM
    console.log('\n=== SIMULATION ENVOI AU LLM ===');
    let tokenCount = 0;
    let documentsIncluded = 0;
    const maxTokens = 1500;
    
    for (const result of sortedResults) {
      const documentContent = result.document.content || result.document.description || "";
      const truncatedContent = documentContent.length > 1000 ? 
        documentContent.substring(0, 1000) + "..." : documentContent;
      
      const documentData = `
Titre: ${result.document.title}
Identifiant: ${result.document.legalIdentifier}
Statut: ${result.document.legalStatus}
Description: ${result.document.description}
Contenu: ${truncatedContent}
      `.trim();
      
      const estimatedTokens = Math.ceil(documentData.length / 4); // Approximation
      
      if (tokenCount + estimatedTokens > maxTokens) {
        console.log(`🚫 Document ${documentsIncluded + 1} (${result.document.legalIdentifier}) excéderait la limite - arrêt`);
        break;
      }
      
      tokenCount += estimatedTokens;
      documentsIncluded++;
      
      console.log(`📄 Document ${documentsIncluded}: ${result.document.legalIdentifier} (${estimatedTokens} tokens, total: ${tokenCount})`);
    }
    
    console.log(`\n📊 RÉSUMÉ: ${documentsIncluded} documents envoyés, ${tokenCount}/${maxTokens} tokens utilisés`);
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

simulateFixedSearch();
