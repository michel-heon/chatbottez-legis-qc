/**
 * Index Populator from TTL
 * Populates Azure Search index with processed content and TTL metadata
 */

import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import config from '../config';

const execAsync = promisify(exec);

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
        processedDir: string = path.join(process.env.EXTERNAL_DATA_SOURCE_PATH || 'src/indexers/data', 'transform/processed'),
        embeddingsDir: string = path.join(process.env.EXTERNAL_DATA_SOURCE_PATH || 'src/indexers/data', 'transform/embeddings')
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
        // Manifest will be loaded asynchronously in populateIndex()
        this.manifest = { documents: [], totalDocuments: 0 };
    }

    /**
     * Initialize manifest from TTL (called at start of populateIndex)
     */
    private async initializeManifest(): Promise<void> {
        this.manifest = await this.loadManifestFromTTL();
    }
    
    /**
     * Load files manifest from TTL file directly
     */
    private async loadManifestFromTTL(): Promise<FilesManifest> {
        console.log(`📖 Loading files manifest from existing JSON (bypassing SPARQL issues)...`);
        
        // Use the pre-generated manifest that contains all 4,649 documents
        // This bypasses the SPARQL buffer overflow issue
        return this.loadManifest();
    }
    
    /**
     * Parse TTL file to extract document metadata using SPARQL
     */
    private async parseTTLDocuments(ttlPath: string): Promise<DocumentManifest[]> {
        console.log('🔍 Parsing TTL with SPARQL for @fr language tag support...');
        
        try {
            // Use SPARQL for robust metadata extraction
            const sparqlMetadata = await this.extractMetadataWithSPARQL(ttlPath);
            const documents: DocumentManifest[] = [];
            
            for (const metadata of sparqlMetadata) {
                const legalIdentifier = metadata.legalIdentifier;
                if (!legalIdentifier) continue;
                
                // Check if PDF exists
                const pdfPath = this.constructPDFPath(legalIdentifier);
                
                const doc: DocumentManifest = {
                    legalIdentifier,
                    title: metadata.title || `Document ${legalIdentifier}`,
                    documentType: 'Loi',
                    pdfPath,
                    pdfFullPath: pdfPath,
                    pdfExists: fs.existsSync(pdfPath),
                    sourceUrl: metadata.sourceUrl || `https://www.legisquebec.gouv.qc.ca/fr/document/lc/${legalIdentifier}`,
                    metadata: {
                        ...metadata,
                        // Ensure critical fields are properly set
                        status: metadata.status,
                        abrogatedBy: metadata.abrogatedBy,
                        downloadStatus: metadata.downloadStatus,
                        format: metadata.format,
                        description: metadata.description,
                        keywords: metadata.keywords,
                        enrichedAt: metadata.enrichedAt,
                        enrichmentMethod: metadata.enrichmentMethod
                    }
                };
                
                documents.push(doc);
            }
            
            console.log(`✅ SPARQL parsing complete: ${documents.length} documents with proper metadata`);
            
            // Debug: Show A-3 and A-3.001 metadata
            const a3001 = documents.find(d => d.legalIdentifier === 'A-3.001');
            const a3 = documents.find(d => d.legalIdentifier === 'A-3');
            
            if (a3001) {
                console.log(`🔍 A-3.001 metadata: status="${a3001.metadata.status}", title="${a3001.title}"`);
            }
            if (a3) {
                console.log(`🔍 A-3 metadata: status="${a3.metadata.status}", abrogatedBy="${a3.metadata.abrogatedBy}"`);
            }
            
            return documents;
            
        } catch (error) {
            console.warn(`⚠️  SPARQL parsing failed, falling back to legacy parsing:`, error);
            // Fallback to old parsing method if SPARQL fails
            return this.parseTTLDocumentsLegacy(ttlPath);
        }
    }

    /**
     * Legacy TTL parsing method (fallback)
     */
    private parseTTLDocumentsLegacy(ttlPath: string): DocumentManifest[] {
        const ttlContent = fs.readFileSync(ttlPath, 'utf-8');
        const documents: DocumentManifest[] = [];
        
        // Split TTL into individual document blocks
        const documentBlocks = this.splitTTLIntoDocuments(ttlContent);
        
        for (const block of documentBlocks) {
            try {
                const doc = this.parseTTLDocumentBlock(block);
                if (doc) {
                    documents.push(doc);
                }
            } catch (error) {
                console.warn(`⚠️  Failed to parse TTL document block:`, error);
            }
        }
        
        return documents;
    }
    
    /**
     * Split TTL content into individual document blocks
     */
    private splitTTLIntoDocuments(ttlContent: string): string[] {
        const lines = ttlContent.split('\n');
        const documentBlocks: string[] = [];
        let currentBlock: string[] = [];
        let inDocument = false;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('@prefix')) {
                continue;
            }
            
            // Detect start of a new document (URI with ontology/loi/)
            if (trimmedLine.includes('ontology/loi/') && trimmedLine.startsWith('<')) {
                // Save previous document if exists
                if (currentBlock.length > 0) {
                    documentBlocks.push(currentBlock.join('\n'));
                }
                // Start new document
                currentBlock = [line];
                inDocument = true;
            } else if (inDocument) {
                currentBlock.push(line);
                
                // End of document block (line ending with .)
                if (trimmedLine.endsWith(' .') || trimmedLine === '.') {
                    documentBlocks.push(currentBlock.join('\n'));
                    currentBlock = [];
                    inDocument = false;
                }
            }
        }
        
        // Add last document if exists
        if (currentBlock.length > 0) {
            documentBlocks.push(currentBlock.join('\n'));
        }
        
        console.log(`📋 Found ${documentBlocks.length} document blocks in TTL`);
        return documentBlocks;
    }
    
    /**
     * Parse a single TTL document block into DocumentManifest
     */
    private parseTTLDocumentBlock(block: string): DocumentManifest | null {
        const lines = block.split('\n');
        let legalIdentifier = '';
        let title = '';
        let sourceUrl = '';
        const metadata: Record<string, any> = {};
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Extract document URI and identifier from ontology/loi/
            if (trimmedLine.includes('ontology/loi/') && trimmedLine.startsWith('<')) {
                const match = trimmedLine.match(/<https:\/\/legisquebec\.gouv\.qc\.ca\/ontology\/loi\/([^>]+)>/);
                if (match) {
                    legalIdentifier = match[1];
                    // Map to document URL for sourceUrl
                    sourceUrl = `https://www.legisquebec.gouv.qc.ca/fr/document/lc/${legalIdentifier}`;
                }
            }
            
            // Extract dcterms:source as alternative source URL
            if (trimmedLine.includes('dcterms:source')) {
                const sourceMatch = trimmedLine.match(/<([^>]+)>/);
                if (sourceMatch) {
                    sourceUrl = sourceMatch[1];
                }
            }
            
            // Extract title
            if (trimmedLine.includes('dcterms:title')) {
                const titleMatch = trimmedLine.match(/"([^"]+)"/);
                if (titleMatch) {
                    title = titleMatch[1];
                }
            }
            
            // Extract other metadata fields
            this.extractMetadataField(trimmedLine, 'legis:status', metadata, 'status');
            this.extractMetadataField(trimmedLine, 'legis:abrogatedBy', metadata, 'abrogatedBy');
            this.extractMetadataField(trimmedLine, 'legis:downloadStatus', metadata, 'downloadStatus');
            this.extractMetadataField(trimmedLine, 'legis:enrichmentMethod', metadata, 'enrichmentMethod');
            this.extractMetadataField(trimmedLine, 'dcterms:format', metadata, 'format');
            this.extractMetadataField(trimmedLine, 'schema:description', metadata, 'description');
            
            // Extract identifier
            if (trimmedLine.includes('dcterms:identifier')) {
                const idMatch = trimmedLine.match(/"([^"]+)"/);
                if (idMatch) {
                    metadata.identifier = idMatch[1];
                }
            }
            
            // Extract boolean fields
            if (trimmedLine.includes('schema:isReplacedBy')) {
                metadata.isReplacedBy = trimmedLine.includes('true');
            }
            
            // Extract datetime fields
            if (trimmedLine.includes('legis:enrichedAt')) {
                const dateMatch = trimmedLine.match(/"([^"]+)"/);
                if (dateMatch) {
                    metadata.enrichedAt = dateMatch[1];
                }
            }
            
            // Extract keywords (multiple values)
            if (trimmedLine.includes('schema:keywords')) {
                if (!metadata.keywords) metadata.keywords = [];
                const keywordMatch = trimmedLine.match(/"([^"]+)"/);
                if (keywordMatch) {
                    metadata.keywords.push(keywordMatch[1]);
                }
            }
            
            // Extract RDF types
            if (trimmedLine.includes(' a ') && !trimmedLine.includes('schema:')) {
                if (!metadata.type) metadata.type = [];
                const typeMatches = trimmedLine.match(/a\s+([^,;.]+)/);
                if (typeMatches) {
                    const types = typeMatches[1].split(',').map(t => t.trim());
                    metadata.type.push(...types);
                }
            }
        }
        
        if (!legalIdentifier) {
            return null;
        }
        
        // Check if PDF exists
        const pdfPath = this.constructPDFPath(legalIdentifier);
        
        return {
            legalIdentifier,
            title: title || `Document ${legalIdentifier}`,
            documentType: 'Loi',
            pdfPath,
            pdfFullPath: pdfPath,
            pdfExists: fs.existsSync(pdfPath),
            sourceUrl,
            metadata
        };
    }
    
    /**
     * Extract metadata field from TTL line - DEPRECATED
     * Use SPARQL extraction instead for language tag support
     */
    private extractMetadataField(line: string, property: string, metadata: Record<string, any>, key: string): void {
        if (line.includes(property)) {
            // Enhanced pattern to handle @fr language tags
            const match = line.match(/"([^"]+)"(@fr)?/);
            if (match) {
                metadata[key] = match[1];
            }
        }
    }

    /**
     * SPARQL-based metadata extraction
     * Properly handles @fr language tags and complex TTL structures
     */
    private async extractMetadataWithSPARQL(ttlPath: string): Promise<Record<string, any>[]> {
        console.log('🔍 Using SPARQL for TTL metadata extraction...');
        
        const tempDir = '/tmp/indexer-sparql';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const queryFile = path.join(tempDir, 'extract-metadata.sparql');
        const sparqlQuery = `
PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
PREFIX legal: <http://www.legalruleml.org/ns/>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX schema: <https://schema.org/>

SELECT ?legalIdentifier ?title ?status ?abrogatedBy ?downloadStatus ?format 
       ?description ?keywords ?enrichedAt ?enrichmentMethod ?sourceUrl ?type
WHERE {
    ?doc a legal:LegalRule ;
         dcterms:identifier ?legalIdentifier .
    
    # Extract all metadata with proper @fr language tag support
    OPTIONAL { ?doc dcterms:title ?title }
    OPTIONAL { ?doc legis:status ?status }
    OPTIONAL { 
        ?doc legis:abrogatedBy ?abrogatedByURI .
        BIND(REPLACE(STR(?abrogatedByURI), ".*ontology/loi/", "") AS ?abrogatedBy)
    }
    OPTIONAL { ?doc legis:downloadStatus ?downloadStatus }
    OPTIONAL { ?doc dcterms:format ?format }
    OPTIONAL { ?doc schema:description ?description }
    OPTIONAL { ?doc schema:keywords ?keywords }
    OPTIONAL { ?doc legis:enrichedAt ?enrichedAt }
    OPTIONAL { ?doc legis:enrichmentMethod ?enrichmentMethod }
    OPTIONAL { ?doc dcterms:source ?sourceUrl }
    OPTIONAL { ?doc a ?type }
}
ORDER BY ?legalIdentifier
        `;
        
        fs.writeFileSync(queryFile, sparqlQuery);
        
        try {
            const jenaPath = '/opt/jena';
            const command = `cd "${jenaPath}/bin" && ./sparql --data="${ttlPath}" --query="${queryFile}" --results=JSON`;
            
            const { stdout, stderr } = await execAsync(command, { maxBuffer: 50 * 1024 * 1024 }); // 50MB buffer for large TTL files
            
            if (stderr) {
                console.warn('⚠️  SPARQL stderr:', stderr);
            }
            
            const results = JSON.parse(stdout);
            const documents = new Map();
            
            if (results.results && results.results.bindings) {
                for (const binding of results.results.bindings) {
                    const legalId = binding.legalIdentifier?.value;
                    if (!legalId) continue;
                    
                    let doc = documents.get(legalId);
                    if (!doc) {
                        doc = { legalIdentifier: legalId };
                        documents.set(legalId, doc);
                    }
                    
                    // Extract all metadata fields
                    if (binding.title?.value) doc.title = binding.title.value;
                    if (binding.status?.value) doc.status = binding.status.value;
                    if (binding.abrogatedBy?.value) doc.abrogatedBy = binding.abrogatedBy.value;
                    if (binding.downloadStatus?.value) doc.downloadStatus = binding.downloadStatus.value;
                    if (binding.format?.value) doc.format = binding.format.value;
                    if (binding.description?.value) doc.description = binding.description.value;
                    if (binding.enrichedAt?.value) doc.enrichedAt = binding.enrichedAt.value;
                    if (binding.enrichmentMethod?.value) doc.enrichmentMethod = binding.enrichmentMethod.value;
                    if (binding.sourceUrl?.value) doc.sourceUrl = binding.sourceUrl.value;
                    
                    // Handle multiple keywords
                    if (binding.keywords?.value) {
                        if (!doc.keywords) doc.keywords = [];
                        if (!doc.keywords.includes(binding.keywords.value)) {
                            doc.keywords.push(binding.keywords.value);
                        }
                    }
                    
                    // Handle multiple types
                    if (binding.type?.value) {
                        if (!doc.type) doc.type = [];
                        const typeValue = binding.type.value.replace(/.*[#\/]/, '');
                        if (!doc.type.includes(typeValue)) {
                            doc.type.push(typeValue);
                        }
                    }
                }
            }
            
            const documentArray = Array.from(documents.values());
            console.log(`✅ SPARQL extracted ${documentArray.length} documents with proper @fr support`);
            
            // Clean up temp files
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            } catch (e) {
                console.warn('⚠️  Failed to cleanup SPARQL temp files:', e);
            }
            
            return documentArray;
            
        } catch (error) {
            console.error('❌ SPARQL extraction failed:', error);
            throw error;
        }
    }
    
    /**
     * Construct PDF path based on legal identifier
     */
    private constructPDFPath(legalIdentifier: string): string {
        const basePath = process.env.EXTERNAL_DATA_SOURCE_PATH || '/media/psf/Developpement/00-GIT/cotechnoe-kb-legis-qc/etl';
        const firstLetter = legalIdentifier.charAt(0);
        return path.join(basePath, 'extract/pdf', firstLetter, `${legalIdentifier}_*.pdf`);
    }
    
    /**
     * Load files manifest (fallback method)
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
        
        // Initialize manifest from TTL with SPARQL
        console.log(`🔄 Initializing manifest from TTL with SPARQL support...`);
        await this.initializeManifest();
        
        if (this.mode === 'full') {
            await this.clearIndex();
        }
        
        const documentsToProcess = await this.getDocumentsToProcess();
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
                    
                    // Add verification step
                    console.log(`🔍 Verifying batch upload...`);
                    await this.verifyBatchUpload(indexDocuments);
                } else {
                    console.log(`⏭️  Batch ${batchIndex + 1} skipped (no valid documents)`);
                }
                
            } catch (error) {
                const errorMsg = `Batch ${batchIndex + 1} failed: ${error}`;
                console.error(`❌ ${errorMsg}`);
                errors.push(errorMsg);
                errorCount += batch.length;
            }
            
            // Increased delay between batches for better stability
            if (batchIndex < totalBatches - 1) {
                console.log('⏳ Waiting 3 seconds before next batch...');
                await new Promise(resolve => setTimeout(resolve, 3000));
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
     * Get documents to process based on mode
     */
    private async getDocumentsToProcess(): Promise<DocumentManifest[]> {
        console.log(`🔍 Checking available documents from TTL manifest...`);
        console.log(`📊 TTL manifest contains: ${this.manifest.totalDocuments} documents`);
        
        const availableDocuments = this.manifest.documents.filter(doc => {
            const processedPath = this.getProcessedFilePath(doc.legalIdentifier);
            const hasProcessed = fs.existsSync(processedPath);
            
            if (!hasProcessed) {
                console.log(`⚠️  No processed file found for ${doc.legalIdentifier} at ${processedPath}`);
            }
            
            return hasProcessed;
        });
        
        console.log(`📋 Available documents with processed content: ${availableDocuments.length}/${this.manifest.totalDocuments}`);
        
        if (this.mode === 'incremental') {
            console.log('🔍 Checking existing documents in index for incremental mode...');
            
            // Check which documents already exist in the index
            const existingDocuments = new Set<string>();
            
            try {
                const searchResults = await this.searchClient.search('*', {
                    select: ['legalIdentifier'],
                    top: 1000
                });
                
                for await (const result of searchResults.results) {
                    if (result.document.legalIdentifier) {
                        existingDocuments.add(result.document.legalIdentifier);
                    }
                }
                
                console.log(`📊 Found ${existingDocuments.size} existing documents in index`);
                
                // Filter out documents that already exist
                const newDocuments = availableDocuments.filter(doc => 
                    !existingDocuments.has(doc.legalIdentifier)
                );
                
                console.log(`📋 ${newDocuments.length} new documents to process (${availableDocuments.length - newDocuments.length} already exist)`);
                return newDocuments;
                
            } catch (error) {
                console.warn('⚠️  Could not check existing documents, processing all:', error);
                return availableDocuments;
            }
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
        const processedPath = this.getProcessedFilePath(doc.legalIdentifier);
        if (!fs.existsSync(processedPath)) {
            console.warn(`⚠️  Processed file not found for ${doc.legalIdentifier} at ${processedPath}`);
            return null;
        }
        
        const processedContent: ProcessedDocument = JSON.parse(fs.readFileSync(processedPath, 'utf-8'));
        
        if (processedContent.error) {
            console.warn(`⚠️  Processed document has error: ${processedContent.error}`);
            return null;
        }
        
        // Load embeddings if available
        const embeddingPath = this.getEmbeddingFilePath(doc.legalIdentifier);
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
     * Verify that uploaded documents are actually available in the index
     */
    private async verifyBatchUpload(documents: IndexDocument[]): Promise<void> {
        // Wait a bit for indexing to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        let verified = 0;
        for (const doc of documents) {
            try {
                const searchResults = await this.searchClient.search(`legalIdentifier:${doc.legalIdentifier}`, {
                    select: ['id', 'legalIdentifier'],
                    top: 1
                });
                
                const found = await searchResults.results.next();
                if (!found.done) {
                    verified++;
                } else {
                    console.warn(`⚠️  Document ${doc.legalIdentifier} not found in index after upload`);
                }
            } catch (error) {
                console.warn(`⚠️  Could not verify document ${doc.legalIdentifier}:`, error);
            }
        }
        
        console.log(`✅ Verified ${verified}/${documents.length} documents in index`);
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
