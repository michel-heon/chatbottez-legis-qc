import { DataSource, Memory, OpenAIEmbeddings, RenderedPromptSection, Tokenizer } from "@microsoft/teams-ai";
import { TurnContext } from "botbuilder";
import { AzureKeyCredential, SearchClient } from "@azure/search-documents";

/**
 * Defines the Document Interface.
 * Generated dynamically from Azure Search index schema.
 */
export interface MyDocument {
    // GENERATED_FIELDS_START
    // Dynamic interface fields generated from Azure Search index
    // This section will be replaced with actual field definitions
    // GENERATED_FIELDS_END
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
        
        // GENERATED_SELECT_FIELDS_START
        // Dynamic selected fields based on Azure Search index
        const selectedFields = [
            // GENERATED_SELECT_FIELDS_PLACEHOLDER
        ];
        // GENERATED_SELECT_FIELDS_END

        // hybrid search
        const queryVector: number[] = await this.getEmbeddingVector(query);
        const searchResults = await this.searchClient.search(query, {
            // GENERATED_SEARCH_CONFIG_START
            searchFields: [/* GENERATED_SEARCHABLE_FIELDS_PLACEHOLDER */],
            select: selectedFields as any,
            vectorSearchOptions: {
                queries: [
                    {
                        kind: "vector",
                        fields: [/* GENERATED_VECTOR_FIELDS_PLACEHOLDER */],
                        kNearestNeighborsCount: 2,
                        // The query vector is the embedding of the user's input
                        vector: queryVector
                    }
                ]
            },
            // GENERATED_SEARCH_CONFIG_END
        });

        if (!searchResults.results) {
            return { output: "", length: 0, tooLong: false };
        }

        // Concatenate the documents string into a single document
        // until the maximum token limit is reached. This can be specified in the prompt template.
        let usedTokens = 0;
        let doc = "";
        for await (const result of searchResults.results) {
            // GENERATED_FORMAT_DOCUMENT_START
            // Dynamic document formatting based on Azure Search index fields
            const formattedResult = this.formatDocument("/* GENERATED_DOCUMENT_FORMAT_PLACEHOLDER */");
            // GENERATED_FORMAT_DOCUMENT_END
            const tokens = tokenizer.encode(formattedResult).length;

            if (usedTokens + tokens > maxTokens) {
                break;
            }

            doc += formattedResult;
            usedTokens += tokens;
        }

        return { output: doc, length: usedTokens, tooLong: usedTokens > maxTokens };
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