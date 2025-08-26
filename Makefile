# Makefile for Azure AI Search Index Management - Ontology-Driven Architecture
# Microsoft 365 Teams Agent - Chatbot Legis QC
# Version: v1.3.0-priority
#
# CHANGELOG v1.3.0 (2025-08-26):
# - NETTOYAGE COMPLET: Suppression des doublons de scripts obsolètes (45→34 scripts)
# - NETTOYAGE INDEX STATUS: Correction rapport pour vérifier uniquement l'index configuré
# - NETTOYAGE ARCHITECTURE: Élimination vérifications multiples d'index legacy
# - NETTOYAGE ENVIRONNEMENT: Focus sur variable AZURE_SEARCH_INDEX_NAME unique
# - NETTOYAGE DOCUMENTATION: Réorganisation docs/ avec suppression fichiers racine obsolètes
# - NETTOYAGE CONVENTIONS: Mise en conformité structure projet (docs/, scripts/, src/)
# - OPTIMISATION: Priorisation approche ontology-driven (playground-setup → ontology-driven-setup)
#
# CONVENTION OBLIGATOIRE : Toutes les règles doivent suivre <objet>-<action>
# Voir docs/NAMING_CONVENTIONS.md pour les détails complets

# Export ENV_CONFIG to sub-shells
export ENV_CONFIG

.PHONY: help install build index-setup index-delete index-reindex index-status index-test env-check config-validate clean index-name-set index-config-list playground-env-setup playground-env-validate data-populate data-sparql-populate conventions-validate ttl-ontology-pipeline ontology-driven-setup ontology-validate ttl-schema-generate ttl-index-create ttl-populate ttl-test-semantic

# Default target
help:
	@echo "Azure AI Search Index Management Commands - Ontology-Driven v1.3.0 (Priority)"
	@echo "================================================================="
	@echo ""
	@echo "🧠 ONTOLOGY-DRIVEN ARCHITECTURE (PRIORITY - v1.3.0):"
	@echo "  ontology-driven-setup    - Complete TTL → Azure Search → Teams AI pipeline (RECOMMENDED)"
	@echo "  ttl-ontology-pipeline    - Execute full ontology-driven workflow"
	@echo "  ttl-schema-generate      - Generate Azure Search schema from TTL metadata"
	@echo "  ttl-index-create         - Create index using ontology-driven schema"
	@echo "  ttl-populate             - Populate index with TTL metadata + PDF content"
	@echo "  ttl-test-semantic        - Test semantic search with ontological coherence"
	@echo "  ontology-validate        - Validate TTL ↔ Azure ↔ Teams AI coherence"
	@echo ""
	@echo "Setup Commands:"
	@echo "  install          - Install dependencies"
	@echo "  build            - Build TypeScript project"
	@echo ""
	@echo "Index Management (Ontology-Driven Priority):"
	@echo "  ontology-driven-setup - 🧠 Complete TTL → Azure Search → Teams AI pipeline (RECOMMENDED)"
	@echo "  index-reindex    - Delete and recreate index (ontology-driven - 5 docs TTL)"
	@echo "  index-status     - Check index status and statistics"
	@echo "  index-test       - Test index content and search functionality"
	@echo "  index-setup      - ⚠️  Legacy: Create index with ALL 62 PDFs (use with caution)"
	@echo "  index-delete     - Delete the search index"
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
	@echo "Environment-specific (Ontology-Driven):"
	@echo "  playground-setup - 🧠 Setup using ontology-driven approach (5 docs TTL)"
	@echo "  playground-test  - Test ontology-driven search with playground environment"
	@echo "  local-setup      - 🧠 Setup using ontology-driven approach (local environment)"
	@echo "  local-test       - Test ontology-driven search with local environment"
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
	@echo "  make ontology-driven-setup ENV_CONFIG=playground    # Complete ontology-driven pipeline"
	@echo "  make ttl-schema-generate ENV_CONFIG=playground      # Generate schema from TTL"
	@echo "  make ttl-test-semantic ENV_CONFIG=playground        # Test semantic coherence"
	@echo "  make index-setup SECRET_AZURE_SEARCH_KEY=your_key SECRET_AZURE_OPENAI_API_KEY=your_key"
	@echo "  make index-delete SECRET_AZURE_SEARCH_KEY=your_key"
	@echo "  make index-status SECRET_AZURE_SEARCH_KEY=your_key"
	@echo "  make index-name-set INDEX_NAME=my-custom-index ENVIRONMENT=local"
	@echo ""
	@echo "🧠 ONTOLOGY-DRIVEN Examples:"
	@echo "  make ontology-driven-setup ENV_CONFIG=playground    # TTL → Azure → Teams AI"
	@echo "  make ttl-ontology-pipeline ENV_CONFIG=playground    # Full semantic pipeline"
	@echo "  make ontology-validate ENV_CONFIG=playground        # Validate coherence TTL ↔ IA"
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
	@echo ""
	@echo "🚀 INNOVATION v1.2.0 - ONTOLOGY-DRIVEN:"
	@echo "  🧠 Premier système ontology-driven IA juridique québécoise"
	@echo "  📊 Pipeline TTL/RDF → Azure Search → Teams AI automatisé"
	@echo "  ✅ Anti-hallucination par cohérence ontologique TTL ↔ IA"
	@echo "  🎯 17 champs ontologiques mappés automatiquement"
	@echo "  📈 Évolutivité: Nouveaux prédicats TTL → champs index automatiquement"

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

