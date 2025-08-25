# Makefile for Azure AI Search Index Management
# Microsoft 365 Teams Agent - Chatbot Legis QC
#
# CONVENTION OBLIGATOIRE : Toutes les règles doivent suivre <objet>-<action>
# Voir NAMING_CONVENTIONS.md pour les détails complets

# Export ENV_CONFIG to sub-shells
export ENV_CONFIG

.PHONY: help install build index-setup index-delete index-reindex index-status index-test env-check config-validate clean index-name-set index-config-list playground-env-setup playground-env-validate data-populate data-sparql-populate conventions-validate

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
	@echo "  data-populate    - Populate data directory with random PDF files"
	@echo "  data-sparql-populate - Populate Azure Search index using SPARQL queries"
	@echo "  conventions-validate - Validate naming conventions for scripts and rules"
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
	@echo "TTL/RDF Metadata:"
	@echo "  ttl-test         - Test TTL parser and SPARQL functionality"
	@echo "  ttl-analyze      - Analyze TTL metadata structure"
	@echo "  ttl-samples      - Generate enhanced document samples"
	@echo "  ttl-capabilities - Show TTL parser capabilities"
	@echo ""
	@echo "Enhanced Setup:"
	@echo "  enhanced-setup-v2 - Complete TTL-driven workflow (recommended)"
	@echo "  enhanced-setup   - Legacy enhanced setup with TTL metadata integration"
	@echo "  enhanced-demo    - Demo enhanced setup with sample credentials"
	@echo ""
	@echo "TTL-Driven Workflow (Segmented):"
	@echo "  ttl-analyze      - Analyze TTL metadata and extract index schema"
	@echo "  index-create-ttl - Create Azure Search index from TTL schema"
	@echo "  files-discover   - Discover files to process from TTL metadata"
	@echo "  content-process  - Process PDF content and generate embeddings"
	@echo "  index-populate   - Populate index with processed content"
	@echo ""
	@echo "Usage Examples:"
	@echo "  make index-setup SECRET_AZURE_SEARCH_KEY=your_key SECRET_AZURE_OPENAI_API_KEY=your_key"
	@echo "  make index-delete SECRET_AZURE_SEARCH_KEY=your_key"
	@echo "  make index-status SECRET_AZURE_SEARCH_KEY=your_key"
	@echo "  make index-name-set INDEX_NAME=my-custom-index ENVIRONMENT=local"
	@echo ""
	@echo "Environment-based Commands (auto-load keys):"
	@echo "  make index-delete ENV_CONFIG=playground"
	@echo "  make index-delete ENV_CONFIG=local"
	@echo "  make index-delete ENV_CONFIG=playground FORCE=true  # Skip confirmation"
	@echo "  make index-status ENV_CONFIG=playground"
	@echo "  make index-setup ENV_CONFIG=playground"
	@echo ""
	@echo "  make playground-setup  # Uses keys from env/.env.playground.user"
	@echo ""
	@echo "📝 CONVENTIONS SIMPLES ET OBLIGATOIRES:"
	@echo "  📚 Documents projet (*.md) → ./docs/"
	@echo "  ⚙️  Scripts (*.sh) → ./scripts/"
	@echo "  📄 Données index → ./src/indexers/data/"
	@echo "  🏠 README.md → ./ (racine)"
	@echo "  🔍 Validation: make conventions-validate"

# Variables
SECRET_AZURE_SEARCH_KEY ?= 
SECRET_AZURE_OPENAI_API_KEY ?= 
INDEX_NAME ?= my-documents
ENV_CONFIG ?= local
FORCE ?= false
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
	@# Auto-load keys from ENV_CONFIG if not provided
	@if [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] && [ "$(ENV_CONFIG)" = "playground" ]; then \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2); \
		SECRET_AZURE_OPENAI_API_KEY=$$(grep SECRET_AZURE_OPENAI_API_KEY env/.env.playground.user | cut -d'=' -f2); \
		./scripts/index-setup.sh "$$SECRET_AZURE_SEARCH_KEY" "$$SECRET_AZURE_OPENAI_API_KEY"; \
	elif [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] && [ "$(ENV_CONFIG)" = "local" ]; then \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.local.user | cut -d'=' -f2); \
		SECRET_AZURE_OPENAI_API_KEY=$$(grep SECRET_AZURE_OPENAI_API_KEY env/.env.local.user | cut -d'=' -f2); \
		./scripts/index-setup.sh "$$SECRET_AZURE_SEARCH_KEY" "$$SECRET_AZURE_OPENAI_API_KEY"; \
	elif [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] && [ "$(ENV_CONFIG)" = "dev" ]; then \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.dev.user | cut -d'=' -f2); \
		SECRET_AZURE_OPENAI_API_KEY=$$(grep SECRET_AZURE_OPENAI_API_KEY env/.env.dev.user | cut -d'=' -f2); \
		./scripts/index-setup.sh "$$SECRET_AZURE_SEARCH_KEY" "$$SECRET_AZURE_OPENAI_API_KEY"; \
	elif [ -n "$(SECRET_AZURE_SEARCH_KEY)" ] && [ -n "$(SECRET_AZURE_OPENAI_API_KEY)" ]; then \
		./scripts/index-setup.sh "$(SECRET_AZURE_SEARCH_KEY)" "$(SECRET_AZURE_OPENAI_API_KEY)"; \
	else \
		echo "Error: SECRET_AZURE_SEARCH_KEY and SECRET_AZURE_OPENAI_API_KEY are required"; \
		echo "Usage: make index-setup SECRET_AZURE_SEARCH_KEY=your_key SECRET_AZURE_OPENAI_API_KEY=your_key"; \
		echo "   or: make index-setup ENV_CONFIG=playground"; \
		exit 1; \
	fi

