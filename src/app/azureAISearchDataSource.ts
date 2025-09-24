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
        
        const selectedFields = [
            "chunk_id",
            "title",
            "content",
        ];

        debugLog('SEARCH', `📝 Selected fields: ${selectedFields.join(', ')}`);
        
        // hybrid search
        debugLog('SEARCH', `🧮 Generating embeddings for query...`);
        const queryVector: number[] = await this.getEmbeddingVector(query);
        debugLog('SEARCH', `✅ Embeddings generated, vector length: ${queryVector.length}`);
        
        debugLog('SEARCH', `🚀 Executing hybrid search query...`);
        const searchResults = await this.searchClient.search(query, {
            searchFields: ["title", "content"],
            select: selectedFields as any,
            top: 10, // Limite à 10 résultats pour réduire la taille du contexte
            vectorSearchOptions: {
                queries: [
                    {
                        kind: "vector",
                        fields: ["contentVector"],
                        kNearestNeighborsCount: 5, // Réduit à 5 pour l'efficacité
                        // The query vector is the embedding of the user's input
                        vector: queryVector
                    }
                ]
            },
        });

        debugLog('SEARCH', `📊 Search completed`);

        if (!searchResults.results) {
            debugLog('SEARCH', `❌ No search results found`);
            return "";
        }

        let doc = "";
        let resultCount = 0;
        debugLog('SEARCH', `📋 Processing search results...`);
        
        for await (const result of searchResults.results) {
            resultCount++;
            debugLog('SEARCH', `📄 Result ${resultCount}: title="${result.document.title}", content_length=${result.document.content?.length || 0}`);
            const formattedResult = this.formatDocument(result.document.content, result.document.title);
            doc += formattedResult;
        }

        // Estimation approximative des tokens (1 token ≈ 4 caractères pour le français)
        const estimatedTokens = Math.round(doc.length / 4);
        
        debugLog('SEARCH', `✅ Context building completed:`);
        debugLog('SEARCH', `   📊 Total results: ${resultCount}`);
        debugLog('SEARCH', `   📏 Context length: ${doc.length.toLocaleString()} characters`);
        debugLog('SEARCH', `   🎯 Estimated tokens: ~${estimatedTokens.toLocaleString()}`);
        
        // Vérification de la limite de tokens (approximative)
        if (estimatedTokens > 100000) {
            debugLog('SEARCH', `⚠️  WARNING: Context size (${estimatedTokens} tokens) may exceed model limits`);
        }

        return doc
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