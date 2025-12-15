# Makefile - Orchestrateur CI/CD pour Légis Québec
# Usage: make <target>
# Principes: minimaliste, portable, testable

.PHONY: help test build deploy-dev deploy-prod validate clean github-setup github-check-secrets github-configure-auto github-secrets-setup prod-provision prod-create-rg prod-install-teams workflow-test-pr workflow-merge-pr workflow-release-rc workflow-release workflow-status workflow-logs workflow-view

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
	@echo "  github-setup          - Afficher commandes configuration GitHub"
	@echo "  github-configure-auto - Configurer GitHub automatiquement (gh CLI)"
	@echo "  github-check-secrets  - Verifier secrets GitHub configures"
	@echo "  github-secrets-setup  - Configurer secrets depuis .env.prod.user"
	@echo ""
	@echo "Production:"
	@echo "  prod-create-rg      - Creer resource group PROD dans Azure"
	@echo "  prod-provision      - Provisionner environnement PROD (Issue #28)"
	@echo "  prod-install-teams  - Ouvrir lien installation bot Teams PROD"
	@echo ""
	@echo "Workflow CI/CD:"
	@echo "  workflow-test-pr    - Creer PR de test vers dev (declenche ci-tests.yml)"
	@echo "  workflow-merge-pr   - Merger PR (declenche deploy-dev.yml)"
	@echo "  workflow-release-rc - Creer tag RC (v4.0.0-rc1, declenche deploy-prod.yml)"
	@echo "  workflow-release    - Creer tag final (v4.0.0, declenche deploy-prod.yml)"
	@echo "  workflow-status     - Verifier statut workflows GitHub Actions"
	@echo "  workflow-view       - Voir details d'un workflow (demande run-id)"
	@echo "  workflow-logs       - Voir logs d'un workflow (demande run-id)"
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
deploy-dev:
	@echo "Deploiement code vers Azure DEV..."
	@echo "Chargement configuration DEV..."
	@set -a; . ../env/.env.dev; \
	if [ -f ../env/.env.dev.user ]; then . ../env/.env.dev.user; fi; \
	set +a; \
	WEB_APP_NAME=$$(echo $$BOT_DOMAIN | cut -d'.' -f1); \
	echo "Deploiement vers $$WEB_APP_NAME..."; \
	cd .. && zip -r deploy.zip . -x "*.git*" "node_modules/*" "deployment/*" && \
	az webapp deployment source config-zip \
		--resource-group $$AZURE_RESOURCE_GROUP_NAME \
		--name $$WEB_APP_NAME \
		--src deploy.zip && \
	rm deploy.zip
	@echo "Deploiement DEV termine"

# Deploy PROD
deploy-prod:
	@echo "Deploiement code vers Azure PROD..."
	@echo "Chargement configuration PROD..."
	@set -a; . ../env/.env.prod; \
	if [ -f ../env/.env.prod.user ]; then . ../env/.env.prod.user; fi; \
	set +a; \
	WEB_APP_NAME=$$(echo $$BOT_DOMAIN | cut -d'.' -f1); \
	echo "Deploiement vers $$WEB_APP_NAME..."; \
	cd .. && zip -r deploy.zip . -x "*.git*" "node_modules/*" "deployment/*" && \
	az webapp deployment source config-zip \
		--resource-group $$AZURE_RESOURCE_GROUP_NAME \
		--name $$WEB_APP_NAME \
		--src deploy.zip && \
	rm deploy.zip
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

# Configurer secrets GitHub depuis .env.prod.user
github-secrets-setup: check-gh-cli
	@echo "🔐 Configuration secrets GitHub depuis env/.env.prod.user"
	@echo ""
	@if [ ! -f ../env/.env.prod.user ]; then \
		echo "❌ Erreur: Fichier ../env/.env.prod.user introuvable"; \
		echo "   Ce fichier doit contenir les secrets a configurer"; \
		exit 1; \
	fi
	@echo "📤 Envoi des secrets vers GitHub..."
	@grep -v '^#' ../env/.env.prod.user | grep -v '^$$' | grep -v 'TEAMS_APP_UPDATE_TIME' | while IFS='=' read -r key value; do \
		if [ -n "$$key" ] && [ -n "$$value" ]; then \
			echo "   ⏳ $$key..."; \
			echo "$$value" | gh secret set --repo $(REPO) "$$key" 2>/dev/null && echo "   ✅ $$key configure" || echo "   ❌ Erreur avec $$key"; \
		fi; \
	done
	@echo ""
	@echo "✅ Secrets configures!"
	@echo "🔍 Verification: make github-check-secrets"

