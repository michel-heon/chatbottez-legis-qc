#!/usr/bin/env bash
set -euo pipefail

ENV_NAME=${1:-local}
ENV_FILE="env/.env.${ENV_NAME}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[open-teams-firefox] Fichier $ENV_FILE introuvable" >&2
  exit 1
fi

TEAMS_APP_ID=$(grep -E '^TEAMS_APP_ID=' "$ENV_FILE" | tail -n 1 | cut -d'=' -f2- | tr -d '\r')
if [[ -z "${TEAMS_APP_ID}" ]]; then
  echo "[open-teams-firefox] Variable TEAMS_APP_ID absente dans $ENV_FILE" >&2
  exit 1
fi

TEAMSFX_ENV=$(grep -E '^TEAMSFX_ENV=' "$ENV_FILE" | tail -n 1 | cut -d'=' -f2- | tr -d '\r')
DEEP_LINK="906f208d-595f-4614-80f4-2d362e13c6df"
URL="https://teams.microsoft.com/v2/#/l/app/${TEAMS_APP_ID}?installAppPackage=true&webjoin=true&deeplinkId=${DEEP_LINK}"

if command -v firefox >/dev/null 2>&1; then
  echo "[open-teams-firefox] Ouverture de Teams (env=${TEAMSFX_ENV:-$ENV_NAME}) dans Firefox..."
  firefox "$URL" &
else
  echo "[open-teams-firefox] Firefox introuvable dans PATH. URL à ouvrir manuellement :"
  echo "  $URL"
fi
