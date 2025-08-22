import { AzureKeyCredential, SearchClient, SearchIndexClient } from "@azure/search-documents";
import { createIndexIfNotExists, delay, upsertDocuments, getEmbeddingVector } from "./utils";
import { MyDocument } from "../app/azureAISearchDataSource";
import path from "path";
import * as fs from "fs";
import pdf from "pdf-parse";

const searchApiKey = process.argv[2];
if (!searchApiKey) {
  throw new Error("Missing input Azure AI Search Key");
}
const azureOpenAIKey = process.argv[3];
if (!azureOpenAIKey) {
  throw new Error("Missing input Azure OpenAI Key");
}
const indexName = process.argv[4] || process.env.AZURE_SEARCH_INDEX_NAME || "my-documents";
process.env.SECRET_AZURE_OPENAI_API_KEY = azureOpenAIKey;

/**
 *  Main function that creates the index and upserts the documents.
 */
export async function main() {
    const index = indexName;

    if (
        !process.env.AZURE_SEARCH_ENDPOINT ||
        !process.env.AZURE_OPENAI_ENDPOINT ||
        !process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME
    ) {
        throw new Error(
            "Missing environment variables - please check that AZURE_SEARCH_ENDPOINT, AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME are set."
        );
    }

    const searchApiEndpoint = process.env.AZURE_SEARCH_ENDPOINT!;
    const credentials = new AzureKeyCredential(searchApiKey);

    const searchIndexClient = new SearchIndexClient(searchApiEndpoint, credentials);
    createIndexIfNotExists(searchIndexClient, index);
    // Wait 5 seconds for the index to be created
    await delay(5000);

    const searchClient = new SearchClient<MyDocument>(searchApiEndpoint, index, credentials);

    const filePath = path.join(__dirname, "./data");
    const files = fs.readdirSync(filePath).filter(file => file.endsWith('.pdf'));
    const data: MyDocument[] = [];
    
    console.log(`Found ${files.length} PDF files to process`);
    
    for (let i=1;i<=files.length;i++) {
        const fileName = files[i-1];
        const fullPath = path.join(filePath, fileName);
        
        console.log(`Processing ${i}/${files.length}: ${fileName}`);
        
        try {
            // Read PDF file as buffer
            const pdfBuffer = fs.readFileSync(fullPath);
            // Extract text from PDF
            const pdfData = await pdf(pdfBuffer);
            const content = pdfData.text;
            
            if (content.trim().length === 0) {
                console.log(`Warning: No text extracted from ${fileName}`);
                continue;
            }
            
            data.push({
                docId: i+"",
                docTitle: fileName.replace('.pdf', ''),
                description: content,
                descriptionVector: await getEmbeddingVector(content),
            });
        } catch (error) {
            console.error(`Error processing ${fileName}:`, error);
        }
    }
    await upsertDocuments(searchClient, data);
}

main();

