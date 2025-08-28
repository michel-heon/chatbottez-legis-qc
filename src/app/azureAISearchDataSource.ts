import { DataSource, Memory, OpenAIEmbeddings, RenderedPromptSection, Tokenizer } from "@microsoft/teams-ai";
import { TurnContext } from "botbuilder";
import { AzureKeyCredential, SearchClient } from "@azure/search-documents";

/**
 * Defines the Document Interface based on TTL metadata.
 */
export interface MyDocument {
    id?: string;
    legalIdentifier?: string | null;
    title?: string | null;
    description?: string | null;
    content?: string | null;
    contentVector?: number[] | null;
    legalStatus?: string | null;
    sourceUrl?: string | null;
    keywords?: string[] | null;
    documentType?: string | null;
}

/**
 * Options for creating a `AzureAISearchDataSource`.
 */
export interface AzureAISearchDataSourceOptions {
    /**
     * Name of the data source. This is the name that will be used to reference the data source in the prompt template.
     */
    name: string;

    /**
     * Name of the Azure AI Search index.
     */
    indexName: string;

    /**
     * Azure OpenAI API key.
     */
    azureOpenAIApiKey: string;

    /**
     * Azure OpenAI endpoint. This is used to generate embeddings for the user's input.
     */
    azureOpenAIEndpoint: string;

    /**
     * Azure OpenAI Embedding deployment. This is used to generate embeddings for the user's input.
     */
    azureOpenAIEmbeddingDeploymentName: string;

    /**
     * Azure AI Search API key.
     */
    azureAISearchApiKey: string;

    /**
     * Azure AI Search endpoint.
     */
    azureAISearchEndpoint: string;

    /**
     * Strictness level for document relevance filtering (1-5).
     * 1 = Very permissive, 5 = Very strict. Default is 3.
     * Higher values filter out more documents that are less relevant.
     */
    strictness?: number;
}

/**
 * A data source that searches through Azure AI search.
 */
export class AzureAISearchDataSource implements DataSource {
    /**
     * Name of the data source.
     */
    public readonly name: string;

    /**
     * Options for creating the data source.
     */
    private readonly options: AzureAISearchDataSourceOptions;

    /**
     * Azure AI Search client.
     */
    private readonly searchClient: SearchClient<MyDocument>;

    /**
     * Creates a new `AzureAISearchDataSource` instance.
     * @param {AzureAISearchDataSourceOptions} options Options for creating the data source.
     */
    public constructor(options: AzureAISearchDataSourceOptions) {
        this.name = options.name;
        this.options = options;
        this.searchClient = new SearchClient<MyDocument>(
            options.azureAISearchEndpoint,
            options.indexName,
            new AzureKeyCredential(options.azureAISearchApiKey),
            {}
        );
    }

