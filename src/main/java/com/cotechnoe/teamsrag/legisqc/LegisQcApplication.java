package com.cotechnoe.teamsrag.legisqc;

/**
 * Main entry point for the Legis QC Teams RAG Java components.
 * This class demonstrates the TDD setup and serves as a starting point.
 */
public class LegisQcApplication {
    
    private final String version;
    
    public LegisQcApplication(String version) {
        if (version == null || version.trim().isEmpty()) {
            throw new IllegalArgumentException("Version cannot be null or empty");
        }
        this.version = version;
    }
    
    /**
     * Get the application version.
     * 
     * @return the version string
     */
    public String getVersion() {
        return version;
    }
    
    /**
     * Check if the application is ready to run.
     * 
     * @return true if ready, false otherwise
     */
    public boolean isReady() {
        return version != null && !version.trim().isEmpty();
    }
}