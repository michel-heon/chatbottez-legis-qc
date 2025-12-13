# Makefile - Microsoft 365 Agents Playground Studio
# Gestion simplifiee de l'environnement de test Playground

.PHONY: help start stop restart logs clean validate deploy status ports kill-ports

# Configuration
PORT_APP := 3978
PORT_DEBUG := 9239
PORT_PLAYGROUND := 56150

##@ Commandes Principales

help: ## Affiche cette aide
	@echo ""
	@echo "============================================================"
	@echo "  Microsoft 365 Agents Playground Studio - Makefile"
	@echo "============================================================"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make <target>\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  %-18s %s\n", $$1, $$2 } /^##@/ { printf "\n%s\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""

start: validate ## Demarre l'environnement Playground complet
	@echo "[START] Demarrage du Playground..."
	@$(MAKE) -s deploy
	@$(MAKE) -s start-app &
	@sleep 3
	@$(MAKE) -s start-playground &
	@echo "[OK] Playground demarre!"
	@echo ""
	@echo "[INFO] Services actifs:"
	@echo "   - Application: http://localhost:$(PORT_APP)"
	@echo "   - Debug: http://localhost:$(PORT_DEBUG)"
	@echo "   - Playground: http://localhost:$(PORT_PLAYGROUND)"
	@echo ""
	@echo "[TIP] Commandes utiles:"
	@echo "   make logs      - Voir les logs en temps reel"
	@echo "   make status    - Verifier l'etat des services"
	@echo "   make stop      - Arreter tous les services"

stop: ## Arrete tous les services Playground
	@echo "[STOP] Arret des services..."
	@powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $$_.MainWindowTitle -match 'dev:teamsfx' } | Stop-Process -Force" 2>nul || echo ""
	@powershell -Command "Get-NetTCPConnection -LocalPort $(PORT_APP) -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $$_ -Force -ErrorAction SilentlyContinue }" 2>nul || echo ""
	@powershell -Command "Get-NetTCPConnection -LocalPort $(PORT_DEBUG) -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $$_ -Force -ErrorAction SilentlyContinue }" 2>nul || echo ""
	@powershell -Command "Get-NetTCPConnection -LocalPort $(PORT_PLAYGROUND) -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $$_ -Force -ErrorAction SilentlyContinue }" 2>nul || echo ""
	@timeout /t 1 /nobreak >nul 2>&1 || sleep 1
	@echo "[OK] Services arretes"

restart: ## Redemarre l'environnement Playground
	@echo "[RESTART] Redemarrage..."
	@$(MAKE) -s stop
	@sleep 2
	@$(MAKE) -s start

##@ Services Individuels

start-app: ## Demarre uniquement l'application agent
	@echo "[START] Demarrage de l'application..."
	@cd .. && npm run dev:teamsfx:playground

start-playground: ## Demarre uniquement le Playground UI
	@echo "[START] Demarrage du Playground UI..."
	@cd .. && set PATH=devTools/playground/node_modules/.bin;%PATH% && npm run dev:teamsfx:launch-playground

##@ Validation et Deploiement

validate: ## Valide les prerequis (Node.js, ports)
	@echo "[CHECK] Validation des prerequis..."
	@command -v node >/dev/null 2>&1 || { echo "[ERROR] Node.js non installe"; exit 1; }
	@echo "[OK] Node.js: $$(node --version)"
	@command -v npm >/dev/null 2>&1 || { echo "[ERROR] npm non installe"; exit 1; }
	@echo "[OK] npm: $$(npm --version)"
	@cd .. && test -f package.json || { echo "[ERROR] package.json introuvable"; exit 1; }
	@echo "[OK] Workspace valide"
	@$(MAKE) -s check-ports

check-ports: ## Verifie la disponibilite des ports
	@echo "[CHECK] Verification des ports..."
	@powershell -Command "if (Get-NetTCPConnection -LocalPort $(PORT_APP) -ErrorAction SilentlyContinue) { Write-Host '[WARN] Port $(PORT_APP) deja utilise' } else { Write-Host '[OK] Port $(PORT_APP) disponible' }"
	@powershell -Command "if (Get-NetTCPConnection -LocalPort $(PORT_DEBUG) -ErrorAction SilentlyContinue) { Write-Host '[WARN] Port $(PORT_DEBUG) deja utilise' } else { Write-Host '[OK] Port $(PORT_DEBUG) disponible' }"
	@powershell -Command "if (Get-NetTCPConnection -LocalPort $(PORT_PLAYGROUND) -ErrorAction SilentlyContinue) { Write-Host '[WARN] Port $(PORT_PLAYGROUND) deja utilise' } else { Write-Host '[OK] Port $(PORT_PLAYGROUND) disponible' }"

