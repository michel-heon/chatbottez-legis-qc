#!/bin/bash

# Script pour créer un utilisateur M365 via Azure CLI
# Auteur: Assistant GitHub Copilot
# Date: $(date +%Y-%m-%d)

set -e  # Arrêter le script en cas d'erreur

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACCOUNT_ENV_FILE="${ACCOUNT_ENV_FILE:-$SCRIPT_DIR/.env.user-account}"

if [ -f "$ACCOUNT_ENV_FILE" ]; then
  echo "Chargement de la configuration depuis $ACCOUNT_ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ACCOUNT_ENV_FILE"
  set +a
fi

# Variables de configuration (surchargées via variables d'environnement)
DEFAULT_USER_EMAIL="martin.suzanne@cotechnoe.com"
DEFAULT_FIRST_NAME="Suzanne"
DEFAULT_LAST_NAME="Martin"
DEFAULT_TEMP_PASSWORD="TempPassword123!"
DEFAULT_TENANT="cotechnoe.com"
DEFAULT_LICENSE_SKUS=""

USER_EMAIL="${USER_EMAIL:-$DEFAULT_USER_EMAIL}"
USER_FIRST_NAME="${USER_FIRST_NAME:-$DEFAULT_FIRST_NAME}"
USER_LAST_NAME="${USER_LAST_NAME:-$DEFAULT_LAST_NAME}"
USER_DISPLAY_NAME="${USER_DISPLAY_NAME:-}" 
USER_TEMP_PASSWORD="${USER_TEMP_PASSWORD:-$DEFAULT_TEMP_PASSWORD}"
TENANT_ID="${TENANT_ID:-$DEFAULT_TENANT}"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-$USER_EMAIL}"
LICENSE_SKUS="${LICENSE_SKUS:-$DEFAULT_LICENSE_SKUS}"

# Déterminer les champs dérivés si absents
if [ -z "$USER_DISPLAY_NAME" ]; then
    if [ -n "$USER_FIRST_NAME$USER_LAST_NAME" ]; then
        USER_DISPLAY_NAME="$(echo "$USER_FIRST_NAME $USER_LAST_NAME" | sed 's/^ *//;s/ *$//')"
    else
        USER_DISPLAY_NAME="$USER_EMAIL"
    fi
fi

USER_MAIL_NICKNAME="${USER_MAIL_NICKNAME:-${USER_EMAIL%%@*}}"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Script de création d'utilisateur M365 (Azure CLI) ===${NC}"
echo -e "${YELLOW}Utilisateur à créer: ${USER_EMAIL}${NC}"
echo -e "${YELLOW}Nom complet: ${USER_DISPLAY_NAME}${NC}"
echo -e "${YELLOW}Notification: ${NOTIFICATION_EMAIL}${NC}"
echo ""

# Fonction pour vérifier et installer Azure CLI
check_azure_cli() {
    echo -e "${YELLOW}Vérification d'Azure CLI...${NC}"
    
    if ! command -v az &> /dev/null; then
        echo -e "${YELLOW}Azure CLI non trouvé. Installation en cours...${NC}"
        
        # Installation d'Azure CLI sur Ubuntu/Debian
        curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
        
        if ! command -v az &> /dev/null; then
            echo -e "${RED}Erreur: Impossible d'installer Azure CLI${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}Azure CLI disponible${NC}"
    az version --output table
}

