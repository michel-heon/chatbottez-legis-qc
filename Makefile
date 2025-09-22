###################################################################
# Nom du Script  : Makefile - Gestion du projet chatbottez-legis-qc
# Description    : Ce Makefile gère le provisioning, déploiement et 
#                  archivage du bot Teams pour différents environnements.
# Auteur         : Michel Héon PhD
# Droits d'auteur: Cotechnoe inc. (c) 2025
###################################################################

# Variables
ARCHIVE_NAME := ../chatbottez-legis-qc.tar.gz
ENV ?= local
TENANT_ID := aba0984a-85a2-4fd4-9ae5-0a45d7efc9d2

# Couleurs pour l'affichage
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Cibles par défaut
.PHONY: help install status clean-env archive clean
.DEFAULT_GOAL := help

##@ Aide
help: ## Affiche cette aide
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BLUE)Usage:$(NC)\n  make $(YELLOW)<target>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Installation et Configuration
install: ## Installe les dépendances npm
	@echo "$(YELLOW)Installation des dépendances...$(NC)"
	npm install

check-env: ## Vérifie que l'environnement est spécifié
	@if [ "$(ENV)" = "" ]; then \
		echo "$(RED)Erreur: ENV doit être spécifié (local, playground, cotechnoe)$(NC)"; \
		exit 1; \
	fi

validate-env: check-env ## Valide l'environnement et ses prérequis
	@echo "$(YELLOW)Validation de l'environnement $(ENV)...$(NC)"
	@if [ ! -f "env/.env.$(ENV)" ]; then \
		echo "$(RED)Erreur: Fichier env/.env.$(ENV) introuvable$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "m365agents.$(ENV).yml" ]; then \
		echo "$(RED)Erreur: Fichier m365agents.$(ENV).yml introuvable$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Environnement $(ENV) validé avec succès$(NC)"

##@ Authentification
auth-status: ## Affiche le statut d'authentification
	@echo "$(BLUE)Statut d'authentification:$(NC)"
	atk auth list

auth-login-m365: ## Se connecte à Microsoft 365
	@echo "$(YELLOW)Connexion à Microsoft 365 (tenant: $(TENANT_ID))...$(NC)"
	atk auth login m365 --tenant $(TENANT_ID)

auth-login-azure: ## Se connecte à Azure
	@echo "$(YELLOW)Connexion à Azure...$(NC)"
	atk auth login azure

auth-logout: ## Se déconnecte de tous les services
	@echo "$(YELLOW)Déconnexion...$(NC)"
	atk auth logout azure || true
	atk auth logout m365 || true

auth-setup: auth-logout auth-login-m365 auth-login-azure auth-status ## Configuration complète de l'authentification

##@ Provisioning et Déploiement
provision: validate-env ## Provisionne les ressources Azure pour l'environnement spécifié
	@echo "$(YELLOW)Provisioning de l'environnement $(ENV)...$(NC)"
	atk provision --env $(ENV)

deploy: validate-env ## Déploie l'application sur Azure pour l'environnement spécifié
	@echo "$(YELLOW)Déploiement de l'application pour l'environnement $(ENV)...$(NC)"
	atk deploy --env $(ENV)

publish: validate-env ## Publie l'application Teams pour l'environnement spécifié
	@echo "$(YELLOW)Publication de l'application Teams pour l'environnement $(ENV)...$(NC)"
	atk publish --env $(ENV)

##@ Gestion des versions
increment-version: ## Incrémente automatiquement la version patch dans manifest.json (x.y.z -> x.y.z+1)
	@echo "$(YELLOW)Incrémentation de la version dans manifest.json...$(NC)"
	@python3 scripts/increment_version.py
	@echo "$(GREEN)Incrémentation de version terminée$(NC)"

auto-publish: validate-env increment-version publish ## Incrémente la version et publie automatiquement
	@echo "$(GREEN)Publication automatique terminée pour l'environnement $(ENV)$(NC)"

