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

// Import required packages
import express from "express";

// This bot's adapter
import adapter from "./adapter";

// This bot's main dialog.
import app from "./app/app";

// Create express application.
const expressApp = express();
expressApp.use(express.json());

const server = expressApp.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nAgent started, ${expressApp.name} listening to`, server.address());
});

// Listen for incoming requests.
expressApp.post("/api/messages", async (req, res) => {
  // Route received a request to adapter for processing
  await adapter.process(req, res as any, async (context) => {
    // Dispatch to application for routing
    await app.run(context);
  });
});