# LEGACY: Setup Azure Search index and upload ALL 62 documents (use with caution)
index-setup: env-check build
	@echo "⚠️  LEGACY MODE: Setting up Azure Search index with ALL 62 PDF files..."
	@echo "📋 RECOMMENDATION: Use 'make ontology-driven-setup' for TTL-driven approach (5 docs)"
	@echo "   Continue with legacy setup? Press Enter or Ctrl+C to cancel..."
	@read dummy
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

# Reindex (delete and recreate) - Uses ontology-driven approach by default
index-reindex: index-delete ontology-driven-setup
	@echo "Ontology-driven reindexing completed"

# Legacy index-setup (all 62 PDFs) - use with caution
index-setup-legacy: index-setup
	@echo "Legacy setup completed with all PDF files"

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
		./scripts/index-status.sh "$$SECRET_AZURE_SEARCH_KEY"; \
	elif [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] && [ "$(ENV_CONFIG)" = "local" ]; then \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.local.user | cut -d'=' -f2); \
		./scripts/index-status.sh "$$SECRET_AZURE_SEARCH_KEY"; \
	elif [ -z "$(SECRET_AZURE_SEARCH_KEY)" ] && [ "$(ENV_CONFIG)" = "dev" ]; then \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.dev.user | cut -d'=' -f2); \
		./scripts/index-status.sh "$$SECRET_AZURE_SEARCH_KEY"; \
	elif [ -n "$(SECRET_AZURE_SEARCH_KEY)" ]; then \
		./scripts/index-status.sh "$(SECRET_AZURE_SEARCH_KEY)"; \
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

# TTL/RDF Metadata Commands (Legacy - use ontology-driven commands instead)
ttl-test-legacy:
	@echo "Testing TTL parser and SPARQL functionality (legacy)..."
	@./scripts/ttl-parser-utils.sh test

ttl-analyze-legacy:
	@echo "Analyzing TTL metadata structure (legacy)..."
	@./scripts/ttl-parser-utils.sh analyze

ttl-samples:
	@echo "Generating enhanced document samples..."
	@./scripts/ttl-parser-utils.sh samples

ttl-capabilities:
	@echo "Showing TTL parser capabilities..."
	@./scripts/ttl-parser-utils.sh capabilities

