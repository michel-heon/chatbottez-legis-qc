# Makefile for Azure AI Search Index Management
# Microsoft 365 Teams Agent - Chatbot Legis QC

.PHONY: help install build setup-index delete-index check-env validate-config clean

# Default target
help:
	@echo "Azure AI Search Index Management Commands"
	@echo "========================================"
	@echo ""
	@echo "Setup Commands:"
	@echo "  install          - Install dependencies"
	@echo "  build            - Build TypeScript project"
	@echo "  java-build       - Build Java components"
	@echo ""
	@echo "Index Management:"
	@echo "  setup-index      - Create index and upload documents"
	@echo "  delete-index     - Delete the search index"
	@echo "  reindex          - Delete and recreate index with fresh data"
	@echo ""
	@echo "Azure Search Configuration Generator:"
	@echo "  azure-config-generate          - Generate TypeScript config from Azure Search index"
	@echo "  azure-config-validate          - Validate generated configuration"
	@echo "  azure-config-test-integration  - Run integration tests with real Azure Search"
	@echo "  azure-config-clean             - Clean generated configuration files"
	@echo ""
	@echo "Enhanced TypeScript Generation:"
	@echo "  azure-config-generate-enhanced - Generate enhanced TypeScript with preserved business logic"
	@echo "  typescript-generate-complete   - Generate complete TypeScript configuration"
	@echo "  azure-cli-validate             - Validate Azure Search CLI configuration"
	@echo ""
	@echo "Environment:"
	@echo "  check-env        - Validate environment variables"
	@echo "  validate-config  - Validate Azure Search configuration"
	@echo ""
	@echo "Development & Testing:"
	@echo "  clean            - Clean build artifacts"
	@echo "  dev              - Start development server"
	@echo "  java-test        - Run Java unit tests"
	@echo "  java-test-integration - Run Java integration tests"
	@echo "  java-test-tdd    - Run TDD tests for enhanced generator"
	@echo ""
	@echo "TDD Testing:"
	@echo "  java-test-tdd                   - Run TDD tests for TypeScriptGenerator"
	@echo "  java-test-enhanced              - Run all enhanced generator tests"
	@echo ""
	@echo "Usage Examples:"
	@echo "  make setup-index SECRET_AZURE_SEARCH_KEY=your_key SECRET_AZURE_OPENAI_KEY=your_key"
	@echo "  make azure-config-generate INDEX_NAME=legis-qc-index-01"
	@echo "  make azure-config-test-integration"
	@echo "  make azure-config-generate-enhanced"
	@echo "  make typescript-generate-complete"

# Variables
SECRET_AZURE_SEARCH_KEY ?= 
SECRET_AZURE_OPENAI_KEY ?= 
INDEX_NAME ?= my-documents
NODE_ENV ?= development
AZURE_SEARCH_ENDPOINT ?= 
AZURE_SEARCH_INDEX_NAME ?= 
ENHANCED_OUTPUT_DIR ?= src

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install

# Build TypeScript project
build:
	@echo "Building TypeScript project..."
	npm run build

# Check environment variables
check-env:
	@echo "Checking environment variables..."
	@./scripts/check-env.sh

# Validate Azure Search configuration
validate-config:
	@echo "Validating Azure Search configuration..."
	@./scripts/validate-config.sh

# Setup Azure Search index and upload documents
setup-index: check-env build
	@echo "Setting up Azure Search index..."
	@if [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] || [ -z "$(SECRET_AZURE_OPENAI_KEY)" ]; then \
		echo "Error: SECRET_AZURE_SEARCH_KEY and SECRET_AZURE_OPENAI_KEY are required"; \
		echo "Usage: make setup-index SECRET_AZURE_SEARCH_KEY=your_key SECRET_AZURE_OPENAI_KEY=your_key"; \
		exit 1; \
	fi
	@./scripts/setup-index.sh "$(SECRET_AZURE_SEARCH_KEY)" "$(SECRET_AZURE_OPENAI_KEY)"

# Delete Azure Search index
delete-index: check-env build
	@echo "Deleting Azure Search index..."
	@if [ -z "$(SECRET_AZURE_SEARCH_KEY)" ]; then \
		echo "Error: SECRET_AZURE_SEARCH_KEY is required"; \
		echo "Usage: make delete-index SECRET_AZURE_SEARCH_KEY=your_key"; \
		exit 1; \
	fi
	@./scripts/delete-index.sh "$(SECRET_AZURE_SEARCH_KEY)"

