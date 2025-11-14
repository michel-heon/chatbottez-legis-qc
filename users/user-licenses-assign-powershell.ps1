#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Attribution des licences Microsoft 365 selon les meilleures pratiques Microsoft
.DESCRIPTION
    Utilise Microsoft Graph PowerShell SDK pour attribuer les licences de façon fiable.
    Basé sur la documentation officielle Microsoft Learn.
.PARAMETER UserEmail
    Email de l'utilisateur (optionnel, lu depuis .env.user-account si non spécifié)
.EXAMPLE
    ./user-licenses-assign-powershell.ps1 -UserEmail user.sample@cotechnoe.com
#>

param(
    [string]$UserEmail
)

# Configuration des couleurs pour l'affichage
$Host.UI.RawUI.ForegroundColor = "White"

# Chemin du fichier de configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AccountEnvFile = Join-Path $ScriptDir ".env.user-account"

Write-Host "🔷 Attribution des licences Microsoft 365 Business Premium + Teams Enterprise" -ForegroundColor Cyan
Write-Host "📚 Utilise les meilleures pratiques Microsoft Graph PowerShell SDK" -ForegroundColor Gray
Write-Host ""

# Fonction pour lire le fichier .env
function Import-DotEnv {
    param([string]$Path)
    $envMap = @{}
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Fichier de configuration introuvable: $Path"
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

# Lire la configuration si UserEmail n'est pas fourni
if (-not $UserEmail) {
    if (Test-Path $AccountEnvFile) {
        Write-Host "📖 Lecture de la configuration depuis: $AccountEnvFile" -ForegroundColor Yellow
        try {
            $config = Import-DotEnv -Path $AccountEnvFile
            $UserEmail = $config['USER_EMAIL']
            if (-not $UserEmail) {
                throw "USER_EMAIL non défini dans $AccountEnvFile"
            }
            Write-Host "✅ Email utilisateur trouvé: $UserEmail" -ForegroundColor Green
        } catch {
            Write-Error "Erreur lors de la lecture de la configuration: $($_.Exception.Message)"
            exit 1
        }
    } else {
        Write-Error "Fichier de configuration introuvable: $AccountEnvFile"
        Write-Host "Usage: $($MyInvocation.MyCommand.Name) -UserEmail <email>" -ForegroundColor Yellow
        exit 1
    }
}

# Vérifier les modules requis
Write-Host "🔧 Vérification des prérequis Microsoft Graph PowerShell..." -ForegroundColor Yellow

$RequiredModules = @(
    "Microsoft.Graph.Authentication",
    "Microsoft.Graph.Users.Actions", 
    "Microsoft.Graph.Identity.SignIns"
)

foreach ($Module in $RequiredModules) {
    if (-not (Get-Module -ListAvailable -Name $Module)) {
        Write-Error "Module manquant: $Module"
        Write-Host "Installez les modules requis avec:" -ForegroundColor Yellow
        Write-Host "Install-Module Microsoft.Graph -Scope CurrentUser" -ForegroundColor Cyan
        exit 1
    }
}

# Se connecter à Microsoft Graph avec les permissions requises
Write-Host "🔐 Connexion à Microsoft Graph..." -ForegroundColor Yellow

try {
    # Permissions requises selon la documentation Microsoft
    $RequiredScopes = @(
        "User.ReadWrite.All",
        "Organization.Read.All",
        "LicenseAssignment.ReadWrite.All"
    )
    
    Connect-MgGraph -Scopes $RequiredScopes -NoWelcome -ErrorAction Stop
    
    $Context = Get-MgContext
    Write-Host "✅ Connecté en tant que: $($Context.Account)" -ForegroundColor Green
} catch {
    Write-Error "Échec de la connexion à Microsoft Graph: $($_.Exception.Message)"
    exit 1
}

# Définir les SKU IDs des licences à attribuer
$DefaultSkus = @(
    '00e1ec7b-e4a3-40d1-9441-b69b597ab222', # Microsoft 365 Business Premium (no Teams)
    '7e31c0d9-9551-471d-836f-32ee72be4a01'  # Microsoft Teams Enterprise New
)

Write-Host "🎯 Licences à attribuer:" -ForegroundColor Cyan
Write-Host "  • Microsoft 365 Business Premium (no Teams)" -ForegroundColor White
Write-Host "  • Microsoft Teams Enterprise New" -ForegroundColor White
Write-Host ""

# Vérifier que l'utilisateur existe et a une UsageLocation définie
Write-Host "👤 Vérification de l'utilisateur: $UserEmail" -ForegroundColor Yellow

try {
    $User = Get-MgUser -UserId $UserEmail -Property Id,DisplayName,UsageLocation -ErrorAction Stop
    Write-Host "✅ Utilisateur trouvé: $($User.DisplayName)" -ForegroundColor Green
    
    # Vérifier UsageLocation (requis pour l'attribution de licences)
    if (-not $User.UsageLocation) {
        Write-Host "⚠️  UsageLocation manquante, définition sur 'CA' (Canada)..." -ForegroundColor Yellow
        Update-MgUser -UserId $User.Id -UsageLocation "CA"
        Write-Host "✅ UsageLocation définie sur CA" -ForegroundColor Green
    } else {
        Write-Host "✅ UsageLocation: $($User.UsageLocation)" -ForegroundColor Green
    }
} catch {
    Write-Error "Utilisateur introuvable ou erreur: $($_.Exception.Message)"
    exit 1
}

# Vérifier les licences disponibles dans le tenant
Write-Host "🏢 Vérification des licences disponibles dans le tenant..." -ForegroundColor Yellow

try {
    $AvailableSkus = Get-MgSubscribedSku -All
    
    foreach ($SkuId in $DefaultSkus) {
        $Sku = $AvailableSkus | Where-Object { $_.SkuId -eq $SkuId }
        if ($Sku) {
            $Available = $Sku.PrepaidUnits.Enabled - $Sku.ConsumedUnits
            Write-Host "✅ $($Sku.SkuPartNumber): $Available licences disponibles" -ForegroundColor Green
            
            if ($Available -le 0) {
                Write-Warning "Aucune licence disponible pour $($Sku.SkuPartNumber)"
            }
        } else {
            Write-Error "Licence non trouvée dans le tenant: $SkuId"
            exit 1
        }
    }
} catch {
    Write-Error "Erreur lors de la vérification des licences: $($_.Exception.Message)"
    exit 1
}

# Construire les licences à ajouter selon la syntaxe Microsoft Graph PowerShell SDK
Write-Host "🔨 Préparation des licences à attribuer..." -ForegroundColor Yellow

$AddLicenses = @()
foreach ($SkuId in $DefaultSkus) {
    $AddLicenses += @{
        SkuId = $SkuId
        # DisabledPlans peut être ajouté ici si nécessaire
    }
}

# Attribuer les licences en utilisant Set-MgUserLicense (méthode recommandée Microsoft)
Write-Host "🎯 Attribution des licences à $UserEmail..." -ForegroundColor Yellow

try {
    $Result = Set-MgUserLicense -UserId $User.Id -AddLicenses $AddLicenses -RemoveLicenses @()
    
    Write-Host "✅ Attribution des licences réussie!" -ForegroundColor Green
    Write-Host "🆔 ID utilisateur: $($Result.Id)" -ForegroundColor Gray
    Write-Host "📛 Nom d'affichage: $($Result.DisplayName)" -ForegroundColor Gray
    
} catch {
    Write-Error "Échec de l'attribution des licences: $($_.Exception.Message)"
    Write-Host "Détails de l'erreur: $($_.Exception.InnerException.Message)" -ForegroundColor Red
    exit 1
}

# Attendre la propagation et vérifier l'attribution
Write-Host ""
Write-Host "🔄 Vérification de l'attribution (attente de 10 secondes pour propagation)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

try {
    # Utiliser Get-MgUserLicenseDetail pour vérifier les licences attribuées (méthode recommandée)
    $UserLicenses = Get-MgUserLicenseDetail -UserId $User.Id
    
    Write-Host "✅ Licences actuellement attribuées à $($User.DisplayName):" -ForegroundColor Green
    
    $FoundLicenses = @()
    foreach ($License in $UserLicenses) {
        Write-Host "  🔹 $($License.SkuPartNumber) (ID: $($License.SkuId))" -ForegroundColor Cyan
        $FoundLicenses += $License.SkuId
    }
    
    # Vérifier que toutes les licences attendues sont présentes
    $AllLicensesFound = $true
    foreach ($SkuId in $DefaultSkus) {
        if ($SkuId -notin $FoundLicenses) {
            Write-Warning "Licence manquante: $SkuId"
            $AllLicensesFound = $false
        }
    }
    
    if ($AllLicensesFound) {
        Write-Host ""
        Write-Host "🎉 SUCCÈS - Toutes les licences sont correctement attribuées!" -ForegroundColor Green
        Write-Host "✅ Microsoft 365 Business Premium (no Teams)" -ForegroundColor Green
        Write-Host "✅ Microsoft Teams Enterprise New" -ForegroundColor Green
    } else {
        Write-Warning "Certaines licences ne sont pas détectées, mais l'attribution peut prendre du temps"
    }
    
} catch {
    Write-Warning "Impossible de vérifier les licences attribuées: $($_.Exception.Message)"
    Write-Host "L'attribution a probablement réussi mais la vérification a échoué" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🏁 Attribution des licences terminée pour: $UserEmail" -ForegroundColor Magenta
Write-Host "📝 Les licences peuvent prendre quelques minutes pour être complètement actives" -ForegroundColor Gray
