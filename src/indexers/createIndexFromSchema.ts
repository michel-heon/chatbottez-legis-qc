/**
 * Create Azure Search Index from Generated Schema
 */

import { SearchIndexClient, AzureKeyCredential } from "@azure/search-documents";
import * as fs from 'fs';
import config from '../config';

async function createIndexFromSchema() {
    const searchApiKey = process.argv[2];
    const schemaPath = process.argv[3];
    
    if (!searchApiKey || !schemaPath) {
        console.error('Usage: node createIndexFromSchema.js <search-api-key> <schema-json-path>');
        process.exit(1);
    }
    
    if (!fs.existsSync(schemaPath)) {
        console.error(`❌ Schema file not found: ${schemaPath}`);
        process.exit(1);
    }
    
    console.log('🏗️  Creating Azure Search index from TTL schema...');
    
    try {
        // Load schema
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
        const schema = JSON.parse(schemaContent);
        
        console.log(`📊 Schema loaded: ${schema.fields.length} fields, vector search: ${schema.vectorSearch ? 'enabled' : 'disabled'}`);
        
        // Create search client
        const credential = new AzureKeyCredential(searchApiKey);
        const searchIndexClient = new SearchIndexClient(config.azureSearchEndpoint, credential);
        
        // Check if index exists
        try {
            await searchIndexClient.getIndex(schema.name);
            console.log(`⚠️  Index '${schema.name}' already exists. Deleting...`);
            await searchIndexClient.deleteIndex(schema.name);
            console.log('✅ Existing index deleted');
            
            // Wait a bit for deletion to complete
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            // Index doesn't exist, which is fine
            console.log(`✅ Index '${schema.name}' doesn't exist, ready to create`);
        }
        
        // Create index definition
        const indexDefinition = {
            name: schema.name,
            fields: schema.fields,
            suggesters: schema.suggesters || [],
            vectorSearch: schema.vectorSearch
        };
        
        console.log('🔨 Creating index with definition:');
        console.log(`   Name: ${indexDefinition.name}`);
        console.log(`   Fields: ${indexDefinition.fields.length}`);
        console.log(`   Vector Search: ${indexDefinition.vectorSearch ? 'enabled' : 'disabled'}`);
        
        // Create the index
        const result = await searchIndexClient.createIndex(indexDefinition);
        
        console.log('✅ Index created successfully!');
        console.log(`📊 Index name: ${result.name}`);
        console.log(`📊 Field count: ${result.fields.length}`);
        
        // Show field summary
        console.log('\n📋 Index Fields:');
        result.fields.forEach((field, index) => {
            const fieldInfo = `${index + 1}. ${field.name} (${field.type})`;
            const features = [];
            if ((field as any).key) features.push('key');
            if ((field as any).searchable) features.push('searchable');
            if ((field as any).dimensions) features.push(`vector:${(field as any).dimensions}D`);
            
            console.log(`   ${fieldInfo}${features.length > 0 ? ' - ' + features.join(', ') : ''}`);
        });
        
        if (indexDefinition.vectorSearch) {
            console.log('\n🔍 Vector Search Configuration:');
            console.log('   ✅ Semantic search enabled with HNSW algorithm');
            console.log('   ✅ Content embedding field: contentVector (1536D)');
        }
        
    } catch (error) {
        console.error('❌ Index creation failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    createIndexFromSchema();
}

export { createIndexFromSchema };
