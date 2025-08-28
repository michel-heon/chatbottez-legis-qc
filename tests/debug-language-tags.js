/**
 * Test corrigé pour tenir compte des tags de langue @fr dans le TTL
 */

const fs = require('fs');

// Configuration
const config = {
  ttlSourcePath: '/media/psf/Developpement/00-GIT/cotechnoe-kb-legis-qc/etl/extract/rdf/legisquebec-metadata.ttl',
};

// Fonction corrigée pour extraire les métadonnées avec gestion des tags de langue
function extractMetadataFieldWithLanguage(line, property, metadata, key) {
  if (line.includes(property)) {
    // Pattern amélioré pour capturer les valeurs avec ou sans tags de langue
    const patterns = [
      /"([^"]+)"@fr/,  // Avec tag @fr
      /"([^"]+)"/,     // Sans tag de langue
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        metadata[key] = match[1];
        console.log(`    🎯 Extracted ${key}: "${match[1]}" from line: ${line.trim()}`);
        return;
      }
    }
  }
}

function investigateLanguageTags() {
  console.log('=== INVESTIGATION TAGS DE LANGUE (@fr) ===');
  console.log('Objectif: Vérifier si le problème vient des tags @fr');
  console.log('');
  
  if (!fs.existsSync(config.ttlSourcePath)) {
    console.error(`❌ Fichier TTL source non trouvé: ${config.ttlSourcePath}`);
    return;
  }
  
  const ttlContent = fs.readFileSync(config.ttlSourcePath, 'utf-8');
  const lines = ttlContent.split('\n');
  
  // Variables pour tracker les documents
  let currentLegalId = null;
  let currentMetadata = {};
  const extractedDocuments = {};
  
  console.log('🔍 Parsing TTL avec gestion des tags de langue...');
  
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
        if (currentLegalId === 'A-3' || currentLegalId === 'A-3.001') {
          console.log(`\n📄 === DÉBUT DOCUMENT ${currentLegalId} ===`);
        }
      }
    }
    
    // Extraire les métadonnées si on est dans un document ciblé
    if (currentLegalId && (currentLegalId === 'A-3' || currentLegalId === 'A-3.001')) {
      // Extraction du statut légal avec support des tags de langue
      if (trimmedLine.includes('legis:status')) {
        console.log(`  🔍 Status line found: ${trimmedLine}`);
        extractMetadataFieldWithLanguage(trimmedLine, 'legis:status', currentMetadata, 'status');
      }
      
      // Autres métadonnées importantes
      if (trimmedLine.includes('dcterms:title')) {
        console.log(`  🔍 Title line found: ${trimmedLine}`);
        extractMetadataFieldWithLanguage(trimmedLine, 'dcterms:title', currentMetadata, 'title');
      }
      
      if (trimmedLine.includes('legis:abrogatedBy')) {
        console.log(`  🔍 AbrogatedBy line found: ${trimmedLine}`);
        extractMetadataFieldWithLanguage(trimmedLine, 'legis:abrogatedBy', currentMetadata, 'abrogatedBy');
      }
    }
  }
  
  // Sauvegarder le dernier document
  if (currentLegalId && Object.keys(currentMetadata).length > 0) {
    extractedDocuments[currentLegalId] = { ...currentMetadata };
  }
  
  console.log('\n=== RÉSULTATS PARSING AVEC TAGS DE LANGUE ===');
  
  const a3001 = extractedDocuments['A-3.001'];
  const a3 = extractedDocuments['A-3'];
  
  if (a3001) {
    console.log('\n📄 A-3.001 (AVEC gestion tags @fr):');
    console.log(`   Titre: ${a3001.title || 'N/A'}`);
    console.log(`   Status: "${a3001.status}" (${typeof a3001.status})`);
    console.log(`   AbrogatedBy: ${a3001.abrogatedBy || 'N/A'}`);
  } else {
    console.log('\n❌ A-3.001 non trouvé');
  }
  
  if (a3) {
    console.log('\n📄 A-3 (AVEC gestion tags @fr):');
    console.log(`   Titre: ${a3.title || 'N/A'}`);
    console.log(`   Status: "${a3.status}" (${typeof a3.status})`);
    console.log(`   AbrogatedBy: ${a3.abrogatedBy || 'N/A'}`);
  } else {
    console.log('\n❌ A-3 non trouvé');
  }
  
  console.log('\n=== COMPARISON SPARQL vs JAVASCRIPT ===');
  console.log('SPARQL révèle:');
  console.log('  A-3.001 → "en vigueur"@fr');
  console.log('  A-3 → "abrogée"@fr');
  console.log('');
  console.log('JavaScript avec tags @fr:');
  console.log(`  A-3.001 → "${a3001?.status || 'NULL'}"`);
  console.log(`  A-3 → "${a3?.status || 'NULL'}"`);
  
  if (a3001?.status === 'en vigueur' && a3?.status === 'abrogée') {
    console.log('\n✅ PROBLÈME RÉSOLU ! Les tags @fr étaient le problème.');
    console.log('🔧 Solution: Mettre à jour extractMetadataField() pour gérer les tags de langue.');
  } else {
    console.log('\n🔍 Investigation continue nécessaire...');
  }
  
  return { a3001, a3 };
}

// Recherche directe dans le TTL pour confirmer
function directTTLSearch() {
  console.log('\n=== RECHERCHE DIRECTE DANS LE TTL ===');
  
  const ttlContent = fs.readFileSync(config.ttlSourcePath, 'utf-8');
  
  // Recherche A-3.001
  console.log('\n🔍 Recherche directe A-3.001:');
  const a3001Matches = ttlContent.match(/loi\/A-3\.001>[\s\S]*?legis:status\s+"([^"]+)"(@fr)?/g);
  if (a3001Matches) {
    console.log('  Matches trouvés:', a3001Matches);
  } else {
    console.log('  ❌ Aucun match trouvé pour A-3.001 status');
  }
  
  // Recherche A-3
  console.log('\n🔍 Recherche directe A-3:');
  const a3Matches = ttlContent.match(/loi\/A-3>[\s\S]*?legis:status\s+"([^"]+)"(@fr)?/g);
  if (a3Matches) {
    console.log('  Matches trouvés:', a3Matches);
  } else {
    console.log('  ❌ Aucun match trouvé pour A-3 status');
  }
  
  // Recherche patterns status généraux
  console.log('\n🔍 Recherche patterns status généraux:');
  const statusMatches = ttlContent.match(/legis:status\s+"([^"]+)"(@fr)?/g);
  if (statusMatches) {
    console.log(`  ${statusMatches.length} status trouvés dans le TTL`);
    console.log('  Premiers exemples:', statusMatches.slice(0, 5));
  }
}

// Exécuter les tests
console.log('🚀 === TEST RÉSOLUTION PROBLÈME TAGS @fr ===');
directTTLSearch();
investigateLanguageTags();
