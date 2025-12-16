# Script PowerShell pour désactiver UNIQUEMENT les politiques de sécurité par défaut
# Plus simple et ciblé pour résoudre l'erreur 5.7.139

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [switch]$CheckOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$DisableSecurityDefaults
)

Write-Host "=== Gestion des politiques de sécurité par défaut Office 365 ===" -ForegroundColor Cyan

# Fonction pour installer Microsoft Graph PowerShell
function Install-GraphModule {
    $ModuleName = "Microsoft.Graph"
    
    if (-not (Get-Module -ListAvailable -Name $ModuleName)) {
        Write-Host "📦 Installation du module Microsoft.Graph..." -ForegroundColor Yellow
        try {
            # Installation avec AllowClobber pour éviter les conflits
            Install-Module -Name $ModuleName -Force -AllowClobber -Scope CurrentUser -Repository PSGallery
            Write-Host "✅ Module Microsoft.Graph installé" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Échec de l'installation : $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "✅ Module Microsoft.Graph disponible" -ForegroundColor Green
    }
    
    return $true
}

# Fonction pour se connecter à Microsoft Graph
function Connect-GraphWithRetry {
    $MaxRetries = 3
    $RetryCount = 0
    
    while ($RetryCount -lt $MaxRetries) {
        try {
            Write-Host "🔐 Tentative de connexion à Microsoft Graph ($($RetryCount + 1)/$MaxRetries)..." -ForegroundColor Blue
            
            # Connexion avec les permissions minimales requises
            Connect-MgGraph -Scopes "Policy.ReadWrite.ConditionalAccess", "Policy.Read.All" -NoWelcome
            
            # Vérifier la connexion
            $Context = Get-MgContext
            if ($null -ne $Context) {
                Write-Host "✅ Connecté à Microsoft Graph" -ForegroundColor Green
                Write-Host "   Tenant: $($Context.TenantId)" -ForegroundColor Gray
                Write-Host "   Account: $($Context.Account)" -ForegroundColor Gray
                return $true
            }
        }
        catch {
            Write-Host "❌ Tentative $($RetryCount + 1) échouée : $($_.Exception.Message)" -ForegroundColor Red
            $RetryCount++
            
            if ($RetryCount -lt $MaxRetries) {
                Write-Host "⏳ Attente avant nouvelle tentative..." -ForegroundColor Yellow
                Start-Sleep -Seconds 5
            }
        }
    }
    
    Write-Host "❌ Échec de la connexion après $MaxRetries tentatives" -ForegroundColor Red
    return $false
}

# Fonction pour vérifier les politiques de sécurité par défaut
function Get-SecurityDefaultsPolicy {
    try {
        Write-Host "🔍 Vérification des politiques de sécurité par défaut..." -ForegroundColor Blue
        
        $Policy = Get-MgPolicyIdentitySecurityDefaultEnforcementPolicy
        
        if ($null -ne $Policy) {
            Write-Host "✅ Politique trouvée" -ForegroundColor Green
            Write-Host "   ID: $($Policy.Id)" -ForegroundColor Gray
            Write-Host "   IsEnabled: $($Policy.IsEnabled)" -ForegroundColor ($Policy.IsEnabled ? 'Red' : 'Green')
            Write-Host "   DisplayName: $($Policy.DisplayName)" -ForegroundColor Gray
            
            return $Policy
        } else {
            Write-Host "❌ Impossible de récupérer la politique" -ForegroundColor Red
            return $null
        }
    }
    catch {
        Write-Host "❌ Erreur lors de la vérification : $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Fonction pour désactiver les politiques de sécurité par défaut
function Disable-SecurityDefaultsPolicy {
    param([object]$CurrentPolicy)
    
    if ($null -eq $CurrentPolicy) {
        Write-Host "❌ Politique non disponible" -ForegroundColor Red
        return $false
    }
    
    if ($CurrentPolicy.IsEnabled -eq $false) {
        Write-Host "✅ Les politiques de sécurité par défaut sont déjà désactivées" -ForegroundColor Green
        return $true
    }
    
    Write-Host "⚠️  ATTENTION: Désactivation des politiques de sécurité par défaut" -ForegroundColor Red
    Write-Host "   Cela peut réduire la sécurité de votre tenant!" -ForegroundColor Red
    Write-Host "   Assurez-vous d'avoir des politiques d'accès conditionnel en place" -ForegroundColor Red
    
    $Confirm = Read-Host "Continuer? (oui/non)"
    if ($Confirm -ne "oui") {
        Write-Host "❌ Opération annulée" -ForegroundColor Yellow
        return $false
    }
    
    try {
        Write-Host "🔧 Désactivation des politiques de sécurité par défaut..." -ForegroundColor Blue
        
        # Utiliser Update-MgPolicyIdentitySecurityDefaultEnforcementPolicy
        $UpdateParams = @{
            IsEnabled = $false
        }
        
        Update-MgPolicyIdentitySecurityDefaultEnforcementPolicy -BodyParameter $UpdateParams
        
        Write-Host "✅ Politiques de sécurité par défaut désactivées" -ForegroundColor Green
        
        # Vérification
        Start-Sleep -Seconds 2
        $UpdatedPolicy = Get-MgPolicyIdentitySecurityDefaultEnforcementPolicy
        if ($UpdatedPolicy.IsEnabled -eq $false) {
            Write-Host "✅ Changement confirmé" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Changement en cours de propagation..." -ForegroundColor Yellow
        }
        
        return $true
    }
    catch {
        Write-Host "❌ Erreur lors de la désactivation : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Script principal
try {
    # 1. Installer le module Graph
    if (-not (Install-GraphModule)) {
        exit 1
    }
    
    # 2. Se connecter à Microsoft Graph
    if (-not (Connect-GraphWithRetry)) {
        exit 1
    }
    
    # 3. Vérifier les politiques actuelles
    $CurrentPolicy = Get-SecurityDefaultsPolicy
    if ($null -eq $CurrentPolicy) {
        Write-Host "❌ Impossible de continuer sans accès à la politique" -ForegroundColor Red
        exit 1
    }
    
    # 4. Actions selon les paramètres
    if ($CheckOnly) {
        Write-Host ""
        Write-Host "📊 État actuel des politiques de sécurité par défaut :" -ForegroundColor Cyan
        Write-Host "   Status: $($CurrentPolicy.IsEnabled ? 'ACTIVÉES (bloque SMTP)' : 'DÉSACTIVÉES (permet SMTP)')" -ForegroundColor ($CurrentPolicy.IsEnabled ? 'Red' : 'Green')
        
        if ($CurrentPolicy.IsEnabled) {
            Write-Host ""
            Write-Host "💡 Pour résoudre l'erreur SMTP 5.7.139 :" -ForegroundColor Blue
            Write-Host "   pwsh ./Fix-SecurityDefaults.ps1 -DisableSecurityDefaults" -ForegroundColor Gray
        }
    }
    elseif ($DisableSecurityDefaults) {
        if (Disable-SecurityDefaultsPolicy -CurrentPolicy $CurrentPolicy) {
            Write-Host ""
            Write-Host "🎉 Politiques de sécurité par défaut désactivées avec succès" -ForegroundColor Green
            Write-Host ""
            Write-Host "⏰ Attendre 10-30 minutes puis tester :" -ForegroundColor Blue
            Write-Host "   ./users/send-email.sh --test" -ForegroundColor Gray
            Write-Host ""
            Write-Host "🛡️  IMPORTANT : Configurez des politiques d'accès conditionnel pour maintenir la sécurité" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "❌ Aucune action spécifiée. Utilisez -CheckOnly ou -DisableSecurityDefaults" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "💥 Erreur critique : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    # Déconnexion propre
    try {
        Disconnect-MgGraph -InformationAction Ignore 2>$null
        Write-Host "🔌 Déconnecté de Microsoft Graph" -ForegroundColor Gray
    }
    catch {
        # Ignorer les erreurs de déconnexion
    }
}

Write-Host ""
Write-Host "📝 Exemples d'utilisation :" -ForegroundColor Blue
Write-Host "   pwsh ./Fix-SecurityDefaults.ps1 -CheckOnly" -ForegroundColor Gray
Write-Host "   pwsh ./Fix-SecurityDefaults.ps1 -DisableSecurityDefaults" -ForegroundColor Gray