# Fonction pour se connecter à Azure
azure_login() {
    echo -e "${YELLOW}Étape 1: Connexion à Azure...${NC}"
    
    # Vérifier si déjà connecté
    if az account show &> /dev/null; then
        CURRENT_TENANT=$(az account show --query "tenantId" -o tsv)
        CURRENT_USER=$(az account show --query "user.name" -o tsv)
        echo -e "${GREEN}Déjà connecté avec: ${CURRENT_USER}${NC}"
        echo -e "${BLUE}Tenant: ${CURRENT_TENANT}${NC}"
        
        read -p "Utiliser cette connexion ? (y/n): " USE_CURRENT
        if [ "$USE_CURRENT" != "y" ]; then
            echo -e "${YELLOW}Déconnexion...${NC}"
            az logout
        else
            return 0
        fi
    fi
    
    echo -e "${BLUE}Ouverture du navigateur pour l'authentification...${NC}"
    az login --tenant "$TENANT_ID"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Connexion Azure réussie${NC}"
        az account show --query "{User: user.name, Tenant: tenantDisplayName}" -o table
    else
        echo -e "${RED}Erreur lors de la connexion Azure${NC}"
        exit 1
    fi
}

# Fonction pour créer l'utilisateur
create_user() {
    echo -e "${YELLOW}Étape 2: Création de l'utilisateur ${USER_EMAIL}...${NC}"
    
    echo -e "${BLUE}Création de l'utilisateur via Azure CLI...${NC}"
    
    # Créer l'utilisateur avec az ad user create (paramètres supportés uniquement)
    USER_RESULT=$(az ad user create \
        --display-name "$USER_DISPLAY_NAME" \
        --user-principal-name "$USER_EMAIL" \
        --mail-nickname "$USER_MAIL_NICKNAME" \
        --password "$USER_TEMP_PASSWORD" \
        --force-change-password-next-sign-in true \
        --output json)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Utilisateur créé avec succès !${NC}"
        
        # Afficher les détails de l'utilisateur
        echo -e "${BLUE}Détails de l'utilisateur:${NC}"
        echo "$USER_RESULT" | jq '{
            id: .id,
            displayName: .displayName,
            userPrincipalName: .userPrincipalName,
            givenName: .givenName,
            surname: .surname,
            accountEnabled: .accountEnabled
        }' 2>/dev/null || echo "$USER_RESULT"
        
        # Extraire l'ID de l'utilisateur
        USER_ID=$(echo "$USER_RESULT" | jq -r '.id' 2>/dev/null)
        echo -e "${YELLOW}ID utilisateur: ${USER_ID}${NC}"
        
    else
        echo -e "${RED}❌ Erreur lors de la création de l'utilisateur${NC}"
        return 1
    fi
}

# Fonction pour configurer les propriétés additionnelles
configure_user_properties() {
    echo -e "${YELLOW}Étape 3: Configuration des propriétés additionnelles...${NC}"
    
    if [ -z "$USER_ID" ]; then
        echo -e "${RED}Erreur: ID utilisateur non trouvé${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Mise à jour des propriétés utilisateur...${NC}"
    
    # Configuration complète des propriétés via Microsoft Graph API
    echo "Configuration de toutes les propriétés utilisateur..."
    az rest --method PATCH \
        --url "https://graph.microsoft.com/v1.0/users/$USER_ID" \
        --body "{
            \"givenName\": \"$USER_FIRST_NAME\",
            \"surname\": \"$USER_LAST_NAME\",
            \"usageLocation\": \"CA\",
            \"jobTitle\": \"Utilisatrice\",
            \"department\": \"Général\",
            \"preferredLanguage\": \"fr-CA\",
            \"otherMails\": [\"$NOTIFICATION_EMAIL\"]
        }"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Propriétés mises à jour${NC}"
    else
        echo -e "${YELLOW}⚠️  Avertissement: Certaines propriétés n'ont pas pu être mises à jour${NC}"
    fi
}

# Fonction pour envoyer les informations par email (simulation)
send_notification() {
    echo -e "${YELLOW}Étape 5: Notification des informations de connexion...${NC}"
    
    echo -e "${BLUE}Informations à envoyer à ${NOTIFICATION_EMAIL}:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Nom d'utilisateur: ${USER_EMAIL}"
    echo "Mot de passe temporaire: ${USER_TEMP_PASSWORD}"
    echo "Le mot de passe doit être changé à la première connexion"
    echo "URL de connexion: https://login.microsoftonline.com"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo -e "${YELLOW}Note: Envoyez ces informations manuellement à ${NOTIFICATION_EMAIL}${NC}"
}

