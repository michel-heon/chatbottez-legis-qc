package com.cotechnoe.teamsrag.indexconfigurator.azure;

/**
 * Exception thrown when connection to Azure Search fails.
 */
public class AzureSearchConnectionException extends Exception {
    
    public AzureSearchConnectionException(String message) {
        super(message);
    }
    
    public AzureSearchConnectionException(String message, Throwable cause) {
        super(message, cause);
    }
}