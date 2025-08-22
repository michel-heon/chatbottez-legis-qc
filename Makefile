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
	@echo ""
	@echo "Index Management:"
	@echo "  setup-index      - Create index and upload documents"
	@echo "  delete-index     - Delete the search index"
	@echo "  reindex          - Delete and recreate index with fresh data"
	@echo ""
	@echo "Environment:"
	@echo "  check-env        - Validate environment variables"
	@echo "  validate-config  - Validate Azure Search configuration"
	@echo ""
	@echo "Development:"
	@echo "  clean            - Clean build artifacts"
	@echo "  dev              - Start development server"
	@echo ""
	@echo "Usage Examples:"
	@echo "  make setup-index AZURE_SEARCH_KEY=your_key AZURE_OPENAI_KEY=your_key"
	@echo "  make delete-index AZURE_SEARCH_KEY=your_key"

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
	@if [ -z "$(AZURE_SEARCH_KEY)" ] || [ -z "$(AZURE_OPENAI_KEY)" ]; then \
		echo "Error: AZURE_SEARCH_KEY and AZURE_OPENAI_KEY are required"; \
		echo "Usage: make setup-index AZURE_SEARCH_KEY=your_key AZURE_OPENAI_KEY=your_key"; \
		exit 1; \
	fi
	@./scripts/setup-index.sh "$(AZURE_SEARCH_KEY)" "$(AZURE_OPENAI_KEY)"

# Delete Azure Search index
delete-index: check-env build
	@echo "Deleting Azure Search index..."
	@if [ -z "$(AZURE_SEARCH_KEY)" ]; then \
		echo "Error: AZURE_SEARCH_KEY is required"; \
		echo "Usage: make delete-index AZURE_SEARCH_KEY=your_key"; \
		exit 1; \
	fi
	@./scripts/delete-index.sh "$(AZURE_SEARCH_KEY)"

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
	@if [ -z "$(AZURE_SEARCH_KEY)" ] || [ -z "$(AZURE_OPENAI_KEY)" ]; then \
		echo "Error: AZURE_SEARCH_KEY and AZURE_OPENAI_KEY are required"; \
		exit 1; \
	fi
	@./scripts/add-documents.sh "$(AZURE_SEARCH_KEY)" "$(AZURE_OPENAI_KEY)"

# Check index status
index-status: check-env
	@echo "Checking index status..."
	@if [ -z "$(AZURE_SEARCH_KEY)" ]; then \
		echo "Error: AZURE_SEARCH_KEY is required"; \
		exit 1; \
	fi
	@./scripts/check-index-status.sh "$(AZURE_SEARCH_KEY)"

# Environment-specific targets
setup-playground: 
	$(MAKE) setup-index AZURE_SEARCH_KEY="$$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2)" AZURE_OPENAI_KEY="$$(grep SECRET_AZURE_OPENAI_API_KEY env/.env.playground.user | cut -d'=' -f2)"

setup-local:
	$(MAKE) setup-index AZURE_SEARCH_KEY="$$(grep SECRET_AZURE_SEARCH_KEY env/.env.local.user | cut -d'=' -f2)" AZURE_OPENAI_KEY="$$(grep SECRET_AZURE_OPENAI_API_KEY env/.env.local.user | cut -d'=' -f2)"
