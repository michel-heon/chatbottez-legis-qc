const { ActivityTypes } = require("@microsoft/agents-activity");
const { AgentApplication, MemoryStorage } = require("@microsoft/agents-hosting");
const { AzureOpenAI } = require("openai");
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration: Disable URL validation to avoid server overload
// See docs/known-bugs/url-validation-disabled.md
const ENABLE_URL_VALIDATION = false;

const config = require("./config");
const { AzureAISearchDataSource } = require("./app/azureAISearchDataSource");
const {
  moderateContent,
  getWelcomeMessage,
  getHelpMessage,
  getInvalidCommandMessage
} = require("./app/contentModeration");
const { detectLegalCommand } = require("./app/legalCommands");

// Azure AI Foundry parameters optimized for detailed legal responses
const azureAIFoundryParams = {
    max_tokens: 24000,       // Plus élevé pour réponses complètes avec citations (96k chars)
    temperature: 0.1,        // Plus bas pour plus de précision et consistance
    top_p: 0.9,             // Plus strict pour éviter la dérive
    frequency_penalty: 0.1,  // Légère pénalité pour éviter les répétitions
    presence_penalty: 0.05,  // Encourager la diversité des informations
    past_messages: 15        // Plus de contexte conversationnel
};

// Debug helper function
const debugLog = (tag, message) => {
  if (process.env.DEBUG === 'true') {
    console.log(`[${tag}] ${message}`);
  }
};

// Cache for URL validation results (avoid repeated HTTP calls)
const urlValidationCache = new Map();

// Cache for LLM URL resolution (avoid repeated LLM calls)
const llmUrlCache = new Map();

/**
 * Validate if a URL is accessible (returns 200-399)
 * @param {string} url - URL to validate
 * @returns {Promise<boolean>} True if URL is accessible
 */
async function validateUrl(url) {
  // Check cache first
  if (urlValidationCache.has(url)) {
    return urlValidationCache.get(url);
  }

  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      method: 'HEAD',
      timeout: 3000, // 3s timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LegisQuebecBot/1.0)'
      }
    };

    const req = lib.request(url, options, (res) => {
      const isValid = res.statusCode >= 200 && res.statusCode < 400;
      urlValidationCache.set(url, isValid);
      debugLog('URL_VALIDATE', `${url} -> ${res.statusCode} (${isValid ? 'VALID' : 'INVALID'})`);
      resolve(isValid);
    });

    req.on('error', (err) => {
      debugLog('URL_VALIDATE', `${url} -> ERROR: ${err.message}`);
      urlValidationCache.set(url, false);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      debugLog('URL_VALIDATE', `${url} -> TIMEOUT`);
      urlValidationCache.set(url, false);
      resolve(false);
    });

    req.end();
  });
}

/**
 * Extract a legal citation from document content using LLM.
 * Converts filenames like "2025qcca157.pdf" to standardized legal citations.
 * Examples: "St-Jean c. Mercier, 2002 CSC 15", "C-12, art. 10", "L.R.Q., c. C-12"
 * Results are cached to avoid repeated LLM calls.
 * @param {string} filename - Document filename
 * @param {string} content - Document content excerpt (first ~500 chars)
 * @returns {Promise<string>} - Legal citation or original filename
 */
