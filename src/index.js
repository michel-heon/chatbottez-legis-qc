// Import required packages
const express = require("express");

// This agent's adapter
const adapter = require("./adapter");

// This agent's main dialog.
const app = require("./app/app");

// Create express application.
const expressApp = express();
expressApp.use(express.json());

const server = expressApp.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nBot Started, ${expressApp.name} listening to`, server.address());
});

// Listen for incoming requests.
expressApp.post("/api/messages", async (req, res) => {
  // Route received a request to adapter for processing
  await adapter.process(req, res, async (context) => {
    // Override the sendActivity method to clean messages
    const originalSendActivity = context.sendActivity.bind(context);
    context.sendActivity = async (message) => {
      if (context.activity.channelId === 'telegram') {
        if (typeof message === 'string') {
          message = message.replace(/[\[\]()*_~`]/g, '');
        } else if (message.text) {
          message.text = message.text.replace(/[\[\]()*_~`]/g, '');
        }
      }
      return originalSendActivity(message);
    };

    // Start sending "je réfléchis" messages every 5 seconds
    const intervalId = setInterval(async () => {
      await context.sendActivity("je réfléchis");
    }, 5000);

    try {
      // Dispatch to application for routing
      await app.run(context);
    } catch (error) {
      // Clean the error message to avoid formatting issues
      const cleanErrorMessage = error.message.replace(/[\[\]()*_~`]/g, '');
      // Send error message to the user with the cleaned error description
      await context.sendActivity(`Une erreur est survenue : ${cleanErrorMessage}. Veuillez réessayer plus tard.`);
      console.error(`\n [onTurnError] unhandled error: ${error}`);
    } finally {
      // Clear the interval once processing is complete
      clearInterval(intervalId);
    }
  });
});