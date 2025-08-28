/**
 * Test SPARQL Metadata Extractor
 * Valide l'extraction correcte des métadonnées avec tags @fr
 */

import { SPARQLMetadataExtractor } from '../src/indexers/sparqlMetadataExtractor';
import * as path from 'path';

async function testSPARQLExtraction() {
    console.log('🧪 === TEST SPARQL METADATA EXTRACTOR ===');
    console.log('');
    
    const ttlPath = '/media/psf/Developpement/00-GIT/cotechnoe-kb-legis-qc/etl/extract/rdf/legisquebec-metadata.ttl';
    const extractor = new SPARQLMetadataExtractor(ttlPath);
    
    try {
        console.log('🔍 Testing critical documents A-3 and A-3.001...');
        const { a3, a3001 } = await extractor.testCriticalDocuments();
        
        console.log('\n📋 VALIDATION RESULTS:');
        
        // Validate A-3.001
        if (a3001 && a3001.status === 'en vigueur') {
            console.log('✅ A-3.001: Status "en vigueur" CORRECTLY EXTRACTED');
            console.log(`   Full metadata: ${JSON.stringify(a3001, null, 2)}`);
        } else {
            console.log(`❌ A-3.001: Status "${a3001?.status || 'NULL'}" - EXTRACTION FAILED`);
            if (a3001) {
                console.log(`   Available metadata: ${JSON.stringify(a3001, null, 2)}`);
            }
        }
        
        // Validate A-3
        if (a3 && a3.status === 'abrogée') {
            console.log('✅ A-3: Status "abrogée" correctly extracted');
            console.log(`   AbrogatedBy: ${a3.abrogatedBy}`);
        } else {
            console.log(`❌ A-3: Status "${a3?.status || 'NULL'}" - extraction issue`);
            if (a3) {
                console.log(`   Available metadata: ${JSON.stringify(a3, null, 2)}`);
            }
        }
        
        console.log('\n🔍 Testing bulk extraction (first 10 documents)...');
        const allMetadata = await extractor.extractAllMetadata();
        
        console.log(`📊 Total documents extracted: ${allMetadata.length}`);
        
        // Show first 10 documents with status
        const documentsWithStatus = allMetadata.filter(doc => doc.status).slice(0, 10);
        console.log(`📋 First 10 documents with status:`);
        documentsWithStatus.forEach((doc, index) => {
            console.log(`   ${index + 1}. ${doc.legalIdentifier}: "${doc.status}"`);
        });
        
        // Count status distribution
        const statusCounts = new Map();
        allMetadata.forEach(doc => {
            if (doc.status) {
                statusCounts.set(doc.status, (statusCounts.get(doc.status) || 0) + 1);
            }
        });
        
        console.log('\n📈 Status distribution:');
        for (const [status, count] of statusCounts.entries()) {
            console.log(`   "${status}": ${count} documents`);
        }
        
        console.log('\n🎯 SPARQL EXTRACTION CONCLUSION:');
        if (a3001?.status === 'en vigueur') {
            console.log('✅ SPARQL correctly extracts A-3.001 status with @fr language tags');
            console.log('✅ Root cause resolved: Use SPARQL instead of regex parsing');
            console.log('✅ Ready to update indexPopulatorFromTTL.ts with SPARQL integration');
        } else {
            console.log('❌ SPARQL extraction still has issues - needs SPARQL query refinement');
        }
        
        return { success: a3001?.status === 'en vigueur', totalDocuments: allMetadata.length };
        
    } catch (error) {
        console.error('❌ SPARQL test failed:', error);
        return { success: false, error: error.message };
    } finally {
        extractor.cleanup();
    }
}

// Execute test
testSPARQLExtraction()
    .then(result => {
        console.log(`\n🏁 Test completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        if (result.totalDocuments) {
            console.log(`📊 Total documents: ${result.totalDocuments}`);
        }
        if (result.error) {
            console.log(`❌ Error: ${result.error}`);
        }
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test script failed:', error);
        process.exit(1);
    });
