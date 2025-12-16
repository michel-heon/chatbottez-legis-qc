## 🚀 Microsoft Teams PWA - Guide de démarrage rapide

**Solution implémentée avec succès !** ✅

### 📱 **3 façons de lancer Teams PWA :**

#### 1. **Via VS Code (F5)** - Recommandé pour le développement
```
1. Appuyez sur F5
2. Choisissez: "Launch Teams Desktop (PWA)"
```

#### 2. **Via le terminal** - Commande directe
```bash
# Mode PWA complet (sans interface Firefox)
./scripts/launch-teams-desktop.sh --app-mode

# Mode développement (avec DevTools)
./scripts/launch-teams-desktop.sh
```

#### 3. **Via la commande globale** - Si installée
```bash
teams-pwa
```

### 🎯 **Avantages de cette solution :**
- ✅ **Compatible ARM64** - Natif sur votre architecture
- ✅ **Performance optimale** - Pas d'émulation lourde  
- ✅ **Intégration VS Code** - Debugging disponible
- ✅ **Profil dédié** - Configuration optimisée pour Teams
- ✅ **Mode PWA** - Comportement comme application native

### 🔧 **Fonctionnalités activées :**
- **Caméra/Microphone** : Permissions automatiques
- **Notifications** : Support complet 
- **Service Workers** : Pour fonctionnalités PWA
- **WebRTC** : Pour appels vidéo
- **Accélération hardware** : Performance optimisée

### 📁 **Fichiers créés :**
- `~/.teams-desktop-profile/` - Profil Firefox optimisé
- `~/.local/share/applications/teams-pwa.desktop` - Intégration système
- `scripts/launch-teams-desktop.sh` - Script principal PWA
- `scripts/install-teams-pwa.sh` - Utilitaire installation

### 💡 **Prochaines étapes :**
1. **Testez maintenant** : `./scripts/launch-teams-desktop.sh`
2. **Développement** : Utilisez F5 → "Launch Teams Desktop (PWA)"
3. **Installation PWA** : Dans Teams, Menu ≡ → "Installer cette application"

### 🐛 **Si problème :**
```bash
# Recréer le profil
rm -rf ~/.teams-desktop-profile
./scripts/launch-teams-desktop.sh

# Vérifier Firefox
firefox --version
```

---
*Teams PWA optimisé pour Linux ARM64 dans Parallels Desktop*