# Reindex (delete and recreate)
reindex: delete-index setup-index
	@echo "Reindexing completed"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist/
	rm -rf node_modules/.cache/

# Start development server
dev: build
	@echo "Starting development server..."
	npm run dev:teamsfx

# Advanced index management
add-documents: check-env build
	@echo "Adding new documents to index..."
	@if [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] || [ -z "$(SECRET_AZURE_OPENAI_KEY)" ]; then \
		echo "Error: SECRET_AZURE_SEARCH_KEY and SECRET_AZURE_OPENAI_KEY are required"; \
		exit 1; \
	fi
	@./scripts/add-documents.sh "$(SECRET_AZURE_SEARCH_KEY)" "$(SECRET_AZURE_OPENAI_KEY)"

# Check index status
index-status: check-env
	@echo "Checking index status..."
	@if [ -z "$(SECRET_AZURE_SEARCH_KEY)" ]; then \
		echo "Error: SECRET_AZURE_SEARCH_KEY is required"; \
		exit 1; \
	fi
	@./scripts/check-index-status.sh "$(SECRET_AZURE_SEARCH_KEY)"

# Environment-specific targets
setup-playground: 
	$(MAKE) setup-index SECRET_AZURE_SEARCH_KEY="$$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2)" SECRET_AZURE_OPENAI_KEY="$$(grep SECRET_AZURE_OPENAI_API_KEY env/.env.playground.user | cut -d'=' -f2)"

setup-local:
	$(MAKE) setup-index SECRET_AZURE_SEARCH_KEY="$$(grep SECRET_AZURE_SEARCH_KEY env/.env.local.user | cut -d'=' -f2)" SECRET_AZURE_OPENAI_KEY="$$(grep SECRET_AZURE_OPENAI_API_KEY env/.env.local.user | cut -d'=' -f2)"

# ================================================================
# JAVA COMPONENTS - Azure Search Configuration Generator
# ================================================================

# Variables for Java components
JAVA_MAIN_CLASS = com.cotechnoe.teamsrag.indexconfigurator.AzureSearchConfigGenerator
JAVA_OUTPUT_DIR = src
JAVA_TARGET_DIR = target/classes
VERBOSE ?= false

# Build Java components
java-build:
	@echo "🔨 Building Java components..."
	@mvn compile -q
	@echo "✅ Java compilation completed"

# Run Java unit tests
java-test:
	@echo "🧪 Running Java unit tests..."
	@mvn test -q
	@echo "✅ All Java unit tests passed"

# Run Java integration tests (requires playground environment)
java-test-integration:
	@echo "🔗 Running Java integration tests with Azure Search..."
	@if [ ! -f env/.env.playground.user ]; then \
		echo "❌ Error: env/.env.playground.user not found"; \
		echo "   Integration tests require playground environment variables"; \
		exit 1; \
	fi
	@export $$(grep -v '^#' env/.env.playground.user | xargs) && mvn verify -q
	@echo "✅ Integration tests completed successfully"

# Generate TypeScript configuration from Azure Search index
azure-config-generate: java-build
	@echo "🚀 Generating TypeScript configuration from Azure Search index..."
	@if [ ! -f env/.env.playground.user ]; then \
		echo "❌ Error: env/.env.playground.user not found"; \
		echo "   Please ensure playground environment is configured"; \
		exit 1; \
	fi
	@echo "📖 Reading Azure Search index schema..."
	@mkdir -p $(JAVA_OUTPUT_DIR)
	@export $$(grep -v '^#' env/.env.playground.user | xargs) && \
	 java -cp $(JAVA_TARGET_DIR):$$(mvn dependency:build-classpath -q -Dmdep.outputFile=/dev/stdout) \
	 $(JAVA_MAIN_CLASS) \
	 --endpoint "$$AZURE_SEARCH_ENDPOINT" \
	 --api-key "$$SECRET_AZURE_SEARCH_KEY" \
	 --index-name "$${INDEX_NAME:-$$AZURE_SEARCH_INDEX_NAME}" \
	 --output-dir "$(JAVA_OUTPUT_DIR)" \
	 $(if $(filter true,$(VERBOSE)),--verbose,)
	@echo "✅ TypeScript configuration generated successfully in $(JAVA_OUTPUT_DIR)/"
	@echo "📁 Generated files:"
	@echo "   - azureAISearchDataSource.ts (Interface + DataSource config)"
	@echo "   - setup.ts (Index setup script)"
	@echo "   - utils.ts (Utility functions)"

