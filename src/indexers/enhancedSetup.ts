/**
 * Enhanced Index Setup with TTL Metadata Integration
 * Combines TTL metadata with PDF content for enriched Azure Search indexing
 */

import { getTTLParser, LegalMetadata } from './ttlParser';
import { MyDocument } from "../app/azureAISearchDataSource";
import { createIndexIfNotExists, upsertDocuments, getEmbeddingVector, splitTextIntoChunks } from "./utils";
import { SearchClient, SearchIndexClient, AzureKeyCredential } from "@azure/search-documents";
import config from "../config";
import path from "path";
import * as fs from "fs";
import pdf from "pdf-parse";

/**
 * Enhanced document interface combining TTL metadata with existing structure
 */
export interface EnrichedLegalDocument extends MyDocument {
    legalIdentifier: string;
    documentType: string;
    legalStatus: string;
    legalStatusLang: string;
    sourceUrl: string;
    pdfPath: string;
    pdfSource: string;
    titleLang: string;
    descriptionLang: string;
    keywords: string[];
    enrichedAt: Date | null;
    enrichmentMethod: string;
    downloadStatus: string;
    lastModified: Date;
    searchableText: string;
    contentHash: string;
}

/**
 * Document mapper utility functions
 */
class DocumentMapperInline {
    /**
     * Encode document key to be Azure Search compatible
     * Replace dots with underscores and ensure only allowed characters
     */
    static encodeDocumentKey(legalIdentifier: string): string {
        return legalIdentifier
            .replace(/\./g, '_')  // Replace dots with underscores
            .replace(/[^a-zA-Z0-9_\-=]/g, '_');  // Replace other invalid chars with underscores
    }
    
    /**
     * Decode document key back to original legal identifier
     */
    static decodeDocumentKey(encodedKey: string): string {
        // This is a simple reverse mapping - in practice you might want to store both
        return encodedKey.replace(/_/g, '.');
    }
    
    static mapTTLToEnrichedDocument(
        ttlMetadata: LegalMetadata,
        pdfContent: string,
        contentEmbedding: number[]
    ): EnrichedLegalDocument {
        const enhancedDescription = this.generateEnhancedDescription(ttlMetadata, pdfContent);
        const searchableText = this.createSearchableText(ttlMetadata, pdfContent);
        const contentHash = this.generateContentHash(ttlMetadata.legalIdentifier + ttlMetadata.title);
        
        return {
            id: this.encodeDocumentKey(ttlMetadata.legalIdentifier),
            title: ttlMetadata.title,
            description: enhancedDescription,
            content: pdfContent,
            contentVector: contentEmbedding,
            legalIdentifier: ttlMetadata.legalIdentifier,
            documentType: ttlMetadata.documentType,
            legalStatus: ttlMetadata.status,
            legalStatusLang: ttlMetadata.statusLang,
            sourceUrl: ttlMetadata.sourceUrl,
            pdfPath: ttlMetadata.pdfPath,
            pdfSource: ttlMetadata.pdfSource,
            titleLang: ttlMetadata.titleLang,
            descriptionLang: ttlMetadata.descriptionLang,
            keywords: [...ttlMetadata.keywords],
            enrichedAt: new Date(),
            enrichmentMethod: 'TTL_SPARQL_Parser',
            downloadStatus: ttlMetadata.downloadStatus || 'processed',
            lastModified: new Date(),
            searchableText: searchableText,
            contentHash: contentHash
        };
    }
    
    private static generateEnhancedDescription(ttlMetadata: LegalMetadata, pdfContent: string): string {
        const contentPreview = pdfContent.substring(0, 500).trim();
        const keywordsText = ttlMetadata.keywords.length > 0 
            ? `Mots-clés: ${ttlMetadata.keywords.slice(0, 10).join(', ')}.` 
            : '';
        
        return `${ttlMetadata.documentType} ${ttlMetadata.legalIdentifier}: ${ttlMetadata.title}. ` +
               `Statut: ${ttlMetadata.status}. ${keywordsText} ${contentPreview}`;
    }
    
