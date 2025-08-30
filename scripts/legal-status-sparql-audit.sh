#!/bin/bash

# Legal Status SPARQL-Based Audit Script
# Uses Python with rdflib for proper TTL parsing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Parse command line options
ENVIRONMENT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            echo "Usage: $0 [environment]"
            echo "Options:"
            echo "  -h, --help      Show this help message"
            echo ""
            echo "This script uses Python/rdflib to analyze TTL files for legal status issues"
            echo "Note: This script only performs analysis and does not modify any files"
            exit 0
            ;;
        *)
            ENVIRONMENT="$1"
            shift
            ;;
    esac
done

if [ -z "$ENVIRONMENT" ]; then
    echo "❌ Environment required (local, playground, or prod)"
    exit 1
fi

# Source environment
source "$SCRIPT_DIR/load-env.sh" "$ENVIRONMENT"

echo "🧠 Legal Status SPARQL-Based Audit"
echo "=================================="
echo "Environment: $ENVIRONMENT"
echo "Mode: ANALYSIS ONLY (no modifications will be made)"

# Check if ontology-driven mode is enabled
if [ -z "$TTL_METADATA_FILE" ] || [ -z "$EXTERNAL_DATA_SOURCE_PATH" ]; then
    echo "❌ Ontology-Driven Mode not configured!"
    echo "   Required: TTL_METADATA_FILE and EXTERNAL_DATA_SOURCE_PATH"
    exit 1
fi

echo "🧠 Ontology-Driven Mode: ✅ ENABLED"
echo "   TTL File: $TTL_METADATA_FILE"
echo "   Data Source: $EXTERNAL_DATA_SOURCE_PATH"

# Construct full TTL file path
TTL_FILE_PATH="$EXTERNAL_DATA_SOURCE_PATH/$TTL_METADATA_FILE"

if [ ! -f "$TTL_FILE_PATH" ]; then
    echo "❌ TTL file not found: $TTL_FILE_PATH"
    exit 1
fi

echo "📂 TTL File: $TTL_FILE_PATH"
echo ""

# Check Azure AI Search connection
echo "📋 Pre-flight Checks"
echo "===================="
echo -n "🔗 Testing Azure AI Search connection... "
if curl -s -H "api-key: $AZURE_SEARCH_API_KEY" \
        "$AZURE_SEARCH_ENDPOINT/indexes/$AZURE_SEARCH_INDEX?api-version=2023-11-01" \
        > /dev/null 2>&1; then
    echo "✅"
else
    echo "❌ Failed to connect to Azure AI Search"
    exit 1
fi

# Get current document count
TOTAL_DOCS=$(curl -s -H "api-key: $AZURE_SEARCH_API_KEY" \
    "$AZURE_SEARCH_ENDPOINT/indexes/$AZURE_SEARCH_INDEX/stats?api-version=2023-11-01" | \
    jq -r '.documentCount')

echo "📊 Total documents in Azure AI Search index: $TOTAL_DOCS"
echo ""

# Run SPARQL-based analysis using Python
echo "🔍 Running SPARQL-Based Analysis with Python/rdflib"
echo "===================================================="

# Export environment variables for Python
export TTL_FILE_PATH="$TTL_FILE_PATH"
export PROJECT_ROOT="$PROJECT_ROOT"
export TTL_METADATA_FILE="$TTL_METADATA_FILE"
export EXTERNAL_DATA_SOURCE_PATH="$EXTERNAL_DATA_SOURCE_PATH"

python3 << 'EOF'
import json
import sys
import os
import re
from datetime import datetime

try:
    from rdflib import Graph, Namespace
    from rdflib.namespace import RDF, DCTERMS
except ImportError:
    print('❌ rdflib not installed. Please install with: sudo apt install python3-rdflib')
    sys.exit(1)

