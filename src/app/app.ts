import { App } from "@microsoft/teams.apps";
import { ChatPrompt } from "@microsoft/teams.ai";
import { LocalStorage } from "@microsoft/teams.common";
import { OpenAIChatModel } from "@microsoft/teams.openai";
import { MessageActivity, TokenCredentials } from '@microsoft/teams.api';
import { ManagedIdentityCredential } from '@azure/identity';
import * as fs from 'fs';
import * as path from 'path';
import config from "../config";
import { AzureAISearchDataSource } from "./azureAISearchDataSource";
import {
  moderateContent,
  getWelcomeMessage,
  getHelpMessage,
  getInvalidCommandMessage
} from "./contentModeration";

// Azure AI Foundry parameters optimized for detailed legal responses
const azureAIFoundryParams = {
    max_tokens: 16000,       // Optimal pour réponses détaillées (64k caractères)
    temperature: 0.1,        // Plus bas pour plus de précision et consistance
    top_p: 0.9,             // Plus strict pour éviter la dérive
    frequency_penalty: 0.1,  // Légère pénalité pour éviter les répétitions
    presence_penalty: 0.05,  // Encourager la diversité des informations
    past_messages: 15        // Plus de contexte conversationnel
};

// Debug helper function
const debugLog = (tag: string, message: string) => {
  if (process.env.DEBUG === 'true') {
    console.log(`[${tag}] ${message}`);
  }
};

// Create storage for conversation history
const storage = new LocalStorage();

// Initialize the standalone data source
const dataSource = new AzureAISearchDataSource({
    name: "azure-ai-search",
    indexName: "fileupload-justice-index-02",
    azureAISearchApiKey: config.azureSearchKey!,
    azureAISearchEndpoint: config.azureSearchEndpoint!,
    azureOpenAIApiKey: config.azureOpenAIKey!,
    azureOpenAIEndpoint: config.azureOpenAIEndpoint!,
    azureOpenAIEmbeddingDeploymentName: config.azureOpenAIEmbeddingDeploymentName!
});

// Load instructions from file on initialization
function loadInstructions(): string {
  const instructionPath = path.join(__dirname, 'instructions.txt');
  return fs.readFileSync(instructionPath, 'utf-8').trim();
}

// Load instructions once at startup
const instructions = loadInstructions();

const createTokenFactory = () => {
  return async (scope: string | string[], tenantId?: string): Promise<string> => {
    const managedIdentityCredential = new ManagedIdentityCredential({
        clientId: process.env.CLIENT_ID
      });
    const scopes = Array.isArray(scope) ? scope : [scope];
    const tokenResponse = await managedIdentityCredential.getToken(scopes, {
      tenantId: tenantId
    });
   
    return tokenResponse.token;
  };
};

// Configure authentication using TokenCredentials
const tokenCredentials: TokenCredentials = {
  clientId: process.env.CLIENT_ID || '',
  token: createTokenFactory()
};

const credentialOptions = config.MicrosoftAppType === "UserAssignedMsi" ? { ...tokenCredentials } : undefined;

// Create the main App instance - support both Managed Identity and Client Secret
const app = new App({
  ...credentialOptions,
  storage,
  // Fallback to client credentials if not using Managed Identity
  ...(config.MicrosoftAppType !== "UserAssignedMsi" && config.MicrosoftAppId && config.MicrosoftAppPassword ? {
    clientId: config.MicrosoftAppId,
    clientSecret: config.MicrosoftAppPassword,
    tenantId: config.MicrosoftAppTenantId
  } : {})
});

