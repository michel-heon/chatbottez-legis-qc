const { ActivityTypes } = require("@microsoft/agents-activity");
const { AgentApplication, MemoryStorage } = require("@microsoft/agents-hosting");
const { AzureOpenAI } = require("openai");
const fs = require('fs');
const path = require('path');

const config = require("./config");
const { AzureAISearchDataSource } = require("./app/azureAISearchDataSource");
const {
  moderateContent,
  getWelcomeMessage,
  getHelpMessage,
  getInvalidCommandMessage
} = require("./app/contentModeration");

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

/**
 * Transform blob storage URL to legisquebec.gouv.qc.ca URL
 * @param {string} blobUrl - URL from Azure blob storage
 * @param {string} title - Document title to extract code
 * @returns {string|null} Transformed URL pointing to legisquebec.gouv.qc.ca, or null if pattern not recognized
 */
function transformToLegisQuebecUrl(blobUrl, title) {
  try {
    // Extract code from title - supports multiple formats:
    // - "S-2.2_loi-sur-la-santé-publique.pdf" -> "S-2.2"
    // - "CCQ-1991_code-civil-du-québec.pdf" -> "CCQ-1991"
    // - "P-42_loi-sur-la-protection-sanitaire.pdf" -> "P-42"
    // Pattern: One or more letters, optional dash, digits, optional decimal parts
    const codeMatch = title.match(/^([A-Z]+-?\d+(?:\.\d+)?(?:\.\d+)?)/);
    
    if (codeMatch) {
      const code = codeMatch[1];
      // Build legisquebec URL: https://www.legisquebec.gouv.qc.ca/fr/document/lc/{code}
      const legisUrl = `https://www.legisquebec.gouv.qc.ca/fr/document/lc/${code}`;
      debugLog('FORMAT', `[URL_TRANSFORM] ${title} -> ${legisUrl}`);
      return legisUrl;
    }
    
    // Return null if pattern doesn't match (no link will be shown)
    debugLog('FORMAT', `[URL_TRANSFORM] No code found in title "${title}", no link will be displayed`);
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
 * @returns {string} Formatted response with citations and notice légale at the end
 */
function formatBotResponse(content, citations = []) {
  let formatted = content;

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

  // Add citations section if available (Microsoft best practice: max 20 citations)
  if (uniqueCitations && uniqueCitations.length > 0) {
    const citationLimit = Math.min(uniqueCitations.length, 20);
    formatted += '\n\n---\n\n';
    formatted += '**📚 Sources Consultées**\n\n';
    
    for (let i = 0; i < citationLimit; i++) {
      const citation = uniqueCitations[i];
      const citationNum = i + 1;
      formatted += `${citationNum}. **${citation.title || 'Document'}**`;
      
      if (citation.url) {
        // Transform blob storage URL to legisquebec.gouv.qc.ca URL
        const legisUrl = transformToLegisQuebecUrl(citation.url, citation.title);
        
        // Only add link if URL transformation succeeded
        if (legisUrl) {
          formatted += ` ([Voir le document](${legisUrl}))`;
        }
      }
      
      formatted += '\n';
    }
  }

  // Add notice légale at the VERY END (Microsoft Teams best practice)
  formatted += '\n\n---\n\n';
  formatted += '**NOTE :** Les sources documentaires consultées apparaissent ci-dessus.\n\n';
  formatted += '**NOTICE LÉGALE :** Cette réponse est générée par l\'IA, elle est à titre informatif seulement et ne constitue pas un avis juridique. Pour toute situation particulière ou pour plus d\'information, consultez un avocat.';

  return formatted;
}

// Create the main AgentApplication instance
const agentApp = new AgentApplication({
  storage,
});

// Welcome message for new members
agentApp.onConversationUpdate("membersAdded", async (context) => {
  debugLog('WELCOME', 'New member joined conversation');
  await context.sendActivity(getWelcomeMessage());
});

// Handle incoming messages - MUST BE AFTER ANY OTHER MESSAGE HANDLERS
agentApp.onActivity(ActivityTypes.Message, async (context) => {
  console.log('[MESSAGE RECEIVED]', context.activity.text);
  debugLog('APP', `Processing message: "${context.activity.text}"`);

  const userText = context.activity.text?.trim() || '';
  const message = userText.toLowerCase();

  // 1. Check for greetings (hi, hello, bonjour, salut)
  if (/^(hi|hello|bonjour|salut|hey)$/i.test(message)) {
    debugLog('COMMAND', 'Processing greeting command');
    await context.sendActivity(getWelcomeMessage());
    debugLog('RESPONSE', 'Sent welcome message');
    return;
  }

  // 2. Check for help commands
  if (/^(help|aide|\/help|\/aide|\?)$/i.test(message)) {
    debugLog('COMMAND', 'Processing help command');
    await context.sendActivity(getHelpMessage());
    debugLog('RESPONSE', 'Sent help message');
    return;
  }

  // 3. Handle "/clear" and "/reset" commands (unified)
  if (message === '/clear' || message === '/reset') {
    debugLog('COMMAND', `Processing clear command`);
    const conversationKey = `${context.activity.conversation.id}/${context.activity.from.id}`;

    // Clear conversation history
    await storage.delete(conversationKey);
    debugLog('STORAGE', 'Cleared conversation history');

    await context.sendActivity('L\'historique de la conversation a été effacé. / Conversation history cleared.');
    debugLog('RESPONSE', `Sent clear confirmation`);
    return;
  }

  // 4. Content moderation - check for inappropriate content
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

    // Format response with Microsoft Teams best practices
    const formattedResponse = formatBotResponse(fullContent, citations);
    
    debugLog('FORMAT', `Formatted response for Teams display`);

    // Update conversation history with new messages
    messages.push({ role: 'user', content: context.activity.text });
    messages.push({ role: 'assistant', content: fullContent });

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