auto-publish-and-open: validate-env increment-version publish open-admin-portal ## Incrémente, publie et ouvre le portail admin
	@echo "$(GREEN)Publication automatique terminée avec ouverture du portail admin$(NC)"

full-deploy: install auth-setup provision deploy publish ## Déploiement complet (provision + deploy + publish)
	@echo "$(GREEN)Déploiement complet terminé pour l'environnement $(ENV)$(NC)"

##@ Environnements spécifiques
local-deploy: ## Déploiement pour l'environnement local
	$(MAKE) full-deploy ENV=local

playground-deploy: ## Déploiement pour l'environnement playground
	$(MAKE) full-deploy ENV=playground

cotechnoe-deploy: ## Déploiement pour l'environnement cotechnoe
	$(MAKE) full-deploy ENV=cotechnoe

##@ Gestion des environnements
clean-env: check-env ## Nettoie l'environnement spécifié (supprime les ressources)
	@echo "$(RED)Attention: Cette action va supprimer toutes les ressources de l'environnement $(ENV)$(NC)"
	@read -p "Êtes-vous sûr? [y/N] " confirm && [ "$${confirm:-N}" = "y" ]
	atk down --env $(ENV)

reset-env: clean-env provision ## Remet à zéro l'environnement (clean + provision)
	@echo "$(GREEN)Environnement $(ENV) remis à zéro$(NC)"

##@ Développement
dev-start: ## Démarre l'application en mode développement
	npm run dev:teamsfx

dev-playground: ## Démarre l'environnement de test (playground)
	npm run dev:teamsfx:testtool

test-tunnel: ## Démarre le tunnel de développement local
	atk debug-start-local-tunnel --env local

open-admin-portal: ## Ouvre le portail d'administration Teams dans le navigateur
	@echo "$(YELLOW)Ouverture du portail d'administration Teams...$(NC)"
	@echo "$(BLUE)URL: https://aka.ms/teamsfx-mtac$(NC)"
	@if command -v xdg-open > /dev/null; then \
		xdg-open "https://aka.ms/teamsfx-mtac"; \
	elif command -v open > /dev/null; then \
		open "https://aka.ms/teamsfx-mtac"; \
	elif command -v start > /dev/null; then \
		start "https://aka.ms/teamsfx-mtac"; \
	else \
		echo "$(RED)Impossible d'ouvrir automatiquement le navigateur.$(NC)"; \
		echo "$(YELLOW)Veuillez ouvrir manuellement: https://aka.ms/teamsfx-mtac$(NC)"; \
	fi

##@ Monitoring et Debug
status: ## Affiche le statut de tous les environnements
	@echo "$(BLUE)Statut des environnements:$(NC)"
	@for env in local playground cotechnoe; do \
		if [ -f "env/.env.$$env" ]; then \
			echo "$(GREEN)✓$(NC) Environnement $$env configuré"; \
			if grep -q "TEAMS_APP_ID=" "env/.env.$$env" && [ -n "$$(grep "TEAMS_APP_ID=" "env/.env.$$env" | cut -d'=' -f2)" ]; then \
				echo "  └─ App ID: $$(grep "TEAMS_APP_ID=" "env/.env.$$env" | cut -d'=' -f2)"; \
			fi; \
		else \
			echo "$(RED)✗$(NC) Environnement $$env non configuré"; \
		fi; \
	done

logs: check-env ## Affiche les logs de l'application pour l'environnement spécifié
	@echo "$(BLUE)Récupération des logs pour l'environnement $(ENV)...$(NC)"
	@if [ -f "env/.env.$(ENV)" ]; then \
		BOT_DOMAIN=$$(grep "BOT_DOMAIN=" "env/.env.$(ENV)" | cut -d'=' -f2); \
		if [ -n "$$BOT_DOMAIN" ]; then \
			echo "$(YELLOW)Domaine du bot: $$BOT_DOMAIN$(NC)"; \
			echo "$(YELLOW)Visitez: https://$$BOT_DOMAIN pour tester$(NC)"; \
		fi; \
	fi

