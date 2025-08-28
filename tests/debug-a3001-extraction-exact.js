/**
 * Test avec l'algorithme EXACT du code pour A-3.001
 */

const fs = require('fs');

// Copie exacte de extractMetadataField du code source
function extractMetadataField(line, property, metadata, key) {
  if (line.includes(property)) {
    const match = line.match(/"([^"]+)"/);
    if (match) {
      metadata[key] = match[1];
    }
  }
}

console.log('=== TEST ALGORITHME EXACT POUR A-3.001 ===');

const ttlFile = '/media/psf/Developpement/00-GIT/cotechnoe-kb-legis-qc/etl/extract/rdf/legisquebec-metadata.ttl';
const content = fs.readFileSync(ttlFile, 'utf-8');
const lines = content.split('\n');

let inA3001 = false;
let metadata = {};

console.log('🔍 Recherche de A-3.001 dans le TTL...');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmedLine = line.trim();
  
  // Détecter le début de A-3.001
  if (trimmedLine.includes('<https://legisquebec.gouv.qc.ca/ontology/loi/A-3.001>')) {
    inA3001 = true;
    metadata = { lineStart: i + 1 };
    console.log(`✅ A-3.001 trouvé ligne ${i + 1}`);
    continue;
  }
  
  // Si on est dans A-3.001, extraire les métadonnées
  if (inA3001) {
    // Arrêter si on atteint un nouveau document
    if (trimmedLine.startsWith('<https://legisquebec.gouv.qc.ca/ontology/loi/') && 
        !trimmedLine.includes('A-3.001')) {
      console.log(`📝 Fin A-3.001 ligne ${i + 1} - Nouveau document: ${trimmedLine.substring(0, 80)}...`);
      break;
    }
    
    // Extraction EXACTE comme dans le code
    extractMetadataField(trimmedLine, 'legis:status', metadata, 'status');
    extractMetadataField(trimmedLine, 'dcterms:title', metadata, 'title');
    extractMetadataField(trimmedLine, 'dcterms:identifier', metadata, 'identifier');
    
    // Log des lignes importantes
    if (trimmedLine.includes('legis:status')) {
      console.log(`🎯 STATUS TROUVÉ ligne ${i + 1}: ${trimmedLine}`);
      console.log(`   Regex match: ${trimmedLine.match(/"([^"]+)"/)}`);
      console.log(`   Valeur extraite: "${metadata.status}"`);
    }
    
    if (trimmedLine.includes('dcterms:title')) {
      console.log(`📄 TITRE ligne ${i + 1}: ${trimmedLine}`);
    }
  }
}

console.log('');
console.log('=== RÉSULTAT EXTRACTION ===');
console.log('Métadonnées extraites pour A-3.001:');
console.log(JSON.stringify(metadata, null, 2));

console.log('');
console.log('=== SIMULATION MAPPING INDEX ===');

// Simulation exacte de la logique d'indexation (ligne 654-655)
const indexDoc = {
  legalIdentifier: 'A-3.001',
  title: metadata.title || null,
  legalStatus: null
};

if (metadata.status) {
  indexDoc.legalStatus = metadata.status;
}

console.log('Document qui sera envoyé à l\'index:');
console.log(JSON.stringify(indexDoc, null, 2));

console.log('');
console.log('=== DIAGNOSTIC ===');

if (metadata.status === "en vigueur") {
  console.log('✅ ALGORITHME CORRECT: A-3.001 devrait avoir legalStatus: "en vigueur"');
  console.log('🔍 PROBLÈME AILLEURS: Vérifier la chaîne d\'indexation après extractMetadataField');
} else if (metadata.status) {
  console.log(`❌ STATUT INATTENDU: "${metadata.status}" au lieu de "en vigueur"`);
} else {
  console.log('❌ AUCUN STATUT EXTRAIT: Problème avec extractMetadataField');
}

console.log('');
console.log('=== RECOMMANDATION ===');
console.log('🎯 Prochaine étape: Tracer l\'exécution complète de indexPopulatorFromTTL.ts');
console.log('🎯 pour voir où le statut "en vigueur" de A-3.001 se perd dans la chaîne');
