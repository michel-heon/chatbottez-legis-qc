#!/bin/bash

# Utilitaire d'installation Teams PWA pour développement Microsoft 365 Agents
# Optimisé pour Linux ARM64 dans Parallels Desktop

set -e

SCRIPT_DIR="$(dirname "$0")"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Installation de Microsoft Teams PWA pour développement${NC}"
echo -e "${BLUE}=======================================================${NC}"

# Vérifier les prérequis
echo -e "${YELLOW}📋 Vérification des prérequis...${NC}"

if ! command -v firefox >/dev/null 2>&1; then
    echo -e "${RED}❌ Firefox non trouvé. Installation requise.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Firefox trouvé: $(firefox --version)${NC}"

# Installer les dépendances optionnelles
echo -e "${YELLOW}📦 Installation des dépendances optionnelles...${NC}"

# ImageMagick pour la conversion d'icônes
if ! command -v convert >/dev/null 2>&1 && ! command -v rsvg-convert >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  ImageMagick ou librsvg recommandés pour les icônes${NC}"
    read -p "Installer ImageMagick ? (o/N): " -r
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        sudo apt update && sudo apt install -y imagemagick
    fi
fi

# Configurer le script principal
echo -e "${YELLOW}⚙️  Configuration du script Teams PWA...${NC}"
chmod +x "$SCRIPT_DIR/launch-teams-desktop.sh"

# Créer un raccourci dans le répertoire de scripts système
SYSTEM_SCRIPT="/usr/local/bin/teams-pwa"
if [ -w "/usr/local/bin" ] || sudo -n true 2>/dev/null; then
    echo -e "${YELLOW}🔗 Création du raccourci système...${NC}"
    sudo ln -sf "$SCRIPT_DIR/launch-teams-desktop.sh" "$SYSTEM_SCRIPT" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Impossible de créer le raccourci système (permissions)${NC}"
    }
fi

# Lancer l'installation initiale
echo -e "${YELLOW}🚀 Lancement initial pour configuration...${NC}"
"$SCRIPT_DIR/launch-teams-desktop.sh" &
TEAMS_PID=$!

# Attendre un peu pour que Firefox se lance
sleep 5

echo -e "${GREEN}✅ Installation Teams PWA terminée!${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}📱 Teams PWA est maintenant configuré:${NC}"
echo -e "   • Script: $SCRIPT_DIR/launch-teams-desktop.sh"
echo -e "   • Profil: ~/.teams-desktop-profile"
echo -e "   • Icône: ~/.local/share/icons/hicolor/512x512/apps/teams-pwa.png"
echo -e "   • Application: ~/.local/share/applications/teams-pwa.desktop"

if [ -L "$SYSTEM_SCRIPT" ]; then
    echo -e "   • Commande globale: teams-pwa"
fi

echo -e ""
echo -e "${YELLOW}💡 Instructions pour utiliser Teams PWA:${NC}"
echo -e "1. ${BLUE}Mode développement:${NC} ./scripts/launch-teams-desktop.sh"
echo -e "2. ${BLUE}Mode PWA complet:${NC} ./scripts/launch-teams-desktop.sh --app-mode"
echo -e "3. ${BLUE}Depuis VS Code:${NC} F5 → 'Launch Teams Desktop (Emulated)'"
echo -e "4. ${BLUE}Installation PWA:${NC} Dans Firefox: Menu ≡ → 'Installer cette application'"
echo -e ""
echo -e "${GREEN}🎯 Teams PWA est optimisé pour votre environnement ARM64!${NC}"

# Optionnel: tuer le processus de test
if kill -0 $TEAMS_PID 2>/dev/null; then
    echo -e "${YELLOW}🔄 Fermeture du processus de test...${NC}"
    kill $TEAMS_PID 2>/dev/null || true
    sleep 2
fi
