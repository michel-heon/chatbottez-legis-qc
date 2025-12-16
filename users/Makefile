SHELL := /bin/bash
.SHELLFLAGS := -o pipefail -c
.DEFAULT_GOAL := help

PROJECT_ROOT := $(abspath ..)
USER_EMAIL ?= heon@cotechnoe.com
PASSWORD ?=
FIRST_NAME ?=
LAST_NAME ?=
DISPLAY_NAME ?=
NOTIFICATION_EMAIL ?=
TEMP_PASSWORD ?= TempPassword123!
TENANT_ID ?=
SMTP_ENV_FILE ?= $(PROJECT_ROOT)/users/.smtp.env
ACCOUNT_ENV_FILE ?= $(PROJECT_ROOT)/users/.env.user-account

ifneq (,$(wildcard $(SMTP_ENV_FILE)))
include $(SMTP_ENV_FILE)
endif

ifneq (,$(wildcard $(ACCOUNT_ENV_FILE)))
include $(ACCOUNT_ENV_FILE)
endif

SMTP_SERVER ?= smtp.gmail.com
SMTP_PORT ?= 587
SMTP_USER ?=
SMTP_PASSWORD ?=
SMTP_CONFIG_FILE ?= $(SMTP_ENV_FILE)
EMAIL_TRANSPORT ?= local
EXCHANGE_IDENTITY ?= $(SMTP_USER)
VENVDIR := $(PROJECT_ROOT)/users/venv
PYTHON := python3

PASSWORD_ARG := $(if $(strip $(PASSWORD)),--password "$(PASSWORD)",)

ifeq ($(strip $(PASSWORD)),)
ifneq ($(strip $(TEMP_PASSWORD)),)
PASSWORD := $(TEMP_PASSWORD)
PASSWORD_ARG := --password "$(PASSWORD)"
endif
endif

ifeq ($(strip $(NOTIFICATION_EMAIL)),)
NOTIFICATION_EMAIL := $(USER_EMAIL)
endif

export SMTP_SERVER SMTP_PORT SMTP_USER SMTP_PASSWORD SMTP_CONFIG_FILE EXCHANGE_IDENTITY
export EMAIL_TRANSPORT

.PHONY: help env-setup email-simulate email-test-send email-send email-template-generate email-draft-generate graph-quick-test user-create user-license-assign user-license-assign-legacy user-license-assign-powershell user-mfa-enable user-setup-complete email-forward-enable email-forward-external-enable email-forward-diagnose powershell-modules-install user-onboard smtp-send-test smtp-connection-check smtp-auth-activate graph-mail-consent help-examples project-clean env-clean email-artifacts-clean

help:
	@echo "Usage: make <target> [USER_EMAIL=...] [PASSWORD=...]"
	@echo ""
	@echo "Activation utilisateur (ordre recommandé) :"
	@echo "  1. make user-create                # Crée le compte M365"
	@echo "  2. make user-license-assign        # Attribue Business Premium + Teams"
	@echo "  3. make user-mfa-enable            # Active l'authentification multifacteurs"
	@echo "  4. make email-forward-enable       # Configure le transfert vers NOTIFICATION_EMAIL"
	@echo "  5. make email-send                 # Envoie le courriel de bienvenue"
	@echo ""
	@echo "Variantes pour l'étape 2 :"
	@echo "  user-license-assign-legacy      # Méthode Azure CLI (ancienne)"
	@echo ""
	@echo "Cibles principales :"
	@echo "  user-setup-complete       🚀 WORKFLOW COMPLET : création + licences + MFA + transfert + email"
	@echo "  env-setup                 Prépare l'environnement Python local"
	@echo "  email-simulate            Génère l'email en mode simulation"
	@echo "  email-test-send           Envoi test redirigé vers l'administrateur"
	@echo "  email-template-generate   Génère un brouillon Markdown"
	@echo "  email-draft-generate      Génère un brouillon texte"
	@echo "  email-forward-external-enable  Active le transfert externe côté tenant"
	@echo "  email-forward-diagnose    Diagnostic des blocages de transfert"
	@echo "  smtp-send-test            Test SMTP direct"
	@echo "  smtp-connection-check     Vérifie la connexion SMTP en Python"
	@echo "  smtp-auth-activate        Active SMTP AUTH via Graph"
	@echo "  graph-mail-consent        Consentement Mail.Send / User.ReadWrite.All"
	@echo "  graph-quick-test          Vérifie rapidement l'accès Graph"
	@echo "  powershell-modules-install Installe les modules PowerShell requis"
	@echo "  user-onboard              Enchaîne création utilisateur + email simulé"
	@echo "  help-examples             Affiche des scénarios complets"
	@echo "  project-clean             Nettoie le venv et les artefacts locaux"
	@echo ""
	@echo "Variables utiles : USER_EMAIL, PASSWORD, SMTP_USER, SMTP_PASSWORD, SMTP_CONFIG_FILE"
	@echo "Créez users/.smtp.env pour stocker les identifiants SMTP si nécessaire."