    private static createSearchableText(ttlMetadata: LegalMetadata, pdfContent: string): string {
        const searchableComponents = [
            ttlMetadata.legalIdentifier,
            ttlMetadata.title,
            ttlMetadata.documentType,
            ttlMetadata.status,
            ...ttlMetadata.keywords,
            pdfContent.substring(0, 2000)
        ];
        
        return searchableComponents.join(' ').toLowerCase();
    }
    
    static extractKeywordsText(ttlMetadata: LegalMetadata): string {
        return ttlMetadata.keywords.length > 0 
            ? `${ttlMetadata.title} ${ttlMetadata.keywords.join(' ')}`
            : ttlMetadata.title;
    }
    
    static generateContentHash(content: string): string {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(content).digest('hex');
    }
    
    static validateDocument(doc: EnrichedLegalDocument): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        if (!doc.id) errors.push('Missing id');
        if (!doc.title) errors.push('Missing title');
        if (!doc.legalIdentifier) errors.push('Missing legalIdentifier');
        if (!doc.documentType) errors.push('Missing documentType');
        if (!doc.legalStatus) errors.push('Missing legalStatus');
        if (!doc.contentVector || doc.contentVector.length === 0) {
            errors.push('Missing or empty contentVector');
        }
        
        return { valid: errors.length === 0, errors };
    }
    
    static getDocumentSummary(doc: EnrichedLegalDocument): string {
        return `${doc.legalIdentifier}: ${doc.title?.substring(0, 50)}... ` +
               `(${doc.documentType}, ${doc.legalStatus}, ${doc.keywords.length} keywords)`;
    }
}

/**
 * Enhanced setup with TTL metadata integration
 */
class EnhancedIndexSetup {
    private searchClient: SearchClient<EnrichedLegalDocument>;
    private indexClient: SearchIndexClient;
    private ttlParser?: any;
    
    constructor(
        private searchApiKey: string,
        private azureOpenAIKey: string,
        private indexName: string
    ) {
        const credential = new AzureKeyCredential(searchApiKey);
        
        this.searchClient = new SearchClient<EnrichedLegalDocument>(
            config.azureSearchEndpoint,
            indexName,
            credential
        );
        
        this.indexClient = new SearchIndexClient(
            config.azureSearchEndpoint,
            credential
        );
        
        // Set environment variable for embedding generation
        process.env.SECRET_AZURE_OPENAI_API_KEY = azureOpenAIKey;
    }
    
    /**
     * Initialize TTL parser
     */
    async initializeTTLParser(): Promise<void> {
        console.log('🔄 Initializing TTL metadata parser...');
        this.ttlParser = await getTTLParser();
        console.log('✅ TTL parser initialized successfully');
    }
    
    /**
     * Create enhanced index with TTL metadata schema
     */
    async createEnhancedIndex(): Promise<void> {
        console.log('🏗️  Creating enhanced index with TTL metadata schema...');
        await createIndexIfNotExists(this.indexClient, this.indexName);
        console.log('✅ Enhanced index created successfully');
    }
    
    /**
     * Get TTL metadata for all documents
     */
    async getTTLMetadata(): Promise<Map<string, LegalMetadata>> {
        console.log('📊 Loading TTL metadata...');
        
        if (!this.ttlParser) {
            throw new Error('TTL parser not initialized');
        }
        
        const allDocs = await this.ttlParser.getAllDocuments();
        const metadataMap = new Map<string, LegalMetadata>();
        
        for (const doc of allDocs) {
            metadataMap.set(doc.legalIdentifier, doc);
        }
        
        console.log(`✅ Loaded ${metadataMap.size} TTL metadata records`);
        return metadataMap;
    }
    