kill-ports: ## Force l'arret des processus sur les ports
	@echo "[KILL] Liberation des ports..."
	@powershell -ExecutionPolicy Bypass -File ../scripts/kill-ports.ps1 >nul 2>&1 || echo ""
	@echo "[OK] Ports liberes"

deploy: ## Deploie les ressources Playground
	@echo "[DEPLOY] Deploiement Playground..."
	@echo "[INFO] Teamsfx n'est plus disponible - skipped"
	@echo "[OK] Deploiement termine"

##@ Monitoring et Logs

status: ## Affiche l'etat des services
	@echo "[STATUS] Etat des services:"
	@echo ""
	@echo "Application Agent (port $(PORT_APP)):"
	@powershell -Command "if (Get-NetTCPConnection -LocalPort $(PORT_APP) -ErrorAction SilentlyContinue) { Write-Host '   [OK] Running' } else { Write-Host '   [STOP] Stopped' }"
	@echo ""
	@echo "Debug Server (port $(PORT_DEBUG)):"
	@powershell -Command "if (Get-NetTCPConnection -LocalPort $(PORT_DEBUG) -ErrorAction SilentlyContinue) { Write-Host '   [OK] Running' } else { Write-Host '   [STOP] Stopped' }"
	@echo ""
	@echo "Playground UI (port $(PORT_PLAYGROUND)):"
	@powershell -Command "if (Get-NetTCPConnection -LocalPort $(PORT_PLAYGROUND) -ErrorAction SilentlyContinue) { Write-Host '   [OK] Running' } else { Write-Host '   [STOP] Stopped' }"
	@echo ""

logs: ## Affiche les logs en temps reel
	@echo "[LOG] Logs des services..."
	@echo "[INFO] Appuyez sur Ctrl+C pour arreter"
	@tail -f ../logs/*.log 2>/dev/null || echo "[ERROR] Aucun fichier de log trouve"

ports: ## Liste tous les processus sur les ports
	@echo "[PORT] Processus actifs:"
	@for port in $(PORT_APP) $(PORT_DEBUG) $(PORT_PLAYGROUND); do \
		echo ""; \
		echo "Port $$port:"; \
		lsof -i:$$port 2>/dev/null || echo "   Aucun processus"; \
	done

test-connection: ## Teste la connexion aux services
	@echo "[TEST] Test de connexion..."
	@echo ""
	@echo "Application (port $(PORT_APP)):"
	@curl -s -o /dev/null -w "   Status: %{http_code}\n" http://localhost:$(PORT_APP)/health || echo "   [ERROR] Non accessible"
	@echo ""
	@echo "Playground UI (port $(PORT_PLAYGROUND)):"
	@curl -s -o /dev/null -w "   Status: %{http_code}\n" http://localhost:$(PORT_PLAYGROUND) || echo "   [ERROR] Non accessible"

##@ Nettoyage

clean: ## Nettoie les fichiers temporaires et logs
	@echo "[CLEAN] Nettoyage..."
	@rm -rf ../logs/*.log 2>/dev/null || true
	@rm -rf ../.localConfigs.playground.cache 2>/dev/null || true
	@echo "[OK] Nettoyage termine"

clean-all: clean ## Nettoyage complet (inclut node_modules playground)
	@echo "[CLEAN] Nettoyage complet..."
	@rm -rf ../devTools/playground/node_modules 2>/dev/null || true
	@echo "[OK] Nettoyage complet termine"

reset: stop clean-all ## Reset complet de l'environnement
	@echo "[RESET] Reset de l'environnement..."
	@echo "[OK] Environnement reinitialise"

##@ Tests

quick: ## Demarrage rapide sans validation
	@echo "[QUICK] Demarrage rapide..."
	@$(MAKE) -s deploy
	@$(MAKE) -s start-app &
	@$(MAKE) -s start-playground &
	@echo "[OK] Services demarres"

##@ Information

info: ## Affiche la configuration
	@echo "[INFO] Configuration:"
	@echo "   PORT_APP:        $(PORT_APP)"
	@echo "   PORT_DEBUG:      $(PORT_DEBUG)"
	@echo "   PORT_PLAYGROUND: $(PORT_PLAYGROUND)"
	@echo "   Node.js:         $$(node --version 2>/dev/null || echo 'Non installe')"
	@echo "   npm:             $$(npm --version 2>/dev/null || echo 'Non installe')"

version: ## Affiche les versions
	@echo "[VERSION] Versions installes:"
	@echo "   Node.js: $$(node --version 2>/dev/null || echo 'Non installe')"
	@echo "   npm:     $$(npm --version 2>/dev/null || echo 'Non installe')"
	@cd .. && echo "   Workspace: $$(pwd)"

.DEFAULT_GOAL := help
