# Makefile for Azure AI Search Index Management
# Microsoft 365 Teams Agent - Chatbot Legis QC

.PHONY: help install build index-setup index-delete index-reindex index-status index-test env-check config-validate clean index-name-set index-config-list playground-env-setup playground-env-validate playground-setup playground-test local-setup local-test

# Environment-specific targets
playground-setup: 
	$(MAKE) index-setup SECRET_AZURE_SEARCH_KEY="$$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2)" SECRET_AZURE_OPENAI_API_KEY="$$(grep SECRET_AZURE_OPENAI_API_KEY env/.env.playground.user | cut -d'=' -f2)"

playground-test:
	$(MAKE) index-test SECRET_AZURE_SEARCH_KEY="$$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2)"

local-setup:
	$(MAKE) index-setup SECRET_AZURE_SEARCH_KEY="$$(grep SECRET_AZURE_SEARCH_KEY env/.env.local.user | cut -d'=' -f2)" SECRET_AZURE_OPENAI_API_KEY="$$(grep SECRET_AZURE_OPENAI_API_KEY env/.env.local.user | cut -d'=' -f2)"

local-test:
	$(MAKE) index-test SECRET_AZURE_SEARCH_KEY="$$(grep SECRET_AZURE_SEARCH_KEY env/.env.local.user | cut -d'=' -f2)"Azure AI Search Index Management
# Microsoft 365 Teams Agent - Chatbot Legis QC

.PHONY: help install build index-setup index-delete env-c# Environment# Environment-specific targets
playground-setup: 
	$(MAKE) index-setup SECRET_AZURE_SEARCH_KEY="$$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2)" SECRET_AZURE_OPENAI_API_KEY="$$(grep SECRET_AZURE_OPENAI_API_KEY env/.env.playground.user | cut -d'=' -f2)"

playground-test:
	$(MAKE) index-test SECRET_AZURE_SEARCH_KEY="$$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2)"

local-setup:
	$(MAKE) index-setup SECRET_AZURE_SEARCH_KEY="$$(grep SECRET_AZURE_SEARCH_KEY env/.env.local.user | cut -d'=' -f2)" SECRET_AZURE_OPENAI_API_KEY="$$(grep SECRET_AZURE_OPENAI_API_KEY env/.env.local.user | cut -d'=' -f2)"

local-test:
	$(MAKE) index-test SECRET_AZURE_SEARCH_KEY="$$(grep SECRET_AZURE_SEARCH_KEY env/.env.local.user | cut -d'=' -f2)"

# Default target
help:
	@echo "Azure AI Search Index Management Commands"
	@echo "========================================"
	@echo ""
	@echo "Setup Commands:"
	@echo "  install          - Install dependencies"
	@echo "  build            - Build TypeScript project"
	@echo ""
	@echo "Index Management:"
	@echo "  index-setup      - Create index and upload documents"
	@echo "  index-delete     - Delete the search index"
	@echo "  index-reindex    - Delete and recreate index with fresh data"
	@echo "  index-status     - Check index status and statistics"
	@echo "  index-test       - Test index content and search functionality"
	@echo "  index-name-set   - Set custom index name"
	@echo "  index-config-list - List current index configurations"
	@echo "  documents-add    - Add new documents to existing index"
	@echo ""
	@echo "Environment:"
	@echo "  env-check        - Validate environment variables"
	@echo "  config-validate  - Validate Azure Search configuration"
	@echo "  playground-env-setup - Setup Preview Playground environment files"
	@echo "  playground-env-validate - Validate Preview Playground configuration"
	@echo ""
	@echo "Development:"
	@echo "  clean            - Clean build artifacts"
	@echo "  dev              - Start development server"
	@echo ""
	@echo "Environment-specific:"
	@echo "  playground-setup - Setup index using playground environment"
	@echo "  playground-test  - Test index using playground environment"
	@echo "  local-setup      - Setup index using local environment"
	@echo "  local-test       - Test index using local environment"
	@echo ""
	@echo "Microsoft 365 Playground:"
	@echo "  playground-env-setup    - Create playground environment files"
	@echo "  playground-env-validate - Validate playground configuration"
	@echo ""
	@echo "Usage Examples:"
	@echo "  make index-setup SECRET_AZURE_SEARCH_KEY=your_key SECRET_AZURE_OPENAI_API_KEY=your_key"
	@echo "  make index-delete SECRET_AZURE_SEARCH_KEY=your_key"
	@echo "  make index-status SECRET_AZURE_SEARCH_KEY=your_key"
	@echo "  make index-name-set INDEX_NAME=my-custom-index ENVIRONMENT=local"
	@echo "  make playground-setup  # Uses keys from env/.env.playground.user"

