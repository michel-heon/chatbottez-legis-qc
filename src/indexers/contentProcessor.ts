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
    metadata?: {
        totalChunks?: number;
        successfulChunks?: number;
        failedChunks?: number;
    };
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
    private force: boolean;
    
    constructor(
        manifestPath: string, 
        openaiApiKey: string, 
        batchSize: number = 10,
        processedDir: string = 'src/indexers/data/processed',
        embeddingsDir: string = 'src/indexers/data/embeddings',
        force: boolean = false
    ) {
        this.manifestPath = manifestPath;
        this.openaiApiKey = openaiApiKey;
        this.batchSize = batchSize;
        this.processedDir = processedDir;
        this.embeddingsDir = embeddingsDir;
        this.force = force;
        this.manifest = this.loadManifest();
    }
    
    /**
     * Get the subdirectory path based on the first letter of the legal identifier
     */
    private getSubdirectoryPath(legalIdentifier: string, baseDir: string): string {
        const firstLetter = legalIdentifier.charAt(0).toUpperCase();
        return path.join(baseDir, firstLetter);
    }
    
    /**
     * Get the full file path for a processed document
     */
    private getProcessedFilePath(legalIdentifier: string): string {
        const subdirectory = this.getSubdirectoryPath(legalIdentifier, this.processedDir);
        return path.join(subdirectory, `${legalIdentifier}.json`);
    }
    
    /**
     * Get the full file path for an embeddings document
     */
    private getEmbeddingFilePath(legalIdentifier: string): string {
        const subdirectory = this.getSubdirectoryPath(legalIdentifier, this.embeddingsDir);
        return path.join(subdirectory, `${legalIdentifier}.json`);
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
        
        // Create subdirectories for each letter (A-Z)
        console.log("📁 Creating subdirectories for organized file storage...");
        for (let i = 65; i <= 90; i++) { // A-Z
            const letter = String.fromCharCode(i);
            const processedSubdir = path.join(this.processedDir, letter);
            const embeddingsSubdir = path.join(this.embeddingsDir, letter);
            
            if (!fs.existsSync(processedSubdir)) {
                fs.mkdirSync(processedSubdir, { recursive: true });
            }
            if (!fs.existsSync(embeddingsSubdir)) {
                fs.mkdirSync(embeddingsSubdir, { recursive: true });
            }
        }
        
        const errors: string[] = [];
        const warnings: string[] = [];
        let processedCount = 0;
        let partialSuccessCount = 0;
        let skippedCount = 0;
        
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const startIndex = batchIndex * this.batchSize;
            const endIndex = Math.min(startIndex + this.batchSize, documentsToProcess.length);
            const batch = documentsToProcess.slice(startIndex, endIndex);
            
            console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (documents ${startIndex + 1}-${endIndex})`);
            
            for (const doc of batch) {
                try {
                    // Check if already processed (skip only if not in force mode)
                    const processedPath = this.getProcessedFilePath(doc.legalIdentifier);
                    const embeddingPath = this.getEmbeddingFilePath(doc.legalIdentifier);
                    
                    if (!this.force && fs.existsSync(processedPath) && fs.existsSync(embeddingPath)) {
                        console.log(`⏭️  Skipping ${doc.legalIdentifier} (already processed)`);
                        skippedCount++;
                        continue;
                    }
                    
                    if (this.force && fs.existsSync(processedPath) && fs.existsSync(embeddingPath)) {
                        console.log(`🔄 Force reprocessing ${doc.legalIdentifier} (overwriting existing files)`);
                    }
                    
                    console.log(`⚙️  Processing: ${doc.legalIdentifier}`);
                    
                    // Process PDF content
                    const processedDoc = await this.processPDF(doc);
                    this.saveProcessedDocument(processedDoc);
                    
                    // Generate embeddings
                    let hasEmbeddingErrors = false;
                    if (!processedDoc.error) {
                        const embeddingData = await this.generateEmbeddings(processedDoc);
                        this.saveEmbeddings(embeddingData);
                        
                        // Check if there were embedding failures
                        if (embeddingData.error) {
                            const warningMsg = `⚠️  ${doc.legalIdentifier}: Content embedding failed - ${embeddingData.error}`;
                            warnings.push(warningMsg);
                            hasEmbeddingErrors = true;
                        } else if (embeddingData.chunkVectors.length < processedDoc.chunks.length) {
                            const failedChunks = processedDoc.chunks.length - embeddingData.chunkVectors.length;
                            const warningMsg = `⚠️  ${doc.legalIdentifier}: ${failedChunks} chunk embeddings failed`;
                            warnings.push(warningMsg);
                            hasEmbeddingErrors = true;
                        }
                    }
                    
                    if (hasEmbeddingErrors) {
                        partialSuccessCount++;
                        console.log(`⚠️  Partially completed: ${doc.legalIdentifier} (with embedding issues)`);
                    } else {
                        console.log(`✅ Completed: ${doc.legalIdentifier}`);
                    }
                    processedCount++;
                    
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
        
        // Save warnings log
        if (warnings.length > 0) {
            const warningsLogPath = path.join(this.processedDir, 'warnings.log');
            fs.writeFileSync(warningsLogPath, warnings.join('\n'));
            console.log(`⚠️  ${warnings.length} warnings saved to: ${warningsLogPath}`);
        }

        console.log(`\n🎉 Processing completed!`);
        console.log(`✅ Fully processed: ${processedCount - partialSuccessCount}`);
        console.log(`⚠️  Partially processed: ${partialSuccessCount} (with embedding issues)`);
        console.log(`⏭️  Skipped: ${skippedCount}`);
        console.log(`❌ Errors: ${errors.length}`);
        
        // Show specific issues if any
        if (partialSuccessCount > 0) {
            console.log(`\n🔍 Documents with embedding issues:`);
            warnings.forEach(warning => console.log(`   ${warning}`));
        }
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
            let failedChunks = 0;
            
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
                    failedChunks++;
                    // Continue with other chunks
                }
            }
            
            const result: EmbeddingData = {
                legalIdentifier: processedDoc.legalIdentifier,
                contentVector,
                chunkVectors,
                embeddingModel: 'text-embedding-ada-002',
                generatedAt: new Date().toISOString()
            };
            
            // Add metadata about failed chunks if any
            if (failedChunks > 0) {
                result.metadata = {
                    totalChunks: processedDoc.chunks.length,
                    successfulChunks: chunkVectors.length,
                    failedChunks: failedChunks
                };
            }
            
            return result;
            
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
        const filePath = this.getProcessedFilePath(processedDoc.legalIdentifier);
        // Ensure the subdirectory exists
        const subdirectory = path.dirname(filePath);
        if (!fs.existsSync(subdirectory)) {
            fs.mkdirSync(subdirectory, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(processedDoc, null, 2));
    }
    
    /**
     * Save embeddings to file
     */
    private saveEmbeddings(embeddingData: EmbeddingData): void {
        const filePath = this.getEmbeddingFilePath(embeddingData.legalIdentifier);
        // Ensure the subdirectory exists
        const subdirectory = path.dirname(filePath);
        if (!fs.existsSync(subdirectory)) {
            fs.mkdirSync(subdirectory, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(embeddingData, null, 2));
    }
    
    /**
     * Count files recursively in a directory
     */
    private countFilesRecursively(directory: string): number {
        let count = 0;
        if (!fs.existsSync(directory)) {
            return count;
        }
        
        const items = fs.readdirSync(directory);
        for (const item of items) {
            const itemPath = path.join(directory, item);
            const stats = fs.statSync(itemPath);
            
            if (stats.isDirectory()) {
                count += this.countFilesRecursively(itemPath);
            } else if (item.endsWith('.json') && item !== 'errors.log') {
                count++;
            }
        }
        return count;
    }
    
    /**
     * Get processing statistics
     */
    getProcessingStats(): any {
        const processedFiles = this.countFilesRecursively(this.processedDir);
        const embeddingFiles = this.countFilesRecursively(this.embeddingsDir);
        
        return {
            processedDocuments: processedFiles,
            embeddingFiles: embeddingFiles,
            totalDocumentsInManifest: this.manifest.documentsWithPdf,
            completionRate: Math.round((processedFiles / this.manifest.documentsWithPdf) * 100)
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
    const force = process.argv[7] === 'true';
    
    if (!manifestPath || !openaiApiKey) {
        console.error('Usage: node contentProcessor.js <manifest-path> <openai-api-key> [batch-size] [processed-dir] [embeddings-dir] [force]');
        process.exit(1);
    }
    
    try {
        const processor = new ContentProcessor(manifestPath, openaiApiKey, batchSize, processedDir, embeddingsDir, force);
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
