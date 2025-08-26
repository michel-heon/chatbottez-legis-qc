import { SPARQLDataPopulator } from './documentMapper';
import { SearchClient, SearchIndexClient, AzureKeyCredential } from "@azure/search-documents";
import { upsertDocuments } from './utils';
import config from '../config';

/**
 * SPARQL-based Data Population for Sample Documents
 * Uses SPARQL queries to extract and populate specific documents from TTL metadata
 */
class DataPopulationManager {
    private searchClient: SearchClient<any>;
    private indexClient: SearchIndexClient;
    private populator: SPARQLDataPopulator;
    
    constructor(
        private searchApiKey: string,
        private indexName: string,
        private dataSourcePath: string
    ) {
        const credential = new AzureKeyCredential(searchApiKey);
        
        this.searchClient = new SearchClient(
            config.azureSearchEndpoint,
            indexName,
            credential
        );
        
        this.indexClient = new SearchIndexClient(
            config.azureSearchEndpoint,
            credential
        );
        
        this.populator = new SPARQLDataPopulator(dataSourcePath);
    }
    
    /**
     * Populate sample documents using SPARQL extraction
     */
    async populateSampleDocuments(sampleIdentifiers: string[]): Promise<void> {
        console.log('🚀 Starting SPARQL-based Data Population');
        console.log('='.repeat(60));
        console.log(`📋 Sample identifiers: ${sampleIdentifiers.join(', ')}`);
        console.log(`🎯 Target index: ${this.indexName}`);
        console.log(`📁 Data source: ${this.dataSourcePath}`);
        console.log('');
        
        try {
            // Step 1: Initialize TTL parser
            console.log('📊 Step 1: Initialize TTL Parser');
            await this.populator.initializeTTLParser();
            console.log('');
            
            // Step 2: Extract documents using SPARQL
            console.log('📊 Step 2: SPARQL Extraction');
            const extractedDocs = await this.populator.extractSampleDocuments(sampleIdentifiers);
            console.log(`✅ Extracted ${extractedDocs.length} documents using SPARQL`);
            console.log('');
            
            if (extractedDocs.length === 0) {
                console.log('❌ No documents extracted. Aborting population.');
                return;
            }
            
            // Step 3: Validate PDF files
            console.log('📊 Step 3: PDF File Validation');
            const validDocs = await this.populator.validatePDFFiles(extractedDocs);
            console.log(`✅ Validated ${validDocs.length} PDF files`);
            console.log('');
            
            if (validDocs.length === 0) {
                console.log('❌ No PDF files found. Aborting population.');
                return;
            }
            
            // Step 4: Process documents (PDF + embeddings)
            console.log('📊 Step 4: Document Processing');
            const processedDocs = await this.populator.processDocuments(validDocs);
            console.log(`✅ Processed ${processedDocs.length} documents with embeddings`);
            console.log('');
            
            // Step 5: Upload to Azure Search
            console.log('📊 Step 5: Azure Search Upload');
            if (processedDocs.length > 0) {
                const uploadResult = await upsertDocuments(this.searchClient, processedDocs);
                console.log(`✅ Uploaded ${processedDocs.length} documents to Azure Search`);
                console.log(`📈 Upload result: ${JSON.stringify(uploadResult.results.map(r => ({ key: r.key, succeeded: r.succeeded })))}`);
            }
            console.log('');
            
            // Step 6: Verify population
            console.log('📊 Step 6: Population Verification');
            await this.verifyPopulation(sampleIdentifiers);
            
            console.log('');
            console.log('🎉 SPARQL-based Data Population completed successfully!');
            console.log(`📋 Final summary: ${processedDocs.length}/${sampleIdentifiers.length} documents populated`);
            
        } catch (error) {
            console.error('💥 Data population failed:', error);
            throw error;
        }
    }
    
    /**
     * Verify that documents were successfully populated in the index
     */
    private async verifyPopulation(sampleIdentifiers: string[]): Promise<void> {
        console.log('🔍 Verifying document population in Azure Search...');
        
        for (const identifier of sampleIdentifiers) {
            try {
                // Encode the identifier for search
                const encodedId = identifier.replace(/\./g, '_').replace(/[^a-zA-Z0-9_\-=]/g, '_');
                
                const searchResults = await this.searchClient.search(`docId:${encodedId}`, {
                    top: 1,
                    select: ['docId', 'docTitle', 'legalIdentifier', 'legalStatus']
                });
                
                let found = false;
                for await (const result of searchResults.results) {
                    const doc = result.document as any;
                    console.log(`   ✅ Found: ${doc.legalIdentifier} - ${doc.docTitle?.substring(0, 50)}...`);
                    console.log(`      Status: ${doc.legalStatus}`);
                    found = true;
                    break;
                }
                
                if (!found) {
                    console.log(`   ❌ Not found: ${identifier}`);
                }
                
            } catch (error) {
                console.error(`   ❌ Error verifying ${identifier}:`, error);
            }
        }
    }
    
    /**
     * Get index statistics
     */
    async getIndexStats(): Promise<void> {
        try {
            const searchResults = await this.searchClient.search("*", {
                includeTotalCount: true,
                top: 0
            });
            
            console.log(`📊 Index Statistics:`);
            console.log(`   Total documents: ${searchResults.count || 0}`);
            
            // Count by legal status
            const statusResults = await this.searchClient.search("*", {
                facets: ['legalStatus'],
                top: 0
            });
            
            if (statusResults.facets && statusResults.facets['legalStatus']) {
                console.log(`   Legal Status distribution:`);
                statusResults.facets['legalStatus'].forEach((facet: any) => {
                    console.log(`      ${facet.value}: ${facet.count}`);
                });
            }
            
        } catch (error) {
            console.error('❌ Error getting index stats:', error);
        }
    }
}

/**
 * Main execution function
 */
async function main() {
    // Sample documents for development (5 documents)
    const SAMPLE_IDENTIFIERS = [
        'A-1',    // Loi sur les abeilles (abrogée)
        'A-10',   // Loi sur les agents de voyages (en vigueur)
        'A-12',   // Loi sur les agronomes
        'A-12.1', // Loi sur l'aide au développement des coopératives
        'A-13'    // Loi connexe
    ];
    
    const searchApiKey = process.argv[2];
    const indexName = process.argv[3] || process.env.AZURE_SEARCH_INDEX_NAME || 'legis-qc-index-dev-07';
    const dataSourcePath = process.argv[4] || config.externalDataSourcePath;
    
    if (!searchApiKey) {
        console.error("❌ Missing Azure AI Search Key");
        console.log("Usage: node dataPopulation.js <search-api-key> [index-name] [data-source-path]");
        process.exit(1);
    }
    
    try {
        console.log('🎯 SPARQL Data Population - Sample Documents');
        console.log('='.repeat(50));
        console.log(`📋 Sample size: ${SAMPLE_IDENTIFIERS.length} documents`);
        console.log(`🔍 Target index: ${indexName}`);
        console.log(`📁 Data source: ${dataSourcePath}`);
        console.log('');
        
        const manager = new DataPopulationManager(searchApiKey, indexName, dataSourcePath);
        
        // Show initial index stats
        console.log('📊 Initial Index State:');
        await manager.getIndexStats();
        console.log('');
        
        // Populate sample documents
        await manager.populateSampleDocuments(SAMPLE_IDENTIFIERS);
        
        // Show final index stats
        console.log('📊 Final Index State:');
        await manager.getIndexStats();
        
    } catch (error) {
        console.error('💥 Population process failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export { DataPopulationManager };