# Variables
SECRET_AZURE_SEARCH_KEY ?= 
SECRET_AZURE_OPENAI_API_KEY ?= 
INDEX_NAME ?= my-documents
ENVIRONMENT ?= local
NODE_ENV ?= development

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install

# Build TypeScript project
build:
	@echo "Building TypeScript project..."
	npm run build

# Check environment variables
env-check:
	@echo "Checking environment variables..."
	@./scripts/env-check.sh

# Validate Azure Search configuration
config-validate:
	@echo "Validating Azure Search configuration..."
	@./scripts/config-validate.sh

# Setup Azure Search index and upload documents
index-setup: env-check build
	@echo "Setting up Azure Search index..."
	@if [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] || [ -z "$(SECRET_AZURE_OPENAI_API_KEY)" ]; then \
		echo "Error: SECRET_AZURE_SEARCH_KEY and SECRET_AZURE_OPENAI_API_KEY are required"; \
		echo "Usage: make index-setup SECRET_AZURE_SEARCH_KEY=your_key SECRET_AZURE_OPENAI_API_KEY=your_key"; \
		exit 1; \
	fi
	@./scripts/index-setup.sh "$(SECRET_AZURE_SEARCH_KEY)" "$(SECRET_AZURE_OPENAI_API_KEY)"

# Delete Azure Search index
index-delete: env-check build
	@echo "Deleting Azure Search index..."
	@if [ -z "$(SECRET_AZURE_SEARCH_KEY)" ]; then \
		echo "Error: SECRET_AZURE_SEARCH_KEY is required"; \
		echo "Usage: make index-delete SECRET_AZURE_SEARCH_KEY=your_key"; \
		exit 1; \
	fi
	@./scripts/index-delete.sh "$(SECRET_AZURE_SEARCH_KEY)"

# Reindex (delete and recreate)
index-reindex: index-delete index-setup
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
documents-add: env-check build
	@echo "Adding new documents to index..."
	@if [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] || [ -z "$(SECRET_AZURE_OPENAI_API_KEY)" ]; then \
		echo "Error: SECRET_AZURE_SEARCH_KEY and SECRET_AZURE_OPENAI_API_KEY are required"; \
		exit 1; \
	fi
	@./scripts/documents-add.sh "$(SECRET_AZURE_SEARCH_KEY)" "$(SECRET_AZURE_OPENAI_API_KEY)"

# Check index status
index-status: env-check
	@echo "Checking index status..."
	@if [ -z "$(SECRET_AZURE_SEARCH_KEY)" ]; then \
		echo "Error: SECRET_AZURE_SEARCH_KEY is required"; \
		exit 1; \
	fi
	@./scripts/index-status-check.sh "$(SECRET_AZURE_SEARCH_KEY)"

# Test index content and search functionality
index-test: env-check
	@echo "Testing index content and search functionality..."
	@if [ -z "$(SECRET_AZURE_SEARCH_KEY)" ]; then \
		echo "Error: SECRET_AZURE_SEARCH_KEY is required"; \
		exit 1; \
	fi
	@./scripts/index-test.sh "$(SECRET_AZURE_SEARCH_KEY)"

# Set custom index name
index-name-set:
	@echo "Setting index name..."
	@if [ -z "$(INDEX_NAME)" ]; then \
		echo "Error: INDEX_NAME is required"; \
		echo "Usage: make index-name-set INDEX_NAME=your-index-name [ENVIRONMENT=local|playground]"; \
		exit 1; \
	fi
	@./scripts/index-name-set.sh "$(INDEX_NAME)" "$(ENVIRONMENT)"

# List current index configurations
index-config-list:
	@echo "Listing index configurations..."
	@./scripts/index-config-list.sh

# Setup Preview Playground environment files
playground-env-setup:
	@echo "Setting up Preview Playground environment..."
	@./scripts/playground-env-setup.sh

# Validate Preview Playground environment configuration
playground-env-validate:
	@echo "Validating Preview Playground environment..."
	@./scripts/playground-env-validate.sh
