import { AzureKeyCredential, SearchClient, SearchIndexClient } from "@azure/search-documents";
import { createIndexIfNotExists, delay, upsertDocuments, getEmbeddingVector, splitTextIntoChunks } from "./utils";
import { MyDocument } from "../app/azureAISearchDataSource";
import path from "path";
import * as fs from "fs";
import pdf from "pdf-parse";
import { execSync } from "child_process";

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
 * Synchronizes the data directory from src to lib to ensure we're always working with the latest data
 */
function synchronizeDataDirectory() {
    const srcDataPath = path.resolve(__dirname, "../../../src/indexers/data");
    const libDataPath = path.resolve(__dirname, "./data");
    
    console.log("🔄 Synchronizing data directories...");
    console.log(`   Source: ${srcDataPath}`);
    console.log(`   Target: ${libDataPath}`);
    
    try {
        // Check if source directory exists
        if (!fs.existsSync(srcDataPath)) {
            console.log("⚠️  Source data directory not found, continuing with existing data...");
            return;
        }
        
        // Remove existing lib data directory and copy from src
        if (fs.existsSync(libDataPath)) {
            execSync(`rm -rf "${libDataPath}"`);
        }
        execSync(`cp -r "${srcDataPath}" "${libDataPath}"`);
        
        const srcFiles = fs.readdirSync(srcDataPath).filter(file => file.endsWith('.pdf'));
        const libFiles = fs.readdirSync(libDataPath).filter(file => file.endsWith('.pdf'));
        
        console.log(`✅ Data synchronization complete: ${libFiles.length} PDF files synchronized`);
        
        if (srcFiles.length !== libFiles.length) {
            console.log(`⚠️  File count mismatch: source has ${srcFiles.length} files, target has ${libFiles.length} files`);
        }
    } catch (error) {
        console.error("❌ Error during data synchronization:", error instanceof Error ? error.message : error);
        console.log("⏭️  Continuing with existing data...");
    }
}

/**
 *  Main function that creates the index and upserts the documents.
 */
export async function main() {
    const index = indexName;

    // First, synchronize data directories to ensure we have the latest data
    synchronizeDataDirectory();

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
            
            console.log(`Processing ${fileName} (${content.length} characters)`);
            
            // For very large documents, split into chunks
            const MAX_SINGLE_DOC_CHARS = 12000; // More conservative limit for single documents
            
            if (content.length <= MAX_SINGLE_DOC_CHARS) {
                // Process as single document
                try {
                    const embeddingVector = await getEmbeddingVector(content);
                    data.push({
                        docId: i+"",
                        docTitle: fileName.replace('.pdf', ''),
                        description: content,
                        descriptionVector: embeddingVector,
                    });
                    console.log(`✅ Successfully processed ${fileName} as single document`);
                } catch (embeddingError) {
                    console.error(`❌ Failed to generate embedding for ${fileName}:`, embeddingError instanceof Error ? embeddingError.message : embeddingError);
                    console.log(`⏭️  Skipping ${fileName} and continuing with next document`);
                    continue;
                }
            } else {
                // Split into chunks for large documents
                console.log(`📄 Document ${fileName} is large (${content.length} chars), splitting into chunks`);
                const chunks = splitTextIntoChunks(content, 12000); // More conservative chunk size
                console.log(`   Split into ${chunks.length} chunks`);
                
                let chunkSuccessCount = 0;
                for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
                    const chunk = chunks[chunkIndex];
                    console.log(`   Processing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} chars)`);
                    
                    try {
                        const embeddingVector = await getEmbeddingVector(chunk);
                        data.push({
                            docId: `${i}_${chunkIndex}`,
                            docTitle: `${fileName.replace('.pdf', '')} (Partie ${chunkIndex + 1}/${chunks.length})`,
                            description: chunk,
                            descriptionVector: embeddingVector,
                        });
                        chunkSuccessCount++;
                        console.log(`   ✅ Chunk ${chunkIndex + 1} processed successfully`);
                        
                        // Add small delay between chunks to avoid rate limiting
                        if (chunkIndex < chunks.length - 1) {
                            await delay(500);
                        }
                    } catch (embeddingError) {
                        console.error(`   ❌ Failed to generate embedding for ${fileName} chunk ${chunkIndex + 1}:`, embeddingError instanceof Error ? embeddingError.message : embeddingError);
                        console.log(`   📝 Chunk ${chunkIndex + 1} preview: "${chunk.substring(0, 200)}..."`);
                        console.log(`   ⏭️  Continuing with next chunk...`);
                        
                        // Add delay after error to avoid hitting rate limits
                        await delay(1000);
                    }
                }
                
                if (chunkSuccessCount > 0) {
                    console.log(`✅ Successfully processed ${chunkSuccessCount}/${chunks.length} chunks from ${fileName}`);
                    if (chunkSuccessCount < chunks.length) {
                        console.log(`⚠️  ${chunks.length - chunkSuccessCount} chunks failed but continuing with available data`);
                    }
                } else {
                    console.log(`❌ Failed to process any chunks from ${fileName}`);
                }
            }
        } catch (error) {
            console.error(`❌ Error processing ${fileName}:`, error instanceof Error ? error.message : error);
            console.log(`⏭️  Skipping ${fileName} and continuing with next document`);
        }
    }
    
    console.log(`\n📊 Summary: Successfully processed ${data.length} out of ${files.length} documents`);
    
    if (data.length === 0) {
        console.error("❌ No documents were successfully processed. Aborting index upload.");
        return;
    }
    
    await upsertDocuments(searchClient, data);
}

main();

