/**
 * Index Populator from TTL
 * Populates Azure Search index with processed content and TTL metadata
 */

import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import * as fs from 'fs';
import * as path from 'path';
import config from '../config';

interface DocumentManifest {
    legalIdentifier: string;
    title: string;
    documentType: string;
    pdfPath: string;
    pdfFullPath: string;
    pdfExists: boolean;
    sourceUrl: string;
    lastModified?: Date;
    fileSize?: number;
    metadata: Record<string, any>;
}

interface FilesManifest {
    documents: DocumentManifest[];
    totalDocuments: number;
}

interface ProcessedDocument {
    legalIdentifier: string;
    content: string;
    chunks: string[];
    wordCount: number;
    processedAt: string;
    processingTime: number;
    error?: string;
}

interface EmbeddingData {
    legalIdentifier: string;
    contentVector: number[];
    chunkVectors: number[][];
    embeddingModel: string;
    generatedAt: string;
    error?: string;
}

interface IndexDocument {
    id: string;
    title: string;
    content: string;
    sourceUrl: string;
    
    // TTL metadata fields based on actual schema
    legalIdentifier?: string;
    format?: string;
    documentType?: string;
    legalType?: string;
    legalStatus?: string;
    abrogatedBy?: string;
    downloadStatus?: string;
    enrichedAt?: Date;
    enrichmentMethod?: string;
    description?: string;
    keywords?: string[];
    isReplacedBy?: boolean;
    contentVector?: number[];
    
    [key: string]: any;
}

/**
 * Populate Azure Search index with TTL-driven content
 */
export class IndexPopulatorFromTTL {
    private searchClient: SearchClient<IndexDocument>;
    private manifestPath: string;
    private mode: string;
    private processedDir: string;
    private embeddingsDir: string;
    private manifest: FilesManifest;
    
    constructor(
        searchKey: string,
        indexName: string,
        manifestPath: string,
        mode: string = 'incremental',
        processedDir: string = 'src/indexers/data/processed',
        embeddingsDir: string = 'src/indexers/data/embeddings'
    ) {
        // Initialize Azure Search client
        this.searchClient = new SearchClient<IndexDocument>(
            config.azureSearchEndpoint,
            indexName,
            new AzureKeyCredential(searchKey)
        );
        
        this.manifestPath = manifestPath;
        this.mode = mode;
        this.processedDir = processedDir;
        this.embeddingsDir = embeddingsDir;
        this.manifest = this.loadManifest();
    }
    
    /**
     * Load files manifest
     */
    private loadManifest(): FilesManifest {
        console.log(`📖 Loading files manifest: ${this.manifestPath}`);
        
        if (!fs.existsSync(this.manifestPath)) {
            throw new Error(`Manifest file not found: ${this.manifestPath}`);
        }
        
        const manifestContent = fs.readFileSync(this.manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);
        
        console.log(`✅ Manifest loaded: ${manifest.totalDocuments} documents`);
        return manifest;
    }
    
    /**
     * Populate the index
     */
    async populateIndex(): Promise<void> {
        console.log(`📤 Starting index population in ${this.mode} mode...`);
        
        if (this.mode === 'full') {
            await this.clearIndex();
        }
        
        const documentsToProcess = this.getDocumentsToProcess();
        console.log(`📋 Found ${documentsToProcess.length} documents to process`);
        
        if (documentsToProcess.length === 0) {
            console.log('ℹ️  No documents to process');
            return;
        }
        
        const batchSize = 50; // Azure Search batch limit
        const totalBatches = Math.ceil(documentsToProcess.length / batchSize);
        
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];
        
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const startIndex = batchIndex * batchSize;
            const endIndex = Math.min(startIndex + batchSize, documentsToProcess.length);
            const batch = documentsToProcess.slice(startIndex, endIndex);
            
            console.log(`📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} documents)`);
            
            try {
                const indexDocuments = await this.prepareBatch(batch);
                
                if (indexDocuments.length > 0) {
                    await this.uploadBatch(indexDocuments);
                    successCount += indexDocuments.length;
                    console.log(`✅ Batch ${batchIndex + 1} uploaded successfully (${indexDocuments.length} documents)`);
                } else {
                    console.log(`⏭️  Batch ${batchIndex + 1} skipped (no valid documents)`);
                }
                
            } catch (error) {
                const errorMsg = `Batch ${batchIndex + 1} failed: ${error}`;
                console.error(`❌ ${errorMsg}`);
                errors.push(errorMsg);
                errorCount += batch.length;
            }
            
