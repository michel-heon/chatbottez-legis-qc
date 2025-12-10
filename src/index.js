const restify = require('restify');
const {
  CloudAdapter,
  ConfigurationServiceClientCredentialFactory,
  MemoryStorage,
  ConversationState,
  UserState,
} = require('botbuilder');
const LegisQuebecAgent = require('./agent');
const config = require('./config');

// Create HTTP server
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

const PORT = process.env.PORT || process.env.port || 3978;

server.listen(PORT, () => {
  console.log(`\n🚀 Légis Québec Custom Engine Agent`);
  console.log(`📡 Server listening on port ${PORT}`);
  console.log(`🔗 Endpoint: http://localhost:${PORT}/api/messages`);
});

// Create bot adapter
const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId: config.MicrosoftAppId,
  MicrosoftAppPassword: config.MicrosoftAppPassword,
  MicrosoftAppType: config.MicrosoftAppType,
  MicrosoftAppTenantId: config.MicrosoftAppTenantId,
});

const adapter = new CloudAdapter(credentialsFactory);

// Error handling
adapter.onTurnError = async (context, error) => {
  console.error(`\n❌ [onTurnError] unhandled error: ${error}`);
  console.error(error.stack);

  // Send error message to user
  await context.sendActivity('❌ Une erreur est survenue. Veuillez réessayer.');
  
  // Send trace activity for Bot Framework Emulator
  await context.sendTraceActivity(
    'OnTurnError Trace',
    `${error}`,
    'https://www.botframework.com/schemas/error',
    'TurnError'
  );
};

// Create storage and conversation state
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// Initialize agent
const agent = new LegisQuebecAgent();

// Listen for incoming requests
server.post('/api/messages', async (req, res) => {
  await adapter.process(req, res, async (context) => {
    // Handle different activity types
    if (context.activity.type === 'message') {
      const userMessage = context.activity.text;

      // Get conversation history from state
      const conversationData = conversationState.createProperty('conversationData');
      const history = (await conversationData.get(context, { history: [] })).history;

      try {
        // Send typing indicator
        await context.sendActivity({ type: 'typing' });

        // Process message with agent
        const response = await agent.processMessage(userMessage, history);

        // Send response
        await context.sendActivity(response.content);

        // Send citations as Adaptive Card (if any)
        if (response.citations && response.citations.length > 0) {
          const citationsCard = agent.formatCitationsCard(response.citations);
          if (citationsCard) {
            await context.sendActivity({
              type: 'message',
              attachments: [
                {
                  contentType: 'application/vnd.microsoft.card.adaptive',
                  content: citationsCard,
                },
              ],
            });
          }
        }

        // Update conversation history (keep last 10 messages)
        history.push(
          { role: 'user', content: userMessage },
          { role: 'assistant', content: response.content }
        );
        
        if (history.length > 20) {
          history.splice(0, history.length - 20);
        }

        await conversationData.set(context, { history });

      } catch (error) {
        console.error('Error processing message:', error);
        await context.sendActivity(
          '❌ Désolé, une erreur est survenue lors du traitement de votre demande. Veuillez réessayer.'
        );
      }

      // Save state changes
      await conversationState.saveChanges(context);
      await userState.saveChanges(context);

    } else if (context.activity.type === 'conversationUpdate') {
      // Handle welcome message
      if (context.activity.membersAdded) {
        for (const member of context.activity.membersAdded) {
          if (member.id !== context.activity.recipient.id) {
            const welcomeMessage = `👋 Bonjour! Je suis **Légis Québec**, votre conseiller juridique virtuel spécialisé dans les lois et règlements du Québec.

Je peux vous aider à :
- 📚 Consulter les lois et règlements québécois
- ⚖️ Comprendre vos droits et obligations
- 📝 Obtenir des informations juridiques précises

**Comment puis-je vous aider aujourd'hui?**

⚠️ *Mes réponses sont à titre informatif seulement et ne constituent pas un avis juridique. Pour toute situation particulière, consultez un avocat.*`;

            await context.sendActivity(welcomeMessage);
          }
        }
      }
    }
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

console.log('✅ Bot initialized and ready');
