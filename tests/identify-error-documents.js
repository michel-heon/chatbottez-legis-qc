#!/usr/bin/env node

/**
 * Script pour identifier les documents indexés en erreur
 * Analyse les données d'Azure AI Search selon les conventions du projet
 * 
 * Convention: tests/identify-error-documents.js
 * Usage: node tests/identify-error-documents.js
 * 
 * Basé sur les standards établis dans docs/scripts-reference.md
 */

const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');
require('dotenv').config({ path: 'env/.env.local.user' });

// Configuration selon les conventions du projet
const config = {
    searchClient: new SearchClient(
        process.env.AZURE_SEARCH_ENDPOINT,
        process.env.AZURE_SEARCH_INDEX_NAME || 'legis-qc-index-full-01',
        new AzureKeyCredential(process.env.SECRET_AZURE_SEARCH_KEY)
    ),
    // Seuils d'erreur selon les conventions du projet
    minContentLength: 100, // Contenu minimum requis
    maxBatchSize: 1000,    // Taille max de batch selon les patterns existants
    criticalDocuments: ['A-3', 'A-3.001'], // Documents critiques identifiés
};

async function identifyErrorDocuments() {
    console.log('🔍 Identification des documents en erreur selon conventions projet...');
    console.log('=====================================================================\n');

    const errorCategories = {
        criticalErrors: [],
        warningIssues: [],
        metadataInconsistencies: [],
        contentIssues: []
    };

    try {
        // 1. Validation des documents critiques selon le projet
        console.log('📋 1. Validation documents critiques (A-3, A-3.001):');
        await validateCriticalDocuments(errorCategories);

        // 2. Détection anomalies de statut légal
        console.log('\n📋 2. Analyse statuts légaux selon ontologie:');
        await validateLegalStatus(errorCategories);

        // 3. Validation intégrité des métadonnées TTL
        console.log('\n📋 3. Contrôle métadonnées TTL extraites:');
        await validateTTLMetadata(errorCategories);

        // 4. Analyse qualité du contenu
        console.log('\n📋 4. Validation qualité contenu:');
        await validateContentQuality(errorCategories);

        // 5. Rapport final selon patterns du projet
        console.log('\n🎯 RAPPORT D\'ANALYSE SELON CONVENTIONS PROJET:');
        console.log('==============================================');
        
        generateComplianceReport(errorCategories);

        return errorCategories;

    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse conformité:', error.message);
        if (error.details) {
            console.error('Détails techniques:', error.details);
        }
        throw error;
    }
}

/**
 * Validation des documents critiques selon conventions projet
 */
async function validateCriticalDocuments(errorCategories) {
    const criticalQuery = config.criticalDocuments.map(id => `id:${id}`).join(' OR ');
    
    const results = await config.searchClient.search(criticalQuery, {
        select: ['id', 'title', 'legalStatus', 'legalIdentifier', 'enrichedAt'],
        top: 10
    });

    const foundDocs = [];
    for await (const result of results.results) {
        foundDocs.push(result.document);
    }

    console.log(`   Recherche: ${config.criticalDocuments.length} documents critiques`);
    console.log(`   Trouvés: ${foundDocs.length} documents`);

    // Vérifier présence documents critiques
    for (const expectedId of config.criticalDocuments) {
        const found = foundDocs.find(doc => doc.id === expectedId);
        if (!found) {
            errorCategories.criticalErrors.push({
                type: 'MISSING_CRITICAL_DOCUMENT',
                id: expectedId,
                message: `Document critique manquant: ${expectedId}`
            });
            console.log(`   ❌ CRITIQUE: Document ${expectedId} manquant dans l'index`);
        } else {
            console.log(`   ✅ ${found.id}: "${found.title}"`);
            console.log(`      - Statut: "${found.legalStatus}"`);
            console.log(`      - Enrichi: ${found.enrichedAt}`);
            
            // Validation statut du document critique
            if (!found.legalStatus || found.legalStatus === 'null') {
                errorCategories.criticalErrors.push({
                    type: 'CRITICAL_DOCUMENT_NO_STATUS',
                    id: found.id,
                    message: `Document critique sans statut légal: ${found.id}`
                });
                console.log(`      ❌ CRITIQUE: Statut légal manquant`);
            }
        }
    }
}