def parse_ttl_with_rdflib(ttl_file_path):
    """Parse TTL file using rdflib and extract document information"""
    print(f'📂 Loading TTL file: {ttl_file_path}')
    
    # Create RDF graph and load TTL file
    g = Graph()
    try:
        g.parse(ttl_file_path, format='turtle')
        print(f'✅ Successfully loaded RDF graph with {len(g)} triples')
    except Exception as e:
        print(f'❌ Failed to parse TTL file: {e}')
        return []
    
    # Define namespaces based on TTL file structure
    LEGIS = Namespace('https://legisquebec.gouv.qc.ca/ontology/')
    LEGAL = Namespace('http://www.legalruleml.org/ns/')
    
    # Query for legal documents: documents that are legal:LegalRule OR legis:Loi (or both)
    # Optimized query with smart status inference
    query = '''
    PREFIX legis: <https://legisquebec.gouv.qc.ca/ontology/>
    PREFIX legal: <http://www.legalruleml.org/ns/>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    
    SELECT DISTINCT ?doc ?title ?status ?abrogatedBy ?enrichmentMethod ?description ?identifier
    WHERE {
        ?doc a ?type .
        FILTER(?type IN (legal:LegalRule, legis:Loi))
        
        OPTIONAL { ?doc dcterms:title ?title }
        OPTIONAL { ?doc dcterms:identifier ?identifier }
        OPTIONAL { ?doc legis:status ?status }
        OPTIONAL { ?doc legis:abrogatedBy ?abrogatedBy }
        OPTIONAL { ?doc legis:enrichmentMethod ?enrichmentMethod }
        OPTIONAL { ?doc dcterms:description ?description }
        
        # Smart status inference: if no explicit status but has abrogatedBy, infer 'abrogée'
        # This is handled in Python code for better logic flexibility
    }
    ORDER BY ?doc
    '''
    
    print('🔍 Executing comprehensive SPARQL query...')
    results = g.query(query)
    
    print(f'📊 SPARQL query returned {len(results)} results')
    
    documents = []
    for i, row in enumerate(results):
        doc_id = str(row.doc) if row.doc else f'unknown_{i}'
        title = str(row.title) if row.title else ''
        identifier = str(row.identifier) if row.identifier else ''
        status = str(row.status) if row.status else ''
        abrogated_by = str(row.abrogatedBy) if row.abrogatedBy else ''
        enrichment_method = str(row.enrichmentMethod) if row.enrichmentMethod else ''
        description = str(row.description) if row.description else ''
        
        # Enhanced status inference logic
        inferred_status = status
        if not status:
            if abrogated_by:
                # If abrogatedBy exists but no explicit status, infer based on reference type
                if re.match(r'https?://', abrogated_by):
                    # URL reference to another law - likely truly abrogated
                    inferred_status = 'abrogée'
                    print(f'  📊 Inferred status for {identifier or doc_id}: abrogée (law reference)')
                elif re.search(r'\d+,\s*c\.\s*\d+,\s*a\.\s*\d+', abrogated_by):
                    # Article reference - likely modification, not abrogation
                    inferred_status = 'en vigueur'
                    print(f'  📊 Inferred status for {identifier or doc_id}: en vigueur (article modification)')
                else:
                    # Uncertain - default to abrogated if explicitly mentioned
                    inferred_status = 'abrogée'
                    print(f'  📊 Inferred status for {identifier or doc_id}: abrogée (has abrogatedBy)')
            else:
                # No status and no abrogatedBy - default to 'en vigueur' (Quebec legal principle)
                inferred_status = 'en vigueur'
                print(f'  📊 Applied default status for {identifier or doc_id}: en vigueur')
        
        document = {
            'identifier': identifier or doc_id,
            'title': title,
            'status': inferred_status,
            'originalStatus': status,  # Keep original for analysis
            'abrogatedBy': abrogated_by,
            'enrichmentMethod': enrichment_method,
            'description': description
        }
        
        documents.append(document)
        print(f'  {i+1}. {identifier or doc_id}')
        if title:
            print(f'     📝 Title: {title[:50]}...')
        if inferred_status:
            print(f'     📊 Status: {inferred_status}')
        if enrichment_method:
            print(f'     🤖 Enrichment: {enrichment_method}')
        if abrogated_by:
            print(f'     ⚠️  AbrogatedBy: {abrogated_by[:50]}...')
    
    print(f'\n📊 Parsing complete: Found {len(documents)} documents')
    return documents

