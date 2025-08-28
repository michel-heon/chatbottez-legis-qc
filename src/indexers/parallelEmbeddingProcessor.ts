/**
 * Parallel Embedding Processor - Optimized embedding generation with concurrent processing
 * Améliore significativement les performances d'indexation via la parallélisation
 */

import { getEmbeddingVector } from './utils';

interface EmbeddingTask {
    id: string;
    text: string;
    chunkIndex?: number;
}

interface EmbeddingResult {
    id: string;
    vector: number[];
    chunkIndex?: number;
    error?: string;
}

export class ParallelEmbeddingProcessor {
    private maxConcurrency: number;
    private rateLimitDelay: number;
    private retryAttempts: number;
    private batchSize: number;

    constructor(options: {
        maxConcurrency?: number;
        rateLimitDelay?: number;
        retryAttempts?: number;
        batchSize?: number;
    } = {}) {
        this.maxConcurrency = options.maxConcurrency || 5; // Limite de concurrence Azure OpenAI
        this.rateLimitDelay = options.rateLimitDelay || 200; // Délai entre les requêtes (ms)
        this.retryAttempts = options.retryAttempts || 3;
        this.batchSize = options.batchSize || 20; // Taille optimisée pour les batches
    }

    /**
     * Traitement parallèle des embeddings avec gestion des rate limits
     */
    async processEmbeddingsBatch(tasks: EmbeddingTask[]): Promise<EmbeddingResult[]> {
        const startTime = Date.now();
        const totalBatches = Math.ceil(tasks.length / this.batchSize);
        
        console.log(`� Démarrage du traitement parallèle`);
        console.log(`   📊 Total: ${tasks.length} embeddings à générer`);
        console.log(`   ⚡ Concurrence: ${this.maxConcurrency} requêtes simultanées`);
        console.log(`   📦 Organisation: ${totalBatches} batch(s) de ${this.batchSize} tâches max`);
        console.log(`   ⏱️  Délai entre requêtes: ${this.rateLimitDelay}ms`);
        
        const results: EmbeddingResult[] = [];
        const failedTasks: EmbeddingTask[] = [];

        // Traitement par sous-batches pour respecter les limites Azure
        for (let i = 0; i < tasks.length; i += this.batchSize) {
            const batch = tasks.slice(i, Math.min(i + this.batchSize, tasks.length));
            const batchNumber = Math.floor(i / this.batchSize) + 1;
            const batchStartTime = Date.now();
            
            console.log(`\nBatch ${batchNumber}/${totalBatches} - ${batch.length} tâches`);
            
            try {
                const batchResults = await this.processConcurrentBatch(batch);
                const batchDuration = Date.now() - batchStartTime;
                
                results.push(...batchResults.successful);
                failedTasks.push(...batchResults.failed);
                
                console.log(`  ✅ Succès: ${batchResults.successful.length}/${batch.length}`);
                if (batchResults.failed.length > 0) {
                    console.log(`  ⚠️ Échecs temporaires: ${batchResults.failed.length} (reprise automatique)`);
                }
                console.log(`  Durée: ${batchDuration}ms`);
                
                // Délai entre les batches pour respecter les rate limits
                if (i + this.batchSize < tasks.length) {
                    console.log(`  Pause inter-batch: ${this.rateLimitDelay * 2}ms`);
                    await this.delay(this.rateLimitDelay * 2);
                }
            } catch (error) {
                console.error(`  ❌ Erreur fatale batch ${batchNumber}: ${error}`);
                failedTasks.push(...batch);
            }
        }

        // Retry des tâches échouées avec concurrence réduite
        if (failedTasks.length > 0) {
            console.log(`\n🔄 Récupération des échecs temporaires`);
            console.log(`${failedTasks.length} tâches en mode séquentiel`);
            const retryResults = await this.retryFailedTasks(failedTasks);
            results.push(...retryResults);
        }

        const totalDuration = Date.now() - startTime;
        const successRate = (results.filter(r => r.vector.length > 0).length / tasks.length * 100).toFixed(1);
        
        console.log(`\n✅ Traitement terminé`);
        console.log(`Résultats: ${results.filter(r => r.vector.length > 0).length}/${tasks.length} embeddings | Taux: ${successRate}% | Durée: ${totalDuration}ms`);
        console.log(`Performance: ${(tasks.length / (totalDuration / 1000)).toFixed(1)} embeddings/sec`);
        
        return results;
    }

