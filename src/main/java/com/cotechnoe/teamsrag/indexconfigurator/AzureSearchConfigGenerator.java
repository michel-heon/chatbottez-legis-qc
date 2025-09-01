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
}