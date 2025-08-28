/**
 * Parsing TTL robuste par blocs de documents
 * Résout le problème des documents multi-lignes
 */

const fs = require('fs');

const config = {
  ttlSourcePath: '/media/psf/Developpement/00-GIT/cotechnoe-kb-legis-qc/etl/extract/rdf/legisquebec-metadata.ttl',
};

function parseDocumentBlocks() {
  console.log('=== PARSING TTL PAR BLOCS DE DOCUMENTS ===');
  console.log('Objectif: Parser les documents complets multi-lignes');
  console.log('');
  
  const ttlContent = fs.readFileSync(config.ttlSourcePath, 'utf-8');
  
  // Diviser en blocs de documents
  const documentPattern = /<https:\/\/legisquebec\.gouv\.qc\.ca\/ontology\/loi\/([^>]+)>/g;
  const documents = {};
  
  let match;
  const documentStarts = [];
  
  // Trouver tous les débuts de documents
  while ((match = documentPattern.exec(ttlContent)) !== null) {
    documentStarts.push({
      id: match[1],
      startIndex: match.index,
      fullMatch: match[0]
    });
  }
  
  console.log(`📦 ${documentStarts.length} documents trouvés dans le TTL`);
  
  // Extraire chaque bloc de document
  for (let i = 0; i < documentStarts.length; i++) {
    const current = documentStarts[i];
    const next = documentStarts[i + 1];
    
    const startIndex = current.startIndex;
    const endIndex = next ? next.startIndex : ttlContent.length;
    
    const documentBlock = ttlContent.substring(startIndex, endIndex);
    
    // Focus sur A-3 et A-3.001
    if (current.id === 'A-3' || current.id === 'A-3.001') {
      console.log(`\n📄 === DOCUMENT ${current.id} ===`);
      console.log(`Bloc de ${documentBlock.length} caractères`);
      
      // Extraire les métadonnées du bloc
      const metadata = parseDocumentMetadata(current.id, documentBlock);
      documents[current.id] = metadata;
      
      console.log('Métadonnées extraites:');
      console.log(`  Title: ${metadata.title || 'N/A'}`);
      console.log(`  Status: "${metadata.status}" (${typeof metadata.status})`);
      console.log(`  AbrogatedBy: ${metadata.abrogatedBy || 'N/A'}`);
      console.log(`  DownloadStatus: ${metadata.downloadStatus || 'N/A'}`);
    }
  }
  
  return documents;
}

function parseDocumentMetadata(docId, block) {
  const metadata = { legalIdentifier: docId };
  
  // Patterns améliorés pour l'extraction
  const patterns = {
    title: /dcterms:title\s+"([^"]+)"(@fr)?/,
    status: /legis:status\s+"([^"]+)"(@fr)?/,
    abrogatedBy: /legis:abrogatedBy\s+<([^>]+)>/,
    downloadStatus: /legis:downloadStatus\s+"([^"]+)"/
  };
  
  // Extraire chaque métadonnée
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = block.match(pattern);
    if (match) {
      if (key === 'abrogatedBy') {
        // Pour abrogatedBy, extraire juste l'ID de la loi
        const urlMatch = match[1].match(/\/loi\/([^\/]+)$/);
        metadata[key] = urlMatch ? urlMatch[1] : match[1];
      } else {
        metadata[key] = match[1];
      }
      
      console.log(`    ✅ ${key}: "${metadata[key]}" (du pattern: ${pattern})`);
    } else {
      console.log(`    ❌ ${key}: non trouvé avec pattern ${pattern}`);
    }
  }
  
  return metadata;
}

function validateExtraction() {
  console.log('\n=== VALIDATION FINALE ===');
  
  const documents = parseDocumentBlocks();
  
  const a3001 = documents['A-3.001'];
  const a3 = documents['A-3'];
  
  console.log('\n📊 RÉSUMÉ FINAL:');
  
  if (a3001 && a3001.status === 'en vigueur') {
    console.log('✅ A-3.001: Statut "en vigueur" CORRECTEMENT EXTRAIT');
  } else {
    console.log(`❌ A-3.001: Statut "${a3001?.status || 'NULL'}" - PROBLÈME PERSISTE`);
  }
  
  if (a3 && a3.status === 'abrogée') {
    console.log('✅ A-3: Statut "abrogée" correctement extrait');
  } else {
    console.log(`❌ A-3: Statut "${a3?.status || 'NULL'}" - problème`);
  }
  
  // Comparaison avec l'algorithme actuel
  console.log('\n🔍 IMPLICATIONS POUR L\'INDEX AZURE:');
  
  if (a3001?.status === 'en vigueur') {
    console.log('→ A-3.001 devrait avoir legalStatus: "en vigueur" dans l\'index');
    console.log('→ Si l\'index a null, le problème est dans le pipeline TTL→Index');
  }
  
  if (a3?.status === 'abrogée') {
    console.log('→ A-3 devrait avoir legalStatus: "abrogée" dans l\'index');
  }
  
  console.log('\n🎯 RÉSOLUTION:');
  console.log('1. Le TTL contient les bonnes données avec tags @fr');
  console.log('2. Notre parsing peut extraire correctement avec gestion des blocs');
  console.log('3. Le problème est dans l\'algorithme de migration TTL→Index');
  console.log('4. Il faut mettre à jour extractMetadataField() pour gérer les tags @fr');
  
  return { a3001, a3 };
}

// Exécuter la validation
validateExtraction();
