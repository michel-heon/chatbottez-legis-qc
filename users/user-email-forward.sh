#!/bin/bash
#
# Script de configuration du transfert de courriels Exchange Online
# Version corrigée qui passe les paramètres via les variables d'environnement
#

set -euo pipefail

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration par défaut
ACCOUNT_ENV="${ACCOUNT_ENV:-users/.env.user-account}"
FORWARD_ENABLE=true

function show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Configuration du transfert de courriels Exchange Online avec timeout."
    echo ""
    echo "Options:"
    echo "  -e, --env FILE          Fichier de configuration des comptes (défaut: users/.env.user-account)"
    echo "  -d, --disable          Désactiver le transfert (défaut: activer)"
    echo "  -h, --help             Afficher cette aide"
    echo ""
    echo "Variables requises dans le fichier de configuration:"
    echo "  USER_EMAIL              Adresse email de l'utilisateur"
    echo "  NOTIFICATION_EMAIL      Adresse de destination pour le transfert"
    echo ""
    echo "Exemples:"
    echo "  $0                     # Activer le transfert avec la config par défaut"
    echo "  $0 -d                  # Désactiver le transfert"
    echo "  $0 -e custom.env       # Utiliser un fichier de config personnalisé"
}

# Parse des arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--env)
      ACCOUNT_ENV="$2"
      shift 2
      ;;
    -d|--disable)
      FORWARD_ENABLE=false
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo -e "${RED}Option inconnue : $1${NC}" >&2
      show_help
      exit 1
      ;;
  esac
done

if [ -z "$ACCOUNT_ENV" ] || [ ! -f "$ACCOUNT_ENV" ]; then
  echo -e "${RED}Erreur : Le fichier de configuration $ACCOUNT_ENV est introuvable.${NC}" >&2
  show_help
  exit 1
fi

if ! command -v az >/dev/null 2>&1; then
  echo -e "${RED}Azure CLI (az) est requis.${NC}" >&2
  exit 1
fi

# Vérifier la connexion Azure CLI
if ! az account show >/dev/null 2>&1; then
  echo -e "${RED}Vous devez être connecté à Azure CLI. Exécutez : az login${NC}" >&2
  exit 1
fi

echo -e "${YELLOW}🔧 Configuration du transfert de courriels Exchange Online${NC}"
echo "📄 Configuration : $ACCOUNT_ENV"
if $FORWARD_ENABLE; then
    echo "🔄 Action : Activer le transfert"
else
    echo "🛑 Action : Désactiver le transfert"
fi
echo ""

# Passer les paramètres via les variables d'environnement
export PS_ACCOUNT_ENV="$ACCOUNT_ENV"
export PS_FORWARD_ENABLE="$FORWARD_ENABLE"

# Exécuter le script PowerShell intégré
pwsh -NoProfile -Command '
$AccountEnv = $env:PS_ACCOUNT_ENV
$ForwardEnable = [bool]::Parse($env:PS_FORWARD_ENABLE)

# Fonction pour charger le fichier .env
function Import-DotEnv {
    param([string]$Path)
    $envMap = @{}
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Fichier de configuration introuvable: $Path"
    }
    foreach ($line in Get-Content -LiteralPath $Path) {
        if (-not $line -or $line.Trim().StartsWith("#")) { continue }
        $pair = $line.Split("=",2)
        if ($pair.Length -eq 2) {
            $key = $pair[0].Trim()
            $value = $pair[1].Trim()
            $envMap[$key] = $value
        }
    }
    return $envMap
}

try {
    $config = Import-DotEnv -Path $AccountEnv
    $UserEmail = $config["USER_EMAIL"]
    $NotificationEmail = $config["NOTIFICATION_EMAIL"]
} catch {
    Write-Error "Erreur lors du chargement de la configuration: $($_.Exception.Message)"
    exit 1
}

if (-not $UserEmail) {
    Write-Error "USER_EMAIL non défini dans $AccountEnv"
    exit 1
}

if ($ForwardEnable -and (-not $NotificationEmail)) {
    Write-Error "NOTIFICATION_EMAIL requis pour activer le transfert"
    exit 1
}

Write-Host "👤 Utilisateur: $UserEmail" -ForegroundColor White
if ($ForwardEnable) {
    Write-Host "📧 Transfert vers: $NotificationEmail" -ForegroundColor White
}
Write-Host ""

