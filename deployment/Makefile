# Makefile - Orchestrateur CI/CD pour Légis Québec
# Usage: make <target>
# Principes: minimaliste, portable, testable

.PHONY: help test build deploy-dev deploy-prod validate clean

# Target par defaut
.DEFAULT_GOAL := help

# Variables
NODE_VERSION := $(shell node --version 2>/dev/null)
TEAMS_CLI := $(shell which teamsapp 2>/dev/null)

help:
	@echo "Targets disponibles:"
	@echo ""
	@echo "  help        - Afficher cette aide"
	@echo "  test        - Executer tests npm"
	@echo "  build       - Verifier dependencies"
	@echo "  deploy-dev  - Deployer code vers Azure DEV"
	@echo "  deploy-prod - Deployer code vers Azure PROD"
	@echo "  validate    - Tests smoke post-deploiement"
	@echo "  clean       - Nettoyer build artifacts"
	@echo ""
	@echo "Note: Provisionnement Azure deja fait via M365 Agents Toolkit"
	@echo ""
	@echo "Exemples:"
	@echo "  make test                # Lancer tests localement"
	@echo "  make deploy-dev          # Deployer code vers DEV"
	@echo "  make deploy-prod         # Deployer code vers PROD"

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
	@echo "Verification dependencies..."
	cd .. && npm ls --depth=0 > /dev/null 2>&1 || npm install
	@echo "Dependencies: OK"

# Deploy DEV
deploy-dev: check-teams-cli
	@echo "Deploiement code vers Azure DEV..."
	cd .. && teamsapp deploy --env dev
	@echo "Deploiement DEV termine"

# Deploy PROD
deploy-prod: check-teams-cli
	@echo "Deploiement code vers Azure PROD..."
	cd .. && teamsapp deploy --env prod
	@echo "Deploiement PROD termine"

# Validation post-deploiement
validate:
	@echo "Validation deploiement..."
	@echo "Verification bot accessible (requiert test manuel):"
	@echo "  - Ouvrir Teams"
	@echo "  - Tester commande: 'Bonjour'"
	@echo "  - Tester commande: '/droitsTravail'"
	@echo ""
	@echo "Pour tests complets: docs/guides/deployment/production-deployment.md"

# Nettoyage
clean:
	@echo "Nettoyage build artifacts..."
	cd .. && rm -rf node_modules/.cache
	@echo "Nettoyage termine"
