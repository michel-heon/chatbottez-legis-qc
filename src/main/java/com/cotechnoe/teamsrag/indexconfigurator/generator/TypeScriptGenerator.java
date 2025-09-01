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
            // Apply all dynamic replacements for azureAISearchDataSource.ts
            processedContent = applyAzureSearchDataSourceReplacements(processedContent, schema);
            System.out.println("🔧 Generated azureAISearchDataSource.ts with " + 
                             schema.getFields().size() + " fields");
        } else if (fileName.equals("setup.ts")) {
            processedContent = isEnhancedMode ? 
                updateGeneratedConfig(content, schema) : 
                replaceSetupPlaceholder(content, schema);
            // Apply all dynamic replacements for setup.ts
            processedContent = applySetupReplacements(processedContent, schema);
            System.out.println("🔧 Generated setup.ts for index: " + schema.getIndexName());
        } else if (fileName.equals("utils.ts")) {
            processedContent = replaceUtilsPlaceholder(content, schema);
            // Apply all dynamic replacements for utils.ts
            processedContent = applyUtilsReplacements(processedContent, schema);
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
    
    /**
     * COMPLETE mode generation method called by AzureSearchConfigGenerator.
     * Generates complete TypeScript configuration with backup and validation.
     * 
     * @param schema Azure Search index schema
     * @param sourceDir Template source directory  
     * @param outputDir Output directory for generated files
     * @param enableBackup Whether to create backup files
     * @param verbose Whether to enable verbose logging
     */
    public void generateCompleteConfiguration(IndexSchema schema, Path sourceDir, Path outputDir, 
                                            boolean enableBackup, boolean verbose) throws IOException {
        if (verbose) {
            System.out.println("🚀 Starting COMPLETE mode generation...");
            System.out.println("📁 Source templates: " + sourceDir);
            System.out.println("📁 Output directory: " + outputDir);
            System.out.println("💾 Backup enabled: " + enableBackup);
        }
        
        // Create output directories
        Files.createDirectories(outputDir);
        
        // Backup existing files if requested
        if (enableBackup) {
            createBackupFiles(outputDir, verbose);
        }
        
        // Generate TypeScript files with complete validation
        generateTemplatesWithSchema(sourceDir, outputDir, schema);
        
        if (verbose) {
            System.out.println("✅ COMPLETE mode generation finished successfully");
        }
    }
    
    /**
     * Apply all dynamic replacements for azureAISearchDataSource.ts template
     */
    private String applyAzureSearchDataSourceReplacements(String content, IndexSchema schema) {
        // Replace interface fields
        String interfaceFields = generateInterfaceFields(schema);
        content = content.replace("// Dynamic interface fields generated from Azure Search index\n    // This section will be replaced with actual field definitions", interfaceFields);
        
        // Replace selected fields
        String selectedFields = generateSelectedFields(schema);
        content = content.replace("// GENERATED_SELECT_FIELDS_PLACEHOLDER", selectedFields);
        
        // Replace searchable fields
        String searchableFields = generateSearchableFields(schema);
        content = content.replace("/* GENERATED_SEARCHABLE_FIELDS_PLACEHOLDER */", searchableFields);
        
        // Replace vector fields
        String vectorFields = generateVectorFields(schema);
        content = content.replace("/* GENERATED_VECTOR_FIELDS_PLACEHOLDER */", vectorFields);
        
        // Replace document format
        String documentFormat = generateDocumentFormat(schema);
        content = content.replace("\"/* GENERATED_DOCUMENT_FORMAT_PLACEHOLDER */\"", documentFormat);
        
        return content;
    }
    
    /**
     * Apply all dynamic replacements for setup.ts template
     */
    private String applySetupReplacements(String content, IndexSchema schema) {
        // Replace index name
        content = content.replace("/* GENERATED_INDEX_NAME_PLACEHOLDER */", schema.getIndexName());
        
        // Replace document fields creation
        String documentFields = generateDocumentFieldsCreation(schema);
        content = content.replace("// GENERATED_DOCUMENT_FIELDS_PLACEHOLDER", documentFields);
        
        return content;
    }
    
    /**
     * Apply all dynamic replacements for utils.ts template
     */
    private String applyUtilsReplacements(String content, IndexSchema schema) {
        // Replace index fields definition
        String indexFields = generateIndexFieldsDefinition(schema);
        content = content.replace("// GENERATED_INDEX_FIELDS_PLACEHOLDER", indexFields);
        
        return content;
    }
    
    /**
     * Generate TypeScript interface fields from schema
     */
    private String generateInterfaceFields(IndexSchema schema) {
        return schema.getFields().stream()
            .map(field -> {
                String optional = field.isKey() ? "" : "?";
                String type = mapToTypeScriptType(field);
                return "    " + field.getName() + optional + ": " + type + ";";
            })
            .collect(Collectors.joining("\n"));
    }
    
    /**
     * Generate selected fields array for search operations
     * Uses only essential content fields that are guaranteed to exist
     */
    private String generateSelectedFields(IndexSchema schema) {
        return schema.getFields().stream()
            .filter(field -> !field.isVector()) // Exclude vector fields from selection
            .filter(field -> !field.isKey())    // Exclude key fields that might cause select errors
            .filter(field -> isEssentialContentField(field)) // Only guaranteed content fields
            .map(field -> "            \"" + field.getName() + "\"")
            .collect(Collectors.joining(",\n"));
    }
    
    /**
     * Determines if a field is an essential content field that should always exist
     */
    private boolean isEssentialContentField(FieldDefinition field) {
        String fieldName = field.getName().toLowerCase();
        // Only use core content fields that are almost guaranteed to exist
        return fieldName.equals("content") || 
               fieldName.equals("title");
    }
    
    /**
     * Generate searchable fields array
     * Uses only content and title fields for text search to avoid Azure Search API errors
     */
    private String generateSearchableFields(IndexSchema schema) {
        return schema.getSearchableFields().stream()
            .filter(field -> !field.isVector()) // Exclude vector fields
            .filter(field -> !field.isKey())    // Exclude key fields (not allowed in searchFields)
            .filter(field -> isContentField(field)) // Only content-like fields for text search
            .map(field -> "\"" + field.getName() + "\"")
            .collect(Collectors.joining(", "));
    }
    
    /**
     * Determines if a field is suitable for text search
     */
    private boolean isContentField(FieldDefinition field) {
        String fieldName = field.getName().toLowerCase();
        // Only use fields that contain actual content for text search
        return fieldName.contains("content") || 
               fieldName.contains("title") || 
               fieldName.contains("description") ||
               fieldName.contains("text") ||
               fieldName.contains("body");
    }
    
    /**
     * Generate vector fields array
     */
    private String generateVectorFields(IndexSchema schema) {
        return schema.getVectorFields().stream()
            .map(field -> "\"" + field.getName() + "\"")
            .collect(Collectors.joining(", "));
    }
    
    /**
     * Generate document format expression
     */
    private String generateDocumentFormat(IndexSchema schema) {
        // Use the first searchable non-vector field for content and title field for title
        FieldDefinition contentField = schema.getSearchableFields().stream()
            .filter(field -> !field.isVector())
            .findFirst()
            .orElse(schema.getFields().get(0));
        
        FieldDefinition titleField = schema.getFields().stream()
            .filter(field -> field.getName().toLowerCase().contains("title") || 
                           field.getName().toLowerCase().contains("name"))
            .findFirst()
            .orElse(contentField);
        
        return "`${result.document." + contentField.getName() + "}\\n Citation: ${result.document." + titleField.getName() + "}.`";
    }
    
    /**
     * Generate document fields creation for setup.ts
     */
    private String generateDocumentFieldsCreation(IndexSchema schema) {
        return schema.getFields().stream()
            .map(field -> {
                if (field.isKey()) {
                    return "            " + field.getName() + ": i+\"\",";
                } else if (field.isVector()) {
                    return "            " + field.getName() + ": await getEmbeddingVector(content),";
                } else if (field.getType().equals("Edm.Boolean")) {
                    return "            " + field.getName() + ": false,";
                } else if (field.getType().equals("Edm.DateTimeOffset")) {
                    return "            " + field.getName() + ": new Date(),";
                } else if (field.getName().toLowerCase().contains("title") || field.getName().toLowerCase().contains("name")) {
                    return "            " + field.getName() + ": files[i-1],";
                } else {
                    return "            " + field.getName() + ": content,";
                }
            })
            .collect(Collectors.joining("\n"));
    }
    
    /**
     * Generate index fields definition for utils.ts
     */
    private String generateIndexFieldsDefinition(IndexSchema schema) {
        return schema.getFields().stream()
            .map(field -> {
                String fieldDef = "            {\n";
                fieldDef += "                type: \"" + field.getType() + "\",\n";
                fieldDef += "                name: \"" + field.getName() + "\"";
                
                if (field.isKey()) {
                    fieldDef += ",\n                key: true,\n                filterable: true,\n                sortable: true";
                } else if (field.isVector()) {
                    fieldDef += ",\n                searchable: true,\n                vectorSearchDimensions: 1536,\n                vectorSearchProfileName: \"my-vector-config\"";
                } else if (field.isSearchable()) {
                    fieldDef += ",\n                searchable: true";
                    if (field.isFilterable()) {
                        fieldDef += ",\n                filterable: true";
                    }
                    if (!field.getType().contains("Collection")) {
                        fieldDef += ",\n                analyzerName: KnownAnalyzerNames.EnLucene";
                    }
                }
                
                fieldDef += "\n            }";
                return fieldDef;
            })
            .collect(Collectors.joining(",\n"));
    }
    
    /**
     * Map Azure Search field type to TypeScript type
     */
    private String mapToTypeScriptType(FieldDefinition field) {
        String type = field.getType();
        if (field.isVector()) {
            return "number[] | null";
        } else if (type.equals("Edm.String")) {
            return "string | null";
        } else if (type.equals("Edm.Int32") || type.equals("Edm.Int64")) {
            return "number | null";
        } else if (type.equals("Edm.Boolean")) {
            return "boolean | null";
        } else if (type.equals("Edm.DateTimeOffset")) {
            return "Date | null";
        } else {
            return "any | null";
        }
    }
    
    /**
     * Creates backup files of existing TypeScript files.
     */
    private void createBackupFiles(Path outputDir, boolean verbose) throws IOException {
        String[] filesToBackup = {
            "app/azureAISearchDataSource.ts",
            "indexers/setup.ts", 
            "indexers/utils.ts"
        };
        
        for (String file : filesToBackup) {
            Path sourcePath = outputDir.resolve(file);
            if (Files.exists(sourcePath)) {
                Path backupPath = outputDir.resolve(file + ".bak");
                Files.copy(sourcePath, backupPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                if (verbose) {
                    System.out.println("💾 Backup created: " + backupPath);
                }
            }
        }
    }
}