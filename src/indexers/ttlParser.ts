/**
 * TTL Parser for Legal Metadata
 * Uses RDF/SPARQL to extract structured legal document metadata
 */

import { Store, DataFactory, Parser } from 'n3';
import * as fs from 'fs';
import * as path from 'path';
import config from '../config';

const { namedNode, literal, quad } = DataFactory;

/**
 * Interface for legal document metadata extracted from TTL
 */
export interface LegalMetadata {
    // Core identifiers
    uri: string;
    legalIdentifier: string;
    
    // Basic information
    title: string;
    titleLang: string;
    documentType: string;
    
    // Legal status
    status: string;
    statusLang: string;
    
    // Sources and paths
    sourceUrl: string;
    pdfPath: string;
    pdfSource: string;
    
    // Content
    description: string;
    descriptionLang: string;
    keywords: string[];
    
    // Metadata
    enrichedAt: Date | null;
    enrichmentMethod: string;
    downloadStatus: string;
    
    // Additional properties
    abrogatedBy?: string;
    isReplacedBy?: boolean;
    isPartOf?: string;
}

/**
 * SPARQL queries for extracting legal metadata
 */
export class LegalSPARQLQueries {
    
    /**
     * Get all legal documents with basic metadata
     */
    static getAllLegalDocuments(): string {
        return `
            PREFIX dcterms: <http://purl.org/dc/terms/>
            PREFIX legal: <http://www.legalruleml.org/ns/>
            PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
            PREFIX schema: <https://schema.org/>
            PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
            
            SELECT ?document ?identifier ?title ?type ?status ?sourceUrl ?description ?enrichedAt ?downloadStatus
            WHERE {
                ?document a legal:LegalRule ;
                         dcterms:identifier ?identifier ;
                         dcterms:title ?title ;
                         dcterms:source ?sourceUrl ;
                         legis:status ?status ;
                         legis:downloadStatus ?downloadStatus .
                
                OPTIONAL { ?document a ?type . FILTER(?type != legal:LegalRule) }
                OPTIONAL { ?document schema:description ?description }
                OPTIONAL { ?document legis:enrichedAt ?enrichedAt }
            }
            ORDER BY ?identifier
        `;
    }
    
    /**
     * Get detailed metadata for a specific document
     */
    static getDocumentDetails(identifier: string): string {
        return `
            PREFIX dcterms: <http://purl.org/dc/terms/>
            PREFIX legal: <http://www.legalruleml.org/ns/>
            PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
            PREFIX schema: <https://schema.org/>
            PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
            
            SELECT *
            WHERE {
                ?document dcterms:identifier "${identifier}" ;
                         a legal:LegalRule .
                
                OPTIONAL { ?document dcterms:title ?title }
                OPTIONAL { ?document dcterms:source ?sourceUrl }
                OPTIONAL { ?document legis:status ?status }
                OPTIONAL { ?document legis:localPdfPath ?pdfPath }
                OPTIONAL { ?document legis:pdfSource ?pdfSource }
                OPTIONAL { ?document schema:description ?description }
                OPTIONAL { ?document legis:enrichedAt ?enrichedAt }
                OPTIONAL { ?document legis:enrichmentMethod ?enrichmentMethod }
                OPTIONAL { ?document legis:downloadStatus ?downloadStatus }
                OPTIONAL { ?document legis:abrogatedBy ?abrogatedBy }
                OPTIONAL { ?document schema:isReplacedBy ?isReplacedBy }
                OPTIONAL { ?document legis:isPartOf ?isPartOf }
            }
        `;
    }
    
    /**
     * Get all keywords for documents
     */
    static getAllKeywords(): string {
        return `
            PREFIX dcterms: <http://purl.org/dc/terms/>
            PREFIX schema: <https://schema.org/>
            PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
            
            SELECT ?identifier ?keyword
            WHERE {
                ?document dcterms:identifier ?identifier ;
                         schema:keywords ?keyword .
            }
            ORDER BY ?identifier ?keyword
        `;
    }
    
    /**
     * Search documents by status
     */
    static getDocumentsByStatus(status: string): string {
        return `
            PREFIX dcterms: <http://purl.org/dc/terms/>
            PREFIX legal: <http://www.legalruleml.org/ns/>
            PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
            
            SELECT ?document ?identifier ?title ?status
            WHERE {
                ?document a legal:LegalRule ;
                         dcterms:identifier ?identifier ;
                         dcterms:title ?title ;
                         legis:status ?status .
                
                FILTER(CONTAINS(LCASE(STR(?status)), "${status.toLowerCase()}"))
            }
            ORDER BY ?identifier
        `;
    }
    
