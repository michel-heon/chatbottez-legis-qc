import { AzureKeyCredential, SearchClient } from "@azure/search-documents";
import { AzureOpenAI } from "openai";

// Debug helper function
const debugLog = (tag, message) => {
  if (process.env.DEBUG === 'true') {
    console.log(`[${tag}] ${message}`);
  }
};

/**
 * A data source that searches through Azure AI Search with vector embeddings.
 * Implements RAG (Retrieval-Augmented Generation) pattern for legal Quebec documents.
 */
export class AzureAISearchDataSource {
    /**
     * Creates a new AzureAISearchDataSource instance.
     * @param {Object} options - Configuration options
     * @param {string} options.name - Name of the data source
     * @param {string} options.indexName - Azure AI Search index name
     * @param {string} options.azureOpenAIApiKey - Azure OpenAI API key
     * @param {string} options.azureOpenAIEndpoint - Azure OpenAI endpoint
     * @param {string} options.azureOpenAIEmbeddingDeploymentName - Embedding deployment name
     * @param {string} options.azureAISearchApiKey - Azure AI Search API key
     * @param {string} options.azureAISearchEndpoint - Azure AI Search endpoint
     * @param {number} [options.strictness=3] - Strictness level (1-5, higher = more strict filtering)
     * @param {number} [options.retrievedDocuments=10] - Number of documents to retrieve (3-20)
     * @param {boolean} [options.limitToDataContent=true] - Limit responses to indexed data only
     */
    constructor(options) {
        this.name = options.name;
        this.options = options;

        // Apply Microsoft best practices defaults
        this.strictness = Math.max(1, Math.min(5, options.strictness ?? 3));
        this.retrievedDocuments = Math.max(3, Math.min(20, options.retrievedDocuments ?? 10));
        this.limitToDataContent = options.limitToDataContent ?? true;

        debugLog('CONFIG', `[CONFIG] AzureAISearchDataSource configuration:`);
        debugLog('CONFIG', `   [STRICTNESS] ${this.strictness} (1=minimal, 5=aggressive)`);
        debugLog('CONFIG', `   [DOCUMENTS] Retrieved documents: ${this.retrievedDocuments}`);
        debugLog('CONFIG', `   [LIMIT] Limit to data content: ${this.limitToDataContent}`);

        this.searchClient = new SearchClient(
            options.azureAISearchEndpoint,
            options.indexName,
            new AzureKeyCredential(options.azureAISearchApiKey),
            {}
        );
    }

    /**
     * Renders search results into a formatted context string for use in prompts.
     * @param {string} query - The search query
     * @returns {Promise<string>} Rendered context with XML tags
     */
    async renderContext(query) {
        debugLog('SEARCH', `[START] Starting renderContext for query: "${query}"`);

        if (!query) {
            debugLog('SEARCH', `[EMPTY] Empty query, returning empty context`);
            return "";
        }

        debugLog('SEARCH', `[INDEX] Using index: ${this.options.indexName}`);
        debugLog('SEARCH', `[ENDPOINT] ${this.options.azureAISearchEndpoint}`);
        debugLog('SEARCH', `[PARAMS] Strictness: ${this.strictness}, Documents: ${this.retrievedDocuments}`);

        const selectedFields = [
            "chunk_id",
            "title",
            "content",
            "url",      // URL du document (lien cliquable)
            "filepath", // Chemin du fichier source
        ];

        debugLog('SEARCH', `[FIELDS] Selected fields: ${selectedFields.join(', ')}`);

        // Hybrid search with vector embeddings
        debugLog('SEARCH', `[EMBEDDING] Generating embeddings for query...`);
        const queryVector = await this.getEmbeddingVector(query);
        debugLog('SEARCH', `[EMBEDDING] Embeddings generated, vector length: ${queryVector.length}`);

        // Calculate k-nearest neighbors based on strictness and document count
        const kNearestNeighbors = Math.min(this.retrievedDocuments, Math.ceil(this.retrievedDocuments * (6 - this.strictness) / 5));

        debugLog('SEARCH', `[EXECUTE] Executing hybrid search query with k=${kNearestNeighbors}...`);
        const searchResults = await this.searchClient.search(query, {
            searchFields: ["title", "content"],
            select: selectedFields,
            top: this.retrievedDocuments,
            vectorSearchOptions: {
                queries: [
                    {
                        kind: "vector",
                        fields: ["contentVector"],
                        kNearestNeighborsCount: kNearestNeighbors,
                        vector: queryVector
                    }
                ]
            },
        });

        debugLog('SEARCH', `[COMPLETE] Search completed`);

        if (!searchResults.results) {
            debugLog('SEARCH', `[EMPTY] No search results found`);
            return this.limitToDataContent ? "Aucun document pertinent trouvé dans la base de connaissances." : "";
        }

        const filteredResults = await this.applyStrictnessFiltering(searchResults.results, query);

        if (filteredResults.length === 0) {
            debugLog('SEARCH', `[FILTERED] All results filtered out by strictness level ${this.strictness}`);
            return {
                context: this.limitToDataContent ? "Aucun document suffisamment pertinent trouvé pour répondre à votre question." : "",
                citations: []
            };
        }

        let doc = "";
        let resultCount = 0;
        const citations = []; // Store citations for Microsoft Teams format
        debugLog('SEARCH', `[PROCESS] Processing ${filteredResults.length} filtered results...`);

        for (const result of filteredResults) {
            resultCount++;
            debugLog('SEARCH', `[RESULT] ${resultCount}: title="${result.document.title}", content_length=${result.document.content?.length || 0}, score=${result.score}`);
            const formattedResult = this.formatDocument(result.document.content, result.document.title);
            doc += formattedResult;
            
            // Build citation object for Teams display (Microsoft best practice)
            // Use 'url' field from the index schema
            const documentUrl = result.document.url || null;
            
            citations.push({
                title: result.document.title || `Document ${resultCount}`,
                url: documentUrl, // URL from Azure Storage
                score: result.score
            });
            
            if (documentUrl) {
                debugLog('SEARCH', `[CITATION] ${resultCount}: "${result.document.title}" - URL: ${documentUrl}`);
            } else {
                debugLog('SEARCH', `[CITATION] ${resultCount}: "${result.document.title}" - No URL available`);
            }
        }

        // Estimation approximative des tokens (1 token ≈ 4 caractères pour le français)
        const estimatedTokens = Math.round(doc.length / 4);

        debugLog('SEARCH', `[SUMMARY] Context building completed:`);
        debugLog('SEARCH', `   [FILTERED] Filtered results: ${resultCount}/${this.retrievedDocuments}`);
        debugLog('SEARCH', `   [LENGTH] Context length: ${doc.length.toLocaleString()} characters`);
        debugLog('SEARCH', `   [TOKENS] Estimated tokens: ~${estimatedTokens.toLocaleString()}`);
        debugLog('SEARCH', `   [CITATIONS] ${citations.length} citations collected`);

        // Vérification de la limite de tokens (approximative)
        if (estimatedTokens > 100000) {
            debugLog('SEARCH', `[WARNING] Context size (${estimatedTokens} tokens) may exceed model limits`);
        }

        return { context: doc, citations };
    }

