const { MemoryStorage, MessageFactory } = require("botbuilder");
const path = require("path");
const config = require("../config");

// See https://aka.ms/teams-ai-library to learn more about the Teams AI library.
const { Application, ActionPlanner, OpenAIModel, PromptManager } = require("@microsoft/teams-ai");

// Create AI components
const model = new OpenAIModel({
    azureApiKey: config.azureOpenAIKey,
    azureDefaultDeployment: config.azureOpenAIDeploymentName,
    azureEndpoint: config.azureOpenAIEndpoint,
    azureApiVersion: '2024-10-21',
    useSystemMessages: true,
    logRequests: true,
});
const prompts = new PromptManager({
    promptsFolder: path.join(__dirname, "../prompts"),
});
const planner = new ActionPlanner({
    model,
    prompts,
    defaultPrompt: "chat",
});

// Define storage and application
const storage = new MemoryStorage();
const app = new Application({
    storage,
    ai: {
        planner,
        enable_feedback_loop: true,
        mute: true,
    },
});

app.feedbackLoop(async (context, state, feedbackLoopData) => {
    //add custom feedback process logic here
    console.log("Your feedback is " + JSON.stringify(context.activity.value));
});

// Handler pour la commande "/clear"
app.message(/^\/clear$/i, async (context, state) => {
    state.conversation.history = [];
    await context.sendActivity("L'historique de la conversation a été effacé.");
});

// Handler pour la commande "/reset"
app.message(/^\/reset$/i, async (context, state) => {
    for (const key of Object.keys(state.conversation)) {
        delete state.conversation[key];
    }
    await context.sendActivity("La conversation a été complètement réinitialisée.");
});

module.exports = app;
