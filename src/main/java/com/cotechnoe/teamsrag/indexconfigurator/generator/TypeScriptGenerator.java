package com.cotechnoe.teamsrag.indexconfigurator.generator;

import com.cotechnoe.teamsrag.indexconfigurator.model.IndexSchema;
import com.cotechnoe.teamsrag.indexconfigurator.model.FieldDefinition;
import com.cotechnoe.teamsrag.indexconfigurator.azure.AzureSearchIndexReader;
import com.cotechnoe.teamsrag.indexconfigurator.azure.AzureSearchConnectionException;

import java.nio.file.Path;
import java.nio.file.Files;
import java.io.IOException;
import java.util.stream.Collectors;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

/**
 * Generates TypeScript files from teams-src templates with real-time Azure Search schema reading.
 * Supports both simple placeholder replacement and enhanced generation with preserved business logic.
 * 
 * Key Features:
 * - Real-time Azure Search schema reading
 * - Two generation modes: Simple (placeholders) and Enhanced (START/END markers)
 * - Automatic backup in enhanced mode
 * - Template structure preservation
 */
public class TypeScriptGenerator {
    
    private static final Pattern GENERATED_FIELDS_PATTERN = 
        Pattern.compile("// GENERATED_FIELDS_START.*?// GENERATED_FIELDS_END", Pattern.DOTALL);
    private static final Pattern GENERATED_CONFIG_PATTERN = 
        Pattern.compile("// GENERATED_CONFIG_START.*?// GENERATED_CONFIG_END", Pattern.DOTALL);
    
    private final AzureSearchIndexReader azureReader;
    
    /**
     * Constructor with dependency injection for Azure Search reader.
     */
    public TypeScriptGenerator(AzureSearchIndexReader azureReader) {
        this.azureReader = azureReader;
    }
    
    /**
     * Default constructor - creates internal Azure Search reader.
     */
    public TypeScriptGenerator() {
        this.azureReader = new AzureSearchIndexReader();
    }
    
    /**
     * Legacy method - maintains backward compatibility.
     * @deprecated Use generateFromTemplates(Path, Path, String, String, String) instead
     */
    @Deprecated
    public void generateFromTemplates(Path sourceDir, Path outputDir, IndexSchema schema) throws IOException {
        // ...existing code...
        generateTemplatesWithSchema(sourceDir, outputDir, schema);
    }
    
    /**
     * Main generation method - reads Azure Search in real-time.
     * 
     * @param sourceDir Source template directory (src/main/resources/teams-src)
     * @param outputDir Output directory (src)  
     * @param endpoint Azure Search endpoint
     * @param indexName Index name to read
     * @param apiKey Azure Search API key
     */
    public void generateFromTemplates(Path sourceDir, Path outputDir, 
                                    String endpoint, String indexName, String apiKey) throws IOException {
        if (!Files.exists(sourceDir)) {
            throw new IllegalArgumentException("Template directory does not exist: " + sourceDir);
        }
        
        Files.createDirectories(outputDir);
        
        try {
            // 🚀 REAL-TIME Azure Search schema reading
            System.out.println("📊 Reading Azure Search schema from: " + endpoint + "/" + indexName);
            IndexSchema liveSchema = azureReader.readIndexSchema(endpoint, indexName, apiKey);
            
            // Validation du schéma récupéré
            validateLiveSchema(liveSchema, indexName);
            
            System.out.println("✅ Schema loaded: " + liveSchema.getFields().size() + " fields detected");
            
            // Process templates with live schema
            generateTemplatesWithSchema(sourceDir, outputDir, liveSchema);
            
        } catch (AzureSearchConnectionException e) {
            throw new IOException("Failed to read Azure Search schema: " + e.getMessage(), e);
        }
    }
    
    /**
     * Validates the live schema read from Azure Search.
     */
    private void validateLiveSchema(IndexSchema schema, String indexName) throws IOException {
        if (schema == null) {
            throw new IllegalStateException("No schema returned from Azure Search index: " + indexName);
        }
        
        if (schema.getFields().isEmpty()) {
            throw new IllegalStateException("No fields found in Azure Search index: " + indexName);
        }
        
        // Validation champs obligatoires
        boolean hasDocId = schema.getFields().stream()
            .anyMatch(field -> field.getName().equals("docId"));
        
        if (!hasDocId) {
            System.out.println("⚠️ Warning: Required field 'docId' not found in index schema");
        }
        
        // Log schema summary
        long searchableFields = schema.getFields().stream()
            .filter(field -> field.isSearchable())
            .count();
        
        System.out.println("📋 Schema summary: " + schema.getFields().size() + " total fields, " + 
                          searchableFields + " searchable");
    }
    