    /**
     * Traitement concurrent d'un batch avec limitation de concurrence
     */
    private async processConcurrentBatch(tasks: EmbeddingTask[]): Promise<{
        successful: EmbeddingResult[];
        failed: EmbeddingTask[];
    }> {
        const successful: EmbeddingResult[] = [];
        const failed: EmbeddingTask[] = [];
        
        console.log(`  Lancement ${tasks.length} tâches parallèles`);
        
        // Utilisation de Promise.allSettled pour gérer les échecs individuels
        const promises = tasks.map(async (task, index) => {
            try {
                // Délai progressif pour éviter les pics de charge
                const staggerDelay = index * (this.rateLimitDelay / this.maxConcurrency);
                if (staggerDelay > 0) {
                    await this.delay(staggerDelay);
                }
                
                const vector = await getEmbeddingVector(task.text);
                return {
                    success: true,
                    result: {
                        id: task.id,
                        vector,
                        chunkIndex: task.chunkIndex
                    },
                    task
                };
            } catch (error) {
                return {
                    success: false,
                    error,
                    task
                };
            }
        });

        try {
            // Traitement avec limitation de concurrence
            const results = await this.limitConcurrency(promises, this.maxConcurrency);
            
            let processedCount = 0;
            results.forEach(result => {
                processedCount++;
                if (result.status === 'fulfilled') {
                    const value = result.value;
                    if (value.success) {
                        successful.push(value.result);
                    } else {
                        failed.push(value.task);
                        const textPreview = value.task.text.substring(0, 50) + '...';
                        console.log(`    Échec temporaire ${processedCount}/${tasks.length}: ${value.task.id} (${textPreview})`);
                    }
                } else {
                    console.error(`    Erreur inattendue ${processedCount}/${tasks.length}:`, result.reason);
                }
            });
            
            if (successful.length === tasks.length) {
                console.log(`  Toutes les tâches réussies`);
            } else if (successful.length > 0) {
                console.log(`  ${successful.length}/${tasks.length} tâches réussies, ${failed.length} échecs temporaires`);
            }
            
        } catch (error) {
            console.error(`  ❌ Erreur fatale traitement concurrent:`, error);
            // En cas d'erreur fatale, marquer toutes les tâches comme échouées
            failed.push(...tasks);
        }

        return { successful, failed };
    }

    /**
     * Retry des tâches échouées avec stratégie conservative
     */
    private async retryFailedTasks(failedTasks: EmbeddingTask[]): Promise<EmbeddingResult[]> {
        const results: EmbeddingResult[] = [];
        let recoveredCount = 0;
        
        console.log(`  Traitement séquentiel des échecs`);
        
        // Retry séquentiel pour les tâches échouées
        for (let taskIndex = 0; taskIndex < failedTasks.length; taskIndex++) {
            const task = failedTasks[taskIndex];
            let recovered = false;
            
            console.log(`  ${taskIndex + 1}/${failedTasks.length}: ${task.id}`);
            
            for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
                try {
                    const retryDelay = this.rateLimitDelay * attempt * 2;
                    console.log(`    Tentative ${attempt}/${this.retryAttempts} (délai: ${retryDelay}ms)`);
                    await this.delay(retryDelay);
                    
                    const vector = await getEmbeddingVector(task.text);
                    results.push({
                        id: task.id,
                        vector,
                        chunkIndex: task.chunkIndex
                    });
                    
                    recoveredCount++;
                    console.log(`    ✅ Récupéré`);
                    recovered = true;
                    break; // Succès, sortir de la boucle de retry
                    
                } catch (error) {
                    const textLength = task.text.length;
                    console.log(`    Échec tentative ${attempt}: longueur=${textLength} chars`);
                    
                    if (attempt === this.retryAttempts) {
                        results.push({
                            id: task.id,
                            vector: [],
                            chunkIndex: task.chunkIndex,
                            error: `Échec définitif après ${this.retryAttempts} tentatives: ${error}`
                        });
                        console.log(`    ❌ Abandon après ${this.retryAttempts} tentatives`);
                    }
                }
            }
        }
        
        const failureCount = failedTasks.length - recoveredCount;
        console.log(`  Bilan récupération: ${recoveredCount}/${failedTasks.length} réussies`);
        if (failureCount > 0) {
            console.log(`  ${failureCount} échecs définitifs`);
        }

