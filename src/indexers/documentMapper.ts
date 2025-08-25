import { getTTLParser, LegalMetadata } from './ttlParser';
import * as fs from 'fs';
import * as path from 'path';
import { getEmbeddingVector } from './utils';
import { EnrichedLegalDocument } from './enhancedSetup';

/**
 * SPARQL-based Data Population Manager
 * Uses SPARQL queries to extract specific documents from TTL metadata
 */
class SPARQLDataPopulator {
    private ttlParser: any;
    private dataSourcePath: string;
    
    constructor(dataSourcePath: string) {
        this.dataSourcePath = dataSourcePath;
    }
    
    /**
     * Initialize TTL parser for SPARQL queries
     */
    async initializeTTLParser(): Promise<void> {
        console.log('🔄 Initializing TTL parser for SPARQL extraction...');
        this.ttlParser = await getTTLParser();
        console.log('✅ TTL parser ready for SPARQL queries');
    }
    
    /**
     * Extract sample documents using SPARQL
     * @param sampleIdentifiers Array of legal identifiers to extract
     */
    async extractSampleDocuments(sampleIdentifiers: string[]): Promise<LegalMetadata[]> {
        if (!this.ttlParser) {
            throw new Error('TTL parser not initialized. Call initializeTTLParser() first.');
        }
        
        console.log(`🔍 Extracting ${sampleIdentifiers.length} documents using SPARQL...`);
        const extractedDocs: LegalMetadata[] = [];
        
        for (const identifier of sampleIdentifiers) {
            console.log(`   📄 Getting document for identifier: ${identifier}`);
            
            try {
                // Use TTL parser's built-in method instead of custom SPARQL
                const metadata = await this.ttlParser.getDocumentByIdentifier(identifier);
                
                if (metadata) {
                    extractedDocs.push(metadata);
                    console.log(`   ✅ Extracted: ${identifier} - ${metadata.title}`);
                    console.log(`      📊 Status: ${metadata.status} | Keywords: ${metadata.keywords.length}`);
                } else {
                    console.warn(`   ⚠️  No data found for identifier: ${identifier}`);
                }
                
            } catch (error) {
                console.error(`   ❌ Error for ${identifier}:`, error);
            }
        }
        
        console.log(`📊 SPARQL extraction completed: ${extractedDocs.length}/${sampleIdentifiers.length} documents`);
        return extractedDocs;
    }
    
    /**
     * Validate that PDF files exist for extracted documents
     */
    async validatePDFFiles(documents: LegalMetadata[]): Promise<LegalMetadata[]> {
        console.log('🔍 Validating PDF file availability...');
        const validDocuments: LegalMetadata[] = [];
        
        for (const doc of documents) {
            // Construct expected PDF path
            const expectedPdfName = `${doc.legalIdentifier}_${this.slugify(doc.title)}.pdf`;
            const pdfDirectory = path.join(this.dataSourcePath, 'extract/pdf', doc.legalIdentifier.charAt(0));
            const expectedPdfPath = path.join(pdfDirectory, expectedPdfName);
            
            console.log(`   📄 Checking: ${expectedPdfPath}`);
            
            if (fs.existsSync(expectedPdfPath)) {
                // Update the PDF path to the actual file location
                doc.pdfPath = expectedPdfPath;
                validDocuments.push(doc);
                console.log(`   ✅ PDF found: ${doc.legalIdentifier}`);
            } else {
                console.warn(`   ❌ PDF missing: ${expectedPdfPath}`);
                
                // Try to find PDF with different naming pattern
                const files = fs.readdirSync(pdfDirectory);
                const matchingFile = files.find(file => 
                    file.startsWith(doc.legalIdentifier + '_') && file.endsWith('.pdf')
                );
                
                if (matchingFile) {
                    doc.pdfPath = path.join(pdfDirectory, matchingFile);
                    validDocuments.push(doc);
                    console.log(`   ✅ PDF found (alt name): ${matchingFile}`);
                } else {
                    console.warn(`   ⚠️  Skipping ${doc.legalIdentifier} - PDF not found`);
                }
            }
        }
        
        console.log(`📊 PDF validation: ${validDocuments.length}/${documents.length} files available`);
        return validDocuments;
    }
    
