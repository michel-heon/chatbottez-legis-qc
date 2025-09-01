package com.cotechnoe.teamsrag.indexconfigurator.azure;

import com.cotechnoe.teamsrag.indexconfigurator.model.IndexSchema;
import com.cotechnoe.teamsrag.indexconfigurator.model.FieldDefinition;

import java.util.List;
import java.util.ArrayList;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.io.IOException;
import java.time.Duration;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Reads Azure Search index structure and converts to IndexSchema.
 * Implements real-time Azure Search REST API calls to retrieve index schema.
 */
public class AzureSearchIndexReader {
    
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    
    public AzureSearchIndexReader() {
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Reads index schema from Azure Search using REST API.
     * 
     * @param endpoint Azure Search endpoint (e.g., https://search-cotechnoe-ai.search.windows.net)
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
            // Build Azure Search REST API URL
            String apiUrl = String.format("%s/indexes/%s?api-version=2023-11-01", 
                                        endpoint.replaceAll("/$", ""), indexName);
            
            // Create HTTP request with authentication
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header("api-key", apiKey)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .GET()
                .timeout(Duration.ofSeconds(30))
                .build();
            
            // Execute request
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            // Handle HTTP errors
            if (response.statusCode() == 401) {
                throw new AzureSearchConnectionException("Authentication failed - invalid API key");
            } else if (response.statusCode() == 404) {
                throw new AzureSearchConnectionException("Index not found: " + indexName);
            } else if (response.statusCode() != 200) {
                throw new AzureSearchConnectionException("Azure Search API error: " + response.statusCode() + " - " + response.body());
            }
            
            // Parse JSON response
            JsonNode indexJson = objectMapper.readTree(response.body());
            
            // Extract index name
            String actualIndexName = indexJson.get("name").asText();
            
            // Parse fields array
            JsonNode fieldsArray = indexJson.get("fields");
            if (fieldsArray == null || !fieldsArray.isArray()) {
                throw new AzureSearchConnectionException("Invalid index structure - no fields array found");
            }
            
            List<FieldDefinition> fields = new ArrayList<>();
            
            for (JsonNode fieldNode : fieldsArray) {
                String name = fieldNode.get("name").asText();
                String type = fieldNode.get("type").asText();
                boolean isKey = fieldNode.has("key") && fieldNode.get("key").asBoolean();
                boolean isSearchable = fieldNode.has("searchable") && fieldNode.get("searchable").asBoolean();
                boolean isVector = type.startsWith("Collection(Edm.Single)");
                
                // Extract additional properties
                boolean isFilterable = fieldNode.has("filterable") && fieldNode.get("filterable").asBoolean();
                boolean isRetrievable = fieldNode.has("retrievable") && fieldNode.get("retrievable").asBoolean();
                boolean isSortable = fieldNode.has("sortable") && fieldNode.get("sortable").asBoolean();
                boolean isFacetable = fieldNode.has("facetable") && fieldNode.get("facetable").asBoolean();
                
                // Create FieldDefinition with extended properties
                FieldDefinition field = new FieldDefinition(name, type, isKey, isSearchable, isVector);
                field.setFilterable(isFilterable);
                field.setRetrievable(isRetrievable);
                field.setSortable(isSortable);
                field.setFacetable(isFacetable);
                
                // Handle vector dimensions
                if (isVector && fieldNode.has("dimensions")) {
                    field.setDimensions(fieldNode.get("dimensions").asInt());
                }
                
                fields.add(field);
                
                System.out.println("📋 Field parsed: " + name + " (" + type + ") - " +
                                 "searchable:" + isSearchable + ", filterable:" + isFilterable + 
                                 ", key:" + isKey + ", vector:" + isVector);
            }
            
            System.out.println("✅ Successfully parsed " + fields.size() + " fields from Azure Search index: " + actualIndexName);
            
            return new IndexSchema(actualIndexName, fields);
            
        } catch (IOException | InterruptedException e) {
            throw new AzureSearchConnectionException("Failed to connect to Azure Search: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new AzureSearchConnectionException("Error parsing Azure Search response: " + e.getMessage(), e);
        }
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