# Validate generated Azure Search configuration
azure-config-validate:
	@echo "🔍 Validating generated Azure Search configuration..."
	@if [ ! -f "$(JAVA_OUTPUT_DIR)/azureAISearchDataSource.ts" ]; then \
		echo "❌ Error: azureAISearchDataSource.ts not found"; \
		echo "   Run 'make azure-config-generate' first"; \
		exit 1; \
	fi
	@echo "📝 Checking TypeScript syntax..."
	@npx tsc --noEmit $(JAVA_OUTPUT_DIR)/azureAISearchDataSource.ts 2>/dev/null || \
	 (echo "❌ TypeScript validation failed" && exit 1)
	@echo "🔗 Validating Azure Search connection..."
	@export $$(grep -v '^#' env/.env.playground.user | xargs) && \
	 java -cp $(JAVA_TARGET_DIR):$$(mvn dependency:build-classpath -q -Dmdep.outputFile=/dev/stdout) \
	 $(JAVA_MAIN_CLASS) --validate-only \
	 --endpoint "$$AZURE_SEARCH_ENDPOINT" \
	 --api-key "$$SECRET_AZURE_SEARCH_KEY" \
	 --index-name "$${INDEX_NAME:-$$AZURE_SEARCH_INDEX_NAME}"
	@echo "✅ Configuration validation completed successfully"

# Clean generated configuration files
azure-config-clean:
	@echo "🧹 Cleaning generated Azure Search configuration files..."
	@rm -f $(JAVA_OUTPUT_DIR)/azureAISearchDataSource.ts
	@rm -f $(JAVA_OUTPUT_DIR)/setup.ts
	@rm -f $(JAVA_OUTPUT_DIR)/utils.ts
	@rm -rf target/
	@echo "✅ Generated files cleaned"

# Test integration with real Azure Search (comprehensive)
azure-config-test-integration: java-build
	@echo "🔬 Running comprehensive integration tests..."
	@echo "🔍 Testing Azure Search connectivity..."
	@export $$(grep -v '^#' env/.env.playground.user | xargs) && \
	 java -cp $(JAVA_TARGET_DIR):$$(mvn dependency:build-classpath -q -Dmdep.outputFile=/dev/stdout) \
	 $(JAVA_MAIN_CLASS) --test-connection \
	 --endpoint "$$AZURE_SEARCH_ENDPOINT" \
	 --api-key "$$SECRET_AZURE_SEARCH_KEY" \
	 --index-name "$${INDEX_NAME:-$$AZURE_SEARCH_INDEX_NAME}"
	@echo "🧪 Running Java integration tests..."
	@$(MAKE) java-test-integration
	@echo "🚀 Testing configuration generation..."
	@$(MAKE) azure-config-generate
	@echo "🔍 Validating generated configuration..."
	@$(MAKE) azure-config-validate
	@echo "✅ All integration tests passed successfully"

# Azure Search Configuration Generator - Complete workflow
azure-config-workflow: azure-config-clean java-build azure-config-generate azure-config-validate
	@echo "🎉 Azure Search Configuration Generator workflow completed!"
	@echo ""
	@echo "📊 Summary:"
	@echo "  ✅ Java components compiled"
	@echo "  ✅ Configuration generated from Azure Search index"
	@echo "  ✅ TypeScript files validated"
	@echo ""
	@echo "📁 Generated files ready for use:"
	@echo "  - $(JAVA_OUTPUT_DIR)/azureAISearchDataSource.ts"
	@echo "  - $(JAVA_OUTPUT_DIR)/setup.ts"
	@echo "  - $(JAVA_OUTPUT_DIR)/utils.ts"

# Development helpers
azure-config-dev: java-build azure-config-generate
	@echo "🔧 Development mode: Quick generation for testing"