            // Small delay between batches
            if (batchIndex < totalBatches - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log(`\n🎉 Index population completed!`);
        console.log(`✅ Successfully indexed: ${successCount} documents`);
        console.log(`❌ Errors: ${errorCount} documents`);
        
        if (errors.length > 0) {
            console.log(`⚠️  Error details:`);
            errors.forEach(error => console.log(`   ${error}`));
        }
        
        // Get final index statistics
        await this.getIndexStatistics();
    }
    
    /**
     * Get documents to process based on mode
     */
    private getDocumentsToProcess(): DocumentManifest[] {
        const availableDocuments = this.manifest.documents.filter(doc => {
            const processedPath = path.join(this.processedDir, `${doc.legalIdentifier}.json`);
            return fs.existsSync(processedPath);
        });
        
        if (this.mode === 'incremental') {
            // TODO: Implement logic to check which documents are already in the index
            // For now, return all available documents
            return availableDocuments;
        }
        
        return availableDocuments;
    }
    
    /**
     * Clear the index for full mode
     */
    private async clearIndex(): Promise<void> {
        console.log('🗑️  Clearing index for full population...');
        
        try {
            // Search for all documents
            const searchResults = await this.searchClient.search('*', {
                select: ['id'],
                top: 1000
            });
            
            const documentIds: string[] = [];
            for await (const result of searchResults.results) {
                if (result.document.id) {
                    documentIds.push(result.document.id);
                }
            }
            
            if (documentIds.length > 0) {
                console.log(`🗑️  Deleting ${documentIds.length} existing documents...`);
                const deleteDocuments = documentIds.map(id => ({ id } as IndexDocument));
                await this.searchClient.deleteDocuments(deleteDocuments);
                console.log('✅ Existing documents deleted');
            } else {
                console.log('ℹ️  Index is already empty');
            }
            
        } catch (error) {
            console.warn('⚠️  Could not clear index:', error);
        }
    }
    
    /**
     * Prepare a batch of documents for indexing
     */
    private async prepareBatch(documents: DocumentManifest[]): Promise<IndexDocument[]> {
        const indexDocuments: IndexDocument[] = [];
        
        for (const doc of documents) {
            try {
                const indexDoc = await this.prepareDocument(doc);
                if (indexDoc) {
                    indexDocuments.push(indexDoc);
                }
            } catch (error) {
                console.warn(`⚠️  Failed to prepare document ${doc.legalIdentifier}:`, error);
            }
        }
        
        return indexDocuments;
    }
    
    /**
     * Prepare a single document for indexing
     */
    private async prepareDocument(doc: DocumentManifest): Promise<IndexDocument | null> {
        // Load processed content
        const processedPath = path.join(this.processedDir, `${doc.legalIdentifier}.json`);
        if (!fs.existsSync(processedPath)) {
            console.warn(`⚠️  Processed file not found for ${doc.legalIdentifier}`);
            return null;
        }
        
        const processedContent: ProcessedDocument = JSON.parse(fs.readFileSync(processedPath, 'utf-8'));
        
        if (processedContent.error) {
            console.warn(`⚠️  Processed document has error: ${processedContent.error}`);
            return null;
        }
        
        // Load embeddings if available
        const embeddingPath = path.join(this.embeddingsDir, `${doc.legalIdentifier}.json`);
        let embeddingData: EmbeddingData | null = null;
        
        if (fs.existsSync(embeddingPath)) {
            try {
                embeddingData = JSON.parse(fs.readFileSync(embeddingPath, 'utf-8'));
            } catch (error) {
                console.warn(`⚠️  Failed to load embeddings for ${doc.legalIdentifier}:`, error);
            }
        }
        
        // Create index document with all available TTL metadata
        const indexDoc: IndexDocument = {
            id: this.encodeDocumentKey(doc.legalIdentifier),
            title: doc.title,
            content: processedContent.content,
            sourceUrl: doc.sourceUrl
        };
        
        // Add all TTL metadata fields
        this.addTTLMetadata(indexDoc, doc);
        
        // Add embedding vector if available for semantic search
        if (embeddingData && embeddingData.contentVector && embeddingData.contentVector.length > 0) {
            indexDoc.contentVector = embeddingData.contentVector;
            console.log(`📊 Added ${embeddingData.contentVector.length}-dimensional vector for ${doc.legalIdentifier}`);
        } else {
            console.log(`⚠️  No embedding vector found for ${doc.legalIdentifier}`);
        }
        
        return indexDoc;
    }
    
