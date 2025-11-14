#!/bin/bash
#
# Script de diagnostic avancé pour le transfert externe Microsoft 365
# Résout les problèmes persistants de transfert automatique
#

set -euo pipefail

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Diagnostic avancé du transfert externe Microsoft 365${NC}"
echo ""

# Vérifier la connexion Azure CLI
if ! az account show >/dev/null 2>&1; then
  echo -e "${RED}Vous devez être connecté à Azure CLI. Exécutez : az login${NC}" >&2
  exit 1
fi

echo -e "${BLUE}📋 Diagnostic complet des politiques de transfert...${NC}"

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

    Write-Host ""
    Write-Host "=== DIAGNOSTIC COMPLET DES POLITIQUES ===" -ForegroundColor Yellow
    Write-Host ""

    # 1. Vérifier RemoteDomain
    Write-Host "1️⃣  REMOTE DOMAINS:" -ForegroundColor Blue
    $remoteDomains = Get-RemoteDomain
    foreach ($domain in $remoteDomains) {
        Write-Host "   Domain: $($domain.Name)" -ForegroundColor White
        Write-Host "   AutoForwardEnabled: $($domain.AutoForwardEnabled)" -ForegroundColor $(if($domain.AutoForwardEnabled) { "Green" } else { "Red" })
        Write-Host "   DomainName: $($domain.DomainName)" -ForegroundColor Gray
        Write-Host ""
    }

    # 2. Vérifier OutboundConnector
    Write-Host "2️⃣  OUTBOUND CONNECTORS:" -ForegroundColor Blue
    try {
        $connectors = Get-OutboundConnector
        if ($connectors) {
            foreach ($connector in $connectors) {
                Write-Host "   Connector: $($connector.Name)" -ForegroundColor White
                Write-Host "   Enabled: $($connector.Enabled)" -ForegroundColor $(if($connector.Enabled) { "Green" } else { "Red" })
                Write-Host "   RecipientDomains: $($connector.RecipientDomains -join "", "")" -ForegroundColor Gray
                Write-Host ""
            }
        } else {
            Write-Host "   Aucun connecteur sortant configuré" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   Erreur lors de la récupération des connecteurs: $($_.Exception.Message)" -ForegroundColor Red
    }

    # 3. Vérifier les politiques de transport/flux de messagerie
    Write-Host "3️⃣  TRANSPORT RULES:" -ForegroundColor Blue
    try {
        $transportRules = Get-TransportRule | Where-Object { $_.State -eq "Enabled" -and ($_.Name -like "*forward*" -or $_.Name -like "*external*" -or $_.Actions -like "*forward*") }
        if ($transportRules) {
            foreach ($rule in $transportRules) {
                Write-Host "   Rule: $($rule.Name)" -ForegroundColor Yellow
                Write-Host "   State: $($rule.State)" -ForegroundColor White
                Write-Host "   Actions: $($rule.Actions)" -ForegroundColor Gray
                Write-Host ""
            }
        } else {
            Write-Host "   Aucune règle de transport bloquant le transfert détectée" -ForegroundColor Green
        }
    } catch {
        Write-Host "   Erreur lors de la récupération des règles de transport: $($_.Exception.Message)" -ForegroundColor Red
    }

    # 4. Vérifier la configuration spécifique de la boîte aux lettres
    Write-Host "4️⃣  MAILBOX CONFIGURATION:" -ForegroundColor Blue
    $mailbox = Get-Mailbox -Identity user.sample@cotechnoe.com
    Write-Host "   ForwardingSmtpAddress: $($mailbox.ForwardingSmtpAddress)" -ForegroundColor White
    Write-Host "   ForwardingAddress: $($mailbox.ForwardingAddress)" -ForegroundColor White
    Write-Host "   DeliverToMailboxAndForward: $($mailbox.DeliverToMailboxAndForward)" -ForegroundColor White

    # 5. Vérifier les restrictions de boîte aux lettres
    Write-Host ""
    Write-Host "5️⃣  MAILBOX RESTRICTIONS:" -ForegroundColor Blue
    $casMailbox = Get-CasMailbox -Identity user.sample@cotechnoe.com
    Write-Host "   EwsEnabled: $($casMailbox.EwsEnabled)" -ForegroundColor White
    Write-Host "   MAPIEnabled: $($casMailbox.MAPIEnabled)" -ForegroundColor White
    
    # 6. Tenter de corriger en utilisant ForwardingAddress au lieu de ForwardingSmtpAddress
    Write-Host ""
    Write-Host "6️⃣  TENTATIVE DE CORRECTION ALTERNATIVE:" -ForegroundColor Blue
    Write-Host "   Essai avec ForwardingAddress au lieu de ForwardingSmtpAddress..." -ForegroundColor Yellow
    
    # Nettoyer d abord
    Set-Mailbox -Identity user.sample@cotechnoe.com -ForwardingSmtpAddress $null -ForwardingAddress $null -DeliverToMailboxAndForward $false
    Start-Sleep -Seconds 2
    
    # Essayer avec un contact mail externe (méthode alternative)
    try {
        # Créer ou vérifier un contact mail
        $contactEmail = "heon@videotron.ca"
        $contactName = "Heon-Forward"
        
        try {
            $contact = Get-MailContact -Identity $contactName -ErrorAction SilentlyContinue
        } catch {
            $contact = $null
        }
        
        if (-not $contact) {
            Write-Host "   Création du contact mail externe..." -ForegroundColor Cyan
            New-MailContact -Name $contactName -ExternalEmailAddress $contactEmail -DisplayName "Heon Videotron Forward"
            Start-Sleep -Seconds 2
        }
        
        # Configurer le transfert vers le contact
        Write-Host "   Configuration du transfert via contact mail..." -ForegroundColor Cyan
        Set-Mailbox -Identity user.sample@cotechnoe.com -ForwardingAddress $contactName -DeliverToMailboxAndForward $true
        
        Start-Sleep -Seconds 2
        
        # Vérification
        $updatedMailbox = Get-Mailbox -Identity user.sample@cotechnoe.com
        Write-Host ""
        Write-Host "✅ NOUVELLE CONFIGURATION:" -ForegroundColor Green
        Write-Host "   ForwardingAddress: $($updatedMailbox.ForwardingAddress)" -ForegroundColor White
        Write-Host "   DeliverToMailboxAndForward: $($updatedMailbox.DeliverToMailboxAndForward)" -ForegroundColor White
        
    } catch {
        Write-Host "   ❌ Échec de la méthode alternative: $($_.Exception.Message)" -ForegroundColor Red
        
        # Retour à la méthode originale
        Write-Host "   Retour à ForwardingSmtpAddress..." -ForegroundColor Yellow
        Set-Mailbox -Identity user.sample@cotechnoe.com -ForwardingSmtpAddress "heon@videotron.ca" -DeliverToMailboxAndForward $true
    }

} catch {
    Write-Error "Erreur lors du diagnostic: $($_.Exception.Message)"
    exit 1
} finally {
    try {
        Disconnect-ExchangeOnline -Confirm:$false
        Write-Host ""
        Write-Host "🔓 Déconnecté d Exchange Online" -ForegroundColor Yellow
    } catch {
        # Ignorer les erreurs de déconnexion
    }
}
'

echo ""
echo -e "${GREEN}📋 Actions supplémentaires à vérifier manuellement:${NC}"
echo ""
echo "🌐 Dans le portail Microsoft 365 Admin Center:"
echo "   1. Security & Compliance > Threat management > Anti-phishing"
echo "   2. Exchange Admin Center > Protection > Outbound spam"
echo "   3. Exchange Admin Center > Mail flow > Rules (vérifier les règles bloquantes)"
echo ""
echo "🔒 Vérifiez également:"
echo "   • Conditional Access policies (Azure AD)"
echo "   • DLP (Data Loss Prevention) policies" 
echo "   • Anti-phishing policies qui peuvent bloquer les transferts"
echo ""
echo -e "${YELLOW}💡 Si le problème persiste, le transfert externe peut être bloqué au niveau tenant${NC}"
echo -e "${YELLOW}   par des politiques de sécurité plus restrictives.${NC}"