    /**
     * Process PDFs and combine with TTL metadata
     */
    async processDocumentsWithTTL(): Promise<EnrichedLegalDocument[]> {
        console.log('📄 Processing documents with TTL metadata integration...');
        
        const ttlMetadata = await this.getTTLMetadata();
        const enhancedDocs: EnrichedLegalDocument[] = [];
        
        const dataPath = path.resolve(__dirname, "../../../src/indexers/data");
        
        if (!fs.existsSync(dataPath)) {
            throw new Error(`Data directory not found: ${dataPath}`);
        }
        
        const files = fs.readdirSync(dataPath).filter(file => file.endsWith('.pdf'));
        console.log(`📁 Found ${files.length} PDF files to process`);
        
        let processedCount = 0;
        let enhancedCount = 0;
        
        for (const fileName of files) {
            try {
                console.log(`\n📖 Processing: ${fileName}`);
                
                // Extract legal identifier from filename (e.g., "A-1_loi-sur-les-abeilles.pdf" -> "A-1")
                const legalIdMatch = fileName.match(/^([A-Z]-[\d\.]+)/);
                if (!legalIdMatch) {
                    console.log(`   ⚠️  Cannot extract legal identifier from ${fileName}, skipping...`);
                    continue;
                }
                
                const legalIdentifier = legalIdMatch[1];
                console.log(`   🔍 Legal identifier: ${legalIdentifier}`);
                
                // Get TTL metadata for this document
                const metadata = ttlMetadata.get(legalIdentifier);
                if (!metadata) {
                    console.log(`   ⚠️  No TTL metadata found for ${legalIdentifier}, creating basic entry...`);
                    
                    // Create basic document without TTL enhancement
                    const filePath = path.join(dataPath, fileName);
                    const pdfBuffer = fs.readFileSync(filePath);
                    const pdfContent = await pdf(pdfBuffer);
                    
                    const chunks = splitTextIntoChunks(pdfContent.text);
                    if (chunks.length > 0) {
                        const embedding = await getEmbeddingVector(chunks[0]);
                        
                        // Create minimal enhanced document
                        const basicDoc: EnrichedLegalDocument = {
                            id: legalIdentifier,
                            title: fileName.replace('.pdf', '').replace(/_/g, ' '),
                            description: chunks[0].substring(0, 1000),
                            content: pdfContent.text,
                            contentVector: embedding,
                            legalIdentifier: legalIdentifier,
                            documentType: 'Loi',
                            legalStatus: 'unknown',
                            legalStatusLang: 'fr',
                            sourceUrl: '',
                            pdfPath: filePath,
                            pdfSource: '',
                            titleLang: 'fr',
                            descriptionLang: 'fr',
                            keywords: [],
                            enrichedAt: null,
                            enrichmentMethod: '',
                            downloadStatus: '',
                            lastModified: new Date(),
                            searchableText: legalIdentifier + ' ' + fileName,
                            contentHash: DocumentMapperInline.generateContentHash(legalIdentifier + fileName)
                        };
                        
                        enhancedDocs.push(basicDoc);
                        processedCount++;
                    }
                    continue;
                }
                
                console.log(`   📋 TTL metadata found: ${metadata.title}`);
                console.log(`   📊 Status: ${metadata.status} | Keywords: ${metadata.keywords.length}`);
                
                // Read and process PDF content
                const filePath = path.join(dataPath, fileName);
                const pdfBuffer = fs.readFileSync(filePath);
                const pdfContent = await pdf(pdfBuffer);
                
                console.log(`   📄 PDF content extracted: ${pdfContent.text.length} characters`);
                
                // Split content into chunks and generate embeddings
                const chunks = splitTextIntoChunks(pdfContent.text);
                console.log(`   📦 Created ${chunks.length} content chunks`);
                
                if (chunks.length === 0) {
                    console.log(`   ⚠️  No content chunks created for ${fileName}, skipping...`);
                    continue;
                }
                
                // Generate content embedding from first chunk
                const contentEmbedding = await getEmbeddingVector(chunks[0]);
                console.log(`   🔢 Generated content embedding: ${contentEmbedding.length} dimensions`);
                
                // Generate keywords embedding if keywords exist
                let keywordsEmbedding: number[] | undefined;
                if (metadata.keywords.length > 0) {
                    const keywordsText = DocumentMapperInline.extractKeywordsText(metadata);
                    keywordsEmbedding = await getEmbeddingVector(keywordsText);
                    console.log(`   🏷️  Generated keywords embedding: ${keywordsEmbedding.length} dimensions`);
                }
                
                // Map TTL metadata to enhanced document
                const enhancedDoc = DocumentMapperInline.mapTTLToEnrichedDocument(
                    metadata,
                    pdfContent.text,
                    contentEmbedding
                );
                
                // Update PDF path to local file
                enhancedDoc.pdfPath = filePath;
                
                // Validate document
                const validation = DocumentMapperInline.validateDocument(enhancedDoc);
                if (!validation.valid) {
                    console.log(`   ❌ Document validation failed: ${validation.errors.join(', ')}`);
                    continue;
                }
                
                enhancedDocs.push(enhancedDoc);
                processedCount++;
                enhancedCount++;
                
                console.log(`   ✅ Enhanced document created: ${DocumentMapperInline.getDocumentSummary(enhancedDoc)}`);
                
                // Add delay to avoid rate limiting
                if (processedCount % 5 === 0) {
                    console.log(`   ⏳ Processed ${processedCount}/${files.length}, pausing briefly...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
            } catch (error) {
                console.error(`   ❌ Error processing ${fileName}:`, error instanceof Error ? error.message : error);
                continue;
            }
        }
        
        console.log(`\n📊 Processing Summary:`);
        console.log(`   📄 Total files: ${files.length}`);
        console.log(`   ✅ Successfully processed: ${processedCount}`);
        console.log(`   🚀 TTL enhanced: ${enhancedCount}`);
        console.log(`   📈 Enhancement rate: ${enhancedCount > 0 ? ((enhancedCount / processedCount) * 100).toFixed(1) : 0}%`);
        
        return enhancedDocs;
    }
    
    /**
     * Upload enhanced documents to Azure Search
     */
    async uploadEnhancedDocuments(documents: EnrichedLegalDocument[]): Promise<void> {
        console.log(`\n🚀 Uploading ${documents.length} enhanced documents to Azure Search...`);
        
        if (documents.length === 0) {
            console.log('⚠️  No documents to upload');
            return;
        }
        
        try {
            await upsertDocuments(this.searchClient, documents);
            console.log('✅ Documents uploaded successfully to Azure Search');
            
            // Show sample of uploaded documents
            console.log('\n📋 Sample uploaded documents:');
            documents.slice(0, 3).forEach((doc, index) => {
                console.log(`   ${index + 1}. ${DocumentMapperInline.getDocumentSummary(doc)}`);
            });
            
        } catch (error) {
            console.error('❌ Error uploading documents:', error);
            throw error;
        }
    }
    
    /**
     * Run complete enhanced setup process
     */
    async runEnhancedSetup(): Promise<void> {
        console.log('🚀 Starting Enhanced Index Setup with TTL Metadata Integration');
        console.log('='.repeat(70));
        
        try {
            // Step 1: Initialize TTL parser
            await this.initializeTTLParser();
            
            // Step 2: Create enhanced index
            await this.createEnhancedIndex();
            
            // Step 3: Process documents with TTL metadata
            const enhancedDocs = await this.processDocumentsWithTTL();
            
            // Step 4: Upload to Azure Search
            await this.uploadEnhancedDocuments(enhancedDocs);
            
            console.log('\n🎉 Enhanced Index Setup completed successfully!');
            console.log(`📊 Final stats: ${enhancedDocs.length} documents with TTL metadata integration`);
            
        } catch (error) {
            console.error('\n💥 Enhanced Index Setup failed:', error);
            throw error;
        }
    }
}

/**
 * Main execution function
 */
async function main() {
    const searchApiKey = process.argv[2];
    if (!searchApiKey) {
        throw new Error("Missing Azure AI Search Key");
    }
    
    const azureOpenAIKey = process.argv[3];
    if (!azureOpenAIKey) {
        throw new Error("Missing Azure OpenAI Key");
    }
    
    const indexName = process.argv[4] || config.azureSearchIndexName || "enhanced-legis-qc";
    
    console.log(`🎯 Target Index: ${indexName}`);
    console.log(`🔗 Search Endpoint: ${config.azureSearchEndpoint}`);
    console.log(`🤖 OpenAI Endpoint: ${config.azureOpenAIEndpoint}`);
    console.log(`📁 External Data Source: ${config.externalDataSourcePath}`);
    
    const enhancedSetup = new EnhancedIndexSetup(searchApiKey, azureOpenAIKey, indexName);
    await enhancedSetup.runEnhancedSetup();
}

// Run if called directly
if (require.main === module) {
    main()
        .then(() => {
            console.log('\n✅ Process completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Process failed:', error);
            process.exit(1);
        });
}

export { EnhancedIndexSetup };
