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
.PHONY: help install status clean-env archive clean clear-browser-cookies init-env list-env validate-env-config
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
init-env: ## Initialise un nouvel environnement (usage: make init-env ENV=monenv)
	@cd env && $(MAKE) init ENV=$(ENV)

list-env: ## Liste tous les environnements disponibles
	@cd env && $(MAKE) list

validate-env-config: ## Valide la configuration d'un environnement (usage: make validate-env-config ENV=monenv)
	@cd env && $(MAKE) validate ENV=$(ENV)

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

##@ Gestion des Key Vaults
# Variables pour les Key Vaults
KV_SHARED_DEV = kv-legis-shared-dev-ce
KV_BOT_DEV = kv-legis-bot-dev-ce
KV_SHARED_PROD = kv-legis-shared-prod-ce
KV_BOT_PROD = kv-legis-bot-prod-ce
KV_COTECHNOE = kv-cotechnoe-central

keyvault-status: ## Affiche le statut de tous les Key Vaults
	@echo "$(BLUE)Statut des Key Vaults:$(NC)"
	@echo ""
	@echo "$(YELLOW)Key Vaults DEV:$(NC)"
	@az keyvault list --query "[?contains(name,'legis') && contains(name,'dev')].{Name:name,ResourceGroup:resourceGroup,Location:location}" -o table 2>/dev/null || echo "$(RED)✗ Erreur d'accès aux Key Vaults DEV$(NC)"
	@echo ""
	@echo "$(YELLOW)Key Vaults PROD:$(NC)"
	@az keyvault list --query "[?contains(name,'legis') && contains(name,'prod')].{Name:name,ResourceGroup:resourceGroup,Location:location}" -o table 2>/dev/null || echo "$(RED)✗ Erreur d'accès aux Key Vaults PROD$(NC)"
	@echo ""
	@echo "$(YELLOW)Key Vault CoTechnoe:$(NC)"
	@az keyvault list --query "[?name=='$(KV_COTECHNOE)'].{Name:name,ResourceGroup:resourceGroup,Location:location}" -o table 2>/dev/null || echo "$(RED)✗ Erreur d'accès au Key Vault CoTechnoe$(NC)"

keyvault-secrets: ## Liste les secrets dans les Key Vaults par environnement
	@echo "$(BLUE)Secrets des Key Vaults par environnement:$(NC)"
	@echo ""
	@echo "$(YELLOW)=== ENVIRONNEMENT DEV ===$(NC)"
	@echo "$(CYAN)Shared secrets ($(KV_SHARED_DEV)):$(NC)"
	@az keyvault secret list --vault-name $(KV_SHARED_DEV) --query "[].name" -o tsv 2>/dev/null | sort | sed 's/^/  - /' || echo "$(RED)✗ Impossible d'accéder à $(KV_SHARED_DEV)$(NC)"
	@echo "$(CYAN)Bot secrets ($(KV_BOT_DEV)):$(NC)"
	@az keyvault secret list --vault-name $(KV_BOT_DEV) --query "[].name" -o tsv 2>/dev/null | sort | sed 's/^/  - /' || echo "$(RED)✗ Impossible d'accéder à $(KV_BOT_DEV)$(NC)"
	@echo ""
	@echo "$(YELLOW)=== ENVIRONNEMENT PROD ===$(NC)"
	@echo "$(CYAN)Shared secrets ($(KV_SHARED_PROD)):$(NC)"
	@az keyvault secret list --vault-name $(KV_SHARED_PROD) --query "[].name" -o tsv 2>/dev/null | sort | sed 's/^/  - /' || echo "$(RED)✗ Impossible d'accéder à $(KV_SHARED_PROD)$(NC)"
	@echo "$(CYAN)Bot secrets ($(KV_BOT_PROD)):$(NC)"
	@az keyvault secret list --vault-name $(KV_BOT_PROD) --query "[].name" -o tsv 2>/dev/null | sort | sed 's/^/  - /' || echo "$(RED)✗ Impossible d'accéder à $(KV_BOT_PROD)$(NC)"
	@echo ""
	@echo "$(YELLOW)=== ENVIRONNEMENT COTECHNOE ===$(NC)"
	@echo "$(CYAN)All secrets ($(KV_COTECHNOE)):$(NC)"
	@az keyvault secret list --vault-name $(KV_COTECHNOE) --query "[].name" -o tsv 2>/dev/null | sort | sed 's/^/  - /' || echo "$(RED)✗ Impossible d'accéder à $(KV_COTECHNOE)$(NC)"

