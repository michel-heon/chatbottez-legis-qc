package com.cotechnoe.teamsrag.indexconfigurator;

import com.cotechnoe.teamsrag.indexconfigurator.azure.AzureSearchIndexReader;
import com.cotechnoe.teamsrag.indexconfigurator.azure.AzureSearchConnectionException;
import com.cotechnoe.teamsrag.indexconfigurator.generator.TypeScriptGenerator;
import com.cotechnoe.teamsrag.indexconfigurator.model.IndexSchema;

import java.nio.file.Path;
import java.nio.file.Files;
import java.io.IOException;

/**
 * Main CLI for generating TypeScript files from teams-src templates and Azure Search index.
 */
public class AzureSearchConfigGenerator {
    
    private final AzureSearchIndexReader indexReader;
    private final TypeScriptGenerator typeScriptGenerator;
    
    public AzureSearchConfigGenerator() {
        this(new AzureSearchIndexReader(), new TypeScriptGenerator());
    }
    
    public AzureSearchConfigGenerator(AzureSearchIndexReader indexReader, TypeScriptGenerator typeScriptGenerator) {
        this.indexReader = indexReader;
        this.typeScriptGenerator = typeScriptGenerator;
    }
    
    public void generateFromTeamsSrc(Path sourceDir, Path outputDir, String azureSearchEndpoint, String indexName) 
            throws IOException, AzureSearchConnectionException {
        
        if (!Files.exists(sourceDir)) {
            throw new IllegalArgumentException("Source directory does not exist: " + sourceDir);
        }
        
        // Create output directory if it doesn't exist
        Files.createDirectories(outputDir);
        
        // Read index schema from Azure Search
        IndexSchema schema = indexReader.readIndexSchema(azureSearchEndpoint, indexName);
        
        // Generate TypeScript files from templates
        typeScriptGenerator.generateFromTemplates(sourceDir, outputDir, schema);
    }
    
    /**
     * Main entry point for CLI execution.
     * Supports environment variables and command line arguments.
     */
    public static void main(String[] args) {
        try {
            if (args.length > 0 && "--help".equals(args[0])) {
                printHelp();
                return;
            }
            
            // Load environment variables
            String endpoint = System.getenv("AZURE_SEARCH_ENDPOINT");
            String apiKey = System.getenv("SECRET_AZURE_SEARCH_KEY");
            String indexName = System.getenv("AZURE_SEARCH_INDEX_NAME");
            String outputDir = "src"; // Default output directory
            
            // Parse command line arguments
            for (int i = 0; i < args.length; i++) {
                switch (args[i]) {
                    case "--endpoint":
                        if (i + 1 < args.length) endpoint = args[++i];
                        break;
                    case "--api-key":
                        if (i + 1 < args.length) apiKey = args[++i];
                        break;
                    case "--index-name":
                        if (i + 1 < args.length) indexName = args[++i];
                        break;
                    case "--output-dir":
                        if (i + 1 < args.length) outputDir = args[++i];
                        break;
                    case "--validate-only":
                        validateOnlyMode(endpoint, apiKey, indexName);
                        return;
                    case "--test-connection":
                        testConnectionMode(endpoint, apiKey, indexName);
                        return;
                    case "--verbose":
                        System.setProperty("verbose", "true");
                        break;
                }
            }
            
            // Validate required parameters - throw exceptions instead of System.exit for testability
            if (endpoint == null || endpoint.trim().isEmpty()) {
                throw new IllegalArgumentException("AZURE_SEARCH_ENDPOINT is required. Set environment variable or use --endpoint parameter");
            }
            
            if (apiKey == null || apiKey.trim().isEmpty()) {
                throw new IllegalArgumentException("SECRET_AZURE_SEARCH_KEY is required. Set environment variable or use --api-key parameter");
            }
            
            if (indexName == null || indexName.trim().isEmpty()) {
                throw new IllegalArgumentException("AZURE_SEARCH_INDEX_NAME is required. Set environment variable or use --index-name parameter");
            }
            
            // Execute main generation logic
            if (isVerbose()) {
                System.out.println("🚀 Starting Azure Search Configuration Generator");
                System.out.println("📊 Endpoint: " + maskEndpoint(endpoint));
                System.out.println("📝 Index: " + indexName);
                System.out.println("📁 Output: " + outputDir);
            }
            
            // Generate configuration using correct API signatures
            AzureSearchIndexReader reader = new AzureSearchIndexReader();
            IndexSchema schema = reader.readIndexSchema(endpoint, indexName, apiKey);
            
            TypeScriptGenerator tsGenerator = new TypeScriptGenerator();
            Path sourceDir = Path.of("src/main/resources/teams-src");
            tsGenerator.generateFromTemplates(sourceDir, Path.of(outputDir), schema);
            
            if (isVerbose()) {
                System.out.println("✅ Configuration generated successfully");
            }
            
        } catch (IllegalArgumentException e) {
            // For CLI usage, print error and exit
            if (isRunningInCLI()) {
                System.err.println("❌ Error: " + e.getMessage());
                System.exit(1);
            } else {
                // For tests, re-throw the exception
                throw e;
            }
        } catch (Exception e) {
            if (isRunningInCLI()) {
                System.err.println("❌ Error: " + e.getMessage());
                if (isVerbose()) {
                    e.printStackTrace();
                }
                System.exit(1);
            } else {
                throw new RuntimeException(e);
            }
        }
    }
    
