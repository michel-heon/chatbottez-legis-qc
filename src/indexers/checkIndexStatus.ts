import { SearchIndexClient, SearchClient, AzureKeyCredential } from "@azure/search-documents";
import config from "../config";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: 'env/.env.playground' });
dotenv.config({ path: 'env/.env.playground.user' });

interface IndexStatus {
    name: string;
    exists: boolean;
    documentCount?: number;
    fields?: string[];
    error?: string;
}

/**
 * Check Enhanced Index Status
 */
class IndexStatusChecker {
    private indexClient: SearchIndexClient;
    private credential: AzureKeyCredential;
    
    constructor(private searchApiKey: string) {
        this.credential = new AzureKeyCredential(searchApiKey);
        this.indexClient = new SearchIndexClient(
            config.azureSearchEndpoint,
            this.credential
        );
    }
    
    async checkIndexStatus(indexName: string): Promise<IndexStatus> {
        try {
            console.log(`🔍 Checking index: ${indexName}`);
            
            // Check if index exists and get its details
            const index = await this.indexClient.getIndex(indexName);
            
            console.log(`✅ Index found: ${index.name}`);
            console.log(`📋 Fields count: ${index.fields.length}`);
            
            // Get document count
            const searchClient = new SearchClient(
                config.azureSearchEndpoint,
                indexName,
                this.credential
            );
            
            const searchResults = await searchClient.search("*", {
                includeTotalCount: true,
                top: 0
            });
            
            const documentCount = searchResults.count || 0;
            console.log(`📊 Document count: ${documentCount}`);
            
            // List field names
            const fieldNames = index.fields.map(field => field.name);
            console.log(`📝 Fields: ${fieldNames.join(', ')}`);
            
            return {
                name: indexName,
                exists: true,
                documentCount,
                fields: fieldNames
            };
            
        } catch (error: any) {
            console.error(`❌ Error checking index ${indexName}:`, error.message);
            return {
                name: indexName,
                exists: false,
                error: error.message
            };
        }
    }
    
    async checkMultipleIndexes(): Promise<void> {
        console.log('🚀 Enhanced Index Status Check');
        console.log('='.repeat(50));
        
        const indexesToCheck = [
            'enhanced-legis-qc-parallels',
            'legis-qc-lois-dev-02',  // Original basic index
            'my-documents'
        ];
        
        for (const indexName of indexesToCheck) {
            const status = await this.checkIndexStatus(indexName);
            
            console.log(`\n📊 Index: ${status.name}`);
            console.log(`   Status: ${status.exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
            
            if (status.exists) {
                console.log(`   Documents: ${status.documentCount}`);
                console.log(`   Fields: ${status.fields?.length || 0}`);
                
                // Check if it's an enhanced index
                const isEnhanced = status.fields?.includes('legalIdentifier') && 
                                 status.fields?.includes('documentType') &&
                                 status.fields?.includes('legalStatus');
                                 
                console.log(`   Type: ${isEnhanced ? '🚀 ENHANCED (TTL)' : '📝 BASIC'}`);
                
                if (isEnhanced) {
                    console.log(`   TTL Fields: ✅ legalIdentifier, documentType, legalStatus, keywords`);
                }
            } else {
                console.log(`   Error: ${status.error}`);
            }
        }
        
        // Sample documents from enhanced index if it exists
        await this.sampleEnhancedDocuments();
    }
    
    async sampleEnhancedDocuments(): Promise<void> {
        try {
            const indexName = 'enhanced-legis-qc-parallels';
            const searchClient = new SearchClient(
                config.azureSearchEndpoint,
                indexName,
                this.credential
            );
            
            console.log(`\n🔬 Sample Documents from Enhanced Index:`);
            console.log('='.repeat(50));
            
            // Get first 3 documents
            const results = await searchClient.search("*", {
                top: 3,
                select: ['docId', 'docTitle', 'legalIdentifier', 'documentType', 'legalStatus', 'keywords']
            });
            
            let count = 0;
            for await (const result of results.results) {
                count++;
                const doc = result.document as any;
                console.log(`\n📄 Document ${count}:`);
                console.log(`   ID: ${doc.docId}`);
                console.log(`   Legal ID: ${doc.legalIdentifier || 'N/A'}`);
                console.log(`   Title: ${doc.docTitle?.substring(0, 60)}...`);
                console.log(`   Type: ${doc.documentType || 'N/A'}`);
                console.log(`   Status: ${doc.legalStatus || 'N/A'}`);
                console.log(`   Keywords: ${doc.keywords?.length || 0} keywords`);
            }
            
            if (count === 0) {
                console.log('   📭 No documents found in enhanced index');
            }
            
        } catch (error: any) {
            console.error(`❌ Error sampling documents:`, error.message);
        }
    }
}

/**
 * Main execution
 */
async function main() {
    const searchApiKey = process.argv[2];
    if (!searchApiKey) {
        console.error("❌ Missing Azure AI Search Key");
        console.log("Usage: node checkIndexStatus.js <search-api-key>");
        process.exit(1);
    }
    
    try {
        const checker = new IndexStatusChecker(searchApiKey);
        await checker.checkMultipleIndexes();
        
        console.log('\n🎉 Index status check completed!');
        
    } catch (error) {
        console.error('💥 Status check failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
