package com.cotechnoe.teamsrag.indexconfigurator.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.assertj.core.api.Assertions.*;

/**
 * TDD Tests for FieldDefinition.
 * Represents a field in Azure Search index.
 */
@DisplayName("FieldDefinition")
class FieldDefinitionTest {

    @Test
    @DisplayName("should create field definition with required properties")
    void shouldCreateFieldDefinitionWithRequiredProperties() {
        // When
        FieldDefinition field = new FieldDefinition("docId", "Edm.String", true, false, false);
        
        // Then
        assertThat(field.getName()).isEqualTo("docId");
        assertThat(field.getType()).isEqualTo("Edm.String");
        assertThat(field.isKey()).isTrue();
        assertThat(field.isSearchable()).isFalse();
        assertThat(field.isVector()).isFalse();
    }

    @Test
    @DisplayName("should create searchable field")
    void shouldCreateSearchableField() {
        // When
        FieldDefinition field = new FieldDefinition("description", "Edm.String", false, true, false);
        
        // Then
        assertThat(field.getName()).isEqualTo("description");
        assertThat(field.isSearchable()).isTrue();
        assertThat(field.isKey()).isFalse();
        assertThat(field.isVector()).isFalse();
    }

    @Test
    @DisplayName("should create vector field")
    void shouldCreateVectorField() {
        // When
        FieldDefinition field = new FieldDefinition("contentVector", "Collection(Edm.Single)", false, false, true);
        
        // Then
        assertThat(field.getName()).isEqualTo("contentVector");
        assertThat(field.getType()).isEqualTo("Collection(Edm.Single)");
        assertThat(field.isVector()).isTrue();
        assertThat(field.isKey()).isFalse();
        assertThat(field.isSearchable()).isFalse();
    }

    @Test
    @DisplayName("should fail with null or empty name")
    void shouldFailWithNullOrEmptyName() {
        // When & Then
        assertThatThrownBy(() -> 
            new FieldDefinition(null, "Edm.String", false, false, false))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Field name cannot be null or empty");

        assertThatThrownBy(() -> 
            new FieldDefinition("", "Edm.String", false, false, false))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Field name cannot be null or empty");
    }

    @Test
    @DisplayName("should fail with null type")
    void shouldFailWithNullType() {
        // When & Then
        assertThatThrownBy(() -> 
            new FieldDefinition("field", null, false, false, false))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Field type cannot be null");
    }

    @Test
    @DisplayName("should convert to TypeScript type")
    void shouldConvertToTypeScriptType() {
        // Given
        FieldDefinition stringField = new FieldDefinition("title", "Edm.String", false, true, false);
        FieldDefinition vectorField = new FieldDefinition("vector", "Collection(Edm.Single)", false, false, true);
        FieldDefinition intField = new FieldDefinition("count", "Edm.Int32", false, false, false);
        
        // When & Then
        assertThat(stringField.getTypeScriptType()).isEqualTo("string | null");
        assertThat(vectorField.getTypeScriptType()).isEqualTo("number[] | null");
        assertThat(intField.getTypeScriptType()).isEqualTo("number | null");
    }
}