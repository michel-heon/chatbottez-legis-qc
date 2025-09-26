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
ATK ?= atk
PACKAGE_DIR := appPackage/build
PACKAGE_FILE := $(PACKAGE_DIR)/appPackage.$(ENV).zip
INSTALL_SCOPE ?= Personal
PREVIEW_BROWSER ?= chrome

# Central shared environment variables
SHARED_ENV_VARS :=

ifneq (,$(wildcard env/common.env))
include env/common.env
SHARED_ENV_VARS += $(shell awk -F= '/^[A-Za-z_][A-Za-z0-9_]*=/{print $$1}' env/common.env)
endif

ifneq (,$(wildcard env/common.env.user))
include env/common.env.user
SHARED_ENV_VARS += $(shell awk -F= '/^[A-Za-z_][A-Za-z0-9_]*=/{print $$1}' env/common.env.user)
endif

ifneq ($(strip $(SHARED_ENV_VARS)),)
export $(sort $(SHARED_ENV_VARS))
endif

# Couleurs pour l'affichage
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Cibles par défaut
.PHONY: help help-detailed install status clean-env archive clean clean-all clear-browser-cookies init-env list-env validate-env-config refresh-secrets package-app install-app preview preview-firefox dev-start dev-playground test-tunnel open-admin-portal backup dev-setup teams-clean playground
.DEFAULT_GOAL := help

##@ Aide
help: ## Résumé des commandes principales
	@echo "$(BLUE)Commandes principales$(NC)"
	@echo "  $(GREEN)make install$(NC)          - Installer les dépendances npm"
	@echo "  $(GREEN)make dev-start$(NC)        - Démarrer le bot local (Teams Toolkit)"
	@echo "  $(GREEN)make refresh-secrets$(NC)  - Régénérer les secrets via provision"
	@echo "  $(GREEN)make package-app$(NC)      - Construire le package Teams"
	@echo "  $(GREEN)make install-app$(NC)      - Sideload du package dans Teams"
	@echo "  $(GREEN)make preview-firefox$(NC)  - Ouvrir la preview locale dans Firefox"
	@echo "  $(GREEN)make provision$(NC)        - Provisionner l'environnement ciblé"
	@echo "  $(GREEN)make deploy$(NC)           - Déployer sur Azure"
	@echo "  $(GREEN)make clean$(NC)            - Nettoyer les artefacts courants"
	@echo "  $(GREEN)make clean-all$(NC)        - Nettoyage approfondi"
	@echo "  $(GREEN)make backup$(NC)           - Sauvegarde rapide (env/, appPackage/)"
	@echo ""
	@echo "$(BLUE)Documentation$(NC)"
	@echo "  $(GREEN)make help-detailed$(NC)    - Liste exhaustive des cibles documentées"
	@echo "  docs/MAKEFILE.md                  - Guide complet"

help-detailed: ## Affiche la liste complète des cibles documentées
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BLUE)Usage:$(NC)\n  make $(YELLOW)<target>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Installation et Configuration
install: ## Installe les dépendances npm
	@echo "$(YELLOW)Installation des dépendances...$(NC)"
	npm install --no-audit

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
	$(ATK) auth list

auth-login-m365: ## Se connecte à Microsoft 365
	@echo "$(YELLOW)Connexion à Microsoft 365 (tenant: $(TENANT_ID))...$(NC)"
	$(ATK) auth login m365 --tenant $(TENANT_ID)

auth-login-azure: ## Se connecte à Azure
	@echo "$(YELLOW)Connexion à Azure...$(NC)"
	$(ATK) auth login azure

auth-logout: ## Se déconnecte de tous les services
	@echo "$(YELLOW)Déconnexion...$(NC)"
	$(ATK) auth logout azure || true
	$(ATK) auth logout m365 || true

auth-setup: auth-logout auth-login-m365 auth-login-azure auth-status ## Configuration complète de l'authentification

##@ Provisioning et Déploiement
provision: validate-env ## Provisionne les ressources Azure pour l'environnement spécifié
	@echo "$(YELLOW)Provisioning de l'environnement $(ENV)...$(NC)"
	$(ATK) provision --env $(ENV)