keyvault-validate: check-env ## Valide la résolution des secrets Key Vault pour l'environnement spécifié
	@echo "$(BLUE)Validation des secrets Key Vault pour l'environnement $(ENV)...$(NC)"
	@if [ ! -f "env/.env.$(ENV)" ]; then \
		echo "$(RED)✗ Fichier env/.env.$(ENV) introuvable$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Test de résolution des secrets avec le préprocesseur...$(NC)"
	@node scripts/keyvault-preprocessor.js validate $(ENV) 2>&1 | while read line; do \
		if echo "$$line" | grep -q "✓"; then \
			echo "$(GREEN)$$line$(NC)"; \
		elif echo "$$line" | grep -q "✗"; then \
			echo "$(RED)$$line$(NC)"; \
		elif echo "$$line" | grep -q "Résolution"; then \
			echo "$(BLUE)$$line$(NC)"; \
		else \
			echo "$(YELLOW)$$line$(NC)"; \
		fi; \
	done

keyvault-resolve: check-env ## Résout et génère les variables d'environnement depuis Key Vault
	@echo "$(BLUE)Résolution des secrets Key Vault pour $(ENV)...$(NC)"
	@if [ ! -f "env/.env.$(ENV)" ]; then \
		echo "$(RED)✗ Fichier env/.env.$(ENV) introuvable$(NC)"; \
		exit 1; \
	fi
	@node scripts/keyvault-preprocessor.js generate $(ENV)
	@if [ -f ".env.resolved.$(ENV)" ]; then \
		echo "$(GREEN)✓ Fichier .env.resolved.$(ENV) généré avec succès$(NC)"; \
		echo "$(YELLOW)Variables résolues:$(NC)"; \
		grep -c "=" ".env.resolved.$(ENV)" | sed 's/^/  /' && echo " variables"; \
	else \
		echo "$(RED)✗ Échec de la génération du fichier résolu$(NC)"; \
		exit 1; \
	fi

keyvault-compare: ## Compare les secrets entre environnements
	@echo "$(BLUE)Comparaison des secrets entre environnements:$(NC)"
	@echo ""
	@echo "$(YELLOW)Secrets DEV vs PROD (partagés):$(NC)"
	@DEV_SECRETS=$$(az keyvault secret list --vault-name $(KV_SHARED_DEV) --query "[].name" -o tsv 2>/dev/null | sort); \
	 PROD_SECRETS=$$(az keyvault secret list --vault-name $(KV_SHARED_PROD) --query "[].name" -o tsv 2>/dev/null | sort); \
	 echo "$(CYAN)Uniquement en DEV:$(NC)"; \
	 echo "$$DEV_SECRETS" | grep -v -F -x "$$PROD_SECRETS" 2>/dev/null | sed 's/^/  - /' || echo "  $(GREEN)Aucun$(NC)"; \
	 echo "$(CYAN)Uniquement en PROD:$(NC)"; \
	 echo "$$PROD_SECRETS" | grep -v -F -x "$$DEV_SECRETS" 2>/dev/null | sed 's/^/  - /' || echo "  $(GREEN)Aucun$(NC)"
	@echo ""
	@echo "$(YELLOW)Secrets DEV vs PROD (bot):$(NC)"
	@DEV_BOT_SECRETS=$$(az keyvault secret list --vault-name $(KV_BOT_DEV) --query "[].name" -o tsv 2>/dev/null | sort); \
	 PROD_BOT_SECRETS=$$(az keyvault secret list --vault-name $(KV_BOT_PROD) --query "[].name" -o tsv 2>/dev/null | sort); \
	 echo "$(CYAN)Uniquement en DEV:$(NC)"; \
	 echo "$$DEV_BOT_SECRETS" | grep -v -F -x "$$PROD_BOT_SECRETS" 2>/dev/null | sed 's/^/  - /' || echo "  $(GREEN)Aucun$(NC)"; \
	 echo "$(CYAN)Uniquement en PROD:$(NC)"; \
	 echo "$$PROD_BOT_SECRETS" | grep -v -F -x "$$DEV_BOT_SECRETS" 2>/dev/null | sed 's/^/  - /' || echo "  $(GREEN)Aucun$(NC)"

