#!/bin/bash

# Script: json-data-purge.sh
# Description: Purge les fichiers JSON d'embedding et de traitement des répertoires transform/
# Convention: <type>-<objet>-<action>.sh → json-data-purge.sh
# Usage: ./scripts/json-data-purge.sh [playground|local] [--dry-run]

set -e

# Configuration par défaut
ENV_CONFIG="playground"
DRY_RUN=false

# Traitement des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help() {
                echo "Usage: $0 [ENVIRONNEMENT] [OPTIONS]"
                echo ""
                echo "DESCRIPTION:"
                echo "  Purge les fichiers JSON d'embedding et de traitement"
                echo "  des répertoires transform/embeddings/ et transform/processed/"
                echo ""
                echo "ENVIRONNEMENTS:"
                echo "  playground    Environnement de test (par défaut)"
                echo "  local         Environnement local"
                echo ""
                echo "OPTIONS:"
                echo "  --dry-run     Simulation sans suppression réelle"
                echo "  --help        Afficher cette aide"
                echo ""
                echo "EXEMPLES:"
                echo "  $0                           # Purge en mode playground"
                echo "  $0 local                     # Purge en mode local"
                echo "  $0 playground --dry-run      # Simulation en mode playground"
                echo "  $0 --dry-run                 # Simulation en mode playground"
                echo ""
                echo "FICHIERS SUPPRIMÉS:"
                echo "  • \$EXTERNAL_DATA_SOURCE_PATH/transform/embeddings/*.json"
                echo "  • \$EXTERNAL_DATA_SOURCE_PATH/transform/processed/*.json"
                echo "  • \$EXTERNAL_DATA_SOURCE_PATH/transform/processed/*.log"
            }
            show_help
            exit 0
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        playground|local)
            ENV_CONFIG="$1"
            shift
            ;;
        *)
            echo "Argument invalide: $1"
            echo "Usage: $0 [playground|local] [--dry-run]"
            echo "Utilisez --help pour plus d'informations"
            exit 1
            ;;
    esac
done

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage avec couleurs
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

log_clean() {
    echo -e "${BLUE}🧹 $1${NC}"
}

# Fonction principale de purge
purge_data_directories() {
    local env_config="$1"
    local env_file="env/.env.${env_config}.user"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}🔍 MODE DRY-RUN: Simulation de la purge (aucun fichier ne sera supprimé)${NC}"
    else
        echo -e "${BLUE}🗑️  Purge des fichiers JSON d'embedding et de traitement...${NC}"
    fi
    
    # Vérifier que le fichier d'environnement existe
    if [ ! -f "$env_file" ]; then
        log_error "Fichier d'environnement non trouvé: $env_file"
        log_error "Usage: $0 [playground|local] [--dry-run]"
        exit 1
    fi
    
    # Charger les variables d'environnement
    set -a
    source "$env_file"
    set +a
    
    if [ -z "$EXTERNAL_DATA_SOURCE_PATH" ]; then
        log_error "Variable EXTERNAL_DATA_SOURCE_PATH non définie dans $env_file"
        exit 1
    fi
    
    echo -e "${BLUE}📂 Répertoire source: $EXTERNAL_DATA_SOURCE_PATH${NC}"
    
    # Définir les répertoires cibles
    local embeddings_dir="$EXTERNAL_DATA_SOURCE_PATH/transform/embeddings"
    local processed_dir="$EXTERNAL_DATA_SOURCE_PATH/transform/processed"
    
    # Purger le répertoire embeddings
    if [ -d "$embeddings_dir" ]; then
        if [ "$DRY_RUN" = true ]; then
            log_info "🔍 Analyse du répertoire: $embeddings_dir"
        else
            log_clean "Suppression des fichiers JSON dans $embeddings_dir"
        fi
        
        # Compter les fichiers avant suppression
        local json_count=$(find "$embeddings_dir" -name "*.json" -type f 2>/dev/null | wc -l)
        
        if [ "$json_count" -gt 0 ]; then
            if [ "$DRY_RUN" = true ]; then
                log_warning "$json_count fichiers JSON seraient supprimés dans embeddings/"
                find "$embeddings_dir" -name "*.json" -type f 2>/dev/null | head -5 | while read file; do
                    echo "  📄 $(basename "$file")"
                done
                [ "$json_count" -gt 5 ] && echo "  ... et $((json_count - 5)) autres fichiers"
            else
                find "$embeddings_dir" -name "*.json" -type f -delete 2>/dev/null || true
                log_success "Embeddings purgés ($json_count fichiers JSON supprimés)"
            fi
        else
            log_info "Aucun fichier JSON trouvé dans le répertoire embeddings"
        fi
    else
        log_warning "Répertoire embeddings non trouvé: $embeddings_dir"
    fi
    
    # Purger le répertoire processed
    if [ -d "$processed_dir" ]; then
        if [ "$DRY_RUN" = true ]; then
            log_info "🔍 Analyse du répertoire: $processed_dir"
        else
            log_clean "Suppression des fichiers JSON et LOG dans $processed_dir"
        fi
        
        # Compter les fichiers avant suppression
        local json_count=$(find "$processed_dir" -name "*.json" -type f 2>/dev/null | wc -l)
        local log_count=$(find "$processed_dir" -name "*.log" -type f 2>/dev/null | wc -l)
        
        if [ "$json_count" -gt 0 ] || [ "$log_count" -gt 0 ]; then
            if [ "$DRY_RUN" = true ]; then
                log_warning "$json_count fichiers JSON + $log_count fichiers LOG seraient supprimés dans processed/"
                find "$processed_dir" \( -name "*.json" -o -name "*.log" \) -type f 2>/dev/null | head -5 | while read file; do
                    echo "  📄 $(basename "$file")"
                done
                local total_files=$((json_count + log_count))
                [ "$total_files" -gt 5 ] && echo "  ... et $((total_files - 5)) autres fichiers"
            else
                find "$processed_dir" -name "*.json" -type f -delete 2>/dev/null || true
                find "$processed_dir" -name "*.log" -type f -delete 2>/dev/null || true
                log_success "Fichiers traités purgés ($json_count JSON + $log_count LOG supprimés)"
            fi
        else
            log_info "Aucun fichier JSON/LOG trouvé dans le répertoire processed"
        fi
    else
        log_warning "Répertoire processed non trouvé: $processed_dir"
    fi
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}🔍 Simulation terminée! Relancez sans --dry-run pour effectuer la purge.${NC}"
    else
        echo -e "${GREEN}🎉 Purge des données terminée!${NC}"
    fi
}

# Validation des paramètres
validate_env_config() {
    case "$1" in
        playground|local)
            return 0
            ;;
        *)
            log_error "Environnement invalide: $1"
            log_error "Environnements supportés: playground, local"
            log_error "Usage: $0 [playground|local] [--dry-run]"
            exit 1
            ;;
    esac
}

# Point d'entrée principal
main() {
    # Validation des paramètres
    validate_env_config "$ENV_CONFIG"
    
    # Exécution de la purge
    purge_data_directories "$ENV_CONFIG"
}

# Vérifier si le script est exécuté directement
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