deploy: validate-env ## Déploie l'application sur Azure pour l'environnement spécifié
	@echo "$(YELLOW)Déploiement de l'application pour l'environnement $(ENV)...$(NC)"
	$(ATK) deploy --env $(ENV)

publish: validate-env ## Publie l'application Teams pour l'environnement spécifié
	@echo "$(YELLOW)Publication de l'application Teams pour l'environnement $(ENV)...$(NC)"
	$(ATK) publish --env $(ENV)

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
init-env: ## Initialise un nouvel environnement (usage: make init-env ENV=monenv)
	@cd env && $(MAKE) init ENV=$(ENV)

list-env: ## Liste tous les environnements disponibles
	@cd env && $(MAKE) list

validate-env-config: ## Valide la configuration d'un environnement (usage: make validate-env-config ENV=monenv)
	@cd env && $(MAKE) validate ENV=$(ENV)

clean-env: check-env ## Nettoie l'environnement spécifié (supprime les ressources)
	@echo "$(RED)Attention: Cette action va supprimer toutes les ressources de l'environnement $(ENV)$(NC)"
	@read -p "Êtes-vous sûr? [y/N] " confirm && [ "$${confirm:-N}" = "y" ]
	$(ATK) down --env $(ENV)

reset-env: clean-env provision ## Remet à zéro l'environnement (clean + provision)
	@echo "$(GREEN)Environnement $(ENV) remis à zéro$(NC)"

##@ Développement
dev-start: ## Démarre l'application en mode développement
	npm run dev:teamsfx

dev-playground: ## Démarre l'environnement de test (playground)
	npm run dev:teamsfx:testtool

playground: ## Alias du mode playground (équivaut à dev-playground)
	$(MAKE) dev-playground ENV=$(ENV)

test-tunnel: ## Démarre le tunnel de développement local (Dev Tunnel)
	@echo "$(YELLOW)Les versions actuelles de Microsoft 365 Agents Toolkit n'exposent pas encore de commande CLI pour les Dev Tunnels.$(NC)"
	@echo "$(YELLOW)Utilisez VS Code → Tâche 'Start local tunnel' ou la cible 'Debug in Teams' (F5).$(NC)"
	@echo "$(GREEN)Une fois le tunnel actif, les variables BOT_DOMAIN/BOT_ENDPOINT sont écrites dans env/.env.$(ENV).$(NC)"

##@ Packaging & Preview
refresh-secrets: validate-env ## Régénère les secrets (bot, AAD) et met à jour les fichiers .env via la provision
	@echo "$(YELLOW)Rotation des secrets pour l'environnement $(ENV)...$(NC)"
	$(ATK) provision --env $(ENV)

package-app: validate-env ## Construit le package Teams (appPackage.$(ENV).zip)
	@echo "$(YELLOW)Construction du package Teams pour $(ENV)...$(NC)"
	$(ATK) package --env $(ENV) --output-package-file $(PACKAGE_FILE)
	@echo "$(GREEN)Package généré: $(PACKAGE_FILE)$(NC)"

install-app: package-app ## Sideload du package dans Teams (INSTALL_SCOPE=Personal|Shared)
	@echo "$(YELLOW)Sideload du package $(PACKAGE_FILE) (scope=$(INSTALL_SCOPE))...$(NC)"
	$(ATK) install --file-path $(PACKAGE_FILE) --scope $(INSTALL_SCOPE)
	@echo "$(GREEN)Installation/sideload terminé$(NC)"

