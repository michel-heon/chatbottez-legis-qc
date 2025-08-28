# Makefile for Azure AI Search Index Management - Ontology-Driven Architecture
# Microsoft 365 Teams Agent - Chatbot Legis QC
# Version: v1.7.0-ui-diagnostic-tools
#
# CHANGELOG v1.7.0 (2025-08-28):
# - UI CLEANUP: Suppression des icônes excessives pour améliorer la lisibilité
# - DIAGNOSTIC TOOLS: Ajout de règles make réutilisables (index-summary, index-warnings)
# - ERROR ANALYSIS: Script complet d'analyse des erreurs selon conventions projet
# - MAKEFILE CLEANUP: Interface utilisateur plus professionnelle et lisible
# - EXIT CODE FIX: Gestion appropriée des codes de sortie pour les commandes de diagnostic
# - ENVIRONMENT SUPPORT: Support multi-environnement (playground/local) pour toutes les nouvelles commandes
#
# CHANGELOG v1.4.0 (2025-08-28):
# - DIAGNOSTIC ENHANCEMENTS: Amélioration des outils de diagnostic et d'analyse
# - INDEXATION MONITORING: Outils de surveillance de l'indexation en temps réel
# - MAINTENANCE WORKFLOWS: Flux de travail de maintenance simplifiés
#
# CHANGELOG v1.3.0 (2025-08-26):
# - NETTOYAGE COMPLET: Suppression des doublons de scripts obsolètes (45→34 scripts)
# - NETTOYAGE INDEX STATUS: Correction rapport pour vérifier uniquement l'index configuré
# - NETTOYAGE ARCHITECTURE: Élimination vérifications multiples d'index legacy
# - NETTOYAGE ENVIRONNEMENT: Focus sur variable AZURE_SEARCH_INDEX_NAME unique
# - NETTOYAGE DOCUMENTATION: Réorganisation docs/ avec suppression fichiers racine obsolètes
# - NETTOYAGE CONVENTIONS: Mise en conformité structure projet (docs/, scripts/, src/)
# - OPTIMISATION: Priorisation approche ontology-driven (playground-setup → ontology-driven-setup)
# - REFACTORISATION ONTOLOGY-DRIVEN: Transformation complète des règles utilitaires en règles ontology-driven
# - ENVIRONNEMENT PAR DÉFAUT: ENV_CONFIG=playground (ontology-driven ready)
#
# CONVENTION OBLIGATOIRE : Toutes les règles doivent suivre <objet>-<action>
# Voir docs/NAMING_CONVENTIONS.md pour les détails complets

# Export ENV_CONFIG to sub-shells
export ENV_CONFIG

.PHONY: help install build index-setup index-create index-delete index-reindex index-status index-test env-check env-sync config-validate clean json-data-purge index-name-set index-config-list index-populate playground-env-setup playground-env-validate data-populate data-sparql-populate conventions-validate ttl-ontology-pipeline ontology-driven-setup ontology-validate ttl-schema-generate ttl-index-create ttl-populate test-index-content