/**
 * Validation des statuts légaux selon l'ontologie
 */
async function validateLegalStatus(errorCategories) {
    // Recherche documents sans statut légal
    const noStatusResults = await config.searchClient.search('*', {
        filter: "legalStatus eq null",
        select: ['id', 'title', 'legalStatus', 'legalIdentifier'],
        top: 50
    });

    let noStatusCount = 0;
    for await (const result of noStatusResults.results) {
        noStatusCount++;
        errorCategories.warningIssues.push({
            type: 'NO_LEGAL_STATUS',
            id: result.document.id,
            title: result.document.title,
            message: `Document sans statut légal: ${result.document.id}`
        });
    }

    if (noStatusCount > 0) {
        console.log(`   ⚠️ ${noStatusCount} documents sans statut légal détectés`);
    } else {
        console.log(`   ✅ Tous les documents ont un statut légal`);
    }

    // Validation des statuts selon l'ontologie légale québécoise
    const validStatuses = ['en vigueur', 'abrogée', 'modifiée', 'remplacée'];
    const allDocsResults = await config.searchClient.search('*', {
        select: ['id', 'legalStatus'],
        top: config.maxBatchSize
    });

    let invalidStatusCount = 0;
    for await (const result of allDocsResults.results) {
        const doc = result.document;
        if (doc.legalStatus && !validStatuses.includes(doc.legalStatus.toLowerCase())) {
            invalidStatusCount++;
            errorCategories.metadataInconsistencies.push({
                type: 'INVALID_LEGAL_STATUS',
                id: doc.id,
                status: doc.legalStatus,
                message: `Statut légal non conforme à l'ontologie: "${doc.legalStatus}"`
            });
        }
    }

    if (invalidStatusCount > 0) {
        console.log(`   ⚠️ ${invalidStatusCount} documents avec statut non-standard`);
    } else {
        console.log(`   ✅ Tous les statuts conformes à l'ontologie`);
    }
}

/**
 * Validation des métadonnées TTL selon le schéma
 */
async function validateTTLMetadata(errorCategories) {
    // Vérification cohérence legalIdentifier vs id
    const metadataResults = await config.searchClient.search('*', {
        select: ['id', 'legalIdentifier', 'title', 'legalType'],
        top: config.maxBatchSize
    });

    let inconsistentCount = 0;
    for await (const result of metadataResults.results) {
        const doc = result.document;
        
        // Vérifier que legalIdentifier correspond à l'ID
        if (doc.legalIdentifier && doc.legalIdentifier !== doc.id) {
            inconsistentCount++;
            errorCategories.metadataInconsistencies.push({
                type: 'ID_LEGALIDENTIFIER_MISMATCH',
                id: doc.id,
                legalIdentifier: doc.legalIdentifier,
                message: `Incohérence ID/legalIdentifier: ${doc.id} vs ${doc.legalIdentifier}`
            });
        }

        // Vérifier présence titre
        if (!doc.title || doc.title.trim().length < 5) {
            inconsistentCount++;
            errorCategories.metadataInconsistencies.push({
                type: 'INVALID_TITLE',
                id: doc.id,
                title: doc.title,
                message: `Titre invalide ou trop court: "${doc.title}"`
            });
        }
    }

    if (inconsistentCount > 0) {
        console.log(`   ⚠️ ${inconsistentCount} incohérences métadonnées TTL détectées`);
    } else {
        console.log(`   ✅ Métadonnées TTL cohérentes`);
    }
}

/**
 * Validation de la qualité du contenu
 */
