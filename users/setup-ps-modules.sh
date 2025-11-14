#!/bin/bash
set -euo pipefail

MODULES=("Microsoft.Graph")

if ! command -v pwsh >/dev/null 2>&1; then
  echo "PowerShell (pwsh) est requis pour installer les modules." >&2
  exit 1
fi

for module in "${MODULES[@]}"; do
  echo "Installation/verification du module $module ..."
  pwsh -NoLogo -NoProfile -Command \
    "if (-not (Get-Module -ListAvailable -Name '$module')) { Install-Module -Name '$module' -Scope CurrentUser -Force -AllowClobber -Repository PSGallery } else { Write-Host 'Module $module déjà présent.' }"
done

echo "Modules PowerShell vérifiés." 
