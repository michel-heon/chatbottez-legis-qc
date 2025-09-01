/**
 * ⚠️ ATTENTION - FICHIER GÉNÉRÉ AUTOMATIQUEMENT ⚠️
 * 
 * 🚫 NE PAS ÉDITER CE FICHIER MANUELLEMENT
 * 
 * Ce fichier est généré automatiquement à partir de l'index Azure Search.
 * Toute modification manuelle sera ÉCRASÉE lors de la prochaine génération.
 * 
 * 🔄 Pour modifier ce fichier :
 * 1. Modifiez les templates dans : src/main/resources/teams-src/
 * 2. Ou modifiez la structure de l'index Azure Search : legis-qc-index-full-03
 * 3. Puis exécutez : make azure-config-generate
 * 
 * 📊 Généré depuis l'index : legis-qc-index-full-03
 * 📅 Date de génération : 2025-09-01 12:09:32
 * 📋 Nombre de champs : 17
 */

import { TeamsAdapter } from "@microsoft/teams-ai";

// This bot's main dialog.
import config from "./config";

const adapter = new TeamsAdapter(config);

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
  // This check writes out errors to console log .vs. app insights.
  // NOTE: In production environment, you should consider logging this to Azure
  //       application insights.
  console.error(`\n [onTurnError] unhandled error: ${error}`);

  // Only send error message for user messages, not for other message types so the agent doesn't spam a channel or chat.
  if (context.activity.type === "message") {
    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
      "OnTurnError Trace",
      `${error}`,
      "https://www.botframework.com/schemas/error",
      "TurnError"
    );

    // Send a message to the user
    await context.sendActivity("The agent encountered an error or bug.");
    await context.sendActivity("To continue to run this agent, please fix the agent source code.");
  }
};

// Set the onTurnError for the singleton TeamsAdapter.
adapter.onTurnError = onTurnErrorHandler;

export default adapter;
