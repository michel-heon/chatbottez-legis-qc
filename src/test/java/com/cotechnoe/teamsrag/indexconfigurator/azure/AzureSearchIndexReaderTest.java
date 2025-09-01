package com.cotechnoe.teamsrag.indexconfigurator.azure;

import com.cotechnoe.teamsrag.indexconfigurator.model.IndexSchema;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * TDD Tests for AzureSearchIndexReader.
 * Focuses on reading Azure Search index structure and converting to IndexSchema.
 */
@DisplayName("AzureSearchIndexReader")
class AzureSearchIndexReaderTest {

    private AzureSearchIndexReader indexReader;

    @BeforeEach
    void setUp() {
        indexReader = new AzureSearchIndexReader();
    }

    @Test
    @DisplayName("should read index schema from Azure Search endpoint")
    void shouldReadIndexSchemaFromAzureSearchEndpoint() throws Exception {
        // Given
        String endpoint = "https://test.search.windows.net";
        String indexName = "test-index";
        String apiKey = "test-key";
        
        // When
        IndexSchema schema = indexReader.readIndexSchema(endpoint, indexName, apiKey);
        
        // Then
        assertThat(schema).isNotNull();
        assertThat(schema.getIndexName()).isEqualTo(indexName);
    }

    @Test
    @DisplayName("should fail with invalid endpoint")
    void shouldFailWithInvalidEndpoint() {
        // Given
        String invalidEndpoint = "invalid-url";
        String indexName = "test-index";
        String apiKey = "test-key";
        
        // When & Then
        assertThatThrownBy(() -> 
            indexReader.readIndexSchema(invalidEndpoint, indexName, apiKey))
            .isInstanceOf(AzureSearchConnectionException.class)
            .hasMessageContaining("Invalid endpoint");
    }

    @Test
    @DisplayName("should fail with invalid API key")
    void shouldFailWithInvalidApiKey() {
        // Given
        String endpoint = "https://test.search.windows.net";
        String indexName = "test-index";
        String invalidApiKey = "invalid-key";
        
        // When & Then
        assertThatThrownBy(() -> 
            indexReader.readIndexSchema(endpoint, indexName, invalidApiKey))
            .isInstanceOf(AzureSearchConnectionException.class)
            .hasMessageContaining("Authentication failed");
    }

    @Test
    @DisplayName("should fail with non-existent index")
    void shouldFailWithNonExistentIndex() {
        // Given
        String endpoint = "https://test.search.windows.net";
        String nonExistentIndex = "non-existent-index";
        String apiKey = "test-key";
        
        // When & Then
        assertThatThrownBy(() -> 
            indexReader.readIndexSchema(endpoint, nonExistentIndex, apiKey))
            .isInstanceOf(AzureSearchConnectionException.class)
            .hasMessageContaining("Index not found");
    }

    @Test
    @DisplayName("should extract field definitions from index")
    void shouldExtractFieldDefinitionsFromIndex() throws Exception {
        // Given
        String endpoint = "https://test.search.windows.net";
        String indexName = "test-index";
        String apiKey = "test-key";
        
        // When
        IndexSchema schema = indexReader.readIndexSchema(endpoint, indexName, apiKey);
        
        // Then
        assertThat(schema.getFields()).isNotEmpty();
        assertThat(schema.getFields()).allSatisfy(field -> {
            assertThat(field.getName()).isNotBlank();
            assertThat(field.getType()).isNotNull();
        });
    }
}