keyvault-permissions: ## Vérifie les permissions sur les Key Vaults
	@echo "$(BLUE)Vérification des permissions Key Vault:$(NC)"
	@CURRENT_USER=$$(az account show --query user.name -o tsv 2>/dev/null); \
	 echo "$(YELLOW)Utilisateur actuel: $$CURRENT_USER$(NC)"; \
	 echo ""
	@for vault in $(KV_SHARED_DEV) $(KV_BOT_DEV) $(KV_SHARED_PROD) $(KV_BOT_PROD) $(KV_COTECHNOE); do \
		echo "$(CYAN)Permissions pour $$vault:$(NC)"; \
		ACCESS=$$(az keyvault secret list --vault-name $$vault --query "length(@)" 2>/dev/null); \
		if [ -n "$$ACCESS" ]; then \
			echo "  $(GREEN)✓ Accès en lecture accordé$(NC)"; \
		else \
			echo "  $(RED)✗ Pas d'accès en lecture$(NC)"; \
		fi; \
		SET_TEST=$$(az keyvault secret set --vault-name $$vault --name "test-permission-$$$$" --value "test" 2>/dev/null && echo "OK" || echo "NOK"); \
		if [ "$$SET_TEST" = "OK" ]; then \
			echo "  $(GREEN)✓ Accès en écriture accordé$(NC)"; \
			az keyvault secret delete --vault-name $$vault --name "test-permission-$$$$" >/dev/null 2>&1; \
		else \
			echo "  $(YELLOW)⚠ Pas d'accès en écriture (lecture seule)$(NC)"; \
		fi; \
		echo ""; \
	done

keyvault-backup: ## Sauvegarde tous les secrets des Key Vaults (format JSON)
	@echo "$(BLUE)Sauvegarde des secrets Key Vault...$(NC)"
	@mkdir -p backup/keyvault
	@for vault in $(KV_SHARED_DEV) $(KV_BOT_DEV) $(KV_SHARED_PROD) $(KV_BOT_PROD) $(KV_COTECHNOE); do \
		echo "$(YELLOW)Sauvegarde de $$vault...$(NC)"; \
		az keyvault secret list --vault-name $$vault --include-managed true --query "[].{name:name,id:id}" -o json > backup/keyvault/$$vault-secrets-list.json 2>/dev/null || echo "$(RED)✗ Erreur lors de la sauvegarde de $$vault$(NC)"; \
	done
	@echo "$(GREEN)✓ Sauvegardes terminées dans backup/keyvault/$(NC)"

keyvault-clean-resolved: ## Nettoie les fichiers .env.resolved.* temporaires
	@echo "$(YELLOW)Nettoyage des fichiers .env.resolved...$(NC)"
	@rm -f .env.resolved.*
	@echo "$(GREEN)✓ Fichiers .env.resolved.* supprimés$(NC)"

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
	@echo ""
	@echo "$(YELLOW)6. Gestion des Key Vaults:$(NC)"
	@echo "   make keyvault-status"
	@echo "   make keyvault-secrets"
	@echo "   make keyvault-validate ENV=dev"
	@echo "   make keyvault-resolve ENV=cotechnoe"