# Delete Azure Search index
index-delete: env-check build
	@echo "Deleting Azure Search index..."
	@# Auto-load keys from ENV_CONFIG if not provided
	@if [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] && [ "$(ENV_CONFIG)" = "playground" ]; then \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2); \
		if [ "$(FORCE)" = "true" ]; then \
			echo "yes" | ./scripts/index-delete.sh "$$SECRET_AZURE_SEARCH_KEY"; \
		else \
			./scripts/index-delete.sh "$$SECRET_AZURE_SEARCH_KEY"; \
		fi; \
	elif [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] && [ "$(ENV_CONFIG)" = "local" ]; then \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.local.user | cut -d'=' -f2); \
		if [ "$(FORCE)" = "true" ]; then \
			echo "yes" | ./scripts/index-delete.sh "$$SECRET_AZURE_SEARCH_KEY"; \
		else \
			./scripts/index-delete.sh "$$SECRET_AZURE_SEARCH_KEY"; \
		fi; \
	elif [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] && [ "$(ENV_CONFIG)" = "dev" ]; then \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.dev.user | cut -d'=' -f2); \
		if [ "$(FORCE)" = "true" ]; then \
			echo "yes" | ./scripts/index-delete.sh "$$SECRET_AZURE_SEARCH_KEY"; \
		else \
			./scripts/index-delete.sh "$$SECRET_AZURE_SEARCH_KEY"; \
		fi; \
	elif [ -n "$(SECRET_AZURE_SEARCH_KEY)" ]; then \
		if [ "$(FORCE)" = "true" ]; then \
			echo "yes" | ./scripts/index-delete.sh "$(SECRET_AZURE_SEARCH_KEY)"; \
		else \
			./scripts/index-delete.sh "$(SECRET_AZURE_SEARCH_KEY)"; \
		fi; \
	else \
		echo "Error: SECRET_AZURE_SEARCH_KEY is required"; \
		echo "Usage: make index-delete SECRET_AZURE_SEARCH_KEY=your_key"; \
		echo "   or: make index-delete ENV_CONFIG=playground"; \
		echo "   or: make index-delete ENV_CONFIG=playground FORCE=true"; \
		exit 1; \
	fi

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
	@# Auto-load keys from ENV_CONFIG if not provided
	@if [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] && [ "$(ENV_CONFIG)" = "playground" ]; then \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2); \
		./scripts/index-status-check.sh "$$SECRET_AZURE_SEARCH_KEY"; \
	elif [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] && [ "$(ENV_CONFIG)" = "local" ]; then \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.local.user | cut -d'=' -f2); \
		./scripts/index-status-check.sh "$$SECRET_AZURE_SEARCH_KEY"; \
	elif [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] && [ "$(ENV_CONFIG)" = "dev" ]; then \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.dev.user | cut -d'=' -f2); \
		./scripts/index-status-check.sh "$$SECRET_AZURE_SEARCH_KEY"; \
	elif [ -n "$(SECRET_AZURE_SEARCH_KEY)" ]; then \
		./scripts/index-status-check.sh "$(SECRET_AZURE_SEARCH_KEY)"; \
	else \
		echo "Error: SECRET_AZURE_SEARCH_KEY is required"; \
		echo "Usage: make index-status SECRET_AZURE_SEARCH_KEY=your_key"; \
		echo "   or: make index-status ENV_CONFIG=playground"; \
		exit 1; \
	fi

