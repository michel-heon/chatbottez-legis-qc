/**
 * TTL Schema Analyzer - Extract Azure Search index schema from TTL metadata
 * Analyzes RDF triples to determine optimal index structure
 */

import { Store, DataFactory, Parser } from 'n3';
import * as fs from 'fs';
import * as path from 'path';

const { namedNode, literal } = DataFactory;

interface IndexField {
    name: string;
    type: string;
    key?: boolean;
    searchable?: boolean;
    filterable?: boolean;
    sortable?: boolean;
    facetable?: boolean;
    retrievable?: boolean;
    analyzer?: string;
    vectorSearchDimensions?: number;        // Azure SDK property name
    vectorSearchProfileName?: string;       // Azure SDK property name 
    description: string;
}

interface IndexSchema {
    name: string;
    description: string;
    version: string;
    generatedFrom: string;
    generatedAt: string;
    fields: IndexField[];
    suggesters: any[];
    vectorSearch?: any;
    mapping: {
        ttlToIndex: Record<string, string>;
        pdfProcessing: {
            contentField: string;
            vectorField: string;
            chunkSize: number;
            chunkOverlap: number;
        };
    };
}

/**
 * Analyze TTL file and extract schema for Azure Search index
 */
export class TTLSchemaAnalyzer {
    private store: Store;
    private ttlFilePath: string;
    
    constructor(ttlFilePath: string) {
        this.store = new Store();
        this.ttlFilePath = ttlFilePath;
    }
    
    /**
     * Load and parse TTL file
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
     * Analyze TTL content and extract schema
     */
    analyzeSchema(): IndexSchema {
        console.log('🔍 Analyzing TTL structure for index schema...');
        
        // Get all unique predicates used in the TTL
        const predicates = new Set<string>();
        const subjects = new Set<string>();
        const documentTypes = new Set<string>();
        
        for (const quad of this.store) {
            predicates.add(quad.predicate.value);
            subjects.add(quad.subject.value);
            
            // Collect document types
            if (quad.predicate.value.includes('type') || quad.predicate.value.includes('Type')) {
                documentTypes.add(quad.object.value);
            }
        }
        
        console.log(`📊 Found ${predicates.size} unique predicates, ${subjects.size} subjects`);
        console.log(`📋 Document types: ${Array.from(documentTypes).slice(0, 5).join(', ')}...`);
        
        // Generate fields based on TTL analysis
        const fields = this.generateFieldsFromTTL(predicates);
        
        // Generate index name based on content
        const indexName = this.generateIndexName();
        
        const schema: IndexSchema = {
            name: indexName,
            description: "Azure Search index dynamically generated from TTL metadata",
            version: "2.0.0",
            generatedFrom: path.basename(this.ttlFilePath),
            generatedAt: new Date().toISOString(),
            fields,
            suggesters: [
                {
                    name: "legal-suggester",
                    searchMode: "analyzingInfixMatching",
                    sourceFields: ["title", "legalIdentifier", "keywords"]
                }
            ],
            vectorSearch: this.generateVectorSearchConfig(),
            mapping: {
                ttlToIndex: this.generateTTLMapping(predicates),
                pdfProcessing: {
                    contentField: "content",
                    vectorField: "contentVector",
                    chunkSize: 1000,
                    chunkOverlap: 200
                }
            }
        };
        
        return schema;
    }
    
