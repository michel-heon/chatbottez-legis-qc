# Configuration Firefox Simplifiée - Teams Debug

## ✅ Configuration nettoyée

J'ai supprimé toutes les configurations PWA problématiques et gardé une configuration simple et propre.

## 🚀 Configurations disponibles

### F5 dans VS Code :
1. **"Launch Teams Desktop (Firefox)"** - Lance Teams Firefox avec votre agent
2. **"Debug in Teams (Firefox Desktop)"** - Debug complet (Agent + Firefox + Debugger)

### Variables utilisées :
- `${{local:TEAMS_APP_ID}}` ✅ (résolue automatiquement)
- `${account-hint}` ✅ (gestion des comptes M365)

## 🔧 Configuration active

```json
{
    "name": "Launch Teams Desktop (Firefox)",
    "type": "firefox",
    "request": "launch",
    "url": "https://teams.microsoft.com/l/app/${{local:TEAMS_APP_ID}}?installAppPackage=true&webjoin=true&${account-hint}",
    "firefoxExecutable": "/usr/bin/firefox"
}
```

## ✅ État actuel

- **Service Node.js** : ✅ Actif (port 3978, PID 2000129)
- **Debugger** : ✅ Port 9239 prêt
- **Tunnel** : ✅ `https://7f14xk1c-3978.use.devtunnels.ms/`
- **TEAMS_APP_ID** : `e7f924b9-c9c7-4ec2-8850-d0ef63f21f5c`

## 🎯 Test maintenant

1. **F5** dans VS Code
2. Choisir **"Debug in Teams (Firefox Desktop)"**
3. Firefox devrait se lancer avec votre agent Teams

Plus de PWA, plus de profils compliqués - juste Firefox standard avec les bonnes variables ! 🎉