def validate_document(doc):
    """Validate document and suggest corrections"""
    result = {
        'documentId': doc['identifier'],
        'originalStatus': doc['status'],
        'confidence': 1.0,
        'rulesApplied': [],
        'requiresManualReview': False,
        'evidence': [],
        'correctedStatus': None
    }

    # Only process AI-enriched documents marked as abrogated
    if doc['enrichmentMethod'] != 'Azure OpenAI LLM Analysis' or doc['status'] != 'abrogée':
        return result

    if not doc['abrogatedBy']:
        result['requiresManualReview'] = True
        result['evidence'].append('No abrogatedBy reference found for abrogated status')
        return result

    text_to_analyze = f"{doc['abrogatedBy']} {doc['description']}"
    
    # Pattern matching for article references
    article_pattern = re.compile(r'\d+,\s*c\.\s*\d+|a\.\s*\d+|\d+,\s*\d+')
    modification_pattern = re.compile(r'(19|20)\d{2},\s*c\.\s*\d+,\s*a\.\s*\d+')
    known_modification_pattern = re.compile(r'modifié|remplacé par|tel que modifié', re.IGNORECASE)
    
    should_correct = False
    confidence = 0

    if article_pattern.search(text_to_analyze):
        result['rulesApplied'].append('article_reference_false_positive')
        result['evidence'].append('Article references that incorrectly suggest law abrogation')
        should_correct = True
        confidence = 0.9

    if modification_pattern.search(text_to_analyze):
        result['rulesApplied'].append('modification_year_false_positive')
        result['evidence'].append('Year references that indicate modifications, not abrogations')
        should_correct = True
        confidence = max(confidence, 0.8)

    if known_modification_pattern.search(text_to_analyze):
        result['rulesApplied'].append('known_modification_patterns')
        result['evidence'].append('Known patterns that indicate modifications rather than abrogations')
        should_correct = True
        confidence = max(confidence, 0.9)

    if should_correct and confidence >= 0.7:
        result['correctedStatus'] = 'en vigueur'
        result['confidence'] = confidence
    elif confidence >= 0.5:
        result['requiresManualReview'] = True
        result['confidence'] = confidence

    return result