async function extractReadableTitle(filename, content) {
  // Check cache first
  const cacheKey = `citation_${filename}`;
  if (llmUrlCache.has(cacheKey)) {
    const cached = llmUrlCache.get(cacheKey);
    debugLog('FORMAT', `[CITATION_CACHE] Using cached citation for ${filename}`);
    return cached;
  }

  try {
    const client = new AzureOpenAI({
      apiKey: config.azureOpenAIApiKey,
      endpoint: config.azureOpenAIEndpoint,
      apiVersion: '2024-04-01-preview',
    });

    const prompt = `Extrait la référence juridique standardisée du document suivant. Réponds UNIQUEMENT avec la référence, sans explication.

Nom de fichier: ${filename}

Contenu (début): ${content.substring(0, 500)}

Format attendu selon le type de document:
- Jugements: "Partie c. Partie, Année TRIBUNAL Numéro" (ex: "St-Jean c. Mercier, 2002 CSC 15")
- Lois: "Nom de la loi, Code (abrégé)" (ex: "Charte des droits et libertés de la personne, L.R.Q., c. C-12")
- Règlements: "Nom du règlement, Code" (ex: "Règlement sur X, R.R.Q., c. Y-1, r. 1")
- Articles: Ajoute ", art. X" si l'article est identifiable

Référence juridique:`;

    const response = await client.chat.completions.create({
      model: config.azureOpenAIDeploymentName,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.1,
    });

    const extractedCitation = response.choices[0]?.message?.content?.trim();
    
    if (extractedCitation && extractedCitation.length > 5 && extractedCitation.length < 300) {
      // Cache the result
      llmUrlCache.set(cacheKey, extractedCitation);
      debugLog('FORMAT', `[CITATION_EXTRACT] ${filename} -> "${extractedCitation}"`);
      return extractedCitation;
    }
  } catch (error) {
    debugLog('FORMAT', `[CITATION_EXTRACT] Error extracting citation: ${error.message}`);
  }

  // Fallback: return filename without extension
  return filename.replace(/\.pdf$/i, '');
}

/**
 * Ask LLM to find the correct public URL for a legal document
 * @param {string} title - Document title
 * @param {string} failedUrl - The URL that failed validation
 * @returns {Promise<string|null>} Correct URL or null if not found
 */
