/**
 * Index Creator from TTL Schema
 * Creates Azure Search index based on schema extracted from TTL analysis
 */

import { SearchIndexClient, AzureKeyCredential } from "@azure/search-documents";
import * as fs from 'fs';
import config from '../config';

interface IndexSchema {
    name: string;
    description: string;
    fields: any[];
    suggesters?: any[];
    vectorSearch?: any;
    corsOptions?: any;
}

/**
 * Create Azure Search index from TTL-generated schema
 */
export class IndexCreatorFromTTL {
    private indexClient: SearchIndexClient;
    private schema: IndexSchema;
    
    constructor(searchKey: string, schemaPath: string) {
        // Initialize Azure Search client
        this.indexClient = new SearchIndexClient(
            config.azureSearchEndpoint,
            new AzureKeyCredential(searchKey)
        );
        
        // Load schema
        this.schema = this.loadSchema(schemaPath);
    }
    
    /**
     * Load schema from JSON file
     */
    private loadSchema(schemaPath: string): IndexSchema {
        console.log(`📖 Loading schema from: ${schemaPath}`);
        
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found: ${schemaPath}`);
        }
        
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
        const schema = JSON.parse(schemaContent);
        
        console.log(`✅ Schema loaded: ${schema.name} (${schema.fields.length} fields)`);
        return schema;
    }
    
    /**
     * Process schema and replace environment variables
     */
    private processSchema(): any {
        console.log('🔧 Processing schema and replacing environment variables...');
        
        let schemaJson = JSON.stringify(this.schema);
        
        // Replace environment variables
        const envReplacements: Record<string, string> = {
            '${AZURE_OPENAI_ENDPOINT}': config.azureOpenAIEndpoint,
            '${AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME}': config.azureOpenAIEmbeddingDeploymentName,
            '${SECRET_AZURE_OPENAI_API_KEY}': process.env.SECRET_AZURE_OPENAI_API_KEY || ''
        };
        
        for (const [placeholder, value] of Object.entries(envReplacements)) {
            schemaJson = schemaJson.replace(new RegExp(placeholder, 'g'), value);
        }
        
        return JSON.parse(schemaJson);
    }
    
    /**
     * Create the index
     */
    async createIndex(indexName?: string): Promise<string> {
        const finalIndexName = indexName || this.schema.name;
        const processedSchema = this.processSchema();
        
        console.log(`🏗️  Creating index: ${finalIndexName}`);
        
        try {
            // Check if index already exists
            try {
                await this.indexClient.getIndex(finalIndexName);
                console.log(`⚠️  Index ${finalIndexName} already exists, deleting first...`);
                await this.indexClient.deleteIndex(finalIndexName);
                console.log(`🗑️  Index ${finalIndexName} deleted`);
                
                // Wait a bit for deletion to complete
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                // Index doesn't exist, which is fine
                console.log(`📝 Index ${finalIndexName} doesn't exist, creating new one`);
            }
            
            // Prepare index definition
            const indexDefinition = {
                name: finalIndexName,
                fields: processedSchema.fields,
                suggesters: processedSchema.suggesters || [],
                corsOptions: processedSchema.corsOptions || {
                    allowedOrigins: ["*"],
                    maxAgeInSeconds: 300
                }
            };
            
            // Add vector search configuration if present
            if (processedSchema.vectorSearch) {
                (indexDefinition as any).vectorSearch = processedSchema.vectorSearch;
            }
            
            console.log(`📋 Index definition prepared with ${indexDefinition.fields.length} fields`);
            
            // Create the index
            const result = await this.indexClient.createIndex(indexDefinition);
            
            console.log(`✅ Index created successfully: ${result.name}`);
            console.log(`📊 Fields: ${result.fields.length}`);
            console.log(`🔍 Suggesters: ${result.suggesters?.length || 0}`);
            
            return result.name;
            
        } catch (error) {
            console.error('❌ Failed to create index:', error);
            throw error;
        }
    }
    
    /**
     * Validate schema before creation
     */
    validateSchema(): boolean {
        console.log('🔍 Validating schema...');
        
        // Check required fields
        const hasKeyField = this.schema.fields.some(field => field.key === true);
        if (!hasKeyField) {
            throw new Error('Schema must have at least one key field');
        }
        
        // Check field names are valid
        for (const field of this.schema.fields) {
            if (!field.name || typeof field.name !== 'string') {
                throw new Error(`Invalid field name: ${field.name}`);
            }
            
            if (!field.type || typeof field.type !== 'string') {
                throw new Error(`Invalid field type for ${field.name}: ${field.type}`);
            }
        }
        
        // Check for vector search configuration if vector fields exist
        const hasVectorField = this.schema.fields.some(field => 
            field.type === 'Collection(Edm.Single)' && field.dimensions
        );
        
        if (hasVectorField && !this.schema.vectorSearch) {
            console.warn('⚠️  Vector fields found but no vectorSearch configuration');
        }
        
        console.log('✅ Schema validation passed');
        return true;
    }
    
    /**
     * Get index statistics after creation
     */
    async getIndexStats(indexName: string): Promise<any> {
        try {
            const stats = await this.indexClient.getIndexStatistics(indexName);
            return {
                documentCount: stats.documentCount,
                storageSize: stats.storageSize
            };
        } catch (error) {
            console.warn('⚠️  Could not retrieve index statistics:', error);
            return null;
        }
    }
}

/**
 * Main execution function
 */
async function main() {
    const searchKey = process.argv[2];
    const schemaPath = process.argv[3];
    const indexName = process.argv[4];
    
    if (!searchKey || !schemaPath) {
        console.error('Usage: node indexCreatorFromTTL.js <search-key> <schema-path> [index-name]');
        process.exit(1);
    }
    
    try {
        const creator = new IndexCreatorFromTTL(searchKey, schemaPath);
        
        // Validate schema
        creator.validateSchema();
        
        // Create index
        const createdIndexName = await creator.createIndex(indexName);
        
        // Get initial stats
        const stats = await creator.getIndexStats(createdIndexName);
        if (stats) {
            console.log(`📊 Initial stats - Documents: ${stats.documentCount}, Storage: ${stats.storageSize} bytes`);
        }
        
        console.log('🎉 Index creation completed successfully!');
        
    } catch (error) {
        console.error('❌ Index creation failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}