    /**
     * Add TTL metadata to index document
     */
    private addTTLMetadata(indexDoc: IndexDocument, doc: DocumentManifest): void {
        const metadata = doc.metadata;
        
        // Map TTL metadata to index fields
        if (doc.legalIdentifier) {
            indexDoc.legalIdentifier = doc.legalIdentifier;
        }
        
        if (metadata.format) {
            indexDoc.format = metadata.format;
        }
        
        if (metadata.type && Array.isArray(metadata.type)) {
            // Map RDF types to document classifications
            for (const type of metadata.type) {
                if (type.includes('LegalRule')) {
                    indexDoc.documentType = 'Loi';
                }
                if (type.includes('Loi')) {
                    indexDoc.legalType = 'Loi';
                }
            }
        }
        
        if (metadata.status) {
            indexDoc.legalStatus = metadata.status;
        }
        
        if (metadata.abrogatedBy) {
            indexDoc.abrogatedBy = metadata.abrogatedBy;
        }
        
        if (metadata.downloadStatus) {
            indexDoc.downloadStatus = metadata.downloadStatus;
        }
        
        if (metadata.enrichedAt) {
            indexDoc.enrichedAt = new Date(metadata.enrichedAt);
        }
        
        if (metadata.enrichmentMethod) {
            indexDoc.enrichmentMethod = metadata.enrichmentMethod;
        }
        
        if (metadata.description) {
            indexDoc.description = metadata.description;
        }
        
        if (metadata.keywords) {
            indexDoc.keywords = Array.isArray(metadata.keywords) ? metadata.keywords : [metadata.keywords];
        }
        
        if (metadata.isReplacedBy !== undefined) {
            indexDoc.isReplacedBy = metadata.isReplacedBy === true || metadata.isReplacedBy === 'true';
        }
    }
    
    /**
     * Encode document key to be Azure Search compatible
     */
    private encodeDocumentKey(legalIdentifier: string): string {
        return legalIdentifier
            .replace(/\./g, '_')
            .replace(/[^a-zA-Z0-9_\-=]/g, '_');
    }
    
    /**
     * Sanitize field name for Azure Search
     */
    private sanitizeFieldName(fieldName: string): string {
        return fieldName
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .replace(/^_+|_+$/g, '');
    }
    
    /**
     * Upload batch to Azure Search
     */
    private async uploadBatch(documents: IndexDocument[]): Promise<void> {
        const result = await this.searchClient.uploadDocuments(documents);
        
        // Check for any failed uploads
        const failures = result.results.filter(r => !r.succeeded);
        if (failures.length > 0) {
            console.warn(`⚠️  ${failures.length} documents failed to upload:`);
            failures.forEach(failure => {
                console.warn(`   ${failure.key}: ${failure.errorMessage}`);
            });
        }
    }
    
    /**
     * Get index statistics
     */
    private async getIndexStatistics(): Promise<void> {
        try {
            console.log('📊 Getting index statistics...');
            
            // Simple search to get total count
            const searchResults = await this.searchClient.search('*', {
                select: ['id'],
                top: 0,
                includeTotalCount: true
            });
            
            console.log(`📊 Index Statistics:`);
            console.log(`   Total documents: ${searchResults.count || 'unknown'}`);
            
        } catch (error) {
            console.warn('⚠️  Could not retrieve index statistics:', error);
        }
    }
}

/**
 * Main execution function
 */
async function main() {
    const searchKey = process.argv[2];
    const openaiApiKey = process.argv[3];
    const indexName = process.argv[4];
    const manifestPath = process.argv[5];
    const mode = process.argv[6] || 'incremental';
    const processedDir = process.argv[7] || 'src/indexers/data/processed';
    const embeddingsDir = process.argv[8] || 'src/indexers/data/embeddings';
    
    if (!searchKey || !openaiApiKey || !indexName || !manifestPath) {
        console.error('Usage: node indexPopulatorFromTTL.js <search-key> <openai-key> <index-name> <manifest-path> [mode] [processed-dir] [embeddings-dir]');
        process.exit(1);
    }
    
    try {
        const populator = new IndexPopulatorFromTTL(
            searchKey,
            indexName,
            manifestPath,
            mode,
            processedDir,
            embeddingsDir
        );
        
        await populator.populateIndex();
        
        console.log('🎉 Index population completed successfully!');
        
    } catch (error) {
        console.error('❌ Index population failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}
