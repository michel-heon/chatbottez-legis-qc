#!/bin/bash
set -euo pipefail

APP_APPID="04b07795-8ddb-461a-bbee-02f9e1bf7b46"   # Azure CLI app id
GRAPH_APPID="00000003-0000-0000-c000-000000000000" # Microsoft Graph

# Delegated scopes => ID ; les app permissions s'appuient sur les mêmes GUID
MAIL_SEND_SCOPE="E383F46E-2787-4529-855E-0E479A3A59F8"      # Mail.Send
USER_RW_SCOPE="741f803b-c850-494e-b5df-cde7c675a1ca"        # User.ReadWrite.All

# App role (application permission) ID pour User.ReadWrite.All
default_APPROLE_USER_RW="078d6b6c-3cf2-4c81-9c8a-dcfd29f5d8e3"

log() { printf '%b
' "$1"; }

if ! command -v az >/dev/null 2>&1; then
  log "\033[0;31maz CLI requis\033[0m"
  exit 1
fi

declare -a PERMISSIONS=("${MAIL_SEND_SCOPE}=Scope" "${USER_RW_SCOPE}=Scope")

declare -a ADMIN_CONSENT_PERMS=()
ADMIN_CONSENT_PERMS+=("${MAIL_SEND_SCOPE}=Scope")
ADMIN_CONSENT_PERMS+=("${USER_RW_SCOPE}=Scope")
ADMIN_CONSENT_PERMS+=("${default_APPROLE_USER_RW}=Role")

log "\033[1;33mRecherche du service principal Azure CLI...\033[0m"
CLI_SP_ID=$(az ad sp list --filter "appId eq '$APP_APPID'" --query '[0].id' -o tsv || true)
if [ -z "$CLI_SP_ID" ]; then
  log "\033[1;33mService principal introuvable, création...\033[0m"
  CLI_SP_ID=$(az ad sp create --id "$APP_APPID" --query 'id' -o tsv)
fi

log "\033[1;33mRécupération du service principal Microsoft Graph...\033[0m"
GRAPH_SP_ID=$(az ad sp list --filter "appId eq '$GRAPH_APPID'" --query '[0].id' -o tsv)
if [ -z "$GRAPH_SP_ID" ]; then
  log "\033[0;31mImpossible de trouver le service principal Microsoft Graph\033[0m"
  exit 1
fi

log "\033[1;33mAjout des permissions déléguées/app...\033[0m"
for perm in "${PERMISSIONS[@]}"; do
  az ad app permission add --id "$APP_APPID" --api "$GRAPH_APPID" --api-permissions "$perm" >/dev/null 2>&1 || \
    log "\033[1;33mPermission $perm déjà présente ou erreur ignorée.\033[0m"
done

log "\033[1;33mTentative d'accorder le consentement administrateur...\033[0m"
if az ad app permission admin-consent --id "$APP_APPID" >/dev/null 2>&1; then
  log "\033[0;32mConsentement accordé pour les permissions: Mail.Send, User.ReadWrite.All\033[0m"
else
  log "\033[0;31mImpossible d'accorder le consentement via CLI.\033[0m"
  log "\033[1;33mVeuillez l'accorder manuellement dans Azure AD : Applications d'entreprise → Microsoft Azure CLI → Permissions → 'Accorder le consentement administrateur'.\033[0m"
  exit 2
fi
