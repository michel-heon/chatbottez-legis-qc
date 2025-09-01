import { AzureKeyCredential, SearchClient, SearchIndexClient } from "@azure/search-documents";
import { createIndexIfNotExists, delay, upsertDocuments, getEmbeddingVector } from "./utils";
import { MyDocument } from "../app/azureAISearchDataSource";
import config from "../config";
import path from "path";
import * as fs from "fs";

const searchApiKey = process.argv[2];
if (!searchApiKey) {
  throw new Error("Missing input Azure AI Search Key");
}
const azureOpenAIKey = process.argv[3];
if (!azureOpenAIKey) {
  throw new Error("Missing input Azure OpenAI Key");
}
process.env.SECRET_AZURE_OPENAI_API_KEY = azureOpenAIKey;

/**
 * Main function that creates the index and upserts the documents.
 * Generated for index: legis-qc-index-01
 */
export async function main() {
    const index = config.azureSearchIndexName;

    if (
        !process.env.AZURE_SEARCH_ENDPOINT ||
        !process.env.AZURE_OPENAI_ENDPOINT ||
        !process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME
    ) {
        throw new Error(
            "Missing environment variables - please check that AZURE_SEARCH_ENDPOINT, AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME are set."
        );
    }

    // Additional setup logic would go here
    console.log(`Setting up index: ${index}`);
}

if (require.main === module) {
    main().catch(console.error);
}