// Handle incoming messages
app.on('message', async ({ send, activity }) => {
  debugLog('APP', `🚀 Processing message: "${activity.text}"`);
  
  const userText = activity.text?.trim() || '';
  const message = userText.toLowerCase();
  
  // 1. Check for greetings (hi, hello, bonjour, salut)
  if (/^(hi|hello|bonjour|salut|hey)$/i.test(message)) {
    debugLog('COMMAND', '👋 Processing greeting command');
    await send(getWelcomeMessage());
    debugLog('RESPONSE', '✅ Sent welcome message');
    return;
  }
  
  // 2. Check for help commands
  if (/^(help|aide|\/help|\/aide|\?)$/i.test(message)) {
    debugLog('COMMAND', '❓ Processing help command');
    await send(getHelpMessage());
    debugLog('RESPONSE', '✅ Sent help message');
    return;
  }
  
  // 3. Handle "/clear" and "/reset" commands (unified)
  if (message === '/clear' || message === '/reset') {
    debugLog('COMMAND', `🧹 Processing clear command`);
    const conversationKey = `${activity.conversation.id}/${activity.from.id}`;
    
    // Clear conversation history
    storage.set(conversationKey, []);
    debugLog('STORAGE', '🗑️ Cleared conversation history');
    
    await send('L\'historique de la conversation a été effacé. / Conversation history cleared.');
    debugLog('RESPONSE', `✅ Sent clear confirmation`);
    return;
  }
  
  // 4. Content moderation - check for inappropriate content
  const moderationResult = moderateContent(userText);
  if (moderationResult.isInappropriate) {
    debugLog('MODERATION', `🚫 Blocked inappropriate content (category: ${moderationResult.category})`);
    await send(moderationResult.message!);
    debugLog('RESPONSE', '✅ Sent moderation rejection message');
    return;
  }

  // Get conversation history
  const conversationKey = `${activity.conversation.id}/${activity.from.id}`;
  let messages = storage.get(conversationKey) || [];

  // Apply Azure AI Foundry past_messages limit (11 messages)
  if (messages.length > azureAIFoundryParams.past_messages) {
    messages = messages.slice(-azureAIFoundryParams.past_messages);
    storage.set(conversationKey, messages);
    debugLog('STORAGE', `🔄 Applied past_messages limit: ${azureAIFoundryParams.past_messages}`);
  }

  debugLog('APP', `📝 Conversation key: ${conversationKey}`);

  try {
    // Get relevant context from the data source
    debugLog('APP', '🔍 Starting Azure Search query...');
    const contextData = await dataSource.renderContext(activity.text);
    debugLog('APP', `✅ Azure Search completed. Context length: ${contextData ? contextData.length : 0} characters`);
    
    if (contextData) {
      debugLog('APP', `📄 Context preview: ${contextData.substring(0, 200)}...`);
    } else {
      debugLog('APP', '❌ No context data found');
    }
    
    // Troncature intelligente du contexte pour éviter les limites de tokens
    let finalContextData = contextData;
    const MAX_CONTEXT_CHARS = 400000; // ~100k tokens approximativement
    
    if (contextData && contextData.length > MAX_CONTEXT_CHARS) {
      finalContextData = contextData.substring(0, MAX_CONTEXT_CHARS);
      const truncatedTokens = Math.round((contextData.length - MAX_CONTEXT_CHARS) / 4);
      debugLog('APP', `✂️  Context truncated: ${contextData.length} → ${finalContextData.length} chars (~${truncatedTokens} tokens saved)`);
      
      // Ajouter un message d'avertissement dans le contexte tronqué
      finalContextData += "\n\n[Note: Le contexte a été tronqué pour respecter les limites du modèle. Posez des questions plus spécifiques pour obtenir des informations plus détaillées.]";
    }
    
    // Build enhanced instructions that include context if available
    let enhancedInstructions = instructions;
    if (finalContextData) {
      enhancedInstructions += `\n\nAdditional Context \n${finalContextData}`;
    }

    // Skip OpenAI call if configuration is missing
    if (!config.azureOpenAIKey || !config.azureOpenAIEndpoint) {
      debugLog('CONFIG', `❌ Missing Azure OpenAI configuration`);
      await send('Configuration Azure OpenAI manquante. Veuillez configurer vos clés Azure OpenAI dans les variables d\'environnement.');
      return;
    }

    debugLog('APP', `🤖 Sending request to OpenAI model: ${config.azureOpenAIDeploymentName}`);
    let response;
    try {
      const prompt = new ChatPrompt({
        messages,
        instructions: enhancedInstructions,
        model: new OpenAIChatModel({
          model: config.azureOpenAIDeploymentName,
          apiKey: config.azureOpenAIKey,
          endpoint: config.azureOpenAIEndpoint,
          apiVersion: config.azureOpenAIDeploymentVersion || "2024-10-21"
        })
      });

      response = await prompt.send(activity.text);
      debugLog('OPENAI', `✅ Received response from Azure OpenAI with Azure AI Foundry parameters`);
    } catch (error: any) {
      if (error.status === 429) {
        debugLog('OPENAI', `⏳ Rate limit hit - status 429`);
        await send('⏳ Limite de débit Azure OpenAI atteinte. Veuillez patienter une minute avant de réessayer. Les comptes gratuits ont des limites de jetons par minute.');
        return;
      } else {
        debugLog('OPENAI', `❌ OpenAI error: ${error.message || error}`);
        throw error; // Re-throw other errors
      }
    }
    
    // Create response with AI generated indicator
    let result = null;
    
    try {
      result = JSON.parse(response.content || '{}');
      debugLog('RESPONSE', `📊 Parsed JSON response successfully`);
    } catch (error) {
      // Response is plain text, not JSON
      debugLog('RESPONSE', `📝 Processing plain text response`);
      const responseActivity = new MessageActivity(response.content || '').addAiGenerated();
      await send(responseActivity);
      
      // Store updated conversation history
      storage.set(conversationKey, messages);
      debugLog('STORAGE', `💾 Saved conversation history`);
      return;
    }

    // Process citations if they exist in the parsed response
    const citations: any[] = [];
    let position = 1;
    let content = "";

    if (result && result.results && result.results.length > 0) {
      debugLog('CITATIONS', `📚 Processing ${result.results.length} citation results`);
      result.results.forEach((contentItem: any) => {
        if (contentItem.citationTitle) {
          const citation = {
            name: contentItem.citationTitle || `Document #${position}`,
            abstract: contentItem.citationContent ?? `Information from ${contentItem.citationTitle}`,
          };
          
          content += `${contentItem.answer}[${position}]<br>`;
          
          position++;
          citations.push(citation);
        } else {
          // Add content without citation
          content += `${contentItem.answer}<br>`;
        }
      });
    }
    
    const responseActivity = new MessageActivity(content || response.content).addAiGenerated();
    
    // Add citations from parsed response
    if (citations.length > 0) {
      debugLog('CITATIONS', `📎 Added ${citations.length} citations to response`);
      citations.forEach((citation, index) => {
        responseActivity.addCitation(index + 1, {
          name: citation.name,
          abstract: `${citation.abstract}`
        });
      });
    }
    
    await send(responseActivity);
    debugLog('RESPONSE', `✅ Sent response with ${citations.length} citations`);
    storage.set(conversationKey, messages);
    debugLog('STORAGE', `💾 Updated conversation history`);

  } catch (error) {
    debugLog('ERROR', `❌ Error processing message: ${error}`);
    console.error('Error processing message:', error);
    await send('Sorry, I encountered an error while processing your message.');
  }
});

export default app;
