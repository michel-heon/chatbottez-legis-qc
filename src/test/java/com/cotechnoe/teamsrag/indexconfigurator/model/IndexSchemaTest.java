package com.cotechnoe.teamsrag.indexconfigurator.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * TDD Tests for IndexSchema.
 * Represents the schema of an Azure Search index.
 */
@DisplayName("IndexSchema")
class IndexSchemaTest {

    @Test
    @DisplayName("should create index schema with name and fields")
    void shouldCreateIndexSchemaWithNameAndFields() {
        // Given
        List<FieldDefinition> fields = List.of(
            new FieldDefinition("docId", "Edm.String", true, false, false),
            new FieldDefinition("title", "Edm.String", false, true, false)
        );
        
        // When
        IndexSchema schema = new IndexSchema("test-index", fields);
        
        // Then
        assertThat(schema.getIndexName()).isEqualTo("test-index");
        assertThat(schema.getFields()).hasSize(2);
        assertThat(schema.getFields()).containsExactlyElementsOf(fields);
    }

    @Test
    @DisplayName("should get key field")
    void shouldGetKeyField() {
        // Given
        FieldDefinition keyField = new FieldDefinition("docId", "Edm.String", true, false, false);
        FieldDefinition regularField = new FieldDefinition("title", "Edm.String", false, true, false);
        List<FieldDefinition> fields = List.of(keyField, regularField);
        IndexSchema schema = new IndexSchema("test-index", fields);
        
        // When
        FieldDefinition result = schema.getKeyField();
        
        // Then
        assertThat(result).isEqualTo(keyField);
        assertThat(result.isKey()).isTrue();
    }

    @Test
    @DisplayName("should get searchable fields")
    void shouldGetSearchableFields() {
        // Given
        FieldDefinition keyField = new FieldDefinition("docId", "Edm.String", true, false, false);
        FieldDefinition searchableField1 = new FieldDefinition("title", "Edm.String", false, true, false);
        FieldDefinition searchableField2 = new FieldDefinition("content", "Edm.String", false, true, false);
        FieldDefinition vectorField = new FieldDefinition("vector", "Collection(Edm.Single)", false, false, true);
        
        List<FieldDefinition> fields = List.of(keyField, searchableField1, searchableField2, vectorField);
        IndexSchema schema = new IndexSchema("test-index", fields);
        
        // When
        List<FieldDefinition> searchableFields = schema.getSearchableFields();
        
        // Then
        assertThat(searchableFields).hasSize(2);
        assertThat(searchableFields).containsExactly(searchableField1, searchableField2);
    }

    @Test
    @DisplayName("should get vector fields")
    void shouldGetVectorFields() {
        // Given
        FieldDefinition keyField = new FieldDefinition("docId", "Edm.String", true, false, false);
        FieldDefinition vectorField1 = new FieldDefinition("contentVector", "Collection(Edm.Single)", false, false, true);
        FieldDefinition vectorField2 = new FieldDefinition("titleVector", "Collection(Edm.Single)", false, false, true);
        
        List<FieldDefinition> fields = List.of(keyField, vectorField1, vectorField2);
        IndexSchema schema = new IndexSchema("test-index", fields);
        
        // When
        List<FieldDefinition> vectorFields = schema.getVectorFields();
        
        // Then
        assertThat(vectorFields).hasSize(2);
        assertThat(vectorFields).containsExactly(vectorField1, vectorField2);
    }

    @Test
    @DisplayName("should fail with null or empty index name")
    void shouldFailWithNullOrEmptyIndexName() {
        // Given
        List<FieldDefinition> fields = List.of(
            new FieldDefinition("docId", "Edm.String", true, false, false)
        );
        
        // When & Then
        assertThatThrownBy(() -> 
            new IndexSchema(null, fields))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Index name cannot be null or empty");

        assertThatThrownBy(() -> 
            new IndexSchema("", fields))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Index name cannot be null or empty");
    }

    @Test
    @DisplayName("should fail with null or empty fields")
    void shouldFailWithNullOrEmptyFields() {
        // When & Then
        assertThatThrownBy(() -> 
            new IndexSchema("test-index", null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Fields cannot be null or empty");

        assertThatThrownBy(() -> 
            new IndexSchema("test-index", List.of()))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Fields cannot be null or empty");
    }
}