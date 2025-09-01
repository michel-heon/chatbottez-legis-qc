package com.cotechnoe.teamsrag.indexconfigurator.model;

import java.util.Objects;

/**
 * Represents a field definition in an Azure Search index.
 */
public class FieldDefinition {
    
    private final String name;
    private final String type;
    private final boolean isKey;
    private final boolean isSearchable;
    private final boolean isVector;
    
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
    
    public String getName() {
        return name;
    }
    
    public String getType() {
        return type;
    }
    
    public boolean isKey() {
        return isKey;
    }
    
    public boolean isSearchable() {
        return isSearchable;
    }
    
    public boolean isVector() {
        return isVector;
    }
    
    /**
     * Converts Azure Search type to TypeScript type.
     */
    public String getTypeScriptType() {
        return switch (type) {
            case "Edm.String" -> "string | null";
            case "Edm.Int32", "Edm.Int64", "Edm.Double" -> "number | null";
            case "Collection(Edm.Single)" -> "number[] | null";
            case "Edm.Boolean" -> "boolean | null";
            default -> "any | null";
        };
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        FieldDefinition that = (FieldDefinition) obj;
        return isKey == that.isKey &&
               isSearchable == that.isSearchable &&
               isVector == that.isVector &&
               Objects.equals(name, that.name) &&
               Objects.equals(type, that.type);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(name, type, isKey, isSearchable, isVector);
    }
}