# Default target
help:
	@echo "Azure AI Search - Système de gestion d'index juridique"
	@echo "======================================================="
	@echo ""
	@echo "COMMANDES PRINCIPALES (pour débuter):"
	@echo ""
	@echo "  ÉTAPE 1 - Configuration initiale:"
	@echo "    install                    - Installer les dépendances"
	@echo "    env-setup                  - Configurer l'environnement (clés API)"
	@echo "    env-sync                   - Synchroniser fichiers environnement"
	@echo ""
	@echo "  ÉTAPE 2 - Créer et peupler l'index:"
	@echo "    setup-complete             - Configuration complète (RECOMMANDÉ)"
	@echo "    setup-index-only           - Créer l'index uniquement"
	@echo "    populate-content           - Ajouter du contenu à l'index existant"
	@echo ""
	@echo "  ÉTAPE 3 - Gestion courante:"
	@echo "    index-status               - Vérifier l'état de l'index"
	@echo "    index-test                 - Tester les recherches"
	@echo "    index-delete               - Supprimer l'index"
	@echo "    reset-caches               - Reset des caches et configurations"
	@echo ""
	@echo "GESTION D'INDEX:"
	@echo "  index-create               - Créer un nouvel index"
	@echo "  index-populate             - Peupler avec des documents"
	@echo "  index-reindex              - Recréer complètement l'index"
	@echo "  index-config-list          - Lister les configurations"
	@echo ""
	@echo "DIAGNOSTIC ET VALIDATION:"
	@echo "  env-check                  - Vérifier la configuration"
	@echo "  config-validate            - Valider Azure Search"
	@echo "  diagnostic                 - Diagnostic complet du système"
	@echo "  index-summary              - Afficher le sommaire des documents indexés et problèmes"
	@echo "  index-warnings             - Analyser les avertissements d'indexation"
	@echo ""
	@echo "DÉVELOPPEMENT:"
	@echo "  build                      - Compiler le projet TypeScript"
	@echo "  clean                      - Nettoyer les fichiers temporaires"
	@echo "  json-data-purge            - Purger les fichiers JSON d'embedding et traitement"
	@echo "  dev                        - Démarrer le serveur de développement"
	@echo ""
	@echo "EXEMPLES D'UTILISATION:"
	@echo "  # Configuration complète pour un débutant:"
	@echo "  make install"
	@echo "  make env-setup"
	@echo "  make setup-complete"
	@echo ""
	@echo "  # Gestion quotidienne:"
	@echo "  make index-status          # Vérifier l'état"
	@echo "  make populate-content      # Ajouter des documents"
	@echo "  make index-test            # Tester les recherches"
	@echo "  make index-summary         # Afficher le sommaire et identifier les problèmes"
	@echo "  make index-warnings        # Analyser les avertissements"
	@echo ""
	@echo "  # Maintenance et nettoyage:"
	@echo "  make json-data-purge                    # Purger les fichiers JSON"
	@echo "  make json-data-purge DRY_RUN=true       # Simulation sans suppression"
	@echo "  make json-data-purge ENV_CONFIG=local   # Purger l'environnement local"
	@echo ""
	@echo "ENVIRONNEMENTS DISPONIBLES:"
	@echo "  ENV_CONFIG=playground      - Environnement de test (par défaut)"
	@echo "  ENV_CONFIG=local           - Environnement local"
	@echo "  ENV_CONFIG=dev             - Environnement de développement"
	@echo ""
	@echo "OPTIONS DISPONIBLES:"
	@echo "  DRY_RUN=true               - Mode simulation (json-data-purge, index-delete)"
	@echo "  FORCE=true                 - Forcer l'action sans confirmation (index-delete)"
	@echo ""
	@echo "AIDE RAPIDE:"
	@echo "  Pour commencer rapidement: make setup-complete"
	@echo "  Pour de l'aide: consultez ./docs/setup-guide.md"

# Variables
SECRET_AZURE_SEARCH_KEY ?= 
SECRET_AZURE_OPENAI_API_KEY ?= 
INDEX_NAME ?= my-documents
ENV_CONFIG ?= playground
FORCE ?= false
DRY_RUN ?= false
ENVIRONMENT ?= playground
NODE_ENV ?= development

# ================================================================
# 🚀 COMMANDES PRINCIPALES SIMPLIFIÉES
# ================================================================

# Synchronisation automatique des fichiers d'environnement
env-sync:
	@echo "Synchronisation des fichiers d'environnement..."
	$(eval EFFECTIVE_ENV := $(or $(ENV_CONFIG),playground))
	@chmod +x scripts/env-sync.sh
	@./scripts/env-sync.sh "$(EFFECTIVE_ENV)"

# Configuration complète automatique (recommandée pour débuter)
setup-complete: install env-sync env-check build
	@echo "Configuration complète du système Azure Search..."
	@echo "Cela va créer l'index et y ajouter du contenu"
	$(call check_env_config)
	@chmod +x scripts/setup-index-pipeline.sh
	@./scripts/setup-index-pipeline.sh "$(ENV_CONFIG)" "full"