# Fonction pour configurer l'accès à Teams
setup_teams_access() {
    echo -e "${YELLOW}Étape 6: Configuration de l'accès Teams...${NC}"
    
    echo -e "${BLUE}Étapes pour donner accès à l'application Teams chatbottez-legis-qc:${NC}"
    echo "1. Ouvrez le Teams Admin Center: https://admin.teams.microsoft.com"
    echo "2. Allez dans 'Teams apps' → 'Manage apps'"
    echo "3. Cherchez 'chatbottez-legis-qc'"
    echo "4. Cliquez sur l'application et allez dans 'Permissions'"
    echo "5. Ajoutez l'utilisateur ${USER_EMAIL} ou configurez pour toute l'organisation"
    
    echo ""
    echo -e "${BLUE}Alternative via Azure CLI (si l'app est dans le catalogue):${NC}"
    echo -e "${YELLOW}az rest --method POST --url 'https://graph.microsoft.com/v1.0/users/${USER_ID}/teamwork/installedApps' --body '{\"teamsApp@odata.bind\":\"APP_ID\"}'${NC}"
}

# Fonction pour vérifier l'utilisateur créé
verify_user() {
    echo -e "${YELLOW}Étape 7: Vérification de l'utilisateur créé...${NC}"
    
    if [ -z "$USER_ID" ]; then
        echo -e "${RED}Erreur: ID utilisateur non trouvé${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Récupération des détails de l'utilisateur...${NC}"
    
    az ad user show \
        --id "$USER_ID" \
        --query "{
            DisplayName: displayName,
            UserPrincipalName: userPrincipalName,
            GivenName: givenName,
            Surname: surname,
            AccountEnabled: accountEnabled,
            UsageLocation: usageLocation,
            JobTitle: jobTitle,
            Department: department
        }" \
        --output table
    
    echo -e "${GREEN}✅ Vérification terminée${NC}"
}

# Fonction principale
main() {
    echo -e "${BLUE}Démarrage du processus de création d'utilisateur...${NC}"
    echo ""
    
    # Vérifier que jq est installé (pour parser JSON)
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}Installation de jq pour parser JSON...${NC}"
        sudo apt-get update -qq && sudo apt-get install -y jq -qq
    fi
    
    # Exécuter les étapes
    check_azure_cli
    echo ""
    
    azure_login
    echo ""
    
    create_user
    echo ""
    
    configure_user_properties
    echo ""
    
    echo -e "${YELLOW}Étape 5: Attribution des licences (exécutez ${SCRIPT_DIR}/user-licenses-add.sh ou make -C users user-license-assign).${NC}"
    if [ -n "$LICENSE_SKUS" ]; then
        echo -e "${BLUE}Licences définies: ${LICENSE_SKUS}${NC}"
    else
        echo -e "${YELLOW}Aucune licence définie dans LICENSE_SKUS.${NC}"
    fi
    echo ""

    send_notification
    echo ""
    
    setup_teams_access
    echo ""
    
    verify_user
    echo ""
    
    echo -e "${GREEN}=== Processus terminé avec succès ! ===${NC}"
    echo -e "${BLUE}L'utilisateur ${USER_EMAIL} a été créé et peut maintenant se connecter à M365.${NC}"
    if [ -n "$NOTIFICATION_EMAIL" ] && [ "$NOTIFICATION_EMAIL" != "$USER_EMAIL" ]; then
        echo -e "${BLUE}Pour activer le transfert automatique vers ${NOTIFICATION_EMAIL}, exécutez users/user-email-forward.sh.${NC}"
    else
        echo -e "${YELLOW}N'oubliez pas d'envoyer les informations de connexion à ${NOTIFICATION_EMAIL}${NC}"
    fi
}

# Exécuter le script principal
main "$@"
