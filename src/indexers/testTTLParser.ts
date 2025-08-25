/**
 * Test script for TTL Parser and SPARQL functionality
 */

import { getTTLParser, LegalSPARQLQueries } from './ttlParser';
// Test TTL parser without DocumentMapper dependency
// import { DocumentMapper } from './documentMapper.js';

/**
 * Test the TTL parser functionality
 */
async function testTTLParser() {
    console.log('🧪 Testing TTL Parser and SPARQL functionality...\n');
    
    try {
        // Initialize parser
        console.log('📄 Initializing TTL Parser...');
        const parser = await getTTLParser();
        
        // Get statistics
        console.log('\n📊 Data Statistics:');
        const stats = parser.getStatistics();
        console.log(`   Total Triples: ${stats.totalTriples.toLocaleString()}`);
        console.log(`   Total Documents: ${stats.totalDocuments.toLocaleString()}`);
        
        // Test 1: Get all documents (limited sample)
        console.log('\n🔍 Test 1: Getting sample documents...');
        const allDocs = await parser.getAllDocuments();
        console.log(`   Found ${allDocs.length} documents`);
        
        if (allDocs.length > 0) {
            const sample = allDocs.slice(0, 3);
            sample.forEach((doc, index) => {
                console.log(`   ${index + 1}. ${doc.legalIdentifier}: ${doc.title}`);
                console.log(`      Status: ${doc.status} | Keywords: ${doc.keywords.length}`);
            });
        }
        
        // Test 2: Search by specific identifier
        console.log('\n🔍 Test 2: Getting specific document (A-1)...');
        const specificDoc = await parser.getDocumentByIdentifier('A-1');
        if (specificDoc) {
            console.log(`   Found: ${specificDoc.title}`);
            console.log(`   Status: ${specificDoc.status}`);
            console.log(`   Keywords: ${specificDoc.keywords.slice(0, 5).join(', ')}...`);
            console.log(`   Description: ${specificDoc.description?.substring(0, 100)}...`);
        } else {
            console.log('   Document A-1 not found');
        }
        
        // Test 3: Search by status
        console.log('\n🔍 Test 3: Searching documents by status "en vigueur"...');
        const activeDocuments = await parser.searchByStatus('en vigueur');
        console.log(`   Found ${activeDocuments.length} active documents`);
        
        if (activeDocuments.length > 0) {
            const activeSample = activeDocuments.slice(0, 3);
            activeSample.forEach((doc, index) => {
                console.log(`   ${index + 1}. ${doc.legalIdentifier}: ${doc.title}`);
            });
        }
        
        // Test 4: Search by status "abrogée"
        console.log('\n🔍 Test 4: Searching documents by status "abrogée"...');
        const revokedDocuments = await parser.searchByStatus('abrogée');
        console.log(`   Found ${revokedDocuments.length} revoked documents`);
        
        if (revokedDocuments.length > 0) {
            const revokedSample = revokedDocuments.slice(0, 3);
            revokedSample.forEach((doc, index) => {
                console.log(`   ${index + 1}. ${doc.legalIdentifier}: ${doc.title}`);
            });
        }
        
        // Test 5: Get all keywords
        console.log('\n🔍 Test 5: Analyzing keywords distribution...');
        const keywordsMap = await parser.getAllKeywords();
        console.log(`   Documents with keywords: ${keywordsMap.size}`);
        
        let totalKeywords = 0;
        let maxKeywords = 0;
        let maxKeywordsDoc = '';
        
        for (const [docId, keywords] of keywordsMap.entries()) {
            totalKeywords += keywords.length;
            if (keywords.length > maxKeywords) {
                maxKeywords = keywords.length;
                maxKeywordsDoc = docId;
            }
        }
        
        if (keywordsMap.size > 0) {
            const avgKeywords = (totalKeywords / keywordsMap.size).toFixed(1);
            console.log(`   Average keywords per document: ${avgKeywords}`);
            console.log(`   Document with most keywords: ${maxKeywordsDoc} (${maxKeywords} keywords)`);
        }
        
        // Test 6: Document Mapper
        console.log('\n🔍 Test 6: Testing Document Mapper...');
        if (specificDoc) {
            // TODO: Re-enable when DocumentMapper is available
            // const enhancedDoc = DocumentMapper.mapTTLToEnrichedDocument(specificDoc);
            // console.log(`   Mapped document: ${DocumentMapper.getDocumentSummary(enhancedDoc)}`);
            
            // const validation = DocumentMapper.validateDocument(enhancedDoc);
            // console.log(`   Validation: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);
            // if (!validation.valid) {
            //     console.log(`   Errors: ${validation.errors.join(', ')}`);
            // }
            console.log(`   Skipped: DocumentMapper integration pending`);
        }
        
        // Test 7: Sample enhanced documents
        console.log('\n🔍 Test 7: Creating sample enhanced documents...');
        const sampleDocs = allDocs.slice(0, 2);
        
        for (const doc of sampleDocs) {
            // TODO: Re-enable when DocumentMapper is available
            // const enhanced = DocumentMapper.mapTTLToEnrichedDocument(doc);
            console.log(`   Sample: ${doc.legalIdentifier}`);
            console.log(`     Title: ${doc.title}`);
            console.log(`     Type: ${doc.documentType}`);
            console.log(`     Status: ${doc.status}`);
            console.log(`     Keywords: ${doc.keywords.length}`);
            console.log(`     Available for enhanced mapping when DocumentMapper is ready`);
            // console.log(`     Searchable text length: ${enhanced.searchableText.length} chars`);
            // console.log(`     Content hash: ${enhanced.contentHash}`);
            console.log('');
        }
        
        console.log('✅ TTL Parser test completed successfully!');
        
    } catch (error) {
        console.error('❌ TTL Parser test failed:', error);
        throw error;
    }
}

/**
 * Main test execution
 */
if (require.main === module) {
    testTTLParser()
        .then(() => {
            console.log('\n🎉 All tests completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Test failed:', error);
            process.exit(1);
        });
}

export { testTTLParser };
