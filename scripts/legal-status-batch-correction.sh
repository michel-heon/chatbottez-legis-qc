#!/bin/bash

# Legal Status Batch Correction Script
# Processes large document corpus with safety checks and progress monitoring

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BATCH_SIZE=100
DRY_RUN=false
FORCE=false
BACKUP_ENABLED=true

# Parse command line options
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --no-backup)
            BACKUP_ENABLED=false
            shift
            ;;
        --batch-size)
            BATCH_SIZE="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [environment] [options]"
            echo "Options:"
            echo "  --dry-run       Show what would be done without making changes"
            echo "  --force         Skip confirmation prompts"
            echo "  --no-backup     Skip backup creation"
            echo "  --batch-size N  Process N documents at a time (default: 100)"
            echo "  -h, --help      Show this help message"
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

echo "🔍 Legal Status Batch Correction Tool"
echo "Environment: $ENVIRONMENT"
echo "Batch Size: $BATCH_SIZE"
echo "Dry Run: $DRY_RUN"
echo "Backup Enabled: $BACKUP_ENABLED"

# Check if ontology-driven mode is enabled
if [ -n "$TTL_METADATA_FILE" ]; then
    echo "🧠 Ontology-Driven Mode: ✅ ENABLED"
    echo "   TTL File: $TTL_METADATA_FILE"
    echo "   Data Source: $EXTERNAL_DATA_SOURCE_PATH"
else
    echo "🧠 Ontology-Driven Mode: ❌ DISABLED (using traditional indexing)"
fi
echo ""

# Pre-flight checks
echo "📋 Pre-flight Checks"
echo "===================="

# Check Azure AI Search connection
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

echo "📊 Total documents in index: $TOTAL_DOCS"

# Create backup if enabled
if [ "$BACKUP_ENABLED" = true ] && [ "$DRY_RUN" = false ]; then
    BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    echo "💾 Creating backup in $BACKUP_DIR..."
    
    # Export current index
    node -e "
        const fs = require('fs');
        const https = require('https');
        const url = require('url');
        
        const searchUrl = '$AZURE_SEARCH_ENDPOINT/indexes/$AZURE_SEARCH_INDEX/docs/search?api-version=2023-11-01';
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': '$AZURE_SEARCH_API_KEY'
            }
        };
        
        const postData = JSON.stringify({
            search: '*',
            select: 'id,metadata,content',
            top: $TOTAL_DOCS
        });
        
        const urlParts = url.parse(searchUrl);
        const req = https.request({...options, ...urlParts}, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                fs.writeFileSync('$BACKUP_DIR/index_backup.json', data);
                console.log('✅ Backup created successfully');
            });
        });
        
        req.write(postData);
        req.end();
    "
fi

# Run validation analysis
echo ""
echo "🔍 Running Validation Analysis"
echo "=============================="

TEMP_MANIFEST="$PROJECT_ROOT/temp_manifest_validation.json"

