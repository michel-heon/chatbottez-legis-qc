/**
 * Enhanced Legal Status Validator
 * Advanced logic for detecting and correcting AI enrichment errors at scale
 */

export interface StatusValidationRule {
    name: string;
    description: string;
    pattern: RegExp;
    confidence: number; // 0-1 scale
    action: 'correct' | 'flag' | 'ignore';
}

export interface ValidationResult {
    documentId: string;
    originalStatus: string;
    correctedStatus?: string;
    confidence: number;
    rulesApplied: string[];
    requiresManualReview: boolean;
    evidence: string[];
}

export class LegalStatusValidator {
    private rules: StatusValidationRule[] = [
        // Pattern 1: Article references that don't indicate law abrogation
        {
            name: 'article_reference_false_positive',
            description: 'Article references (c. X, a. Y) that incorrectly suggest law abrogation',
            pattern: /\d+,\s*c\.\s*\d+|a\.\s*\d+|\d+,\s*\d+/,
            confidence: 0.9,
            action: 'correct'
        },
        
        // Pattern 2: Specific year references that are modifications, not abrogations
        {
            name: 'modification_year_false_positive',
            description: 'Year references that indicate modifications, not abrogations',
            pattern: /(19|20)\d{2},\s*c\.\s*\d+,\s*a\.\s*\d+/,
            confidence: 0.8,
            action: 'correct'
        },
        
        // Pattern 3: Multiple article references (likely modifications)
        {
            name: 'multiple_article_references',
            description: 'Multiple article references indicating partial modifications',
            pattern: /a\.\s*\d+.*a\.\s*\d+/,
            confidence: 0.7,
            action: 'flag'
        },
        
        // Pattern 4: Recently dated references (likely still in force)
        {
            name: 'recent_date_reference',
            description: 'Recent dates (post-2000) likely indicate modifications',
            pattern: /(20[0-2]\d),\s*c\.\s*\d+/,
            confidence: 0.6,
            action: 'flag'
        },
        
        // Pattern 5: Known false positive patterns from legal context
        {
            name: 'known_modification_patterns',
            description: 'Known patterns that indicate modifications rather than abrogations',
            pattern: /modifié|remplacé par|tel que modifié/i,
            confidence: 0.9,
            action: 'correct'
        }
    ];

    /**
     * Validate and potentially correct a document's legal status
     */
    validateStatus(documentId: string, status: string, abrogatedBy?: string, 
                  enrichmentMethod?: string, description?: string): ValidationResult {
        const result: ValidationResult = {
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

        // Check if there's an abrogatedBy reference to analyze
        if (!abrogatedBy) {
            result.requiresManualReview = true;
            result.evidence.push('No abrogatedBy reference found for abrogated status');
            return result;
        }

        const textToAnalyze = `${abrogatedBy} ${description || ''}`;
        let maxConfidence = 0;
        let shouldCorrect = false;

        // Apply validation rules
        for (const rule of this.rules) {
            if (rule.pattern.test(textToAnalyze)) {
                result.rulesApplied.push(rule.name);
                result.evidence.push(`${rule.description}: ${rule.pattern.toString()}`);
                
                if (rule.confidence > maxConfidence) {
                    maxConfidence = rule.confidence;
                }
                
                if (rule.action === 'correct') {
                    shouldCorrect = true;
                }
            }
        }

        // Determine final action
        if (shouldCorrect && maxConfidence >= 0.7) {
            result.correctedStatus = 'en vigueur';
            result.confidence = maxConfidence;
        } else if (maxConfidence >= 0.5) {
            result.requiresManualReview = true;
            result.confidence = maxConfidence;
        }

        return result;
    }

    /**
     * Batch validate multiple documents
     */
    batchValidate(documents: any[]): ValidationResult[] {
        const results: ValidationResult[] = [];
        let correctedCount = 0;
        let flaggedCount = 0;

        for (const doc of documents) {
            const result = this.validateStatus(
                doc.legalIdentifier || doc.metadata?.identifier,
                doc.metadata?.status,
                doc.metadata?.abrogatedBy,
                doc.metadata?.enrichmentMethod,
                doc.metadata?.description
            );

            results.push(result);

            if (result.correctedStatus) {
                correctedCount++;
            } else if (result.requiresManualReview) {
                flaggedCount++;
            }
        }

        console.log(`📊 Validation Summary:`);
        console.log(`  Total documents: ${documents.length}`);
        console.log(`  Auto-corrected: ${correctedCount}`);
        console.log(`  Flagged for review: ${flaggedCount}`);
        console.log(`  No issues: ${documents.length - correctedCount - flaggedCount}`);

        return results;
    }

    /**
     * Generate correction report
     */
    generateReport(results: ValidationResult[]): string {
        const corrections = results.filter(r => r.correctedStatus);
        const flagged = results.filter(r => r.requiresManualReview);

        let report = `# Legal Status Validation Report\n\n`;
        report += `Generated: ${new Date().toISOString()}\n\n`;

        report += `## Summary\n`;
        report += `- Total documents analyzed: ${results.length}\n`;
        report += `- Auto-corrections applied: ${corrections.length}\n`;
        report += `- Documents flagged for manual review: ${flagged.length}\n\n`;

        if (corrections.length > 0) {
            report += `## Auto-Corrections Applied\n\n`;
            corrections.forEach(r => {
                report += `### ${r.documentId}\n`;
                report += `- **Original Status**: ${r.originalStatus}\n`;
                report += `- **Corrected Status**: ${r.correctedStatus}\n`;
                report += `- **Confidence**: ${(r.confidence * 100).toFixed(1)}%\n`;
                report += `- **Rules Applied**: ${r.rulesApplied.join(', ')}\n`;
                report += `- **Evidence**: ${r.evidence.join('; ')}\n\n`;
            });
        }

        if (flagged.length > 0) {
            report += `## Documents Requiring Manual Review\n\n`;
            flagged.forEach(r => {
                report += `### ${r.documentId}\n`;
                report += `- **Current Status**: ${r.originalStatus}\n`;
                report += `- **Confidence**: ${(r.confidence * 100).toFixed(1)}%\n`;
                report += `- **Reasons**: ${r.evidence.join('; ')}\n\n`;
            });
        }

        return report;
    }
}

// Export for use in other modules
export const legalStatusValidator = new LegalStatusValidator();
