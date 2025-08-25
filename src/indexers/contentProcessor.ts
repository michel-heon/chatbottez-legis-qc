/**
 * Content Processor - Extract and process PDF content in batches
 * Generates embeddings and prepares content for indexing
 */

import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';
import { getEmbeddingVector } from './utils';

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
    documentsWithPdf: number;
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

/**
 * Process PDF content and generate embeddings
 */
export class ContentProcessor {
    private manifestPath: string;
    private openaiApiKey: string;
    private batchSize: number;
    private processedDir: string;
    private embeddingsDir: string;
    private manifest: FilesManifest;
    
    constructor(
        manifestPath: string, 
        openaiApiKey: string, 
        batchSize: number = 10,
        processedDir: string = 'src/indexers/data/processed',
        embeddingsDir: string = 'src/indexers/data/embeddings'
    ) {
        this.manifestPath = manifestPath;
        this.openaiApiKey = openaiApiKey;
        this.batchSize = batchSize;
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
        
        console.log(`✅ Manifest loaded: ${manifest.totalDocuments} documents, ${manifest.documentsWithPdf} with PDF`);
        return manifest;
    }
    
    /**
     * Process all documents in batches
     */
    async processAllDocuments(): Promise<void> {
        const documentsToProcess = this.manifest.documents.filter(doc => doc.pdfExists);
        const totalBatches = Math.ceil(documentsToProcess.length / this.batchSize);
        
        console.log(`🔧 Processing ${documentsToProcess.length} documents in ${totalBatches} batches`);
        console.log(`📦 Batch size: ${this.batchSize}`);
        
        // Ensure output directories exist
        if (!fs.existsSync(this.processedDir)) {
            fs.mkdirSync(this.processedDir, { recursive: true });
        }
        if (!fs.existsSync(this.embeddingsDir)) {
            fs.mkdirSync(this.embeddingsDir, { recursive: true });
        }
        
        const errors: string[] = [];
        let processedCount = 0;
        let skippedCount = 0;
        
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const startIndex = batchIndex * this.batchSize;
            const endIndex = Math.min(startIndex + this.batchSize, documentsToProcess.length);
            const batch = documentsToProcess.slice(startIndex, endIndex);
            
            console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (documents ${startIndex + 1}-${endIndex})`);
            
            for (const doc of batch) {
                try {
                    // Check if already processed
                    const processedPath = path.join(this.processedDir, `${doc.legalIdentifier}.json`);
                    const embeddingPath = path.join(this.embeddingsDir, `${doc.legalIdentifier}.json`);
                    
                    if (fs.existsSync(processedPath) && fs.existsSync(embeddingPath)) {
                        console.log(`⏭️  Skipping ${doc.legalIdentifier} (already processed)`);
                        skippedCount++;
                        continue;
                    }
                    
                    console.log(`⚙️  Processing: ${doc.legalIdentifier}`);
                    
                    // Process PDF content
                    const processedDoc = await this.processPDF(doc);
                    this.saveProcessedDocument(processedDoc);
                    
                    // Generate embeddings
                    if (!processedDoc.error) {
                        const embeddingData = await this.generateEmbeddings(processedDoc);
                        this.saveEmbeddings(embeddingData);
                    }
                    
                    processedCount++;
                    console.log(`✅ Completed: ${doc.legalIdentifier}`);
                    
                } catch (error) {
                    const errorMsg = `Error processing ${doc.legalIdentifier}: ${error}`;
                    console.error(`❌ ${errorMsg}`);
                    errors.push(errorMsg);
                }
            }
            
            // Small delay between batches to avoid overwhelming the API
            if (batchIndex < totalBatches - 1) {
                console.log('⏱️  Waiting 2 seconds before next batch...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        // Save error log
        if (errors.length > 0) {
            const errorLogPath = path.join(this.processedDir, 'errors.log');
            fs.writeFileSync(errorLogPath, errors.join('\n'));
            console.log(`⚠️  ${errors.length} errors saved to: ${errorLogPath}`);
        }
        
        console.log(`\n🎉 Processing completed!`);
        console.log(`✅ Processed: ${processedCount}`);
        console.log(`⏭️  Skipped: ${skippedCount}`);
        console.log(`❌ Errors: ${errors.length}`);
    }
    
    /**
     * Process a single PDF file
     */
    private async processPDF(doc: DocumentManifest): Promise<ProcessedDocument> {
        const startTime = Date.now();
        
        try {
            // Read PDF file
            const pdfBuffer = fs.readFileSync(doc.pdfFullPath);
            
            // Extract text content
            const pdfData = await pdf(pdfBuffer);
            const content = pdfData.text;
            
            // Split content into chunks
            const chunks = this.splitTextIntoChunks(content, 1000, 200);
            const wordCount = content.split(/\s+/).length;
            
            const processingTime = Date.now() - startTime;
            
            return {
                legalIdentifier: doc.legalIdentifier,
                content,
                chunks,
                wordCount,
                processedAt: new Date().toISOString(),
                processingTime
            };
            
        } catch (error) {
            const processingTime = Date.now() - startTime;
            return {
                legalIdentifier: doc.legalIdentifier,
                content: '',
                chunks: [],
                wordCount: 0,
                processedAt: new Date().toISOString(),
                processingTime,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    
    /**
     * Split text into chunks with overlap
     */
    private splitTextIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
        const words = text.split(/\s+/);
        const chunks: string[] = [];
        
        for (let i = 0; i < words.length; i += chunkSize - overlap) {
            const chunk = words.slice(i, i + chunkSize).join(' ');
            if (chunk.trim()) {
                chunks.push(chunk);
            }
        }
        
        return chunks;
    }
    
    /**
     * Generate embeddings for processed document
     */
    private async generateEmbeddings(processedDoc: ProcessedDocument): Promise<EmbeddingData> {
        try {
            // Generate embedding for full content (truncated if too long)
            const truncatedContent = processedDoc.content.substring(0, 8000); // OpenAI limit
            const contentVector = await getEmbeddingVector(truncatedContent);
            
            // Generate embeddings for chunks
            const chunkVectors: number[][] = [];
            for (let i = 0; i < processedDoc.chunks.length; i++) {
                const chunk = processedDoc.chunks[i];
                try {
                    const chunkVector = await getEmbeddingVector(chunk);
                    chunkVectors.push(chunkVector);
                    
                    // Small delay to respect rate limits
                    if (i > 0 && i % 5 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (error) {
                    console.warn(`⚠️  Failed to generate embedding for chunk ${i} of ${processedDoc.legalIdentifier}:`, error);
                    // Continue with other chunks
                }
            }
            
            return {
                legalIdentifier: processedDoc.legalIdentifier,
                contentVector,
                chunkVectors,
                embeddingModel: 'text-embedding-ada-002',
                generatedAt: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                legalIdentifier: processedDoc.legalIdentifier,
                contentVector: [],
                chunkVectors: [],
                embeddingModel: 'text-embedding-ada-002',
                generatedAt: new Date().toISOString(),
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    
    /**
     * Save processed document to file
     */
    private saveProcessedDocument(processedDoc: ProcessedDocument): void {
        const filePath = path.join(this.processedDir, `${processedDoc.legalIdentifier}.json`);
        fs.writeFileSync(filePath, JSON.stringify(processedDoc, null, 2));
    }
    
    /**
     * Save embeddings to file
     */
    private saveEmbeddings(embeddingData: EmbeddingData): void {
        const filePath = path.join(this.embeddingsDir, `${embeddingData.legalIdentifier}.json`);
        fs.writeFileSync(filePath, JSON.stringify(embeddingData, null, 2));
    }
    
    /**
     * Get processing statistics
     */
    getProcessingStats(): any {
        const processedFiles = fs.readdirSync(this.processedDir).filter(f => f.endsWith('.json') && f !== 'errors.log');
        const embeddingFiles = fs.readdirSync(this.embeddingsDir).filter(f => f.endsWith('.json'));
        
        return {
            processedDocuments: processedFiles.length,
            embeddingFiles: embeddingFiles.length,
            totalDocumentsInManifest: this.manifest.documentsWithPdf,
            completionRate: Math.round((processedFiles.length / this.manifest.documentsWithPdf) * 100)
        };
    }
}

/**
 * Main execution function
 */
async function main() {
    const manifestPath = process.argv[2];
    const openaiApiKey = process.argv[3];
    const batchSize = parseInt(process.argv[4]) || 10;
    const processedDir = process.argv[5] || 'src/indexers/data/processed';
    const embeddingsDir = process.argv[6] || 'src/indexers/data/embeddings';
    
    if (!manifestPath || !openaiApiKey) {
        console.error('Usage: node contentProcessor.js <manifest-path> <openai-api-key> [batch-size] [processed-dir] [embeddings-dir]');
        process.exit(1);
    }
    
    try {
        const processor = new ContentProcessor(manifestPath, openaiApiKey, batchSize, processedDir, embeddingsDir);
        await processor.processAllDocuments();
        
        const stats = processor.getProcessingStats();
        console.log('\n📊 Final Statistics:');
        console.log(`   Processed documents: ${stats.processedDocuments}`);
        console.log(`   Embedding files: ${stats.embeddingFiles}`);
        console.log(`   Completion rate: ${stats.completionRate}%`);
        
    } catch (error) {
        console.error('❌ Content processing failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}
