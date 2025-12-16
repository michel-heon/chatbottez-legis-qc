# Guide de Debug - "Something went wrong" dans Teams

## ✅ Corrections apportées

1. **Configuration de lancement Firefox corrigée** dans `.vscode/launch.json`
2. **URL directe de l'agent** : `e7f924b9-c9c7-4ec2-8850-d0ef63f21f5c`
3. **Nouvelle configuration** : "Debug Agent in Teams (Firefox PWA)"
4. **Tâche spécialisée** : "Launch Teams Debug Agent (Firefox)"

## 🔍 Diagnostic de l'erreur "Something went wrong"

### Étapes de vérification :

1. **Service en marche** ✅
   - Port 3978 actif
   - Debugger sur 9239
   - Tunnel : `https://bsdzs82p-3978.use.devtunnels.ms/`

2. **Variables d'environnement**
   ```bash
   BOT_ID=627401f5-0ed5-4f12-8557-0c8e7cf0a5a0
   TEAMS_APP_ID=e7f924b9-c9c7-4ec2-8850-d0ef63f21f5c
   ```

3. **URL de test directe** :
   ```
   https://teams.microsoft.com/l/app/e7f924b9-c9c7-4ec2-8850-d0ef63f21f5c?installAppPackage=true&webjoin=true
   ```

## 🚀 Nouvelles options de lancement

### F5 dans VS Code :
- **"Debug Agent in Teams (Firefox PWA)"** - Lance Firefox avec profil dédié
- **"Debug in Teams (PWA Desktop)"** - Debug complet (Agent + Firefox + Debugger)

### Ligne de commande :
```bash
# Lancement direct Firefox avec profil PWA
firefox --profile=/home/parallels/.teams-desktop-profile "https://teams.microsoft.com/l/app/e7f924b9-c9c7-4ec2-8850-d0ef63f21f5c?installAppPackage=true&webjoin=true"
```

## 🛠️ Causes possibles de "Something went wrong"

1. **Manifest non provisionné** - Relancer provision
2. **Permissions manquantes** - Vérifier autorisations Microsoft 365
3. **Tunnel invalide** - Vérifier BOT_ENDPOINT dans .env.local
4. **Erreur Azure AI** - Vérifier clés API dans .env.local.user

## 📋 Prochaines étapes

1. Tester la nouvelle configuration "Debug Agent in Teams (Firefox PWA)"
2. Vérifier les logs dans la console Firefox (F12)
3. Contrôler les logs du service Node.js dans le terminal VS Code
4. Vérifier l'état de provisioning avec `teamsfx provision --env local`
