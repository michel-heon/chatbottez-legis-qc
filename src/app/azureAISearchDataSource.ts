import { AzureKeyCredential, SearchClient } from "@azure/search-documents";
import { AzureOpenAI } from "openai";

// Debug helper function
const debugLog = (tag: string, message: string) => {
  if (process.env.DEBUG === 'true') {
    console.log(`[${tag}] ${message}`);
  }
};

/**
 * Defines the Document Interface.
 */
export interface MyDocument {
    chunk_id?: string;
    parent_id?: string | null;
    title?: string | null;
    content?: string | null;
    url?: string | null;
    filepath?: string | null;
    contentVector?: number[] | null;
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
     * Strictness level for filtering search documents based on similarity scores.
     * Range: 1-5 (1 = minimal filtering, 5 = aggressive filtering)
     * Default: 3 (recommended by Microsoft)
     */
    strictness?: number;

    /**
     * Number of documents to retrieve from the search index.
     * Range: 3-20
     * Default: 10 (balance between context and performance)
     */
    retrievedDocuments?: number;

    /**
     * Whether to limit responses to your data content only.
     * When true, the model will only use information from your indexed data.
     * Default: true (recommended for RAG scenarios)
     */
    limitToDataContent?: boolean;
}

/**
 * A data source that searches through Azure AI search.
 */
export class AzureAISearchDataSource {
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
     * Strictness level for filtering search results (1-5).
     */
    private readonly strictness: number;

    /**
     * Number of documents to retrieve (3-20).
     */
    private readonly retrievedDocuments: number;

    /**
     * Whether to limit responses to data content only.
     */
    private readonly limitToDataContent: boolean;

    /**
     * Creates a new `AzureAISearchDataSource` instance.
     * @param {AzureAISearchDataSourceOptions} options Options for creating the data source.
     */
    public constructor(options: AzureAISearchDataSourceOptions) {
        this.name = options.name;
        this.options = options;
        
        // Apply Microsoft best practices defaults
        this.strictness = Math.max(1, Math.min(5, options.strictness ?? 3));
        this.retrievedDocuments = Math.max(3, Math.min(20, options.retrievedDocuments ?? 10));
        this.limitToDataContent = options.limitToDataContent ?? true;
        
        debugLog('CONFIG', `🔧 AzureAISearchDataSource configuration:`);
        debugLog('CONFIG', `   📊 Strictness: ${this.strictness} (1=minimal, 5=aggressive)`);
        debugLog('CONFIG', `   📄 Retrieved documents: ${this.retrievedDocuments}`);
        debugLog('CONFIG', `   🔒 Limit to data content: ${this.limitToDataContent}`);
        
        this.searchClient = new SearchClient<MyDocument>(
            options.azureAISearchEndpoint,
            options.indexName,
            new AzureKeyCredential(options.azureAISearchApiKey),
            {}
        );
    }