    /**
     * Renders the data source as a string of text.
     * @remarks
     * The returned output should be a string of text that will be injected into the prompt at render time.
     * @param context Turn context for the current turn of conversation with the user.
     * @param memory An interface for accessing state values.
     * @param tokenizer Tokenizer to use when rendering the data source.
     * @param maxTokens Maximum number of tokens allowed to be rendered.
     * @returns A promise that resolves to the rendered data source.
     */
    public async renderData(context: TurnContext, memory: Memory, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<string>> {
        const query = memory.getValue("temp.input") as string;
        if(!query) {
            return { output: "", length: 0, tooLong: false };
        }
        
        const selectedFields = [
            "id",
            "legalIdentifier", 
            "title",
            "description",
            "content",
            "legalStatus",
            "sourceUrl",
            "keywords",
            "documentType"
        ];

        // hybrid search
        const queryVector: number[] = await this.getEmbeddingVector(query);
        
        // Detect if user is asking for a specific legal identifier
        const legalIdMatch = query.match(/\b([A-Z]-\d+(?:\.\d+)?)\b/);
        
        // Get strictness from options (default: 3)
        const strictness = this.options.strictness || 3;
        
        // Azure SDK normalizes all scores to 0-1, so we use the same threshold for both
        const threshold = this.getStrictnessThreshold(strictness);

        const searchOptions: any = {
            searchFields: ["title", "description", "content"],
            select: selectedFields as any,
            top: 20, // Limite explicite à 20 documents maximum
            // Utiliser la recherche hybride simple (texte + vecteur)
            queryType: "simple",
            searchMode: "any", // Mode permissif pour de meilleurs résultats
            minimumCoverage: 80, // Exige 80% de couverture des résultats pour la qualité
            // Strictness équivalent Azure AI Foundry (seuil de pertinence)
            scoringStatistics: "global", // Améliore la cohérence du scoring
            vectorSearchOptions: {
                queries: [
                    {
                        kind: "vector",
                        fields: ["contentVector"],
                        kNearestNeighborsCount: 20, // Documents vectoriels correspondant au top (recherche équilibrée)
                        vector: queryVector,
                        // Équivalent strictness pour la recherche vectorielle
                        threshold: threshold // Seuil de similarité vectorielle basé sur strictness
                    }
                ]
            },
        };

        console.log(`🎯 Strictness configurée: ${strictness} (seuil: ${threshold})`);
        
        // If specific legal ID mentioned, prioritize exact match
        if (legalIdMatch) {
            searchOptions.filter = `legalIdentifier eq '${legalIdMatch[1]}'`;
            console.log(`🎯 Filtre spécifique appliqué: ${legalIdMatch[1]}`);
        }
        
        const searchResults = await this.searchClient.search(query, searchOptions);

        if (!searchResults.results) {
            console.log('❌ Aucun résultat retourné par Azure Search');
            return { output: "", length: 0, tooLong: false };
        }

        // Count total results
        let totalResults = 0;
        const resultsArray = [];
        for await (const result of searchResults.results) {
            resultsArray.push(result);
            totalResults++;
        }
        
        console.log(`📊 Azure Search a retourné ${totalResults} documents bruts pour la requête: "${query}"`);

        // Debug: afficher la structure d'un résultat
        if (resultsArray.length > 0) {
            const firstResult = resultsArray[0];
            console.log('🔧 DEBUG Structure du premier résultat:');
            console.log('  - Keys:', Object.keys(firstResult));
            console.log('  - @search.score:', firstResult['@search.score']);
            console.log('  - score:', firstResult.score);
            if (firstResult.document) {
                console.log('  - document keys:', Object.keys(firstResult.document));
                console.log('  - document.legalIdentifier:', firstResult.document.legalIdentifier);
            }
        }

        // Apply strictness filtering
        const filteredResults = this.filterByStrictness(resultsArray, strictness);
        
        // Sort results: prioritize "en vigueur" and null status over "abrogée"
        const sortedResults = filteredResults.sort((a, b) => {
            const statusA = a.document.legalStatus;
            const statusB = b.document.legalStatus;
            
            // Priority order: "en vigueur" > null > "modifiée" > "abrogée"
            const getPriority = (status: string) => {
                if (status === "en vigueur") return 4;
                if (status === null || status === "null") return 3;
                if (status === "modifiée") return 2;
                if (status === "abrogée") return 1;
                return 0;
            };
            
            const priorityA = getPriority(statusA);
            const priorityB = getPriority(statusB);
            
            if (priorityA !== priorityB) {
                return priorityB - priorityA; // Descending priority
            }
            
            // If same status, sort by score (descending)
            return (b.score || 0) - (a.score || 0);
        });
        
        const filteredCount = sortedResults.length;
        
        console.log(`🎯 Après filtrage strictness (${strictness}): ${filteredCount} documents conservés (${totalResults - filteredCount} filtrés)`);
        console.log(`📊 Tri appliqué: lois en vigueur priorisées sur lois abrogées`);

        if (filteredCount === 0) {
            console.log(`⚠️  Strictness trop élevée (${strictness}) - aucun document suffisamment pertinent`);
            return { output: "AUCUNE_DONNEE_DISPONIBLE", length: 0, tooLong: false };
        }

        // Concatenate the documents string into a single document
        // until the maximum token limit is reached. This can be specified in the prompt template.
        let usedTokens = 0;
        let doc = "";
        let processedCount = 0;
        
        console.log(`📊 Limite de tokens pour données: ${maxTokens}`);
        
        for (const result of sortedResults) {
            // Limiter le contenu pour éviter la surcharge de tokens
            const fullContent = result.document.content || result.document.description || "";
            // Tronquer le contenu à 1000 caractères max pour économiser les tokens
            const documentContent = fullContent.length > 1000 ? 
                fullContent.substring(0, 1000) + "..." : fullContent;
            
            const keywords = Array.isArray(result.document.keywords) ? result.document.keywords.join(', ') : '';
            
            // Debug: Afficher clairement quel document est trouvé
            console.log(`🔍 Document ${processedCount + 1}: ${result.document.legalIdentifier} - Statut: "${result.document.legalStatus}"`);
            
            const documentData = `
Titre: ${result.document.title}
Identifiant: ${result.document.legalIdentifier}
Type: ${result.document.documentType}
Statut: ${result.document.legalStatus}
URL: ${result.document.sourceUrl}
Description: ${result.document.description}
Mots-clés: ${keywords}
Contenu: ${documentContent}
            `.trim();
            
            const formattedResult = this.formatDocument(documentData);
            const tokens = tokenizer.encode(formattedResult).length;
            
            console.log(`📏 Document ${processedCount + 1} tokens: ${tokens}, Total utilisé: ${usedTokens}`);

            if (usedTokens + tokens > maxTokens) {
                console.log(`⚠️  LIMITE ATTEINTE! Document ${processedCount + 1} tronqué (${tokens} tokens dépassent limite ${maxTokens})`);
                break;
            }

            doc += formattedResult;
            usedTokens += tokens;
            processedCount++;
        }
        
        console.log(`✅ Envoyé au LLM: ${processedCount} documents, ${usedTokens}/${maxTokens} tokens`);

        // SÉCURITÉ : Si aucun document envoyé, forcer une réponse sécurisée
        if (processedCount === 0) {
            console.log('🚨 SÉCURITÉ: Aucun document envoyé - forçage réponse sécurisée');
            return { 
                output: "AUCUNE_DONNEE_DISPONIBLE", 
                length: 0, 
                tooLong: false 
            };
        }

        return { output: doc, length: usedTokens, tooLong: usedTokens > maxTokens };
    }

    /**
     * Calculate strictness threshold for result filtering.
     * Maps AI Foundry strictness (1-5) to search score threshold
     * Note: Azure SDK normalizes scores to 0-1 range, typically 0.01-0.05 for good matches
     */
    private getStrictnessThreshold(strictness: number = 3): number {
        // Map strictness 1-5 to threshold for Azure SDK normalized scores (0-1)
        const thresholds = {
            1: 0.005, // Very permissive - accept most results
            2: 0.010, // Permissive - good for broad searches  
            3: 0.020, // Default (balanced) - reasonably relevant
            4: 0.030, // Strict - highly relevant only
            5: 0.040  // Very strict - only top matches
        };
        return thresholds[Math.max(1, Math.min(5, strictness))] || 0.020;
    }

    /**
     * Filter results based on strictness level
     */
    private filterByStrictness(results: any[], strictness: number = 3): any[] {
        const threshold = this.getStrictnessThreshold(strictness);
        
        return results.filter(result => {
            // Azure Search SDK peut avoir le score dans différents endroits
            const score = result['@search.score'] || result.score || (result.document && result.document['@search.score']) || 0;
            const isRelevant = score >= threshold;
            
            // Debug pour voir la structure
            if (results.indexOf(result) === 0) {
                console.log('� DEBUG Premier résultat structure:', {
                    '@search.score': result['@search.score'],
                    'score': result.score,
                    'document@search.score': result.document && result.document['@search.score'],
                    'finalScore': score,
                    'threshold': threshold
                });
            }
            
            if (!isRelevant) {
                const docId = (result.document && result.document.legalIdentifier) || result.legalIdentifier || 'UNKNOWN';
                console.log(`🔍 Document filtré par strictness: ${docId} (score: ${score.toFixed(3)} < ${threshold})`);
            }
            
            return isRelevant;
        });
    }

    /**
     * Formats the result string 
     * @param result 
     * @returns 
     */
    private formatDocument(result: string): string {
        return `<context>${result}</context>`;
    }

    /**
     * Generate embeddings for the user's input.
     * @param {string} text - The user's input.
     * @returns {Promise<number[]>} The embedding vector for the user's input.
     */
    private async getEmbeddingVector(text: string): Promise<number[]> {
        const embeddings = new OpenAIEmbeddings({
            azureApiKey: this.options.azureOpenAIApiKey,
            azureEndpoint: this.options.azureOpenAIEndpoint,
            azureDeployment: this.options.azureOpenAIEmbeddingDeploymentName,
        });

        const result = await embeddings.createEmbeddings(this.options.azureOpenAIEmbeddingDeploymentName, text);

        if (result.status !== "success" || !result.output) {
            throw new Error(`Failed to generate embeddings for description: ${text}`);
        }

        return result.output[0];
    }
}