# Test index content and search functionality
index-test: env-check
	@echo "Testing index content and search functionality..."
	@# Auto-load keys from ENV_CONFIG if not provided
	@if [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] && [ "$(ENV_CONFIG)" = "playground" ]; then \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2); \
		./scripts/index-test.sh "$$SECRET_AZURE_SEARCH_KEY"; \
	elif [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] && [ "$(ENV_CONFIG)" = "local" ]; then \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.local.user | cut -d'=' -f2); \
		./scripts/index-test.sh "$$SECRET_AZURE_SEARCH_KEY"; \
	elif [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] && [ "$(ENV_CONFIG)" = "dev" ]; then \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.dev.user | cut -d'=' -f2); \
		./scripts/index-test.sh "$$SECRET_AZURE_SEARCH_KEY"; \
	elif [ -n "$(SECRET_AZURE_SEARCH_KEY)" ]; then \
		./scripts/index-test.sh "$(SECRET_AZURE_SEARCH_KEY)"; \
	else \
		echo "Error: SECRET_AZURE_SEARCH_KEY is required"; \
		echo "Usage: make index-test SECRET_AZURE_SEARCH_KEY=your_key"; \
		echo "   or: make index-test ENV_CONFIG=playground"; \
		exit 1; \
	fi

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

# Populate data directory with random PDF files
data-populate:
	@echo "Populating data directory with random PDF files..."
	@./scripts/data-populate.sh

# Data SPARQL Population
data-sparql-populate:
	@echo "🚀 Populating Azure Search index using SPARQL queries..."
	@chmod +x scripts/data-sparql-populate.sh
	@./scripts/data-sparql-populate.sh

# TTL/RDF Metadata Commands
ttl-test:
	@echo "Testing TTL parser and SPARQL functionality..."
	@./scripts/ttl-parser-utils.sh test

ttl-analyze:
	@echo "Analyzing TTL metadata structure..."
	@./scripts/ttl-parser-utils.sh analyze

ttl-samples:
	@echo "Generating enhanced document samples..."
	@./scripts/ttl-parser-utils.sh samples

ttl-capabilities:
	@echo "Showing TTL parser capabilities..."
	@./scripts/ttl-parser-utils.sh capabilities

# Enhanced Setup V2 - Complete TTL-driven workflow
enhanced-setup-v2: env-check build
	@echo "🚀 Enhanced Setup V2 - TTL-driven Architecture"
	@chmod +x scripts/enhanced-setup-v2.sh
	@./scripts/enhanced-setup-v2.sh "$(ENV_CONFIG)" "full"

# TTL Schema Analysis
ttl-analyze: env-check build
	@echo "🔍 Analyzing TTL Schema..."
	@chmod +x scripts/ttl-schema-analyze.sh
	@./scripts/ttl-schema-analyze.sh "$(ENV_CONFIG)"

# Create Index from TTL Schema
index-create-ttl: env-check build
	@echo "🏗️  Creating Index from TTL Schema..."
	@chmod +x scripts/index-create-from-ttl.sh
	@./scripts/index-create-from-ttl.sh "$(ENV_CONFIG)"

# Discover Files from TTL
files-discover: env-check build
	@echo "🔍 Discovering Files from TTL..."
	@chmod +x scripts/ttl-files-discover.sh
	@./scripts/ttl-files-discover.sh "$(ENV_CONFIG)"

# Process Content in Batches
content-process: env-check build
	@echo "⚙️  Processing Content..."
	@chmod +x scripts/content-process-batch.sh
	@./scripts/content-process-batch.sh "$(ENV_CONFIG)" "$(or $(BATCH_SIZE),10)"

# Populate Index from TTL
index-populate: env-check build
	@echo "📤 Populating Index..."
	@chmod +x scripts/index-populate-from-ttl.sh
	@./scripts/index-populate-from-ttl.sh "$(ENV_CONFIG)" "$(or $(MODE),incremental)"

# Schema-only mode (for development)
schema-only: env-check build
	@echo "🎯 Schema-only Setup..."
	@chmod +x scripts/enhanced-setup-v2.sh
	@./scripts/enhanced-setup-v2.sh "$(ENV_CONFIG)" "schema-only"

# Incremental update mode
incremental-update: env-check build
	@echo "🔄 Incremental Update..."
	@chmod +x scripts/enhanced-setup-v2.sh