preview: validate-env ## Lance la preview Teams (chrome|edge via ATK, firefox via script dédié)
	@if [ "$(PREVIEW_BROWSER)" = "firefox" ]; then \
		echo "$(YELLOW)Ouverture de Teams (Firefox) pour l'environnement $(ENV)...$(NC)"; \
		./scripts/open-teams-firefox.sh $(ENV); \
	else \
		echo "$(YELLOW)Ouverture de Teams ($(PREVIEW_BROWSER)) pour l'environnement $(ENV)...$(NC)"; \
		BROWSER_BIN=""; \
		if [ "$(PREVIEW_BROWSER)" = "chrome" ] || [ "$(PREVIEW_BROWSER)" = "chromium" ]; then \
			BROWSER_BIN=$${CHROMIUM_BIN:-/snap/bin/chromium}; \
		fi; \
		if [ -n "$$BROWSER_BIN" ] && [ -x "$$BROWSER_BIN" ]; then \
			$(ATK) preview --env $(ENV) --browser $(PREVIEW_BROWSER) \
			  --exec-path "$$BROWSER_BIN" \
			  --browser-arg="--user-data-dir=$(PWD)/devTools/Teams-profile" \
			  --browser-arg="--no-first-run" \
			  --browser-arg="--no-default-browser-check" \
			  --browser-arg="--disable-extensions" \
			  --browser-arg="--no-sandbox"; \
		else \
			$(ATK) preview --env $(ENV) --browser $(PREVIEW_BROWSER); \
		fi; \
	fi

preview-firefox: ## Alias pratique: preview dans Firefox
	$(MAKE) preview ENV=$(ENV) PREVIEW_BROWSER=firefox

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

##@ Utilitaires
backup: ## Sauvegarde légère des dossiers clés (env/, appPackage/)
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S) && \
	mkdir -p backups/backup_$$TIMESTAMP && \
	cp -r env/ backups/backup_$$TIMESTAMP/ 2>/dev/null || true && \
	cp -r appPackage/ backups/backup_$$TIMESTAMP/ 2>/dev/null || true && \
	echo "$(GREEN)Backup créé: backups/backup_$$TIMESTAMP$(NC)"

dev-setup: install ## Prépare l'environnement VS Code pour le playground
	@mkdir -p .vscode
	@echo '{"teams.defaultEnvironment": "playground"}' > .vscode/settings.json
	@echo "$(GREEN)Configuration VS Code prête. Lancez 'make playground'.$(NC)"

teams-clean: ## Supprime les artefacts Teams générés localement
	rm -rf appPackage/build/
	rm -f env/.env.local.backup.*
	rm -f env/.env.dev.backup.*
	@echo "$(GREEN)Artefacts Teams nettoyés$(NC)"

clean: ## Nettoie les fichiers temporaires et l'archive
	@echo "$(YELLOW)Nettoyage des fichiers temporaires...$(NC)"
	rm -f $(ARCHIVE_NAME)
	rm -rf node_modules || true
	rm -rf appPackage/build || true
	rm -f temp_new_app_id.txt new-teams-app-id.txt || true
	@echo "$(GREEN)Nettoyage terminé$(NC)"

clean-all: clean ## Nettoyage complet (inclut node_modules et outils locaux)
	@echo "$(YELLOW)Nettoyage approfondi...$(NC)"
	rm -rf node_modules/
	rm -rf devTools/
	rm -f package-lock.json
	@echo "$(GREEN)Nettoyage approfondi terminé. Relancez 'make install'.$(NC)"

clear-browser-cookies: ## Purge les cookies et données de session de Chromium pour Teams/M365
	@echo "$(YELLOW)Purge des cookies et données de session de Chromium...$(NC)"
	@echo "$(BLUE)Fermeture de Chromium...$(NC)"
	-@pkill -f "chromium" 2>/dev/null; true
	@sleep 2
	@echo "$(BLUE)Nettoyage des données Chromium Snap...$(NC)"
	@rm -rf $$HOME/snap/chromium/common/.config/chromium/Default/Cookies* 2>/dev/null || true
	@rm -rf $$HOME/snap/chromium/common/.config/chromium/Default/Local\ Storage 2>/dev/null || true
	@rm -rf $$HOME/snap/chromium/common/.config/chromium/Default/Session\ Storage 2>/dev/null || true
	@rm -rf $$HOME/snap/chromium/common/.config/chromium/Default/IndexedDB 2>/dev/null || true
	@rm -rf $$HOME/snap/chromium/common/.config/chromium/Default/blob_storage 2>/dev/null || true
	@echo "$(GREEN)Purge des cookies Chromium terminée. Redémarrez Chromium pour appliquer les changements.$(NC)"
