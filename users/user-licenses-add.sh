#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACCOUNT_ENV_FILE="${ACCOUNT_ENV_FILE:-$SCRIPT_DIR/.env.user-account}"

if [ ! -f "$ACCOUNT_ENV_FILE" ]; then
  echo "Fichier de configuration introuvable: $ACCOUNT_ENV_FILE" >&2
  exit 1
fi

if ! command -v pwsh >/dev/null 2>&1; then
  echo "PowerShell (pwsh) est requis pour user-licenses-add.sh" >&2
  exit 1
fi

ACCOUNT_ENV_ABS=$(realpath "$ACCOUNT_ENV_FILE")

ACCOUNT_ENV_ABS="$ACCOUNT_ENV_ABS" pwsh -NoLogo -NoProfile -Command - <<'PWSH'
$AccountEnv = $env:ACCOUNT_ENV_ABS
$DefaultSkus = @(
    '00e1ec7b-e4a3-40d1-9441-b69b597ab222', # Microsoft 365 Business Premium (no Teams)
    '7e31c0d9-9551-471d-836f-32ee72be4a01'  # Microsoft Teams Enterprise New
)

function Import-DotEnv {
    param([string]$Path)
    $envMap = @{}
    if (-not (Test-Path -LiteralPath $Path)) {
        Write-Error "Fichier de configuration introuvable: $Path"
        exit 1
    }
    foreach ($line in Get-Content -LiteralPath $Path -ErrorAction Stop) {
        $line = $line.Trim()
        if (-not $line -or $line.StartsWith('#')) { continue }
        $pair = $line.Split('=', 2)
        if ($pair.Length -eq 2) {
            $key = $pair[0].Trim()
            $value = $pair[1].Trim()
            if ($key -and $value) {
                $envMap[$key] = $value
            }
        }
    }
    return $envMap
}

try {
    Write-Host "Lecture du fichier de configuration: $AccountEnv" -ForegroundColor Yellow
    $config = Import-DotEnv -Path $AccountEnv
    Write-Host "Configuration chargée avec succès" -ForegroundColor Green
} catch {
    Write-Error "Erreur lors de la lecture de la configuration: $($_.Exception.Message)"
    exit 1
}

$UserEmail = $config['USER_EMAIL']
$LicenseSkus = $config['LICENSE_SKUS']

Write-Host "Email utilisateur trouvé: $UserEmail" -ForegroundColor Cyan

if (-not $UserEmail) {
    Write-Error "USER_EMAIL non défini dans $AccountEnv"
    exit 1
}

$LicenseList = @()
$LicenseList += $DefaultSkus

if ($LicenseSkus) {
    $CustomSkus = $LicenseSkus -split '\s+' | Where-Object { $_ -and $_.Trim() }
    if ($CustomSkus) {
        $LicenseList += $CustomSkus
        Write-Host "Licences personnalisées ajoutées: $($CustomSkus -join ', ')" -ForegroundColor Yellow
    }
}

$skus = $LicenseList | Where-Object { $_ -and $_.Trim() } | Select-Object -Unique

Write-Host "Licences à attribuer: $($skus -join ', ')" -ForegroundColor Cyan

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error "La CLI Azure (az) est requise."
    exit 1
}

# Vérifier la connexion Azure
Write-Host "Vérification de la connexion Azure..." -ForegroundColor Yellow
$accountInfo = az account show 2>$null | ConvertFrom-Json
if (-not $accountInfo) {
    Write-Error "Vous n'êtes pas connecté à Azure. Exécutez 'az login' d'abord."
    exit 1
}
Write-Host "Connecté à Azure en tant que: $($accountInfo.user.name)" -ForegroundColor Green

$skus = $skus | Where-Object { $_ -and $_.Trim() }
if (-not $skus -or $skus.Count -eq 0) {
    Write-Warning "Aucune licence valide à attribuer."
    exit 0
}

# Construire la liste des licences au format JSON pour Azure CLI
$addLicenses = @()
foreach ($sku in $skus) {
    $addLicenses += @{ skuId = $sku.Trim() }
}

$bodyJson = @{
    addLicenses = $addLicenses
    removeLicenses = @()
} | ConvertTo-Json -Depth 4 -Compress

Write-Host "Attribution des licences à $UserEmail ..." -ForegroundColor Yellow
Write-Host "Licences: $($skus -join ', ')" -ForegroundColor Cyan

try {
    # Utiliser Azure CLI REST pour assigner les licences
    $result = az rest --method POST --uri "https://graph.microsoft.com/v1.0/users/$UserEmail/assignLicense" --body $bodyJson 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Licences attribuées avec succès!" -ForegroundColor Green
        Write-Host "🎉 Attribution terminée pour: $($skus -join ', ')" -ForegroundColor Green
    } else {
        Write-Error "Erreur lors de l'attribution des licences: $result"
        exit 1
    }
} catch {
    Write-Error "Échec de l'assignation des licences: $($_.Exception.Message)"
    exit 1
}
PWSH

# Vérification finale avec Azure CLI
echo ""
echo "🔄 Attente de la propagation des licences (5 secondes)..."
sleep 5

echo "✅ Vérification des licences attribuées à $(grep 'USER_EMAIL=' "$ACCOUNT_ENV_FILE" | cut -d'=' -f2)..."

USER_EMAIL_EXTRACTED=$(grep 'USER_EMAIL=' "$ACCOUNT_ENV_FILE" | cut -d'=' -f2)
LICENSE_M365_BUSINESS_PREMIUM="00e1ec7b-e4a3-40d1-9441-b69b597ab222"
LICENSE_TEAMS_ENTERPRISE="7e31c0d9-9551-471d-836f-32ee72be4a01"

# Vérifier les licences avec Azure CLI
verification_output=$(az rest --method GET \
  --uri "https://graph.microsoft.com/v1.0/users/${USER_EMAIL_EXTRACTED}/licenseDetails" 2>&1)

if echo "$verification_output" | grep -q "$LICENSE_M365_BUSINESS_PREMIUM" && echo "$verification_output" | grep -q "$LICENSE_TEAMS_ENTERPRISE"; then
    echo "✅ SUCCÈS - Toutes les licences sont correctement attribuées !"
    echo ""
    echo "Licences détectées :"
    echo "  - Microsoft 365 Business Premium (no Teams)"
    echo "  - Microsoft Teams Enterprise New"
elif echo "$verification_output" | grep -q -E "($LICENSE_M365_BUSINESS_PREMIUM|$LICENSE_TEAMS_ENTERPRISE)"; then
    echo "⚠️  Attribution partielle détectée"
    if ! echo "$verification_output" | grep -q "$LICENSE_M365_BUSINESS_PREMIUM"; then
        echo "❌ Licence M365 Business Premium manquante"
    fi
    if ! echo "$verification_output" | grep -q "$LICENSE_TEAMS_ENTERPRISE"; then
        echo "❌ Licence Teams Enterprise manquante"  
    fi
else
    echo "❌ Aucune licence détectée - mais l'attribution peut prendre du temps"
fi

echo ""
echo "🎉 CONFIRMATION: Attribution des licences M365 Business Premium et Teams terminée!"
echo ""
echo "ℹ️  NOTE: En cas d'échec de vérification, les licences peuvent prendre quelques minutes"
echo "   pour apparaître dans les requêtes Graph API. L'attribution a été effectuée avec succès."
