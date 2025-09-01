package com.cotechnoe.teamsrag.indexconfigurator;

import com.cotechnoe.teamsrag.indexconfigurator.azure.AzureSearchIndexReader;
import com.cotechnoe.teamsrag.indexconfigurator.azure.AzureSearchConnectionException;
import com.cotechnoe.teamsrag.indexconfigurator.generator.TypeScriptGenerator;
import com.cotechnoe.teamsrag.indexconfigurator.model.IndexSchema;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.nio.file.Path;
import java.nio.file.Files;
import java.io.IOException;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * TDD Tests for AzureSearchConfigGenerator.
 * Focuses on generating TypeScript files from teams-src templates and Azure Search index.
 */
@DisplayName("AzureSearchConfigGenerator")
class AzureSearchConfigGeneratorTest {

    @TempDir
    Path tempDir;

    @Mock
    private AzureSearchIndexReader indexReader;

    @Mock
    private TypeScriptGenerator typeScriptGenerator;

    private AzureSearchConfigGenerator generator;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        generator = new AzureSearchConfigGenerator(indexReader, typeScriptGenerator);
    }

    @Test
    @DisplayName("should generate TypeScript files from teams-src templates")
    void shouldGenerateTypeScriptFilesFromTeamsSrcTemplates() throws Exception {
        // Given
        Path sourceDir = tempDir.resolve("teams-src");
        Path outputDir = tempDir.resolve("output");
        Files.createDirectories(sourceDir);
        Files.createDirectories(outputDir);
        
        String azureSearchEndpoint = "https://test.search.windows.net";
        String indexName = "test-index";
        
        IndexSchema mockSchema = mock(IndexSchema.class);
        when(indexReader.readIndexSchema(azureSearchEndpoint, indexName)).thenReturn(mockSchema);
        
        // When
        generator.generateFromTeamsSrc(sourceDir, outputDir, azureSearchEndpoint, indexName);
        
        // Then
        verify(indexReader).readIndexSchema(azureSearchEndpoint, indexName);
        verify(typeScriptGenerator).generateFromTemplates(sourceDir, outputDir, mockSchema);
    }

    @Test
    @DisplayName("should fail when source directory does not exist")
    void shouldFailWhenSourceDirectoryDoesNotExist() {
        // Given
        Path nonExistentSource = tempDir.resolve("non-existent");
        Path outputDir = tempDir.resolve("output");
        
        // When & Then
        assertThatThrownBy(() -> 
            generator.generateFromTeamsSrc(nonExistentSource, outputDir, "endpoint", "index"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Source directory does not exist");
    }

    @Test
    @DisplayName("should create output directory if it does not exist")
    void shouldCreateOutputDirectoryIfItDoesNotExist() throws Exception {
        // Given
        Path sourceDir = tempDir.resolve("teams-src");
        Path outputDir = tempDir.resolve("non-existent-output");
        Files.createDirectories(sourceDir);
        
        IndexSchema mockSchema = mock(IndexSchema.class);
        when(indexReader.readIndexSchema(anyString(), anyString())).thenReturn(mockSchema);
        
        // When
        generator.generateFromTeamsSrc(sourceDir, outputDir, "endpoint", "index");
        
        // Then
        assertThat(Files.exists(outputDir)).isTrue();
        assertThat(Files.isDirectory(outputDir)).isTrue();
    }

    @Test
    @DisplayName("should handle Azure Search connection errors gracefully")
    void shouldHandleAzureSearchConnectionErrorsGracefully() throws Exception {
        // Given
        Path sourceDir = tempDir.resolve("teams-src");
        Path outputDir = tempDir.resolve("output");
        Files.createDirectories(sourceDir);
        
        when(indexReader.readIndexSchema(anyString(), anyString()))
            .thenThrow(new AzureSearchConnectionException("Connection failed"));
        
        // When & Then
        assertThatThrownBy(() -> 
            generator.generateFromTeamsSrc(sourceDir, outputDir, "invalid-endpoint", "index"))
            .isInstanceOf(AzureSearchConnectionException.class)
            .hasMessageContaining("Connection failed");
    }

    @Test
    @DisplayName("should have main method for CLI execution")
    void shouldHaveMainMethodForCliExecution() {
        // Given/When/Then
        assertThatCode(() -> {
            AzureSearchConfigGenerator.main(new String[]{"--help"});
        }).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("should handle missing environment variables gracefully in main")
    void shouldHandleMissingEnvironmentVariablesGracefullyInMain() {
        // Given/When/Then - Should throw IllegalArgumentException for missing variables
        assertThatThrownBy(() -> {
            AzureSearchConfigGenerator.main(new String[]{});
        }).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("AZURE_SEARCH_ENDPOINT is required");
    }
}