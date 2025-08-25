const config = {
  MicrosoftAppId: process.env.BOT_ID,
  MicrosoftAppType: process.env.BOT_TYPE,
  MicrosoftAppTenantId: process.env.BOT_TENANT_ID,
  MicrosoftAppPassword: process.env.BOT_PASSWORD,
  azureOpenAIKey: process.env.SECRET_AZURE_OPENAI_API_KEY,
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureOpenAIDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
  azureOpenAIEmbeddingDeploymentName: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME,
  azureSearchKey: process.env.SECRET_AZURE_SEARCH_KEY,
  azureSearchEndpoint: process.env.AZURE_SEARCH_ENDPOINT,
  azureSearchIndexName: process.env.AZURE_SEARCH_INDEX_NAME || "my-documents",
  // Data Sources Configuration
  externalDataSourcePath: process.env.EXTERNAL_DATA_SOURCE_PATH || "/media/psf/Developpement/00-GIT/cotechnoe-kb-legis-qc/etl",
};

export default config;
