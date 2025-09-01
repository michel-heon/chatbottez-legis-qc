package com.cotechnoe.teamsrag.indexconfigurator.model;

import java.util.Objects;

/**
 * Represents a field definition in an Azure Search index with complete metadata support.
 * Supports all Azure Search field properties including filterable, retrievable, sortable, etc.
 */
public class FieldDefinition {
    
    private final String name;
    private final String type;
    private final boolean isKey;
    private final boolean isSearchable;
    private final boolean isVector;
    
    // Extended properties from Azure Search API
    private boolean isFilterable = false;
    private boolean isRetrievable = true;
    private boolean isSortable = false;
    private boolean isFacetable = false;
    private int dimensions = 0; // For vector fields
    private String analyzer = null;
    private String vectorSearchProfile = null;
    
    public FieldDefinition(String name, String type, boolean isKey, boolean isSearchable, boolean isVector) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Field name cannot be null or empty");
        }
        if (type == null) {
            throw new IllegalArgumentException("Field type cannot be null");
        }
        
        this.name = name;
        this.type = type;
        this.isKey = isKey;
        this.isSearchable = isSearchable;
        this.isVector = isVector;
    }
    
    // Getters for core properties
    public String getName() { return name; }
    public String getType() { return type; }
    public boolean isKey() { return isKey; }
    public boolean isSearchable() { return isSearchable; }
    public boolean isVector() { return isVector; }
    
    // Getters and setters for extended properties
    public boolean isFilterable() { return isFilterable; }
    public void setFilterable(boolean filterable) { this.isFilterable = filterable; }
    
    public boolean isRetrievable() { return isRetrievable; }
    public void setRetrievable(boolean retrievable) { this.isRetrievable = retrievable; }
    
    public boolean isSortable() { return isSortable; }
    public void setSortable(boolean sortable) { this.isSortable = sortable; }
    
    public boolean isFacetable() { return isFacetable; }
    public void setFacetable(boolean facetable) { this.isFacetable = facetable; }
    
    public int getDimensions() { return dimensions; }
    public void setDimensions(int dimensions) { this.dimensions = dimensions; }
    
    public String getAnalyzer() { return analyzer; }
    public void setAnalyzer(String analyzer) { this.analyzer = analyzer; }
    
    public String getVectorSearchProfile() { return vectorSearchProfile; }
    public void setVectorSearchProfile(String vectorSearchProfile) { this.vectorSearchProfile = vectorSearchProfile; }
    
    /**
     * Converts Azure Search type to TypeScript type with proper mapping for real index structure.
     */
    public String getTypeScriptType() {
        return switch (type) {
            case "Edm.String" -> "string";
            case "Edm.Int32", "Edm.Int64", "Edm.Double" -> "number";
            case "Collection(Edm.Single)" -> "number[]";
            case "Edm.Boolean" -> "boolean";
            default -> "any";
        };
    }
    
    /**
     * Returns TypeScript optional field declaration.
     */
    public String getTypeScriptFieldDeclaration() {
        return String.format("    %s?: %s;", name, getTypeScriptType());
    }
    
    /**
     * Returns true if this field should be included in TypeScript interface.
     * Includes all fields except complex vector fields (but keeps key field for identification).
     */
    public boolean shouldIncludeInInterface() {
        // Include all fields except high-dimension vector fields
        // Keep the key field (chunk_id) for document identification
        return !isVector || dimensions <= 0;
    }
    
    /**
     * Returns field properties summary for debugging.
     */
    public String getPropertiesSummary() {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("%s (%s)", name, type));
        if (isKey) sb.append(" [KEY]");
        if (isSearchable) sb.append(" [SEARCHABLE]");
        if (isFilterable) sb.append(" [FILTERABLE]");
        if (isVector) sb.append(" [VECTOR:").append(dimensions).append("D]");
        return sb.toString();
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        FieldDefinition that = (FieldDefinition) obj;
        return isKey == that.isKey &&
               isSearchable == that.isSearchable &&
               isVector == that.isVector &&
               isFilterable == that.isFilterable &&
               isRetrievable == that.isRetrievable &&
               isSortable == that.isSortable &&
               isFacetable == that.isFacetable &&
               dimensions == that.dimensions &&
               Objects.equals(name, that.name) &&
               Objects.equals(type, that.type) &&
               Objects.equals(analyzer, that.analyzer) &&
               Objects.equals(vectorSearchProfile, that.vectorSearchProfile);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(name, type, isKey, isSearchable, isVector, 
                           isFilterable, isRetrievable, isSortable, isFacetable, 
                           dimensions, analyzer, vectorSearchProfile);
    }
    
    @Override
    public String toString() {
        return String.format("FieldDefinition{name='%s', type='%s', key=%s, searchable=%s, vector=%s, filterable=%s, retrievable=%s, sortable=%s, facetable=%s, dimensions=%d}", 
                            name, type, isKey, isSearchable, isVector, isFilterable, isRetrievable, isSortable, isFacetable, dimensions);
    }
}