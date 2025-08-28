/**
 * Debug spécifique de l'extraction du statut pour A-3.001
 */

const fs = require('fs');

const ttlFile = '/media/psf/Developpement/00-GIT/cotechnoe-kb-legis-qc/etl/extract/rdf/legisquebec-metadata.ttl';
const content = fs.readFileSync(ttlFile, 'utf-8');

console.log('=== DEBUG EXTRACTION STATUT A-3.001 ===');

// Isoler la section A-3.001
const a3001Match = content.match(/<https:\/\/legisquebec\.gouv\.qc\.ca\/ontology\/loi\/A-3\.001>[\s\S]*?(?=<https:\/\/legisquebec\.gouv\.qc\.ca\/ontology\/loi\/A-[^3]|$)/);

if (a3001Match) {
  const a3001Section = a3001Match[0];
  console.log('📄 Section TTL A-3.001 trouvée');
  console.log('');
  
  const lines = a3001Section.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (trimmedLine.includes('legis:status')) {
      console.log(`✅ LIGNE TROUVÉE (${i}): ${trimmedLine}`);
      
      // Test des différentes regex
      const regex1 = /"([^"]+)"/;
      const regex2 = /"([^"]+)"@/;
      const regex3 = /"([^"]+)"@\w+/;
      
      console.log(`   Regex simple: ${regex1.test(trimmedLine)} - ${regex1.exec(trimmedLine)?.[1]}`);
      console.log(`   Regex avec @: ${regex2.test(trimmedLine)} - ${regex2.exec(trimmedLine)?.[1]}`);
      console.log(`   Regex complete: ${regex3.test(trimmedLine)} - ${regex3.exec(trimmedLine)?.[1]}`);
      
      // Simulation exacte de extractMetadataField
      const metadata = {};
      if (trimmedLine.includes('legis:status')) {
        const match = trimmedLine.match(/"([^"]+)"/);
        if (match) {
          metadata.status = match[1];
          console.log(`   ✅ EXTRACTION RÉUSSIE: "${metadata.status}"`);
        } else {
          console.log(`   ❌ ÉCHEC EXTRACTION avec regex /"([^"]+)"/`);
        }
      }
      
      break;
    }
  }
} else {
  console.log('❌ Section A-3.001 non trouvée');
}

console.log('');
console.log('=== COMPARAISON AVEC A-3 ===');

// Isoler A-3 pour comparaison
const a3Match = content.match(/<https:\/\/legisquebec\.gouv\.qc\.ca\/ontology\/loi\/A-3>\s[\s\S]*?legis:status\s+"([^"]+)"[^<]*(?=<https:\/\/legisquebec\.gouv\.qc\.ca\/ontology\/loi\/A-3)/);

if (a3Match) {
  console.log('📄 A-3 status pattern trouvé');
  const a3Section = content.match(/<https:\/\/legisquebec\.gouv\.qc\.ca\/ontology\/loi\/A-3>\s[\s\S]*?(?=<https:\/\/legisquebec\.gouv\.qc\.ca\/ontology\/loi\/A-3\.001)/);
  
  if (a3Section) {
    const lines = a3Section[0].split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.includes('legis:status')) {
        console.log(`✅ A-3 LIGNE: ${trimmedLine}`);
        const match = trimmedLine.match(/"([^"]+)"/);
        if (match) {
          console.log(`   ✅ A-3 EXTRACTION: "${match[1]}"`);
        }
        break;
      }
    }
  }
}
