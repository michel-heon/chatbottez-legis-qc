const { AzureOpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * Custom Engine Agent for Légis Québec
 * Implements RAG with Azure OpenAI Extensions for Azure AI Search
 */
class LegisQuebecAgent {
  constructor() {
    // Initialize Azure OpenAI client
    this.client = new AzureOpenAI({
      apiKey: config.azureOpenAIKey,
      endpoint: config.azureOpenAIEndpoint,
      apiVersion: config.azureOpenAIDeploymentVersion,
    });

    // Load system instructions
    this.systemPrompt = fs.readFileSync(
      path.join(__dirname, 'instructions.txt'),
      'utf-8'
    );

    // RAG configuration with Azure AI Search extension
    this.ragConfig = {
      deployment: config.azureOpenAIDeploymentName,
      azureExtensionOptions: {
        extensions: [
          {
            type: 'azure_search',
            parameters: {
              endpoint: config.azureSearchEndpoint,
              key: config.azureSearchKey,
              indexName: 'legis-quebec-index', // TODO: Make configurable
              queryType: 'vector_semantic_hybrid',
              inScope: true,
              topNDocuments: 10,
              strictness: 3, // Microsoft default (1-5)
              embeddingDeployment: config.azureOpenAIEmbeddingDeploymentName,
            },
          },
        ],
      },
    };

    console.log('✅ LegisQuebecAgent initialized');
    console.log(`   📊 Deployment: ${config.azureOpenAIDeploymentName}`);
    console.log(`   🔍 Search Index: legis-quebec-index`);
    console.log(`   🎯 RAG Strictness: 3 (balanced)`);
  }

  /**
   * Process a user message with RAG
   * @param {string} userMessage - The user's question
   * @param {Object} conversationHistory - Previous messages (optional)
   * @returns {Promise<Object>} Response with content and citations
   */
  async processMessage(userMessage, conversationHistory = []) {
    console.log(`\n🔍 Processing message: "${userMessage.substring(0, 100)}..."`);

    // Build messages array
    const messages = [
      {
        role: 'system',
        content: this.systemPrompt,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    try {
      // Call Azure OpenAI with RAG extensions
      const response = await this.client.chat.completions.create({
        model: this.ragConfig.deployment,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false, // We'll implement streaming in Phase 4
        ...this.ragConfig.azureExtensionOptions,
      });

      console.log('✅ Response received from Azure OpenAI');

      // Extract response and citations
      const choice = response.choices[0];
      const content = choice.message.content;
      const citations = this.extractCitations(choice.message);

      console.log(`   📝 Response length: ${content.length} chars`);
      console.log(`   📚 Citations found: ${citations.length}`);

      return {
        content,
        citations,
        finishReason: choice.finish_reason,
      };
    } catch (error) {
      console.error('❌ Error processing message:', error.message);
      throw error;
    }
  }

  /**
   * Process a user message with streaming support
   * @param {string} userMessage - The user's question
   * @param {Object} conversationHistory - Previous messages (optional)
   * @param {Function} onChunk - Callback for each chunk
   * @returns {Promise<Object>} Final response with citations
   */
  async processMessageStreaming(userMessage, conversationHistory = [], onChunk) {
    console.log(`\n🔍 Processing message (streaming): "${userMessage.substring(0, 100)}..."`);

    const messages = [
      {
        role: 'system',
        content: this.systemPrompt,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    try {
      const stream = await this.client.chat.completions.create({
        model: this.ragConfig.deployment,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
        ...this.ragConfig.azureExtensionOptions,
      });

      let fullContent = '';
      let citations = [];

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        
        if (delta?.content) {
          fullContent += delta.content;
          
          // Call chunk callback
          if (onChunk) {
            onChunk(delta.content);
          }
        }

        // Extract citations from context (if available)
        if (chunk.choices[0]?.message?.context) {
          citations = this.extractCitations(chunk.choices[0].message);
        }
      }

      console.log('✅ Streaming completed');
      console.log(`   📝 Total response: ${fullContent.length} chars`);
      console.log(`   📚 Citations: ${citations.length}`);

      return {
        content: fullContent,
        citations,
      };
    } catch (error) {
      console.error('❌ Error streaming message:', error.message);
      throw error;
    }
  }

  /**
   * Extract citations from Azure OpenAI response
   * @param {Object} message - The message object from response
   * @returns {Array} Array of citation objects
   * @private
   */
  extractCitations(message) {
    const citations = [];

    // Azure OpenAI Extensions includes citations in message.context
    if (message.context?.citations) {
      for (const citation of message.context.citations) {
        citations.push({
          title: citation.title || 'Document juridique',
          content: citation.content,
          url: citation.url || null,
          filepath: citation.filepath || null,
        });
      }
    }

    return citations;
  }

  /**
   * Format citations for Copilot Adaptive Card
   * @param {Array} citations - Array of citation objects
   * @returns {Object} Adaptive Card for citations
   */
  formatCitationsCard(citations) {
    if (!citations || citations.length === 0) {
      return null;
    }

    const citationItems = citations.map((citation, index) => ({
      type: 'TextBlock',
      text: `**[${index + 1}] ${citation.title}**`,
      wrap: true,
      size: 'small',
    }));

    return {
      type: 'AdaptiveCard',
      version: '1.5',
      body: [
        {
          type: 'TextBlock',
          text: '📚 Sources consultées',
          weight: 'bolder',
          size: 'medium',
        },
        ...citationItems,
      ],
    };
  }
}

module.exports = LegisQuebecAgent;
