package com.cotechnoe.teamsrag.indexconfigurator.generator;

import com.cotechnoe.teamsrag.indexconfigurator.model.IndexSchema;
import com.cotechnoe.teamsrag.indexconfigurator.model.FieldDefinition;

import java.nio.file.Path;
import java.nio.file.Files;
import java.io.IOException;
import java.util.stream.Collectors;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

/**
 * Generates TypeScript files from teams-src templates and IndexSchema.
 * Supports both simple placeholder replacement and enhanced generation with preserved business logic.
 */
public class TypeScriptGenerator {
    
    private static final Pattern GENERATED_FIELDS_PATTERN = 
        Pattern.compile("// GENERATED_FIELDS_START.*?// GENERATED_FIELDS_END", Pattern.DOTALL);
    private static final Pattern GENERATED_CONFIG_PATTERN = 
        Pattern.compile("// GENERATED_CONFIG_START.*?// GENERATED_CONFIG_END", Pattern.DOTALL);
    
    public void generateFromTemplates(Path sourceDir, Path outputDir, IndexSchema schema) throws IOException {
        if (!Files.exists(sourceDir)) {
            throw new IllegalArgumentException("Template directory does not exist: " + sourceDir);
        }
        
        Files.createDirectories(outputDir);
        
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
        }
        
        // Process content based on file type and mode
        String processedContent = content;
        String fileName = sourceFile.getFileName().toString();
        
        if (fileName.equals("azureAISearchDataSource.ts")) {
            processedContent = isEnhancedMode ? 
                updateGeneratedFields(content, schema) : 
                replaceFieldsPlaceholder(content, schema);
            // For app/azureAISearchDataSource.ts, output directly to output root
            outputFile = outputDir.resolve("azureAISearchDataSource.ts");
        } else if (fileName.equals("setup.ts")) {
            processedContent = isEnhancedMode ? 
                updateGeneratedConfig(content, schema) : 
                replaceSetupPlaceholder(content, schema);
        } else if (fileName.equals("utils.ts")) {
            processedContent = replaceUtilsPlaceholder(content, schema);
        }
        
        // Write processed content
        Files.createDirectories(outputFile.getParent());
        Files.writeString(outputFile, processedContent);
    }
    
    // Enhanced mode methods (START/END markers)
    private String updateGeneratedFields(String content, IndexSchema schema) {
        String newFields = schema.getFields().stream()
            .filter(field -> !field.getName().equals("docId") && !field.getName().equals("docTitle"))
            .map(field -> "    " + field.getName() + "?: " + field.getTypeScriptType() + ";")
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
            .filter(field -> !field.getName().equals("docId") && !field.getName().equals("docTitle"))
            .map(field -> "    " + field.getName() + "?: " + field.getTypeScriptType() + ";")
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