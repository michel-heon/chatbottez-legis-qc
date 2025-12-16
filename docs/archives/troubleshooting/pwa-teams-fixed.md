# Configuration PWA Teams - Mode de Lancement Fixé

## ✅ Problème résolu

La configuration "Launch Teams Desktop (PWA)" a été corrigée pour lancer Teams dans **Firefox en mode PWA** au lieu de Chrome.

## 🚀 Utilisation

### Dans VS Code (F5)
1. **"Launch Teams Desktop (PWA)"** - Lance Teams en mode app standalone
2. **"Launch Teams Desktop (Dev Mode)"** - Lance Teams avec les outils de développement
3. **"Debug in Teams (PWA Desktop)"** - Lance votre agent + Teams PWA avec débogage

### En ligne de commande
```bash
# Mode PWA (recommandé)
firefox --app=https://teams.microsoft.com/ --profile=/home/parallels/.teams-desktop-profile

# Mode développement avec votre agent
firefox --profile=/home/parallels/.teams-desktop-profile "https://teams.microsoft.com/l/app/YOUR_APP_ID?installAppPackage=true"
```

## ⚙️ Configuration

### Profil Firefox dédié
- **Emplacement** : `~/.teams-desktop-profile`
- **CSS personnalisé** : Interface optimisée PWA (barre d'adresse masquée)
- **Préférences** : Notifications activées, lecture automatique

### Fichiers modifiés
- `.vscode/launch.json` - Configurations de lancement corrigées
- `~/.teams-desktop-profile/chrome/userChrome.css` - Style PWA
- `~/.teams-desktop-profile/user.js` - Préférences Firefox

## 🐛 Résolution de problème

Si Teams s'ouvre encore dans Chrome :
1. Fermez tous les navigateurs
2. Relancez VS Code
3. Utilisez F5 → "Launch Teams Desktop (PWA)"

## 🎯 Avantages

- ✅ Interface native PWA (pas de barre d'adresse)
- ✅ Compatible ARM64 Linux (Parallels Desktop)
- ✅ Profil dédié séparé
- ✅ Intégration VS Code complète
- ✅ Support notifications et média
