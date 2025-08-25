#!/bin/bash

# TTL Parser Test and Utilities Script
# Test et utilitaires pour le parser TTL et SPARQL

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Ensure we're in the right directory
cd "$PROJECT_ROOT"

# Function to test TTL parser
test_ttl_parser() {
    log_info "Testing TTL Parser and SPARQL functionality..."
    
    # Build the project first
    log_info "Building TypeScript project..."
    npm run build
    
    # Run the TTL parser test
    log_info "Running TTL parser test..."
    EXTERNAL_DATA_SOURCE_PATH=/media/psf/Developpement/00-GIT/cotechnoe-kb-legis-qc/etl \
    node lib/src/indexers/testTTLParser.js
    
    log_success "TTL Parser test completed successfully!"
}

# Function to analyze TTL metadata
analyze_ttl_metadata() {
    log_info "Analyzing TTL metadata structure..."
    
    local ttl_file="/media/psf/Developpement/00-GIT/cotechnoe-kb-legis-qc/etl/extract/rdf/legisquebec-metadata.ttl"
    
    if [ ! -f "$ttl_file" ]; then
        log_error "TTL file not found: $ttl_file"
        return 1
    fi
    
    log_info "TTL File Analysis:"
    echo "  📁 File: $ttl_file"
    echo "  📊 Size: $(du -h "$ttl_file" | cut -f1)"
    echo "  📝 Lines: $(wc -l < "$ttl_file")"
    
    log_info "Content Analysis:"
    echo "  🏛️  Legal Rules: $(grep -c "a legal:LegalRule" "$ttl_file")"
    echo "  📋 Identifiers: $(grep -c "dcterms:identifier" "$ttl_file")"
    echo "  📝 Titles: $(grep -c "dcterms:title" "$ttl_file")"
    echo "  🔖 Keywords: $(grep -c "schema:keywords" "$ttl_file")"
    echo "  📄 Descriptions: $(grep -c "schema:description" "$ttl_file")"
    
    log_info "Status Distribution:"
    echo "  ✅ En vigueur: $(grep -c 'legis:status "en vigueur"' "$ttl_file")"
    echo "  ❌ Abrogée: $(grep -c 'legis:status "abrogée"' "$ttl_file")"
    
    log_success "Metadata analysis completed!"
}

# Function to show TTL parser capabilities
show_capabilities() {
    log_info "TTL Parser Capabilities:"
    echo ""
    echo "🔍 SPARQL Query Support:"
    echo "  - Get all legal documents with metadata"
    echo "  - Search by legal identifier (A-1, B-2, etc.)"
    echo "  - Filter by legal status (en vigueur, abrogée)"
    echo "  - Extract keywords and descriptions"
    echo "  - Get enrichment metadata and timestamps"
    echo ""
    echo "📊 Metadata Extraction:"
    echo "  - Legal identifiers and titles"
    echo "  - Document types (Loi, Règlement)"
    echo "  - Legal status and language"
    echo "  - Source URLs and PDF paths"
    echo "  - AI-generated descriptions and keywords"
    echo "  - Enrichment provenance and timestamps"
    echo ""
    echo "🔄 Document Mapping:"
    echo "  - Convert TTL metadata to enhanced index documents"
    echo "  - Generate searchable text combinations"
    echo "  - Create content hashes for deduplication"
    echo "  - Validate document structure before indexing"
    echo ""
    echo "📈 Performance:"
    echo "  - Loads 27,860+ RDF triples"
    echo "  - Processes 994 legal documents"
    echo "  - Extracts 12,800+ keywords"
    echo "  - Memory-efficient N3 store implementation"
}

# Function to generate sample enhanced documents
generate_samples() {
    log_info "Generating sample enhanced documents..."
    
    # Build first
    npm run build
    
    # Create a small sample generator
    cat > temp_sample_generator.js << 'EOF'
const { getTTLParser } = require('./lib/src/indexers/ttlParser');
const { DocumentMapper } = require('./lib/src/indexers/documentMapper');

async function generateSamples() {
    try {
        process.env.EXTERNAL_DATA_SOURCE_PATH = '/media/psf/Developpement/00-GIT/cotechnoe-kb-legis-qc/etl';
        
        const parser = await getTTLParser();
        const docs = await parser.getAllDocuments();
        
        console.log('📄 Sample Enhanced Documents:');
        console.log('=' .repeat(50));
        
        const samples = docs.slice(0, 5);
        for (const doc of samples) {
            const enhanced = DocumentMapper.mapTTLToEnrichedDocument(doc);
            
            console.log(`\n🏛️  Document: ${enhanced.legalIdentifier}`);
            console.log(`   Title: ${enhanced.docTitle}`);
            console.log(`   Type: ${enhanced.documentType}`);
            console.log(`   Status: ${enhanced.legalStatus}`);
            console.log(`   Keywords: ${enhanced.keywords.slice(0, 5).join(', ')}${enhanced.keywords.length > 5 ? '...' : ''}`);
            console.log(`   Source: ${enhanced.sourceUrl}`);
            console.log(`   Enriched: ${enhanced.enrichedAt ? enhanced.enrichedAt.toISOString().split('T')[0] : 'N/A'}`);
            console.log(`   Hash: ${enhanced.contentHash}`);
        }
        
        console.log('\n✅ Sample generation completed!');
        
    } catch (error) {
        console.error('❌ Error generating samples:', error);
        process.exit(1);
    }
}

generateSamples();
EOF
    
    node temp_sample_generator.js
    rm temp_sample_generator.js
    
    log_success "Sample enhanced documents generated!"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  test                Test TTL parser and SPARQL functionality"
    echo "  analyze             Analyze TTL metadata structure"
    echo "  capabilities        Show parser capabilities"
    echo "  samples             Generate sample enhanced documents"
    echo "  help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 test             # Run comprehensive TTL parser tests"
    echo "  $0 analyze          # Analyze TTL file structure and content"
    echo "  $0 samples          # Generate enhanced document samples"
}

# Main script logic
case "${1:-help}" in
    "test")
        test_ttl_parser
        ;;
    "analyze")
        analyze_ttl_metadata
        ;;
    "capabilities")
        show_capabilities
        ;;
    "samples")
        generate_samples
        ;;
    "help"|*)
        show_usage
        ;;
esac
