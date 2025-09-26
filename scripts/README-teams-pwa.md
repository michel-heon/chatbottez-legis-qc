# Microsoft Teams PWA pour développement Microsoft 365 Agents

Cette solution implémente Microsoft Teams comme Progressive Web App (PWA) optimisée pour l'environnement Linux ARM64 dans Parallels Desktop.

## 🎯 Pourquoi cette solution ?

- **Compatible ARM64** : Fonctionne nativement sur votre architecture
- **Pas d'émulation lourde** : Utilise Firefox natif au lieu d'émulation x86_64
- **Intégration système** : Behave comme une application desktop native
- **Optimisée pour le développement** : Debugging et DevTools disponibles

## 🚀 Installation

### Installation automatique :
```bash
./scripts/install-teams-pwa.sh
```

### Installation manuelle :
```bash
chmod +x ./scripts/launch-teams-desktop.sh
./scripts/launch-teams-desktop.sh
```

## 📱 Modes d'utilisation

### 1. Mode PWA (Recommandé pour production)
```bash
./scripts/launch-teams-desktop.sh --app-mode
```
- Interface épurée sans barre d'outils
- Mode plein écran
- Performance optimisée

### 2. Mode développement
```bash
./scripts/launch-teams-desktop.sh
```
- DevTools disponibles
- Console de debugging
- Interface Firefox complète

## 🔧 Intégration VS Code

### Via F5 (Debug) :
1. Appuyez sur **F5**
2. Sélectionnez une de ces options :
   - `"Debug in Teams (PWA Desktop)"` - Avec debugging complet
   - `"Launch Teams Desktop (PWA)"` - Mode PWA pur
   - `"Launch Teams Desktop (Dev Mode)"` - Mode développement

### Via palette de commandes :
1. **Ctrl+Shift+P**
2. `"Tasks: Run Task"`
3. Sélectionnez :
   - `"Launch Teams Desktop (PWA)"` - Lancement rapide
   - `"Install Teams PWA"` - Installation/configuration

## 📁 Structure des fichiers

```
scripts/
├── launch-teams-desktop.sh    # Script principal PWA
├── install-teams-pwa.sh       # Utilitaire d'installation
└── README-teams-pwa.md        # Cette documentation

~/.teams-desktop-profile/       # Profil Firefox dédié
├── user.js                     # Configuration optimisée
└── ...                         # Données de profil

~/.local/share/applications/
└── teams-pwa.desktop           # Intégration système Linux

~/.local/share/icons/hicolor/512x512/apps/
└── teams-pwa.png              # Icône Teams
```

## ⚙️ Configuration avancée

### Personnaliser les préférences Firefox :
Éditez `~/.teams-desktop-profile/user.js` :

```javascript
// Exemple : désactiver les notifications
user_pref("dom.webnotifications.enabled", false);

// Exemple : forcer la qualité vidéo
user_pref("media.getusermedia.camera.default_quality", "hd");
```

### Variables d'environnement :
```bash
export TEAMS_PROFILE_DIR="$HOME/.teams-custom-profile"
export TEAMS_URL="https://teams.microsoft.com/custom-path"
```

## 🐛 Dépannage

### Teams ne se lance pas :
```bash
# Vérifier Firefox
firefox --version

# Recréer le profil
rm -rf ~/.teams-desktop-profile
./scripts/launch-teams-desktop.sh
```

### Pas de son/vidéo :
```bash
# Vérifier les permissions media
sudo usermod -a -G audio,video $USER
# Puis redémarrer la session
```

### Problèmes de performance :
```bash
# Activer l'accélération hardware
echo 'user_pref("gfx.webrender.all", true);' >> ~/.teams-desktop-profile/user.js
```

## 🔗 Commandes utiles

```bash
# Lancement rapide PWA
teams-pwa  # Si installé globalement

# Vérifier le processus
ps aux | grep teams-pwa

# Nettoyer le cache
rm -rf ~/.teams-desktop-profile/storage

# Mise à jour du script
git pull && chmod +x scripts/*.sh
```

## 🌟 Avantages par rapport aux alternatives

| Solution | Avantages | Inconvénients |
|----------|-----------|---------------|
| **Teams PWA** | ✅ Natif ARM64<br>✅ Performance optimale<br>✅ Intégration VS Code<br>✅ Debugging disponible | ⚠️ Interface web |
| Teams Snap | ❌ Problèmes sandboxing<br>❌ Permissions limitées | ✅ Installation facile |
| Box64 Emulation | ✅ Teams Desktop natif | ❌ Performance réduite<br>❌ Complexité d'installation |
| Wine | ✅ Applications Windows | ❌ Stabilité variable<br>❌ Dépendances multiples |

## 📚 Ressources

- [Firefox PWA Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Microsoft Teams Web API](https://docs.microsoft.com/en-us/microsoftteams/platform/)
- [Microsoft 365 Agents Toolkit](https://docs.microsoft.com/en-us/microsoftteams/platform/toolkit/)

## 🤝 Contribution

Pour améliorer cette solution :
1. Testez sur votre environnement
2. Signalez les bugs via Issues
3. Proposez des améliorations via Pull Requests

---

*Solution optimisée pour Linux ARM64 dans Parallels Desktop avec Microsoft 365 Agents Toolkit v1.1.0*