# Installation du module Exchange Online si nécessaire
if (-not (Get-Module -ListAvailable -Name ExchangeOnlineManagement)) {
    Write-Host "⚠️  Module ExchangeOnlineManagement non trouvé" -ForegroundColor Yellow
    Write-Host "📦 Installation du module Exchange Online..." -ForegroundColor Cyan
    try {
        Install-Module -Name ExchangeOnlineManagement -Force -AllowClobber -Scope CurrentUser
        Write-Host "✅ Module installé avec succès" -ForegroundColor Green
    } catch {
        Write-Error "Erreur lors de l''installation du module: $($_.Exception.Message)"
        exit 1
    }
}

# Connexion à Exchange Online
Write-Host "🔗 Connexion à Exchange Online..." -ForegroundColor Cyan
try {
    # Importer le module
    Import-Module ExchangeOnlineManagement -Force
    
    # Utiliser le domaine du tenant
    $tenantDomain = "cotechnoe.com"
    
    # Se connecter avec les informations d''organisation
    Connect-ExchangeOnline -Organization $tenantDomain -ShowBanner:$false
    Write-Host "✅ Connexion à Exchange Online réussie" -ForegroundColor Green
} catch {
    Write-Error "Échec de la connexion à Exchange Online: $($_.Exception.Message)"
    Write-Host "💡 Solutions:" -ForegroundColor Blue
    Write-Host "   • Assurez-vous d''être connecté à Azure CLI : az login" -ForegroundColor Gray
    Write-Host "   • Vérifiez que votre compte a les permissions Exchange Online" -ForegroundColor Gray
    exit 1
}

try {
    # Vérifier que la boîte aux lettres existe
    Write-Host "🔍 Vérification de la boîte aux lettres..." -ForegroundColor Cyan
    
    $mailbox = Get-Mailbox -Identity $UserEmail -ErrorAction Stop
    Write-Host "✅ Boîte aux lettres trouvée: $($mailbox.DisplayName)" -ForegroundColor Green
    
    if ($ForwardEnable) {
        Write-Host "🔧 Activation du transfert de courriels..." -ForegroundColor Yellow
        
        # Configurer le transfert
        Set-Mailbox -Identity $UserEmail -ForwardingSmtpAddress $NotificationEmail -DeliverToMailboxAndForward $true
        
        # Vérification
        $updatedMailbox = Get-Mailbox -Identity $UserEmail
        
        Write-Host ""
        Write-Host "✅ Transfert de courriels configuré avec succès!" -ForegroundColor Green
        Write-Host "   • Utilisateur: $($updatedMailbox.DisplayName) ($UserEmail)" -ForegroundColor White
        Write-Host "   • Transfert vers: $($updatedMailbox.ForwardingSmtpAddress)" -ForegroundColor White
        Write-Host "   • Copie locale: $($updatedMailbox.DeliverToMailboxAndForward)" -ForegroundColor White
        Write-Host "   • Status: ACTIVÉ" -ForegroundColor Green
        
    } else {
        Write-Host "🔧 Désactivation du transfert de courriels..." -ForegroundColor Yellow
        
        # Désactiver le transfert
        Set-Mailbox -Identity $UserEmail -ForwardingSmtpAddress $null -DeliverToMailboxAndForward $false
        
        Write-Host "✅ Transfert désactivé pour $UserEmail" -ForegroundColor Green
    }
    
} catch {
    $errorMessage = $_.Exception.Message
    Write-Host "⚠️  Boîte aux lettres non accessible" -ForegroundColor Yellow
    Write-Host "   Erreur: $errorMessage" -ForegroundColor Gray
    Write-Host ""
    Write-Host "ℹ️  Causes possibles:" -ForegroundColor Blue
    Write-Host "   • La boîte aux lettres Exchange Online n''est pas encore créée" -ForegroundColor Gray
    Write-Host "   • Le provisionnement peut prendre 15-30 minutes après l''attribution des licences" -ForegroundColor Gray
    Write-Host "   • Les services Exchange Online sont en cours d''initialisation" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Solutions:" -ForegroundColor Blue
    Write-Host "   • Attendez 15-30 minutes et relancez : make email-forward-enable" -ForegroundColor Gray
    Write-Host "   • Vérifiez les licences: make user-license-assign" -ForegroundColor Gray
    Write-Host "   • Vérifiez dans le portail M365 Admin Center" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  Status: Transfert non configuré (boîte aux lettres en cours de provisionnement)" -ForegroundColor Yellow
    exit 1
} finally {
    # Déconnexion
    try {
        Disconnect-ExchangeOnline -Confirm:$false
        Write-Host "🔓 Déconnecté d''Exchange Online" -ForegroundColor Yellow
    } catch {
        # Ignore les erreurs de déconnexion
    }
}
'

if [ $? -eq 0 ]; then
    exit 0
else
    exit 1
fi