azure-config-info:
	@echo "ℹ️  Azure Search Configuration Generator Information"
	@echo "=================================================="
	@echo ""
	@echo "📁 Output directory: $(JAVA_OUTPUT_DIR)"
	@echo "🎯 Main class: $(JAVA_MAIN_CLASS)"
	@echo "📝 Current index: $${INDEX_NAME:-$$AZURE_SEARCH_INDEX_NAME}"
	@if [ -f env/.env.playground.user ]; then \
		echo "🔗 Endpoint: $$(grep AZURE_SEARCH_ENDPOINT env/.env.playground.user | cut -d'=' -f2)"; \
		echo "📊 Environment: playground"; \
	else \
		echo "❌ No environment configuration found"; \
	fi
	@echo ""
	@echo "📚 Documentation: docs/azure-search-config-generator.md"

# Enhanced TypeScript generation targets
azure-config-generate-enhanced: java-build
	@echo "🚀 Generating enhanced TypeScript configuration..."
	@if [ ! -f env/.env.playground.user ]; then \
		echo "❌ Error: env/.env.playground.user not found"; \
		echo "   Please ensure playground environment is configured"; \
		exit 1; \
	fi
	@echo "📖 Reading Azure Search index schema..."
	@mkdir -p $(ENHANCED_OUTPUT_DIR)
	@export $$(grep -v '^#' env/.env.playground.user | xargs) && \
	 java -cp $(JAVA_TARGET_DIR):$$(mvn dependency:build-classpath -q -Dmdep.outputFile=/dev/stdout) \
	 $(JAVA_MAIN_CLASS) \
	 --endpoint "$$AZURE_SEARCH_ENDPOINT" \
	 --api-key "$$SECRET_AZURE_SEARCH_KEY" \
	 --index-name "$${INDEX_NAME:-$$AZURE_SEARCH_INDEX_NAME}" \
	 --output-dir "$(ENHANCED_OUTPUT_DIR)" \
	 --enhanced \
	 $(if $(filter true,$(VERBOSE)),--verbose,)
	@echo "✅ Enhanced TypeScript configuration generated successfully in $(ENHANCED_OUTPUT_DIR)/"
	@echo "📁 Generated files:"
	@echo "   - azureAISearchDataSource.ts (Interface + DataSource config)"
	@echo "   - setup.ts (Index setup script)"
	@echo "   - utils.ts (Utility functions)"

typescript-generate-complete: java-build
	@echo "🚀 Generating complete TypeScript configuration..."
	@if [ ! -f env/.env.playground.user ]; then \
		echo "❌ Error: env/.env.playground.user not found"; \
		echo "   Please ensure playground environment is configured"; \
		exit 1; \
	fi
	@echo "📖 Reading Azure Search index schema..."
	@mkdir -p $(ENHANCED_OUTPUT_DIR)
	@export $$(grep -v '^#' env/.env.playground.user | xargs) && \
	 java -cp $(JAVA_TARGET_DIR):$$(mvn dependency:build-classpath -q -Dmdep.outputFile=/dev/stdout) \
	 $(JAVA_MAIN_CLASS) \
	 --endpoint "$$AZURE_SEARCH_ENDPOINT" \
	 --api-key "$$SECRET_AZURE_SEARCH_KEY" \
	 --index-name "$${INDEX_NAME:-$$AZURE_SEARCH_INDEX_NAME}" \
	 --output-dir "$(ENHANCED_OUTPUT_DIR)" \
	 --complete \
	 $(if $(filter true,$(VERBOSE)),--verbose,)
	@echo "✅ Complete TypeScript configuration generated successfully in $(ENHANCED_OUTPUT_DIR)/"
	@echo "📁 Generated files:"
	@echo "   - azureAISearchDataSource.ts (Interface + DataSource config)"
	@echo "   - setup.ts (Index setup script)"
	@echo "   - utils.ts (Utility functions)"

# TDD testing for enhanced generator
java-test-tdd:
	@echo "🧪 Running TDD tests for TypeScriptGenerator..."
	@mvn test -Dtest="**/*indexconfigurator*/**/*Test" -q
	@echo "✅ All TDD tests passed"

java-test-enhanced:
	@echo "🧪 Running all enhanced generator tests..."
	@$(MAKE) java-test-tdd
	@$(MAKE) azure-config-generate-enhanced
	@$(MAKE) typescript-generate-complete
	@$(MAKE) azure-config-validate
	@echo "✅ All enhanced generator tests passed"

# Add new targets to PHONY
.PHONY: java-build java-test java-test-integration azure-config-generate azure-config-validate azure-config-clean azure-config-test-integration azure-config-workflow azure-config-dev azure-config-info azure-config-generate-enhanced typescript-generate-complete java-test-tdd java-test-enhanced