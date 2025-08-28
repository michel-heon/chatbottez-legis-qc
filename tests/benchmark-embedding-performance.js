#!/usr/bin/env node

/**
 * Script de test de performance pour les embeddings parallèles
 * Compare les performances entre traitement séquentiel et parallèle
 */

const { ParallelEmbeddingProcessor } = require('../lib/src/indexers/parallelEmbeddingProcessor');
const { getEmbeddingVector } = require('../lib/src/indexers/utils');
require('dotenv').config({ path: 'env/.env.playground.user' });

async function benchmarkEmbeddingPerformance() {
    console.log('🚀 Benchmark des performances d\'embedding');
    console.log('==========================================\n');

    // Données de test
    const testTexts = [
        "Loi sur l'accès aux documents des organismes publics et sur la protection des renseignements personnels",
        "Code civil du Québec, article 1372 concernant les obligations contractuelles",
        "Charte des droits et libertés de la personne, section première",
        "Loi sur la qualité de l'environnement et ses modifications récentes",
        "Règlement sur les normes du travail et conditions d'emploi",
        "Loi sur l'aménagement et l'urbanisme dans les municipalités",
        "Code de procédure civile, livre deuxième, titre premier",
        "Loi sur la protection du consommateur et garanties légales",
        "Règlement sur la sécurité routière et infractions",
        "Loi sur l'instruction publique et réforme scolaire"
    ];

    // Test 1: Traitement séquentiel (méthode actuelle)
    console.log('📊 Test 1: Traitement séquentiel');
    const sequentialStart = Date.now();
    
    const sequentialResults = [];
    for (let i = 0; i < testTexts.length; i++) {
        try {
            const vector = await getEmbeddingVector(testTexts[i]);
            sequentialResults.push(vector);
            console.log(`   ✅ Embedding ${i + 1}/${testTexts.length} généré`);
            
            // Délai comme dans l'ancienne méthode
            if (i > 0 && i % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.warn(`   ⚠️ Échec embedding ${i + 1}: ${error.message}`);
        }
    }
    
    const sequentialTime = Date.now() - sequentialStart;
    console.log(`   ⏱️ Temps séquentiel: ${sequentialTime}ms\n`);

    // Test 2: Traitement parallèle
    console.log('📊 Test 2: Traitement parallèle');
    const parallelStart = Date.now();
    
    const embeddingProcessor = ParallelEmbeddingProcessor.createOptimizedProcessor('playground');
    
    const tasks = testTexts.map((text, index) => ({
        id: `test_${index}`,
        text
    }));
    
    const parallelResults = await embeddingProcessor.processEmbeddingsBatch(tasks);
    const parallelTime = Date.now() - parallelStart;
    
    console.log(`   ⏱️ Temps parallèle: ${parallelTime}ms\n`);

    // Analyse des résultats
    console.log('📈 Analyse des performances:');
    console.log('============================');
    
    const speedup = sequentialTime / parallelTime;
    const efficiency = (speedup / testTexts.length) * 100;
    
    console.log(`📊 Embeddings générés:`);
    console.log(`   Séquentiel: ${sequentialResults.length}/${testTexts.length}`);
    console.log(`   Parallèle: ${parallelResults.length}/${testTexts.length}`);
    
    console.log(`\n⏱️ Temps d'exécution:`);
    console.log(`   Séquentiel: ${(sequentialTime / 1000).toFixed(2)}s`);
    console.log(`   Parallèle: ${(parallelTime / 1000).toFixed(2)}s`);
    
    console.log(`\n🚀 Amélioration de performance:`);
    console.log(`   Speedup: ${speedup.toFixed(2)}x`);
    console.log(`   Gain de temps: ${((1 - parallelTime / sequentialTime) * 100).toFixed(1)}%`);
    console.log(`   Efficacité: ${efficiency.toFixed(1)}%`);
    
    if (speedup > 2) {
        console.log(`\n✅ Excellent! Le traitement parallèle est ${speedup.toFixed(1)}x plus rapide`);
    } else if (speedup > 1.5) {
        console.log(`\n✅ Bien! Amélioration significative de ${speedup.toFixed(1)}x`);
    } else {
        console.log(`\n⚠️ Amélioration modeste de ${speedup.toFixed(1)}x - vérifier la configuration`);
    }

    // Test de qualité (vérification que les embeddings sont identiques)
    console.log(`\n🔍 Vérification de la qualité:`);
    let qualityCheck = 0;
    
    for (let i = 0; i < Math.min(sequentialResults.length, parallelResults.length); i++) {
        const seqVector = sequentialResults[i];
        const parVector = parallelResults.find(r => r.id === `test_${i}`)?.vector || [];
        
        if (seqVector.length === parVector.length && seqVector.length > 0) {
            // Comparaison approximative (les embeddings peuvent varier légèrement)
            const similarity = cosineSimilarity(seqVector, parVector);
            if (similarity > 0.99) {
                qualityCheck++;
            }
        }
    }
    
    console.log(`   Embeddings identiques: ${qualityCheck}/${Math.min(sequentialResults.length, parallelResults.length)}`);
    
    if (qualityCheck === Math.min(sequentialResults.length, parallelResults.length)) {
        console.log(`   ✅ Qualité parfaite - les résultats sont identiques`);
    } else {
        console.log(`   ⚠️ Quelques variations détectées (normal pour les API)`);
    }
}

/**
 * Calcul de similarité cosinus entre deux vecteurs
 */
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Exécution
if (require.main === module) {
    benchmarkEmbeddingPerformance()
        .then(() => {
            console.log('\n✅ Benchmark terminé.');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Échec du benchmark:', error.message);
            process.exit(1);
        });
}

module.exports = { benchmarkEmbeddingPerformance };
