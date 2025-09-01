package com.cotechnoe.teamsrag.indexconfigurator.model;

import java.util.List;
import java.util.Objects;

/**
 * Represents the schema of an Azure Search index.
 */
public class IndexSchema {
    
    private final String indexName;
    private final List<FieldDefinition> fields;
    
    public IndexSchema(String indexName, List<FieldDefinition> fields) {
        if (indexName == null || indexName.trim().isEmpty()) {
            throw new IllegalArgumentException("Index name cannot be null or empty");
        }
        if (fields == null || fields.isEmpty()) {
            throw new IllegalArgumentException("Fields cannot be null or empty");
        }
        
        this.indexName = indexName;
        this.fields = List.copyOf(fields); // Immutable copy
    }
    
    public String getIndexName() {
        return indexName;
    }
    
    public List<FieldDefinition> getFields() {
        return fields;
    }
    
    public FieldDefinition getKeyField() {
        return fields.stream()
                .filter(FieldDefinition::isKey)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No key field found in index schema"));
    }
    
    public List<FieldDefinition> getSearchableFields() {
        return fields.stream()
                .filter(FieldDefinition::isSearchable)
                .toList();
    }
    
    public List<FieldDefinition> getVectorFields() {
        return fields.stream()
                .filter(FieldDefinition::isVector)
                .toList();
    }
    
    public int getFieldCount() {
        return fields.size();
    }
    
    public boolean hasKeyField() {
        return fields.stream().anyMatch(FieldDefinition::isKey);
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        IndexSchema that = (IndexSchema) obj;
        return Objects.equals(indexName, that.indexName) &&
               Objects.equals(fields, that.fields);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(indexName, fields);
    }
}