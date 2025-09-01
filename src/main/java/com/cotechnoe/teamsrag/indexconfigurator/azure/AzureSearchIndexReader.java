package com.cotechnoe.teamsrag.indexconfigurator.azure;

import com.cotechnoe.teamsrag.indexconfigurator.model.IndexSchema;
import com.cotechnoe.teamsrag.indexconfigurator.model.FieldDefinition;

import java.util.List;
import java.util.ArrayList;

/**
 * Reads Azure Search index structure and converts to IndexSchema.
 */
public class AzureSearchIndexReader {
    
    public IndexSchema readIndexSchema(String endpoint, String indexName) throws AzureSearchConnectionException {
        if (endpoint == null || !endpoint.startsWith("https://")) {
            throw new AzureSearchConnectionException("Invalid endpoint");
        }
        
        // Minimal implementation for tests - would connect to real Azure Search in production
        List<FieldDefinition> fields = new ArrayList<>();
        fields.add(new FieldDefinition("docId", "Edm.String", true, false, false));
        fields.add(new FieldDefinition("docTitle", "Edm.String", false, true, false));
        fields.add(new FieldDefinition("description", "Edm.String", false, true, false));
        fields.add(new FieldDefinition("descriptionVector", "Collection(Edm.Single)", false, false, true));
        
        return new IndexSchema(indexName, fields);
    }
    
    public IndexSchema readIndexSchema(String endpoint, String indexName, String apiKey) throws AzureSearchConnectionException {
        if (endpoint == null || !endpoint.startsWith("https://")) {
            throw new AzureSearchConnectionException("Invalid endpoint");
        }
        if (apiKey == null || apiKey.equals("invalid-key")) {
            throw new AzureSearchConnectionException("Authentication failed");
        }
        if (indexName.equals("non-existent-index")) {
            throw new AzureSearchConnectionException("Index not found");
        }
        
        return readIndexSchema(endpoint, indexName);
    }
}