env-setup: $(VENVDIR)/.deps-installed

$(VENVDIR)/.deps-installed:
	@echo "==> Préparation de l'environnement Python local"
	@if [ ! -d "$(VENVDIR)" ]; then \
		cd "$(PROJECT_ROOT)" && $(PYTHON) -m venv "users/venv"; \
	fi
	@cd "$(PROJECT_ROOT)" && . "users/venv/bin/activate" && pip install --quiet --upgrade pip
	@cd "$(PROJECT_ROOT)" && . "users/venv/bin/activate" && pip install --quiet requests azure-cli-core
	@touch "$@"

email-simulate: env-setup
	@echo "==> Simulation d'envoi pour $(USER_EMAIL)"
	@cd "$(PROJECT_ROOT)" && \
		SMTP_SERVER="$(SMTP_SERVER)" \
		SMTP_PORT="$(SMTP_PORT)" \
		SMTP_USER="$(SMTP_USER)" \
		SMTP_PASSWORD="$(SMTP_PASSWORD)" \
		SMTP_CONFIG_FILE="$(SMTP_CONFIG_FILE)" \
		./users/send-email.sh --simulate --user-email "$(USER_EMAIL)" $(PASSWORD_ARG)

email-test-send: env-setup
	@echo "==> Envoi test vers l'administrateur pour $(USER_EMAIL)"
	@cd "$(PROJECT_ROOT)" && \
		SMTP_SERVER="$(SMTP_SERVER)" \
		SMTP_PORT="$(SMTP_PORT)" \
		SMTP_USER="$(SMTP_USER)" \
		SMTP_PASSWORD="$(SMTP_PASSWORD)" \
		SMTP_CONFIG_FILE="$(SMTP_CONFIG_FILE)" \
		./users/send-email.sh --test --user-email "$(USER_EMAIL)" $(PASSWORD_ARG)

email-send: env-setup
	@echo "==> Envoi réel pour $(USER_EMAIL)"
	@cd "$(PROJECT_ROOT)" && \
		SMTP_SERVER="$(SMTP_SERVER)" \
		SMTP_PORT="$(SMTP_PORT)" \
		SMTP_USER="$(SMTP_USER)" \
		SMTP_PASSWORD="$(SMTP_PASSWORD)" \
		SMTP_CONFIG_FILE="$(SMTP_CONFIG_FILE)" \
		./users/send-email.sh --user-email "$(USER_EMAIL)" $(PASSWORD_ARG)

smtp-send-test: env-setup
	@echo "==> Envoi d'un email de test SMTP"
	@if [ "$(EMAIL_TRANSPORT)" = "graph" ] || [ "$(EMAIL_TRANSPORT)" = "local" ]; then \
		echo "Transport actuel: $(EMAIL_TRANSPORT) – test SMTP ignoré"; \
		echo "Utilisez make email-test-send / email-send pour valider la chaîne d'envoi."; \
	else \
		cd "$(PROJECT_ROOT)" && \
			SMTP_SERVER="$(SMTP_SERVER)" \
			SMTP_PORT="$(SMTP_PORT)" \
			SMTP_USER="$(SMTP_USER)" \
			SMTP_PASSWORD="$(SMTP_PASSWORD)" \
			SMTP_CONFIG_FILE="$(SMTP_CONFIG_FILE)" \
			./users/smtp-test.sh; \
	fi