async function findUrlWithLLM(title, failedUrl) {
  // Check cache first
  const cacheKey = `${title}`;
  if (llmUrlCache.has(cacheKey)) {
    return llmUrlCache.get(cacheKey);
  }

  try {
    debugLog('LLM_URL', `Asking LLM to find URL for: "${title}" (failed: ${failedUrl})`);
    
    const client = new AzureOpenAI({
      apiKey: config.azureOpenAIKey,
      endpoint: config.azureOpenAIEndpoint,
      apiVersion: config.azureOpenAIDeploymentVersion || "2024-10-21",
    });

    const response = await client.chat.completions.create({
      model: config.azureOpenAIDeploymentName,
      messages: [
        {
          role: 'system',
          content: `Tu es un expert des ressources juridiques québécoises. Ta tâche est de trouver l'URL publique correcte pour un document juridique.

Sources principales:
- Lois et règlements: https://www.legisquebec.gouv.qc.ca/fr/document/lc/{CODE}
- Jugements tribunaux QC: https://www.canlii.org/fr/qc/{tribunal}/{année}/{référence}.html
- Chartes: https://www.legisquebec.gouv.qc.ca/fr/document/lc/{CODE}

Réponds UNIQUEMENT avec l'URL complète (https://...) ou "INCONNU" si tu ne peux pas déterminer l'URL avec certitude.`
        },
        {
          role: 'user',
          content: `Trouve l'URL publique pour ce document: "${title}"

L'URL automatique "${failedUrl}" ne fonctionne pas (404). Quelle est la bonne URL?

Réponds UNIQUEMENT avec l'URL complète ou "INCONNU".`
        }
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    const llmUrl = response.choices[0]?.message?.content?.trim();
    
    if (llmUrl && llmUrl !== 'INCONNU' && llmUrl.startsWith('http')) {
      debugLog('LLM_URL', `LLM found URL: ${llmUrl}`);
      
      // Validate LLM's suggested URL
      const isValid = await validateUrl(llmUrl);
      if (isValid) {
        llmUrlCache.set(cacheKey, llmUrl);
        return llmUrl;
      } else {
        debugLog('LLM_URL', `LLM URL validation failed: ${llmUrl}`);
      }
    }
    
    debugLog('LLM_URL', `LLM could not find valid URL for: "${title}"`);
    llmUrlCache.set(cacheKey, null);
    return null;
    
  } catch (error) {
    debugLog('LLM_URL', `Error calling LLM: ${error.message}`);
    llmUrlCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Start a periodic typing indicator that keeps showing "Bot is typing..." 
 * until stopped. Returns a stop function.
 * @param {object} context - Bot context
 * @param {number} intervalMs - Interval in milliseconds (default 2000ms = 2s)
 * @returns {Function} Stop function to clear the interval
 */
function startTypingIndicator(context, intervalMs = 2000) {
  const intervalId = setInterval(async () => {
    try {
      await context.sendActivity({ type: ActivityTypes.Typing });
      debugLog('UX', 'Periodic typing indicator sent');
    } catch (error) {
      debugLog('UX', `Error sending typing indicator: ${error.message}`);
    }
  }, intervalMs);

  // Return stop function
  return () => {
    clearInterval(intervalId);
    debugLog('UX', 'Stopped periodic typing indicator');
  };
}

/**
 * Load and return the welcome adaptive card
 * @returns {object} Adaptive card attachment for welcome message
 */
function getWelcomeCard() {
  try {
    const welcomeCardPath = path.join(__dirname, '../appPackage/welcome-card.json');
    const welcomeCardJson = JSON.parse(fs.readFileSync(welcomeCardPath, 'utf8'));
    return {
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: welcomeCardJson
    };
  } catch (error) {
    debugLog('ERROR', `Failed to load welcome card: ${error.message}`);
    // Fallback to text message
    return null;
  }
}

/**
 * Transform blob storage URL to public accessible URL with validation
 * @param {string} blobUrl - URL from Azure blob storage
 * @param {string} title - Document title to extract code
 * @returns {Promise<string>} Transformed URL, LLM-found URL, or original blob URL as fallback
 */
async function transformToLegisQuebecUrl(blobUrl, title) {
  try {
    let candidateUrl = null;
    let urlSource = null;
    
    // Pattern 1: Lois et règlements - "S-2.2_loi-sur...", "CCQ-1991_code..."
    // Extract code from title - letters + optional dash + digits + optional decimals
    const loiCodeMatch = title.match(/^([A-Z]+-?\d+(?:\.\d+)?(?:\.\d+)?)/);
    
    if (loiCodeMatch) {
      const code = loiCodeMatch[1];
      // Build legisquebec URL: https://www.legisquebec.gouv.qc.ca/fr/document/lc/{code}
      candidateUrl = `https://www.legisquebec.gouv.qc.ca/fr/document/lc/${code}`;
      urlSource = 'Loi/Règlement';
    }
    
    // Pattern 2: Décisions de tribunaux - DISABLED
    // CanLII links are not displayed (only legisquebec.gouv.qc.ca allowed)
    // Judgments will show title without link
    if (!candidateUrl) {
      const jugementMatch = title.match(/^(\d{4})(qc[a-z]{2,10})(\d+)/i);
      
      if (jugementMatch) {
        // Judgment detected but no link returned (CanLII not allowed)
        debugLog('FORMAT', `[URL_TRANSFORM] Jugement detected but link disabled: ${title}`);
        return null;
      }
    }
    
    // If we found a candidate URL (legisquebec.gouv.qc.ca only), return it
    if (candidateUrl) {
      debugLog('FORMAT', `[URL_TRANSFORM] ${urlSource}: ${title} -> ${candidateUrl}`);
      return candidateUrl;
    }
    
    // No valid URL found - return null to hide link
    debugLog('FORMAT', `[URL_TRANSFORM] No valid URL found for "${title}", no link will be displayed`);
    return null;
    
  } catch (error) {
    debugLog('FORMAT', `[URL_TRANSFORM] Error transforming URL: ${error.message}`);
    return null;
  }
}

// Create storage for conversation history
const storage = new MemoryStorage();

// Initialize the standalone data source
const dataSource = new AzureAISearchDataSource({
    name: "azure-ai-search",
    indexName: "fileupload-justice-index-02",
    azureAISearchApiKey: config.azureSearchKey,
    azureAISearchEndpoint: config.azureSearchEndpoint,
    azureOpenAIApiKey: config.azureOpenAIKey,
    azureOpenAIEndpoint: config.azureOpenAIEndpoint,
    azureOpenAIEmbeddingDeploymentName: config.azureOpenAIEmbeddingDeploymentName,
    strictness: config.azureSearchStrictness,
    retrievedDocuments: config.azureSearchRetrievedDocuments,
    limitToDataContent: config.azureSearchLimitToDataContent
});

// Load instructions from file on initialization
function loadInstructions() {
  const instructionPath = path.join(__dirname, 'app', 'instructions.txt');
  return fs.readFileSync(instructionPath, 'utf-8').trim();
}

// Load instructions once at startup
const instructions = loadInstructions();

/**
 * Format bot response according to Microsoft Teams best practices.
 * Adds structure, markdown formatting, and citations in standard format.
 * @param {string} content - The AI-generated response content (should NOT include notice légale)
 * @param {Array} citations - Array of citation objects from Azure AI Search
 * @returns {Promise<string>} Formatted response with citations and notice légale at the end
 */
/**
 * Normalize Markdown heading hierarchy for Teams/Copilot display
 * Microsoft best practices:
 * - ## for main sections (H2)
 * - ### for subsections (H3)  
 * - **bold** for emphasis within text
 * - Avoid H1 (#) in message content
 */
function normalizeMarkdownHierarchy(content) {
  let normalized = content;
  
  // Fix common patterns where bold text should be headings
  // Pattern: "Titre de section :" followed by content
  // Examples: "Principes généraux :", "Exemples concrets :", etc.
  normalized = normalized.replace(/\n\*\*([^*]+)\s*:\*\*\n/g, (match, title) => {
    // Check if it's a main section indicator (appears at start of line after newline)
    // These should be H3 (###)
    return `\n### ${title}\n\n`;
  });
  
  // Ensure numbered sections are H2 (##)
  // Pattern: "1. Titre", "2. Titre", "3. Titre"
  normalized = normalized.replace(/\n(\d+\.\s+[A-Z][^\n]+)\n/g, (match, title) => {
    // Only apply if not already a heading
    if (!title.startsWith('#')) {
      return `\n## ${title}\n\n`;
    }
    return match;
  });
  
  return normalized;
}

async function formatBotResponse(content, citations = []) {
  // v1.1.9 approach: Trust LLM to generate proper Teams format from instructions.txt
  // No post-processing needed - LLM knows Teams Markdown format
  
  // Deduplicate citations by title (keep highest score)
  const uniqueCitations = [];
  const seenTitles = new Set();
  
  for (const citation of citations) {
    const title = citation.title || 'Document';
    if (!seenTitles.has(title)) {
      seenTitles.add(title);
      uniqueCitations.push(citation);
    }
  }
  
  debugLog('FORMAT', `[CITATIONS] Deduplicated: ${citations.length} -> ${uniqueCitations.length} unique citations`);

  // Validate response structure (follow-up questions required by instructions.txt)
  validateFollowUpQuestions(content);
  
  // Clean up extra whitespace only
  const formatted = content.replace(/\n{3,}/g, '\n\n');

  // NOTE: According to instructions.txt (v1.1.9 style):
  // - LLM generates content with proper Teams Markdown format
  // - Citations section will be displayed AUTOMATICALLY by Teams UI
  // - Legal notice is generated by LLM according to instructions
  // - NO post-processing of heading hierarchy needed
  
  debugLog('FORMAT', 'Response ready for Teams (LLM-generated format)');
  return formatted;
}

/*
 * DEPRECATED - v1.1.9 approach: LLM generates proper format from instructions.txt
 * 
 * This function attempted to normalize heading hierarchy but caused issues:
 * - Converted follow-up questions to H2 headings (wrong formatting)
 * - Added complexity not present in v1.1.9
 * - LLM already knows Teams Markdown format from instructions
 * 
 * v1.1.9 sent LLM content directly with ZERO post-processing.
 * Instructions.txt specifies Teams format, LLM generates correctly.
 
function normalizeMarkdownHeadings(content) {
  // CRITICAL: Protect follow-up questions from being converted to headings
  // Step 0: Mark follow-up questions with temporary placeholders BEFORE any transformation
  const followUpPattern = /(\*\*)?pour approfondir (votre recherche|vos connaissances)(\*\*)?\s*:?/i;
  const followUpMatch = followUpPattern.exec(content);
  
  if (followUpMatch) {
    const followUpIndex = followUpMatch.index;
    const beforeQuestions = content.substring(0, followUpIndex);
    const questionsSection = content.substring(followUpIndex);
    
    // Protect numbered items in questions section by adding temporary marker
    const protectedQuestions = questionsSection.replace(/^(\d+)\.\s+/gm, '___QUESTION_MARKER___$1. ');
    
    debugLog('FORMAT', 'Protected follow-up questions from heading conversion');
    content = beforeQuestions + protectedQuestions;
  }
  
  // Step 1: Convert numbered sections (1. Section, 2. Section) to H2 (main sections)
  // Process line by line to respect markers
  const lines = content.split('\n');
  const processedLines = lines.map(line => {
    // Skip lines with protection marker
    if (line.includes('___QUESTION_MARKER___')) {
      return line;
    }
    
    // Check if line matches numbered section pattern
    const match = line.match(/^(\d+)\.\s+([^\n]+)$/);
    if (match) {
      const num = match[1];
      let text = match[2];
      // Remove any existing markdown or bold from text
      debugLog('FORMAT', `Converting section "${num}. ${text.substring(0, 30)}..." to H2`);
      return `## ${num}. ${text}`;
    }
    
    return line;
  });
  
  content = processedLines.join('\n');
  
  // Step 2: Convert **Bold text:** (with colon) at start of line to H3
  // These are usually subsection headers like "Principes généraux :", "Théorie :", etc.
  content = content.replace(/^\*\*([^*\n]+):\*\*\s*$/gm, '### $1');
  
  // Step 3: Convert standalone **Bold text** (no colon) at start of line to H4
  // These are sub-subsections or emphasis headers
  content = content.replace(/^\*\*([^*:\n]+)\*\*\s*$/gm, '#### $1');
  
  // Step 4: Clean up any double spaces or formatting artifacts
  content = content.replace(/^###\s+###\s+/gm, '### ');
  content = content.replace(/^##\s+##\s+/gm, '## ');
  
  // Step 5: Remove temporary question markers
  content = content.replace(/___QUESTION_MARKER___/g, '');
  
  debugLog('FORMAT', 'Normalized Markdown heading hierarchy (H2 > H3 > H4)');
  return content;
}
*/

/**
 * Validate that response contains mandatory follow-up questions.
 */
function validateFollowUpQuestions(content) {
  const hasFollowUp = /pour approfondir (votre recherche|vos connaissances)\s*:/i.test(content);
  if (!hasFollowUp) {
    debugLog('VALIDATION', '⚠️ Response missing follow-up questions (required by instructions.txt)');
  }
  return hasFollowUp;
}

/**
 * DEPRECATED - v1.1.9 approach: LLM generates notice according to instructions.txt
 * 
 * Previously these functions removed LLM notices and added code-generated ones.
 * Now following v1.1.9-documentation-certification: instructions.txt tells LLM 
 * to include the notice, no post-processing needed.
 */

// Kept as reference for future debugging if double notices reappear

// function removeLLMGeneratedNotices(content) {
//   const patterns = [
//     /⚖️\s*[Pp]our toute situation[^]*?(?:avocat|jurisprudence)[^.]*\./gi,
//     /\*?\*?NOTICE LÉGALE\s*:?\*?\*?\s*[^]*?(?:avocat|information)[^.]*\./gi,
//     /[Pp]our toute situation particulière[^]*?(?:avocat|spécialisé|textes officiels)[^.]*\./gi,
//     /[Ii]l est recommandé de consulter[^.]*?avocat[^.]*\./gi,
//     /\n\n[⚖️\s]*(?:[Pp]our toute|[Ii]l est recommandé)[^]*?(?:avocat|jurisprudence récente)\./gi,
//     /\n\n[^]*?(?:consultez un avocat|consulter un avocat spécialisé)[^.]*\./gi,
//   ];
//   let cleanedContent = content;
//   patterns.forEach(pattern => {
//     cleanedContent = cleanedContent.replace(pattern, '');
//   });
//   return cleanedContent.trim();
// }

// function addLegalNotices(content) {
//   content = removeLLMGeneratedNotices(content);
//   const legalNotice = '\n\n⚖️ Pour toute situation particulière...';
//   const aiNotice = '\n\n**NOTICE LÉGALE :** Cette réponse...';
//   return content + legalNotice + aiNotice;
// }

// Create the main AgentApplication instance
const agentApp = new AgentApplication({
  storage,
});

// Note: Welcome message via conversationUpdate disabled to avoid errors
// Microsoft 365 Copilot uses prompt starters instead (defined in manifest.json)
// Users can also type "bonjour", "hi", "hello" to get the welcome message

// Handle incoming messages - MUST BE AFTER ANY OTHER MESSAGE HANDLERS
agentApp.onActivity(ActivityTypes.Message, async (context) => {
  console.log('[MESSAGE RECEIVED]', context.activity.text);
  console.log('[CONTEXT]', JSON.stringify({
    conversationId: context.activity.conversation?.id,
    userId: context.activity.from?.id,
    channelId: context.activity.channelId,
    serviceUrl: context.activity.serviceUrl
  }, null, 2));
  debugLog('APP', `Processing message: "${context.activity.text}"`);

  const userText = context.activity.text?.trim() || '';
  const message = userText.toLowerCase();

  // 1. Check for greetings (hi, hello, bonjour, salut)
  if (/^(hi|hello|bonjour|salut|hey)$/i.test(message)) {
    debugLog('COMMAND', 'Processing greeting command');
    
    // Send welcome message as plain Markdown text (Teams compatible)
    await context.sendActivity(getWelcomeMessage());
    debugLog('RESPONSE', 'Sent welcome message (Markdown text)');
    return;
  }

  // 2. Check for help commands
  if (/^(help|aide|\/help|\/aide|\?)$/i.test(message)) {
    debugLog('COMMAND', 'Processing help command');
    await context.sendActivity(getHelpMessage());
    debugLog('RESPONSE', 'Sent help message');
    return;
  }

  // 3. Check for specialized legal commands (6 custom juridical commands)
  const legalCommand = detectLegalCommand(userText);
  if (legalCommand) {
    debugLog('COMMAND', `Detected legal command: ${legalCommand.name}`);
    
    // Send welcome message for this specific legal topic
    await context.sendActivity(legalCommand.welcomeMessage);
    debugLog('RESPONSE', `Sent legal command welcome message for: ${legalCommand.name}`);
    
    // Start periodic typing indicator to show bot is working on RAG + OpenAI
    const stopTyping = startTypingIndicator(context, 2000);
    context.activity.stopTypingIndicator = stopTyping; // Store stop function for later cleanup
    
    // The enhanced instructions will be used in the normal RAG flow below
    // by modifying the instructions before sending to OpenAI
    // We'll set a flag to indicate a legal command was detected
    context.activity.legalCommandContext = legalCommand;
  }

  // 5. Content moderation - check for inappropriate content
  const moderationResult = moderateContent(userText);
  if (moderationResult.isInappropriate) {
    debugLog('MODERATION', `Blocked inappropriate content (category: ${moderationResult.category})`);
    await context.sendActivity(moderationResult.message);
    debugLog('RESPONSE', 'Sent moderation rejection message');
    return;
  }

  // Get conversation history
  const conversationKey = `${context.activity.conversation.id}/${context.activity.from.id}`;
  const storageData = await storage.read([conversationKey]);
  let messages = storageData[conversationKey] || [];
  
  // Ensure messages is an array (defensive check)
  if (!Array.isArray(messages)) {
    debugLog('STORAGE', `WARNING: messages was not an array, resetting to empty array. Type: ${typeof messages}`);
    messages = [];
  }

  debugLog('STORAGE', `Loaded conversation history: ${messages.length} messages`);

  // Apply Azure AI Foundry past_messages limit
  if (messages.length > azureAIFoundryParams.past_messages) {
    messages = messages.slice(-azureAIFoundryParams.past_messages);
    await storage.write({ [conversationKey]: messages });
    debugLog('STORAGE', `Applied past_messages limit: ${azureAIFoundryParams.past_messages}`);
  }

  debugLog('APP', `Conversation key: ${conversationKey}`);

  // Start periodic typing indicator for ALL RAG queries (not just legal commands)
  // This ensures user sees "Bot is typing..." during entire RAG + OpenAI processing
  let stopTyping = context.activity.stopTypingIndicator; // Reuse if already started (legal command)
  
  if (!stopTyping) {
    stopTyping = startTypingIndicator(context, 2000);
    context.activity.stopTypingIndicator = stopTyping;
  }

  try {
    // Get relevant context from the data source
    debugLog('APP', 'Starting Azure Search query...');
    const { context: contextData, citations } = await dataSource.renderContext(context.activity.text);
    debugLog('APP', `Azure Search completed. Context length: ${contextData ? contextData.length : 0} characters`);
    debugLog('APP', `Citations collected: ${citations.length} sources`);

    if (contextData) {
      debugLog('APP', `Context preview: ${contextData.substring(0, 200)}...`);
    } else {
      debugLog('APP', 'No context data found');
    }

    // Troncature intelligente du contexte pour éviter les limites de tokens
    let finalContextData = contextData;
    const MAX_CONTEXT_CHARS = 400000; // ~100k tokens approximativement

    if (contextData && contextData.length > MAX_CONTEXT_CHARS) {
      finalContextData = contextData.substring(0, MAX_CONTEXT_CHARS);
      const truncatedTokens = Math.round((contextData.length - MAX_CONTEXT_CHARS) / 4);
      debugLog('APP', `Context truncated: ${contextData.length} → ${finalContextData.length} chars (~${truncatedTokens} tokens saved)`);

      // Ajouter un message d'avertissement dans le contexte tronqué
      finalContextData += "\n\n[Note: Le contexte a été tronqué pour respecter les limites du modèle. Posez des questions plus spécifiques pour obtenir des informations plus détaillées.]";  
    }

    // Build enhanced instructions that include context if available
    let enhancedInstructions = instructions;
    
    // If a legal command was detected, add specialized instructions
    if (context.activity.legalCommandContext) {
      debugLog('APP', `Applying specialized legal command instructions: ${context.activity.legalCommandContext.name}`);
      enhancedInstructions += `\n\n${context.activity.legalCommandContext.enhancedInstructions}`;
    }
    
    if (finalContextData) {
      enhancedInstructions += `\n\nAdditional Context:\n<context>\n${finalContextData}\n</context>`;
    }

    // Skip OpenAI call if configuration is missing
    if (!config.azureOpenAIKey || !config.azureOpenAIEndpoint) {
      debugLog('CONFIG', `Missing Azure OpenAI configuration`);
      await context.sendActivity('Configuration Azure OpenAI manquante. Veuillez configurer vos clés Azure OpenAI dans les variables d\'environnement.');
      return;
    }

    debugLog('APP', `Sending request to OpenAI model with streaming: ${config.azureOpenAIDeploymentName}`);

    // Send typing indicator to improve perceived responsiveness (Microsoft 365 Agents SDK best practice)
    await context.sendActivity({ type: ActivityTypes.Typing });
    debugLog('UX', 'Typing indicator sent to user');

    // Initialize Azure OpenAI client for streaming
    const client = new AzureOpenAI({
      apiKey: config.azureOpenAIKey,
      endpoint: config.azureOpenAIEndpoint,
      apiVersion: config.azureOpenAIDeploymentVersion || "2024-10-21",
    });

    // Build messages array for OpenAI API format
    const openAIMessages = [
      {
        role: 'system',
        content: enhancedInstructions
      }
    ];

    // Add conversation history
    messages.forEach((msg) => {
      openAIMessages.push({
        role: msg.role || 'user',
        content: msg.content
      });
    });

    // Add current user message
    openAIMessages.push({
      role: 'user',
      content: context.activity.text
    });

    debugLog('OPENAI', `Sending ${openAIMessages.length} messages to streaming API`);

    // Create streaming completion
    const stream = await client.chat.completions.create({
      model: config.azureOpenAIDeploymentName,
      messages: openAIMessages,
      stream: true,
      max_tokens: azureAIFoundryParams.max_tokens,
      temperature: azureAIFoundryParams.temperature,
      top_p: azureAIFoundryParams.top_p,
      frequency_penalty: azureAIFoundryParams.frequency_penalty,
      presence_penalty: azureAIFoundryParams.presence_penalty,
    });

    // Accumulate streaming response
    let fullContent = '';
    let lastLoggedLength = 0;
    const LOG_INTERVAL = 1000; // Log every 1000 characters

    debugLog('OPENAI', `Starting to receive streaming chunks...`);

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullContent += delta;
        
        // Log only at intervals to reduce verbosity
        if (fullContent.length - lastLoggedLength >= LOG_INTERVAL) {
          debugLog('OPENAI', `Accumulated ${fullContent.length} characters...`);
          lastLoggedLength = fullContent.length;
        }
      }
    }

    debugLog('OPENAI', `Streaming complete. Total content: ${fullContent.length} characters`);

    // Format response with Microsoft Teams best practices (async: validates URLs with LLM fallback)
    const formattedResponse = await formatBotResponse(fullContent, citations);
    
    debugLog('FORMAT', `Formatted response for Teams display`);

    // Update conversation history with new messages
    messages.push({ role: 'user', content: context.activity.text });
    messages.push({ role: 'assistant', content: fullContent });

    // Stop periodic typing indicator before sending final response
    if (context.activity.stopTypingIndicator) {
      context.activity.stopTypingIndicator();
    }

    // Send response with AI label and feedback loop (Microsoft 365 Agents best practice)
    await context.sendActivity({
      type: ActivityTypes.Message,
      text: formattedResponse,
      entities: [
        {
          type: "https://schema.org/Message",
          "@type": "Message",
          "@context": "https://schema.org",
          additionalType: ["AIGeneratedContent"], // Enables AI label
        }
      ],
      channelData: {
        feedbackLoop: { // Enable feedback buttons
          type: "custom"
        }
      }
    });
    debugLog('RESPONSE', 'Sent AI-generated response to user with citations');

    // Store updated conversation history
    await storage.write({ [conversationKey]: messages });
    debugLog('STORAGE', 'Saved conversation history');

  } catch (error) {
    // Stop periodic typing indicator in case of error
    if (context.activity.stopTypingIndicator) {
      context.activity.stopTypingIndicator();
    }

    if (error.status === 429) {
      debugLog('OPENAI', `Rate limit hit - status 429`);
      await context.sendActivity('[LIMITE ATTEINTE] Limite de débit Azure OpenAI atteinte. Veuillez patienter une minute avant de réessayer. Les comptes gratuits ont des limites de jetons par minute.');
      return;
    }

    debugLog('ERROR', `Error processing message: ${error.message || error}`);
    console.error('Error processing message:', error);
    await context.sendActivity(`[ERREUR] Désolé, je n'ai pas pu traiter votre message.

Que faire?
- Tapez "Aide" pour voir toutes les commandes disponibles
- Reformulez votre question de manière plus spécifique
- Contactez le support: support@cotechnoe.com

---
Sorry, I couldn't process your message.
- Type "Help" to see all available commands
- Rephrase your question more specifically
- Contact support: support@cotechnoe.com`);
  }
});

module.exports = {
  agentApp,
};

console.log('[AGENT] Agent application initialized successfully');
console.log('[AGENT] Message handler registered for ActivityTypes.Message');