/**
 * Deploy Enhanced Pipeline - Mise à jour de l'index avec métadonnées SPARQL
 * Déploie le pipeline amélioré pour corriger les statuts dans l'index Azure Search
 */

const path = require('path');

// Configuration
const config = {
    mode: 'full', // Full reindex pour corriger les métadonnées
    indexName: 'legis-qc-index-full-01', // Index de production
    batchSize: 50,
    validateCriticalDocs: true
};

async function deployEnhancedPipeline() {
    console.log('🚀 === DEPLOY ENHANCED PIPELINE WITH SPARQL ===');
    console.log(`📋 Configuration:`);
    console.log(`   Mode: ${config.mode}`);
    console.log(`   Index: ${config.indexName}`);
    console.log(`   Batch Size: ${config.batchSize}`);
    console.log('');
    
    try {
        // 1. Validation préalable
        console.log('🔍 Pre-deployment validation...');
        
        // Vérifier que SPARQL fonctionne
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const fs = require('fs');
        
        const execAsync = promisify(exec);
        
        const ttlPath = '/media/psf/Developpement/00-GIT/cotechnoe-kb-legis-qc/etl/extract/rdf/legisquebec-metadata.ttl';
        
        if (!fs.existsSync(ttlPath)) {
            throw new Error(`TTL source not found: ${ttlPath}`);
        }
        
        // Vérifier Apache Jena
        const jenaPath = '/opt/jena';
        if (!fs.existsSync(path.join(jenaPath, 'bin/sparql'))) {
            throw new Error(`Apache Jena not found at: ${jenaPath}`);
        }
        
        console.log('✅ TTL source and Apache Jena validated');
        
        // 2. Test rapide SPARQL sur documents critiques
        console.log('🧪 Testing critical documents extraction...');
        
        const tempDir = '/tmp/deploy-test';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const testQuery = `
PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
PREFIX legal: <http://www.legalruleml.org/ns/>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT ?legalIdentifier ?status
WHERE {
    ?doc a legal:LegalRule ;
         dcterms:identifier ?legalIdentifier .
    
    FILTER(?legalIdentifier IN ("A-3", "A-3.001"))
    OPTIONAL { ?doc legis:status ?status }
}
        `;
        
        const queryFile = path.join(tempDir, 'critical-test.sparql');
        fs.writeFileSync(queryFile, testQuery);
        
        const command = `cd "${jenaPath}/bin" && ./sparql --data="${ttlPath}" --query="${queryFile}" --results=JSON`;
        const { stdout } = await execAsync(command);
        
        const results = JSON.parse(stdout);
        let a3001Valid = false;
        let a3Valid = false;
        
        if (results.results && results.results.bindings) {
            for (const binding of results.results.bindings) {
                const id = binding.legalIdentifier?.value;
                const status = binding.status?.value;
                
                if (id === 'A-3.001' && status === 'en vigueur') {
                    a3001Valid = true;
                    console.log('✅ A-3.001 status "en vigueur" confirmed');
                }
                if (id === 'A-3' && status === 'abrogée') {
                    a3Valid = true;
                    console.log('✅ A-3 status "abrogée" confirmed');
                }
            }
        }
        
        if (!a3001Valid || !a3Valid) {
            throw new Error('Critical documents validation failed');
        }
        
        // 3. Instructions de déploiement
        console.log('\n🎯 DEPLOYMENT READY!');
        console.log('');
        console.log('📋 DEPLOYMENT INSTRUCTIONS:');
        console.log('');
        console.log('1. 🔧 Update indexPopulatorFromTTL.ts compilation:');
        console.log('   cd /media/psf/Developpement/00-GIT/legis-qc');
        console.log('   npm run build');
        console.log('');
        console.log('2. 🚀 Run enhanced population (FULL reindex):');
        console.log('   cd /media/psf/Developpement/00-GIT/legis-qc');
        console.log('   node lib/indexers/setup.js --mode=full --enhanced-sparql');
        console.log('');
        console.log('3. 🔍 Validate results:');
        console.log('   - Check A-3.001 has legalStatus: "en vigueur"');
        console.log('   - Check A-3 has legalStatus: "abrogée"');
        console.log('   - Verify intelligent sorting still works');
        console.log('');
        console.log('4. 🎯 Expected outcomes:');
        console.log('   - A-3.001 position 12 with status "en vigueur"');
        console.log('   - A-3 position 13 with status "abrogée"');
        console.log('   - All 993 documents with proper metadata');
        console.log('');
        
        // 4. Créer un script de validation post-déploiement
        const validationScript = `
/**
 * Post-deployment validation script
 */

const { SearchClient, AzureKeyCredential } = require("@azure/search-documents");

async function validateDeployment() {
    console.log('🔍 Validating enhanced pipeline deployment...');
    
    const searchClient = new SearchClient(
        "https://cognitiveailegisqcsearch.search.windows.net",
        "${config.indexName}",
        new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY)
    );
    
    try {
        // Search for A-3.001 and A-3
        const searchResults = await searchClient.search('A-3', {
            select: ['legalIdentifier', 'title', 'legalStatus'],
            top: 50
        });
        
        let a3001 = null;
        let a3 = null;
        
        for await (const result of searchResults.results) {
            const doc = result.document;
            if (doc.legalIdentifier === 'A-3.001') {
                a3001 = doc;
            } else if (doc.legalIdentifier === 'A-3') {
                a3 = doc;
            }
        }
        
        console.log('\\n📊 VALIDATION RESULTS:');
        
        if (a3001) {
            console.log(\`✅ A-3.001 found: status="\${a3001.legalStatus}"\`);
            if (a3001.legalStatus === 'en vigueur') {
                console.log('🎉 A-3.001 status CORRECTLY SET to "en vigueur"!');
            } else {
                console.log(\`❌ A-3.001 status should be "en vigueur", got "\${a3001.legalStatus}"\`);
            }
        } else {
            console.log('❌ A-3.001 not found in search results');
        }
        
        if (a3) {
            console.log(\`✅ A-3 found: status="\${a3.legalStatus}"\`);
            if (a3.legalStatus === 'abrogée') {
                console.log('✅ A-3 status correctly set to "abrogée"');
            } else {
                console.log(\`❌ A-3 status should be "abrogée", got "\${a3.legalStatus}"\`);
            }
        } else {
            console.log('❌ A-3 not found in search results');
        }
        
        const success = a3001?.legalStatus === 'en vigueur' && a3?.legalStatus === 'abrogée';
        
        console.log(\`\\n🎯 DEPLOYMENT VALIDATION: \${success ? 'SUCCESS' : 'FAILED'}\`);
        
        return success;
        
    } catch (error) {
        console.error('❌ Validation failed:', error);
        return false;
    }
}

validateDeployment()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Validation script failed:', error);
        process.exit(1);
    });
        `;
        
        const validationFile = '/media/psf/Developpement/00-GIT/legis-qc/tests/validate-deployment.js';
        fs.writeFileSync(validationFile, validationScript);
        
        console.log(`📝 Validation script created: ${validationFile}`);
        console.log('');
        console.log('5. 🧪 Post-deployment validation:');
        console.log('   node tests/validate-deployment.js');
        console.log('');
        
        // Cleanup
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {
            console.warn('⚠️  Failed to cleanup temp files:', e);
        }
        
        return {
            success: true,
            readyForDeployment: true,
            criticalDocsValidated: a3001Valid && a3Valid
        };
        
    } catch (error) {
        console.error('❌ Deployment preparation failed:', error);
        return { success: false, error: error.message };
    }
}

// Execute deployment preparation
deployEnhancedPipeline()
    .then(result => {
        console.log(`🏁 Deployment Preparation: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        
        if (result.success) {
            console.log('🚀 Enhanced pipeline is ready for deployment!');
            console.log('🔥 SPARQL metadata extraction validated');
            console.log('🎯 Run the deployment instructions above');
        } else {
            console.log(`❌ Error: ${result.error}`);
        }
        
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Deployment script failed:', error);
        process.exit(1);
    });
