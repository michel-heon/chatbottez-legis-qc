/**
 * Defines the utility methods.
 */
import {
    SearchIndexClient,
    SearchIndex,
    KnownAnalyzerNames,
    SearchClient,
    IndexDocumentsResult
} from "@azure/search-documents";
import { MyDocument } from "../app/azureAISearchDataSource";
import { OpenAIEmbeddings } from "@microsoft/teams-ai";

/**
 * A wrapper for setTimeout that resolves a promise after timeInMs milliseconds.
 * @param {number} timeInMs - The number of milliseconds to be delayed.
 * @returns {Promise<void>} Promise that is resolved after timeInMs
 */
export function delay(timeInMs: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeInMs));
}

/**
 * Deletes the index with the given name
 * @param {SearchIndexClient} client - The search index client
 * @param {string} name - The name of the index
 * @returns {Promise<void>} A promise that resolves when the index is deleted
 */
export function deleteIndex(client: SearchIndexClient, name: string): Promise<void> {
    return client.deleteIndex(name);
}

/**
 * Adds or updates the given documents in the index
 * @param {SearchClient<Restaurant>} client - The search index client
 * @param {Restaurant[]} documents - The documents to be added or updated
 * @returns {Promise<IndexDocumentsResult>} The result of the operation
 */
export async function upsertDocuments(
    client: SearchClient<MyDocument>,
    documents: MyDocument[]
): Promise<IndexDocumentsResult> {
    return await client.mergeOrUploadDocuments(documents);
}

/**
 * Creates the index with the given name
 * Generalized for any Azure Search index schema
 * @param {SearchIndexClient} client - The search index client
 * @param {string} name - The name of the index
 */
export async function createIndexIfNotExists(client: SearchIndexClient, name: string): Promise<void> {
    const MyDocumentIndex: SearchIndex = {
        name,
        // GENERATED_INDEX_FIELDS_START
        // Dynamic index fields definition based on Azure Search schema
        fields: [
            // GENERATED_INDEX_FIELDS_PLACEHOLDER
        ],
        // GENERATED_INDEX_FIELDS_END
        corsOptions: {
            // for browser tests
            allowedOrigins: ["*"]
        },
        // GENERATED_VECTOR_CONFIG_START
        // Dynamic vector search configuration based on Azure Search schema
        vectorSearch: {
            algorithms: [{ name: "vector-search-algorithm", kind: "hnsw" }],
            profiles: [
                {
                    name: "my-vector-config",
                    algorithmConfigurationName: "vector-search-algorithm"
                }
            ]
        }
        // GENERATED_VECTOR_CONFIG_END
    };

    await client.createOrUpdateIndex(MyDocumentIndex);
}

/**
 *
 * @param {string} text - The text for which to generate the embedding vector.
 * @returns {Promise<number[]>} A promise that resolves to the embedding vector.
 */
export async function getEmbeddingVector(text: string): Promise<number[]> {
    const embeddings = new OpenAIEmbeddings({
        azureApiKey: process.env.SECRET_AZURE_OPENAI_API_KEY!,
        azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
        azureDeployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME!,
    });

    const result = await embeddings.createEmbeddings( process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME!, text);

    if (result.status !== "success" || !result.output) {
        throw new Error(`Failed to generate embeddings for description: ${text}`);
    }

    return result.output[0];
}