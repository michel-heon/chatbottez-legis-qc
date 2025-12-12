const { startServer } = require("@microsoft/agents-hosting-express");
const { agentApp } = require("./agent");

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
  console.error('Promise:', promise);
});

process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error);
});

startServer(agentApp);
// Trigger reload - Thu, Dec 11, 2025 12:55:18 PM
