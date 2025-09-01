package com.cotechnoe.teamsrag.indexconfigurator.azure;

import com.cotechnoe.teamsrag.indexconfigurator.model.IndexSchema;
import com.cotechnoe.teamsrag.indexconfigurator.model.FieldDefinition;

import com.azure.core.credential.AzureKeyCredential;
import com.azure.search.documents.indexes.SearchIndexClient;
import com.azure.search.documents.indexes.SearchIndexClientBuilder;
import com.azure.search.documents.indexes.models.SearchIndex;
import com.azure.search.documents.indexes.models.SearchField;

import java.util.List;
import java.util.ArrayList;

/**
 * Reads Azure Search index structure using official Azure Search Java SDK.
 * Much more robust than REST API calls, with proper error handling and type safety.
 */
public class AzureSearchIndexReader {
    
    /**
     * Reads index schema from Azure Search using official Java SDK.
     * 
     * @param endpoint Azure Search endpoint (e.g., https://your-search-service.search.windows.net)
     * @param indexName Index name (e.g., legis-qc-index-01)
     * @param apiKey Azure Search admin key
     * @return IndexSchema with real field definitions from Azure Search
     */
    public IndexSchema readIndexSchema(String endpoint, String indexName, String apiKey) throws AzureSearchConnectionException {
        if (endpoint == null || !endpoint.startsWith("https://")) {
            throw new AzureSearchConnectionException("Invalid endpoint: " + endpoint);
        }
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new AzureSearchConnectionException("API key is required");
        }
        if (indexName == null || indexName.trim().isEmpty()) {
            throw new AzureSearchConnectionException("Index name is required");
        }
        
        try {
            // 🚀 Create Azure Search Index Client using official SDK
            SearchIndexClient indexClient = new SearchIndexClientBuilder()
                .endpoint(endpoint)
                .credential(new AzureKeyCredential(apiKey))
                .buildClient();
            
            System.out.println("📡 Connecting to Azure Search with SDK...");
            
            // 📖 Get index definition using official SDK
            SearchIndex searchIndex = indexClient.getIndex(indexName);
            
            System.out.println("✅ Successfully retrieved index: " + searchIndex.getName());
            
            // 🔄 Convert Azure Search fields to our IndexSchema
            List<FieldDefinition> fields = new ArrayList<>();
            
            for (SearchField searchField : searchIndex.getFields()) {
                FieldDefinition field = convertSearchFieldToFieldDefinition(searchField);
                fields.add(field);
                
                // Log field details for debugging
                System.out.println("📋 Field parsed: " + field.getName() + 
                    " (" + field.getType() + ") - " +
                    "searchable:" + field.isSearchable() + 
                    ", filterable:" + field.isFilterable() + 
                    ", key:" + field.isKey() + 
                    ", vector:" + field.isVector());
            }
            
            System.out.println("✅ Successfully parsed " + fields.size() + 
                " fields from Azure Search index: " + indexName);
            
            return new IndexSchema(indexName, fields);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to read Azure Search index: " + e.getMessage());
            throw new AzureSearchConnectionException("Failed to connect to Azure Search: " + e.getMessage(), e);
        }
    }
    
    /**
     * Converts Azure SDK SearchField to our FieldDefinition.
     */
    private FieldDefinition convertSearchFieldToFieldDefinition(SearchField searchField) {
        // Extract basic properties
        String name = searchField.getName();
        String type = searchField.getType().toString();
        boolean isKey = Boolean.TRUE.equals(searchField.isKey());
        boolean isSearchable = Boolean.TRUE.equals(searchField.isSearchable());
        
        // Detect vector fields based on type and dimensions
        boolean isVector = type.startsWith("Collection(Edm.Single)") || 
                          type.contains("Vector") ||
                          searchField.getVectorSearchDimensions() != null;
        
        // Create FieldDefinition using constructor
        FieldDefinition field = new FieldDefinition(name, type, isKey, isSearchable, isVector);
        
        // Set extended properties using setters
        field.setFilterable(Boolean.TRUE.equals(searchField.isFilterable()));
        field.setSortable(Boolean.TRUE.equals(searchField.isSortable()));
        field.setFacetable(Boolean.TRUE.equals(searchField.isFacetable()));
        
        // Retrievable property - default to true since most fields are retrievable
        field.setRetrievable(true);
        
        // Handle vector dimensions
        if (isVector && searchField.getVectorSearchDimensions() != null) {
            field.setDimensions(searchField.getVectorSearchDimensions());
        }
        
        return field;
    }
    
    /**
     * Legacy method - maintains backward compatibility.
     * @deprecated Use readIndexSchema(String, String, String) instead
     */
    @Deprecated
    public IndexSchema readIndexSchema(String endpoint, String indexName) throws AzureSearchConnectionException {
        throw new AzureSearchConnectionException("API key is required for Azure Search access");
    }
}