    /**
     * Search documents by keywords
     */
    static searchByKeywords(keyword: string): string {
        return `
            PREFIX dcterms: <http://purl.org/dc/terms/>
            PREFIX schema: <https://schema.org/>
            PREFIX legal: <http://www.legalruleml.org/ns/>
            
            SELECT ?document ?identifier ?title ?keyword
            WHERE {
                ?document a legal:LegalRule ;
                         dcterms:identifier ?identifier ;
                         dcterms:title ?title ;
                         schema:keywords ?keyword .
                
                FILTER(CONTAINS(LCASE(STR(?keyword)), "${keyword.toLowerCase()}"))
            }
            ORDER BY ?identifier
        `;
    }
}

/**
 * TTL Parser for legal metadata using RDF and SPARQL
 */
export class TTLMetadataParser {
    private store: Store;
    private ttlPath: string;
    
    constructor() {
        this.store = new Store();
        this.ttlPath = path.join(config.externalDataSourcePath, 'extract', 'rdf', 'legisquebec-metadata.ttl');
    }
    
    /**
     * Load and parse the TTL file
     */
    async loadTTL(): Promise<void> {
        try {
            console.log(`📄 Loading TTL file: ${this.ttlPath}`);
            
            if (!fs.existsSync(this.ttlPath)) {
                throw new Error(`TTL file not found: ${this.ttlPath}`);
            }
            
            const ttlContent = fs.readFileSync(this.ttlPath, 'utf8');
            console.log(`📊 TTL file size: ${(ttlContent.length / 1024 / 1024).toFixed(2)} MB`);
            
            return new Promise((resolve, reject) => {
                const parser = new Parser({ format: 'text/turtle' });
                
                parser.parse(ttlContent, (error, quad, prefixes) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    
                    if (quad) {
                        this.store.addQuad(quad);
                    } else {
                        // Parsing complete
                        console.log(`✅ TTL parsing complete. Loaded ${this.store.size} triples`);
                        resolve();
                    }
                });
            });
            
        } catch (error) {
            console.error(`❌ Error loading TTL file:`, error);
            throw error;
        }
    }
    
    /**
     * Execute SPARQL query on the loaded RDF store
     */
    private executeSPARQL(query: string): any[] {
        try {
            // Simple SPARQL implementation using N3 store
            // Note: This is a basic implementation. For complex queries, consider using a full SPARQL engine
            
            const results: any[] = [];
            
            // For now, we'll implement basic pattern matching
            // This would be replaced with a proper SPARQL engine in production
            
            console.log(`🔍 Executing SPARQL query...`);
            console.log(`Query: ${query.substring(0, 200)}...`);
            
            // This is a simplified approach - in practice, use a proper SPARQL engine
            return this.executeBasicPatternMatching(query);
            
        } catch (error) {
            console.error(`❌ Error executing SPARQL query:`, error);
            throw error;
        }
    }

    /**
     * Public method to execute SPARQL queries
     */
    public query(sparqlQuery: string): any[] {
        return this.executeSPARQL(sparqlQuery);
    }
    
    /**
     * Basic pattern matching for common queries (simplified SPARQL)
     */
    private executeBasicPatternMatching(query: string): any[] {
        const results: any[] = [];
        
        // Extract all legal documents
        if (query.includes('legal:LegalRule')) {
            const documents = this.store.getSubjects(
                namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                namedNode('http://www.legalruleml.org/ns/LegalRule'),
                null
            );
            
            for (const doc of documents) {
                const result: any = { document: doc.value };
                
                // Get identifier
                const identifiers = this.store.getObjects(doc, namedNode('http://purl.org/dc/terms/identifier'), null);
                if (identifiers.length > 0) {
                    result.identifier = identifiers[0].value;
                }
                
                // Get title
                const titles = this.store.getObjects(doc, namedNode('http://purl.org/dc/terms/title'), null);
                if (titles.length > 0) {
                    result.title = titles[0].value;
                }
                
                // Get status
                const statuses = this.store.getObjects(doc, namedNode('https://legisquebec.gouv.qc.ca/ontology/status'), null);
                if (statuses.length > 0) {
                    result.status = statuses[0].value;
                }
                
                // Get source URL
                const sources = this.store.getObjects(doc, namedNode('http://purl.org/dc/terms/source'), null);
                if (sources.length > 0) {
                    result.sourceUrl = sources[0].value;
                }
                
                // Get download status
                const downloadStatuses = this.store.getObjects(doc, namedNode('https://legisquebec.gouv.qc.ca/ontology/downloadStatus'), null);
                if (downloadStatuses.length > 0) {
                    result.downloadStatus = downloadStatuses[0].value;
                }
                
                results.push(result);
            }
        }
        
        return results;
    }
    
    /**
     * Get all legal documents
     */
    async getAllDocuments(): Promise<LegalMetadata[]> {
        const results = this.executeBasicPatternMatching(LegalSPARQLQueries.getAllLegalDocuments());
        return this.mapResultsToMetadata(results);
    }
    
    /**
     * Get document by identifier
     */
    async getDocumentByIdentifier(identifier: string): Promise<LegalMetadata | null> {
        const documents = this.store.getSubjects(
            namedNode('http://purl.org/dc/terms/identifier'),
            literal(identifier),
            null
        );
        
        if (documents.length === 0) {
            return null;
        }
        
        return this.extractDocumentMetadata(documents[0]);
    }
    
    /**
     * Search documents by status
     */
    async searchByStatus(status: string): Promise<LegalMetadata[]> {
        const results: LegalMetadata[] = [];
        
        const documents = this.store.getSubjects(
            namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            namedNode('http://www.legalruleml.org/ns/LegalRule'),
            null
        );
        
        for (const doc of documents) {
            const statuses = this.store.getObjects(doc, namedNode('https://legisquebec.gouv.qc.ca/ontology/status'), null);
            
            for (const statusObj of statuses) {
                if (statusObj.value.toLowerCase().includes(status.toLowerCase())) {
                    const metadata = await this.extractDocumentMetadata(doc);
                    if (metadata) {
                        results.push(metadata);
                    }
                    break;
                }
            }
        }
        
        return results;
    }
    
    /**
     * Get all keywords for all documents
     */
    async getAllKeywords(): Promise<Map<string, string[]>> {
        const keywordMap = new Map<string, string[]>();
        
        const documents = this.store.getSubjects(
            namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            namedNode('http://www.legalruleml.org/ns/LegalRule'),
            null
        );
        
        for (const doc of documents) {
            // Get identifier
            const identifiers = this.store.getObjects(doc, namedNode('http://purl.org/dc/terms/identifier'), null);
            if (identifiers.length === 0) continue;
            
            const identifier = identifiers[0].value;
            const keywords: string[] = [];
            
            // Get keywords
            const keywordObjects = this.store.getObjects(doc, namedNode('https://schema.org/keywords'), null);
            for (const keyword of keywordObjects) {
                keywords.push(keyword.value);
            }
            
            if (keywords.length > 0) {
                keywordMap.set(identifier, keywords);
            }
        }
        
        return keywordMap;
    }
    
    /**
     * Extract complete metadata for a document
     */
    private async extractDocumentMetadata(documentNode: any): Promise<LegalMetadata | null> {
        try {
            const metadata: Partial<LegalMetadata> = {
                uri: documentNode.value,
                keywords: []
            };
            
            // Get identifier
            const identifiers = this.store.getObjects(documentNode, namedNode('http://purl.org/dc/terms/identifier'), null);
            if (identifiers.length > 0) {
                metadata.legalIdentifier = identifiers[0].value;
            }
            
            // Get title
            const titles = this.store.getObjects(documentNode, namedNode('http://purl.org/dc/terms/title'), null);
            if (titles.length > 0) {
                metadata.title = titles[0].value;
                metadata.titleLang = (titles[0] as any).language || 'fr';
            }
            
            // Get document type
            const types = this.store.getObjects(documentNode, namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), null);
            for (const type of types) {
                if (type.value.includes('legis:')) {
                    metadata.documentType = type.value.split(':')[1] || type.value.split('/').pop() || 'Unknown';
                    break;
                }
            }
            
            // Get status
            const statuses = this.store.getObjects(documentNode, namedNode('https://legisquebec.gouv.qc.ca/ontology/status'), null);
            if (statuses.length > 0) {
                metadata.status = statuses[0].value;
                metadata.statusLang = (statuses[0] as any).language || 'fr';
            }
            
            // Get source URL
            const sources = this.store.getObjects(documentNode, namedNode('http://purl.org/dc/terms/source'), null);
            if (sources.length > 0) {
                metadata.sourceUrl = sources[0].value;
            }
            
            // Get PDF path
            const pdfPaths = this.store.getObjects(documentNode, namedNode('https://legisquebec.gouv.qc.ca/ontology/localPdfPath'), null);
            if (pdfPaths.length > 0) {
                metadata.pdfPath = pdfPaths[0].value;
            }
            
            // Get PDF source
            const pdfSources = this.store.getObjects(documentNode, namedNode('https://legisquebec.gouv.qc.ca/ontology/pdfSource'), null);
            if (pdfSources.length > 0) {
                metadata.pdfSource = pdfSources[0].value;
            }
            
            // Get description
            const descriptions = this.store.getObjects(documentNode, namedNode('https://schema.org/description'), null);
            if (descriptions.length > 0) {
                metadata.description = descriptions[0].value;
                metadata.descriptionLang = (descriptions[0] as any).language || 'fr';
            }
            
            // Get keywords
            const keywordObjects = this.store.getObjects(documentNode, namedNode('https://schema.org/keywords'), null);
            metadata.keywords = keywordObjects.map(k => k.value);
            
            // Get enrichment metadata
            const enrichedAts = this.store.getObjects(documentNode, namedNode('https://legisquebec.gouv.qc.ca/ontology/enrichedAt'), null);
            if (enrichedAts.length > 0) {
                metadata.enrichedAt = new Date(enrichedAts[0].value);
            }
            
            const enrichmentMethods = this.store.getObjects(documentNode, namedNode('https://legisquebec.gouv.qc.ca/ontology/enrichmentMethod'), null);
            if (enrichmentMethods.length > 0) {
                metadata.enrichmentMethod = enrichmentMethods[0].value;
            }
            
            // Get download status
            const downloadStatuses = this.store.getObjects(documentNode, namedNode('https://legisquebec.gouv.qc.ca/ontology/downloadStatus'), null);
            if (downloadStatuses.length > 0) {
                metadata.downloadStatus = downloadStatuses[0].value;
            }
            
            // Get optional fields
            const abrogatedBys = this.store.getObjects(documentNode, namedNode('https://legisquebec.gouv.qc.ca/ontology/abrogatedBy'), null);
            if (abrogatedBys.length > 0) {
                metadata.abrogatedBy = abrogatedBys[0].value;
            }
            
            const isReplacedBys = this.store.getObjects(documentNode, namedNode('https://schema.org/isReplacedBy'), null);
            if (isReplacedBys.length > 0) {
                metadata.isReplacedBy = isReplacedBys[0].value === 'true';
            }
            
            const isPartOfs = this.store.getObjects(documentNode, namedNode('https://legisquebec.gouv.qc.ca/ontology/isPartOf'), null);
            if (isPartOfs.length > 0) {
                metadata.isPartOf = isPartOfs[0].value;
            }
            
            return metadata as LegalMetadata;
            
        } catch (error) {
            console.error(`❌ Error extracting metadata for document:`, error);
            return null;
        }
    }
    
    /**
     * Map SPARQL results to LegalMetadata objects
     */
    private mapResultsToMetadata(results: any[]): LegalMetadata[] {
        return results.map(result => ({
            uri: result.document || '',
            legalIdentifier: result.identifier || '',
            title: result.title || '',
            titleLang: 'fr',
            documentType: result.type || 'Loi',
            status: result.status || '',
            statusLang: 'fr',
            sourceUrl: result.sourceUrl || '',
            pdfPath: result.pdfPath || '',
            pdfSource: result.pdfSource || '',
            description: result.description || '',
            descriptionLang: 'fr',
            keywords: [],
            enrichedAt: result.enrichedAt ? new Date(result.enrichedAt) : null,
            enrichmentMethod: result.enrichmentMethod || '',
            downloadStatus: result.downloadStatus || ''
        }));
    }
    
    /**
     * Get statistics about the loaded data
     */
    getStatistics(): { totalTriples: number; totalDocuments: number } {
        const totalTriples = this.store.size;
        
        const documents = this.store.getSubjects(
            namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            namedNode('http://www.legalruleml.org/ns/LegalRule'),
            null
        );
        
        return {
            totalTriples,
            totalDocuments: documents.length
        };
    }
}

/**
 * Singleton instance for the TTL parser
 */
let parserInstance: TTLMetadataParser | null = null;

/**
 * Get or create the TTL parser instance
 */
export async function getTTLParser(): Promise<TTLMetadataParser> {
    if (!parserInstance) {
        parserInstance = new TTLMetadataParser();
        await parserInstance.loadTTL();
    }
    return parserInstance;
}