# Créer seulement l'index (sans contenu)
setup-index-only: env-check build index-create
	@echo "Index créé. Utilisez 'make populate-content' pour ajouter du contenu."

# Ajouter du contenu à un index existant
populate-content: env-check build
	@echo "Ajout de contenu à l'index existant..."
	@chmod +x scripts/index-populate-from-ttl.sh
	@./scripts/index-populate-from-ttl.sh "$(ENV_CONFIG)" "incremental"

# Configuration de l'environnement (alias plus clair)
env-setup: playground-env-setup

# Reset des caches et fichiers temporaires
reset-caches: clean
	@echo "Reset complet des caches et configurations temporaires..."
	@echo "Nettoyage des caches Node.js..."
	@rm -rf node_modules/.cache 2>/dev/null || true
	@rm -rf .nyc_output 2>/dev/null || true
	@rm -rf coverage 2>/dev/null || true
	@echo "Nettoyage des fichiers temporaires..."
	@rm -f *.log *.tmp 2>/dev/null || true
	@rm -f diagnostic-*.log 2>/dev/null || true
	@rm -f schema-*.json 2>/dev/null || true
	@echo "Arrêt des processus Node.js en cours..."
	@pkill -f "node.*index.ts" 2>/dev/null || true
	@pkill -f "nodemon" 2>/dev/null || true
	@echo "Synchronisation des fichiers de configuration..."
	@if [ -f "env/.env.playground.user" ] && [ -f ".localConfigs.playground" ]; then \
		AZURE_SEARCH_INDEX_NAME=$$(grep AZURE_SEARCH_INDEX_NAME env/.env.playground.user | cut -d'=' -f2); \
		sed -i "s/AZURE_SEARCH_INDEX_NAME=.*/AZURE_SEARCH_INDEX_NAME=$$AZURE_SEARCH_INDEX_NAME/" .localConfigs.playground; \
		echo "Synchronisé .localConfigs.playground avec env/.env.playground.user"; \
	fi
	@echo "Reset terminé! Vous pouvez maintenant relancer l'application."

# =====================================
# Aliases de compatibilité (anciens noms)
# =====================================

enhanced-setup-v2: setup-complete

# ================================================================
# 📊 GESTION D'INDEX - COMMANDES ESSENTIELLES
# ================================================================

