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
  console.log(`\nAgent started, ${expressApp.name} listening to`, server.address());
});

// Listen for incoming requests.
//expressApp.post("/api/messages", async (req, res) => {
//  // Route received a request to adapter for processing
//  await adapter.process(req, res, async (context) => {
//    // Dispatch to application for routing
//    await app.run(context);
//  });
//});
expressApp.post("/api/messages", async (req, res) => {
  await adapter.process(req, res, async (context) => {
    const text = (context.activity.text || "").trim().toLowerCase();
    if (text === "clear") {
      // 1) Purge l’historique de la conversation
      if (adapter.conversationState) {
        await adapter.conversationState.clear(context);
        await adapter.conversationState.saveChanges(context, true);
      }
      // 2) Confirmation à l’utilisateur
      await context.sendActivity("✅ Conversation réinitialisée ! Comment puis-je vous aider maintenant ?");
    } else {
      // comportement normal
      await app.run(context);
    }
  });
});