        return results;
    }

    /**
     * Limitation du nombre de promesses concurrentes
     */
    private async limitConcurrency<T>(
        promises: Promise<T>[],
        limit: number
    ): Promise<PromiseSettledResult<T>[]> {
        const results: PromiseSettledResult<T>[] = [];
        
        for (let i = 0; i < promises.length; i += limit) {
            const batch = promises.slice(i, i + limit);
            const batchResults = await Promise.allSettled(batch);
            results.push(...batchResults);
        }
        
        return results;
    }

    /**
     * Utilitaire de délai
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Utilitaire pour tronquer le texte en préservant les mots
     */
    private truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) {
            return text;
        }
        
        // Tronquer en préservant les mots
        const truncated = text.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        
        if (lastSpace > maxLength * 0.8) { // Si l'espace est dans les 80% finaux
            return truncated.substring(0, lastSpace) + '...';
        }
        
        return truncated + '...';
    }

    /**
     * Génération d'embeddings pour un document avec chunks parallèles
     */
    async generateDocumentEmbeddings(
        legalIdentifier: string,
        content: string,
        chunks: string[]
    ): Promise<{
        contentVector: number[];
        chunkVectors: number[][];
        metadata: {
            totalChunks: number;
            successfulChunks: number;
            failedChunks: number;
            processingTime: number;
        };
    }> {
        const startTime = Date.now();
        
        console.log(`\n📄 Document: ${legalIdentifier}`);
        console.log(`Structure: 1 contenu principal + ${chunks.length} chunks | Taille: ${content.length} chars`);
        
        // Préparation des tâches d'embedding avec limitation de taille
        const tasks: EmbeddingTask[] = [
            // Embedding du contenu principal (tronqué si nécessaire)
            {
                id: `${legalIdentifier}_content`,
                text: this.truncateText(content, 4000) // Limite plus conservative
            },
            // Embeddings des chunks (avec limitation également)
            ...chunks.map((chunk, index) => ({
                id: `${legalIdentifier}_chunk_${index}`,
                text: this.truncateText(chunk, 4000), // Limitation plus conservative
                chunkIndex: index
            }))
        ];

        // Vérification des tailles après troncature
        const oversizedTasks = tasks.filter(t => t.text.length > 4000);
        if (oversizedTasks.length > 0) {
            console.log(`  ⚠️ ${oversizedTasks.length} tâches dépassent 4000 chars après troncature`);
        }

        try {
            // Traitement parallèle
            const results = await this.processEmbeddingsBatch(tasks);
            
            // Extraction des résultats
            const contentResult = results.find(r => r.id.endsWith('_content'));
            const chunkResults = results
                .filter(r => r.chunkIndex !== undefined)
                .sort((a, b) => (a.chunkIndex || 0) - (b.chunkIndex || 0));

            const contentVector = contentResult?.vector || [];
            const chunkVectors = chunkResults.map(r => r.vector).filter(v => v.length > 0);
            
            const processingTime = Date.now() - startTime;
            const failedChunks = chunks.length - chunkVectors.length;

            console.log(`Résultats ${legalIdentifier}:`);
            console.log(`  Contenu: ${contentVector.length > 0 ? 'OK' : 'ÉCHEC'} | Chunks: ${chunkVectors.length}/${chunks.length} | Temps: ${processingTime}ms`);
            if (failedChunks > 0) {
                console.log(`  ⚠️ ${failedChunks} chunks échoués`);
            }

            return {
                contentVector,
                chunkVectors,
                metadata: {
                    totalChunks: chunks.length,
                    successfulChunks: chunkVectors.length,
                    failedChunks,
                    processingTime
                }
            };
        } catch (error) {
            console.error(`❌ Erreur fatale pour ${legalIdentifier}:`, error);
            
            // Retour d'urgence avec embeddings vides
            return {
                contentVector: [],
                chunkVectors: [],
                metadata: {
                    totalChunks: chunks.length,
                    successfulChunks: 0,
                    failedChunks: chunks.length,
                    processingTime: Date.now() - startTime
                }
            };
        }
    }

    /**
     * Configuration optimisée selon l'environnement
     */
    static createOptimizedProcessor(environment: 'development' | 'production' | 'playground' = 'development'): ParallelEmbeddingProcessor {
        const configs = {
            development: {
                maxConcurrency: 3,
                rateLimitDelay: 300,
                retryAttempts: 2,
                batchSize: 10
            },
            playground: {
                maxConcurrency: 5,
                rateLimitDelay: 200,
                retryAttempts: 3,
                batchSize: 20
            },
            production: {
                maxConcurrency: 8,
                rateLimitDelay: 100,
                retryAttempts: 3,
                batchSize: 30
            }
        };

        return new ParallelEmbeddingProcessor(configs[environment]);
    }
}
