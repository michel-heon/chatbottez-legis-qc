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
 * @param {SearchIndexClient} client - The search index client
 * @param {string} name - The name of the index
 */
export async function createIndexIfNotExists(client: SearchIndexClient, name: string): Promise<void> {
    const MyDocumentIndex: SearchIndex = {
        name,
        fields: [
            {
                type: "Edm.String",
                name: "docId",
                key: true,
                filterable: true,
                sortable: true
            },
            {
                type: "Edm.String",
                name: "docTitle",
                searchable: true,
                filterable: true,
                sortable: true
            },
            {
                type: "Edm.String",
                name: "description",
                searchable: true,
                analyzerName: KnownAnalyzerNames.EnLucene
            },
            {
                type: "Collection(Edm.Single)",
                name: "descriptionVector",
                searchable: true,
                vectorSearchDimensions: 1536,
                vectorSearchProfileName: "my-vector-config"
            },
        ],
        corsOptions: {
            // for browser tests
            allowedOrigins: ["*"]
        },
        vectorSearch: {
            algorithms: [{ name: "vector-search-algorithm", kind: "hnsw" }],
            profiles: [
                {
                    name: "my-vector-config",
                    algorithmConfigurationName: "vector-search-algorithm"
                }
            ]
        }
    };

    await client.createOrUpdateIndex(MyDocumentIndex);
}

/**
 * Split text into chunks that fit within token limits
 * @param text - The text to split
 * @param maxChars - Maximum characters per chunk
 * @returns Array of text chunks
 */
export function splitTextIntoChunks(text: string, maxChars: number = 20000): string[] {
    if (text.length <= maxChars) {
        return [text];
    }
    
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
        let end = start + maxChars;
        
        // If we're not at the end of the text, try to break at a sentence or paragraph
        if (end < text.length) {
            // Look for paragraph breaks first
            const lastParagraph = text.lastIndexOf('\n\n', end);
            if (lastParagraph > start) {
                end = lastParagraph;
            } else {
                // Look for sentence breaks
                const lastSentence = text.lastIndexOf('.', end);
                if (lastSentence > start) {
                    end = lastSentence + 1;
                }
            }
        }
        
        chunks.push(text.substring(start, end).trim());
        start = end;
    }
    
    return chunks.filter(chunk => chunk.length > 0);
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

    // Limit text size to avoid API token limits (text-embedding-ada-002 has ~8191 token limit)
    // Conservative approach: 3 characters per token, with safety margin
    const MAX_CHARS = 18000; // ~6000 tokens max
    let processedText = text;
    
    if (text.length > MAX_CHARS) {
        console.warn(`Text too long (${text.length} chars), truncating to ${MAX_CHARS} chars`);
        processedText = text.substring(0, MAX_CHARS) + "...";
    }

    // Clean the text before processing
    processedText = cleanText(processedText);

    // Retry logic for better reliability
    const maxRetries = 3;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await embeddings.createEmbeddings(process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME!, processedText);

            if (result.status !== "success" || !result.output) {
                throw new Error(`Failed to generate embeddings for description: ${processedText.substring(0, 100)}...`);
            }

            return result.output[0];
        } catch (error: any) {
            lastError = error;
            
            console.warn(`Embedding attempt ${attempt} failed. Text length: ${processedText.length}, Text preview: "${processedText.substring(0, 200)}..."`);
            
            if (error.response?.status === 400) {
                console.warn(`API 400 error on attempt ${attempt} - text might contain invalid content or still be too long`);
                
                // Try with progressively smaller and cleaner text on each attempt
                const reductionFactor = attempt * 0.25; // Reduce by 25%, 50%, 75%
                const reducedMaxChars = Math.floor(MAX_CHARS * (1 - reductionFactor));
                
                if (reducedMaxChars > 500 && processedText.length > reducedMaxChars) {
                    console.warn(`Attempt ${attempt}: reducing text to ${reducedMaxChars} chars and re-cleaning`);
                    processedText = cleanText(text.substring(0, reducedMaxChars));
                    
                    // Don't throw yet, try with reduced text
                    if (attempt < maxRetries) {
                        await delay(1000 * attempt); // Progressive delay
                        continue;
                    }
                }
                
                // If text is already very short, try one more ultra-clean version
                if (attempt === maxRetries - 1 && processedText.length < 1000) {
                    console.warn(`Final attempt: using ultra-clean minimal text`);
                    processedText = text.substring(0, 500).replace(/[^\w\s\.\,\;\:\!\?\-]/g, ' ').replace(/\s+/g, ' ').trim();
                    if (processedText.length < 10) {
                        processedText = "Document content could not be processed for embedding.";
                    }
                    await delay(2000);
                    continue;
                }
            } else if (error.response?.status === 429) {
                // Rate limiting - wait and retry
                console.warn(`Rate limit hit on attempt ${attempt}, waiting ${2000 * attempt}ms...`);
                if (attempt < maxRetries) {
                    await delay(2000 * attempt);
                    continue;
                }
            } else if (error.response?.status) {
                console.warn(`HTTP ${error.response.status} error: ${error.message}`);
            }
            
            // For other errors or final attempt, break the retry loop
            if (attempt === maxRetries) {
                break;
            }
            
            // Wait before retry
            await delay(1000 * attempt);
        }
    }
    
    throw new Error(`Failed to generate embeddings after ${maxRetries} attempts. Last error: ${lastError instanceof Error ? lastError.message : lastError}`);
}

/**
 * Clean text to remove problematic characters that might cause embedding issues
 * @param text - The text to clean
 * @returns Cleaned text
 */
function cleanText(text: string): string {
    return text
        // Remove or replace common problematic characters
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ') // Remove control characters
        .replace(/[\uFFFD\uFEFF]/g, '') // Remove replacement and BOM characters
        .replace(/\u00A0/g, ' ') // Replace non-breaking spaces with regular spaces
        .replace(/[\u2000-\u200F\u2028-\u202F\u205F-\u206F]/g, ' ') // Replace various Unicode spaces
        .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
        .trim();
}