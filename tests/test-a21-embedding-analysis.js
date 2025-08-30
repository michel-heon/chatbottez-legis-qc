/**
 * Script d'analyse des échecs d'embedding pour A-2.1
 * 
 * Objectif : Comprendre pourquoi A-2.1 (Loi sur l'accès) a des échecs d'embedding
 * malgré sa présence dans l'index
 */

require('dotenv').config({ path: 'env/.env.playground.user' });
const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');
const fs = require('fs');
const path = require('path');

// Configuration Azure Search
const searchClient = new SearchClient(
    process.env.AZURE_SEARCH_ENDPOINT,
    process.env.AZURE_SEARCH_INDEX_NAME || 'legis-qc-index-full-01',
    new AzureKeyCredential(process.env.SECRET_AZURE_SEARCH_KEY)
);

/**
 * Analyser en détail le document A-2.1 et ses problèmes d'embedding
 */
async function analyzeA21EmbeddingIssues() {
    console.log('🔍 Analyse détaillée des échecs d\'embedding A-2.1...');
    console.log('===================================================');

    try {
        // 1. Récupérer le document A-2.1 complet
        console.log('\n📋 1. Récupération du document A-2.1:');
        const results = await searchClient.search('*', {
            filter: `legalIdentifier eq 'A-2.1'`,
            select: ['legalIdentifier', 'title', 'description', 'content'], // Champs récupérables seulement
            top: 1
        });

        let a21Doc = null;
        for await (const result of results.results) {
            a21Doc = result.document;
            break;
        }

        if (!a21Doc) {
            console.log('❌ Document A-2.1 non trouvé dans l\'index');
            return;
        }

        console.log('✅ Document A-2.1 trouvé:');
        console.log(`   ID: ${a21Doc.legalIdentifier}`);
        console.log(`   Titre: ${a21Doc.title}`);
        console.log(`   Description: ${a21Doc.description?.length || 0} caractères`);
        console.log(`   Contenu: ${a21Doc.content?.length || 0} caractères`);
        
        // 2. Analyser la description problématique
        console.log('\n📋 2. Analyse de la description:');
        if (a21Doc.description) {
            console.log('✅ Description présente:');
            console.log(`   Longueur: ${a21Doc.description.length} caractères`);
            console.log(`   Début: "${a21Doc.description.substring(0, 100)}..."`);
            console.log(`   Fin: "...${a21Doc.description.substring(a21Doc.description.length - 100)}"`);
            
            // Vérifier les caractères problématiques
            const problematicChars = a21Doc.description.match(/[^\x20-\x7E\u00C0-\u017F]/g);
            if (problematicChars) {
                console.log(`   ⚠️  Caractères non-ASCII détectés: ${problematicChars.length}`);
                console.log(`   Exemples: ${[...new Set(problematicChars)].slice(0, 10).join(', ')}`);
            } else {
                console.log('   ✅ Pas de caractères problématiques détectés');
            }
            
            // Vérifier la longueur pour embedding
            if (a21Doc.description.length > 8000) {
                console.log('   ⚠️  Description très longue - peut causer des échecs d\'embedding');
            }
        } else {
            console.log('❌ Aucune description trouvée');
        }

        // 3. Analyser les autres champs vectoriels
        console.log('\n📋 3. Analyse des champs vectoriels:');
        const vectorFields = ['contentVector', 'descriptionVector'];
        
        for (const field of vectorFields) {
            const value = a21Doc[field];
            if (value && Array.isArray(value)) {
                console.log(`   ✅ ${field}: ${value.length} dimensions`);
                // Vérifier si le vecteur contient des valeurs valides
                const validValues = value.filter(v => !isNaN(v) && isFinite(v));
                if (validValues.length !== value.length) {
                    console.log(`   ⚠️  ${field}: ${value.length - validValues.length} valeurs invalides`);
                }
            } else {
                console.log(`   ❌ ${field}: Manquant ou invalide`);
            }
        }

        // 4. Comparer avec un document qui fonctionne (A-14)
        console.log('\n📋 4. Comparaison avec A-14 (document fonctionnel):');
        const a14Results = await searchClient.search('*', {
            filter: `legalIdentifier eq 'A-14'`,
            select: ['legalIdentifier', 'title', 'description', 'contentVector'],
            top: 1
        });

        for await (const result of a14Results.results) {
            const a14Doc = result.document;
            console.log('📊 Comparaison A-2.1 vs A-14:');
            console.log(`   Description A-2.1: ${a21Doc.description?.length || 0} chars`);
            console.log(`   Description A-14:  ${a14Doc.description?.length || 0} chars`);
            
            if (a21Doc.contentVector && a14Doc.contentVector) {
                console.log(`   contentVector A-2.1: ${a21Doc.contentVector.length} dimensions`);
                console.log(`   contentVector A-14:  ${a14Doc.contentVector.length} dimensions`);
                
                // Vérifier la qualité des vecteurs
                const a21NonZero = a21Doc.contentVector.filter(v => v !== 0).length;
                const a14NonZero = a14Doc.contentVector.filter(v => v !== 0).length;
                console.log(`   Valeurs non-nulles A-2.1: ${a21NonZero}`);
                console.log(`   Valeurs non-nulles A-14:  ${a14NonZero}`);
            } else {
                console.log('   ⚠️  Différence dans les vecteurs de contenu');
                if (!a21Doc.contentVector) console.log('   ❌ A-2.1: contentVector manquant');
                if (!a14Doc.contentVector) console.log('   ❌ A-14: contentVector manquant');
            }
        }

        // 5. Analyser les fichiers source dans TTL
        console.log('\n📋 5. Vérification des fichiers source TTL:');
        const ttlPath = path.join(
            process.env.EXTERNAL_DATA_SOURCE_PATH,
            process.env.TTL_METADATA_FILE
        );
        
        console.log(`📁 Recherche dans: ${ttlPath}`);
        
        if (fs.existsSync(ttlPath)) {
            console.log('✅ Fichier TTL trouvé, recherche A-2.1...');
            
            // Rechercher A-2.1 dans le fichier TTL
            const ttlContent = fs.readFileSync(ttlPath, 'utf8');
            const a21Matches = ttlContent.match(/A-2\.1[^\n]*\n?/g);
            
            if (a21Matches) {
                console.log(`   ✅ ${a21Matches.length} références A-2.1 trouvées dans TTL:`);
                a21Matches.slice(0, 3).forEach((match, idx) => {
                    console.log(`   ${idx + 1}. ${match.trim()}`);
                });
            } else {
                console.log('   ❌ Aucune référence A-2.1 trouvée dans TTL');
            }
            
            // Chercher aussi par titre
            const titleMatches = ttlContent.match(/accès aux documents[^\n]*\n?/gi);
            if (titleMatches) {
                console.log(`   🔍 ${titleMatches.length} références "accès aux documents" dans TTL:`);
                titleMatches.slice(0, 2).forEach((match, idx) => {
                    console.log(`   ${idx + 1}. ${match.trim()}`);
                });
            }
        } else {
            console.log('❌ Fichier TTL non trouvé');
        }

        // 6. Analyser les logs de transformation
        console.log('\n📋 6. Analyse des logs de transformation:');
        const logsPath = path.join(
            process.env.EXTERNAL_DATA_SOURCE_PATH,
            'transform',
            'processed'
        );
        
        if (fs.existsSync(logsPath)) {
            const logFiles = fs.readdirSync(logsPath).filter(f => f.endsWith('.log'));
            console.log(`📁 ${logFiles.length} fichiers de logs trouvés:`);
            
            for (const logFile of logFiles) {
                const logPath = path.join(logsPath, logFile);
                const logContent = fs.readFileSync(logPath, 'utf8');
                
                // Chercher des mentions de A-2.1
                const a21LogMatches = logContent.match(/A-2\.1[^\n]*\n?/g);
                if (a21LogMatches) {
                    console.log(`   📄 ${logFile}: ${a21LogMatches.length} mentions A-2.1`);
                    a21LogMatches.slice(0, 2).forEach(match => {
                        console.log(`      ${match.trim()}`);
                    });
                }
            }
        }

        console.log(`\n🎯 DIAGNOSTIC A-2.1 - ÉCHECS D'EMBEDDING:`);
        console.log('==========================================');
        
        // Synthèse des problèmes identifiés
        const issues = [];
        
        if (!a21Doc.contentVector) {
            issues.push('❌ Vecteur de contenu manquant');
        } else {
            const nonZeroValues = a21Doc.contentVector.filter(v => v !== 0);
            if (nonZeroValues.length === 0) {
                issues.push('❌ Vecteur de contenu vide (tous zéros)');
            }
        }
        
        if (a21Doc.description && a21Doc.description.length > 8000) {
            issues.push('⚠️  Description très longue');
        }
        
        const problematicChars = a21Doc.description?.match(/[^\x20-\x7E\u00C0-\u017F]/g);
        if (problematicChars) {
            issues.push(`⚠️  ${problematicChars.length} caractères non-ASCII`);
        }
        
        if (issues.length > 0) {
            console.log('🚨 PROBLÈMES IDENTIFIÉS:');
            issues.forEach((issue, idx) => console.log(`   ${idx + 1}. ${issue}`));
        } else {
            console.log('✅ Aucun problème évident identifié');
        }
        
        console.log('\n💡 RECOMMANDATIONS:');
        console.log('==================');
        console.log('1. Vérifier la longueur de la description dans les données source');
        console.log('2. Nettoyer les caractères spéciaux avant embedding');
        console.log('3. Diviser les descriptions longues en chunks');
        console.log('4. Réessayer l\'embedding avec des paramètres ajustés');
        console.log('5. Vérifier les logs détaillés du processus d\'embedding');

    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse:', error.message);
        process.exit(1);
    }
}

// Exécution
if (require.main === module) {
    analyzeA21EmbeddingIssues()
        .then(() => {
            console.log('\n✅ Analyse détaillée A-2.1 terminée.');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = { analyzeA21EmbeddingIssues };
