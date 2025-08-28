/**
 * Test de validation de l'algorithme de migration des métadonnées TTL vers l'index Azure
 * Vérifie spécifiquement la migration du statut légal
 */

const fs = require('fs');
const path = require('path');

// Configuration basée sur .env.local.user
const config = {
  ttlSourcePath: '/media/psf/Developpement/00-GIT/cotechnoe-kb-legis-qc/etl/extract/rdf/legisquebec-metadata.ttl',
  indexConfig: {
    endpoint: 'https://search-cotechnoe-ai.search.windows.net',
    apiKey: 'YDcIo6Do1dEXTwLXEcuXLCdEQMELiXn3Q7HDhwrxEAAzSeD3CIr6',
    indexName: 'legis-qc-index-full-01'
  }
};

// Simulation de la méthode extractMetadataField
function extractMetadataField(line, property, metadata, key) {
  if (line.includes(property)) {
    const match = line.match(/"([^"]+)"/);
    if (match) {
      metadata[key] = match[1];
    }
  }
}

// Simulation du parsing TTL pour A-3.001 et A-3
function parseTTLForLegalStatus() {
  console.log('=== TEST ALGORITHME MIGRATION MÉTADONNÉES TTL ===');
  console.log('Objectif: Vérifier si le statut légal est correctement extrait du TTL');
  console.log('');
  
  if (!fs.existsSync(config.ttlSourcePath)) {
    console.error(`❌ Fichier TTL source non trouvé: ${config.ttlSourcePath}`);
    return;
  }
  
  console.log(`📖 Lecture du fichier TTL: ${config.ttlSourcePath}`);
  const ttlContent = fs.readFileSync(config.ttlSourcePath, 'utf-8');
  const lines = ttlContent.split('\n');
  
  // Variables pour tracker les documents
  let currentLegalId = null;
  let currentMetadata = {};
  const extractedDocuments = {};
  
  console.log('🔍 Parsing des métadonnées TTL...');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Détecter un nouveau document TTL
    if (trimmedLine.startsWith('<https://legisquebec.gouv.qc.ca/ontology/loi/')) {
      // Sauvegarder le document précédent s'il existe
      if (currentLegalId && Object.keys(currentMetadata).length > 0) {
        extractedDocuments[currentLegalId] = { ...currentMetadata };
      }
      
      // Extraire l'identifiant du nouveau document
      const idMatch = trimmedLine.match(/\/loi\/([^>]+)>/);
      if (idMatch) {
        currentLegalId = idMatch[1];
        currentMetadata = { legalIdentifier: currentLegalId };
      }
    }
    
    // Extraire les métadonnées si on est dans un document
    if (currentLegalId) {
      // Extraction du statut légal - LIGNE CRITIQUE
      extractMetadataField(trimmedLine, 'legis:status', currentMetadata, 'status');
      
      // Autres métadonnées pour contexte
      extractMetadataField(trimmedLine, 'dcterms:title', currentMetadata, 'title');
      extractMetadataField(trimmedLine, 'legis:abrogatedBy', currentMetadata, 'abrogatedBy');
      extractMetadataField(trimmedLine, 'legis:downloadStatus', currentMetadata, 'downloadStatus');
      
      // Extraire titre sans quotes
      if (trimmedLine.includes('dcterms:title')) {
        const titleMatch = trimmedLine.match(/"([^"]+)"/);
        if (titleMatch) {
          currentMetadata.title = titleMatch[1];
        }
      }
    }
  }
  
  // Sauvegarder le dernier document
  if (currentLegalId && Object.keys(currentMetadata).length > 0) {
    extractedDocuments[currentLegalId] = { ...currentMetadata };
  }
  
  console.log(`✅ Parsing terminé. ${Object.keys(extractedDocuments).length} documents extraits`);
  console.log('');
  
  // Analyser spécifiquement A-3.001 et A-3
  console.log('=== ANALYSE SPÉCIFIQUE A-3 vs A-3.001 ===');
  
  const a3001 = extractedDocuments['A-3.001'];
  const a3 = extractedDocuments['A-3'];
  
  if (a3001) {
    console.log('📄 A-3.001 (Loi actuelle):');
    console.log(`   Titre: ${a3001.title || 'N/A'}`);
    console.log(`   Status TTL: ${JSON.stringify(a3001.status)} (${typeof a3001.status})`);
    console.log(`   AbrogatedBy: ${a3001.abrogatedBy || 'N/A'}`);
    console.log(`   DownloadStatus: ${a3001.downloadStatus || 'N/A'}`);
    
    // Simulation du mapping vers l'index
    const indexDoc = {
      legalIdentifier: a3001.legalIdentifier,
      title: a3001.title,
      legalStatus: null
    };
    
    // Logique exacte de l'algorithme (ligne 654-655)
    if (a3001.status) {
      indexDoc.legalStatus = a3001.status;
    }
    
    console.log(`   → Index legalStatus: ${JSON.stringify(indexDoc.legalStatus)} (après mapping)`);
    console.log('');
  } else {
    console.log('❌ A-3.001 non trouvé dans le parsing TTL');
    console.log('');
  }
  
  if (a3) {
    console.log('📄 A-3 (Loi abrogée):');
    console.log(`   Titre: ${a3.title || 'N/A'}`);
    console.log(`   Status TTL: ${JSON.stringify(a3.status)} (${typeof a3.status})`);
    console.log(`   AbrogatedBy: ${a3.abrogatedBy || 'N/A'}`);
    console.log(`   DownloadStatus: ${a3.downloadStatus || 'N/A'}`);
    
    // Simulation du mapping vers l'index
    const indexDoc = {
      legalIdentifier: a3.legalIdentifier,
      title: a3.title,
      legalStatus: null
    };
    
    // Logique exacte de l'algorithme (ligne 654-655)
    if (a3.status) {
      indexDoc.legalStatus = a3.status;
    }
    
    console.log(`   → Index legalStatus: ${JSON.stringify(indexDoc.legalStatus)} (après mapping)`);
    console.log('');
  } else {
    console.log('❌ A-3 non trouvé dans le parsing TTL');
    console.log('');
  }
  
  // Diagnostic
  console.log('=== DIAGNOSTIC ===');
  
  if (a3001 && a3001.status) {
    console.log(`✅ A-3.001 a un statut dans le TTL: "${a3001.status}"`);
  } else if (a3001) {
    console.log(`❌ A-3.001 TROUVÉ mais SANS statut dans le TTL - PROBLÈME IDENTIFIÉ!`);
  } else {
    console.log(`❌ A-3.001 non trouvé du tout - problème de parsing`);
  }
  
  if (a3 && a3.status) {
    console.log(`✅ A-3 a un statut dans le TTL: "${a3.status}"`);
  } else if (a3) {
    console.log(`❌ A-3 TROUVÉ mais SANS statut dans le TTL`);
  } else {
    console.log(`❌ A-3 non trouvé du tout`);
  }
  
  console.log('');
  console.log('=== CONCLUSION ===');
  
  if (a3001 && a3001.status === "en vigueur") {
    console.log('✅ Algorithme TTL: A-3.001 devrait avoir statut "en vigueur"');
  } else if (a3001 && !a3001.status) {
    console.log('🔍 Algorithme TTL: A-3.001 n\'a pas de statut - sera null dans l\'index');
    console.log('🔍 Ceci explique pourquoi l\'index a legalStatus: null pour A-3.001');
  } else {
    console.log('❓ Algorithme TTL: Situation inattendue pour A-3.001');
  }
  
  // Rechercher des exemples de documents avec statut
  console.log('');
  console.log('=== ÉCHANTILLON DOCUMENTS AVEC STATUT ===');
  let documentsWithStatus = 0;
  let documentsWithoutStatus = 0;
  
  for (const [id, doc] of Object.entries(extractedDocuments)) {
    if (doc.status) {
      documentsWithStatus++;
      if (documentsWithStatus <= 3) {
        console.log(`✅ ${id}: "${doc.status}" - ${doc.title}`);
      }
    } else {
      documentsWithoutStatus++;
    }
  }
  
  console.log(`📊 Documents AVEC statut: ${documentsWithStatus}`);
  console.log(`📊 Documents SANS statut: ${documentsWithoutStatus}`);
  console.log(`📊 Total: ${Object.keys(extractedDocuments).length}`);
  
  return { a3001, a3, totalDocs: Object.keys(extractedDocuments).length };
}

// Exécuter le test
const result = parseTTLForLegalStatus();
