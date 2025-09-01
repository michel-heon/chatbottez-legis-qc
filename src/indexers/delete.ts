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

import { AzureKeyCredential, SearchIndexClient } from "@azure/search-documents";
import { deleteIndex } from "./utils";
import config from "../config";

const index = config.azureSearchIndexName;
const searchApiKey = process.argv[2];
if (!searchApiKey) {
  throw new Error("Missing input Azure AI Search Key");
}
const searchApiEndpoint = process.env.AZURE_SEARCH_ENDPOINT!;
const credentials = new AzureKeyCredential(searchApiKey);

const searchIndexClient = new SearchIndexClient(searchApiEndpoint, credentials);
deleteIndex(searchIndexClient, index);