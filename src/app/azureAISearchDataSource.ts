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
        
        const searchOptions: any = {
            searchFields: ["title", "description", "content"],
            select: selectedFields as any,
            top: 10, // Limite explicite à 10 documents maximum
            vectorSearchOptions: {
                queries: [
                    {
                        kind: "vector",
                        fields: ["contentVector"],
                        kNearestNeighborsCount: 5, // Augmenté pour supporter plus de documents vectoriels
                        vector: queryVector
                    }
                ]
            },
        };
        
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
        
        console.log(`📊 Azure Search a retourné ${totalResults} documents pour la requête: "${query}"`);

        // Concatenate the documents string into a single document
        // until the maximum token limit is reached. This can be specified in the prompt template.
        let usedTokens = 0;
        let doc = "";
        let processedCount = 0;
        
        console.log(`📊 Limite de tokens pour données: ${maxTokens}`);
        
        for (const result of resultsArray) {
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