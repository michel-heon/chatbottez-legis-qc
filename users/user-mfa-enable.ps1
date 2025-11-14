#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Active l'authentification multifacteurs (MFA) pour un utilisateur Microsoft 365
.DESCRIPTION
    Active MFA selon les meilleures pratiques Microsoft après attribution des licences.
    Utilise Microsoft Graph PowerShell SDK pour une configuration fiable.
.PARAMETER UserEmail
    Email de l'utilisateur (optionnel, lu depuis .env.user-account si non spécifié)
.EXAMPLE
    ./user-mfa-enable.ps1 -UserEmail user.sample@cotechnoe.com
#>

param(
    [string]$UserEmail
)

# Configuration des couleurs pour l'affichage
$Host.UI.RawUI.ForegroundColor = "White"

# Chemin du fichier de configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AccountEnvFile = Join-Path $ScriptDir ".env.user-account"

Write-Host "🔐 Activation de l'authentification multifacteurs (MFA)" -ForegroundColor Cyan
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
    "Microsoft.Graph.Users",
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

# Se connecter à Microsoft Graph avec les permissions requises pour MFA
Write-Host "🔐 Connexion à Microsoft Graph..." -ForegroundColor Yellow

try {
    # Permissions requises pour gérer MFA selon la documentation Microsoft
    $RequiredScopes = @(
        "User.ReadWrite.All",
        "Policy.ReadWrite.AuthenticationMethod",
        "UserAuthenticationMethod.ReadWrite.All"
    )
    
    Connect-MgGraph -Scopes $RequiredScopes -NoWelcome -ErrorAction Stop
    
    $Context = Get-MgContext
    Write-Host "✅ Connecté en tant que: $($Context.Account)" -ForegroundColor Green
} catch {
    Write-Error "Échec de la connexion à Microsoft Graph: $($_.Exception.Message)"
    exit 1
}

# Vérifier que l'utilisateur existe
Write-Host "👤 Vérification de l'utilisateur: $UserEmail" -ForegroundColor Yellow

try {
    $User = Get-MgUser -UserId $UserEmail -Property Id,DisplayName,UserPrincipalName -ErrorAction Stop
    Write-Host "✅ Utilisateur trouvé: $($User.DisplayName)" -ForegroundColor Green
} catch {
    Write-Error "Utilisateur introuvable: $($_.Exception.Message)"
    exit 1
}

# Vérifier l'état MFA actuel
Write-Host "🔍 Vérification de l'état MFA actuel..." -ForegroundColor Yellow

try {
    # Utiliser l'API Beta pour accéder aux requirements MFA
    $MfaStatus = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/users/$($User.Id)/authentication/requirements" -ErrorAction SilentlyContinue
    
    if ($MfaStatus -and $MfaStatus.perUserMfaState) {
        $CurrentState = $MfaStatus.perUserMfaState
        Write-Host "📊 État MFA actuel: $CurrentState" -ForegroundColor Cyan
        
        if ($CurrentState -eq "enabled" -or $CurrentState -eq "enforced") {
            Write-Host "✅ MFA déjà activé pour cet utilisateur!" -ForegroundColor Green
            Write-Host "🎯 État actuel: $CurrentState" -ForegroundColor Green
            exit 0
        }
    } else {
        Write-Host "📊 État MFA actuel: désactivé (par défaut)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Impossible de vérifier l'état MFA actuel, procédure d'activation..." -ForegroundColor Yellow
}

# Activer MFA pour l'utilisateur (état "enabled")
Write-Host "🎯 Activation de MFA pour $UserEmail..." -ForegroundColor Yellow

try {
    # Utiliser l'API Beta pour définir perUserMfaState à "enabled"
    $Body = @{
        perUserMfaState = "enabled"
    } | ConvertTo-Json
    
    $Result = Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/users/$($User.Id)/authentication/requirements" -Body $Body -ContentType "application/json"
    
    Write-Host "✅ MFA activé avec succès!" -ForegroundColor Green
    Write-Host "🛡️  L'utilisateur devra configurer MFA à la prochaine connexion" -ForegroundColor Green
    
} catch {
    Write-Error "Échec de l'activation MFA: $($_.Exception.Message)"
    Write-Host "Détails: $($_.Exception.InnerException.Message)" -ForegroundColor Red
    exit 1
}

# Vérifier l'activation
Write-Host ""
Write-Host "🔄 Vérification de l'activation MFA..." -ForegroundColor Yellow

try {
    Start-Sleep -Seconds 3
    $VerifyStatus = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/users/$($User.Id)/authentication/requirements"
    
    if ($VerifyStatus -and $VerifyStatus.perUserMfaState -eq "enabled") {
        Write-Host "✅ SUCCÈS - MFA correctement activé!" -ForegroundColor Green
        Write-Host "📊 État MFA confirmé: $($VerifyStatus.perUserMfaState)" -ForegroundColor Green
    } else {
        Write-Warning "L'activation MFA peut prendre quelques minutes pour se propager"
    }
} catch {
    Write-Warning "Impossible de vérifier l'activation, mais la commande s'est exécutée avec succès"
}

Write-Host ""
Write-Host "🎉 Configuration MFA terminée pour: $($User.DisplayName)" -ForegroundColor Magenta
Write-Host "📝 Instructions pour l'utilisateur:" -ForegroundColor Gray
Write-Host "   1. À la prochaine connexion, MFA sera demandé" -ForegroundColor Gray
Write-Host "   2. L'utilisateur devra configurer son téléphone ou une app authenticator" -ForegroundColor Gray
Write-Host "   3. MFA sera requis pour toutes les connexions futures" -ForegroundColor Gray
