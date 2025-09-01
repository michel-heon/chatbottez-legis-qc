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
 * - Fonctions utilitaires pour Azure Search
 * - Configuration des champs de recherche
 * - Helpers pour la manipulation des documents
 * - Validation et transformation des données
 */

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
                        {
                type: "Edm.String",
                name: "id",
                key: true,
                filterable: true,
                sortable: true
            },
            {
                type: "Edm.String",
                name: "format"
            },
            {
                type: "Edm.String",
                name: "legalIdentifier",
                searchable: true,
                filterable: true,
                analyzerName: KnownAnalyzerNames.EnLucene
            },
            {
                type: "Edm.String",
                name: "sourceUrl"
            },
            {
                type: "Edm.String",
                name: "title",
                searchable: true,
                analyzerName: KnownAnalyzerNames.EnLucene
            },
            {
                type: "Edm.String",
                name: "abrogatedBy",
                searchable: true,
                analyzerName: KnownAnalyzerNames.EnLucene
            },
            {
                type: "Edm.String",
                name: "downloadStatus"
            },
            {
                type: "Edm.DateTimeOffset",
                name: "enrichedAt"
            },
            {
                type: "Edm.String",
                name: "enrichmentMethod"
            },
            {
                type: "Edm.String",
                name: "legalStatus",
                searchable: true,
                filterable: true,
                analyzerName: KnownAnalyzerNames.EnLucene
            },
            {
                type: "Edm.String",
                name: "description",
                searchable: true,
                analyzerName: KnownAnalyzerNames.EnLucene
            },
            {
                type: "Edm.Boolean",
                name: "isReplacedBy"
            },
            {
                type: "Collection(Edm.String)",
                name: "keywords",
                searchable: true,
                filterable: true
            },
            {
                type: "Edm.String",
                name: "documentType",
                searchable: true,
                filterable: true,
                analyzerName: KnownAnalyzerNames.EnLucene
            },
            {
                type: "Edm.String",
                name: "legalType",
                searchable: true,
                filterable: true,
                analyzerName: KnownAnalyzerNames.EnLucene
            },
            {
                type: "Edm.String",
                name: "content",
                searchable: true,
                analyzerName: KnownAnalyzerNames.EnLucene
            },
            {
                type: "Collection(Edm.Single)",
                name: "contentVector",
                searchable: true,
                vectorSearchDimensions: 1536,
                vectorSearchProfileName: "my-vector-config"
            }
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