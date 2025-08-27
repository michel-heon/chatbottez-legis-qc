#!/bin/bash

# env-sync.sh - Synchronisation automatique des fichiers d'environnement
# 
# Description: Assure la cohérence entre les différents fichiers de configuration
# d'environnement (.env.*.user et .localConfigs.*) pour éviter les incohérences
# de noms d'index et autres variables critiques.
#
# Usage: ./env-sync.sh [ENVIRONMENT]
#   ENVIRONMENT: playground|local|dev (défaut: playground)
#
# Auteur: Système de gestion automatisé
# Version: 1.0.0
# Date: 2025-08-27

set -e

# Variables par défaut
ENVIRONMENT="${1:-playground}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Couleurs pour le logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction principale de synchronisation
sync_environment_files() {
    local env="$1"
    
    log_info "Synchronisation des fichiers d'environnement pour: $env"
    
    # Définir les chemins des fichiers
    local env_file="$PROJECT_ROOT/env/.env.$env.user"
    local local_config="$PROJECT_ROOT/.localConfigs.$env"
    
    # Vérifier l'existence des fichiers
    if [[ ! -f "$env_file" ]]; then
        log_error "Fichier manquant: $env_file"
        return 1
    fi
    
    if [[ ! -f "$local_config" ]]; then
        log_warning "Fichier manquant: $local_config"
        log_info "Création du fichier de configuration locale..."
        # Si le fichier .localConfigs n'existe pas, on peut le créer à partir du .env
        cp "$env_file" "$local_config"
        log_success "Fichier $local_config créé"
        return 0
    fi
    
    # Synchroniser les variables critiques
    sync_critical_variables "$env_file" "$local_config"
}

# Fonction pour synchroniser les variables critiques
sync_critical_variables() {
    local env_file="$1"
    local local_config="$2"
    
    # Variables critiques à synchroniser
    local critical_vars=(
        "AZURE_SEARCH_INDEX_NAME"
        "AZURE_SEARCH_ENDPOINT"
        "AZURE_OPENAI_ENDPOINT"
        "AZURE_OPENAI_DEPLOYMENT_NAME"
        "AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME"
    )
    
    local changes_made=false
    
    for var in "${critical_vars[@]}"; do
        # Extraire la valeur du fichier d'environnement principal
        local env_value=$(grep "^$var=" "$env_file" 2>/dev/null | cut -d'=' -f2- | sed 's/^["'"'"']//;s/["'"'"']$//')
        
        if [[ -n "$env_value" ]]; then
            # Vérifier si la variable existe dans le fichier de config locale
            if grep -q "^$var=" "$local_config"; then
                # Extraire la valeur actuelle
                local local_value=$(grep "^$var=" "$local_config" | cut -d'=' -f2- | sed 's/^["'"'"']//;s/["'"'"']$//')
                
                if [[ "$env_value" != "$local_value" ]]; then
                    log_warning "Incohérence détectée pour $var:"
                    log_info "  Environnement: $env_value"
                    log_info "  Config locale: $local_value"
                    
                    # Mettre à jour la valeur dans le fichier local
                    if [[ "$OSTYPE" == "darwin"* ]]; then
                        # macOS
                        sed -i ".bak" "s|^$var=.*|$var=$env_value|" "$local_config"
                    else
                        # Linux
                        sed -i "s|^$var=.*|$var=$env_value|" "$local_config"
                    fi
                    
                    log_success "Variable $var synchronisée"
                    changes_made=true
                fi
            else
                # Ajouter la variable si elle n'existe pas
                echo "$var=$env_value" >> "$local_config"
                log_success "Variable $var ajoutée"
                changes_made=true
            fi
        fi
    done
    
    if [[ "$changes_made" == "true" ]]; then
        log_success "Synchronisation terminée avec modifications"
    else
        log_success "Fichiers déjà synchronisés"
    fi
}

# Fonction de validation post-synchronisation
validate_sync() {
    local env="$1"
    local env_file="$PROJECT_ROOT/env/.env.$env.user"
    local local_config="$PROJECT_ROOT/.localConfigs.$env"
    
    log_info "Validation de la synchronisation..."
    
    # Vérifier la cohérence de l'index name
    local env_index=$(grep "AZURE_SEARCH_INDEX_NAME=" "$env_file" 2>/dev/null | cut -d'=' -f2)
    local local_index=$(grep "AZURE_SEARCH_INDEX_NAME=" "$local_config" 2>/dev/null | cut -d'=' -f2)
    
    if [[ "$env_index" == "$local_index" ]]; then
        log_success "Index name cohérent: $env_index"
        return 0
    else
        log_error "Index name incohérent: $env_index vs $local_index"
        return 1
    fi
}

# Point d'entrée principal
main() {
    echo "🔄 Synchronisation des fichiers d'environnement"
    echo "================================================"
    
    # Validation des arguments
    if [[ ! "$ENVIRONMENT" =~ ^(playground|local|dev)$ ]]; then
        log_error "Environnement invalide: $ENVIRONMENT"
        log_info "Environnements supportés: playground, local, dev"
        exit 1
    fi
    
    # Synchronisation
    if sync_environment_files "$ENVIRONMENT"; then
        validate_sync "$ENVIRONMENT"
        log_success "Synchronisation de l'environnement '$ENVIRONMENT' terminée"
    else
        log_error "Échec de la synchronisation pour l'environnement '$ENVIRONMENT'"
        exit 1
    fi
}

# Exécution si le script est appelé directement
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
