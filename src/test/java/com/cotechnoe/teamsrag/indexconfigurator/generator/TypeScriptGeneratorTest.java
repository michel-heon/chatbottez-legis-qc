package com.cotechnoe.teamsrag.indexconfigurator.generator;

import com.cotechnoe.teamsrag.indexconfigurator.model.IndexSchema;
import com.cotechnoe.teamsrag.indexconfigurator.model.FieldDefinition;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.nio.file.Files;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * TDD Tests for TypeScriptGenerator.
 * Handles both simple placeholder replacement and enhanced generation with preserved business logic.
 */
@DisplayName("TypeScriptGenerator")
class TypeScriptGeneratorTest {

    @TempDir
    Path tempDir;

    private TypeScriptGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new TypeScriptGenerator();
    }

    @Test
    @DisplayName("should generate azureAISearchDataSource.ts from simple placeholder template")
    void shouldGenerateAzureAISearchDataSourceFromSimplePlaceholderTemplate() throws Exception {
        // Given
        Path sourceDir = tempDir.resolve("teams-src");
        Path outputDir = tempDir.resolve("output");
        Files.createDirectories(sourceDir.resolve("app"));
        Files.createDirectories(outputDir);
        
        // Simple placeholder template
        String templateContent = """
            export interface MyDocument {
                docId?: string;
                docTitle?: string | null;
                // GENERATED_FIELDS_PLACEHOLDER
            }
            """;
        Files.writeString(sourceDir.resolve("app/azureAISearchDataSource.ts"), templateContent);
        
        IndexSchema schema = createTestSchema();
        
        // When
        generator.generateFromTemplates(sourceDir, outputDir, schema);
        
        // Then
        Path generatedFile = outputDir.resolve("azureAISearchDataSource.ts");
        assertThat(Files.exists(generatedFile)).isTrue();
        
        String content = Files.readString(generatedFile);
        assertThat(content).contains("description?: string | null;");
        assertThat(content).contains("descriptionVector?: number[] | null;");
    }

    @Test
    @DisplayName("should preserve existing business logic with START/END markers")
    void shouldPreserveExistingBusinessLogicWithStartEndMarkers() throws Exception {
        // Given
        Path sourceDir = tempDir.resolve("teams-src");
        Path outputDir = tempDir.resolve("output");
        Files.createDirectories(sourceDir.resolve("app"));
        Files.createDirectories(outputDir);
        
        // Enhanced template with START/END markers
        String existingContent = """
            export interface MyDocument {
                docId?: string;
                // Custom business logic comment
                docTitle?: string | null;
                // GENERATED_FIELDS_START
                description?: string | null;
                // GENERATED_FIELDS_END
                
                // Custom method preserved
                getDisplayName(): string {
                    return this.docTitle || 'Unknown';
                }
            }
            """;
        Files.writeString(sourceDir.resolve("app/azureAISearchDataSource.ts"), existingContent);
        
        IndexSchema schema = createTestSchemaWithNewField();
        
        // When
        generator.generateFromTemplates(sourceDir, outputDir, schema);
        
        // Then
        Path generatedFile = outputDir.resolve("azureAISearchDataSource.ts");
        String content = Files.readString(generatedFile);
        
        assertThat(content).contains("Custom business logic comment");
        assertThat(content).contains("getDisplayName(): string");
        assertThat(content).contains("newField?: string | null;"); // New generated field
    }

    @Test
    @DisplayName("should update only generated sections while preserving custom code in setup.ts")
    void shouldUpdateOnlyGeneratedSectionsWhilePreservingCustomCodeInSetup() throws Exception {
        // Given
        Path sourceDir = tempDir.resolve("teams-src");
        Path outputDir = tempDir.resolve("output");
        Files.createDirectories(sourceDir);
        Files.createDirectories(outputDir);
        
        String existingConfig = """
            const config = {
                // Custom configuration
                timeout: 5000,
                // GENERATED_CONFIG_START
                indexName: "old-index",
                // GENERATED_CONFIG_END
                // More custom settings
                retryCount: 3
            };
            """;
        Files.writeString(sourceDir.resolve("setup.ts"), existingConfig);
        
        IndexSchema schema = createTestSchemaWithNewField();
        
        // When
        generator.generateFromTemplates(sourceDir, outputDir, schema);
        
        // Then
        Path generatedFile = outputDir.resolve("setup.ts");
        String content = Files.readString(generatedFile);
        
        assertThat(content).contains("timeout: 5000"); // Preserved
        assertThat(content).contains("retryCount: 3"); // Preserved
        assertThat(content).contains("indexName: \"test-enhanced-index\""); // Updated
    }

    @Test
    @DisplayName("should create backup when using enhanced mode")
    void shouldCreateBackupWhenUsingEnhancedMode() throws Exception {
        // Given
        Path sourceDir = tempDir.resolve("teams-src");
        Path outputDir = tempDir.resolve("output");
        Files.createDirectories(sourceDir);
        Files.createDirectories(outputDir);
        
        String originalContent = """
            // GENERATED_FIELDS_START
            old content
            // GENERATED_FIELDS_END
            """;
        Files.writeString(sourceDir.resolve("test.ts"), originalContent);
        
        IndexSchema schema = createTestSchema();
        
        // When
        generator.generateFromTemplates(sourceDir, outputDir, schema);
        
        // Then
        Path backupFile = outputDir.resolve("test.ts.bak");
        assertThat(Files.exists(backupFile)).isTrue();
        assertThat(Files.readString(backupFile)).isEqualTo(originalContent);
    }

    private IndexSchema createTestSchema() {
        List<FieldDefinition> fields = List.of(
            new FieldDefinition("docId", "Edm.String", true, false, false),
            new FieldDefinition("docTitle", "Edm.String", false, true, false),
            new FieldDefinition("description", "Edm.String", false, true, false),
            new FieldDefinition("descriptionVector", "Collection(Edm.Single)", false, false, true)
        );
        return new IndexSchema("test-index", fields);
    }

    private IndexSchema createTestSchemaWithNewField() {
        List<FieldDefinition> fields = List.of(
            new FieldDefinition("docId", "Edm.String", true, false, false),
            new FieldDefinition("docTitle", "Edm.String", false, true, false),
            new FieldDefinition("description", "Edm.String", false, true, false),
            new FieldDefinition("newField", "Edm.String", false, true, false) // New field
        );
        return new IndexSchema("test-enhanced-index", fields);
    }
}