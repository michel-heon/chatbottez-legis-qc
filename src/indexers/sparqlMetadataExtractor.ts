/**
 * SPARQL-Enhanced TTL Metadata Extractor
 * Utilise Apache Jena SPARQL pour extraire correctement les métadonnées
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface SPARQLMetadata {
    legalIdentifier: string;
    title?: string;
    status?: string;
    abrogatedBy?: string;
    downloadStatus?: string;
    format?: string;
    description?: string;
    keywords?: string[];
    enrichedAt?: string;
    enrichmentMethod?: string;
    sourceUrl?: string;
    type?: string[];
}

export class SPARQLMetadataExtractor {
    private ttlPath: string;
    private tempDir: string;
    private jenaPath: string;

    constructor(
        ttlPath: string,
        tempDir: string = '/tmp/sparql-queries',
        jenaPath: string = '/opt/jena'
    ) {
        this.ttlPath = ttlPath;
        this.tempDir = tempDir;
        this.jenaPath = jenaPath;
        
        // Ensure temp directory exists
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Extract all document metadata using SPARQL
     */
    async extractAllMetadata(): Promise<SPARQLMetadata[]> {
        console.log('🔍 SPARQL: Extracting all document metadata...');
        
        const sparqlQuery = this.buildMetadataQuery();
        const queryFile = path.join(this.tempDir, 'extract-all-metadata.sparql');
        const outputFile = path.join(this.tempDir, 'metadata-results.json');
        
        // Write SPARQL query to file
        fs.writeFileSync(queryFile, sparqlQuery);
        
        try {
            // Execute SPARQL query using Apache Jena
            const command = `cd "${this.jenaPath}/bin" && ./sparql --data="${this.ttlPath}" --query="${queryFile}" --results=JSON > "${outputFile}"`;
            
            console.log('🚀 Executing SPARQL query...');
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr) {
                console.warn('⚠️  SPARQL stderr:', stderr);
            }
            
            // Parse results
            const results = await this.parseSPARQLResults(outputFile);
            console.log(`✅ SPARQL extracted ${results.length} documents`);
            
            return results;
            
        } catch (error) {
            console.error('❌ SPARQL extraction failed:', error);
            throw error;
        }
    }

    /**
     * Extract metadata for specific documents
     */
    async extractSpecificMetadata(legalIdentifiers: string[]): Promise<SPARQLMetadata[]> {
        console.log(`🔍 SPARQL: Extracting metadata for ${legalIdentifiers.length} specific documents...`);
        
        const sparqlQuery = this.buildSpecificMetadataQuery(legalIdentifiers);
        const queryFile = path.join(this.tempDir, 'extract-specific-metadata.sparql');
        const outputFile = path.join(this.tempDir, 'specific-metadata-results.json');
        
        fs.writeFileSync(queryFile, sparqlQuery);
        
        try {
            const command = `cd "${this.jenaPath}/bin" && ./sparql --data="${this.ttlPath}" --query="${queryFile}" --results=JSON > "${outputFile}"`;
            
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr) {
                console.warn('⚠️  SPARQL stderr:', stderr);
            }
            
            const results = await this.parseSPARQLResults(outputFile);
            console.log(`✅ SPARQL extracted ${results.length} specific documents`);
            
            return results;
            
        } catch (error) {
            console.error('❌ Specific SPARQL extraction failed:', error);
            throw error;
        }
    }

    /**
     * Build comprehensive SPARQL query for all metadata
     */
    private buildMetadataQuery(): string {
        return `
PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
PREFIX legal: <https://schema.org/Legal/>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX schema: <https://schema.org/>

SELECT ?legalIdentifier ?title ?status ?abrogatedBy ?downloadStatus ?format 
       ?description ?keywords ?enrichedAt ?enrichmentMethod ?sourceUrl ?type
WHERE {
    ?doc a legal:LegalRule ;
         dcterms:identifier ?legalIdentifier .
    
    # Title (obligatoire)
    OPTIONAL { ?doc dcterms:title ?title }
    
    # Status - CRITIQUE: gestion des tags de langue
    OPTIONAL { ?doc legis:status ?status }
    
    # AbrogatedBy
    OPTIONAL { 
        ?doc legis:abrogatedBy ?abrogatedByURI .
        BIND(REPLACE(STR(?abrogatedByURI), ".*ontology/loi/", "") AS ?abrogatedBy)
    }
    
    # Other metadata
    OPTIONAL { ?doc legis:downloadStatus ?downloadStatus }
    OPTIONAL { ?doc dcterms:format ?format }
    OPTIONAL { ?doc schema:description ?description }
    OPTIONAL { ?doc schema:keywords ?keywords }
    OPTIONAL { ?doc legis:enrichedAt ?enrichedAt }
    OPTIONAL { ?doc legis:enrichmentMethod ?enrichmentMethod }
    OPTIONAL { ?doc dcterms:source ?sourceUrl }
    
    # Type information
    OPTIONAL { ?doc a ?type }
}
ORDER BY ?legalIdentifier
        `;
    }

    /**
     * Build SPARQL query for specific documents
     */
    private buildSpecificMetadataQuery(legalIdentifiers: string[]): string {
        const identifierFilter = legalIdentifiers.map(id => `"${id}"`).join(' ');
        
        return `
PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
PREFIX legal: <https://schema.org/Legal/>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX schema: <https://schema.org/>

SELECT ?legalIdentifier ?title ?status ?abrogatedBy ?downloadStatus ?format 
       ?description ?keywords ?enrichedAt ?enrichmentMethod ?sourceUrl ?type
WHERE {
    ?doc a legal:LegalRule ;
         dcterms:identifier ?legalIdentifier .
    
    # Filter for specific identifiers
    FILTER(?legalIdentifier IN (${identifierFilter}))
    
    # Title (obligatoire)
    OPTIONAL { ?doc dcterms:title ?title }
    
    # Status - CRITIQUE: gestion des tags de langue
    OPTIONAL { ?doc legis:status ?status }
    
    # AbrogatedBy
    OPTIONAL { 
        ?doc legis:abrogatedBy ?abrogatedByURI .
        BIND(REPLACE(STR(?abrogatedByURI), ".*ontology/loi/", "") AS ?abrogatedBy)
    }
    
    # Other metadata
    OPTIONAL { ?doc legis:downloadStatus ?downloadStatus }
    OPTIONAL { ?doc dcterms:format ?format }
    OPTIONAL { ?doc schema:description ?description }
    OPTIONAL { ?doc schema:keywords ?keywords }
    OPTIONAL { ?doc legis:enrichedAt ?enrichedAt }
    OPTIONAL { ?doc legis:enrichmentMethod ?enrichmentMethod }
    OPTIONAL { ?doc dcterms:source ?sourceUrl }
    
    # Type information
    OPTIONAL { ?doc a ?type }
}
ORDER BY ?legalIdentifier
        `;
    }

    /**
     * Parse SPARQL JSON results
     */
    private async parseSPARQLResults(outputFile: string): Promise<SPARQLMetadata[]> {
        if (!fs.existsSync(outputFile)) {
            throw new Error(`SPARQL output file not found: ${outputFile}`);
        }

        const resultsContent = fs.readFileSync(outputFile, 'utf-8');
        
        try {
            const sparqlResults = JSON.parse(resultsContent);
            const documents: Map<string, SPARQLMetadata> = new Map();

            // Process each binding result
            if (sparqlResults.results && sparqlResults.results.bindings) {
                for (const binding of sparqlResults.results.bindings) {
                    const legalIdentifier = binding.legalIdentifier?.value;
                    
                    if (!legalIdentifier) continue;
                    
                    // Get or create document entry
                    let doc = documents.get(legalIdentifier);
                    if (!doc) {
                        doc = { legalIdentifier };
                        documents.set(legalIdentifier, doc);
                    }
                    
                    // Extract metadata fields
                    if (binding.title?.value) {
                        doc.title = binding.title.value;
                    }
                    
                    // STATUS - CRITIQUE: Extraction correcte avec tags @fr
                    if (binding.status?.value) {
                        doc.status = binding.status.value;
                    }
                    
                    if (binding.abrogatedBy?.value) {
                        doc.abrogatedBy = binding.abrogatedBy.value;
                    }
                    
                    if (binding.downloadStatus?.value) {
                        doc.downloadStatus = binding.downloadStatus.value;
                    }
                    
                    if (binding.format?.value) {
                        doc.format = binding.format.value;
                    }
                    
                    if (binding.description?.value) {
                        doc.description = binding.description.value;
                    }
                    
                    if (binding.keywords?.value) {
                        if (!doc.keywords) doc.keywords = [];
                        if (!doc.keywords.includes(binding.keywords.value)) {
                            doc.keywords.push(binding.keywords.value);
                        }
                    }
                    
                    if (binding.enrichedAt?.value) {
                        doc.enrichedAt = binding.enrichedAt.value;
                    }
                    
                    if (binding.enrichmentMethod?.value) {
                        doc.enrichmentMethod = binding.enrichmentMethod.value;
                    }
                    
                    if (binding.sourceUrl?.value) {
                        doc.sourceUrl = binding.sourceUrl.value;
                    }
                    
                    if (binding.type?.value) {
                        if (!doc.type) doc.type = [];
                        const typeValue = binding.type.value.replace(/.*[#\/]/, '');
                        if (!doc.type.includes(typeValue)) {
                            doc.type.push(typeValue);
                        }
                    }
                }
            }

            return Array.from(documents.values());
            
        } catch (error) {
            console.error('❌ Failed to parse SPARQL results:', error);
            console.log('Raw results:', resultsContent.substring(0, 500));
            throw error;
        }
    }

    /**
     * Test SPARQL extraction on A-3 and A-3.001
     */
    async testCriticalDocuments(): Promise<{ a3: SPARQLMetadata | null, a3001: SPARQLMetadata | null }> {
        console.log('🧪 Testing SPARQL extraction on A-3 and A-3.001...');
        
        const results = await this.extractSpecificMetadata(['A-3', 'A-3.001']);
        
        const a3 = results.find(doc => doc.legalIdentifier === 'A-3') || null;
        const a3001 = results.find(doc => doc.legalIdentifier === 'A-3.001') || null;
        
        console.log('\n📊 SPARQL Test Results:');
        
        if (a3001) {
            console.log(`✅ A-3.001 found with status: "${a3001.status}"`);
            console.log(`   Title: ${a3001.title}`);
            console.log(`   Source: ${a3001.sourceUrl}`);
        } else {
            console.log(`❌ A-3.001 not found in SPARQL results`);
        }
        
        if (a3) {
            console.log(`✅ A-3 found with status: "${a3.status}"`);
            console.log(`   Title: ${a3.title}`);
            console.log(`   AbrogatedBy: ${a3.abrogatedBy}`);
        } else {
            console.log(`❌ A-3 not found in SPARQL results`);
        }
        
        return { a3, a3001 };
    }

    /**
     * Cleanup temporary files
     */
    cleanup(): void {
        try {
            if (fs.existsSync(this.tempDir)) {
                fs.rmSync(this.tempDir, { recursive: true, force: true });
                console.log('🧹 SPARQL temp files cleaned up');
            }
        } catch (error) {
            console.warn('⚠️  Failed to cleanup temp files:', error);
        }
    }
}