# Enhanced Setup V2 - Complete TTL-driven workflow (Legacy)
enhanced-setup-v2: env-check build
	@echo "🚀 Enhanced Setup V2 - TTL-driven Architecture (Legacy)"
	@echo "ℹ️  Use 'make ontology-driven-setup' for the new ontology-driven pipeline"
	@chmod +x scripts/enhanced-setup-v2.sh
	@./scripts/enhanced-setup-v2.sh "$(ENV_CONFIG)" "full"

# Schema-only mode (for development)
schema-only: env-check build
	@echo "🎯 Schema-only Setup..."
	@chmod +x scripts/enhanced-setup-v2.sh
	@./scripts/enhanced-setup-v2.sh "$(ENV_CONFIG)" "schema-only"

# Incremental update mode
incremental-update: env-check build
	@echo "🔄 Incremental Update..."
	@chmod +x scripts/enhanced-setup-v2.sh
	@./scripts/enhanced-setup-v2.sh "$(ENV_CONFIG)" "incremental"

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
	fi

# Create Enhanced Index with new schema
index-create-enhanced:
	@echo "🏗️  Creating Enhanced Index with TTL metadata schema..."
	@./scripts/index-create-enhanced.sh

# Enhanced Demo with environment detection
enhanced-demo:
	@echo "🎭 Running Enhanced Demo with Environment Detection..."
	@./scripts/enhanced-demo.sh

# Validate naming conventions for scripts and Makefile rules
conventions-validate:
	@./scripts/conventions-validate.sh

# ============================================================================
# 🧠 ONTOLOGY-DRIVEN ARCHITECTURE - v1.2.0 INNOVATION
# ============================================================================