    /**
     * Process documents: extract PDF content and generate embeddings
     */
    async processDocuments(documents: LegalMetadata[]): Promise<EnrichedLegalDocument[]> {
        console.log('🚀 Processing documents with PDF content and embeddings...');
        const processedDocs: EnrichedLegalDocument[] = [];
        
        for (const doc of documents) {
            try {
                console.log(`   📖 Processing: ${doc.legalIdentifier} - ${doc.title}`);
                
                // Read PDF content
                const pdf = require('pdf-parse');
                const pdfBuffer = fs.readFileSync(doc.pdfPath);
                const pdfContent = await pdf(pdfBuffer);
                
                console.log(`   📄 PDF content: ${pdfContent.text.length} characters`);
                
                // Generate enhanced description combining TTL description and PDF preview
                const contentPreview = pdfContent.text.substring(0, 500).trim();
                const enhancedDescription = this.createEnhancedDescription(doc, contentPreview);
                
                // Generate embedding for the enhanced description
                console.log(`   🔢 Generating embedding...`);
                const descriptionVector = await getEmbeddingVector(enhancedDescription);
                
                // Create enriched document
                const enrichedDoc: EnrichedLegalDocument = {
                    id: this.encodeDocumentKey(doc.legalIdentifier),
                    title: doc.title,
                    description: enhancedDescription,
                    content: enhancedDescription,
                    contentVector: descriptionVector,
                    legalIdentifier: doc.legalIdentifier,
                    documentType: doc.documentType,
                    legalStatus: doc.status,
                    legalStatusLang: doc.statusLang,
                    sourceUrl: doc.sourceUrl,
                    pdfPath: doc.pdfPath,
                    pdfSource: doc.pdfSource,
                    titleLang: doc.titleLang,
                    descriptionLang: doc.descriptionLang,
                    keywords: [...doc.keywords],
                    enrichedAt: new Date(),
                    enrichmentMethod: 'SPARQL_TTL_Parser',
                    downloadStatus: doc.downloadStatus,
                    lastModified: new Date(),
                    searchableText: this.createSearchableText(doc, pdfContent.text),
                    contentHash: this.generateContentHash(pdfContent.text)
                };
                
                processedDocs.push(enrichedDoc);
                console.log(`   ✅ Processed: ${doc.legalIdentifier} (${descriptionVector.length}D vector)`);
                
            } catch (error) {
                console.error(`   ❌ Error processing ${doc.legalIdentifier}:`, error);
            }
        }
        
        console.log(`📊 Document processing completed: ${processedDocs.length}/${documents.length} documents`);
        return processedDocs;
    }
    
    /**
     * Create enhanced description combining TTL metadata and PDF content
     */
    private createEnhancedDescription(metadata: LegalMetadata, contentPreview: string): string {
        const keywordsText = metadata.keywords.length > 0 
            ? ` Mots-clés: ${metadata.keywords.slice(0, 10).join(', ')}.`
            : '';
            
        return `${metadata.documentType} ${metadata.legalIdentifier}: ${metadata.title}. ` +
               `Statut: ${metadata.status}. ${metadata.description} ` +
               `Contenu: ${contentPreview}...${keywordsText}`;
    }
    
    /**
     * Create searchable text combining all relevant fields
     */
    private createSearchableText(metadata: LegalMetadata, pdfContent: string): string {
        return [
            metadata.legalIdentifier,
            metadata.title,
            metadata.description,
            metadata.keywords.join(' '),
            pdfContent.substring(0, 10000) // Limit to prevent token overflow
        ].join(' ');
    }
    
    /**
     * Generate content hash for deduplication
     */
    private generateContentHash(content: string): string {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(content).digest('hex');
    }
    
    /**
     * Encode document key for Azure Search compatibility
     */
    private encodeDocumentKey(legalIdentifier: string): string {
        return legalIdentifier
            .replace(/\./g, '_')  // Replace dots with underscores
            .replace(/[^a-zA-Z0-9_\-=]/g, '_');  // Replace other invalid chars
    }
    
    /**
     * Create URL-friendly slug from title
     */
    private slugify(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}

export { SPARQLDataPopulator, LegalMetadata, EnrichedLegalDocument };
