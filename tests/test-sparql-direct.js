/**
 * Test SPARQL Direct - Utilisation directe d'Apache Jena
 * Teste l'extraction SPARQL sans modules TypeScript
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

const config = {
    ttlPath: '/media/psf/Developpement/00-GIT/cotechnoe-kb-legis-qc/etl/extract/rdf/legisquebec-metadata.ttl',
    tempDir: '/tmp/sparql-test',
    jenaPath: '/opt/jena'
};

function ensureTempDir() {
    if (!fs.existsSync(config.tempDir)) {
        fs.mkdirSync(config.tempDir, { recursive: true });
    }
}

function buildTestQuery() {
    return `
PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
PREFIX legal: <http://www.legalruleml.org/ns/>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX schema: <https://schema.org/>

SELECT ?legalIdentifier ?title ?status ?abrogatedBy ?downloadStatus
WHERE {
    ?doc a legal:LegalRule ;
         dcterms:identifier ?legalIdentifier .
    
    # Filter for A-3 and A-3.001 only
    FILTER(?legalIdentifier IN ("A-3", "A-3.001"))
    
    # Title
    OPTIONAL { ?doc dcterms:title ?title }
    
    # Status - CRITIQUE: doit capturer les valeurs avec @fr
    OPTIONAL { ?doc legis:status ?status }
    
    # AbrogatedBy
    OPTIONAL { 
        ?doc legis:abrogatedBy ?abrogatedByURI .
        BIND(REPLACE(STR(?abrogatedByURI), ".*ontology/loi/", "") AS ?abrogatedBy)
    }
    
    # Download status
    OPTIONAL { ?doc legis:downloadStatus ?downloadStatus }
}
ORDER BY ?legalIdentifier
    `;
}

async function testSPARQLDirect() {
    console.log('🧪 === TEST SPARQL DIRECT AVEC APACHE JENA ===');
    console.log('');
    
    ensureTempDir();
    
    const queryFile = path.join(config.tempDir, 'test-query.sparql');
    const outputFile = path.join(config.tempDir, 'results.json');
    
    try {
        // 1. Write SPARQL query
        console.log('📝 Writing SPARQL query...');
        const query = buildTestQuery();
        fs.writeFileSync(queryFile, query);
        console.log(`Query saved to: ${queryFile}`);
        
        // 2. Execute SPARQL with Apache Jena
        console.log('🚀 Executing SPARQL query...');
        const command = `cd "${config.jenaPath}/bin" && ./sparql --data="${config.ttlPath}" --query="${queryFile}" --results=JSON`;
        
        console.log(`Command: ${command}`);
        const { stdout, stderr } = await execAsync(command);
        
        if (stderr) {
            console.warn('⚠️  SPARQL stderr:', stderr);
        }
        
        // Save output for analysis
        fs.writeFileSync(outputFile, stdout);
        console.log(`Results saved to: ${outputFile}`);
        
        // 3. Parse and analyze results
        console.log('📊 Parsing SPARQL results...');
        const results = JSON.parse(stdout);
        
        console.log('Raw results structure:', Object.keys(results));
        
        if (results.results && results.results.bindings) {
            const bindings = results.results.bindings;
            console.log(`Found ${bindings.length} result bindings`);
            
            // Process each binding
            const documents = {};
            
            for (const binding of bindings) {
                const legalId = binding.legalIdentifier?.value;
                if (!legalId) continue;
                
                if (!documents[legalId]) {
                    documents[legalId] = { legalIdentifier: legalId };
                }
                
                // Extract all fields
                if (binding.title?.value) {
                    documents[legalId].title = binding.title.value;
                }
                if (binding.status?.value) {
                    documents[legalId].status = binding.status.value;
                }
                if (binding.abrogatedBy?.value) {
                    documents[legalId].abrogatedBy = binding.abrogatedBy.value;
                }
                if (binding.downloadStatus?.value) {
                    documents[legalId].downloadStatus = binding.downloadStatus.value;
                }
            }
            
            // 4. Validate critical documents
            console.log('\n📋 EXTRACTED DOCUMENTS:');
            
            const a3 = documents['A-3'];
            const a3001 = documents['A-3.001'];
            
            if (a3001) {
                console.log(`✅ A-3.001 found:`);
                console.log(`   Title: "${a3001.title}"`);
                console.log(`   Status: "${a3001.status}"`);
                console.log(`   Download: "${a3001.downloadStatus}"`);
                
                if (a3001.status === 'en vigueur') {
                    console.log('🎉 A-3.001 status "en vigueur" CORRECTLY EXTRACTED!');
                } else {
                    console.log(`❌ A-3.001 status expected "en vigueur", got "${a3001.status}"`);
                }
            } else {
                console.log('❌ A-3.001 not found in results');
            }
            
            if (a3) {
                console.log(`✅ A-3 found:`);
                console.log(`   Title: "${a3.title}"`);
                console.log(`   Status: "${a3.status}"`);
                console.log(`   AbrogatedBy: "${a3.abrogatedBy}"`);
                
                if (a3.status === 'abrogée') {
                    console.log('✅ A-3 status "abrogée" correctly extracted');
                } else {
                    console.log(`❌ A-3 status expected "abrogée", got "${a3.status}"`);
                }
            } else {
                console.log('❌ A-3 not found in results');
            }
            
            // 5. Conclusion
            console.log('\n🎯 SPARQL TEST CONCLUSION:');
            const success = a3001?.status === 'en vigueur' && a3?.status === 'abrogée';
            
            if (success) {
                console.log('✅ SPARQL EXTRACTION SUCCESSFUL!');
                console.log('✅ Language tags @fr handled correctly');
                console.log('✅ Ready to integrate SPARQL into pipeline');
            } else {
                console.log('❌ SPARQL extraction needs refinement');
                console.log('🔍 Check SPARQL query and TTL structure');
            }
            
            return { success, documents };
            
        } else {
            console.log('❌ No results found in SPARQL output');
            console.log('Raw output:', stdout.substring(0, 500));
            return { success: false, error: 'No results' };
        }
        
    } catch (error) {
        console.error('❌ SPARQL test failed:', error);
        return { success: false, error: error.message };
    }
}

// Execute test
testSPARQLDirect()
    .then(result => {
        console.log(`\n🏁 SPARQL Test: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        if (result.error) {
            console.log(`❌ Error: ${result.error}`);
        }
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test script failed:', error);
        process.exit(1);
    });