    /**
     * Generate Azure Search fields based on TTL predicates
     */
    private generateFieldsFromTTL(predicates: Set<string>): IndexField[] {
        const fields: IndexField[] = [
            // Core required fields
            {
                name: "id",
                type: "Edm.String",
                key: true,
                searchable: false,
                filterable: true,
                sortable: false,
                facetable: false,
                retrievable: true,
                description: "Document unique identifier (legalIdentifier encoded)"
            }
        ];
        
        // Map TTL predicates to index fields based on actual TTL content
        const predicateMapping: Record<string, Partial<IndexField>> = {
            // Dublin Core Terms
            'http://purl.org/dc/terms/identifier': {
                name: 'legalIdentifier',
                type: 'Edm.String',
                searchable: true,
                filterable: true,
                sortable: true,
                analyzer: 'keyword'
            },
            'http://purl.org/dc/terms/title': {
                name: 'title',
                type: 'Edm.String',
                searchable: true,
                filterable: false,
                sortable: true,
                analyzer: 'fr.lucene'
            },
            'http://purl.org/dc/terms/format': {
                name: 'format',
                type: 'Edm.String',
                searchable: false,
                filterable: true,
                facetable: true
            },
            'http://purl.org/dc/terms/source': {
                name: 'sourceUrl',
                type: 'Edm.String',
                searchable: false,
                retrievable: true
            },
            // Legal RuleML
            'http://www.legalruleml.org/ns/LegalRule': {
                name: 'documentType',
                type: 'Edm.String',
                searchable: true,
                filterable: true,
                facetable: true
            },
            // Legis Quebec Ontology  
            'https://legisquebec.gouv.qc.ca/ontology/Loi': {
                name: 'legalType',
                type: 'Edm.String',
                searchable: true,
                filterable: true,
                facetable: true
            },
            'https://legisquebec.gouv.qc.ca/ontology/status': {
                name: 'legalStatus',
                type: 'Edm.String',
                searchable: true,
                filterable: true,
                facetable: true,
                analyzer: 'fr.lucene'
            },
            'https://legisquebec.gouv.qc.ca/ontology/abrogatedBy': {
                name: 'abrogatedBy',
                type: 'Edm.String',
                searchable: true,
                filterable: false
            },
            'https://legisquebec.gouv.qc.ca/ontology/downloadStatus': {
                name: 'downloadStatus',
                type: 'Edm.String',
                searchable: false,
                filterable: true,
                facetable: true
            },
            'https://legisquebec.gouv.qc.ca/ontology/enrichedAt': {
                name: 'enrichedAt',
                type: 'Edm.DateTimeOffset',
                filterable: true,
                sortable: true
            },
            'https://legisquebec.gouv.qc.ca/ontology/enrichmentMethod': {
                name: 'enrichmentMethod',
                type: 'Edm.String',
                searchable: false,
                filterable: true,
                facetable: true
            },
            // Schema.org
            'https://schema.org/description': {
                name: 'description',
                type: 'Edm.String',
                searchable: true,
                analyzer: 'fr.lucene'
            },
            'https://schema.org/keywords': {
                name: 'keywords',
                type: 'Collection(Edm.String)',
                searchable: true,
                filterable: true,
                facetable: true,
                analyzer: 'fr.lucene'
            },
            'https://schema.org/isReplacedBy': {
                name: 'isReplacedBy',
                type: 'Edm.Boolean',
                filterable: true,
                facetable: true
            }
        };
        
        // Add fields based on found predicates
        for (const predicate of predicates) {
            const mapping = predicateMapping[predicate];
            if (mapping) {
                fields.push({
                    searchable: false,
                    filterable: false,
                    sortable: false,
                    facetable: false,
                    retrievable: true,
                    description: `Field mapped from TTL predicate: ${predicate}`,
                    ...mapping
                } as IndexField);
            }
        }
        
        // Add documentType field if not already present (required by application code)
        const hasDocumentType = fields.some(field => field.name === 'documentType');
        if (!hasDocumentType) {
            fields.push({
                name: 'documentType',
                type: 'Edm.String',
                searchable: true,
                filterable: true,
                sortable: false,
                facetable: true,
                retrievable: true,
                description: 'Document type classification (from manifest data)'
            });
        }

        // Add legalType field if not already present (required by population code)
        const hasLegalType = fields.some(field => field.name === 'legalType');
        if (!hasLegalType) {
            fields.push({
                name: 'legalType',
                type: 'Edm.String',
                searchable: true,
                filterable: true,
                sortable: false,
                facetable: true,
                retrievable: true,
                description: 'Legal document type (Loi, Règlement, etc.)'
            });
        }

        // Add standard content fields with vector search capability
        fields.push(
            {
                name: 'content',
                type: 'Edm.String',
                searchable: true,
                filterable: false,
                sortable: false,
                facetable: false,
                retrievable: true,
                analyzer: 'fr.lucene',
                description: 'Extracted PDF content'
            },
            {
                name: 'contentVector',
                type: 'Collection(Edm.Single)',
                searchable: true,
                vectorSearchDimensions: 1536,
                vectorSearchProfileName: 'default',
                description: 'Content embedding vector for semantic search'
            }
        );
        
        return fields;
    }
    
