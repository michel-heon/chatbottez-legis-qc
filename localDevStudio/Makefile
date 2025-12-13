# Makefile - Local Dev Studio
# Commandes pour tester l'agent en environnement local avec Dev Tunnel

.PHONY: help start-tunnel start-app test-endpoint build-package open-teams start-all stop status clean

# Variables
PROJECT_ROOT := ..
ENV_FILE := $(PROJECT_ROOT)/env/.env.local
PACKAGE_FILE := $(PROJECT_ROOT)/appPackage/build/appPackage.local.zip

help:
	@echo "Commandes disponibles:"
	@echo "  make start-all       - Demarrer tunnel + application"
	@echo "  make start-tunnel    - Demarrer Dev Tunnel uniquement"
	@echo "  make start-app       - Demarrer application uniquement"
	@echo "  make test-endpoint   - Tester accessibilite du bot"
	@echo "  make build-package   - Construire package Teams"
	@echo "  make open-teams      - Ouvrir Teams Desktop avec l'app"
	@echo "  make status          - Verifier l'etat des services"
	@echo "  make stop            - Arreter les services"
	@echo "  make clean           - Nettoyer les fichiers temporaires"

start-tunnel:
	@echo "Demarrage du Dev Tunnel..."
	@cd $(PROJECT_ROOT) && devtunnel host -p 3978 --allow-anonymous

start-app:
	@echo "Demarrage de l'application..."
	@cd $(PROJECT_ROOT) && npm run dev:teamsfx

start-all:
	@echo "Demarrage complet (tunnel + application)..."
	@echo "1. Demarrer le tunnel dans un terminal separe"
	@echo "2. Demarrer l'application dans un autre terminal"
	@echo ""
	@echo "Terminal 1: make start-tunnel"
	@echo "Terminal 2: make start-app"

test-endpoint:
	@echo "Test de l'endpoint /api/messages..."
	@if [ -f "$(ENV_FILE)" ]; then \
		ENDPOINT=$$(grep BOT_ENDPOINT $(ENV_FILE) | cut -d'=' -f2); \
		echo "URL: $$ENDPOINT/api/messages"; \
		curl -i $$ENDPOINT/api/messages; \
	else \
		echo "Erreur: Fichier .env.local non trouve"; \
		exit 1; \
	fi

build-package:
	@echo "Construction du package Teams..."
	@cd $(PROJECT_ROOT) && npm run build
	@if [ -f "$(PACKAGE_FILE)" ]; then \
		echo "Package cree: $(PACKAGE_FILE)"; \
		ls -lh $(PACKAGE_FILE); \
	else \
		echo "Erreur: Package non cree"; \
		exit 1; \
	fi

open-teams:
	@echo "Ouverture de Teams dans Edge..."
	@if [ -f "$(ENV_FILE)" ]; then \
		APP_ID=$$(grep TEAMS_APP_ID $(ENV_FILE) | cut -d'=' -f2); \
		echo "App ID: $$APP_ID"; \
		start msedge "https://teams.microsoft.com/l/app/$$APP_ID?installAppPackage=true"; \
	else \
		echo "Erreur: Fichier .env.local non trouve"; \
		exit 1; \
	fi

status:
	@echo "Verification de l'etat des services..."
	@echo ""
	@echo "1. Variables d'environnement:"
	@if [ -f "$(ENV_FILE)" ]; then \
		grep -E "BOT_ENDPOINT|BOT_DOMAIN|TEAMS_APP_ID" $(ENV_FILE); \
	else \
		echo "   Fichier .env.local non trouve"; \
	fi
	@echo ""
	@echo "2. Application (port 3978):"
	@curl -s http://localhost:3978/api/messages > /dev/null 2>&1 && echo "   Application active" || echo "   Application inactive"
	@echo ""
	@echo "3. Package Teams:"
	@if [ -f "$(PACKAGE_FILE)" ]; then \
		echo "   Package presente: $$(ls -lh $(PACKAGE_FILE) | awk '{print $$5}')"; \
	else \
		echo "   Package non construite"; \
	fi

stop:
	@echo "Arret des services..."
	@echo "Arreter manuellement les processus dans les terminaux actifs"
	@echo "Ou utiliser: pkill -f 'npm run dev:teamsfx'"
	@echo "            pkill -f 'devtunnel'"

clean:
	@echo "Nettoyage des fichiers temporaires..."
	@cd $(PROJECT_ROOT) && rm -rf appPackage/build/*.zip
	@echo "Package Teams supprime"