# Generate manifest with validation
node -e "
    const path = require('path');
    const fs = require('fs');
    
    // Define validation logic inline (simplified version)
    class LegalStatusValidator {
        validateStatus(documentId, status, abrogatedBy, enrichmentMethod, description) {
            const result = {
                documentId,
                originalStatus: status,
                confidence: 1.0,
                rulesApplied: [],
                requiresManualReview: false,
                evidence: []
            };

            // Only process AI-enriched documents marked as abrogated
            if (enrichmentMethod !== 'Azure OpenAI LLM Analysis' || status !== 'abrogée') {
                return result;
            }

            if (!abrogatedBy) {
                result.requiresManualReview = true;
                result.evidence.push('No abrogatedBy reference found for abrogated status');
                return result;
            }

            const textToAnalyze = \`\${abrogatedBy} \${description || ''}\`;
            
            // Pattern matching for article references
            const articlePattern = /\\d+,\\s*c\\.\\s*\\d+|a\\.\\s*\\d+|\\d+,\\s*\\d+/;
            const modificationPattern = /(19|20)\\d{2},\\s*c\\.\\s*\\d+,\\s*a\\.\\s*\\d+/;
            const knownModificationPattern = /modifié|remplacé par|tel que modifié/i;
            
            let shouldCorrect = false;
            let confidence = 0;

            if (articlePattern.test(textToAnalyze)) {
                result.rulesApplied.push('article_reference_false_positive');
                result.evidence.push('Article references that incorrectly suggest law abrogation');
                shouldCorrect = true;
                confidence = 0.9;
            }

            if (modificationPattern.test(textToAnalyze)) {
                result.rulesApplied.push('modification_year_false_positive');
                result.evidence.push('Year references that indicate modifications, not abrogations');
                shouldCorrect = true;
                confidence = Math.max(confidence, 0.8);
            }

            if (knownModificationPattern.test(textToAnalyze)) {
                result.rulesApplied.push('known_modification_patterns');
                result.evidence.push('Known patterns that indicate modifications rather than abrogations');
                shouldCorrect = true;
                confidence = Math.max(confidence, 0.9);
            }

            if (shouldCorrect && confidence >= 0.7) {
                result.correctedStatus = 'en vigueur';
                result.confidence = confidence;
            } else if (confidence >= 0.5) {
                result.requiresManualReview = true;
                result.confidence = confidence;
            }

            return result;
        }

        batchValidate(documents) {
            const results = [];
            let correctedCount = 0;
            let flaggedCount = 0;

            for (const doc of documents) {
                const result = this.validateStatus(
                    doc.legalIdentifier || doc.metadata?.identifier || doc.identifier,
                    doc.metadata?.status || doc.status,
                    doc.metadata?.abrogatedBy || doc.abrogatedBy,
                    doc.metadata?.enrichmentMethod || doc.enrichmentMethod,
                    doc.metadata?.description || doc.description
                );

                results.push(result);

                if (result.correctedStatus) {
                    correctedCount++;
                } else if (result.requiresManualReview) {
                    flaggedCount++;
                }
            }

            console.log(\`📊 Validation Summary:\`);
            console.log(\`  Total documents: \${documents.length}\`);
            console.log(\`  Auto-corrected: \${correctedCount}\`);
            console.log(\`  Flagged for review: \${flaggedCount}\`);
            console.log(\`  No issues: \${documents.length - correctedCount - flaggedCount}\`);

            return results;
        }

        generateReport(results) {
            const corrections = results.filter(r => r.correctedStatus);
            const flagged = results.filter(r => r.requiresManualReview);

            let report = \`# Legal Status Validation Report\\n\\n\`;
            report += \`Generated: \${new Date().toISOString()}\\n\\n\`;

            report += \`## Summary\\n\`;
            report += \`- Total documents analyzed: \${results.length}\\n\`;
            report += \`- Auto-corrections applied: \${corrections.length}\\n\`;
            report += \`- Documents flagged for manual review: \${flagged.length}\\n\\n\`;

            if (corrections.length > 0) {
                report += \`## Auto-Corrections Applied\\n\\n\`;
                corrections.forEach(r => {
                    report += \`### \${r.documentId}\\n\`;
                    report += \`- **Original Status**: \${r.originalStatus}\\n\`;
                    report += \`- **Corrected Status**: \${r.correctedStatus}\\n\`;
                    report += \`- **Confidence**: \${(r.confidence * 100).toFixed(1)}%\\n\`;
                    report += \`- **Rules Applied**: \${r.rulesApplied.join(', ')}\\n\`;
                    report += \`- **Evidence**: \${r.evidence.join('; ')}\\n\\n\`;
                });
            }

            if (flagged.length > 0) {
                report += \`## Documents Requiring Manual Review\\n\\n\`;
                flagged.forEach(r => {
                    report += \`### \${r.documentId}\\n\`;
                    report += \`- **Current Status**: \${r.originalStatus}\\n\`;
                    report += \`- **Confidence**: \${(r.confidence * 100).toFixed(1)}%\\n\`;
                    report += \`- **Reasons**: \${r.evidence.join('; ')}\\n\\n\`;
                });
            }

            return report;
        }
    }
    
    // Import TTL files discovery (try both JS and TS approaches)
    let generateManifestFromDirectory;
    try {
        // Try compiled JS first
        const discovery = require('$PROJECT_ROOT/lib/indexers/ttlFilesDiscovery.js');
        generateManifestFromDirectory = discovery.generateManifestFromDirectory;
    } catch (error) {
        try {
            // Try TypeScript source
            const discovery = require('$PROJECT_ROOT/src/indexers/ttlFilesDiscovery.ts');
            generateManifestFromDirectory = discovery.generateManifestFromDirectory;
        } catch (tsError) {
            console.error('❌ Could not load TTL files discovery module');
            console.error('JS Error:', error.message);
            console.error('TS Error:', tsError.message);
            process.exit(1);
        }
    }
    
    async function runValidation() {
        try {
            console.log('📝 Generating manifest with validation...');
            
            // Check if we have TTL metadata file (ontology-driven mode)
            const ttlMetadataFile = process.env.TTL_METADATA_FILE;
            const externalDataPath = process.env.EXTERNAL_DATA_SOURCE_PATH;
            
            let ttlDirectory;
            if (ttlMetadataFile && externalDataPath) {
                console.log('🧠 Using Ontology-Driven Mode');
                console.log(\`   TTL File: \${ttlMetadataFile}\`);
                ttlDirectory = path.join(externalDataPath, path.dirname(ttlMetadataFile));
            } else {
                console.log('📁 Using Traditional Directory Mode');
                ttlDirectory = '$PROJECT_ROOT/data/source/ttl';
            }
            
            console.log(\`📂 TTL Directory: \${ttlDirectory}\`);
            
            const manifest = await generateManifestFromDirectory(ttlDirectory);
            
            console.log(\`📊 Loaded \${manifest.files.length} files from manifest\`);
            
            // Extract all documents
            const allDocuments = [];
            manifest.files.forEach(file => {
                if (file.metadata && file.metadata.length > 0) {
                    file.metadata.forEach(doc => {
                        allDocuments.push({
                            ...doc,
                            sourceFile: file.filename
                        });
                    });
                }
            });
            
            console.log(\`🔍 Analyzing \${allDocuments.length} documents for status validation\`);
            
            const validator = new LegalStatusValidator();
            const results = validator.batchValidate(allDocuments);
            
            // Save results
            const analysisData = {
                timestamp: new Date().toISOString(),
                totalDocuments: allDocuments.length,
                validationResults: results,
                summary: {
                    autoCorrections: results.filter(r => r.correctedStatus).length,
                    manualReviewRequired: results.filter(r => r.requiresManualReview).length,
                    noIssues: results.filter(r => !r.correctedStatus && !r.requiresManualReview).length
                },
                configuration: {
                    ontologyDriven: !!ttlMetadataFile,
                    ttlMetadataFile: ttlMetadataFile || 'none',
                    dataSourcePath: externalDataPath || 'local',
                    ttlDirectory: ttlDirectory
                }
            };
            
            fs.writeFileSync('$TEMP_MANIFEST', JSON.stringify(analysisData, null, 2));
            
            console.log('✅ Validation analysis complete');
            console.log(\`📝 Results saved to: $TEMP_MANIFEST\`);
            
            // Generate report
            const report = validator.generateReport(results);
            fs.writeFileSync('$PROJECT_ROOT/validation_report.md', report);
            console.log('📄 Detailed report saved to: validation_report.md');
            
        } catch (error) {
            console.error('❌ Validation failed:', error);
            process.exit(1);
        }
    }
    
    runValidation();
"

# Read validation results
if [ ! -f "$TEMP_MANIFEST" ]; then
    echo "❌ Validation analysis failed"
    exit 1
fi

AUTO_CORRECTIONS=$(jq -r '.summary.autoCorrections' "$TEMP_MANIFEST")
MANUAL_REVIEW=$(jq -r '.summary.manualReviewRequired' "$TEMP_MANIFEST")
NO_ISSUES=$(jq -r '.summary.noIssues' "$TEMP_MANIFEST")

echo ""
echo "📊 Validation Results Summary"
echo "============================"
echo "🔧 Auto-corrections needed: $AUTO_CORRECTIONS"
echo "⚠️  Manual review required: $MANUAL_REVIEW"
echo "✅ No issues found: $NO_ISSUES"
echo ""

if [ "$AUTO_CORRECTIONS" -eq 0 ] && [ "$MANUAL_REVIEW" -eq 0 ]; then
    echo "🎉 No corrections needed! All documents have correct legal status."
    rm -f "$TEMP_MANIFEST"
    exit 0
fi

# Show confirmation
if [ "$DRY_RUN" = true ]; then
    echo "🔍 DRY RUN MODE - No changes will be made"
    echo "📄 Check validation_report.md for detailed analysis"
    rm -f "$TEMP_MANIFEST"
    exit 0
fi

if [ "$FORCE" = false ]; then
    echo "⚠️  This will modify $AUTO_CORRECTIONS documents in your Azure AI Search index."
    echo "📄 Review validation_report.md before proceeding."
    echo ""
    read -p "Continue with corrections? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Operation cancelled"
        rm -f "$TEMP_MANIFEST"
        exit 1
    fi
fi

# Apply corrections in batches
if [ "$AUTO_CORRECTIONS" -gt 0 ]; then
    echo ""
    echo "🔧 Applying Auto-Corrections"
    echo "============================"
    
    # Process corrections in batches
    node -e "
        const fs = require('fs');
        const https = require('https');
        const url = require('url');
        
        async function applyCorrectionsBatch() {
            const data = JSON.parse(fs.readFileSync('$TEMP_MANIFEST', 'utf8'));
            const corrections = data.validationResults.filter(r => r.correctedStatus);
            
            console.log(\`🔧 Applying \${corrections.length} corrections in batches of $BATCH_SIZE\`);
            
            for (let i = 0; i < corrections.length; i += $BATCH_SIZE) {
                const batch = corrections.slice(i, i + $BATCH_SIZE);
                console.log(\`📦 Processing batch \${Math.floor(i/$BATCH_SIZE) + 1}/\${Math.ceil(corrections.length/$BATCH_SIZE)}\`);
                
                // Prepare batch update
                const updates = batch.map(correction => ({
                    '@search.action': 'merge',
                    id: correction.documentId,
                    metadata: {
                        status: correction.correctedStatus,
                        abrogatedBy: null, // Clear the incorrect abrogation reference
                        correctionApplied: true,
                        correctionTimestamp: new Date().toISOString(),
                        correctionRules: correction.rulesApplied.join(', ')
                    }
                }));
                
                // Send batch update to Azure AI Search
                const updateData = JSON.stringify({ value: updates });
                const searchUrl = '$AZURE_SEARCH_ENDPOINT/indexes/$AZURE_SEARCH_INDEX/docs/index?api-version=2023-11-01';
                
                await new Promise((resolve, reject) => {
                    const urlParts = url.parse(searchUrl);
                    const req = https.request({
                        method: 'POST',
                        hostname: urlParts.hostname,
                        path: urlParts.path,
                        headers: {
                            'Content-Type': 'application/json',
                            'api-key': '$AZURE_SEARCH_API_KEY'
                        }
                    }, (res) => {
                        let responseData = '';
                        res.on('data', chunk => responseData += chunk);
                        res.on('end', () => {
                            if (res.statusCode === 200 || res.statusCode === 201) {
                                console.log(\`  ✅ Batch \${Math.floor(i/$BATCH_SIZE) + 1} completed successfully\`);
                                resolve();
                            } else {
                                console.error(\`  ❌ Batch \${Math.floor(i/$BATCH_SIZE) + 1} failed: \${res.statusCode}\`);
                                console.error(responseData);
                                reject(new Error(\`Batch update failed: \${res.statusCode}\`));
                            }
                        });
                    });
                    
                    req.on('error', reject);
                    req.write(updateData);
                    req.end();
                });
                
                // Brief pause between batches
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            console.log('✅ All corrections applied successfully');
        }
        
        applyCorrectionsBatch().catch(error => {
            console.error('❌ Correction process failed:', error);
            process.exit(1);
        });
    "
fi

# Cleanup
rm -f "$TEMP_MANIFEST"

echo ""
echo "🎉 Batch Correction Complete!"
echo "============================="
echo "✅ Auto-corrections applied: $AUTO_CORRECTIONS"
if [ "$MANUAL_REVIEW" -gt 0 ]; then
    echo "⚠️  Documents requiring manual review: $MANUAL_REVIEW"
    echo "📄 Check validation_report.md for details"
fi

echo ""
echo "🔍 Recommended Next Steps:"
echo "1. Review validation_report.md for detailed analysis"
echo "2. Test search functionality with corrected documents"
if [ "$MANUAL_REVIEW" -gt 0 ]; then
    echo "3. Manually review flagged documents"
fi
echo "4. Consider running periodic validation checks"

echo ""
echo "📊 Run './scripts/index-status.sh $ENVIRONMENT' to verify index status"