    /**
     * Formats a document with its citation for inclusion in context.
     * @param {string} content - The document content
     * @param {string} citation - The source citation
     * @returns {string} Formatted document string with XML tags
     * @private
     */
    formatDocument(content, citation) {
        return `<context source="${citation}">\n${content}\n</context>`;
    }

    /**
     * Applies strictness filtering to search results based on similarity scores.
     * Implements Microsoft's best practices for Azure OpenAI On Your Data.
     * @param {AsyncIterable} results - The search results to filter
     * @param {string} query - The original search query
     * @returns {Promise<Array>} Filtered results based on strictness level
     * @private
     */
    async applyStrictnessFiltering(results, query) {
        const resultsArray = [];
        for await (const result of results) {
            resultsArray.push(result);
        }

        debugLog('STRICTNESS', `[APPLY] Applying strictness level ${this.strictness} to ${resultsArray.length} results`);

        if (resultsArray.length === 0) {
            return resultsArray;
        }

        // Calculate dynamic threshold based on strictness level
        // Strictness 1: Very permissive (keep 95% of results)
        // Strictness 3: Balanced (keep 70% of results) - Microsoft default
        // Strictness 5: Very strict (keep 40% of results)
        const keepPercentages = [0.95, 0.85, 0.70, 0.55, 0.40]; // Index 0-4 for strictness 1-5
        const keepPercentage = keepPercentages[this.strictness - 1];

        // Calculate minimum score threshold
        const scores = resultsArray
            .map(r => r.score || 0)
            .filter(score => score > 0)
            .sort((a, b) => b - a); // Descending order

        let threshold = 0;
        if (scores.length > 0) {
            const keepCount = Math.max(1, Math.ceil(scores.length * keepPercentage));
            threshold = scores[keepCount - 1] || 0;
        }

        debugLog('STRICTNESS', `[THRESHOLD] Calculated threshold: ${threshold.toFixed(4)} (keeping ${keepPercentage * 100}% of results)`);

        // Filter results based on threshold
        const filteredResults = resultsArray.filter(result => {
            const score = result.score || 0;
            const keep = score >= threshold;

            if (!keep) {
                debugLog('STRICTNESS', `[FILTERED] Filtered out result with score ${score.toFixed(4)} (below threshold ${threshold.toFixed(4)})`);
            }

            return keep;
        });

        debugLog('STRICTNESS', `[COMPLETE] Strictness filtering completed: ${filteredResults.length}/${resultsArray.length} results kept`);
        return filteredResults;
    }

    /**
     * Generate embeddings for the user's input using Azure OpenAI.
     * @param {string} text - The user's input
     * @returns {Promise<number[]>} The embedding vector for the user's input
     * @private
     */
    async getEmbeddingVector(text) {
        debugLog('EMBEDDING', `[START] Generating embeddings for text: "${text.substring(0, 100)}..."`);
        debugLog('EMBEDDING', `[ENDPOINT] Using endpoint: ${this.options.azureOpenAIEndpoint}`);
        debugLog('EMBEDDING', `[MODEL] Using model: ${this.options.azureOpenAIEmbeddingDeploymentName}`);

        const client = new AzureOpenAI({
            apiKey: this.options.azureOpenAIApiKey,
            endpoint: this.options.azureOpenAIEndpoint,
            apiVersion: "2024-04-01-preview",
        });

        const result = await client.embeddings.create({
            input: text,
            model: this.options.azureOpenAIEmbeddingDeploymentName,
        });

        debugLog('EMBEDDING', `[COMPLETE] Embeddings generated successfully. Vector dimensions: ${result.data?.[0]?.embedding?.length || 0}`);

        if (!result.data || result.data.length === 0) {
            throw new Error(`Failed to generate embeddings for description: ${text}`);
        }

        return result.data[0].embedding;
    }
}
