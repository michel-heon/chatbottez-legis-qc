/**
 * Investigation SPARQL du problème de statut légal A-3.001
 * Utilise Apache Jena SPARQL pour analyser les ontologies TTL
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration basée sur .env.local.user
const config = {
  ttlSourcePath: '/media/psf/Developpement/00-GIT/cotechnoe-kb-legis-qc/etl/extract/rdf/legisquebec-metadata.ttl',
  jenaPath: '/opt/jena/bin',
  tempDir: '/tmp/sparql-investigation'
};

/**
 * Exécute une requête SPARQL sur le fichier TTL
 */
async function executeSPARQLQuery(query, description) {
  console.log(`\n🔍 ${description}`);
  console.log(`SPARQL: ${query.replace(/\s+/g, ' ').trim()}`);
  
  try {
    // Créer le répertoire temporaire
    if (!fs.existsSync(config.tempDir)) {
      fs.mkdirSync(config.tempDir, { recursive: true });
    }
    
    // Écrire la requête dans un fichier temporaire
    const queryFile = path.join(config.tempDir, 'query.sparql');
    fs.writeFileSync(queryFile, query);
    
    // Exécuter la requête SPARQL avec Apache Jena
    const command = `${config.jenaPath}/sparql --data="${config.ttlSourcePath}" --query="${queryFile}" --results=TSV`;
    
    console.log(`📦 Commande: ${command}`);
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('INFO') && !stderr.includes('WARN')) {
      console.error(`❌ Erreur SPARQL: ${stderr}`);
      return null;
    }
    
    console.log(`✅ Résultats:`);
    console.log(stdout);
    
    return stdout;
    
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution SPARQL: ${error.message}`);
    return null;
  }
}

/**
 * Valide la structure du fichier TTL avec RIOT
 */
async function validateTTLStructure() {
  console.log('\n=== VALIDATION STRUCTURE TTL AVEC RIOT ===');
  
  try {
    // Valider la syntaxe TTL
    const command = `${config.jenaPath}/riot --validate "${config.ttlSourcePath}"`;
    console.log(`📦 Validation: ${command}`);
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('INFO')) {
      console.log(`⚠️  Messages: ${stderr}`);
    }
    
    console.log(`✅ Structure TTL validée`);
    
    // Compter les triples
    const countCommand = `${config.jenaPath}/riot --count "${config.ttlSourcePath}"`;
    const { stdout: countOutput } = await execAsync(countCommand);
    
    console.log(`📊 ${countOutput.trim()}`);
    
  } catch (error) {
    console.error(`❌ Erreur validation TTL: ${error.message}`);
  }
}

/**
 * Recherche spécifique pour A-3.001 et A-3
 */
async function investigateA3vsA3001() {
  console.log('\n=== INVESTIGATION SPARQL A-3 vs A-3.001 ===');
  
  // Requête 1: Trouver tous les documents A-3*
  const queryA3All = `
    PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    PREFIX legal: <http://www.legalruleml.org/ns/>
    
    SELECT ?document ?identifier ?title ?status ?abrogatedBy
    WHERE {
      ?document a legal:LegalRule .
      ?document dcterms:identifier ?identifier .
      FILTER(STRSTARTS(?identifier, "A-3"))
      
      OPTIONAL { ?document dcterms:title ?title }
      OPTIONAL { ?document legis:status ?status }
      OPTIONAL { ?document legis:abrogatedBy ?abrogatedBy }
    }
    ORDER BY ?identifier
  `;
  
  await executeSPARQLQuery(queryA3All, "Recherche tous les documents A-3*");
  
  // Requête 2: Focus spécifique sur A-3.001
  const queryA3001 = `
    PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    
    SELECT ?document ?property ?value
    WHERE {
      ?document dcterms:identifier "A-3.001" .
      ?document ?property ?value .
    }
    ORDER BY ?property
  `;
  
  await executeSPARQLQuery(queryA3001, "Toutes les propriétés de A-3.001");
  
  // Requête 3: Focus spécifique sur A-3
  const queryA3 = `
    PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    
    SELECT ?document ?property ?value
    WHERE {
      ?document dcterms:identifier "A-3" .
      ?document ?property ?value .
    }
    ORDER BY ?property
  `;
  
  await executeSPARQLQuery(queryA3, "Toutes les propriétés de A-3");
  
  // Requête 4: Recherche de statuts légaux existants
  const queryStatusSample = `
    PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    
    SELECT ?status (COUNT(*) as ?count)
    WHERE {
      ?document dcterms:identifier ?identifier .
      ?document legis:status ?status .
    }
    GROUP BY ?status
    ORDER BY DESC(?count)
    LIMIT 10
  `;
  
  await executeSPARQLQuery(queryStatusSample, "Échantillon des statuts légaux utilisés");
}

/**
 * Recherche de patterns de statut légal
 */
async function analyzeStatusPatterns() {
  console.log('\n=== ANALYSE PATTERNS STATUT LÉGAL ===');
  
  // Requête 1: Documents sans statut
  const queryNoStatus = `
    PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    
    SELECT ?identifier ?title
    WHERE {
      ?document dcterms:identifier ?identifier .
      OPTIONAL { ?document dcterms:title ?title }
      FILTER NOT EXISTS { ?document legis:status ?status }
    }
    LIMIT 10
  `;
  
  await executeSPARQLQuery(queryNoStatus, "Documents SANS statut légal (échantillon)");
  
  // Requête 2: Documents avec statut "en vigueur"
  const queryEnVigueur = `
    PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    
    SELECT ?identifier ?title
    WHERE {
      ?document dcterms:identifier ?identifier .
      ?document legis:status "en vigueur" .
      OPTIONAL { ?document dcterms:title ?title }
    }
    LIMIT 10
  `;
  
  await executeSPARQLQuery(queryEnVigueur, "Documents avec statut 'en vigueur'");
  
  // Requête 3: Documents avec statut "abrogée"
  const queryAbrogee = `
    PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    
    SELECT ?identifier ?title
    WHERE {
      ?document dcterms:identifier ?identifier .
      ?document legis:status "abrogée" .
      OPTIONAL { ?document dcterms:title ?title }
    }
    LIMIT 10
  `;
  
  await executeSPARQLQuery(queryAbrogee, "Documents avec statut 'abrogée'");
}

/**
 * Investigation avancée des relations entre A-3 et A-3.001
 */
async function investigateA3Relationship() {
  console.log('\n=== INVESTIGATION RELATION A-3 ↔ A-3.001 ===');
  
  // Requête 1: Relation d'abrogation
  const queryAbrogation = `
    PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    
    SELECT ?oldDoc ?oldId ?newDoc ?newId ?relationship
    WHERE {
      {
        ?oldDoc dcterms:identifier "A-3" .
        ?newDoc dcterms:identifier "A-3.001" .
        ?oldDoc ?relationship ?newDoc .
      }
      UNION
      {
        ?newDoc dcterms:identifier "A-3.001" .
        ?oldDoc dcterms:identifier "A-3" .
        ?newDoc ?relationship ?oldDoc .
      }
      UNION
      {
        ?oldDoc dcterms:identifier "A-3" .
        ?oldDoc legis:abrogatedBy ?abrogatedBy .
        FILTER(CONTAINS(STR(?abrogatedBy), "A-3.001"))
      }
    }
  `;
  
  await executeSPARQLQuery(queryAbrogation, "Relations directes entre A-3 et A-3.001");
  
  // Requête 2: Métadonnées temporelles
  const queryTemporal = `
    PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    
    SELECT ?identifier ?created ?modified ?issued ?valid ?available
    WHERE {
      ?document dcterms:identifier ?identifier .
      FILTER(?identifier = "A-3" || ?identifier = "A-3.001")
      
      OPTIONAL { ?document dcterms:created ?created }
      OPTIONAL { ?document dcterms:modified ?modified }
      OPTIONAL { ?document dcterms:issued ?issued }
      OPTIONAL { ?document dcterms:valid ?valid }
      OPTIONAL { ?document dcterms:available ?available }
    }
    ORDER BY ?identifier
  `;
  
  await executeSPARQLQuery(queryTemporal, "Métadonnées temporelles A-3 vs A-3.001");
}

/**
 * Diagnostic complet avec SPARQL
 */
async function diagnosticSPARQLComplete() {
  console.log('\n🚀 === DIAGNOSTIC SPARQL COMPLET PROBLÈME A-3.001 ===');
  
  console.log('\n📋 Plan d\'investigation:');
  console.log('1. Validation structure TTL avec RIOT');
  console.log('2. Investigation A-3 vs A-3.001');
  console.log('3. Analyse patterns de statut légal');
  console.log('4. Investigation relations entre documents');
  console.log('');
  
  try {
    // Vérifier que le fichier TTL existe
    if (!fs.existsSync(config.ttlSourcePath)) {
      console.error(`❌ Fichier TTL non trouvé: ${config.ttlSourcePath}`);
      return;
    }
    
    console.log(`📖 Fichier TTL: ${config.ttlSourcePath}`);
    console.log(`⚙️  Apache Jena: ${config.jenaPath}`);
    
    // 1. Validation structure
    await validateTTLStructure();
    
    // 2. Investigation A-3 vs A-3.001
    await investigateA3vsA3001();
    
    // 3. Analyse patterns
    await analyzeStatusPatterns();
    
    // 4. Relations
    await investigateA3Relationship();
    
    console.log('\n✅ === DIAGNOSTIC SPARQL TERMINÉ ===');
    
  } catch (error) {
    console.error(`❌ Erreur diagnostic: ${error.message}`);
  } finally {
    // Nettoyer les fichiers temporaires
    if (fs.existsSync(config.tempDir)) {
      fs.rmSync(config.tempDir, { recursive: true, force: true });
    }
  }
}

// Exécuter le diagnostic
if (require.main === module) {
  diagnosticSPARQLComplete();
}

module.exports = {
  diagnosticSPARQLComplete,
  executeSPARQLQuery,
  validateTTLStructure
};
