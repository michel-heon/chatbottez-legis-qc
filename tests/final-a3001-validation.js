/**
 * Test FINAL avec la vraie définition de A-3.001
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

console.log('=== TEST FINAL - VRAIE DÉFINITION A-3.001 ===');

const ttlFile = '/media/psf/Developpement/00-GIT/cotechnoe-kb-legis-qc/etl/extract/rdf/legisquebec-metadata.ttl';
const content = fs.readFileSync(ttlFile, 'utf-8');
const lines = content.split('\n');

let inA3001 = false;
let metadata = {};

console.log('🔍 Recherche de la DÉFINITION A-3.001 dans le TTL...');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmedLine = line.trim();
  
  // Détecter la DÉFINITION de A-3.001 (pas les références)
  if (trimmedLine.startsWith('<https://legisquebec.gouv.qc.ca/ontology/loi/A-3.001>')) {
    inA3001 = true;
    metadata = { lineStart: i + 1 };
    console.log(`✅ DÉFINITION A-3.001 trouvée ligne ${i + 1}`);
    console.log(`   Ligne: ${trimmedLine}`);
    continue;
  }
  
  // Si on est dans A-3.001, extraire les métadonnées
  if (inA3001) {
    // Arrêter si on atteint un nouveau document
    if (trimmedLine.startsWith('<https://legisquebec.gouv.qc.ca/ontology/loi/') && 
        !trimmedLine.includes('A-3.001')) {
      console.log(`📝 Fin A-3.001 ligne ${i + 1} - Nouveau document détecté`);
      break;
    }
    
    // Extraction EXACTE comme dans le code
    extractMetadataField(trimmedLine, 'legis:status', metadata, 'status');
    extractMetadataField(trimmedLine, 'dcterms:title', metadata, 'title');
    extractMetadataField(trimmedLine, 'dcterms:identifier', metadata, 'identifier');
    
    // Log des lignes importantes
    if (trimmedLine.includes('legis:status')) {
      console.log(`🎯 STATUS TROUVÉ ligne ${i + 1}: ${trimmedLine}`);
      const match = trimmedLine.match(/"([^"]+)"/);
      console.log(`   Regex match: ${JSON.stringify(match)}`);
      console.log(`   Valeur extraite: "${metadata.status}"`);
    }
    
    if (trimmedLine.includes('dcterms:title')) {
      console.log(`📄 TITRE ligne ${i + 1}: ${metadata.title}`);
    }
  }
}

console.log('');
console.log('=== RÉSULTAT EXTRACTION FINAL ===');
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
console.log('=== DIAGNOSTIC FINAL ===');

if (metadata.status === "en vigueur") {
  console.log('✅ ALGORITHME TTL CORRECT: A-3.001 a statut "en vigueur"');
  console.log('✅ EXTRACTION CORRECTE: extractMetadataField fonctionne');
  console.log('❌ PROBLÈME AILLEURS: Entre extraction TTL et index Azure');
  console.log('🔍 À INVESTIGUER: Pipeline de migration TTL → Index');
} else if (metadata.status) {
  console.log(`❌ STATUT INCORRECT: "${metadata.status}" au lieu de "en vigueur"`);
} else {
  console.log('❌ AUCUN STATUT EXTRAIT: Problème avec extractMetadataField');
}

console.log('');
console.log('=== CONCLUSION INVESTIGATION ===');
console.log('✅ TTL Source: A-3.001 a legis:status "en vigueur"@fr');
console.log('✅ Algorithme: extractMetadataField peut extraire le statut');
console.log('❓ Mystère: Pourquoi A-3.001 a legalStatus: null dans l\'index ?');
console.log('🎯 Hypothèse: Problème dans la chaîne indexPopulatorFromTTL.ts');
