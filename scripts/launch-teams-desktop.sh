#!/bin/bash

# Script pour lancer Teams Web en tant que Progressive Web App (PWA)
# Optimisé pour l'environnement ARM64 Linux dans Parallels Desktop

set -e

TEAMS_PROFILE_DIR="$HOME/.teams-desktop-profile"
TEAMS_URL="https://teams.microsoft.com/"
TEAMS_APP_DIR="$HOME/.local/share/applications"
TEAMS_ICON_DIR="$HOME/.local/share/icons/hicolor/512x512/apps"

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Lancement de Teams PWA Desktop...${NC}"

# Créer les répertoires nécessaires
mkdir -p "$TEAMS_APP_DIR" "$TEAMS_ICON_DIR" "$(dirname "$TEAMS_PROFILE_DIR")"

# Créer le profil dédié Teams s'il n'existe pas
if [ ! -d "$TEAMS_PROFILE_DIR" ]; then
    echo -e "${YELLOW}📁 Création du profil Teams Desktop PWA...${NC}"
    firefox --no-remote --new-instance --createprofile "teams-desktop $TEAMS_PROFILE_DIR" > /dev/null 2>&1
    
    # Configuration optimisée pour Teams PWA
    cat > "$TEAMS_PROFILE_DIR/user.js" << 'EOF'
// Configuration optimisée pour Teams Desktop PWA
user_pref("browser.tabs.warnOnClose", false);
user_pref("browser.sessionstore.resume_from_crash", false);
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.startup.homepage", "https://teams.microsoft.com/");
user_pref("browser.newtabpage.enabled", false);
user_pref("browser.link.open_newwindow", 3);
user_pref("browser.link.open_newwindow.restriction", 0);

// Optimisations média pour Teams
user_pref("media.autoplay.default", 0);
user_pref("media.autoplay.allow-extension-background-pages", true);
user_pref("media.navigator.permission.disabled", true);
user_pref("media.getusermedia.screensharing.enabled", true);
user_pref("media.getusermedia.browser.enabled", true);

// Permissions Teams
user_pref("permissions.default.camera", 1);
user_pref("permissions.default.microphone", 1);
user_pref("permissions.default.desktop-notification", 1);
user_pref("permissions.default.geo", 0);

// Notifications et PWA
user_pref("dom.webnotifications.enabled", true);
user_pref("dom.webnotifications.serviceworker.enabled", true);
user_pref("dom.serviceWorkers.enabled", true);
user_pref("browser.web.manifest.enabled", true);

// Sécurité adaptée pour Teams
user_pref("security.tls.insecure_fallback_hosts", "localhost,*.microsoft.com,*.microsoftonline.com");
user_pref("network.websocket.allowInsecureFromHTTPS", true);
user_pref("network.cookie.sameSite.laxByDefault", false);

// Interface PWA
user_pref("browser.tabs.drawInTitlebar", true);
user_pref("browser.toolbars.bookmarks.visibility", "never");
user_pref("browser.uidensity", 1);

// Performance
user_pref("layers.acceleration.force-enabled", true);
user_pref("webgl.force-enabled", true);
user_pref("gfx.webrender.all", true);
EOF

    echo -e "${GREEN}✅ Profil Teams PWA créé avec succès!${NC}"
fi

# Télécharger l'icône Teams si elle n'existe pas
if [ ! -f "$TEAMS_ICON_DIR/teams-pwa.png" ]; then
    echo -e "${YELLOW}🎨 Téléchargement de l'icône Teams...${NC}"
    mkdir -p "$TEAMS_ICON_DIR"
    
    # Créer une icône Teams basique en SVG puis la convertir
    cat > /tmp/teams-icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#464EB8"/>
<path fill="white" d="M208 192c-17.7 0-32 14.3-32 32v128c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32h-96zm208 64c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm0 64c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32z"/>
<text x="256" y="440" text-anchor="middle" fill="white" font-size="48" font-family="Arial, sans-serif" font-weight="bold">TEAMS</text>
</svg>
EOF
    
    # Convertir SVG en PNG si possible, sinon utiliser une icône par défaut
    if command -v convert >/dev/null 2>&1; then
        convert /tmp/teams-icon.svg "$TEAMS_ICON_DIR/teams-pwa.png" 2>/dev/null
    elif command -v rsvg-convert >/dev/null 2>&1; then
        rsvg-convert -w 512 -h 512 /tmp/teams-icon.svg -o "$TEAMS_ICON_DIR/teams-pwa.png" 2>/dev/null
    else
        # Copier une icône Firefox par défaut comme fallback
        cp /snap/firefox/current/usr/lib/firefox/browser/chrome/icons/default/default128.png "$TEAMS_ICON_DIR/teams-pwa.png" 2>/dev/null || touch "$TEAMS_ICON_DIR/teams-pwa.png"
    fi
    
    rm -f /tmp/teams-icon.svg
fi

# Créer le fichier .desktop pour intégration système
cat > "$TEAMS_APP_DIR/teams-pwa.desktop" << EOF
[Desktop Entry]
Version=1.0
Name=Microsoft Teams (PWA)
Comment=Microsoft Teams Progressive Web App
Exec=$0 --app-mode
Icon=teams-pwa
Terminal=false
Type=Application
Categories=Network;InstantMessaging;VideoConference;
MimeType=x-scheme-handler/msteams;
StartupWMClass=teams-pwa
StartupNotify=true
EOF

# Mettre à jour la base de données des applications
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$TEAMS_APP_DIR" 2>/dev/null || true
fi

# Mode de lancement
if [ "$1" = "--app-mode" ]; then
    # Mode PWA complet (sans interface navigateur)
    echo -e "${GREEN}🎯 Lancement en mode PWA...${NC}"
    exec firefox --no-remote --new-instance \
        --profile "$TEAMS_PROFILE_DIR" \
        --new-window "$TEAMS_URL" \
        --class="teams-pwa" \
        --name="Microsoft Teams" \
        --kiosk >/dev/null 2>&1 &
else
    # Mode développement avec debugging
    echo -e "${BLUE}🔧 Lancement en mode développement avec debugging...${NC}"
    firefox --no-remote --new-instance \
        --profile "$TEAMS_PROFILE_DIR" \
        --new-window "$TEAMS_URL" \
        --class="teams-pwa" \
        --name="Microsoft Teams" \
        --devtools &
    
    FIREFOX_PID=$!
    echo -e "${GREEN}✅ Teams PWA lancé! PID: $FIREFOX_PID${NC}"
    echo -e "${YELLOW}💡 Pour installer comme PWA: Menu ≡ > Installer cette application${NC}"
    echo -e "${BLUE}🔗 URL: $TEAMS_URL${NC}"
fi

echo -e "${GREEN}🎉 Teams Desktop PWA prêt!${NC}"