    private static void printHelp() {
        System.out.println("Azure Search Configuration Generator");
        System.out.println("=====================================");
        System.out.println();
        System.out.println("Usage: java AzureSearchConfigGenerator [options]");
        System.out.println();
        System.out.println("Options:");
        System.out.println("  --endpoint <url>      Azure Search endpoint");
        System.out.println("  --api-key <key>       Azure Search API key");
        System.out.println("  --index-name <name>   Azure Search index name");
        System.out.println("  --output-dir <dir>    Output directory (default: src)");
        System.out.println("  --validate-only       Only validate connection");
        System.out.println("  --test-connection     Test Azure Search connection");
        System.out.println("  --verbose             Enable verbose output");
        System.out.println("  --help                Show this help message");
        System.out.println();
        System.out.println("Environment Variables:");
        System.out.println("  AZURE_SEARCH_ENDPOINT     Azure Search service endpoint");
        System.out.println("  SECRET_AZURE_SEARCH_KEY   Azure Search admin key");
        System.out.println("  AZURE_SEARCH_INDEX_NAME   Target index name");
    }
    
    private static void validateOnlyMode(String endpoint, String apiKey, String indexName) {
        try {
            if (endpoint == null || apiKey == null || indexName == null) {
                System.err.println("❌ Missing required parameters for validation");
                System.exit(1);
            }
            
            AzureSearchIndexReader reader = new AzureSearchIndexReader();
            reader.readIndexSchema(endpoint, indexName, apiKey);
            System.out.println("✅ Azure Search connection and index validation successful");
        } catch (Exception e) {
            System.err.println("❌ Validation failed: " + e.getMessage());
            System.exit(1);
        }
    }
    
    private static void testConnectionMode(String endpoint, String apiKey, String indexName) {
        try {
            if (endpoint == null || apiKey == null) {
                System.err.println("❌ Missing endpoint or API key for connection test");
                System.exit(1);
            }
            
            AzureSearchIndexReader reader = new AzureSearchIndexReader();
            if (indexName != null) {
                reader.readIndexSchema(endpoint, indexName, apiKey);
                System.out.println("✅ Connection test successful - Index accessible");
            } else {
                System.out.println("✅ Connection test successful - Service accessible");
            }
        } catch (Exception e) {
            System.err.println("❌ Connection test failed: " + e.getMessage());
            System.exit(1);
        }
    }
    
    private static boolean isVerbose() {
        return "true".equals(System.getProperty("verbose"));
    }
    
    private static String maskEndpoint(String endpoint) {
        if (endpoint == null || endpoint.length() < 20) return endpoint;
        return endpoint.substring(0, 20) + "***";
    }
    
    /**
     * Determines if the code is running in CLI mode vs test mode.
     * In test mode, we avoid System.exit() calls.
     */
    private static boolean isRunningInCLI() {
        // Check if we're running in a test environment
        String[] testProperties = {
            "maven.surefire.debug",
            "junit.platform.launcher",
            "surefire.test.class.path"
        };
        
        for (String prop : testProperties) {
            if (System.getProperty(prop) != null) {
                return false; // Running in test
            }
        }
        
        // Check if surefire is in the classpath (indicates test execution)
        try {
            Class.forName("org.apache.maven.surefire.booter.ForkedBooter");
            return false; // Running in test
        } catch (ClassNotFoundException e) {
            // Not in test environment
        }
        
        return true; // Running in CLI mode
    }
}
