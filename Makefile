# Makefile for Azure AI Search Index Management
# Microsoft 365 Teams Agent - Chatbot Legis QC

.PHONY: help install build index-setup index-delete env-check config-validate clean

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
	@echo "  documents-add    - Add new documents to existing index"
	@echo ""
	@echo "Environment:"
	@echo "  env-check        - Validate environment variables"
	@echo "  config-validate  - Validate Azure Search configuration"
	@echo ""
	@echo "Development:"
	@echo "  clean            - Clean build artifacts"
	@echo "  dev              - Start development server"
	@echo ""
	@echo "Environment-specific:"
	@echo "  playground-setup - Setup index using playground environment"
	@echo "  local-setup      - Setup index using local environment"
	@echo ""
	@echo "Usage Examples:"
	@echo "  make index-setup AZURE_SEARCH_KEY=your_key AZURE_OPENAI_KEY=your_key"
	@echo "  make index-delete AZURE_SEARCH_KEY=your_key"
	@echo "  make index-status AZURE_SEARCH_KEY=your_key"
	@echo "  make playground-setup  # Uses keys from env/.env.playground.user"

# Variables
AZURE_SEARCH_KEY ?= 
AZURE_OPENAI_KEY ?= 
INDEX_NAME ?= my-documents
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
	@if [ -z "$(AZURE_SEARCH_KEY)" ] || [ -z "$(AZURE_OPENAI_KEY)" ]; then \
		echo "Error: AZURE_SEARCH_KEY and AZURE_OPENAI_KEY are required"; \
		echo "Usage: make index-setup AZURE_SEARCH_KEY=your_key AZURE_OPENAI_KEY=your_key"; \
		exit 1; \
	fi
	@./scripts/index-setup.sh "$(AZURE_SEARCH_KEY)" "$(AZURE_OPENAI_KEY)"

# Delete Azure Search index
index-delete: env-check build
	@echo "Deleting Azure Search index..."
	@if [ -z "$(AZURE_SEARCH_KEY)" ]; then \
		echo "Error: AZURE_SEARCH_KEY is required"; \
		echo "Usage: make index-delete AZURE_SEARCH_KEY=your_key"; \
		exit 1; \
	fi
	@./scripts/index-delete.sh "$(AZURE_SEARCH_KEY)"

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
	@if [ -z "$(AZURE_SEARCH_KEY)" ] || [ -z "$(AZURE_OPENAI_KEY)" ]; then \
		echo "Error: AZURE_SEARCH_KEY and AZURE_OPENAI_KEY are required"; \
		exit 1; \
	fi
	@./scripts/documents-add.sh "$(AZURE_SEARCH_KEY)" "$(AZURE_OPENAI_KEY)"

# Check index status
index-status: env-check
	@echo "Checking index status..."
	@if [ -z "$(AZURE_SEARCH_KEY)" ]; then \
		echo "Error: AZURE_SEARCH_KEY is required"; \
		exit 1; \
	fi
	@./scripts/index-status-check.sh "$(AZURE_SEARCH_KEY)"

# Environment-specific targets
playground-setup: 
	$(MAKE) index-setup AZURE_SEARCH_KEY="$$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2)" AZURE_OPENAI_KEY="$$(grep SECRET_AZURE_OPENAI_API_KEY env/.env.playground.user | cut -d'=' -f2)"

local-setup:
	$(MAKE) index-setup AZURE_SEARCH_KEY="$$(grep SECRET_AZURE_SEARCH_KEY env/.env.local.user | cut -d'=' -f2)" AZURE_OPENAI_KEY="$$(grep SECRET_AZURE_OPENAI_API_KEY env/.env.local.user | cut -d'=' -f2)"
