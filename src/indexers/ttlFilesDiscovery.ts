/**
 * TTL Files Discovery
 * Discovers and catalogs all files referenced in TTL metadata
 */

import { Store, DataFactory, Parser } from 'n3';
import * as fs from 'fs';
import * as path from 'path';

const { namedNode } = DataFactory;

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
    generatedAt: string;
    ttlSource: string;
    dataSourcePath: string;
    totalDocuments: number;
    documentsWithPdf: number;
    documentsMissingPdf: number;
    documents: DocumentManifest[];
    statistics: {
        documentTypes: Record<string, number>;
        averageFileSize: number;
        totalSize: number;
    };
}

/**
 * Discover files referenced in TTL metadata
 */
export class TTLFilesDiscovery {
    private store: Store;
    private ttlFilePath: string;
    private dataSourcePath: string;
    
    constructor(ttlFilePath: string, dataSourcePath: string) {
        this.store = new Store();
        this.ttlFilePath = ttlFilePath;
        this.dataSourcePath = dataSourcePath;
    }
    
    /**
     * Load TTL file
     */
    async loadTTL(): Promise<void> {
        console.log(`📖 Loading TTL file: ${this.ttlFilePath}`);
        
        if (!fs.existsSync(this.ttlFilePath)) {
            throw new Error(`TTL file not found: ${this.ttlFilePath}`);
        }
        
        const ttlContent = fs.readFileSync(this.ttlFilePath, 'utf-8');
        const parser = new Parser();
        
        return new Promise((resolve, reject) => {
            parser.parse(ttlContent, (error, quad, prefixes) => {
                if (error) {
                    reject(error);
                } else if (quad) {
                    this.store.addQuad(quad);
                } else {
                    console.log(`✅ Loaded ${this.store.size} triples from TTL`);
                    resolve();
                }
            });
        });
    }
    
    /**
     * Discover all documents referenced in TTL
     */
    discoverDocuments(): DocumentManifest[] {
        console.log('🔍 Discovering documents from TTL metadata...');
        
        const documents: DocumentManifest[] = [];
        const documentSubjects = new Set<string>();
        
        // Find all document subjects (entities with dcterms:identifier or dcterms:title)
        const identifierQuads = this.store.getQuads(
            null, 
            namedNode('http://purl.org/dc/terms/identifier'), 
            null
        );
        
        // Also look for documents with titles
        const titleQuads = this.store.getQuads(
            null, 
            namedNode('http://purl.org/dc/terms/title'), 
            null
        );
        
        for (const quad of identifierQuads) {
            documentSubjects.add(quad.subject.value);
        }
        
        for (const quad of titleQuads) {
            documentSubjects.add(quad.subject.value);
        }
        
        console.log(`📋 Found ${documentSubjects.size} documents in TTL`);
        
        // Extract metadata for each document
        for (const subject of documentSubjects) {
            const doc = this.extractDocumentMetadata(subject);
            if (doc) {
                documents.push(doc);
            }
        }
        
        console.log(`✅ Processed ${documents.length} documents`);
        return documents;
    }
    
