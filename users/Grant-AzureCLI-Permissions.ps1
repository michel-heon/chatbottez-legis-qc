#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Accorde les permissions User.ReadWrite.All à l'application Microsoft Azure CLI
.DESCRIPTION
    Ce script utilise Microsoft Graph PowerShell pour accorder les permissions déléguées
    User.ReadWrite.All à l'application Microsoft Azure CLI dans le tenant.
.EXAMPLE
    ./Grant-AzureCLI-Permissions.ps1
#>

param(
    [string]$Permission = "User.ReadWrite.All"
)

# Configuration
$AzureCLIAppId = "04b07795-8ddb-461a-bbee-02f9e1bf7b46"
$GraphAppId = "00000003-0000-0000-c000-000000000000"

Write-Host "🔐 Connexion à Microsoft Graph..." -ForegroundColor Yellow

try {
    # Connexion avec les permissions nécessaires
    Connect-MgGraph -Scopes "Application.ReadWrite.All", "AppRoleAssignment.ReadWrite.All" -NoWelcome
    
    Write-Host "✅ Connexion réussie" -ForegroundColor Green
    
    # Récupérer le service principal Azure CLI
    Write-Host "🔍 Recherche du service principal Azure CLI..." -ForegroundColor Yellow
    $cli = Get-MgServicePrincipal -Filter "appId eq '$AzureCLIAppId'"
    
    if (-not $cli) {
        Write-Error "❌ Service principal Azure CLI non trouvé"
        exit 1
    }
    
    Write-Host "✅ Service principal Azure CLI trouvé: $($cli.DisplayName)" -ForegroundColor Green
    
    # Récupérer le service principal Microsoft Graph
    Write-Host "🔍 Recherche du service principal Microsoft Graph..." -ForegroundColor Yellow
    $graph = Get-MgServicePrincipal -Filter "appId eq '$GraphAppId'"
    
    if (-not $graph) {
        Write-Error "❌ Service principal Microsoft Graph non trouvé"
        exit 1
    }
    
    Write-Host "✅ Service principal Microsoft Graph trouvé: $($graph.DisplayName)" -ForegroundColor Green
    
    # Trouver la permission User.ReadWrite.All
    Write-Host "🔍 Recherche de la permission $Permission..." -ForegroundColor Yellow
    $userRwPermission = $graph.AppRoles | Where-Object { 
        $_.Value -eq $Permission -and $_.AllowedMemberTypes -contains "Application" 
    }
    
    if (-not $userRwPermission) {
        Write-Error "❌ Permission $Permission non trouvée"
        exit 1
    }
    
    Write-Host "✅ Permission trouvée: $($userRwPermission.DisplayName)" -ForegroundColor Green
    
    # Vérifier si la permission est déjà accordée
    Write-Host "🔍 Vérification des permissions existantes..." -ForegroundColor Yellow
    $existingAssignment = Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $cli.Id | 
        Where-Object { $_.AppRoleId -eq $userRwPermission.Id -and $_.ResourceId -eq $graph.Id }
    
    if ($existingAssignment) {
        Write-Host "⚠️  La permission $Permission est déjà accordée" -ForegroundColor Yellow
        Write-Host "   Assignation ID: $($existingAssignment.Id)" -ForegroundColor Gray
        Write-Host "   Date d'assignation: $($existingAssignment.CreatedDateTime)" -ForegroundColor Gray
    } else {
        # Accorder la permission
        Write-Host "🛠️  Attribution de la permission $Permission..." -ForegroundColor Yellow
        
        $assignment = New-MgServicePrincipalAppRoleAssignment `
            -ServicePrincipalId $cli.Id `
            -PrincipalId $cli.Id `
            -ResourceId $graph.Id `
            -AppRoleId $userRwPermission.Id
        
        Write-Host "✅ Permission accordée avec succès!" -ForegroundColor Green
        Write-Host "   Assignation ID: $($assignment.Id)" -ForegroundColor Gray
        Write-Host "   Permission: $($userRwPermission.DisplayName)" -ForegroundColor Gray
        Write-Host "   Description: $($userRwPermission.Description)" -ForegroundColor Gray
    }
    
    # Afficher un résumé des permissions actuelles
    Write-Host "`n📋 Permissions actuelles pour Azure CLI:" -ForegroundColor Cyan
    $allAssignments = Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $cli.Id
    
    foreach ($assignment in $allAssignments) {
        $resource = Get-MgServicePrincipal -ServicePrincipalId $assignment.ResourceId
        $role = $resource.AppRoles | Where-Object { $_.Id -eq $assignment.AppRoleId }
        
        Write-Host "   • $($role.DisplayName) sur $($resource.DisplayName)" -ForegroundColor Gray
    }
    
} catch {
    Write-Error "❌ Erreur lors de l'attribution des permissions: $($_.Exception.Message)"
    exit 1
} finally {
    # Déconnexion
    Disconnect-MgGraph | Out-Null
    Write-Host "`n🔓 Déconnecté de Microsoft Graph" -ForegroundColor Yellow
}

Write-Host "`n🎉 Script terminé avec succès!" -ForegroundColor Green
Write-Host "L'application Azure CLI peut maintenant utiliser la permission $Permission" -ForegroundColor Green
