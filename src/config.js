const config = {
  // Azure OpenAI Configuration
  azureOpenAIKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureOpenAIDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
  azureOpenAIEmbeddingDeploymentName: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME,

  // Azure AI Search Configuration
  azureSearchEndpoint: process.env.AZURE_SEARCH_ENDPOINT,
  azureSearchKey: process.env.AZURE_SEARCH_KEY,
  azureSearchStrictness: parseInt(process.env.AZURE_SEARCH_STRICTNESS || '2', 10),
  azureSearchRetrievedDocuments: parseInt(process.env.AZURE_SEARCH_RETRIEVED_DOCUMENTS || '20', 10),
  azureSearchLimitToDataContent: process.env.AZURE_SEARCH_LIMIT_TO_DATA_CONTENT === 'true',

  // Debug mode
  debug: process.env.DEBUG === 'true',
};

module.exports = config;