    /**
     * Extract metadata for a single document
     */
    private extractDocumentMetadata(subjectUri: string): DocumentManifest | null {
        const subject = namedNode(subjectUri);
        
        // Extract basic properties using SPARQL-like queries
        const legalIdentifier = this.getPropertyValue(subject, 'http://purl.org/dc/terms/identifier');
        const title = this.getPropertyValue(subject, 'http://purl.org/dc/terms/title');
        const documentType = this.getPropertyValue(subject, 'http://purl.org/dc/terms/type');
        
        // Look for PDF paths in legis namespace
        const pdfPath = this.getPropertyValue(subject, 'https://legisquebec.gouv.qc.ca/ontology/localPdfPath') ||
                       this.getPropertyValue(subject, 'http://www.w3.org/ns/dcat#downloadURL') ||
                       this.getPropertyValue(subject, 'http://purl.org/dc/terms/source');
        const sourceUrl = this.getPropertyValue(subject, 'http://purl.org/dc/terms/source');
        
        if (!legalIdentifier && !title) {
            console.warn(`⚠️  Skipping document without identifier or title: ${subjectUri}`);
            return null;
        }
        
        // Construct full PDF path
        let pdfFullPath = '';
        
        if (pdfPath) {
            if (path.isAbsolute(pdfPath)) {
                // If it's an absolute path, try to adapt it to current environment
                // Replace known prefixes with our data source path
                const relativePath = pdfPath.replace(/^\/home\/parallels\/00-GIT\/cotechnoe-kb-legis-qc\/etl\//, '');
                pdfFullPath = path.join(this.dataSourcePath, relativePath);
            } else {
                // If it's relative, join with data source path
                pdfFullPath = path.join(this.dataSourcePath, pdfPath);
            }
        }
        
        const pdfExists = pdfFullPath ? fs.existsSync(pdfFullPath) : false;
        
        // Get file statistics if PDF exists
        let lastModified: Date | undefined;
        let fileSize: number | undefined;
        
        if (pdfExists) {
            try {
                const stats = fs.statSync(pdfFullPath);
                lastModified = stats.mtime;
                fileSize = stats.size;
            } catch (error) {
                console.warn(`⚠️  Could not get file stats for ${pdfFullPath}:`, error);
            }
        }
        
        // Extract all metadata
        const metadata = this.extractAllMetadata(subject);
        
        return {
            legalIdentifier: legalIdentifier || title || 'Unknown',
            title: title || legalIdentifier || 'Untitled',
            documentType: documentType || 'Unknown',
            pdfPath: pdfPath || '',
            pdfFullPath,
            pdfExists,
            sourceUrl: sourceUrl || '',
            lastModified,
            fileSize,
            metadata
        };
    }
    
    /**
     * Get property value for a subject
     */
    private getPropertyValue(subject: any, predicateUri: string): string | null {
        const quads = this.store.getQuads(subject, namedNode(predicateUri), null);
        return quads.length > 0 ? quads[0].object.value : null;
    }
    
    /**
     * Extract all metadata for a subject
     */
    private extractAllMetadata(subject: any): Record<string, any> {
        const metadata: Record<string, any> = {};
        const quads = this.store.getQuads(subject, null, null);
        
        for (const quad of quads) {
            const property = this.simplifyUri(quad.predicate.value);
            const value = quad.object.value;
            
            if (metadata[property]) {
                // Handle multiple values
                if (Array.isArray(metadata[property])) {
                    metadata[property].push(value);
                } else {
                    metadata[property] = [metadata[property], value];
                }
            } else {
                metadata[property] = value;
            }
        }
        
        return metadata;
    }
    
    /**
     * Simplify URI to property name
     */
    private simplifyUri(uri: string): string {
        const parts = uri.split('/');
        const lastPart = parts[parts.length - 1];
        return lastPart.split('#').pop() || lastPart;
    }
    
    /**
     * Generate statistics
     */
    private generateStatistics(documents: DocumentManifest[]): FilesManifest['statistics'] {
        const documentTypes: Record<string, number> = {};
        let totalSize = 0;
        let filesWithSize = 0;
        
        for (const doc of documents) {
            // Count document types
            documentTypes[doc.documentType] = (documentTypes[doc.documentType] || 0) + 1;
            
            // Calculate total size
            if (doc.fileSize) {
                totalSize += doc.fileSize;
                filesWithSize++;
            }
        }
        
        const averageFileSize = filesWithSize > 0 ? totalSize / filesWithSize : 0;
        
        return {
            documentTypes,
            averageFileSize: Math.round(averageFileSize),
            totalSize
        };
    }
    
    /**
     * Create complete manifest
     */
    createManifest(): FilesManifest {
        const documents = this.discoverDocuments();
        const documentsWithPdf = documents.filter(d => d.pdfExists).length;
        const documentsMissingPdf = documents.length - documentsWithPdf;
        
        console.log(`📊 Manifest summary:`);
        console.log(`   Total documents: ${documents.length}`);
        console.log(`   With PDF: ${documentsWithPdf}`);
        console.log(`   Missing PDF: ${documentsMissingPdf}`);
        
        const statistics = this.generateStatistics(documents);
        
        return {
            generatedAt: new Date().toISOString(),
            ttlSource: path.basename(this.ttlFilePath),
            dataSourcePath: this.dataSourcePath,
            totalDocuments: documents.length,
            documentsWithPdf,
            documentsMissingPdf,
            documents,
            statistics
        };
    }
}

/**
 * Main execution function
 */
async function main() {
    const ttlPath = process.argv[2];
    const outputPath = process.argv[3];
    const dataSourcePath = process.argv[4];
    
    if (!ttlPath || !outputPath || !dataSourcePath) {
        console.error('Usage: node ttlFilesDiscovery.js <ttl-path> <output-path> <data-source-path>');
        process.exit(1);
    }
    
    try {
        const discovery = new TTLFilesDiscovery(ttlPath, dataSourcePath);
        await discovery.loadTTL();
        const manifest = discovery.createManifest();
        
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Write manifest to file
        fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
        
        console.log('✅ Files discovery completed successfully');
        console.log(`📄 Manifest saved to: ${outputPath}`);
        console.log(`📊 Statistics:`);
        console.log(`   Document types: ${Object.keys(manifest.statistics.documentTypes).length}`);
        console.log(`   Average file size: ${Math.round(manifest.statistics.averageFileSize / 1024)} KB`);
        console.log(`   Total size: ${Math.round(manifest.statistics.totalSize / 1024 / 1024)} MB`);
        
    } catch (error) {
        console.error('❌ Files discovery failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}