def main():
    # Get environment variables
    ttl_file_path = os.environ.get('TTL_FILE_PATH')
    project_root = os.environ.get('PROJECT_ROOT')
    ttl_metadata_file = os.environ.get('TTL_METADATA_FILE')
    external_data_source_path = os.environ.get('EXTERNAL_DATA_SOURCE_PATH')
    
    if not ttl_file_path:
        print('❌ TTL_FILE_PATH environment variable not set')
        sys.exit(1)
    
    print('📝 Executing SPARQL queries on TTL file using Python/rdflib...')
    
    try:
        # Parse TTL file
        documents = parse_ttl_with_rdflib(ttl_file_path)
        
        if not documents:
            print('❌ No documents found in TTL file')
            sys.exit(1)
        
        print(f'📊 Total documents found: {len(documents)}')
        
        # Filter for relevant documents
        abrogated_docs = [doc for doc in documents if doc['status'] == 'abrogée']
        ai_enriched_docs = [doc for doc in documents if doc['enrichmentMethod'] == 'Azure OpenAI LLM Analysis']
        problematic_docs = [doc for doc in documents if 
                           doc['status'] == 'abrogée' and doc['enrichmentMethod'] == 'Azure OpenAI LLM Analysis']
        
        print(f'📈 Document Analysis:')
        print(f'   Total documents: {len(documents)}')
        print(f'   Documents marked as abrogated: {len(abrogated_docs)}')
        print(f'   AI-enriched documents: {len(ai_enriched_docs)}')
        print(f'   Potentially problematic (abrogated + AI): {len(problematic_docs)}')
        print('')
        
        # Validate problematic documents
        print('🔍 Validating potentially problematic documents...')
        validation_results = [validate_document(doc) for doc in problematic_docs]
        
        corrections = [r for r in validation_results if r['correctedStatus']]
        flagged = [r for r in validation_results if r['requiresManualReview']]
        no_issues = [r for r in validation_results if not r['correctedStatus'] and not r['requiresManualReview']]
        
        print('📊 Validation Results:')
        print(f'   Auto-corrections needed: {len(corrections)}')
        print(f'   Manual review required: {len(flagged)}')
        print(f'   No issues found: {len(no_issues)}')
        
        # Save detailed results
        analysis_data = {
            'timestamp': datetime.now().isoformat(),
            'ttlFile': ttl_file_path,
            'totalDocuments': len(documents),
            'abrogatedDocuments': len(abrogated_docs),
            'aiEnrichedDocuments': len(ai_enriched_docs),
            'problematicDocuments': len(problematic_docs),
            'validationResults': validation_results,
            'summary': {
                'autoCorrections': len(corrections),
                'manualReviewRequired': len(flagged),
                'noIssues': len(no_issues)
            },
            'configuration': {
                'ontologyDriven': True,
                'ttlFile': ttl_metadata_file,
                'dataSourcePath': external_data_source_path,
                'sparqlBased': True,
                'parser': 'Python/rdflib'
            }
        }
        
        with open(f'{project_root}/sparql_audit_results.json', 'w') as f:
            json.dump(analysis_data, f, indent=2)
        print('✅ Detailed results saved to: sparql_audit_results.json')
        
        # Generate markdown report
        report = '# SPARQL-Based Legal Status Audit Report\n\n'
        report += f'Generated: {datetime.now().isoformat()}\n'
        report += f'TTL File: {ttl_file_path}\n'
        report += f'Parser: Python/rdflib\n\n'
        
        report += '## Summary\n'
        report += f'- Total documents in TTL: {len(documents)}\n'
        report += f'- Documents marked as abrogated: {len(abrogated_docs)}\n'
        report += f'- AI-enriched documents: {len(ai_enriched_docs)}\n'
        report += f'- Potentially problematic: {len(problematic_docs)}\n'
        report += f'- Auto-corrections needed: {len(corrections)}\n'
        report += f'- Manual review required: {len(flagged)}\n\n'
        
        if corrections:
            report += '## Documents Requiring Auto-Correction\n\n'
            for r in corrections:
                report += f'### {r["documentId"]}\n'
                report += f'- **Current Status**: {r["originalStatus"]}\n'
                report += f'- **Suggested Status**: {r["correctedStatus"]}\n'
                report += f'- **Confidence**: {r["confidence"] * 100:.1f}%\n'
                report += f'- **Evidence**: {"; ".join(r["evidence"])}\n\n'
        
        if flagged:
            report += '## Documents Requiring Manual Review\n\n'
            for r in flagged:
                report += f'### {r["documentId"]}\n'
                report += f'- **Current Status**: {r["originalStatus"]}\n'
                report += f'- **Confidence**: {r["confidence"] * 100:.1f}%\n'
                report += f'- **Reasons**: {"; ".join(r["evidence"])}\n\n'
        
        with open(f'{project_root}/sparql_audit_report.md', 'w') as f:
            f.write(report)
        print('📄 Detailed report saved to: sparql_audit_report.md')
        
    except Exception as error:
        print(f'❌ SPARQL analysis failed: {error}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
EOF

# Check if analysis generated results
if [ ! -f "$PROJECT_ROOT/sparql_audit_results.json" ]; then
    echo "❌ SPARQL analysis failed"
    exit 1
fi

# Read results
AUTO_CORRECTIONS=$(jq -r '.summary.autoCorrections' "$PROJECT_ROOT/sparql_audit_results.json")
MANUAL_REVIEW=$(jq -r '.summary.manualReviewRequired' "$PROJECT_ROOT/sparql_audit_results.json")
NO_ISSUES=$(jq -r '.summary.noIssues' "$PROJECT_ROOT/sparql_audit_results.json")
TOTAL_TTL_DOCS=$(jq -r '.totalDocuments' "$PROJECT_ROOT/sparql_audit_results.json")

echo ""
echo "🎯 SPARQL Analysis Complete!"
echo "============================"
echo "📊 TTL File Analysis:"
echo "   Total documents in TTL: $TOTAL_TTL_DOCS"
echo "   Documents in Azure Search: $TOTAL_DOCS"
echo ""
echo "📈 Validation Summary:"
echo "🔧 Auto-corrections needed: $AUTO_CORRECTIONS"
echo "⚠️  Manual review required: $MANUAL_REVIEW"
echo "✅ No issues found: $NO_ISSUES"
echo ""

if [ "$AUTO_CORRECTIONS" -eq 0 ] && [ "$MANUAL_REVIEW" -eq 0 ]; then
    echo "🎉 Excellent! No corrections needed."
    echo "📄 Detailed analysis available in sparql_audit_report.md"
    exit 0
fi

echo "🔍 ANALYSIS COMPLETE - No changes applied"
echo ""
echo "📄 Next Steps:"
echo "1. Review sparql_audit_report.md for detailed analysis"
echo "2. If you need to apply corrections, use a separate correction script"
echo "3. Consider reviewing the identified issues manually"

echo ""
echo "📊 Files Generated:"
echo "   sparql_audit_results.json - Detailed analysis data"
echo "   sparql_audit_report.md - Human-readable report"
