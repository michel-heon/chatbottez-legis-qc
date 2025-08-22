import { AzureKeyCredential, SearchIndexClient } from "@azure/search-documents";
import { deleteIndex } from "./utils";

const searchApiKey = process.argv[2];
if (!searchApiKey) {
  throw new Error("Missing input Azure AI Search Key");
}
const indexName = process.argv[3] || process.env.AZURE_SEARCH_INDEX_NAME || "my-documents";
const searchApiEndpoint = process.env.AZURE_SEARCH_ENDPOINT!;
const credentials = new AzureKeyCredential(searchApiKey);

const searchIndexClient = new SearchIndexClient(searchApiEndpoint, credentials);
deleteIndex(searchIndexClient, indexName);