    /**
     * Internal method to process templates with a given schema.
     */
    private void generateTemplatesWithSchema(Path sourceDir, Path outputDir, IndexSchema schema) throws IOException {
        // Process all TypeScript files in source directory
        Files.walk(sourceDir)
            .filter(path -> path.toString().endsWith(".ts"))
            .forEach(sourceFile -> {
                try {
                    processTypeScriptFile(sourceFile, sourceDir, outputDir, schema);
                } catch (IOException e) {
                    throw new RuntimeException("Failed to process file: " + sourceFile, e);
                }
            });
    }
    
    private void processTypeScriptFile(Path sourceFile, Path sourceDir, Path outputDir, IndexSchema schema) throws IOException {
        String content = Files.readString(sourceFile);
        Path relativePath = sourceDir.relativize(sourceFile);
        Path outputFile = outputDir.resolve(relativePath);
        
        // Determine if this file uses enhanced mode (START/END markers)
        boolean isEnhancedMode = content.contains("GENERATED_FIELDS_START") || 
                                content.contains("GENERATED_CONFIG_START");
        
        // Create backup if using enhanced mode
        if (isEnhancedMode) {
            Path backupFile = outputDir.resolve(relativePath.toString() + ".bak");
            Files.createDirectories(backupFile.getParent());
            Files.writeString(backupFile, content);
            System.out.println("💾 Backup created: " + backupFile);
        }
        
        // Process content based on file type and mode
        String processedContent = content;
        String fileName = sourceFile.getFileName().toString();
        
        if (fileName.equals("azureAISearchDataSource.ts")) {
            processedContent = isEnhancedMode ? 
                updateGeneratedFields(content, schema) : 
                replaceFieldsPlaceholder(content, schema);
            System.out.println("🔧 Generated azureAISearchDataSource.ts with " + 
                             schema.getFields().size() + " fields");
        } else if (fileName.equals("setup.ts")) {
            processedContent = isEnhancedMode ? 
                updateGeneratedConfig(content, schema) : 
                replaceSetupPlaceholder(content, schema);
            System.out.println("🔧 Generated setup.ts for index: " + schema.getIndexName());
        } else if (fileName.equals("utils.ts")) {
            processedContent = replaceUtilsPlaceholder(content, schema);
            System.out.println("🔧 Generated utils.ts with " + 
                             schema.getSearchableFields().size() + " searchable fields");
        }
        
        // Write processed content
        Files.createDirectories(outputFile.getParent());
        Files.writeString(outputFile, processedContent);
    }
    
    // Enhanced mode methods (START/END markers)
    private String updateGeneratedFields(String content, IndexSchema schema) {
        String newFields = schema.getFields().stream()
            .filter(field -> field.shouldIncludeInInterface()) // Use smart filtering based on real schema
            .map(field -> field.getTypeScriptFieldDeclaration())
            .collect(Collectors.joining("\n"));
        
        String replacement = "// GENERATED_FIELDS_START\n" + newFields + "\n    // GENERATED_FIELDS_END";
        
        Matcher matcher = GENERATED_FIELDS_PATTERN.matcher(content);
        if (matcher.find()) {
            return matcher.replaceFirst(replacement);
        }
        return content;
    }
    
    private String updateGeneratedConfig(String content, IndexSchema schema) {
        String newConfig = "indexName: \"" + schema.getIndexName() + "\",";
        String replacement = "// GENERATED_CONFIG_START\n        " + newConfig + "\n        // GENERATED_CONFIG_END";
        
        Matcher matcher = GENERATED_CONFIG_PATTERN.matcher(content);
        if (matcher.find()) {
            return matcher.replaceFirst(replacement);
        }
        return content;
    }
    
    // Simple placeholder mode methods
    private String replaceFieldsPlaceholder(String content, IndexSchema schema) {
        String fieldDefinitions = schema.getFields().stream()
            .filter(field -> field.shouldIncludeInInterface()) // Use smart filtering based on real schema
            .map(field -> field.getTypeScriptFieldDeclaration())
            .collect(Collectors.joining("\n"));
        
        return content.replace("// GENERATED_FIELDS_PLACEHOLDER", fieldDefinitions);
    }
    
    private String replaceSetupPlaceholder(String content, IndexSchema schema) {
        return content.replace("PLACEHOLDER_INDEX_NAME", schema.getIndexName());
    }
    
    private String replaceUtilsPlaceholder(String content, IndexSchema schema) {
        String searchableFields = schema.getSearchableFields().stream()
            .map(field -> "        \"" + field.getName() + "\"")
            .collect(Collectors.joining(",\n"));
        
        return content.replace("// GENERATED_SEARCHABLE_FIELDS_PLACEHOLDER", searchableFields);
    }
}