smtp-connection-check: env-setup
	@echo "==> Vérification SMTP via Python"
	@cd "$(PROJECT_ROOT)" && \
		SMTP_SERVER="$(SMTP_SERVER)" \
		SMTP_PORT="$(SMTP_PORT)" \
		SMTP_USER="$(SMTP_USER)" \
		SMTP_PASSWORD="$(SMTP_PASSWORD)" \
		SMTP_CONFIG_FILE="$(SMTP_CONFIG_FILE)" \
		python3 ./users/smtp_check.py

smtp-auth-activate: env-setup
	@echo "==> Activation SMTP AUTH via Microsoft Graph"
	@if ! command -v az >/dev/null; then \
		echo "Erreur: az CLI requis"; exit 1; \
	fi
	@ACCESS_TOKEN=$$(az account get-access-token --resource https://graph.microsoft.com --query accessToken -o tsv 2>/dev/null); \
	if [ -z "$$ACCESS_TOKEN" ]; then \
		echo "Impossible de récupérer un token Graph (az login ? permissions ?)"; exit 1; \
	fi; \
	cd "$(PROJECT_ROOT)" && \
		AZURE_ACCESS_TOKEN="$$ACCESS_TOKEN" \
		SMTP_USER="$(SMTP_USER)" \
		./users/venv/bin/python ./users/smtp_activate.py

graph-mail-consent:
	@echo "==> Consentement Mail.Send / User.ReadWrite.All pour l'application Azure CLI"
	@cd "$(PROJECT_ROOT)" && ./users/az-grant-send.sh

email-template-generate: env-setup
	@echo "==> Génération Markdown via send-email-fixed.sh"
	@cd "$(PROJECT_ROOT)/users" && ./send-email-fixed.sh "$(USER_EMAIL)"

email-draft-generate:
	@echo "==> Génération d'un brouillon texte"
	@cd "$(PROJECT_ROOT)/users" && ./test-email-generation.sh "$(USER_EMAIL)"

graph-quick-test: env-setup
	@echo "==> Quick test Azure Graph"
	@cd "$(PROJECT_ROOT)/users" && ./quick-test.sh

user-create:
	@echo "==> Création de l'utilisateur $(USER_EMAIL)"
	@cd "$(PROJECT_ROOT)/users" && \
		USER_EMAIL="$(USER_EMAIL)" \
		USER_FIRST_NAME="$(FIRST_NAME)" \
		USER_LAST_NAME="$(LAST_NAME)" \
		USER_DISPLAY_NAME="$(DISPLAY_NAME)" \
		NOTIFICATION_EMAIL="$(NOTIFICATION_EMAIL)" \
		USER_TEMP_PASSWORD="$(TEMP_PASSWORD)" \
		TENANT_ID="$(TENANT_ID)" \
		./create-m365-user.sh

user-license-assign:
	@echo "==> Attribution des licences avec PowerShell SDK (méthode recommandée Microsoft)"
	@cd "$(PROJECT_ROOT)/users" && pwsh -File ./user-licenses-assign-powershell.ps1

user-license-assign-legacy:
	@echo "==> Attribution des licences M365 Business Premium et Teams à $(USER_EMAIL) (méthode Azure CLI)"
	@cd "$(PROJECT_ROOT)" && ACCOUNT_ENV_FILE="$(ACCOUNT_ENV_FILE)" ./users/user-licenses-add.sh

user-license-assign-powershell:
	@echo "==> Attribution des licences avec PowerShell SDK (méthode recommandée Microsoft)"
	@cd "$(PROJECT_ROOT)/users" && pwsh -File ./user-licenses-assign-powershell.ps1

user-mfa-enable:
	@echo "==> Activation de l'authentification multifacteurs (MFA) pour $(USER_EMAIL)"
	@cd "$(PROJECT_ROOT)/users" && pwsh -File ./user-mfa-enable.ps1

user-setup-complete:
	@echo "==> Configuration complète pour $(USER_EMAIL) (création + licences + MFA + transfert email)"
	@echo ""
	@echo "==> Étape 1: Création du compte utilisateur M365"
	@$(MAKE) user-create USER_EMAIL="$(USER_EMAIL)"
	@echo ""
	@echo "==> Étape 2: Attribution des licences Business Premium + Teams"
	@$(MAKE) user-license-assign USER_EMAIL="$(USER_EMAIL)"
	@echo ""
	@echo "==> Étape 3: Activation de l'authentification multifacteurs"
	@$(MAKE) user-mfa-enable USER_EMAIL="$(USER_EMAIL)"
	@echo ""
	@echo "==> Étape 4: Configuration du transfert de courriel vers $(NOTIFICATION_EMAIL)"
	@cd "$(PROJECT_ROOT)/users" && \
		./user-email-forward.sh --env "$(ACCOUNT_ENV_FILE)" || { \
		echo ""; \
		echo "⚠️  Le transfert email n'a pas pu être configuré maintenant."; \
		echo "   Relancez 'make email-forward-enable' dans 15-30 minutes."; \
		echo "✅ Configuration des licences terminée avec succès!"; \
		}

email-forward-enable:
	@echo "==> Configuration du transfert de courriel"
	@cd "$(PROJECT_ROOT)/users" && \
		./user-email-forward.sh --env "$(ACCOUNT_ENV_FILE)"

email-forward-external-enable:
	@echo "==> Activation du transfert externe Microsoft 365"
	@cd "$(PROJECT_ROOT)/users" && \
		./enable-external-forwarding.sh

email-forward-diagnose:
	@echo "==> Diagnostic avancé des problèmes de transfert"
	@cd "$(PROJECT_ROOT)/users" && \
		./diagnose-forwarding-advanced.sh

powershell-modules-install:
	@echo "==> Installation des modules PowerShell requis"
	@cd "$(PROJECT_ROOT)" && ./users/setup-ps-modules.sh

user-onboard: env-setup
	@echo "==> Onboarding complet pour $(USER_EMAIL)"
	@$(MAKE) user-create USER_EMAIL="$(USER_EMAIL)"
	@$(MAKE) email-simulate USER_EMAIL="$(USER_EMAIL)" PASSWORD="$(PASSWORD)"

help-examples:
	@echo "### Exemples d'utilisation ###"
	@echo "Depuis la racine du projet ($(PROJECT_ROOT)) :"
	@echo ""
	@echo "  🚀 WORKFLOW COMPLET - Tout automatique :"
	@echo "  make -C users user-setup-complete USER_EMAIL=nouvel.utilisateur@cotechnoe.ca PASSWORD='TempPassword123!'"
	@echo "    → Crée le compte + assigne licences + active MFA + configure transfert + envoie email"
	@echo ""
	@echo "  # Simulation sans envoi"
	@echo "  make -C users email-simulate USER_EMAIL=$(USER_EMAIL)"
	@echo ""
	@echo "  # Envoi de test vers l'administrateur"
	@echo "  make -C users email-test-send USER_EMAIL=$(USER_EMAIL) PASSWORD='TempPassword123!'"
	@echo ""
	@echo "  # Envoi réel après az login"
	@echo "  make -C users email-send USER_EMAIL=$(USER_EMAIL) PASSWORD='TempPassword123!'"
	@echo ""
	@echo "  # Générer un brouillon Markdown"
	@echo "  make -C users email-template-generate USER_EMAIL=$(USER_EMAIL)"
	@echo ""
	@echo "  # Onboarding complet (création + email simulé)"
	@echo "  make -C users user-onboard USER_EMAIL=$(USER_EMAIL) PASSWORD='TempPassword123!'"
	@echo ""
	@echo "Depuis le dossier users/ directement :"
	@echo "  make user-setup-complete USER_EMAIL=nouvel.utilisateur@cotechnoe.ca PASSWORD='TempPassword123!'"
	@echo "  make email-simulate USER_EMAIL=$(USER_EMAIL)"
	@echo "  make email-test-send USER_EMAIL=$(USER_EMAIL) PASSWORD='TempPassword123!'"
	@echo "  make email-send USER_EMAIL=$(USER_EMAIL) PASSWORD='TempPassword123!'"
	@echo "  make email-template-generate USER_EMAIL=$(USER_EMAIL)"
	@echo "  make user-onboard USER_EMAIL=$(USER_EMAIL) PASSWORD='TempPassword123!'"

project-clean: env-clean email-artifacts-clean

env-clean:
	@echo "==> Suppression du venv local"
	@rm -rf "$(VENVDIR)" "$(VENVDIR)/.deps-installed"

email-artifacts-clean:
	@echo "==> Nettoyage des emails générés"
	@rm -f email-generated-*.txt
