package com.cotechnoe.teamsrag.legisqc;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;

import static org.junit.jupiter.api.Assertions.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("LegisQcApplication")
class LegisQcApplicationTest {
    
    private static final String VALID_VERSION = "3.0.0";
    
    @Test
    @DisplayName("should create application with valid version")
    void shouldCreateApplicationWithValidVersion() {
        // When
        LegisQcApplication app = new LegisQcApplication(VALID_VERSION);
        
        // Then
        assertThat(app.getVersion()).isEqualTo(VALID_VERSION);
        assertThat(app.isReady()).isTrue();
    }
    
    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"", "   ", "\t", "\n"})
    @DisplayName("should reject null or empty version")
    void shouldRejectNullOrEmptyVersion(String invalidVersion) {
        // When & Then
        assertThatThrownBy(() -> new LegisQcApplication(invalidVersion))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Version cannot be null or empty");
    }
    
    @Test
    @DisplayName("should return correct version")
    void shouldReturnCorrectVersion() {
        // Given
        String expectedVersion = "2.1.5-beta";
        LegisQcApplication app = new LegisQcApplication(expectedVersion);
        
        // When
        String actualVersion = app.getVersion();
        
        // Then
        assertThat(actualVersion).isEqualTo(expectedVersion);
    }
    
    @Test
    @DisplayName("should be ready when version is valid")
    void shouldBeReadyWhenVersionIsValid() {
        // Given
        LegisQcApplication app = new LegisQcApplication("1.0.0");
        
        // When
        boolean ready = app.isReady();
        
        // Then
        assertThat(ready).isTrue();
    }
    
    @Test
    @DisplayName("should handle version with spaces correctly")
    void shouldHandleVersionWithSpacesCorrectly() {
        // Given
        String versionWithSpaces = "  1.2.3  ";
        
        // When
        LegisQcApplication app = new LegisQcApplication(versionWithSpaces);
        
        // Then
        assertThat(app.getVersion()).isEqualTo(versionWithSpaces);
        assertThat(app.isReady()).isTrue();
    }
}