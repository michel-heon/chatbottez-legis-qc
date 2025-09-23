# Makefile pour la gestion des environnements
# Usage: cd env && make <target> ENV=<environment>

# Couleurs pour l'affichage
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
BLUE = \033[0;34m
NC = \033[0m # No Color

.PHONY: help init template validate list clean-templates
.DEFAULT_GOAL := help

##@ Aide
help: ## Affiche cette aide
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BLUE)Usage:$(NC)\n  make $(YELLOW)<target>$(NC) ENV=$(YELLOW)<environment>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Gestion des environnements
init: ## Initialise un nouvel environnement à partir du template (ENV requis)
	@if [ -z "$(ENV)" ]; then \
		echo "$(RED)Erreur: ENV requis.$(NC)"; \
		echo "$(YELLOW)Usage: make init ENV=monenv$(NC)"; \
		exit 1; \
	fi
	@if [ -f ".env.$(ENV)" ]; then \
		echo "$(YELLOW)L'environnement $(ENV) existe déjà.$(NC)"; \
		echo "$(BLUE)Fichier: .env.$(ENV)$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f ".env.template" ]; then \
		echo "$(RED)Erreur: Fichier template manquant (.env.template)$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Création de l'environnement $(ENV) à partir du template...$(NC)"
	@cp .env.template .env.$(ENV)
	@echo "$(GREEN)✅ Environnement $(ENV) créé !$(NC)"
	@echo "$(BLUE)📝 Éditez le fichier .env.$(ENV) avec vos valeurs réelles$(NC)"
	@echo "$(BLUE)🔑 N'oubliez pas de configurer vos secrets dans Azure Key Vault$(NC)"

template: ## Recrée le fichier template à partir d'un environnement existant (ENV requis)
	@if [ -z "$(ENV)" ]; then \
		echo "$(RED)Erreur: ENV requis.$(NC)"; \
		echo "$(YELLOW)Usage: make template ENV=monenv$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f ".env.$(ENV)" ]; then \
		echo "$(RED)Erreur: Environnement $(ENV) n'existe pas (.env.$(ENV))$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Création du template à partir de l'environnement $(ENV)...$(NC)"
	@sed -E 's/=([^@<].*)/=<\U&>/' .env.$(ENV) | \
	 sed -E 's/=<([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})>/=<GUID>/' | \
	 sed -E 's/=<https:\/\/[^>]+>/=<URL>/' | \
	 sed -E 's/kv-[a-z0-9-]+/<KV_NAME>/g' | \
	 sed -E 's/=<[A-Z0-9_-]+>/=<PLACEHOLDER>/' > .env.template.new
	@mv .env.template.new .env.template
	@echo "$(GREEN)✅ Template mis à jour depuis l'environnement $(ENV)$(NC)"

validate: ## Valide la configuration d'un environnement (ENV requis)
	@if [ -z "$(ENV)" ]; then \
		echo "$(RED)Erreur: ENV requis.$(NC)"; \
		echo "$(YELLOW)Usage: make validate ENV=monenv$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f ".env.$(ENV)" ]; then \
		echo "$(RED)Erreur: Environnement $(ENV) n'existe pas (.env.$(ENV))$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Validation de l'environnement $(ENV)...$(NC)"
	@placeholders_count=$$(grep -c '<[^>]*>' .env.$(ENV) 2>/dev/null || echo "0"); \
	if [ "$$placeholders_count" -gt 0 ]; then \
		echo "$(RED)❌ $$placeholders_count placeholder(s) non remplacé(s):$(NC)"; \
		grep '<[^>]*>' .env.$(ENV) || true; \
		exit 1; \
	else \
		echo "$(GREEN)✅ Environnement $(ENV) validé - aucun placeholder détecté$(NC)"; \
	fi
	@missing_vars=$$(grep -E '^[A-Z_]+=$$' .env.$(ENV) | wc -l); \
	if [ "$$missing_vars" -gt 0 ]; then \
		echo "$(YELLOW)⚠️  $$missing_vars variable(s) vide(s):$(NC)"; \
		grep -E '^[A-Z_]+=$$' .env.$(ENV) || true; \
	fi

list: ## Liste tous les environnements disponibles
	@echo "$(BLUE)Environnements disponibles:$(NC)"
	@for file in .env.*; do \
		if [ -f "$$file" ] && [ "$$file" != ".env.template" ]; then \
			env_name=$$(echo "$$file" | sed 's/^\.env\.//'); \
			size=$$(wc -l < "$$file" 2>/dev/null || echo "0"); \
			echo "  $(GREEN)$$env_name$(NC) ($$size lignes)"; \
		fi; \
	done
	@if [ -f ".env.template" ]; then \
		echo "  $(YELLOW)template$(NC) (fichier modèle)"; \
	fi

##@ Nettoyage
clean-templates: ## Supprime les fichiers de sauvegarde et temporaires
	@echo "$(YELLOW)Nettoyage des fichiers temporaires...$(NC)"
	@rm -f .env.*.bak .env.*.tmp .env.template.new
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

##@ Information
info: ## Affiche des informations sur la configuration actuelle
	@echo "$(BLUE)Configuration des environnements$(NC)"
	@echo "$(YELLOW)Répertoire:$(NC) $$(pwd)"
	@echo "$(YELLOW)Template:$(NC) $$([ -f '.env.template' ] && echo '✅ Présent' || echo '❌ Manquant')"
	@echo "$(YELLOW)README:$(NC) $$([ -f 'README.md' ] && echo '✅ Présent' || echo '❌ Manquant')"
	@echo ""
	@$(MAKE) list
