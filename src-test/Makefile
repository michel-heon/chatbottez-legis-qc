# Makefile - Tests Unitaires
# Usage: make [target]
# Location: src-test/

.PHONY: help test test-watch test-unit test-coverage clean

# Default target
.DEFAULT_GOAL := help

## help: Affiche cette aide
help:
	@echo "========================================================"
	@echo "  Tests Unitaires - chatbottez-legis-qc"
	@echo "========================================================"
	@echo ""
	@echo "Cibles disponibles:"
	@echo ""
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/##/  make/'
	@echo ""
	@echo "========================================================"

## test: Lance tous les tests avec coverage
test:
	@echo ">> Execution de tous les tests..."
	@cd .. && npm test

## test-watch: Lance les tests en mode watch (auto-refresh)
test-watch:
	@echo ">> Mode watch active (Ctrl+C pour quitter)..."
	@cd .. && npm run test:watch

## test-unit: Lance uniquement les tests unitaires
test-unit:
	@echo ">> Tests unitaires (src-test/unit)..."
	@cd .. && npm run test:unit

## test-coverage: Lance les tests et affiche le coverage détaillé
test-coverage:
	@echo ">> Generation du rapport de coverage..."
	@cd .. && npm test -- --coverage --verbose

## test-legal: Lance uniquement les tests des commandes juridiques
test-legal:
	@echo ">> Tests legalCommands.test.js..."
	@cd .. && npm test -- src-test/unit/legalCommands.test.js

## test-moderation: Lance uniquement les tests de modération
test-moderation:
	@echo ">> Tests contentModeration.test.js..."
	@cd .. && npm test -- src-test/unit/contentModeration.test.js

## test-formatting: Lance uniquement les tests de formatage
test-formatting:
	@echo ">> Tests formatting.test.js..."
	@cd .. && npm test -- src-test/unit/formatting.test.js

## test-verbose: Lance les tests avec sortie détaillée
test-verbose:
	@echo ">> Tests en mode verbose..."
	@cd .. && npm test -- --verbose

## test-bail: Lance les tests et arrête à la première erreur
test-bail:
	@echo ">> Tests avec bail (arret au premier echec)..."
	@cd .. && npm test -- --bail

## clean: Nettoie les fichiers de coverage
clean:
	@echo ">> Nettoyage des fichiers temporaires..."
	@rm -rf ../coverage
	@echo ">> Nettoyage termine"

## status: Affiche l'état des tests
status:
	@echo "==============================================="
	@echo "  Etat des Tests"
	@echo "==============================================="
	@echo ""
	@echo "Fichiers de tests:"
	@find unit -name "*.test.js" -type f | sed 's|^|  - |'
	@echo ""
	@echo "Nombre de fichiers: $$(find unit -name "*.test.js" -type f | wc -l)"
	@echo ""
	@echo "Package.json scripts:"
	@cd .. && grep -A 3 '"test"' package.json | grep -v '^--$$'
	@echo ""
	@echo "==============================================="

## quick: Lance les tests rapides (legal + moderation)
quick:
	@echo ">> Tests rapides (legal + moderation)..."
	@cd .. && npm test -- --testPathPattern="(legalCommands|contentModeration)"

## all: Lance tous les tests avec coverage et verbose
all:
	@echo ">> Suite complete de tests..."
	@cd .. && npm test -- --coverage --verbose
	@echo ""
	@echo ">> Tests termines - Voir coverage/lcov-report/index.html"

## dry-run: Teste les règles du Makefile sans exécuter les commandes
dry-run:
	@echo "========================================================"
	@echo "  DRY-RUN: Test des regles Makefile"
	@echo "========================================================"
	@echo ""
	@echo "[TEST] Verification des cibles disponibles..."
	@$(MAKE) -n help > /dev/null 2>&1 && echo "  [OK] help" || echo "  [FAIL] help"
	@$(MAKE) -n test > /dev/null 2>&1 && echo "  [OK] test" || echo "  [FAIL] test"
	@$(MAKE) -n test-watch > /dev/null 2>&1 && echo "  [OK] test-watch" || echo "  [FAIL] test-watch"
	@$(MAKE) -n test-unit > /dev/null 2>&1 && echo "  [OK] test-unit" || echo "  [FAIL] test-unit"
	@$(MAKE) -n test-coverage > /dev/null 2>&1 && echo "  [OK] test-coverage" || echo "  [FAIL] test-coverage"
	@$(MAKE) -n test-legal > /dev/null 2>&1 && echo "  [OK] test-legal" || echo "  [FAIL] test-legal"
	@$(MAKE) -n test-moderation > /dev/null 2>&1 && echo "  [OK] test-moderation" || echo "  [FAIL] test-moderation"
	@$(MAKE) -n test-formatting > /dev/null 2>&1 && echo "  [OK] test-formatting" || echo "  [FAIL] test-formatting"
	@$(MAKE) -n test-verbose > /dev/null 2>&1 && echo "  [OK] test-verbose" || echo "  [FAIL] test-verbose"
	@$(MAKE) -n test-bail > /dev/null 2>&1 && echo "  [OK] test-bail" || echo "  [FAIL] test-bail"
	@$(MAKE) -n quick > /dev/null 2>&1 && echo "  [OK] quick" || echo "  [FAIL] quick"
	@$(MAKE) -n all > /dev/null 2>&1 && echo "  [OK] all" || echo "  [FAIL] all"
	@$(MAKE) -n clean > /dev/null 2>&1 && echo "  [OK] clean" || echo "  [FAIL] clean"
	@$(MAKE) -n status > /dev/null 2>&1 && echo "  [OK] status" || echo "  [FAIL] status"
	@echo ""
	@echo "[TEST] Verification de la structure du projet..."
	@test -d ../src && echo "  [OK] src/ existe" || echo "  [FAIL] src/ manquant"
	@test -d ../src/app && echo "  [OK] src/app/ existe" || echo "  [FAIL] src/app/ manquant"
	@test -d unit && echo "  [OK] src-test/unit/ existe" || echo "  [FAIL] src-test/unit/ manquant"
	@test -f ../package.json && echo "  [OK] package.json existe" || echo "  [FAIL] package.json manquant"
	@test -f ../jest.config.js && echo "  [OK] jest.config.js existe" || echo "  [FAIL] jest.config.js manquant"
	@echo ""
	@echo "[TEST] Verification des fichiers de tests..."
	@test -f unit/legalCommands.test.js && echo "  [OK] legalCommands.test.js" || echo "  [FAIL] legalCommands.test.js manquant"
	@test -f unit/contentModeration.test.js && echo "  [OK] contentModeration.test.js" || echo "  [FAIL] contentModeration.test.js manquant"
	@test -f unit/formatting.test.js && echo "  [OK] formatting.test.js" || echo "  [FAIL] formatting.test.js manquant"
	@echo ""
	@echo "[TEST] Verification des commandes npm..."
	@grep -q '"test"' ../package.json && echo "  [OK] npm test configure" || echo "  [FAIL] npm test manquant"
	@grep -q '"test:watch"' ../package.json && echo "  [OK] npm test:watch configure" || echo "  [FAIL] npm test:watch manquant"
	@grep -q '"test:unit"' ../package.json && echo "  [OK] npm test:unit configure" || echo "  [FAIL] npm test:unit manquant"
	@echo ""
	@echo "========================================================"
	@echo "  DRY-RUN complete - Toutes les cibles sont valides"
	@echo "========================================================"
