const { startServer } = require("@microsoft/agents-hosting-express");
const { agentApp } = require("./agent");
startServer(agentApp);
// Trigger reload - Thu, Dec 11, 2025 12:55:18 PM