    /**
     * Generate index name based on TTL content
     */
    private generateIndexName(): string {
        // Use environment variable if available, otherwise generate from TTL
        const envIndexName = process.env.AZURE_SEARCH_INDEX_NAME;
        if (envIndexName) {
            console.log(`🏗️  Using configured index name: ${envIndexName}`);
            return envIndexName;
        }
        
        // Fallback: Try to find organization or jurisdiction in TTL
        const orgQuads = this.store.getQuads(null, namedNode('http://purl.org/dc/terms/publisher'), null);
        const jurisdictionQuads = this.store.getQuads(null, namedNode('http://www.w3.org/ns/legal#jurisdiction'), null);
        
        let baseName = 'legis-qc-ttl';
        
        if (jurisdictionQuads.length > 0) {
            const jurisdiction = jurisdictionQuads[0].object.value;
            if (jurisdiction.includes('quebec') || jurisdiction.includes('qc')) {
                baseName = 'legis-qc';
            }
        }
        
        // Add timestamp for uniqueness
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const generatedName = `${baseName}-${timestamp}`;
        console.log(`🏗️  Generated index name: ${generatedName}`);
        return generatedName;
    }
    
    /**
     * Generate TTL to index field mapping
     */
    private generateTTLMapping(predicates: Set<string>): Record<string, string> {
        const mapping: Record<string, string> = {
            // Dublin Core Terms
            'http://purl.org/dc/terms/identifier': 'legalIdentifier',
            'http://purl.org/dc/terms/title': 'title',
            'http://purl.org/dc/terms/format': 'format',
            'http://purl.org/dc/terms/source': 'sourceUrl',
            // Legal RuleML
            'http://www.legalruleml.org/ns/LegalRule': 'documentType',
            // Legis Quebec Ontology
            'https://legisquebec.gouv.qc.ca/ontology/Loi': 'legalType',
            'https://legisquebec.gouv.qc.ca/ontology/status': 'legalStatus',
            'https://legisquebec.gouv.qc.ca/ontology/abrogatedBy': 'abrogatedBy',
            'https://legisquebec.gouv.qc.ca/ontology/downloadStatus': 'downloadStatus',
            'https://legisquebec.gouv.qc.ca/ontology/enrichedAt': 'enrichedAt',
            'https://legisquebec.gouv.qc.ca/ontology/enrichmentMethod': 'enrichmentMethod',
            // Schema.org
            'https://schema.org/description': 'description',
            'https://schema.org/keywords': 'keywords',
            'https://schema.org/isReplacedBy': 'isReplacedBy'
        };
        
        return mapping;
    }
    
    /**
     * Generate vector search configuration for semantic search
     */
    private generateVectorSearchConfig(): any {
        return {
            algorithms: [
                {
                    name: "hnsw-algorithm",
                    kind: "hnsw",
                    hnswParameters: {
                        metric: "cosine",
                        m: 4,
                        efConstruction: 400,
                        efSearch: 500
                    }
                }
            ],
            profiles: [
                {
                    name: "default",
                    algorithmConfigurationName: "hnsw-algorithm"
                }
            ]
        };
    }
}

/**
 * Main execution function
 */
async function main() {
    const ttlPath = process.argv[2];
    const outputPath = process.argv[3];
    
    if (!ttlPath || !outputPath) {
        console.error('Usage: node ttlSchemaAnalyzer.js <ttl-path> <output-path>');
        process.exit(1);
    }
    
    try {
        const analyzer = new TTLSchemaAnalyzer(ttlPath);
        await analyzer.loadTTL();
        const schema = analyzer.analyzeSchema();
        
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Write schema to file
        fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
        
        console.log('✅ Schema analysis completed successfully');
        console.log(`📄 Schema saved to: ${outputPath}`);
        console.log(`🏗️  Index name: ${schema.name}`);
        console.log(`📊 Fields count: ${schema.fields.length}`);
        
    } catch (error) {
        console.error('❌ Schema analysis failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}