# Créer un nouvel index
index-create: env-check
	@echo "Création de l'index Azure Search..."
	$(eval EFFECTIVE_ENV := $(or $(ENV_CONFIG),playground))
	@if [ "$(EFFECTIVE_ENV)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2); \
		echo "Création de l'index: $$AZURE_SEARCH_INDEX_NAME"; \
		node lib/src/indexers/ttlSchemaAnalyzer.js "$$EXTERNAL_DATA_SOURCE_PATH/$$TTL_METADATA_FILE" "schema-output.json"; \
		node lib/src/indexers/indexCreatorFromTTL.js "$$SECRET_AZURE_SEARCH_KEY" "schema-output.json" "$$AZURE_SEARCH_INDEX_NAME"; \
	elif [ "$(EFFECTIVE_ENV)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.local.user | cut -d'=' -f2); \
		echo "Création de l'index: $$AZURE_SEARCH_INDEX_NAME"; \
		node lib/src/indexers/ttlSchemaAnalyzer.js "$$EXTERNAL_DATA_SOURCE_PATH/$$TTL_METADATA_FILE" "schema-output.json"; \
		node lib/src/indexers/indexCreatorFromTTL.js "$$SECRET_AZURE_SEARCH_KEY" "schema-output.json" "$$AZURE_SEARCH_INDEX_NAME"; \
	else \
		echo "Erreur: Fichier d'environnement non trouvé"; \
		echo "Usage: make index-create [ENV_CONFIG=playground|local]"; \
		exit 1; \
	fi

# Peupler l'index avec des documents
index-populate: env-check build
	@echo "Ajout de documents à l'index..."
	@chmod +x scripts/index-populate-from-ttl.sh
	@./scripts/index-populate-from-ttl.sh "$(ENV_CONFIG)" "incremental"

# Vérifier l'état de l'index
index-status: env-check
	@echo "Vérification de l'état de l'index..."
	$(eval EFFECTIVE_ENV := $(or $(ENV_CONFIG),playground))
	@if [ "$(EFFECTIVE_ENV)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2); \
		./scripts/index-status.sh "$$SECRET_AZURE_SEARCH_KEY"; \
	elif [ "$(EFFECTIVE_ENV)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.local.user | cut -d'=' -f2); \
		./scripts/index-status.sh "$$SECRET_AZURE_SEARCH_KEY"; \
	else \
		echo "❌ Erreur: Configuration d'environnement non trouvée"; \
		exit 1; \
	fi

# Tester les recherches dans l'index
index-test: env-check
	@echo "Test des recherches dans l'index..."
	$(eval EFFECTIVE_ENV := $(or $(ENV_CONFIG),playground))
	@if [ "$(EFFECTIVE_ENV)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2); \
		./scripts/index-test.sh "$$SECRET_AZURE_SEARCH_KEY"; \
		node test-index-content.js; \
	elif [ "$(EFFECTIVE_ENV)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.local.user | cut -d'=' -f2); \
		./scripts/index-test.sh "$$SECRET_AZURE_SEARCH_KEY"; \
		node test-index-content.js; \
	else \
		echo "Erreur: Configuration d'environnement non trouvée"; \
		exit 1; \
	fi

# Supprimer l'index
index-delete: env-check build
	@echo "Suppression de l'index Azure Search..."
	$(eval EFFECTIVE_ENV := $(or $(ENV_CONFIG),playground))
	@if [ "$(EFFECTIVE_ENV)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.playground.user | cut -d'=' -f2); \
		if [ "$(FORCE)" = "true" ]; then \
			echo "yes" | ./scripts/index-delete.sh "$$SECRET_AZURE_SEARCH_KEY"; \
		else \
			./scripts/index-delete.sh "$$SECRET_AZURE_SEARCH_KEY"; \
		fi; \
	elif [ "$(EFFECTIVE_ENV)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		SECRET_AZURE_SEARCH_KEY=$$(grep SECRET_AZURE_SEARCH_KEY env/.env.local.user | cut -d'=' -f2); \
		if [ "$(FORCE)" = "true" ]; then \
			echo "yes" | ./scripts/index-delete.sh "$$SECRET_AZURE_SEARCH_KEY"; \
		else \
			./scripts/index-delete.sh "$$SECRET_AZURE_SEARCH_KEY"; \
		fi; \
	else \
		echo "❌ Erreur: Configuration d'environnement non trouvée"; \
		exit 1; \
	fi

# Recréer complètement l'index
index-reindex: index-delete setup-complete
	@echo "Index recréé avec succès"

# Lister les configurations
index-config-list:
	@echo "Configurations d'index disponibles:"
	@if [ -f "env/.env.playground.user" ]; then \
		echo "Playground:"; \
		set -a && . env/.env.playground.user && set +a && \
		echo "   Index: $$AZURE_SEARCH_INDEX_NAME"; \
		echo "   Endpoint: $$AZURE_SEARCH_ENDPOINT"; \
	fi
	@if [ -f "env/.env.local.user" ]; then \
		echo "Local:"; \
		set -a && . env/.env.local.user && set +a && \
		echo "   Index: $$AZURE_SEARCH_INDEX_NAME"; \
		echo "   Endpoint: $$AZURE_SEARCH_ENDPOINT"; \
	fi

# ================================================================
# 🛠️ COMMANDES DE BASE ET UTILITAIRES
# ================================================================

# Installer les dépendances
install:
	@echo "📦 Installation des dépendances..."
	npm install

# Compiler le projet TypeScript
build:
	@echo "🔨 Compilation du projet TypeScript..."
	npm run build

# Vérifier les variables d'environnement
env-check:
	@echo "🔍 Vérification des variables d'environnement..."
	@./scripts/env-check.sh

# Valider la configuration Azure Search
config-validate:
	@echo "✅ Validation de la configuration Azure Search..."
	@./scripts/config-validate.sh

# Nettoyer les fichiers temporaires
clean:
	@echo "🧹 Nettoyage des fichiers temporaires..."
	rm -rf dist/
	rm -rf node_modules/.cache/

# Purger les fichiers JSON d'embedding et de traitement
json-data-purge: env-check
	@echo "🗑️  Purge des fichiers JSON d'embedding et de traitement..."
	$(eval EFFECTIVE_ENV := $(or $(ENV_CONFIG),playground))
	@chmod +x scripts/json-data-purge.sh
	@if [ "$(DRY_RUN)" = "true" ]; then \
		./scripts/json-data-purge.sh "$(EFFECTIVE_ENV)" --dry-run; \
	else \
		./scripts/json-data-purge.sh "$(EFFECTIVE_ENV)"; \
	fi

# Démarrer le serveur de développement
dev: build
	@echo "🚀 Démarrage du serveur de développement..."
	npm run dev:teamsfx

# Diagnostic complet du système
diagnostic:
	@echo "� Diagnostic complet du système..."
	@echo "Environnement utilisé: $(or $(ENV_CONFIG),playground)"
	$(eval EFFECTIVE_ENV := $(or $(ENV_CONFIG),playground))
	@if [ -f "env/.env.$(EFFECTIVE_ENV).user" ]; then \
		export $$(grep -v '^#' env/.env.$(EFFECTIVE_ENV).user | xargs) && \
		./scripts/diagnostic-ontology.sh; \
	else \
		echo "❌ Fichier d'environnement non trouvé: env/.env.$(EFFECTIVE_ENV).user"; \
		echo "💡 Exécutez 'make env-setup' pour le créer"; \
		exit 1; \
	fi

# ================================================================
# 🔧 COMMANDES D'ENVIRONNEMENT
# ================================================================

# Configurer l'environnement Playground
playground-env-setup:
	@echo "⚙️ Configuration de l'environnement Playground..."
	@./scripts/playground-env-setup.sh

# Valider l'environnement Playground
playground-env-validate:
	@echo "✅ Validation de l'environnement Playground..."
	@./scripts/playground-env-validate.sh

# Afficher le sommaire des résultats d'indexation et identifier les documents problématiques
index-summary: env-check
	@echo "📊 Sommaire des résultats d'indexation..."
	$(eval EFFECTIVE_ENV := $(or $(ENV_CONFIG),playground))
	@if [ "$(EFFECTIVE_ENV)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		node tests/documents-error-analysis.js || true; \
	elif [ "$(EFFECTIVE_ENV)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		node tests/documents-error-analysis.js || true; \
	else \
		echo "❌ Erreur: Configuration d'environnement non trouvée"; \
		exit 1; \
	fi

# Analyser les warnings d'indexation en détail
index-warnings: env-check
	@echo "⚠️  Analyse des warnings d'indexation..."
	$(eval EFFECTIVE_ENV := $(or $(ENV_CONFIG),playground))
	@if [ "$(EFFECTIVE_ENV)" = "playground" ] && [ -f "env/.env.playground.user" ]; then \
		set -a && . env/.env.playground.user && set +a && \
		if [ -f "$$EXTERNAL_DATA_SOURCE_PATH/transform/processed/warnings.log" ]; then \
			echo "📁 Analyse du fichier: $$EXTERNAL_DATA_SOURCE_PATH/transform/processed/warnings.log"; \
			echo ""; \
			echo "🔍 Warnings détectés:"; \
			cat "$$EXTERNAL_DATA_SOURCE_PATH/transform/processed/warnings.log" | while IFS= read -r line; do \
				if echo "$$line" | grep -q "chunk embeddings failed"; then \
					echo "   ⚠️  $$line"; \
				elif echo "$$line" | grep -q "Content embedding failed"; then \
					echo "   🚨 $$line"; \
				else \
					echo "   ℹ️  $$line"; \
				fi; \
			done; \
			echo ""; \
			echo "📊 Statistiques des warnings:"; \
			echo "   Échecs de chunks: $$(grep -c "chunk embeddings failed" "$$EXTERNAL_DATA_SOURCE_PATH/transform/processed/warnings.log" 2>/dev/null || echo 0)"; \
			echo "   Échecs d'embedding: $$(grep -c "Content embedding failed" "$$EXTERNAL_DATA_SOURCE_PATH/transform/processed/warnings.log" 2>/dev/null || echo 0)"; \
			echo "   Total warnings: $$(wc -l < "$$EXTERNAL_DATA_SOURCE_PATH/transform/processed/warnings.log" 2>/dev/null || echo 0)"; \
		else \
			echo "✅ Aucun fichier de warnings trouvé - indexation probablement réussie sans problèmes"; \
		fi \
	elif [ "$(EFFECTIVE_ENV)" = "local" ] && [ -f "env/.env.local.user" ]; then \
		set -a && . env/.env.local.user && set +a && \
		if [ -f "$$EXTERNAL_DATA_SOURCE_PATH/transform/processed/warnings.log" ]; then \
			echo "📁 Analyse du fichier: $$EXTERNAL_DATA_SOURCE_PATH/transform/processed/warnings.log"; \
			echo ""; \
			echo "🔍 Warnings détectés:"; \
			cat "$$EXTERNAL_DATA_SOURCE_PATH/transform/processed/warnings.log" | while IFS= read -r line; do \
				if echo "$$line" | grep -q "chunk embeddings failed"; then \
					echo "   ⚠️  $$line"; \
				elif echo "$$line" | grep -q "Content embedding failed"; then \
					echo "   🚨 $$line"; \
				else \
					echo "   ℹ️  $$line"; \
				fi; \
			done; \
			echo ""; \
			echo "📊 Statistiques des warnings:"; \
			echo "   Échecs de chunks: $$(grep -c "chunk embeddings failed" "$$EXTERNAL_DATA_SOURCE_PATH/transform/processed/warnings.log" 2>/dev/null || echo 0)"; \
			echo "   Échecs d'embedding: $$(grep -c "Content embedding failed" "$$EXTERNAL_DATA_SOURCE_PATH/transform/processed/warnings.log" 2>/dev/null || echo 0)"; \
			echo "   Total warnings: $$(wc -l < "$$EXTERNAL_DATA_SOURCE_PATH/transform/processed/warnings.log" 2>/dev/null || echo 0)"; \
		else \
			echo "✅ Aucun fichier de warnings trouvé - indexation probablement réussie sans problèmes"; \
		fi \
	else \
		echo "❌ Erreur: Configuration d'environnement non trouvée"; \
		exit 1; \
	fi

# ================================================================
# COMMANDES LEGACY (conservées pour compatibilité)
# ================================================================

# Anciens noms conservés pour la compatibilité
ontology-driven-setup: setup-complete
ttl-ontology-pipeline: setup-complete
enhanced-setup: setup-complete

# Commandes TTL spécialisées (pour les développeurs avancés)
ttl-test:
	@echo "🧪 Test du parser TTL..."
	@./scripts/ttl-parser-utils.sh test

ttl-analyze:
	@echo "📊 Analyse de la structure TTL..."
	@./scripts/ttl-parser-utils.sh analyze

.PHONY: help install build env-check config-validate clean json-data-purge dev diagnostic playground-env-setup playground-env-validate setup-complete setup-index-only populate-content env-setup index-create index-populate index-status index-test index-summary index-warnings index-delete index-reindex index-config-list enhanced-setup-v2 ontology-driven-setup ttl-ontology-pipeline enhanced-setup ttl-test ttl-analyze
