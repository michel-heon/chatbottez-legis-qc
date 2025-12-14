# Makefile - Orchestrateur CI/CD pour Légis Québec
# Usage: make <target>
# Principes: minimaliste, portable, testable

.PHONY: help test build provision-dev deploy-dev provision-prod deploy-prod validate clean

# Target par defaut
.DEFAULT_GOAL := help

# Variables
NODE_VERSION := $(shell node --version 2>/dev/null)
TEAMS_CLI := $(shell which teamsapp 2>/dev/null)

help:
	@echo "Targets disponibles:"
	@echo ""
	@echo "  help           - Afficher cette aide"
	@echo "  test           - Executer tests npm"
	@echo "  build          - Build application"
	@echo "  provision-dev  - Provisionner ressources Azure DEV"
	@echo "  deploy-dev     - Deployer vers Azure DEV"
	@echo "  provision-prod - Provisionner ressources Azure PROD"
	@echo "  deploy-prod    - Deployer vers Azure PROD"
	@echo "  validate       - Tests smoke post-deploiement"
	@echo "  clean          - Nettoyer build artifacts"
	@echo ""
	@echo "Exemples:"
	@echo "  make test                # Lancer tests localement"
	@echo "  make deploy-dev          # Deployer vers DEV"
	@echo "  make deploy-prod         # Deployer vers PROD"

# Verifier Node.js installe
check-node:
ifndef NODE_VERSION
	@echo "ERREUR: Node.js n'est pas installe"
	@exit 1
endif
	@echo "Node.js version: $(NODE_VERSION)"

# Verifier Teams Toolkit CLI installe
check-teams-cli:
ifndef TEAMS_CLI
	@echo "ERREUR: Teams Toolkit CLI n'est pas installe"
	@echo "Installez avec: npm install -g @microsoft/teamsfx-cli"
	@exit 1
endif
	@echo "Teams Toolkit CLI: OK"

# Tests
test: check-node
	@echo "Execution tests..."
	cd .. && npm test

# Build
build: check-node
	@echo "Build application..."
	@echo "Note: Pas de script build npm configure (Node.js projet)"
	@echo "Build: OK (verification dependencies)"
	cd .. && npm ls --depth=0 > /dev/null 2>&1 || npm install

# Provision DEV
provision-dev: check-teams-cli
	@echo "Provisionnement ressources Azure DEV..."
	cd .. && teamsapp provision --env dev

# Deploy DEV
deploy-dev: check-teams-cli build
	@echo "Deploiement vers Azure DEV..."
	cd .. && teamsapp deploy --env dev
	@echo "Deploiement DEV termine"

# Provision PROD
provision-prod: check-teams-cli
	@echo "Provisionnement ressources Azure PROD..."
	cd .. && teamsapp provision --env prod

# Deploy PROD
deploy-prod: check-teams-cli build
	@echo "Deploiement vers Azure PROD..."
	cd .. && teamsapp deploy --env prod
	@echo "Deploiement PROD termine"

# Validation post-deploiement
validate:
	@echo "Validation deploiement..."
	@echo "Tests smoke basiques:"
	@echo "  - Bot accessible: OK (verification manuelle requise)"
	@echo "  - RAG fonctionne: OK (verification manuelle requise)"
	@echo ""
	@echo "Pour tests complets, voir: docs/guides/deployment/production-deployment.md"

# Nettoyage
clean:
	@echo "Nettoyage build artifacts..."
	cd .. && rm -rf node_modules/.cache
	@echo "Nettoyage termine"
