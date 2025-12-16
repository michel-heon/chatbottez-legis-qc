#!/bin/bash
#
# Script pour activer le transfert externe dans Microsoft 365
# Résout l'erreur: "Your organization does not allow external forwarding"
#

set -euo pipefail

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Configuration du transfert externe Microsoft 365${NC}"
echo ""

# Vérifier la connexion Azure CLI
if ! az account show >/dev/null 2>&1; then
  echo -e "${RED}Vous devez être connecté à Azure CLI. Exécutez : az login${NC}" >&2
  exit 1
fi

echo -e "${BLUE}ℹ️  Le transfert externe est actuellement bloqué par les politiques M365${NC}"
echo "📋 Actions requises pour activer le transfert externe:"
echo ""
echo "🔓 OPTION A: Via PowerShell Exchange Online (Recommandé)"
echo "   1. Ouvrez PowerShell en tant qu'administrateur"
echo "   2. Exécutez les commandes suivantes:"
echo ""
echo -e "${GREEN}   Install-Module -Name ExchangeOnlineManagement -Force${NC}"
echo -e "${GREEN}   Import-Module ExchangeOnlineManagement${NC}"
echo -e "${GREEN}   Connect-ExchangeOnline -Organization cotechnoe.com${NC}"
echo ""
echo "   # Activer le transfert externe pour l'organisation"
echo -e "${GREEN}   Set-RemoteDomain Default -AutoForwardEnabled \$true${NC}"
echo ""
echo "   # Ou créer une politique spécifique pour les domaines externes"
echo -e "${GREEN}   New-RemoteDomain -Name 'VideoTron' -DomainName 'videotron.ca' -AutoForwardEnabled \$true${NC}"
echo ""
echo "   # Vérifier la configuration"
echo -e "${GREEN}   Get-RemoteDomain | Select Name, AutoForwardEnabled${NC}"
echo ""
echo "🌐 OPTION B: Via le portail Microsoft 365 Admin Center"
echo "   1. Allez sur https://admin.microsoft.com"
echo "   2. Exchange Admin Center > Mail flow > Remote domains"
echo "   3. Sélectionnez 'Default' ou créez un nouveau domaine"
echo "   4. Activez 'Allow automatic forwarding'"
echo ""
echo "⚠️  IMPORTANT: Ces changements nécessitent des permissions d'administrateur Exchange"
echo ""

# Tenter la configuration automatique via PowerShell
echo -e "${YELLOW}🚀 Tentative de configuration automatique...${NC}"

pwsh -NoProfile -Command '
try {
    # Vérifier si le module existe
    if (-not (Get-Module -ListAvailable -Name ExchangeOnlineManagement)) {
        Write-Host "📦 Installation du module Exchange Online..." -ForegroundColor Cyan
        Install-Module -Name ExchangeOnlineManagement -Force -AllowClobber -Scope CurrentUser
    }

    # Importer et se connecter
    Write-Host "🔗 Connexion à Exchange Online..." -ForegroundColor Cyan
    Import-Module ExchangeOnlineManagement -Force
    Connect-ExchangeOnline -Organization cotechnoe.com -ShowBanner:$false

    # Vérifier la configuration actuelle
    Write-Host "🔍 Vérification de la configuration actuelle..." -ForegroundColor Cyan
    $remoteDomain = Get-RemoteDomain -Identity Default
    Write-Host "Status actuel AutoForwardEnabled: $($remoteDomain.AutoForwardEnabled)" -ForegroundColor White

    if (-not $remoteDomain.AutoForwardEnabled) {
        Write-Host "🔧 Activation du transfert automatique..." -ForegroundColor Yellow
        Set-RemoteDomain -Identity Default -AutoForwardEnabled $true
        
        # Vérification
        $updatedDomain = Get-RemoteDomain -Identity Default
        if ($updatedDomain.AutoForwardEnabled) {
            Write-Host "✅ Transfert externe activé avec succès!" -ForegroundColor Green
            Write-Host "   Le transfert vers videotron.ca est maintenant autorisé" -ForegroundColor White
        } else {
            Write-Host "❌ Échec de la activation du transfert externe" -ForegroundColor Red
        }
    } else {
        Write-Host "✅ Le transfert externe est déjà activé" -ForegroundColor Green
    }

    # Afficher la configuration finale
    Write-Host ""
    Write-Host "📋 Configuration des domaines distants:" -ForegroundColor Blue
    Get-RemoteDomain | Select-Object Name, AutoForwardEnabled | Format-Table

} catch {
    Write-Error "Erreur lors de la configuration: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "💡 Solutions manuelles:" -ForegroundColor Blue
    Write-Host "   • Vérifiez que vous avez les permissions Exchange Admin" -ForegroundColor Gray
    Write-Host "   • Utilisez le portail Microsoft 365 Admin Center" -ForegroundColor Gray
    Write-Host "   • Contactez votre administrateur Microsoft 365" -ForegroundColor Gray
    exit 1
} finally {
    try {
        Disconnect-ExchangeOnline -Confirm:$false
        Write-Host "🔓 Déconnecté d Exchange Online" -ForegroundColor Yellow
    } catch {
        # Ignorer les erreurs de déconnexion
    }
}
'

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Configuration terminée ! Vous pouvez maintenant tester le transfert:${NC}"
    echo -e "${BLUE}   make email-forward-enable${NC}"
    echo ""
else
    echo ""
    echo -e "${YELLOW}⚠️  Configuration automatique échouée${NC}"
    echo "📋 Utilisez les instructions manuelles ci-dessus"
    echo ""
fi