health-check: check-env ## Vérifie la santé du bot déployé
	@echo "$(BLUE)Vérification de la santé du bot pour l'environnement $(ENV)...$(NC)"
	@if [ -f "env/.env.$(ENV)" ]; then \
		BOT_DOMAIN=$$(grep "BOT_DOMAIN=" "env/.env.$(ENV)" | cut -d'=' -f2); \
		if [ -n "$$BOT_DOMAIN" ]; then \
			echo "$(YELLOW)Test de connectivité: https://$$BOT_DOMAIN$(NC)"; \
			if curl -s -o /dev/null -w "%{http_code}" https://$$BOT_DOMAIN | grep -q "^[23]"; then \
				echo "$(GREEN)✓ Bot accessible$(NC)"; \
			else \
				echo "$(YELLOW)⚠ Bot non accessible (normal si pas d'endpoint racine)$(NC)"; \
			fi; \
			echo "$(YELLOW)Test de l'endpoint bot: https://$$BOT_DOMAIN/api/messages$(NC)"; \
			STATUS=$$(curl -s -o /dev/null -w "%{http_code}" https://$$BOT_DOMAIN/api/messages); \
			if [ "$$STATUS" = "405" ]; then \
				echo "$(GREEN)✓ Endpoint bot fonctionnel (405 = Method Not Allowed normal pour GET)$(NC)"; \
			elif [ "$$STATUS" = "401" ]; then \
				echo "$(GREEN)✓ Endpoint bot fonctionnel (401 = Auth required, normal)$(NC)"; \
			else \
				echo "$(RED)✗ Endpoint bot problématique (HTTP $$STATUS)$(NC)"; \
				echo "$(YELLOW)Tentative de test avec POST...$(NC)"; \
				POST_STATUS=$$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{}' https://$$BOT_DOMAIN/api/messages); \
				if [ "$$POST_STATUS" = "200" ] || [ "$$POST_STATUS" = "401" ] || [ "$$POST_STATUS" = "403" ]; then \
					echo "$(GREEN)✓ Endpoint POST fonctionnel ($$POST_STATUS)$(NC)"; \
				else \
					echo "$(RED)✗ Endpoint POST aussi problématique (HTTP $$POST_STATUS)$(NC)"; \
					echo "$(YELLOW)Vérifiez les logs Azure pour plus de détails$(NC)"; \
				fi; \
			fi; \
		fi; \
	fi

debug-azure: check-env ## Debug de l'application Azure avec informations détaillées
	@echo "$(BLUE)Diagnostic Azure pour l'environnement $(ENV)...$(NC)"
	@if [ -f "env/.env.$(ENV)" ]; then \
		BOT_DOMAIN=$$(grep "BOT_DOMAIN=" "env/.env.$(ENV)" | cut -d'=' -f2); \
		RESOURCE_GROUP=$$(grep "AZURE_RESOURCE_GROUP_NAME=" "env/.env.$(ENV)" | cut -d'=' -f2); \
		APP_NAME=$$(echo $$BOT_DOMAIN | cut -d'.' -f1); \
		echo "$(YELLOW)App Service: $$APP_NAME$(NC)"; \
		echo "$(YELLOW)Resource Group: $$RESOURCE_GROUP$(NC)"; \
		echo "$(YELLOW)Domain: $$BOT_DOMAIN$(NC)"; \
		echo ""; \
		echo "$(BLUE)Pour déboguer via Azure Portal:$(NC)"; \
		echo "1. Aller sur https://portal.azure.com"; \
		echo "2. Naviguer vers Resource Groups > $$RESOURCE_GROUP"; \
		echo "3. Cliquer sur l'App Service '$$APP_NAME'"; \
		echo "4. Aller dans 'Log stream' ou 'Advanced Tools (Kudu)'"; \
		echo ""; \
		echo "$(BLUE)Test rapide de l'endpoint:$(NC)"; \
		curl -X POST https://$$BOT_DOMAIN/api/messages \
			-H "Content-Type: application/json" \
			-H "User-Agent: HealthCheck/1.0" \
			-d '{"type":"message","text":"test"}' \
			-w "\n\nStatus: %{http_code}\nTime: %{time_total}s\n" \
			-s --max-time 30; \
	fi

debug-logs: check-env ## Affiche les logs Azure en temps réel
	@if [ -f "env/.env.$(ENV)" ]; then \
		RESOURCE_GROUP=$$(grep "AZURE_RESOURCE_GROUP_NAME=" "env/.env.$(ENV)" | cut -d'=' -f2); \
		BOT_DOMAIN=$$(grep "BOT_DOMAIN=" "env/.env.$(ENV)" | cut -d'=' -f2); \
		APP_NAME=$$(echo $$BOT_DOMAIN | cut -d'.' -f1); \
		echo "$(YELLOW)Affichage des logs pour $$APP_NAME...$(NC)"; \
		echo "$(BLUE)Appuyez sur Ctrl+C pour arrêter$(NC)"; \
		az webapp log tail --name $$APP_NAME --resource-group $$RESOURCE_GROUP; \
	fi

fix-deployment: check-env ## Corrige les problèmes de déploiement courants
	@echo "$(YELLOW)Correction des problèmes de déploiement pour $(ENV)...$(NC)"
	@if [ -f "env/.env.$(ENV)" ]; then \
		RESOURCE_GROUP=$$(grep "AZURE_RESOURCE_GROUP_NAME=" "env/.env.$(ENV)" | cut -d'=' -f2); \
		BOT_DOMAIN=$$(grep "BOT_DOMAIN=" "env/.env.$(ENV)" | cut -d'=' -f2); \
		APP_NAME=$$(echo $$BOT_DOMAIN | cut -d'.' -f1); \
		echo "$(BLUE)Vérification des variables d'environnement...$(NC)"; \
		az webapp config appsettings list --name $$APP_NAME --resource-group $$RESOURCE_GROUP --query "[?contains(name, 'BOT_') || contains(name, 'AZURE_OPENAI')]" -o table; \
		echo ""; \
		echo "$(BLUE)Redémarrage de l'App Service...$(NC)"; \
		az webapp restart --name $$APP_NAME --resource-group $$RESOURCE_GROUP; \
		echo "$(GREEN)App Service redémarrée$(NC)"; \
	fi

##@ Archivage et Nettoyage
archive: ## Crée une archive du projet
	@echo "$(YELLOW)Création de l'archive...$(NC)"
	tar \
	  --exclude='./.git' \
	  --exclude='./node_modules' \
	  --exclude='./target' \
	  --exclude='./devTools' \
	  --exclude='*.zip' \
	  --exclude='*.gz' \
	  --exclude='*.png' \
	  -czvf $(ARCHIVE_NAME) .
	cp $(ARCHIVE_NAME) .
	@echo "$(GREEN)Archive créée: $(ARCHIVE_NAME)$(NC)"

clean: ## Nettoie les fichiers temporaires et l'archive
	@echo "$(YELLOW)Nettoyage des fichiers temporaires...$(NC)"
	rm -f $(ARCHIVE_NAME)
	rm -rf node_modules || true
	rm -rf appPackage/build || true
	@echo "$(GREEN)Nettoyage terminé$(NC)"

##@ Exemples d'usage
examples: ## Affiche des exemples d'usage
	@echo "$(BLUE)Exemples d'usage:$(NC)"
	@echo ""
	@echo "$(YELLOW)1. Déploiement complet pour cotechnoe:$(NC)"
	@echo "   make cotechnoe-deploy"
	@echo ""
	@echo "$(YELLOW)2. Provisioning seulement:$(NC)"
	@echo "   make provision ENV=local"
	@echo ""
	@echo "$(YELLOW)3. Déploiement après modification du code:$(NC)"
	@echo "   make deploy ENV=cotechnoe"
	@echo ""
	@echo "$(YELLOW)4. Vérification du statut:$(NC)"
	@echo "   make status"
	@echo "   make auth-status"
	@echo ""
	@echo "$(YELLOW)5. Développement local:$(NC)"
	@echo "   make dev-start"