    /**
     * Renders search results into a formatted context string for use in prompts.
     * @param query The original search query
     * @returns Rendered context
     */
    public async renderContext(query: string): Promise<string> {
        debugLog('SEARCH', `🔍 Starting renderContext for query: "${query}"`);
        
        if(!query) {
            debugLog('SEARCH', `⚠️ Empty query, returning empty context`);
            return "";
        }
        
        debugLog('SEARCH', `🏗️ Using index: ${this.options.indexName}`);
        debugLog('SEARCH', `🌐 Endpoint: ${this.options.azureAISearchEndpoint}`);
        debugLog('SEARCH', `🎯 Parameters - Strictness: ${this.strictness}, Documents: ${this.retrievedDocuments}`);
        
        const selectedFields = [
            "chunk_id",
            "title",
            "content",
        ];

        debugLog('SEARCH', `📝 Selected fields: ${selectedFields.join(', ')}`);
        
        // Hybrid search with vector embeddings
        debugLog('SEARCH', `🧮 Generating embeddings for query...`);
        const queryVector: number[] = await this.getEmbeddingVector(query);
        debugLog('SEARCH', `✅ Embeddings generated, vector length: ${queryVector.length}`);
        
        // Calculate k-nearest neighbors based on strictness and document count
        const kNearestNeighbors = Math.min(this.retrievedDocuments, Math.ceil(this.retrievedDocuments * (6 - this.strictness) / 5));
        
        debugLog('SEARCH', `🚀 Executing hybrid search query with k=${kNearestNeighbors}...`);
        const searchResults = await this.searchClient.search(query, {
            searchFields: ["title", "content"],
            select: selectedFields as any,
            top: this.retrievedDocuments,
            vectorSearchOptions: {
                queries: [
                    {
                        kind: "vector",
                        fields: ["contentVector"],
                        kNearestNeighborsCount: kNearestNeighbors,
                        // The query vector is the embedding of the user's input
                        vector: queryVector
                    }
                ]
            },
        });

        debugLog('SEARCH', `📊 Search completed`);

        if (!searchResults.results) {
            debugLog('SEARCH', `❌ No search results found`);
            return this.limitToDataContent ? "Aucun document pertinent trouvé dans la base de connaissances." : "";
        }

        const filteredResults = await this.applyStrictnessFiltering(searchResults.results, query);
        
        if (filteredResults.length === 0) {
            debugLog('SEARCH', `🚫 All results filtered out by strictness level ${this.strictness}`);
            return this.limitToDataContent ? "Aucun document suffisamment pertinent trouvé pour répondre à votre question." : "";
        }

        let doc = "";
        let resultCount = 0;
        debugLog('SEARCH', `📋 Processing ${filteredResults.length} filtered results...`);
        
        for (const result of filteredResults) {
            resultCount++;
            debugLog('SEARCH', `📄 Result ${resultCount}: title="${result.document.title}", content_length=${result.document.content?.length || 0}, score=${result.score}`);
            const formattedResult = this.formatDocument(result.document.content, result.document.title);
            doc += formattedResult;
        }

        // Estimation approximative des tokens (1 token ≈ 4 caractères pour le français)
        const estimatedTokens = Math.round(doc.length / 4);
        
        debugLog('SEARCH', `✅ Context building completed:`);
        debugLog('SEARCH', `   📊 Filtered results: ${resultCount}/${this.retrievedDocuments}`);
        debugLog('SEARCH', `   📏 Context length: ${doc.length.toLocaleString()} characters`);
        debugLog('SEARCH', `   🎯 Estimated tokens: ~${estimatedTokens.toLocaleString()}`);
        
        // Vérification de la limite de tokens (approximative)
        if (estimatedTokens > 100000) {
            debugLog('SEARCH', `⚠️  WARNING: Context size (${estimatedTokens} tokens) may exceed model limits`);
        }

        return doc;
    }

    /**
     * Formats a document with its citation for inclusion in context.
     * @param content The document content
     * @param citation The source citation
     * @returns Formatted document string
     * @private
     */
    private formatDocument(content: string, citation: string): string {
        return `<context source="${citation}">\n${content}\n</context>`;
    }

    /**
     * Applies strictness filtering to search results based on similarity scores.
     * Implements Microsoft's best practices for Azure OpenAI On Your Data.
     * @param results The search results to filter
     * @param query The original search query
     * @returns Filtered results based on strictness level
     * @private
     */
    private async applyStrictnessFiltering(results: any, query: string): Promise<any[]> {
        const resultsArray = [];
        for await (const result of results) {
            resultsArray.push(result);
        }

        debugLog('STRICTNESS', `📊 Applying strictness level ${this.strictness} to ${resultsArray.length} results`);
        
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

        debugLog('STRICTNESS', `🎯 Calculated threshold: ${threshold.toFixed(4)} (keeping ${keepPercentage * 100}% of results)`);

        // Filter results based on threshold
        const filteredResults = resultsArray.filter(result => {
            const score = result.score || 0;
            const keep = score >= threshold;
            
            if (!keep) {
                debugLog('STRICTNESS', `🚫 Filtered out result with score ${score.toFixed(4)} (below threshold ${threshold.toFixed(4)})`);
            }
            
            return keep;
        });

        debugLog('STRICTNESS', `✅ Strictness filtering completed: ${filteredResults.length}/${resultsArray.length} results kept`);
        return filteredResults;
    }
    /**
     * Generate embeddings for the user's input.
     * @param {string} text - The user's input.
     * @returns {Promise<number[]>} The embedding vector for the user's input.
     */
    private async getEmbeddingVector(text: string): Promise<number[]> {
        debugLog('EMBEDDING', `🧮 Generating embeddings for text: "${text.substring(0, 100)}..."`);
        debugLog('EMBEDDING', `🌐 Using endpoint: ${this.options.azureOpenAIEndpoint}`);
        debugLog('EMBEDDING', `🤖 Using model: ${this.options.azureOpenAIEmbeddingDeploymentName}`);
        
        const client = new AzureOpenAI({
            apiKey: this.options.azureOpenAIApiKey,
            endpoint: this.options.azureOpenAIEndpoint,
            apiVersion: "2024-04-01-preview",
        });
        
        const result = await client.embeddings.create({
            input: text,
            model: this.options.azureOpenAIEmbeddingDeploymentName,
        });

        debugLog('EMBEDDING', `✅ Embeddings generated successfully. Vector dimensions: ${result.data?.[0]?.embedding?.length || 0}`);


        if (!result.data || result.data.length === 0) {
            throw new Error(`Failed to generate embeddings for description: ${text}`);
        }

        return result.data[0].embedding;
    }
}