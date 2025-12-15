# Makefile - Orchestrateur CI/CD pour Légis Québec
# Usage: make <target>
# Principes: minimaliste, portable, testable

.PHONY: help test build deploy-dev deploy-prod validate clean github-setup github-check-secrets github-configure-auto prod-provision

# Target par defaut
.DEFAULT_GOAL := help

# Variables
NODE_VERSION := $(shell node --version 2>/dev/null)
TEAMS_CLI := $(shell which teamsapp 2>/dev/null)
AZ_CLI := $(shell which az 2>/dev/null)
GH_CLI := $(shell which gh 2>/dev/null)
REPO := michel-heon/chatbottez-legis-qc

help:
	@echo "Targets disponibles:"
	@echo ""
	@echo "  help             - Afficher cette aide"
	@echo "  test             - Executer tests npm"
	@echo "  build            - Verifier dependencies"
	@echo "  deploy-dev       - Deployer code vers Azure DEV"
	@echo "  deploy-prod      - Deployer code vers Azure PROD"
	@echo "  validate         - Tests smoke post-deploiement"
	@echo "  clean            - Nettoyer build artifacts"
	@echo ""
	@echo "GitHub CI/CD:"
	@echo "  github-setup     - Afficher commandes configuration GitHub"
	@echo "  github-configure-auto - Configurer GitHub automatiquement (gh CLI)"
	@echo "  github-check-secrets  - Verifier secrets GitHub configures"
	@echo ""
	@echo "Production:"
	@echo "  prod-provision   - Provisionner environnement PROD (Issue #28)"
	@echo ""
	@echo "Note: Playground/Local/Dev deja provisionnes via M365 Agents Toolkit"
	@echo ""
	@echo "Exemples:"
	@echo "  make test                # Lancer tests localement"
	@echo "  make deploy-dev          # Deployer code vers DEV"
	@echo "  make deploy-prod         # Deployer code vers PROD"
	@echo "  make github-setup        # Guide configuration GitHub"

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

# Configuration GitHub - Afficher les commandes necessaires
github-setup: check-az-cli
	@echo "=========================================="
	@echo "Configuration GitHub CI/CD"
	@echo "=========================================="
	@echo ""
	@echo "Etape 1: Recuperer informations Azure"
	@echo "--------------------------------------"
	@echo "Subscription ID:"
	@az account show --query id -o tsv 2>/dev/null || echo "  az account show --query id -o tsv"
	@echo ""
	@echo "Tenant ID:"
	@az account show --query tenantId -o tsv 2>/dev/null || echo "  az account show --query tenantId -o tsv"
	@echo ""
	@echo "Etape 2: Configurer GitHub Secrets"
	@echo "--------------------------------------"
	@echo "Aller sur: https://github.com/michel-heon/chatbottez-legis-qc/settings/secrets/actions"
	@echo ""
	@echo "Creer 2 secrets:"
	@echo "  - AZURE_SUBSCRIPTION_ID = <subscription_id>"
	@echo "  - AZURE_TENANT_ID = <tenant_id>"
	@echo ""
	@echo "Etape 3: Configurer GitHub Environments"
	@echo "--------------------------------------"
	@echo "Aller sur: https://github.com/michel-heon/chatbottez-legis-qc/settings/environments"
	@echo ""
	@echo "Creer 2 environments:"
	@echo "  - dev  (pas de protection)"
	@echo "  - prod (required reviewers: michel-heon)"
	@echo ""
	@echo "Etape 4: Configurer Branch Protections"
	@echo "--------------------------------------"
	@echo "Aller sur: https://github.com/michel-heon/chatbottez-legis-qc/settings/branches"
	@echo ""
	@echo "Proteger main:"
	@echo "  - Require PR"
	@echo "  - Require status checks: ci-tests"
	@echo ""
	@echo "Proteger dev:"
	@echo "  - Require status checks: ci-tests"
	@echo ""
	@echo "Documentation complete: docs/guides/deployment/github-cicd-setup.md"
	@echo ""

# Configuration GitHub automatique (via GitHub CLI)
github-configure-auto: check-gh-cli check-az-cli
	@bash scripts/github-configure.sh $(REPO)

# Verifier secrets GitHub configures (via API GitHub)
github-check-secrets: check-gh-cli
	@echo "Verification secrets GitHub..."
	@gh secret list -R $(REPO)

# Provisionner environnement PROD
prod-provision: check-teams-cli
	@bash scripts/prod-provision.sh

# Verifier GitHub CLI installe
check-gh-cli:
ifndef GH_CLI
	@echo "ERREUR: GitHub CLI n'est pas installe"
	@echo "Installez: https://cli.github.com/"
	@exit 1
endif
	@echo "GitHub CLI: OK"

# Verifier Azure CLI installe
check-az-cli:
ifndef AZ_CLI
	@echo "ERREUR: Azure CLI n'est pas installe"
	@echo "Installez: https://docs.microsoft.com/cli/azure/install-azure-cli"
	@exit 1
endif
	@echo "Azure CLI: OK"