# Complete Ontology-Driven Setup - TTL → Azure Search → Teams AI
ontology-driven-setup: env-check build
	@echo "🧠 ONTOLOGY-DRIVEN SETUP - TTL → Azure Search → Teams AI Pipeline"
	@echo "=================================================================="
	@if [ "$(ENV_CONFIG)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		echo "🔧 Using playground environment"; \
		set -a && . env/.env.playground.user && set +a && \
		node lib/src/indexers/dataPopulation.js; \
	elif [ "$(ENV_CONFIG)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		echo "🔧 Using local environment"; \
		set -a && . env/.env.local.user && set +a && \
		node lib/src/indexers/dataPopulation.js; \
	elif [ "$(ENV_CONFIG)" = "dev" ] && [ -f "env/.env.dev.user" ]; then \
		echo "🔧 Using dev environment"; \
		set -a && . env/.env.dev.user && set +a && \
		node lib/src/indexers/dataPopulation.js; \
	else \
		echo "❌ Error: ENV_CONFIG must be set to playground, local, or dev"; \
		echo "Usage: make ontology-driven-setup ENV_CONFIG=playground"; \
		exit 1; \
	fi
	@echo "✅ Ontology-driven setup completed!"

# Execute Full TTL Ontology Pipeline
ttl-ontology-pipeline: env-check build
	@echo "🔄 TTL ONTOLOGY PIPELINE - Complete Semantic Workflow"
	@echo "======================================================"
	@echo "1️⃣ TTL Schema Analysis..."
	@make ttl-schema-generate ENV_CONFIG=$(ENV_CONFIG)
	@echo "2️⃣ Index Creation from TTL..."
	@make ttl-index-create ENV_CONFIG=$(ENV_CONFIG)
	@echo "3️⃣ TTL-driven Population..."
	@make ttl-populate ENV_CONFIG=$(ENV_CONFIG)
	@echo "4️⃣ Semantic Validation..."
	@make ttl-test-semantic ENV_CONFIG=$(ENV_CONFIG)
	@echo "✅ Complete ontology-driven pipeline executed!"

# Generate Azure Search Schema from TTL Metadata
ttl-schema-generate: env-check build
	@echo "🔍 GENERATING AZURE SEARCH SCHEMA FROM TTL ONTOLOGY"
	@echo "===================================================="
	@if [ "$(ENV_CONFIG)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		node lib/src/indexers/ttlSchemaAnalyzer.js "$$EXTERNAL_DATA_SOURCE_PATH/$$TTL_METADATA_FILE" "schema-output.json"; \
	elif [ "$(ENV_CONFIG)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		node lib/src/indexers/ttlSchemaAnalyzer.js "$$EXTERNAL_DATA_SOURCE_PATH/$$TTL_METADATA_FILE" "schema-output.json"; \
	elif [ "$(ENV_CONFIG)" = "dev" ] && [ -f "env/.env.dev.user" ]; then \
		set -a && . env/.env.dev.user && set +a && \
		node lib/src/indexers/ttlSchemaAnalyzer.js "$$EXTERNAL_DATA_SOURCE_PATH/$$TTL_METADATA_FILE" "schema-output.json"; \
	else \
		echo "❌ Error: ENV_CONFIG environment required"; \
		exit 1; \
	fi

# Create Index using Ontology-Driven Schema
ttl-index-create: env-check build
	@echo "🏗️ CREATING INDEX FROM TTL ONTOLOGY SCHEMA"
	@echo "==========================================="
	@if [ "$(ENV_CONFIG)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		node lib/src/indexers/indexCreatorFromTTL.js; \
	elif [ "$(ENV_CONFIG)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		node lib/src/indexers/indexCreatorFromTTL.js; \
	elif [ "$(ENV_CONFIG)" = "dev" ] && [ -f "env/.env.dev.user" ]; then \
		set -a && . env/.env.dev.user && set +a && \
		node lib/src/indexers/indexCreatorFromTTL.js; \
	else \
		echo "❌ Error: ENV_CONFIG environment required"; \
		exit 1; \
	fi

# Populate Index with TTL Metadata + PDF Content + Embeddings
ttl-populate: env-check build
	@echo "📤 POPULATING INDEX WITH TTL ONTOLOGY DATA"
	@echo "==========================================="
	@if [ "$(ENV_CONFIG)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		node lib/src/indexers/indexPopulatorFromTTL.js; \
	elif [ "$(ENV_CONFIG)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		node lib/src/indexers/indexPopulatorFromTTL.js; \
	elif [ "$(ENV_CONFIG)" = "dev" ] && [ -f "env/.env.dev.user" ]; then \
		set -a && . env/.env.dev.user && set +a && \
		node lib/src/indexers/indexPopulatorFromTTL.js; \
	else \
		echo "❌ Error: ENV_CONFIG environment required"; \
		exit 1; \
	fi

# Test Semantic Search with Ontological Coherence
ttl-test-semantic: env-check build
	@echo "🧪 TESTING SEMANTIC SEARCH - ONTOLOGICAL COHERENCE"
	@echo "==================================================="
	@if [ "$(ENV_CONFIG)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		node test-semantic.js; \
	elif [ "$(ENV_CONFIG)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		node test-semantic.js; \
	elif [ "$(ENV_CONFIG)" = "dev" ] && [ -f "env/.env.dev.user" ]; then \
		set -a && . env/.env.dev.user && set +a && \
		node test-semantic.js; \
	else \
		echo "❌ Error: ENV_CONFIG environment required"; \
		exit 1; \
	fi

# Validate TTL ↔ Azure ↔ Teams AI Ontological Coherence
ontology-validate: env-check build
	@echo "✅ VALIDATING ONTOLOGICAL COHERENCE TTL ↔ AZURE ↔ TEAMS AI"
	@echo "============================================================"
	@echo "1️⃣ Testing Azure Search connectivity..."
	@if [ "$(ENV_CONFIG)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		node test-index-count.js; \
	else \
		echo "❌ Error: ENV_CONFIG=playground required"; \
		exit 1; \
	fi
	@echo "2️⃣ Testing semantic search coherence..."
	@make ttl-test-semantic ENV_CONFIG=$(ENV_CONFIG)
	@echo "3️⃣ Validating TTL metadata consistency..."
	@node lib/src/indexers/ttlFilesDiscovery.js
	@echo "✅ Ontological coherence validation completed!"

# TTL Files Discovery and Metadata Extraction
ttl-files-discovery: env-check build
	@echo "🔍 TTL FILES DISCOVERY - METADATA EXTRACTION"
	@echo "============================================="
	@if [ "$(ENV_CONFIG)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		node lib/src/indexers/ttlFilesDiscovery.js; \
	elif [ "$(ENV_CONFIG)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		node lib/src/indexers/ttlFilesDiscovery.js; \
	elif [ "$(ENV_CONFIG)" = "dev" ] && [ -f "env/.env.dev.user" ]; then \
		set -a && . env/.env.dev.user && set +a && \
		node lib/src/indexers/ttlFilesDiscovery.js; \
	else \
		echo "❌ Error: ENV_CONFIG environment required"; \
		exit 1; \
	fi

# Quick Ontology Test (5 documents)
ontology-quick-test: env-check build
	@echo "⚡ QUICK ONTOLOGY TEST - 5 Documents Sample"
	@echo "==========================================="
	@make ontology-driven-setup ENV_CONFIG=playground
	@echo "🧪 Testing coherence..."
	@make ontology-validate ENV_CONFIG=playground
	@echo "✅ Quick ontology test completed!"

# ============================================================================
# End of Ontology-Driven Architecture Rules
# ============================================================================

# Playground Setup - Uses ontology-driven approach by default
playground-setup: ontology-driven-setup

# Local Setup - Uses ontology-driven approach by default  
local-setup: env-check
	@make ontology-driven-setup ENV_CONFIG=local

# Test playground environment with ontology-driven approach
playground-test: env-check
	@make ttl-test-semantic ENV_CONFIG=playground

# Test local environment with ontology-driven approach
local-test: env-check
	@make ttl-test-semantic ENV_CONFIG=local

# TTL/RDF Metadata Commands (Legacy - use ontology-driven commands instead)
ttl-test-legacy:
	@echo "Testing TTL parser and SPARQL functionality (legacy)..."
	@./scripts/ttl-parser-utils.sh test

ttl-analyze-legacy:
	@echo "Analyzing TTL metadata structure (legacy)..."
	@./scripts/ttl-parser-utils.sh analyze

ttl-samples:
	@echo "Generating enhanced document samples..."
	@./scripts/ttl-parser-utils.sh samples

ttl-capabilities:
	@echo "Showing TTL parser capabilities..."
	@./scripts/ttl-parser-utils.sh capabilities

# Enhanced Setup V2 - Complete TTL-driven workflow (Legacy)
enhanced-setup-v2: env-check build
	@echo "🚀 Enhanced Setup V2 - TTL-driven Architecture (Legacy)"
	@echo "ℹ️  Use 'make ontology-driven-setup' for the new ontology-driven pipeline"
	@chmod +x scripts/enhanced-setup-v2.sh
	@./scripts/enhanced-setup-v2.sh "$(ENV_CONFIG)" "full"

# Schema-only mode (for development)
schema-only: env-check build
	@echo "🎯 Schema-only Setup..."
	@chmod +x scripts/enhanced-setup-v2.sh
	@./scripts/enhanced-setup-v2.sh "$(ENV_CONFIG)" "schema-only"

# Incremental update mode
incremental-update: env-check build
	@echo "🔄 Incremental Update..."
	@chmod +x scripts/enhanced-setup-v2.sh
	@./scripts/enhanced-setup-v2.sh "$(ENV_CONFIG)" "incremental"

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
	fi

# Create Enhanced Index with new schema
index-create-enhanced:
	@echo "🏗️  Creating Enhanced Index with TTL metadata schema..."
	@./scripts/index-create-enhanced.sh

# Enhanced Demo with environment detection
enhanced-demo:
	@echo "🎭 Running Enhanced Demo with Environment Detection..."
	@./scripts/enhanced-demo.sh

# Validate naming conventions for scripts and Makefile rules
conventions-validate:
	@./scripts/conventions-validate.sh

# ============================================================================
# 🧠 ONTOLOGY-DRIVEN ARCHITECTURE - v1.2.0 INNOVATION
# ============================================================================

# Complete Ontology-Driven Setup - TTL → Azure Search → Teams AI
ontology-driven-setup: env-check build
	@echo "🧠 ONTOLOGY-DRIVEN SETUP - TTL → Azure Search → Teams AI Pipeline"
	@echo "=================================================================="
	@if [ "$(ENV_CONFIG)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		echo "🔧 Using playground environment"; \
		set -a && . env/.env.playground.user && set +a && \
		node lib/src/indexers/dataPopulation.js; \
	elif [ "$(ENV_CONFIG)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		echo "🔧 Using local environment"; \
		set -a && . env/.env.local.user && set +a && \
		node lib/src/indexers/dataPopulation.js; \
	elif [ "$(ENV_CONFIG)" = "dev" ] && [ -f "env/.env.dev.user" ]; then \
		echo "🔧 Using dev environment"; \
		set -a && . env/.env.dev.user && set +a && \
		node lib/src/indexers/dataPopulation.js; \
	else \
		echo "❌ Error: ENV_CONFIG must be set to playground, local, or dev"; \
		echo "Usage: make ontology-driven-setup ENV_CONFIG=playground"; \
		exit 1; \
	fi
	@echo "✅ Ontology-driven setup completed!"

# Execute Full TTL Ontology Pipeline
ttl-ontology-pipeline: env-check build
	@echo "🔄 TTL ONTOLOGY PIPELINE - Complete Semantic Workflow"
	@echo "======================================================"
	@echo "1️⃣ TTL Schema Analysis..."
	@make ttl-schema-generate ENV_CONFIG=$(ENV_CONFIG)
	@echo "2️⃣ Index Creation from TTL..."
	@make ttl-index-create ENV_CONFIG=$(ENV_CONFIG)
	@echo "3️⃣ TTL-driven Population..."
	@make ttl-populate ENV_CONFIG=$(ENV_CONFIG)
	@echo "4️⃣ Semantic Validation..."
	@make ttl-test-semantic ENV_CONFIG=$(ENV_CONFIG)
	@echo "✅ Complete ontology-driven pipeline executed!"

# Generate Azure Search Schema from TTL Metadata
ttl-schema-generate: env-check build
	@echo "🔍 GENERATING AZURE SEARCH SCHEMA FROM TTL ONTOLOGY"
	@echo "===================================================="
	@if [ "$(ENV_CONFIG)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		node lib/src/indexers/ttlSchemaAnalyzer.js "$$EXTERNAL_DATA_SOURCE_PATH/$$TTL_METADATA_FILE" "schema-output.json"; \
	elif [ "$(ENV_CONFIG)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		node lib/src/indexers/ttlSchemaAnalyzer.js "$$EXTERNAL_DATA_SOURCE_PATH/$$TTL_METADATA_FILE" "schema-output.json"; \
	elif [ "$(ENV_CONFIG)" = "dev" ] && [ -f "env/.env.dev.user" ]; then \
		set -a && . env/.env.dev.user && set +a && \
		node lib/src/indexers/ttlSchemaAnalyzer.js "$$EXTERNAL_DATA_SOURCE_PATH/$$TTL_METADATA_FILE" "schema-output.json"; \
	else \
		echo "❌ Error: ENV_CONFIG environment required"; \
		exit 1; \
	fi

# Create Index using Ontology-Driven Schema
ttl-index-create: env-check build
	@echo "🏗️ CREATING INDEX FROM TTL ONTOLOGY SCHEMA"
	@echo "==========================================="
	@if [ "$(ENV_CONFIG)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		node lib/src/indexers/indexCreatorFromTTL.js; \
	elif [ "$(ENV_CONFIG)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		node lib/src/indexers/indexCreatorFromTTL.js; \
	elif [ "$(ENV_CONFIG)" = "dev" ] && [ -f "env/.env.dev.user" ]; then \
		set -a && . env/.env.dev.user && set +a && \
		node lib/src/indexers/indexCreatorFromTTL.js; \
	else \
		echo "❌ Error: ENV_CONFIG environment required"; \
		exit 1; \
	fi

# Populate Index with TTL Metadata + PDF Content + Embeddings
ttl-populate: env-check build
	@echo "📤 POPULATING INDEX WITH TTL ONTOLOGY DATA"
	@echo "==========================================="
	@if [ "$(ENV_CONFIG)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		node lib/src/indexers/indexPopulatorFromTTL.js; \
	elif [ "$(ENV_CONFIG)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		node lib/src/indexers/indexPopulatorFromTTL.js; \
	elif [ "$(ENV_CONFIG)" = "dev" ] && [ -f "env/.env.dev.user" ]; then \
		set -a && . env/.env.dev.user && set +a && \
		node lib/src/indexers/indexPopulatorFromTTL.js; \
	else \
		echo "❌ Error: ENV_CONFIG environment required"; \
		exit 1; \
	fi

# Test Semantic Search with Ontological Coherence
ttl-test-semantic: env-check build
	@echo "🧪 TESTING SEMANTIC SEARCH - ONTOLOGICAL COHERENCE"
	@echo "==================================================="
	@if [ "$(ENV_CONFIG)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		node test-semantic.js; \
	elif [ "$(ENV_CONFIG)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		node test-semantic.js; \
	elif [ "$(ENV_CONFIG)" = "dev" ] && [ -f "env/.env.dev.user" ]; then \
		set -a && . env/.env.dev.user && set +a && \
		node test-semantic.js; \
	else \
		echo "❌ Error: ENV_CONFIG environment required"; \
		exit 1; \
	fi

# Validate TTL ↔ Azure ↔ Teams AI Ontological Coherence
ontology-validate: env-check build
	@echo "✅ VALIDATING ONTOLOGICAL COHERENCE TTL ↔ AZURE ↔ TEAMS AI"
	@echo "============================================================"
	@echo "1️⃣ Testing Azure Search connectivity..."
	@if [ "$(ENV_CONFIG)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		node test-index-count.js; \
	else \
		echo "❌ Error: ENV_CONFIG=playground required"; \
		exit 1; \
	fi
	@echo "2️⃣ Testing semantic search coherence..."
	@make ttl-test-semantic ENV_CONFIG=$(ENV_CONFIG)
	@echo "3️⃣ Validating TTL metadata consistency..."
	@node lib/src/indexers/ttlFilesDiscovery.js
	@echo "✅ Ontological coherence validation completed!"

# TTL Files Discovery and Metadata Extraction
ttl-files-discovery: env-check build
	@echo "🔍 TTL FILES DISCOVERY - METADATA EXTRACTION"
	@echo "============================================="
	@if [ "$(ENV_CONFIG)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		node lib/src/indexers/ttlFilesDiscovery.js; \
	elif [ "$(ENV_CONFIG)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		node lib/src/indexers/ttlFilesDiscovery.js; \
	elif [ "$(ENV_CONFIG)" = "dev" ] && [ -f "env/.env.dev.user" ]; then \
		set -a && . env/.env.dev.user && set +a && \
		node lib/src/indexers/ttlFilesDiscovery.js; \
	else \
		echo "❌ Error: ENV_CONFIG environment required"; \
		exit 1; \
	fi

# Quick Ontology Test (5 documents)
ontology-quick-test: env-check build
	@echo "⚡ QUICK ONTOLOGY TEST - 5 Documents Sample"
	@echo "==========================================="
	@make ontology-driven-setup ENV_CONFIG=playground
	@echo "🧪 Testing coherence..."
	@make ontology-validate ENV_CONFIG=playground
	@echo "✅ Quick ontology test completed!"

# ============================================================================
# End of Ontology-Driven Architecture Rules
# ============================================================================
