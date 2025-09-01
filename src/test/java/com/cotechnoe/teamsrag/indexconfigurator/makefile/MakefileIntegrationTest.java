package com.cotechnoe.teamsrag.indexconfigurator.makefile;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.condition.EnabledOnOs;
import org.junit.jupiter.api.condition.OS;

import java.nio.file.Path;
import java.nio.file.Files;
import java.io.IOException;

import static org.assertj.core.api.Assertions.*;

/**
 * TDD Tests for Makefile integration with enhanced TypeScript generator.
 */
@DisplayName("Makefile Integration")
@EnabledOnOs(OS.LINUX)
class MakefileIntegrationTest {

    @TempDir
    Path tempDir;

    @Test
    @DisplayName("should have target for enhanced TypeScript generation")
    void shouldHaveTargetForEnhancedTypeScriptGeneration() throws IOException {
        // Given
        String makefileContent = Files.readString(Path.of("Makefile"));
        
        // Then
        assertThat(makefileContent).contains("azure-config-generate-enhanced");
        assertThat(makefileContent).contains("TypeScriptGenerator");
        assertThat(makefileContent).contains("Generate enhanced TypeScript with preserved business logic");
    }

    @Test
    @DisplayName("should have target for TDD test execution")
    void shouldHaveTargetForTddTestExecution() throws IOException {
        // Given
        String makefileContent = Files.readString(Path.of("Makefile"));
        
        // Then
        assertThat(makefileContent).contains("java-test-tdd");
        assertThat(makefileContent).contains("indexconfigurator");
        assertThat(makefileContent).contains("Run TDD tests for enhanced generator");
    }

    @Test
    @DisplayName("should have target for CLI validation")
    void shouldHaveTargetForCliValidation() throws IOException {
        // Given
        String makefileContent = Files.readString(Path.of("Makefile"));
        
        // Then
        assertThat(makefileContent).contains("azure-config-validate");
        assertThat(makefileContent).contains("AzureSearchConfigGenerator");
        assertThat(makefileContent).contains("validate-only");
    }

    @Test
    @DisplayName("should have target for complete config generation")
    void shouldHaveTargetForCompleteConfigGeneration() throws IOException {
        // Given
        String makefileContent = Files.readString(Path.of("Makefile"));
        
        // Then
        assertThat(makefileContent).contains("typescript-generate-complete");
        assertThat(makefileContent).contains("Generate complete TypeScript configuration");
        assertThat(makefileContent).contains("--output-dir");
    }

    @Test
    @DisplayName("should have proper variable definitions")
    void shouldHaveProperVariableDefinitions() throws IOException {
        // Given
        String makefileContent = Files.readString(Path.of("Makefile"));
        
        // Then
        assertThat(makefileContent).contains("AZURE_SEARCH_ENDPOINT ?=");
        assertThat(makefileContent).contains("AZURE_SEARCH_INDEX_NAME ?=");
        assertThat(makefileContent).contains("ENHANCED_OUTPUT_DIR ?= src");
    }

    @Test
    @DisplayName("should have help documentation for new targets")
    void shouldHaveHelpDocumentationForNewTargets() throws IOException {
        // Given
        String makefileContent = Files.readString(Path.of("Makefile"));
        
        // Then
        assertThat(makefileContent).contains("Enhanced TypeScript Generation:");
        assertThat(makefileContent).contains("azure-config-generate-enhanced");
        assertThat(makefileContent).contains("typescript-generate-complete");
        assertThat(makefileContent).contains("TDD Testing:");
    }
}