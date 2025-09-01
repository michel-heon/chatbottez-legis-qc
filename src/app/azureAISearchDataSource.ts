/**
 * ⚠️ ATTENTION - FICHIER GÉNÉRÉ AUTOMATIQUEMENT ⚠️
 * 
 * 🚫 NE PAS ÉDITER CE FICHIER MANUELLEMENT
 * 
 * Ce fichier est généré automatiquement à partir de l'index Azure Search.
 * Toute modification manuelle sera ÉCRASÉE lors de la prochaine génération.
 * 
 * 🔄 Pour modifier ce fichier :
 * 1. Modifiez les templates dans : src/main/resources/teams-src/
 * 2. Ou modifiez la structure de l'index Azure Search : legis-qc-index-full-03
 * 3. Puis exécutez : make azure-config-generate
 * 
 * 📊 Généré depuis l'index : legis-qc-index-full-03
 * 📅 Date de génération : 2025-09-01 12:09:32
 * 📋 Nombre de champs : 17
 * 
 * 🎯 Ce fichier contient :
 * - Interface TypeScript MyDocument avec tous les champs de l'index
 * - Configuration du client Azure Search
 * - Logique de recherche hybride (texte + vecteur)
 * - Formatage des résultats de recherche
 */

import { DataSource, Memory, OpenAIEmbeddings, RenderedPromptSection, Tokenizer } from "@microsoft/teams-ai";
import { TurnContext } from "botbuilder";
import { AzureKeyCredential, SearchClient } from "@azure/search-documents";

/**
 * Defines the Document Interface.
 * Generated dynamically from Azure Search index schema.
 */
export interface MyDocument {
    // GENERATED_FIELDS_START
    id?: string;
    format?: string;
    legalIdentifier?: string;
    sourceUrl?: string;
    title?: string;
    abrogatedBy?: string;
    downloadStatus?: string;
    enrichedAt?: any;
    enrichmentMethod?: string;
    legalStatus?: string;
    description?: string;
    isReplacedBy?: boolean;
    keywords?: any;
    documentType?: string;
    legalType?: string;
    content?: string;
    contentVector?: number[];
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
                        "title",
            "content"
        ];
        // GENERATED_SELECT_FIELDS_END

        // hybrid search
        const queryVector: number[] = await this.getEmbeddingVector(query);
        const searchResults = await this.searchClient.search(query, {
            // GENERATED_SEARCH_CONFIG_START
            searchFields: ["title", "description", "content"],
            select: selectedFields as any,
            vectorSearchOptions: {
                queries: [
                    {
                        kind: "vector",
                        fields: ["contentVector"],
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
            const formattedResult = this.formatDocument(`${result.document.legalIdentifier}\n Citation: ${result.document.title}.`);
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