# Creer resource group PROD dans Azure
prod-create-rg: check-az-cli
	@echo "Creation resource group PROD..."
	@az group create --name rg-bot-legisqc-prd-cae-01 --location canadaeast --output table
	@echo "✓ Resource group cree"

# Provisionner environnement PROD
prod-provision: check-teams-cli prod-create-rg
	@bash scripts/prod-provision.sh

# Ouvrir lien installation Teams PROD
prod-install-teams:
	@echo "=========================================="
	@echo "Installation Bot Teams PROD"
	@echo "=========================================="
	@echo ""
	@echo "Teams App ID: $(shell grep '^TEAMS_APP_ID=' ../env/.env.prod | cut -d'=' -f2)"
	@echo "Bot Domain: $(shell grep '^BOT_DOMAIN=' ../env/.env.prod | cut -d'=' -f2)"
	@echo ""
	@echo "Lien d'installation:"
	@echo "https://teams.microsoft.com/l/app/$(shell grep '^TEAMS_APP_ID=' ../env/.env.prod | cut -d'=' -f2)?installAppPackage=true"
	@echo ""
	@echo "Ouverture du navigateur..."
	@powershell.exe -Command "Start-Process 'https://teams.microsoft.com/l/app/$(shell grep '^TEAMS_APP_ID=' ../env/.env.prod | cut -d'=' -f2)?installAppPackage=true'"
	@echo ""
	@echo "Si le navigateur ne s'ouvre pas, copiez le lien ci-dessus"

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

# ==========================================
# Workflow CI/CD - Orchestration Git/GitHub
# ==========================================

# Creer PR de test vers dev (declenche workflow ci-tests.yml)
workflow-test-pr: check-gh-cli
	@echo "=========================================="
	@echo "Creation PR de test vers dev"
	@echo "=========================================="
	@echo ""
	@bash scripts/workflow-create-pr.sh $(REPO)

# Merger PR (declenche workflow deploy-dev.yml)
workflow-merge-pr: check-gh-cli
	@echo "=========================================="
	@echo "Merge PR vers dev"
	@echo "=========================================="
	@echo ""
	@read -p "Numero de PR a merger: " PR_NUMBER && \
	gh pr merge $$PR_NUMBER --repo $(REPO) --merge --delete-branch && \
	echo "" && \
	echo "✓ PR #$$PR_NUMBER mergee" && \
	echo "✓ Branche supprimee" && \
	echo "✓ Workflow deploy-dev.yml declenche automatiquement" && \
	echo "" && \
	echo "Verifier: make workflow-status"

# Creer tag Release Candidate (declenche workflow deploy-prod.yml avec approbation)
workflow-release-rc: check-gh-cli
	@echo "=========================================="
	@echo "Creation tag Release Candidate"
	@echo "=========================================="
	@echo ""
	@bash scripts/workflow-create-tag.sh $(REPO) rc

# Creer tag final stable (declenche workflow deploy-prod.yml avec approbation)
workflow-release: check-gh-cli
	@echo "=========================================="
	@echo "Creation tag release final"
	@echo "=========================================="
	@echo ""
	@bash scripts/workflow-create-tag.sh $(REPO) final

# Verifier statut des workflows GitHub Actions
workflow-status: check-gh-cli
	@echo "=========================================="
	@echo "Statut workflows GitHub Actions"
	@echo "=========================================="
	@echo ""
	@gh run list --repo $(REPO) --limit 10
	@echo ""
	@echo "Diagnostique:"
	@echo "  make workflow-view    - Voir details workflow"
	@echo "  make workflow-logs    - Voir logs complets"

# Voir details d'un workflow specifique
workflow-view: check-gh-cli
	@echo "=========================================="
	@echo "Details workflow"
	@echo "=========================================="
	@echo ""
	@read -p "Run ID (depuis workflow-status): " RUN_ID && \
	gh run view $$RUN_ID --repo $(REPO)

# Voir logs complets d'un workflow
workflow-logs: check-gh-cli
	@echo "=========================================="
	@echo "Logs workflow"
	@echo "=========================================="
	@echo ""
	@read -p "Run ID (depuis workflow-status): " RUN_ID && \
	gh run view $$RUN_ID --log --repo $(REPO)