async function validateContentQuality(errorCategories) {
    const contentResults = await config.searchClient.search('*', {
        select: ['id', 'title', 'content'],
        top: config.maxBatchSize
    });

    let lowQualityCount = 0;
    for await (const result of contentResults.results) {
        const doc = result.document;
        
        if (!doc.content) {
            lowQualityCount++;
            errorCategories.contentIssues.push({
                type: 'NO_CONTENT',
                id: doc.id,
                message: `Document sans contenu: ${doc.id}`
            });
        } else if (doc.content.trim().length < config.minContentLength) {
            lowQualityCount++;
            errorCategories.contentIssues.push({
                type: 'INSUFFICIENT_CONTENT',
                id: doc.id,
                contentLength: doc.content.length,
                message: `Contenu insuffisant (${doc.content.length} caractères): ${doc.id}`
            });
        }
    }

    if (lowQualityCount > 0) {
        console.log(`   ⚠️ ${lowQualityCount} documents avec problèmes de contenu`);
    } else {
        console.log(`   ✅ Qualité du contenu acceptable`);
    }
}

/**
 * Génération du rapport de conformité
 */
function generateComplianceReport(errorCategories) {
    const totalCritical = errorCategories.criticalErrors.length;
    const totalWarnings = errorCategories.warningIssues.length;
    const totalMetadata = errorCategories.metadataInconsistencies.length;
    const totalContent = errorCategories.contentIssues.length;
    const totalIssues = totalCritical + totalWarnings + totalMetadata + totalContent;

    if (totalIssues === 0) {
        console.log('✅ INDEX CONFORME - Aucun problème détecté');
        console.log('   Tous les documents respectent les conventions du projet');
        return;
    }

    console.log(`❌ ${totalIssues} PROBLÈMES DÉTECTÉS:`);
    
    if (totalCritical > 0) {
        console.log(`   🚨 ${totalCritical} erreurs critiques (PRIORITÉ HAUTE)`);
        errorCategories.criticalErrors.slice(0, 3).forEach(error => {
            console.log(`      • ${error.type}: ${error.message}`);
        });
        if (totalCritical > 3) {
            console.log(`      ... et ${totalCritical - 3} autres erreurs critiques`);
        }
    }

    if (totalWarnings > 0) {
        console.log(`   ⚠️ ${totalWarnings} avertissements (à corriger)`);
    }

    if (totalMetadata > 0) {
        console.log(`   📋 ${totalMetadata} incohérences métadonnées TTL`);
    }

    if (totalContent > 0) {
        console.log(`   📄 ${totalContent} problèmes de qualité contenu`);
    }

    console.log('\n📊 Recommandations par priorité:');
    if (totalCritical > 0) {
        console.log('   1. 🚨 Corriger les erreurs critiques (documents manquants, statuts critiques)');
    }
    if (totalMetadata > 0) {
        console.log('   2. 📋 Réviser la cohérence des métadonnées TTL');
    }
    if (totalContent > 0) {
        console.log('   3. 📄 Améliorer la qualité du contenu');
    }
    if (totalWarnings > 0) {
        console.log('   4. ⚠️ Traiter les avertissements selon priorité métier');
    }
}

    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse conformité:', error.message);
        if (error.details) {
            console.error('Détails techniques:', error.details);
        }
        throw error;
    }
}
}

// Exécution selon les conventions du projet
if (require.main === module) {
    identifyErrorDocuments()
        .then(results => {
            console.log('\n✅ Analyse de conformité terminée.');
            
            // Codes de sortie selon les conventions des scripts existants
            const hasCritical = results.criticalErrors.length > 0;
            const hasWarnings = results.warningIssues.length > 0 || 
                              results.metadataInconsistencies.length > 0 || 
                              results.contentIssues.length > 0;
            
            if (hasCritical) {
                console.log('❌ ERREURS CRITIQUES DÉTECTÉES - intervention requise');
                process.exit(2); // Code d'erreur critique
            } else if (hasWarnings) {
                console.log('⚠️ Avertissements détectés - révision recommandée');
                process.exit(1); // Code d'avertissement
            } else {
                console.log('✅ Index conforme aux conventions du projet');
                process.exit(0); // Succès
            }
        })
        .catch(error => {
            console.error('❌ Échec de l\'analyse de conformité:', error.message);
            process.exit(3); // Erreur technique
        });
}

module.exports = { 
    identifyErrorDocuments,
    validateCriticalDocuments,
    validateLegalStatus,
    validateTTLMetadata,
    validateContentQuality,
    generateComplianceReport
};