# Enhanced Setup Legacy (for compatibility)
enhanced-setup: env-check build
	@echo "🚀 Running Enhanced Index Setup with TTL Metadata Integration..."
	@# Load environment variables based on ENV_CONFIG
	@if [ "$(ENV_CONFIG)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		node lib/src/indexers/enhancedSetup.js "$$SECRET_AZURE_SEARCH_KEY" "$$SECRET_AZURE_OPENAI_API_KEY" "$(or $(INDEX_NAME),enhanced-legis-qc)"; \
	elif [ "$(ENV_CONFIG)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		node lib/src/indexers/enhancedSetup.js "$$SECRET_AZURE_SEARCH_KEY" "$$SECRET_AZURE_OPENAI_API_KEY" "$(or $(INDEX_NAME),enhanced-legis-qc)"; \
	elif [ "$(ENV_CONFIG)" = "dev" ] && [ -f "env/.env.dev.user" ]; then \
		set -a && . env/.env.dev.user && set +a && \
		node lib/src/indexers/enhancedSetup.js "$$SECRET_AZURE_SEARCH_KEY" "$$SECRET_AZURE_OPENAI_API_KEY" "$(or $(INDEX_NAME),enhanced-legis-qc)"; \
	elif [ -n "$(SECRET_AZURE_SEARCH_KEY)" ] && [ -n "$(SECRET_AZURE_OPENAI_API_KEY)" ]; then \
		node lib/src/indexers/enhancedSetup.js "$(SECRET_AZURE_SEARCH_KEY)" "$(SECRET_AZURE_OPENAI_API_KEY)" "$(or $(INDEX_NAME),enhanced-legis-qc)"; \
	else \
		echo "❌ Error: SECRET_AZURE_SEARCH_KEY and SECRET_AZURE_OPENAI_API_KEY are required"; \
		echo "Usage: make enhanced-setup SECRET_AZURE_SEARCH_KEY=<your-key> SECRET_AZURE_OPENAI_API_KEY=<your-key> [INDEX_NAME=<index-name>]"; \
		echo "   or: make enhanced-setup ENV_CONFIG=playground (loads from env/.env.playground.user)"; \
		echo "   or: make enhanced-setup ENV_CONFIG=local (loads from env/.env.local.user)"; \
		echo "   or: make enhanced-setup ENV_CONFIG=dev (loads from env/.env.dev.user)"; \
		exit 1; \
	fi	@echo "🚀 Running Enhanced Index Setup with TTL Metadata Integration..."
	@# Load environment variables based on ENV_CONFIG
	@if [ "$(ENV_CONFIG)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		node lib/src/indexers/enhancedSetup.js "$$SECRET_AZURE_SEARCH_KEY" "$$SECRET_AZURE_OPENAI_API_KEY" "$(or $(INDEX_NAME),enhanced-legis-qc)"; \
	elif [ "$(ENV_CONFIG)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		node lib/src/indexers/enhancedSetup.js "$$SECRET_AZURE_SEARCH_KEY" "$$SECRET_AZURE_OPENAI_API_KEY" "$(or $(INDEX_NAME),enhanced-legis-qc)"; \
	elif [ "$(ENV_CONFIG)" = "dev" ] && [ -f "env/.env.dev.user" ]; then \
		set -a && . env/.env.dev.user && set +a && \
		node lib/src/indexers/enhancedSetup.js "$$SECRET_AZURE_SEARCH_KEY" "$$SECRET_AZURE_OPENAI_API_KEY" "$(or $(INDEX_NAME),enhanced-legis-qc)"; \
	elif [ -n "$(SECRET_AZURE_SEARCH_KEY)" ] && [ -n "$(SECRET_AZURE_OPENAI_API_KEY)" ]; then \
		node lib/src/indexers/enhancedSetup.js "$(SECRET_AZURE_SEARCH_KEY)" "$(SECRET_AZURE_OPENAI_API_KEY)" "$(or $(INDEX_NAME),enhanced-legis-qc)"; \
	else \
		echo "❌ Error: SECRET_AZURE_SEARCH_KEY and SECRET_AZURE_OPENAI_API_KEY are required"; \
		echo "Usage: make enhanced-setup SECRET_AZURE_SEARCH_KEY=<your-key> SECRET_AZURE_OPENAI_API_KEY=<your-key> [INDEX_NAME=<index-name>]"; \
		echo "   or: make enhanced-setup ENV_CONFIG=playground (loads from env/.env.playground.user)"; \
		echo "   or: make enhanced-setup ENV_CONFIG=local (loads from env/.env.local.user)"; \
		echo "   or: make enhanced-setup ENV_CONFIG=dev (loads from env/.env.dev.user)"; \
		exit 1; \
	fi

# Enhanced Setup Demo (with sample credentials for testing)
enhanced-demo:
	@echo "🎭 Running Enhanced Setup Demo..."
	@echo "⚠️  Using demo credentials - replace with real keys for production"
	npm run build
	node lib/src/indexers/enhancedSetup.js "demo-search-key" "demo-openai-key" "enhanced-legis-qc-demo"

# Create Enhanced Index with new schema
index-create-enhanced:
	@echo "🏗️  Creating Enhanced Index with TTL metadata schema..."
	@./scripts/index-create-enhanced.sh

# Check Enhanced Index Status  
index-status:
	@echo "🔍 Checking Index Status..."
	@./scripts/index-status.sh

# Enhanced Demo with environment detection
demo-enhanced:
	@echo "🎭 Running Enhanced Demo with Environment Detection..."
	@./scripts/demo-enhanced.sh
	@./scripts/data-populate.sh

# Validate naming conventions for scripts and Makefile rules
conventions-validate:
	@./scripts/conventions-validate.sh
